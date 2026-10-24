# Viewer component provenance

The maintained viewer registers Vuetify 3.13.0 through its Vue application. The Three.js renderer, tile loaders, map controls and terrain algorithms remain separate from the presentation components.

| Surface | Production component |
| --- | --- |
| Overlay root | `VApp` with a transparent background |
| Loading and error notices | `VAlert` |
| Map toolbar | `VToolbar` |
| Toolbar actions | `VBtn` |
| Navigation rows | `VListItem` |
| Side panels | `VSheet` |
| Text and coordinate fields | `VTextField` |
| Numeric sliders | `VSlider` |
| Boolean settings | `VSwitch` |
| Compass and day/night controls | `VBtn`, with retained renderer state and reduced-motion transitions |
| View selection | `VBtnToggle` and `VBtn`, with perspective, flat and free-flight actions |
| Hosted annotation workspace | `VAlert`, `VTextField`, `VTextarea`, `VSelect`, `VSwitch`, `VList`, `VListItem`, `VCard`, `VRadioGroup`, `VRadio`, `VBtn` |

The full-screen overlay must remain transparent: passing pointer events through an opaque overlay does not expose terrain pixels. Each control paints its own surface. Existing localization keys and action events remain connected to the same map state.

Runtime acceptance remains separate from this inventory. Verify terrain visibility, tile/texture delivery, keyboard actions, theme transitions, narrow layouts and supported display scales against the built viewer. The compass, day/night and view-switch controls now use direct Vuetify components. Their built interaction and layout review remains pending; component provenance alone does not prove visual conformance.

## 廣東話

維護版檢視器透過 Vue 註冊 Vuetify 3.13.0。工具列、按鈕、清單、側欄、文字及座標欄位、滑桿、開關和狀態訊息均使用表內的正式元件。Three.js 地形及控制演算法維持獨立。

全畫面覆蓋層必須透明，只由各控制項繪畫自己的背景。滑鼠事件可以穿過不透明覆蓋層，但地形畫面仍會被遮住。此表只記錄元件來源，實際地形、鍵盤操作、主題、窄畫面及顯示比例仍須使用真正建置版本驗證。指南針、日夜及視角切換現已使用正式 Vuetify 元件，但仍須以真正建置版本完成互動及版面驗收。

## Hosted viewer state inventory

The shared-annotation panel is reached from the main menu and remains mounted while navigation is hidden. It has explicit standalone, invalid configuration, sign-in, authenticated read, editor-refused, unavailable, unsaved, saved and revision-conflict states. Point notes, paths, areas and volumes use coordinate controls, with keyboard-accessible addition/removal of geometry points. The main menu also exposes the compass, lighting and view controls on narrow displays where the toolbar hides them.

No new search input is introduced. The annotation list is selected directly; this work does not claim full regular-expression tooling or universal feature parity.

See [Hosted annotations](HOSTED_ANNOTATIONS.md) for the deployment contract and remaining acceptance work.
