<template>
  <section class="custom-layers" :aria-label="t('title')" @keydown.stop @keyup.stop @pointerdown.stop @wheel.stop>
    <p class="cl-intro">{{ t('intro') }}</p>

    <div class="cl-status" role="status" aria-live="polite">
      <span v-if="state.loading">{{ t('loading') }}</span>
      <span v-else-if="state.loadedAt">{{ t('status', { time: timeText(state.loadedAt) }) }} · {{ t('counts', { layers: layers.length, features: totalFeatures }) }}<template v-if="state.data && state.data.updatedAt"> · {{ t('updatedAt', { time: timeText(new Date(state.data.updatedAt)) }) }}</template></span>
      <span v-else>{{ t('neverLoaded') }}</span>
      <VBtn size="small" variant="tonal" :disabled="state.loading" @click="reload">{{ t('reload') }}</VBtn>
    </div>
    <VAlert v-if="state.error" type="error" variant="tonal" role="alert" class="cl-alert">
      <strong>{{ t('errorHeading') }}</strong><br>{{ errorText(state.error) }}
    </VAlert>
    <VAlert v-if="notice" variant="tonal" role="status" class="cl-alert" closable @click:close="notice=''">{{ notice }}</VAlert>

    <!-- search with its adjacent regular expression builder -->
    <div class="cl-search">
      <VTextField v-model="query" :label="t('search')" :placeholder="t('searchHint')" density="comfortable" variant="outlined" hide-details
                  :error="!!searchState.error" maxlength="200" />
      <VBtn class="cl-regex-toggle" :variant="regex ? 'flat' : 'outlined'" :color="regex ? 'primary' : undefined" :aria-pressed="regex ? 'true' : 'false'" :title="t('regex')" @click="regex=!regex"><span aria-hidden="true">.*</span><span class="cl-sr">{{ t('regex') }}</span></VBtn>
    </div>
    <div v-if="regex" class="cl-builder" role="group" :aria-label="t('builder')">
      <div class="cl-chips" role="group" :aria-label="t('tokens')">
        <VBtn v-for="tok in tokens" :key="tok.key" size="small" variant="tonal" @click="insert(tok.insert)"><code>{{ tok.insert }}</code>&nbsp;{{ t('tok_' + tok.key) }}</VBtn>
      </div>
      <div class="cl-chips" role="group" :aria-label="t('flags')">
        <VBtn v-for="f in flagChars" :key="f" size="small" :variant="flags.includes(f) ? 'flat' : 'outlined'" :color="flags.includes(f) ? 'primary' : undefined" :aria-pressed="flags.includes(f) ? 'true' : 'false'" @click="toggleFlag(f)"><code>{{ f }}</code>&nbsp;{{ t('flag_' + f) }}</VBtn>
      </div>
      <p class="cl-validation" :class="{bad: !!patternError}" role="status">{{ patternError ? t(patternError) : t('valid') }}</p>
      <VTextField v-model="sample" :label="t('sample')" density="compact" variant="outlined" hide-details maxlength="400" />
      <p v-if="sample && !patternError" class="cl-validation" role="status">{{ sampleMatches.length ? t('sampleMatch', { matches: sampleMatches.join(' · ') }) : t('sampleNone') }}</p>
    </div>
    <p v-if="searchState.error && !regex" class="cl-validation bad" role="status">{{ t(searchState.error) }}</p>

    <template v-if="query">
      <p class="cl-count" role="status">{{ searchState.results.length ? t('results', { count: searchState.results.length }) : t('noResults') }}<template v-if="searchState.truncated"> {{ t('resultsCapped') }}</template></p>
      <ul class="cl-list" :aria-label="t('results', { count: searchState.results.length })">
        <li v-for="r in searchState.results" :key="r.layerId + ':' + r.feature.id" class="cl-item">
          <button type="button" class="cl-item-main" @click="select(r.layerId, r.feature)">
            <span class="cl-dot" :style="{ background: colourOf(r.layerId) }"></span>
            <span class="cl-item-text"><span class="cl-item-title">{{ r.feature.label }}</span><span class="cl-muted">{{ r.layerLabel }} · {{ r.feature.type }}</span></span>
          </button>
          <VBtn size="small" variant="tonal" :aria-label="t('flyTo') + ' ' + r.feature.label" @click="flyTo(r.feature)">{{ t('flyTo') }}</VBtn>
        </li>
      </ul>
    </template>

    <!-- feature detail sheet -->
    <VCard v-if="selected" class="cl-sheet" variant="tonal" role="region" :aria-label="t('details')">
      <VCardText>
        <div class="cl-sheet-head"><h3>{{ selected.feature.label }}</h3><VBtn size="small" variant="text" @click="selected=null">{{ t('close') }}</VBtn></div>
        <p class="cl-muted">{{ selected.layerLabel }} · {{ selected.feature.type }}</p>
        <p v-if="selected.feature.detail" class="cl-detail">{{ selected.feature.detail }}</p>
        <p v-if="selected.feature.tags.length" class="cl-chips"><span class="cl-tag" v-for="tag in selected.feature.tags" :key="tag">{{ tag }}</span></p>
        <p>{{ t('coordinates') }}: <code>{{ coordinateText(selected.feature) }}</code></p>
        <div class="cl-actions">
          <VBtn size="small" variant="tonal" @click="copyCoordinates">{{ copied ? t('copied') : t('copy') }}</VBtn>
          <VBtn size="small" variant="flat" color="primary" @click="flyTo(selected.feature)">{{ t('flyTo') }}</VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- global actions -->
    <div class="cl-actions">
      <VBtn size="small" variant="tonal" @click="setAll(true)">{{ t('showAll') }}</VBtn>
      <VBtn size="small" variant="tonal" @click="setAll(false)">{{ t('hideAll') }}</VBtn>
      <VBtn size="small" variant="outlined" @click="exportSettings">{{ t('exportSettings') }}</VBtn>
      <VBtn size="small" variant="outlined" @click="$refs.importInput.click()">{{ t('importSettings') }}</VBtn>
      <VBtn size="small" variant="outlined" @click="resetAll">{{ t('resetAll') }}</VBtn>
      <input ref="importInput" class="cl-sr" type="file" accept="application/json,.json" tabindex="-1" aria-hidden="true" @change="importFile">
    </div>

    <!-- layers -->
    <ul class="cl-layers">
      <li v-for="layer in layers" :key="layer.id" class="cl-layer">
        <div class="cl-layer-row">
          <svg class="cl-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="iconPath(layer.icon)" :fill="effectiveOf(layer).colour" fill-rule="evenodd" stroke="currentColor" stroke-opacity=".35" stroke-width="1" /></svg>
          <div class="cl-layer-text">
            <div class="cl-layer-title">{{ layer.label }}</div>
            <div class="cl-muted">{{ countOn(layer) ? t('featuresHere', { count: countOn(layer) }) : t('noneHere') }}</div>
            <div v-if="layer.description" class="cl-muted">{{ layer.description }}</div>
          </div>
          <VSwitch :model-value="effectiveOf(layer).visible" :aria-label="t('layerOn', { name: layer.label })" hide-details density="compact" color="primary" @update:model-value="v => patch(layer.id, { visible: !!v })" />
          <VBtn size="small" variant="text" class="cl-expand" :aria-expanded="open[layer.id] ? 'true' : 'false'" :aria-label="open[layer.id] ? t('settingsClose', { name: layer.label }) : t('settingsOpen', { name: layer.label })" @click="open[layer.id]=!open[layer.id]"><span aria-hidden="true">{{ open[layer.id] ? '▴' : '▾' }}</span></VBtn>
        </div>
        <div v-if="open[layer.id]" class="cl-layer-settings" role="group" :aria-label="t('settings') + ': ' + layer.label">
          <label class="cl-field">{{ t('colour') }}
            <span class="cl-colour-row">
              <input type="color" :value="effectiveOf(layer).colour" :aria-label="t('colour')" @input="e => patch(layer.id, { colour: e.target.value })">
              <button v-for="c in swatches" :key="c" type="button" class="cl-swatch" :style="{ background: c }" :aria-label="t('swatch', { colour: c })" @click="patch(layer.id, { colour: c })"></button>
            </span>
          </label>
          <label class="cl-field">{{ t('opacity') }} ({{ Math.round(effectiveOf(layer).opacity * 100) }}%)
            <input type="range" min="10" max="100" step="5" :value="Math.round(effectiveOf(layer).opacity * 100)" @input="e => patch(layer.id, { opacity: Number(e.target.value) / 100 })">
          </label>
          <label class="cl-field">{{ t('iconSize') }}
            <select :value="effectiveOf(layer).size" @change="e => patch(layer.id, { size: e.target.value })"><option v-for="s in sizes" :key="s" :value="s">{{ t('size_' + s) }}</option></select>
          </label>
          <label class="cl-field">{{ t('labels') }}
            <select :value="effectiveOf(layer).labels" @change="e => patch(layer.id, { labels: e.target.value })"><option v-for="m in labelModes" :key="m" :value="m">{{ t('labels_' + m) }}</option></select>
          </label>
          <label class="cl-field">{{ t('maxDistance') }}
            <input type="number" min="10" max="1000000" step="10" :value="effectiveOf(layer).maxDistance ?? ''" @change="e => patch(layer.id, { maxDistance: e.target.value === '' ? null : Number(e.target.value) })">
          </label>
          <VBtn size="small" variant="outlined" @click="resetLayer(layer.id)">{{ t('resetLayer') }}</VBtn>
          <h4>{{ t('features') }}</h4>
          <ul class="cl-list" :aria-label="t('features')">
            <li v-for="f in onMap(layer)" :key="f.id" class="cl-item">
              <button type="button" class="cl-item-main" @click="select(layer.id, f)">
                <span class="cl-item-text"><span class="cl-item-title">{{ f.label }}</span><span class="cl-muted">{{ f.type }}</span></span>
              </button>
              <VBtn size="small" variant="tonal" :aria-label="t('flyTo') + ' ' + f.label" @click="flyTo(f)">{{ t('flyTo') }}</VBtn>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </section>
</template>

<script>
import { VAlert, VBtn, VTextField, VSwitch, VCard, VCardText } from 'vuetify/components';
import { markRaw } from 'vue';
import { MarkerSet } from '../../js/markers/MarkerSet';
import { customLayersState, loadCustomLayers, persistSettings } from '../../js/hosting/customLayersStore.js';
import {
  CUSTOM_LAYERS_SET, ICON_PATHS, ICON_SIZES, LABEL_MODES, FLAG_CHARS, MAX_QUERY, buildMatcher, effective, exportSettings, featureCenter, featuresOnMap, formatCoordinates,
  importSettings, layerMarkers, sanitizeLayerSettings, sanitizeSettings, searchFeatures,
} from '../../js/hosting/customLayers.mjs';
import { layerText } from './layerMessages.mjs';

export default {
  name: 'CustomLayers',
  components: { VAlert, VBtn, VTextField, VSwitch, VCard, VCardText },
  data() {
    return {
      state: customLayersState, viewer: this.$bluemap.mapViewer.data,
      query: '', regex: false, flags: 'i', sample: '', open: {}, selected: null, copied: false, notice: '',
      sizes: ICON_SIZES, labelModes: LABEL_MODES, flagChars: FLAG_CHARS,
      swatches: ['#3f8ae0', '#e0453f', '#3fb85a', '#e0a63f', '#9b59d0', '#2ec4b6', '#ff7ab6', '#8d99ae'],
      tokens: [
        { key: 'digit', insert: '\\d' }, { key: 'word', insert: '\\w' }, { key: 'any', insert: '.' }, { key: 'start', insert: '^' }, { key: 'end', insert: '$' },
        { key: 'group', insert: '()' }, { key: 'or', insert: '|' }, { key: 'star', insert: '*' }, { key: 'plus', insert: '+' }, { key: 'opt', insert: '?' }, { key: 'class', insert: '[]' },
      ],
    };
  },
  computed: {
    layers() { return this.state.data?.layers ?? []; },
    totalFeatures() { return this.layers.reduce((n, l) => n + l.features.length, 0); },
    mapId() { return this.viewer.map?.id; },
    patternError() {
      if (!this.regex) return '';
      if (this.query.length > MAX_QUERY) return 'tooLong';
      return buildMatcher(this.query, { regex: true, flags: this.flags }).error ?? '';
    },
    searchState() {
      return searchFeatures(this.layers, this.query ?? '', { regex: this.regex, flags: this.flags, mapId: this.mapId });
    },
    sampleMatches() {
      try {
        const re = new RegExp(this.query, [...new Set(this.flags + 'g')].join(''));
        return [...this.sample.matchAll(re)].slice(0, 5).map(m => m[0] === '' ? '∅' : m[0].slice(0, 40));
      } catch { return []; }
    },
  },
  watch: {
    'state.data'() { this.render(); },
    'state.settings': { handler() { this.render(); }, deep: true },
    mapId() { this.render(); },
  },
  async mounted() {
    this.sets = new Map();
    this.root = markRaw(new MarkerSet(CUSTOM_LAYERS_SET));
    this.root.updateFromData({ label: this.t('title'), toggleable: false, markers: {} });
    this.$bluemap.mapViewer.markers.add(this.root);
    await this.reload();
    this.timer = setInterval(() => loadCustomLayers(), 60000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
    if (this.root) this.$bluemap.mapViewer.markers.remove(this.root);
  },
  methods: {
    t(key, params) { return layerText(this.$i18n.locale, key, params); },
    timeText(date) { try { return date.toLocaleString(); } catch { return ''; } },
    errorText(error) { return this.t('err_' + error.code, { detail: error.path }); },
    async reload() { await loadCustomLayers(); this.render(); },
    iconPath(icon) { return ICON_PATHS[icon] ?? ICON_PATHS.pin; },
    effectiveOf(layer) { return effective(layer, this.state.settings.layers[layer.id]); },
    colourOf(layerId) { const l = this.layers.find(x => x.id === layerId); return l ? this.effectiveOf(l).colour : '#888'; },
    onMap(layer) { return featuresOnMap(layer, this.mapId); },
    countOn(layer) { return this.onMap(layer).length; },
    patch(id, change) {
      const current = sanitizeLayerSettings(this.state.settings.layers[id]);
      this.state.settings.layers[id] = sanitizeLayerSettings({ ...current, ...change });
      persistSettings();
    },
    resetLayer(id) { delete this.state.settings.layers[id]; persistSettings(); },
    setAll(visible) { for (const l of this.layers) this.patch(l.id, { visible }); },
    resetAll() { this.state.settings.layers = Object.create(null); persistSettings(); this.notice = this.t('settingsReset'); },
    exportSettings() {
      const blob = new Blob([exportSettings(this.state.settings)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'custom-layers-settings.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    async importFile(event) {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file) return;
      try {
        if (file.size > 1000000) throw Object.assign(new Error('settings'), { code: 'settings', path: '' });
        this.state.settings = importSettings(await file.text());
        persistSettings(); this.notice = this.t('settingsImported');
      } catch (error) { this.notice = this.t('err_' + (error.code ?? 'settings'), { detail: error.path ?? '' }); }
    },
    insert(token) { this.query = (this.query ?? '') + token; },
    toggleFlag(f) { this.flags = this.flags.includes(f) ? this.flags.replace(f, '') : this.flags + f; },
    select(layerId, feature) {
      const layer = this.layers.find(l => l.id === layerId);
      this.selected = { layerId, layerLabel: layer?.label ?? layerId, feature }; this.copied = false;
    },
    coordinateText(f) { return formatCoordinates(featureCenter(f)); },
    async copyCoordinates() {
      try { await navigator.clipboard.writeText(this.coordinateText(this.selected.feature)); this.copied = true; setTimeout(() => { this.copied = false; }, 1500); } catch { this.copied = false; }
    },
    flyTo(feature) {
      const c = featureCenter(feature);
      const cm = this.$bluemap.mapViewer.controlsManager;
      cm.position.set(c.x, c.y, c.z);
      cm.distance = Math.min(cm.distance, 150);
      this.$bluemap.mapViewer.redraw();
    },
    /** One marker set per layer, separate from server markers and shared annotations. */
    render() {
      if (!this.root) return;
      const wanted = new Set();
      for (const layer of this.layers) {
        wanted.add(layer.id);
        let set = this.sets.get(layer.id);
        if (!set) { set = markRaw(new MarkerSet('bm-custom-layer-' + layer.id)); this.sets.set(layer.id, set); this.root.add(set); }
        const s = this.effectiveOf(layer);
        set.updateFromData({ label: layer.label, toggleable: false, markers: layerMarkers(layer, this.state.settings.layers[layer.id], this.mapId) });
        set.visible = s.visible;
      }
      for (const [id, set] of [...this.sets]) if (!wanted.has(id)) { this.root.remove(set); this.sets.delete(id); }
      this.$bluemap.mapViewer.redraw();
    },
  },
};
</script>

<style scoped>
.custom-layers { pointer-events: auto; padding: 12px; min-width: 0; overflow-wrap: anywhere; color: var(--md-sys-color-on-surface); font-size: var(--md-sys-typescale-body-medium-size, 0.875rem); }
.cl-intro, .cl-muted { color: var(--md-sys-color-on-surface-variant); margin: 0 0 8px; }
.cl-status { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
.cl-alert { margin-bottom: 8px; }
.cl-search { display: flex; gap: 8px; align-items: flex-start; margin: 8px 0; }
.cl-search .v-text-field { flex: 1 1 auto; min-width: 0; }
.cl-regex-toggle { min-height: 48px; min-width: 48px; font-family: monospace; font-weight: 700; }
.cl-builder { border: 1px solid var(--md-sys-color-outline-variant); border-radius: 12px; padding: 8px; margin-bottom: 8px; display: grid; gap: 8px; }
.cl-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
.cl-chips .v-btn { text-transform: none; letter-spacing: 0; }
.cl-validation { margin: 0; color: var(--md-sys-color-on-surface-variant); }
.cl-validation.bad { color: var(--md-sys-color-error); }
.cl-count { margin: 4px 0; color: var(--md-sys-color-on-surface-variant); }
.cl-list { list-style: none; margin: 0 0 8px; padding: 0; max-height: 18rem; overflow: auto; display: grid; gap: 4px; }
.cl-item { display: flex; align-items: center; gap: 8px; }
.cl-item-main { flex: 1 1 auto; min-width: 0; min-height: 48px; display: flex; align-items: center; text-align: start; gap: 4px; border: 0; border-radius: 12px; padding: 4px 8px; background: transparent; color: var(--md-sys-color-on-surface); font: inherit; cursor: pointer; }
.cl-item-main:hover { background: var(--md-sys-color-surface-container-highest, rgba(127,127,127,.15)); }
.cl-item-main:focus-visible { outline: 3px solid var(--md-sys-color-primary); outline-offset: 1px; }
.cl-item-text { display: grid; min-width: 0; }
.cl-item-title { font-size: var(--md-sys-typescale-body-large-size, 1rem); }
.cl-dot { width: 14px; height: 14px; border-radius: 50%; margin-inline-end: 12px; display: inline-block; border: 1px solid var(--md-sys-color-outline); }
.cl-sheet { margin: 8px 0; }
.cl-sheet-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.cl-sheet-head h3 { margin: 0; font-size: 1.1rem; }
.cl-detail { white-space: pre-wrap; }
.cl-tag { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); border-radius: 8px; padding: 2px 8px; }
.cl-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
.cl-layers { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.cl-layer { border: 1px solid var(--md-sys-color-outline-variant); border-radius: 16px; padding: 8px 12px; background: var(--md-sys-color-surface-container, transparent); }
.cl-layer-row { display: flex; align-items: center; gap: 12px; min-height: 48px; }
.cl-layer-text { flex: 1 1 auto; min-width: 0; }
.cl-layer-title { font-size: var(--md-sys-typescale-body-large-size, 1rem); }
.cl-icon { width: 28px; height: 28px; flex: 0 0 28px; }
.cl-expand { min-width: 48px; min-height: 48px; font-size: 1.4rem; }
.cl-layer-settings { display: grid; gap: 12px; padding: 8px 0 4px; }
.cl-layer-settings h4 { margin: 4px 0 0; }
.cl-field { display: grid; gap: 4px; color: var(--md-sys-color-on-surface-variant); }
.cl-field input[type="number"], .cl-field select { min-height: 44px; border: 1px solid var(--md-sys-color-outline); border-radius: 8px; padding: 0 10px; background: transparent; color: var(--md-sys-color-on-surface); font: inherit; }
.cl-field input[type="range"] { min-height: 44px; accent-color: var(--md-sys-color-primary); }
.cl-colour-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.cl-colour-row input[type="color"] { width: 48px; height: 48px; padding: 0; border: 1px solid var(--md-sys-color-outline); border-radius: 12px; background: transparent; }
.cl-swatch { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--md-sys-color-outline-variant); cursor: pointer; }
.cl-swatch:focus-visible, .custom-layers select:focus-visible, .custom-layers input:focus-visible { outline: 3px solid var(--md-sys-color-primary); outline-offset: 2px; }
.cl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.custom-layers .v-btn { white-space: normal; height: auto; min-height: 40px; max-width: 100%; }
@media (prefers-reduced-motion: reduce) { .custom-layers * { transition: none !important; animation: none !important; } }
@media (max-width: 480px) { .custom-layers { padding: 8px; } .cl-layer-row { gap: 8px; } }
</style>
