import { reactive } from 'vue';
import { LAYERS_FILE, LayersError, parseCustomLayers, sanitizeSettings, SETTINGS_KEY } from './customLayers.mjs';

/** Shared state for the optional custom layers file, read by the menu entry and the panel. */
export const customLayersState = reactive({
  available: false,   // the file exists (or existed): show the menu entry
  loading: false,
  error: null,        // { code, path } of the last failed load, the previous good data stays shown
  data: null,         // validated file contents
  raw: '',            // text of the last accepted file, to skip pointless redraws
  loadedAt: null,
  settings: loadSettings(),
});

function loadSettings() {
  try { return sanitizeSettings(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || 'null')); }
  catch { return sanitizeSettings(null); }
}
export function persistSettings() {
  try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(customLayersState.settings))); } catch { /* storage unavailable */ }
}

/** Fetches and validates the file. Resolves true when the displayed data changed. */
export async function loadCustomLayers() {
  if (customLayersState.loading) return false;
  customLayersState.loading = true;
  try {
    let response;
    try {
      response = await fetch(new URL(LAYERS_FILE, document.baseURI), { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
    } catch { throw new LayersError('network'); }
    if (response.status === 404) {
      const changed = customLayersState.data !== null;
      customLayersState.available = false; customLayersState.data = null; customLayersState.raw = ''; customLayersState.error = null;
      return changed;
    }
    customLayersState.available = true;
    if (!response.ok) throw new LayersError('http', String(response.status));
    const body = await response.text();
    let json;
    try { json = JSON.parse(body); } catch { throw new LayersError('json'); }
    const data = parseCustomLayers(json);
    customLayersState.error = null;
    customLayersState.loadedAt = new Date();
    if (body === customLayersState.raw) return false;
    customLayersState.raw = body; customLayersState.data = data;
    return true;
  } catch (error) {
    if (customLayersState.data || error.code !== 'network') customLayersState.available = true;
    customLayersState.error = { code: error instanceof LayersError ? error.code : 'network', path: error.path || '' };
    return false;
  } finally {
    customLayersState.loading = false;
  }
}
