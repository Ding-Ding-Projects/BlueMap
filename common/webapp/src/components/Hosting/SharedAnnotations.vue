<template>
  <section class="shared-annotations" :aria-label="t('title')" @keydown.stop @keyup.stop @pointerdown.stop @wheel.stop>
    <VAlert v-if="message" variant="tonal" role="status" aria-live="polite">{{ t(message) }}</VAlert>
    <template v-if="identity">
      <p>{{ identity.mapId }} · {{ identity.dimension }}</p><p>{{ t('recovery') }}</p>
      <VAlert v-if="!matchingMap">{{ t('wrongMap') }}</VAlert>
      <form v-if="!signedIn" @submit.prevent="signIn">
        <VTextField v-model="username" :label="t('username')" autocomplete="username" :disabled="busy" maxlength="160" />
        <VTextField v-model="password" :label="t('password')" type="password" autocomplete="current-password" :disabled="busy" maxlength="1000" />
        <VBtn type="submit" :disabled="busy || !username || !password">{{ t('signIn') }}</VBtn>
      </form>
      <div class="shared-actions">
        <VBtn :disabled="busy" @click="checkSession">{{ t('recheck') }}</VBtn>
        <VBtn :disabled="busy || !signedIn || dirty || formDirty" @click="load">{{ t('refresh') }}</VBtn>
        <VBtn :disabled="busy || !signedIn || !base || !dirty || !!current || formDirty || !matchingMap || readOnly" @click="save">{{ t('save') }}</VBtn>
        <VBtn :disabled="!base" @click="download">{{ t('export') }}</VBtn>
      </div>
      <p v-if="busy" role="status">{{ t('busy') }}</p>
      <template v-if="base">
        <p>{{ t('revision') }}: {{ base.revision }} · {{ t('count') }}: {{ draft.length }} <strong v-if="dirty">· {{ t('draft') }}</strong></p>
        <template v-if="current">
          <VAlert type="warning">{{ t('conflict') }} ({{ t('revision') }} {{ current.revision }})</VAlert>
          <VCard v-for="entry in mergeResult.conflicts" :key="entry.id" variant="outlined" class="conflict-card"><VCardText>
            <p>{{ t('mine') }}: {{ entry.local?.label || t('deleted') }}</p><pre>{{ summary(entry.local) }}</pre>
            <p>{{ t('latest') }}: {{ entry.remote?.label || t('deleted') }}</p><pre>{{ summary(entry.remote) }}</pre>
            <VRadioGroup v-model="choices[entry.id]" :label="entry.local?.label || entry.remote?.label || entry.id"><VRadio :label="t('local')" value="local" /><VRadio :label="t('remote')" value="remote" /></VRadioGroup>
          </VCardText></VCard>
          <VBtn :disabled="busy || mergeResult.unresolved.length>0 || formDirty" @click="merge">{{ t('merge') }}</VBtn>
        </template>
        <VList :aria-label="t('choose')"><VListItem v-for="marker in draft" :key="marker.id" :title="marker.label" :subtitle="t(marker.kind || 'poi')" :active="selected===marker.id" @click="select(marker)" /></VList>
        <p v-if="!draft.length">{{ t('empty') }}</p>
        <VBtn :disabled="busy || formDirty || draft.length>=500 || !matchingMap || readOnly" @click="create">{{ t('add') }}</VBtn>
        <form v-if="form" @submit.prevent="apply">
          <fieldset :disabled="busy || !matchingMap || readOnly || !signedIn"><legend>{{ t('position') }}</legend>
            <VTextField v-model="form.label" :label="t('label')" maxlength="160" /><VTextarea v-model="form.detail" :label="t('detail')" maxlength="4000" />
            <VSelect v-model="form.kind" :label="t('kind')" :items="kinds" />
            <div class="coordinate-row"><VTextField v-for="axis in axes" :key="axis" v-model.number="form.position[axis]" type="number" :label="axis.toUpperCase()" /></div>
            <VTextField v-model="form.colour" :label="t('colour')" maxlength="7" /><VSwitch v-model="form.visible" :label="t('visible')" />
            <template v-if="form.kind!=='poi'"><h3>{{ t('points') }}</h3>
              <div v-for="(point,index) in form.points" :key="index" class="geometry-row"><div class="coordinate-row"><VTextField v-for="axis in axes" :key="axis" v-model.number="point[axis]" type="number" :label="`${index+1} ${axis.toUpperCase()}`" /></div><VBtn :aria-label="`${t('removePoint')} ${index+1}`" @click="form.points.splice(index,1)">{{ t('removePoint') }}</VBtn></div>
              <VBtn :disabled="form.points.length>=128" @click="form.points.push({...form.position})">{{ t('addPoint') }}</VBtn>
            </template>
            <template v-if="form.kind==='extrude'"><VTextField v-model.number="form.extra.shapeMinY" type="number" :label="t('minY')" /><VTextField v-model.number="form.extra.shapeMaxY" type="number" :label="t('maxY')" /></template>
            <div class="shared-actions"><VBtn type="submit">{{ t('apply') }}</VBtn><VBtn @click="showPosition">{{ t('view') }}</VBtn><VBtn v-if="selected" @click="removing=true">{{ t('remove') }}</VBtn></div>
          </fieldset><VBtn :disabled="busy" @click="clearForm">{{ t('cancel') }}</VBtn>
        </form>
        <VAlert v-if="removing" type="warning"><p>{{ form?.label }}</p><VBtn :disabled="busy || readOnly || !signedIn" @click="remove">{{ t('confirmRemove') }}</VBtn><VBtn @click="removing=false">{{ t('keep') }}</VBtn></VAlert>
      </template>
    </template>
  </section>
</template>
<script>
import { VAlert,VBtn,VTextField,VTextarea,VSelect,VSwitch,VList,VListItem,VCard,VCardText,VRadioGroup,VRadio } from 'vuetify/components';
import { markRaw } from 'vue';
import { MarkerSet } from '../../js/markers/MarkerSet';
import { hostingConfig,client,clone,markerFromForm,validMarker,mergeAnnotations,viewerMarker,SHARED_SET } from '../../js/hosting/annotations.mjs';
import { hostingText } from './messages.mjs';
export default {
  components:{VAlert,VBtn,VTextField,VTextarea,VSelect,VSwitch,VList,VListItem,VCard,VCardText,VRadioGroup,VRadio},
  data(){return {identity:null,api:null,message:'',busy:false,signedIn:false,readOnly:false,username:'',password:'',base:null,draft:[],current:null,choices:Object.create(null),form:null,original:'',selected:null,removing:false,layer:null,axes:['x','y','z'],viewer:this.$bluemap.mapViewer.data};},
  computed:{
    matchingMap(){return this.viewer.map?.id===this.identity?.mapId;},
    dirty(){return !!this.base && JSON.stringify(this.draft)!==JSON.stringify(this.base.annotations);},
    formDirty(){return !!this.form && JSON.stringify(this.form)!==this.original;},
    kinds(){return ['poi','line','shape','extrude'].map(value=>({value,title:this.t(value)}));},
    mergeResult(){return this.current?mergeAnnotations(this.base.annotations,this.draft,this.current.annotations,this.choices):{conflicts:[],unresolved:[]};},
  },
  watch:{draft:{handler(){this.renderMarkers();},deep:true},matchingMap(){this.renderMarkers();}},
  async mounted(){
    this.onLeave=event=>{if(this.dirty||this.formDirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',this.onLeave);
    try{const response=await fetch(new URL('worldlens-hosting.json',document.baseURI),{credentials:'same-origin',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
      if(response.status===404){this.message='standalone';return;}if(!response.ok)throw new Error('unavailable');
      this.identity=hostingConfig(await response.json());this.api=markRaw(client(this.identity));this.layer=markRaw(new MarkerSet(SHARED_SET));this.$bluemap.mapViewer.markers.add(this.layer);await this.checkSession();
    }catch(error){this.report(error);}
  },
  beforeUnmount(){window.removeEventListener('beforeunload',this.onLeave);if(this.layer)this.$bluemap.mapViewer.markers.remove(this.layer);this.password='';},
  methods:{
    t(key){return hostingText(this.$i18n.locale,key);},
    report(error){const keys=['configuration','unavailable','invalidResponse','signInRequired','readOnly','conflict'];this.message=keys.includes(error.message)?error.message:'unavailable';if(error.message==='signInRequired'){this.signedIn=false;this.renderMarkers();}if(error.message==='readOnly')this.readOnly=true;},
    async checkSession(){if(this.busy)return;this.busy=true;try{const state=await this.api.session();this.signedIn=state.signedIn===true;this.readOnly=false;if(!this.signedIn)this.message='signInRequired';else if(!this.base){this.base=await this.api.read();this.draft=clone(this.base.annotations);this.message='loaded';}this.renderMarkers();}catch(error){this.report(error);}finally{this.busy=false;}},
    async signIn(){if(this.busy)return;this.busy=true;try{await this.api.signIn(this.username,this.password);this.signedIn=true;this.readOnly=false;if(!this.base){this.base=await this.api.read();this.draft=clone(this.base.annotations);}this.message='loaded';this.renderMarkers();}catch(error){this.report(error);}finally{this.password='';this.busy=false;}},
    async load(){if(this.busy||this.dirty||this.formDirty)return;this.busy=true;try{this.base=await this.api.read();this.draft=clone(this.base.annotations);this.current=null;this.clearForm();this.message='loaded';}catch(error){this.report(error);}finally{this.busy=false;}},
    async save(){if(this.busy||this.current||this.formDirty||!this.matchingMap||this.readOnly||!this.signedIn)return;this.busy=true;try{this.base=await this.api.save(this.base.revision,this.draft);this.draft=clone(this.base.annotations);this.message='saved';}catch(error){if(error.current){this.current=error.current;this.choices=Object.create(null);}this.report(error);}finally{this.busy=false;}},
    merge(){if(this.mergeResult.unresolved.length)return;const merged=this.mergeResult.annotations;this.base=this.current;this.draft=merged;this.current=null;this.choices=Object.create(null);this.clearForm();this.message='draft';},
    select(marker){if(this.formDirty){this.message='formPending';return;}this.selected=marker.id;this.form=clone(marker);this.form.kind??='poi';this.form.points??=[];this.form.extra??={};this.original=JSON.stringify(this.form);this.removing=false;},
    create(){if(this.formDirty)return;this.selected=null;const position=this.$bluemap.mapViewer.controlsManager.position;this.form={id:crypto.randomUUID(),mapId:this.identity.mapId,label:'',detail:'',kind:'poi',position:{x:Math.round(position.x),y:64,z:Math.round(position.z)},colour:'#4f8cff',visible:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),points:[],extra:{shapeMinY:64,shapeMaxY:80}};this.original='';},
    apply(){if(this.busy||!this.signedIn||this.readOnly||!this.matchingMap)return;const marker=markerFromForm(this.form);marker.label=marker.label.trim();if(marker.kind==='poi')delete marker.points;marker.updatedAt=new Date().toISOString();if(!validMarker(marker,this.identity.mapId)){this.message='invalidMarker';return;}const index=this.draft.findIndex(m=>m.id===marker.id);if(index<0)this.draft.push(marker);else this.draft.splice(index,1,marker);this.clearForm();this.message='draft';},
    clearForm(){this.form=null;this.original='';this.selected=null;this.removing=false;},
    remove(){if(this.busy||!this.signedIn||this.readOnly||!this.matchingMap)return;this.draft=this.draft.filter(m=>m.id!==this.selected);this.clearForm();this.message='draft';},
    showPosition(){if(!this.form)return;const marker=markerFromForm(this.form);if(!validMarker({...marker,label:marker.label||'Position'},this.identity.mapId))return;this.$bluemap.mapViewer.controlsManager.position.set(marker.position.x,marker.position.y,marker.position.z);this.$bluemap.mapViewer.redraw();},
    renderMarkers(){if(!this.layer)return;const markers=Object.create(null);if(this.matchingMap&&this.signedIn)for(const marker of this.draft)if(marker.visible)markers[marker.id]=viewerMarker(marker);this.layer.updateFromData({label:this.t('title'),toggleable:true,markers});this.$bluemap.mapViewer.redraw();},
    summary(marker){return marker?JSON.stringify({label:marker.label,detail:marker.detail,kind:marker.kind,position:marker.position,points:marker.points,colour:marker.colour,visible:marker.visible,extra:marker.extra},null,2):this.t('deleted');},
    download(){const blob=new Blob([JSON.stringify({marker:'worldlens-marker-studio',version:1,mapId:this.identity.mapId,markers:this.draft},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='shared-annotation-draft.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
  }
};
</script>
<style scoped>
.shared-annotations {pointer-events:auto;padding:12px;overflow-wrap:anywhere;min-width:0;}
.shared-actions {display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}
.shared-annotations .v-btn {white-space:normal;height:auto;min-height:48px;max-width:100%;}
.coordinate-row {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}
fieldset {border:0;padding:0;min-width:0;}
.geometry-row,.conflict-card {margin-block:12px;}
pre {white-space:pre-wrap;overflow-wrap:anywhere;max-height:16rem;overflow:auto;}
@media(max-width:380px){.coordinate-row {grid-template-columns:1fr;}}
</style>
