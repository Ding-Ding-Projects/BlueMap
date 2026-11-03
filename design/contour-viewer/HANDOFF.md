# Contour viewer: the web map redesign (2026-11-02)

**Status:** design approved for implementation; the first slice is in `common/webapp`.

Contour is the visual direction shared with the WorldLens desktop app: pure Material Design 3,
one opaque surface in focus, and controls that float on the map in separate clusters rather than
a strip across the top. The colour roles are the same `--md-sys-color-*` values the viewer
already ships in `common/webapp/src/scss/variables.scss` (light, dark and contrast).

| File | Screen |
| --- | --- |
| `Main.dc.html` | The map viewer: menu and map switch top-left, compass and zoom top-right, camera position bottom-left, one floating toolbar at the bottom |
| `Menu.dc.html` | The navigation sheet: a floating side sheet with the pages, an inline map list and quick actions |
| `Settings.dc.html` | The settings sheet: grouped controls with a search field, every existing setting kept |
| `Phone.dc.html` | A phone: one top row, and markers as a modal bottom sheet with per-set switches |

`canvas.json` is the canvas index; each artboard has a `theme` tweak (dark, light, contrast).
Images in the artboards are uploaded canvas assets (`/_blob/...`); the source image is
`assets/map-render.png`.

## Built in `common/webapp` so far

- `ControlBar.vue`: the single top toolbar became four opaque clusters (start, compass,
  position, and a bottom floating toolbar for markers, players, lighting, view and camera
  reset). Phones keep one top row; the toolbar's actions stay reachable from the menu.
- `ZoomButtons.vue`: stacked under the compass, so the bottom edge belongs to the toolbar.
- `SideMenu.vue`: a floating side sheet with the extra-large corner, opaque
  surface-container-low; full screen on phones.

`captures/` holds the first browser captures of that build against a map rendered by WorldLens
CI (headless Chrome, 1440×900 and 390×844, 2026-11-02).

## Still to build

- Menu rows with leading icons and the inline map list from `Menu.dc.html`.
- The settings sheet's grouped layout, search field and segmented controls (`Settings.dc.html`).
- The phone markers bottom sheet (`Phone.dc.html`).
- Outlined coordinate fields in the position card (today they are the filled variant).
