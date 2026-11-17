/**
 * Optional server-provided layers. The viewer reads `custom-layers.json` from beside its entry page,
 * validates it strictly and draws each layer as its own marker set. All text is escaped before it
 * reaches the page; the file can never supply HTML, links, scripts, icon URLs or style classes.
 */
export const CUSTOM_LAYERS_SET = 'bm-custom-layers';
export const LAYERS_FILE = 'custom-layers.json';
export const MAX_LAYERS = 64;
export const MAX_FEATURES = 5000;
export const MAX_POINTS = 512;
export const MAX_QUERY = 200;
export const MAX_RESULTS = 200;
export const DEFAULT_COLOUR = '#3f8ae0';
export const ID_PATTERN = /^[a-z0-9_-]{1,64}$/;
export const COLOUR_PATTERN = /^#[0-9a-f]{6}$/i;
export const FEATURE_TYPES = ['point', 'line', 'area'];
export const LABEL_MODES = ['always', 'hover', 'never'];
export const ICON_SIZES = ['small', 'medium', 'large'];
export const SIZE_PIXELS = Object.freeze({ small: 20, medium: 28, large: 40 });
export const FLAG_CHARS = ['i', 'm', 's', 'u'];

/** Original 24x24 glyphs drawn with the even-odd rule. */
export const ICON_PATHS = Object.freeze({
  pin: 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  star: 'M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z',
  home: 'M12 3L2 12h3v8h5v-5h4v5h5v-8h3z',
  shop: 'M4 4h16l2 6a3 3 0 0 1-5 1.5 3 3 0 0 1-5 0 3 3 0 0 1-5 0A3 3 0 0 1 2 10zM5 13h14v7H5z',
  train: 'M12 2C7 2 4 3 4 7v9a3 3 0 0 0 3 3l-2 3h2l1.5-2h7L17 22h2l-2-3a3 3 0 0 0 3-3V7c0-4-3-5-8-5zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM6 11V7h12v4z',
  rail: 'M8 2L5 22h2l.6-3h8.8l.6 3h2L16 2h-2l.4 3H9.6L10 2zM9.2 7h5.6l.4 3H8.8zm-.9 5h7.4l.4 3H7.9z',
  elevator: 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM9 6L6 10h6zm6 12l3-4h-6z',
  bank: 'M12 2L2 7v2h20V7zM4 11v7h3v-7zm5 0v7h3v-7zm5 0v7h3v-7zM2 20v2h20v-2z',
  food: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12z',
  toilet: 'M7 2h10v8H7zM5 11h14c0 5-2 8-5 9v2h-4v-2c-3-1-5-4-5-9z',
  ball: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2.5 11.2h19v1.6h-19z',
  plot: 'M3 3h18v18H3zM6 6v12h12V6z',
  island: 'M12 3c-1 3-3 4-6 4 2 1 4 1 5 3v5H4v4h16v-4h-7v-5c1-2 3-2 5-3-3 0-5-1-6-4z',
  warp: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  portal: 'M12 2c4 0 7 4.5 7 10s-3 10-7 10-7-4.5-7-10S8 2 12 2zm0 4c-2 0-3 2.7-3 6s1 6 3 6 3-2.7 3-6-1-6-3-6z',
  flag: 'M5 2h2v20H5zM8 3h12l-3 4.5 3 4.5H8z',
});
export const ICON_NAMES = Object.freeze(Object.keys(ICON_PATHS));

export class LayersError extends Error {
  constructor(code, path = '') { super(code); this.code = code; this.path = path; }
}
const fail = (code, path) => { throw new LayersError(code, path); };
const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const hasControl = (s, allowNewline) => [...s].some(c => { const n = c.charCodeAt(0); return n < 32 ? !(allowNewline && (n === 10 || n === 9 || n === 13)) : n === 127; });
const text = (value, path, { min = 0, max, optional = false, multiline = false }) => {
  if (value === undefined && optional) return '';
  if (typeof value !== 'string') fail('type', path);
  if (value.trim().length < min || value.length > max || hasControl(value, multiline)) fail('text', path);
  return value;
};
const coordinate = (p, path) => {
  if (!isObject(p) || ![p.x, p.y, p.z].every(Number.isFinite)) fail('position', path);
  if (Math.abs(p.x) > 30000000 || Math.abs(p.z) > 30000000 || p.y < -2048 || p.y > 2048) fail('position', path);
  return { x: p.x, y: p.y, z: p.z };
};

function parseFeature(value, path, seen) {
  if (!isObject(value)) fail('type', path);
  const id = text(value.id, `${path}.id`, { min: 1, max: 100 });
  if (seen.has(id)) fail('duplicate', `${path}.id`);
  seen.add(id);
  if (!FEATURE_TYPES.includes(value.type)) fail('featureType', `${path}.type`);
  const feature = {
    id, type: value.type,
    map: text(value.map, `${path}.map`, { min: 1, max: 200 }),
    label: text(value.label, `${path}.label`, { min: 1, max: 160 }),
    detail: text(value.detail, `${path}.detail`, { max: 2000, optional: true, multiline: true }),
    tags: [],
  };
  if (value.tags !== undefined) {
    if (!Array.isArray(value.tags) || value.tags.length > 20) fail('tags', `${path}.tags`);
    feature.tags = value.tags.map((t, i) => text(t, `${path}.tags[${i}]`, { min: 1, max: 40 }));
  }
  if (feature.type === 'point') {
    feature.position = coordinate(value.position, `${path}.position`);
  } else {
    const min = feature.type === 'line' ? 2 : 3;
    if (!Array.isArray(value.points) || value.points.length < min || value.points.length > MAX_POINTS) fail('points', `${path}.points`);
    feature.points = value.points.map((p, i) => coordinate(p, `${path}.points[${i}]`));
    if (feature.type === 'area' && (value.minY !== undefined || value.maxY !== undefined)) {
      if (!Number.isFinite(value.minY) || !Number.isFinite(value.maxY) || value.minY < -2048 || value.maxY > 2048 || value.maxY <= value.minY) fail('height', `${path}.minY`);
      feature.minY = value.minY;
      feature.maxY = value.maxY;
    }
  }
  return feature;
}

/** Strictly validates a parsed file. Unknown fields are ignored; any invalid field rejects the whole file. */
export function parseCustomLayers(value) {
  if (!isObject(value)) fail('format', '$');
  if (value.version !== 1) fail('version', 'version');
  if (!Array.isArray(value.layers)) fail('format', 'layers');
  if (value.layers.length > MAX_LAYERS) fail('tooManyLayers', 'layers');
  const updatedAt = typeof value.updatedAt === 'string' && !Number.isNaN(Date.parse(value.updatedAt)) ? value.updatedAt : '';
  const ids = new Set();
  let total = 0;
  const layers = value.layers.map((l, i) => {
    const path = `layers[${i}]`;
    if (!isObject(l)) fail('type', path);
    if (typeof l.id !== 'string' || !ID_PATTERN.test(l.id)) fail('id', `${path}.id`);
    if (ids.has(l.id)) fail('duplicate', `${path}.id`);
    ids.add(l.id);
    const icon = l.icon === undefined ? 'pin' : l.icon;
    if (typeof icon !== 'string' || !Object.hasOwn(ICON_PATHS, icon)) fail('icon', `${path}.icon`);
    const colour = l.colour === undefined ? DEFAULT_COLOUR : l.colour;
    if (typeof colour !== 'string' || !COLOUR_PATTERN.test(colour)) fail('colour', `${path}.colour`);
    if (l.defaultVisible !== undefined && typeof l.defaultVisible !== 'boolean') fail('type', `${path}.defaultVisible`);
    if (!Array.isArray(l.features)) fail('format', `${path}.features`);
    total += l.features.length;
    if (total > MAX_FEATURES) fail('tooManyFeatures', `${path}.features`);
    const seen = new Set();
    return {
      id: l.id,
      label: text(l.label, `${path}.label`, { min: 1, max: 80 }),
      description: text(l.description, `${path}.description`, { max: 500, optional: true, multiline: true }),
      icon, colour: colour.toLowerCase(),
      defaultVisible: l.defaultVisible !== false,
      features: l.features.map((f, j) => parseFeature(f, `${path}.features[${j}]`, seen)),
    };
  });
  return { version: 1, updatedAt, layers };
}

export const escapeText = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function iconDataUri(icon, colour) {
  const path = ICON_PATHS[icon] ?? ICON_PATHS.pin;
  const fill = COLOUR_PATTERN.test(colour) ? colour : DEFAULT_COLOUR;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${path}" fill="${fill}" fill-rule="evenodd" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round" paint-order="stroke"/></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ---- per-viewer settings -------------------------------------------------------------------
export const SETTINGS_KEY = 'bluemap-custom-layers-settings';
export const defaultLayerSettings = () => ({ visible: null, colour: null, opacity: 1, size: 'medium', labels: 'hover', maxDistance: null });
export function sanitizeLayerSettings(value) {
  const base = defaultLayerSettings();
  if (!isObject(value)) return base;
  if (typeof value.visible === 'boolean') base.visible = value.visible;
  if (typeof value.colour === 'string' && COLOUR_PATTERN.test(value.colour)) base.colour = value.colour.toLowerCase();
  if (Number.isFinite(value.opacity)) base.opacity = Math.min(1, Math.max(0.1, value.opacity));
  if (ICON_SIZES.includes(value.size)) base.size = value.size;
  if (LABEL_MODES.includes(value.labels)) base.labels = value.labels;
  if (Number.isFinite(value.maxDistance) && value.maxDistance >= 10 && value.maxDistance <= 1000000) base.maxDistance = value.maxDistance;
  return base;
}
/** Accepts the exported settings JSON (or the stored form); only well-formed layer ids survive. */
export function sanitizeSettings(value) {
  const layers = Object.create(null);
  if (isObject(value) && isObject(value.layers)) {
    for (const [id, s] of Object.entries(value.layers)) {
      if (ID_PATTERN.test(id) && Object.keys(layers).length < MAX_LAYERS * 4) layers[id] = sanitizeLayerSettings(s);
    }
  }
  return { version: 1, layers };
}
export function exportSettings(settings) { return JSON.stringify({ marker: 'custom-layers-settings', ...sanitizeSettings(settings) }, null, 2); }
export function importSettings(textValue) {
  let parsed;
  try { parsed = JSON.parse(textValue); } catch { fail('json', '$'); }
  if (!isObject(parsed) || parsed.version !== 1 || !isObject(parsed.layers)) fail('settings', '$');
  return sanitizeSettings(parsed);
}
export function effective(layer, settings) {
  const s = sanitizeLayerSettings(settings);
  return { ...s, visible: s.visible ?? layer.defaultVisible, colour: s.colour ?? layer.colour };
}

// ---- features, search, markers -------------------------------------------------------------
export const featureKey = (layerId, featureId) => `${layerId}:${featureId}`;
export function featureCenter(f) {
  if (f.type === 'point') return { ...f.position };
  const n = f.points.length;
  return { x: f.points.reduce((a, p) => a + p.x, 0) / n, y: f.points.reduce((a, p) => a + p.y, 0) / n, z: f.points.reduce((a, p) => a + p.z, 0) / n };
}
export function featuresOnMap(layer, mapId) { return layer.features.filter(f => f.map === mapId); }

/** Builds a matcher. Plain mode is a case-insensitive substring test; regex mode is bounded and validated. */
export function buildMatcher(query, { regex = false, flags = '' } = {}) {
  if (query.length > MAX_QUERY) return { error: 'tooLong' };
  if (!regex) { const q = query.toLowerCase(); return { test: s => s.toLowerCase().includes(q) }; }
  const clean = [...new Set([...flags].filter(c => FLAG_CHARS.includes(c)))].join('');
  try { const re = new RegExp(query, clean); return { test: s => { re.lastIndex = 0; return re.test(s); } }; }
  catch { return { error: 'invalidPattern' }; }
}
export function searchFeatures(layers, query, options = {}) {
  if (!query) return { results: [], truncated: false };
  const matcher = buildMatcher(query, options);
  if (matcher.error) return { results: [], truncated: false, error: matcher.error };
  const results = [];
  let truncated = false;
  outer: for (const layer of layers) {
    for (const f of layer.features) {
      if (options.mapId !== undefined && f.map !== options.mapId) continue;
      const hay = [f.label, f.detail, ...f.tags].join('\n');
      if (matcher.test(hay.slice(0, 2400))) {
        if (results.length >= MAX_RESULTS) { truncated = true; break outer; }
        results.push({ layerId: layer.id, layerLabel: layer.label, feature: f });
      }
    }
  }
  return { results, truncated };
}

const rgb = hex => ({ r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) });
/** Marker data in the viewer's marker format for one layer on one map. */
export function layerMarkers(layer, settings, mapId) {
  const s = effective(layer, settings);
  const c = rgb(s.colour);
  const px = SIZE_PIXELS[s.size];
  const step = Math.max(1, Math.round(s.opacity * 10));
  const maxDistance = s.maxDistance ?? undefined;
  const markers = Object.create(null);
  for (const f of featuresOnMap(layer, mapId)) {
    const label = escapeText(f.label);
    const detail = f.detail ? `<strong>${label}</strong><br>${escapeText(f.detail).replace(/\r?\n/g, '<br>')}` : `<strong>${label}</strong>`;
    const base = { label: f.label, detail: s.labels === 'always' ? `<strong>${label}</strong>` : detail, listed: false, depthTest: false, ...(maxDistance ? { maxDistance } : {}) };
    const key = featureKey(layer.id, f.id);
    if (f.type === 'point') {
      markers[key] = { ...base, type: 'poi', position: { ...f.position }, icon: iconDataUri(layer.icon, s.colour), anchor: { x: px / 2, y: px / 2 },
        classes: ['bm-cl', `bm-cl-size-${s.size}`, `bm-cl-labels-${s.labels}`, `bm-cl-op-${step}`] };
    } else if (f.type === 'line') {
      markers[key] = { ...base, type: 'line', position: featureCenter(f), line: f.points.map(p => ({ ...p })), lineWidth: 3, lineColor: { ...c, a: s.opacity } };
    } else {
      const area = { ...base, type: f.minY !== undefined ? 'extrude' : 'shape', position: featureCenter(f), shape: f.points.map(({ x, z }) => ({ x, z })), shapeY: featureCenter(f).y,
        lineWidth: 2, lineColor: { ...c, a: s.opacity }, fillColor: { ...c, a: 0.28 * s.opacity } };
      if (f.minY !== undefined) { area.shapeMinY = f.minY; area.shapeMaxY = f.maxY; }
      markers[key] = area;
    }
  }
  return markers;
}
export const formatCoordinates = p => `${Math.round(p.x)}, ${Math.round(p.y)}, ${Math.round(p.z)}`;
