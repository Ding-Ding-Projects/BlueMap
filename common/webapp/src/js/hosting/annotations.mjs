/** Same-origin hosted viewer protocol. No credentials or annotations are persisted in browser storage. */
export const SHARED_SET = 'worldlens:shared';
export const clone = value => JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const identityFields = ['projectId', 'mapId', 'dimension'];
export function hostingConfig(value) {
  if (!object(value) || !identityFields.every(key => typeof value[key] === 'string' && value[key].length > 0 && value[key].length <= 512 && ![...value[key]].some(c => c.charCodeAt(0) < 32))) throw new Error('configuration');
  // A deployment may configure this exact relative route, never an external credential destination.
  if (value.apiPath !== undefined && value.apiPath !== '/bridge/annotations') throw new Error('configuration');
  return Object.fromEntries(identityFields.map(key => [key, value[key]]));
}
const validPosition = p => object(p) && [p.x,p.y,p.z].every(Number.isFinite) && Math.abs(p.x)<=30000000 && Math.abs(p.z)<=30000000 && p.y>=-2048 && p.y<=2048;
/** Component inputs may emit numeric strings; empty values remain invalid. */
export function markerFromForm(form) {
  const marker=clone(form);
  const number=value=>typeof value==='string'&&!value.trim()?NaN:Number(value);
  const position=p=>({x:number(p.x),y:number(p.y),z:number(p.z)});
  marker.position=position(marker.position);
  if(marker.kind==='poi') delete marker.points;
  else marker.points=marker.points.map(position);
  if(marker.kind==='extrude') {
    marker.extra.shapeMinY=number(marker.extra.shapeMinY);
    marker.extra.shapeMaxY=number(marker.extra.shapeMaxY);
  }
  return marker;
}
export function validMarker(m, mapId) {
  if (!object(m) || typeof m.id !== 'string' || !m.id || m.id.length>200 || m.mapId!==mapId || typeof m.label!=='string' || !m.label.trim() || m.label.length>160 || typeof m.detail!=='string' || m.detail.length>4000 || !validPosition(m.position) || !/^#[0-9a-f]{6}$/i.test(m.colour) || typeof m.visible!=='boolean' || typeof m.createdAt!=='string' || typeof m.updatedAt!=='string') return false;
  if(m.extra!==undefined&&!object(m.extra))return false;
  if(m.sorting!==undefined&&!Number.isFinite(m.sorting))return false;
  const kind=m.kind??'poi';
  if (!['poi','line','shape','extrude'].includes(kind)) return false;
  if(kind!=='poi') {
    if(!Array.isArray(m.points)||m.points.length<(kind==='line'?2:3)||m.points.length>128||!m.points.every(validPosition)) return false;
    if(kind!=='line' && m.points.reduce((sum,p,i)=>{const q=m.points[(i+1)%m.points.length]; return sum+p.x*q.z-q.x*p.z;},0)===0) return false;
    if(kind==='extrude') {
      const min=m.extra?.shapeMinY??Math.min(...m.points.map(p=>p.y),m.position.y);
      const max=m.extra?.shapeMaxY??Math.max(...m.points.map(p=>p.y),m.position.y);
      if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min||min< -2048||max>2048) return false;
    }
  }
  return true;
}
export function documentFor(value, identity) {
  if(!object(value)||value.version!==1||!object(value.identity)||!identityFields.every(k=>value.identity[k]===identity[k])||!Number.isSafeInteger(value.revision)||value.revision<0||typeof value.updatedAt!=='string'||typeof value.updatedBy!=='string'||!Array.isArray(value.annotations)||value.annotations.length>500||!value.annotations.every(m=>validMarker(m,identity.mapId))||new Set(value.annotations.map(m=>m.id)).size!==value.annotations.length) throw new Error('invalidResponse');
  return clone(value);
}
export function client(identity, transport=fetch) {
  const url='/bridge/annotations?'+new URLSearchParams(identity);
  async function request(path, options={}) {
    const response=await transport(path,{...options,credentials:'same-origin',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!response.ok) {
      const error=new Error(response.status===401?'signInRequired':response.status===403?'readOnly':response.status===409?'conflict':'unavailable');
      if(response.status===409) error.current=documentFor((await response.json()).current,identity);
      throw error;
    }
    return response.json();
  }
  return {
    session:()=>request('/bridge/managed-session'),
    signIn:(username,password)=>request('/bridge/managed-session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,password})}),
    read:async()=>documentFor(await request(url),identity),
    save:async(expectedRevision,annotations)=>{
      documentFor({version:1,identity,revision:expectedRevision,updatedAt:'',updatedBy:'',annotations},identity);
      return documentFor(await request(url,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({expectedRevision,annotations})}),identity);
    }
  };
}
/** Three-way merge keeps unrelated concurrent edits. Each competing marker requires an explicit choice. */
export function mergeAnnotations(base, local, remote, choices={}) {
  const maps=[base,local,remote].map(list=>new Map(list.map(m=>[m.id,m])));
  const result=[], conflicts=[];
  for(const id of new Set([...maps[0].keys(),...maps[1].keys(),...maps[2].keys()])) {
    const [b,l,r]=maps.map(m=>m.get(id)); const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    let chosen;
    if(equal(l,r)||equal(b,r)) chosen=l;
    else if(equal(b,l)) chosen=r;
    else { conflicts.push({id,local:l,remote:r}); chosen=choices[id]==='local'?l:r; }
    if(chosen) result.push(clone(chosen));
  }
  return {annotations:result,conflicts,unresolved:conflicts.filter(c=>!['local','remote'].includes(choices[c.id]))};
}
const escapeText = text => text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Explicit allowlist: shared content never supplies HTML, URLs, classes, or executable fields. */
export function viewerMarker(m) {
  const rgb={r:parseInt(m.colour.slice(1,3),16),g:parseInt(m.colour.slice(3,5),16),b:parseInt(m.colour.slice(5,7),16)};
  const data={type:m.kind??'poi',position:{...m.position},label:escapeText(m.label),detail:escapeText(m.detail||m.label),classes:[],listed:true,sorting:m.sorting??0,lineColor:{...rgb,a:1},borderColor:{...rgb,a:1},fillColor:{...rgb,a:0.28},depthTest:false};
  if(data.type==='line') data.line=m.points.map(p=>({...p}));
  if(['shape','extrude'].includes(data.type)) {
    data.shape=m.points.map(({x,z})=>({x,z})); data.shapeY=m.position.y;
    if(data.type==='extrude') { data.shapeMinY=m.extra?.shapeMinY??Math.min(...m.points.map(p=>p.y),m.position.y);data.shapeMaxY=m.extra?.shapeMaxY??Math.max(...m.points.map(p=>p.y),m.position.y); }
  }
  return data;
}
