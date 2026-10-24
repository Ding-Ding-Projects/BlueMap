# Authenticated shared annotations

A Worldlens deployment may place `worldlens-hosting.json` next to the exported viewer entry page:

```json
{
  "projectId": "project-id",
  "mapId": "effective-map-id",
  "dimension": "overworld",
  "apiPath": "/bridge/annotations"
}
```

The three identity fields must be nonempty strings. The optional API path accepts only the exact same-origin route shown above. A missing configuration (HTTP 404) keeps the viewer standalone. Invalid configuration and an unavailable host have distinct visible results. A deployment must expose the configuration beside the viewer, not beside the source tree or a different URL base.

## Working with annotations

1. Open **Shared annotations** in the main menu. Sign in through the host's actual username/password form when requested. Credentials are cleared after submission and are never stored in local storage.
2. Select the configured map. Existing terrain and source markers keep their normal behavior. Shared annotations appear in a dedicated marker set on this map only.
3. Choose an annotation or **New annotation**. Set its name, notes, geometry, coordinates, colour and visibility. Paths need at least two points; areas need at least three non-collinear points. Volumes also need a positive height. Add or remove coordinates using labelled controls, then apply to the draft.
4. Save the shared revision. Editing is subject to server authorization; a signed-in browser is not assumed to have write authority. A 403 preserves the draft and marks editing unavailable until a session recheck.
5. If another editor saved first, compare the local and shared versions. Unrelated edits merge automatically. Choose a version for every competing annotation, including deletion conflicts, apply the reviewed merge, and save again. A second conflict repeats this process against the new shared revision.

Menu navigation and closing the menu retain the in-memory draft. A changed form must be applied or discarded before selecting another annotation. Reload is disabled while changes exist. Leaving the page requests the browser's unsaved-work confirmation; browser limitations still apply. Download the draft before leaving. The download uses the Worldlens marker-studio export schema and can be imported in Worldlens. This viewer does not yet provide draft-file import or browser-restart persistence.

## HTTP contract and security

- `GET /bridge/managed-session` reads `signedIn`.
- `POST /bridge/managed-session` sends `{username,password}` as JSON and lets the host set its same-origin session cookie.
- `GET /bridge/annotations?projectId=...&mapId=...&dimension=...` returns `{version:1,identity,revision,updatedAt,updatedBy,annotations}`.
- `PUT` to the same annotation URL sends `{expectedRevision,annotations}`. Responses must retain the exact project/map/dimension identity.
- 401 requests sign-in. 403 reports unavailable editor authority. 409 validates `{current}` and preserves the local draft for review. Network errors and 15-second timeouts retain the draft. Requests refuse redirects, use `credentials: same-origin`, and disable caching.

Annotation documents are bounded to 500 unique markers, with world-coordinate, text and geometry limits compatible with the Worldlens marker model. Unsupported or malformed documents are rejected as a whole. Unknown marker fields survive round trips, but rendering uses an explicit safe allowlist: annotation text is HTML-escaped; annotations cannot supply HTML, links, script, icon URLs or CSS classes. The existing Three.js terrain and projection algorithms are unchanged. Source marker refreshes preserve the dedicated shared set.

No command execution, bots, server administration, role creation or authority escalation is available through this static viewer. The host must enforce HTTPS for network sign-in, session authority, same-origin writes, storage privacy and revision serialization.

## Verification and remaining acceptance

Run the focused protocol checks from the repository root:

```text
node --test common/webapp/tests/annotations.test.mjs
```

Seven checks cover configuration routing, identity and geometry rejection, safe text rendering, three-way conflict handling, request options, authenticated error paths and numeric field normalization. Vue single-file components receive focused compiler validation. These checks do not substitute for the root `build.bat` or real built-viewer interaction.

Pending acceptance: build through the root entrypoint, host the exact exported viewer against the real annotation service, exercise sign-in and server-refused access, save/readback with two browser sessions, verify conflicting edits/deletes, verify source marker refresh and map switching, and inspect desktop/narrow layouts, keyboard access, English/Cantonese/bilingual text, themes and supported scales. Real runtime screenshots are not included by this source-only lane. Full regex tooling and unrelated universal feature coverage are not claimed.

## 廣東話

主機可在匯出檢視器首頁旁放置 `worldlens-hosting.json`，指定專案、地圖及維度。未設定時維持獨立檢視模式。共用註記使用同源登入及伺服器版本檢查；登入不代表具備編輯權限。

從主選單開啟共用註記，登入後選擇指定地圖。可編輯地點備註、路線、區域和立體區域，使用有標籤的座標欄位新增或移除點，再套用至草稿及儲存。若另一位編輯先行儲存，請逐項比較本機與共用版本，選擇保留哪一項，再套用合併並重新儲存。互不重疊的修改會自動合併；衝突不會自動覆蓋。

關閉選單不會遺失記憶體內草稿。離開頁面前請下載草稿；本檢視器尚未提供重新啟動後還原或草稿檔匯入。下載檔使用 Worldlens 標記格式，可在 Worldlens 匯入。連線中斷、權限不足或版本衝突均保留草稿。真正建置版本的登入、雙工作階段衝突、鍵盤、窄版面、主題及語言驗收仍待完成，不能以原始碼檢查代替。
