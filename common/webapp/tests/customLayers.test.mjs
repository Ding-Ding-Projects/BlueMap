import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCustomLayers, LayersError, searchFeatures, layerMarkers, sanitizeSettings, importSettings, exportSettings,
  effective, iconDataUri, featureCenter, escapeText, ICON_NAMES, MAX_FEATURES, MAX_LAYERS, buildMatcher,
} from '../src/js/hosting/customLayers.mjs';

const point = (id = 'p1', extra = {}) => ({ id, type: 'point', map: 'world', label: 'Example station', position: { x: 10, y: 64, z: -20 }, ...extra });
const layer = (id = 'stations', features = [point()], extra = {}) => ({ id, label: 'Stations', icon: 'train', colour: '#3F8AE0', features, ...extra });
const file = (layers = [layer()]) => ({ version: 1, updatedAt: '2026-11-17T18:00:00Z', layers });
const rejects = (value, code) => assert.throws(() => parseCustomLayers(value), e => e instanceof LayersError && e.code === code, code);

test('a valid file is accepted, normalised and defaults are applied', () => {
  const parsed = parseCustomLayers(file([layer('a', [point(), { id: 'l', type: 'line', map: 'world', label: 'Line', points: [{ x: 0, y: 64, z: 0 }, { x: 5, y: 64, z: 5 }] },
    { id: 'z', type: 'area', map: 'world_nether', label: 'Plot', minY: 60, maxY: 80, points: [{ x: 0, y: 64, z: 0 }, { x: 5, y: 64, z: 0 }, { x: 5, y: 64, z: 5 }], tags: ['a'], unknown: 1 }], { unknownField: true })]));
  assert.equal(parsed.layers[0].colour, '#3f8ae0');
  assert.equal(parsed.layers[0].defaultVisible, true);
  assert.equal(parsed.layers[0].features[2].maxY, 80);
  assert.equal(parsed.layers[0].unknownField, undefined);
  const bare = parseCustomLayers({ version: 1, layers: [{ id: 'bare', label: 'Bare', features: [] }] });
  assert.equal(bare.layers[0].icon, 'pin');
  assert.equal(bare.updatedAt, '');
});

test('every icon in the documented set is accepted and unknown icons are rejected', () => {
  assert.deepEqual([...ICON_NAMES].sort(), ['bank', 'ball', 'elevator', 'flag', 'food', 'home', 'info', 'island', 'pin', 'plot', 'portal', 'rail', 'shop', 'star', 'toilet', 'train', 'warp'].sort());
  for (const icon of ICON_NAMES) parseCustomLayers(file([layer('x', [], { icon })]));
  rejects(file([layer('x', [], { icon: 'url(javascript:alert(1))' })]), 'icon');
  rejects(file([layer('x', [], { icon: 'constructor' })]), 'icon');
});

test('file level rejection rules', () => {
  rejects(null, 'format'); rejects([], 'format'); rejects({ version: 2, layers: [] }, 'version'); rejects({ version: 1 }, 'format');
  rejects(file([layer('A')]), 'id'); rejects(file([layer('has space')]), 'id'); rejects(file([layer('x'.repeat(65))]), 'id'); rejects(file([layer('')]), 'id');
  rejects(file([layer('a'), layer('a')]), 'duplicate');
  rejects(file([layer('a', [], { label: '' })]), 'text'); rejects(file([layer('a', [], { label: 'x'.repeat(81) })]), 'text');
  rejects(file([layer('a', [], { description: 'x'.repeat(501) })]), 'text');
  rejects(file([layer('a', [], { colour: 'red' })]), 'colour'); rejects(file([layer('a', [], { colour: '#12345' })]), 'colour');
  rejects(file([layer('a', [], { defaultVisible: 'yes' })]), 'type');
  rejects(file([layer('a', 'nope')]), 'format');
});

test('feature rejection rules', () => {
  const bad = (feature, code) => rejects(file([layer('a', [feature])]), code);
  bad(point('p', { type: 'circle' }), 'featureType');
  bad(point('p', { map: '' }), 'text'); bad(point('p', { label: '' }), 'text'); bad(point('p', { label: 'x'.repeat(161) }), 'text');
  bad(point('p', { detail: 'x'.repeat(2001) }), 'text'); bad(point('p', { label: 'bad\u0007label' }), 'text');
  bad(point('p', { position: { x: 1, y: 2 } }), 'position'); bad(point('p', { position: { x: Infinity, y: 2, z: 3 } }), 'position');
  bad(point('p', { position: { x: 1, y: 5000, z: 3 } }), 'position'); bad(point('p', { position: { x: 1e9, y: 1, z: 3 } }), 'position');
  bad(point('p', { tags: 'a' }), 'tags'); bad(point('p', { tags: Array(21).fill('a') }), 'tags'); bad(point('p', { tags: [''] }), 'text');
  bad({ id: 'l', type: 'line', map: 'w', label: 'L', points: [{ x: 0, y: 0, z: 0 }] }, 'points');
  bad({ id: 'a', type: 'area', map: 'w', label: 'A', points: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }] }, 'points');
  bad({ id: 'a', type: 'area', map: 'w', label: 'A', points: Array(513).fill({ x: 0, y: 0, z: 0 }) }, 'points');
  const tri = [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }];
  bad({ id: 'a', type: 'area', map: 'w', label: 'A', points: tri, minY: 80, maxY: 60 }, 'height');
  bad({ id: 'a', type: 'area', map: 'w', label: 'A', points: tri, minY: 60 }, 'height');
  rejects(file([layer('a', [point('p'), point('p')])]), 'duplicate');
  assert.equal(parseCustomLayers(file([layer('a', [point('p')]), layer('b', [point('p')])])).layers.length, 2);
});

test('caps: 64 layers and 5000 features in total', () => {
  const layers = n => Array.from({ length: n }, (_, i) => layer('l' + i, []));
  assert.equal(parseCustomLayers(file(layers(MAX_LAYERS))).layers.length, MAX_LAYERS);
  rejects(file(layers(MAX_LAYERS + 1)), 'tooManyLayers');
  const many = n => Array.from({ length: n }, (_, i) => point('f' + i));
  assert.equal(parseCustomLayers(file([layer('a', many(2500)), layer('b', many(MAX_FEATURES - 2500))])).layers.length, 2);
  rejects(file([layer('a', many(2500)), layer('b', many(2501))]), 'tooManyFeatures');
});

test('text is escaped and the file cannot supply markup, classes or icon URLs', () => {
  const hostile = '<img src=x onerror=alert(1)>"\'&';
  const parsed = parseCustomLayers(file([layer('a', [point('p', { label: hostile, detail: hostile + '\nline two', icon: 'https://evil.example/x.svg', classes: ['evil'], html: '<b>' })])]));
  const m = layerMarkers(parsed.layers[0], {}, 'world')['a:p'];
  assert.ok(!/<img/.test(m.detail));
  assert.match(m.detail, /&lt;img src=x onerror=alert\(1\)&gt;&quot;&#39;&amp;/);
  assert.match(m.detail, /<br>/);
  assert.ok(m.icon.startsWith('data:image/svg+xml'));
  assert.ok(!m.classes.includes('evil'));
  assert.equal(m.html, undefined);
  assert.equal(escapeText('<a href="x">'), '&lt;a href=&quot;x&quot;&gt;');
  assert.ok(!decodeURIComponent(iconDataUri('pin', '#12345g')).includes('12345g'));
});

test('only features of the shown map become markers, in the right marker kinds', () => {
  const l = parseCustomLayers(file([layer('a', [point('p'), point('q', { map: 'nether' }),
    { id: 'z', type: 'area', map: 'world', label: 'A', minY: 60, maxY: 80, points: [{ x: 0, y: 64, z: 0 }, { x: 4, y: 64, z: 0 }, { x: 4, y: 64, z: 4 }] },
    { id: 'l', type: 'line', map: 'world', label: 'L', points: [{ x: 0, y: 64, z: 0 }, { x: 4, y: 64, z: 4 }] }])])).layers[0];
  const markers = layerMarkers(l, {}, 'world');
  assert.deepEqual(Object.keys(markers).sort(), ['a:l', 'a:p', 'a:z']);
  assert.equal(markers['a:z'].type, 'extrude'); assert.equal(markers['a:z'].shapeMaxY, 80);
  assert.equal(markers['a:l'].type, 'line'); assert.equal(markers['a:p'].type, 'poi');
  assert.deepEqual(Object.keys(layerMarkers(l, {}, 'nether')), ['a:q']);
  assert.deepEqual(featureCenter(l.features[2]), { x: 8 / 3, y: 64, z: 4 / 3 });
});

test('settings are sanitised, clamped, applied and round-trip through export and import', () => {
  const s = sanitizeSettings({ layers: { good: { visible: false, colour: '#ABCDEF', opacity: 5, size: 'large', labels: 'always', maxDistance: 500 }, 'BAD ID': { visible: true }, evil: { colour: 'red', size: 'huge', labels: 'x', opacity: 'a', maxDistance: -1 } } });
  assert.deepEqual(Object.keys(s.layers).sort(), ['evil', 'good']);
  assert.deepEqual(s.layers.good, { visible: false, colour: '#abcdef', opacity: 1, size: 'large', labels: 'always', maxDistance: 500 });
  assert.deepEqual(s.layers.evil, { visible: null, colour: null, opacity: 1, size: 'medium', labels: 'hover', maxDistance: null });
  assert.equal(sanitizeSettings({ layers: { a: { opacity: 0 } } }).layers.a.opacity, 0.1);
  assert.deepEqual(importSettings(exportSettings(s)), s);
  assert.throws(() => importSettings('not json'), e => e.code === 'json');
  assert.throws(() => importSettings('{"version":2,"layers":{}}'), e => e.code === 'settings');
  const l = parseCustomLayers(file([layer('good', [point()], { defaultVisible: false })])).layers[0];
  assert.equal(effective(l, {}).visible, false); assert.equal(effective(l, { visible: true }).visible, true);
  const m = layerMarkers(l, { size: 'large', labels: 'never', opacity: 0.5, colour: '#00ff00', maxDistance: 300 }, 'world')['good:p1'];
  assert.ok(m.classes.includes('bm-cl-size-large') && m.classes.includes('bm-cl-labels-never') && m.classes.includes('bm-cl-op-5'));
  assert.equal(m.maxDistance, 300);
  assert.match(decodeURIComponent(m.icon), /#00ff00/);
});

test('search: plain, tags, detail, regular expressions, flags, invalid patterns and bounds', () => {
  const l = parseCustomLayers(file([layer('a', [point('p', { label: 'Central Station', detail: 'Platform 9', tags: ['rail'] }), point('q', { label: 'harbour', detail: 'ferry', tags: [] }), point('r', { map: 'nether', label: 'Central nether' })])])).layers;
  assert.equal(searchFeatures(l, 'central').results.length, 2);
  assert.equal(searchFeatures(l, 'central', { mapId: 'world' }).results.length, 1);
  assert.equal(searchFeatures(l, 'RAIL').results[0].feature.id, 'p');
  assert.equal(searchFeatures(l, 'platform').results.length, 1);
  assert.equal(searchFeatures(l, '^Harb', { regex: true }).results.length, 0);
  assert.equal(searchFeatures(l, '^Harb', { regex: true, flags: 'i' }).results.length, 1);
  assert.equal(searchFeatures(l, '^Harb', { regex: true, flags: 'im' }).results.length, 1);
  assert.equal(searchFeatures(l, 'central.*platform', { regex: true, flags: 'is' }).results.length, 1);
  assert.equal(searchFeatures(l, '(', { regex: true }).error, 'invalidPattern');
  assert.equal(searchFeatures(l, 'x'.repeat(201)).error, 'tooLong');
  assert.equal(searchFeatures(l, '').results.length, 0);
  assert.equal(searchFeatures(l, 'a', { regex: true, flags: 'gy' }).results.length >= 1, true, 'unsupported flags are dropped');
  assert.equal(buildMatcher('a.c', { regex: false }).test('abc'), false, 'plain mode never interprets patterns');
  const lots = parseCustomLayers(file([layer('a', Array.from({ length: 300 }, (_, i) => point('f' + i)))])).layers;
  const capped = searchFeatures(lots, 'station');
  assert.equal(capped.results.length, 200); assert.equal(capped.truncated, true);
});

import { readFileSync } from 'node:fs';
import { layerText, layerMessageKeys } from '../src/components/Hosting/layerMessages.mjs';
test('the bundled example file is valid and every panel string exists in both languages', () => {
  const example = JSON.parse(readFileSync(new URL('../public/custom-layers.example.json', import.meta.url), 'utf8'));
  assert.equal(parseCustomLayers(example).layers.length, 2);
  const source = readFileSync(new URL('../src/components/Hosting/CustomLayers.vue', import.meta.url), 'utf8');
  const used = new Set([...source.matchAll(/\bt\('([a-zA-Z_]+)'/g)].map(m => m[1]));
  for (const key of ['tok_digit', 'tok_class', 'flag_i', 'flag_u', 'size_small', 'size_large', 'labels_always', 'labels_never', 'err_http', 'err_network', 'err_icon']) used.add(key);
  for (const key of used) if (!key.endsWith('_')) assert.ok(layerMessageKeys.includes(key), 'missing ' + key);
  for (const key of layerMessageKeys) {
    const en = layerText('en', key), zh = layerText('zh-HK', key);
    assert.ok(en && zh, key);
    assert.equal(layerText('en-zh-HK', key), `${en} / ${zh}`);
  }
  assert.equal(layerText('en', 'status', { time: 'now' }), 'Loaded now');
});
