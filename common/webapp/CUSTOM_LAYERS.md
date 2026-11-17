# Custom layers

The viewer can show extra layers provided by the map's server. Place a file named `custom-layers.json` beside the viewer's entry page. If the file does not exist (HTTP 404) the feature stays completely out of the way and the menu entry is not shown. A sample is in `public/custom-layers.example.json`.

The viewer loads the file from the same origin (`cache: no-store`, 15 second timeout), validates it strictly, refetches it every 60 seconds and whenever you press **Reload layers**. If a reload fails or the file is invalid, the last good version stays on the map and the panel shows what is wrong and where.

## File format

```json
{
  "version": 1,
  "updatedAt": "2026-11-17T18:00:00Z",
  "layers": [
    {
      "id": "stations",
      "label": "Stations",
      "description": "optional text",
      "icon": "train",
      "colour": "#3f8ae0",
      "defaultVisible": true,
      "features": [
        { "id": "f1", "type": "point", "map": "world", "label": "Central", "detail": "optional text",
          "position": { "x": 0, "y": 64, "z": 0 }, "tags": ["optional"] },
        { "id": "f2", "type": "line", "map": "world", "label": "Line 1",
          "points": [{ "x": 0, "y": 64, "z": 0 }, { "x": 100, "y": 64, "z": 0 }] },
        { "id": "f3", "type": "area", "map": "world", "label": "Plot",
          "points": [{ "x": 0, "y": 64, "z": 0 }, { "x": 10, "y": 64, "z": 0 }, { "x": 10, "y": 64, "z": 10 }],
          "minY": 60, "maxY": 80 }
      ]
    }
  ]
}
```

| Field | Rule |
| --- | --- |
| `version` | Must be `1`. |
| `layers` | At most 64 layers and 5000 features in total. |
| layer `id` | `[a-z0-9_-]{1,64}`, unique. |
| layer `label` | 1 to 80 characters. `description` is optional, up to 500. |
| layer `icon` | One of `pin`, `star`, `info`, `home`, `shop`, `train`, `rail`, `elevator`, `bank`, `food`, `toilet`, `ball`, `plot`, `island`, `warp`, `portal`, `flag` (default `pin`). |
| layer `colour` | `#rrggbb` (default `#3f8ae0`). `defaultVisible` defaults to `true`. |
| feature `id` | 1 to 100 characters, unique within its layer. |
| feature `type` | `point` (needs `position`), `line` (2 to 512 `points`) or `area` (3 to 512 `points`). |
| `map` | The BlueMap map id. A feature is drawn only while that map is shown. |
| feature `label` / `detail` / `tags` | Label 1 to 160 characters, detail up to 2000, up to 20 tags of 1 to 40 characters. |
| coordinates | Finite numbers, `x` and `z` within 30,000,000, `y` from -2048 to 2048. |
| `minY` / `maxY` | Optional on an `area`. When given, both must be numbers with `maxY` above `minY`, and the area is drawn as a volume. |

Unknown fields are ignored. Any invalid field rejects the whole file. All text is shown as plain text: the file cannot supply HTML, links, scripts, icon URLs or style classes. Points use a built-in icon tinted with the layer colour, lines and areas use the viewer's line and shape markers. Every layer is its own marker set, separate from the server's own marker sets and from shared annotations.

## Using the panel

Open **Custom layers** in the main menu (it appears only when the file exists).

- **Layers**: each layer shows its icon, colour and the number of features on the current map, with a visibility switch. **Show all** and **Hide all** act on every layer.
- **Settings per layer** (the arrow on each row): colour (picker and swatches), opacity, icon size (small, medium, large), labels (always, on hover, never), maximum view distance in blocks, and **Reset to the server default**.
- **Search**: type to search names, notes and tags of the features on the map you are viewing. Switch on the regular expression button for a pattern builder with insertable tokens, the flags `i`, `m`, `s` and `u`, a validity message and a sample text tester. Patterns are limited to 200 characters and results to 200. Each result and each feature in a layer's list has **Fly to**, which moves the camera there.
- **Details**: choosing a feature opens a sheet with its label, notes, tags and coordinates, a **Copy** button and **Fly to**.
- **Settings storage**: choices are kept in the browser's local storage for this viewer address. **Export settings** downloads them as JSON, **Import settings** reads that JSON back, **Reset all** clears them. Nothing is sent to the server.
- A status line shows when the file was loaded, its layer and feature counts and any load error, with a reload button.

The panel is keyboard accessible, uses full width on narrow screens (checked at 390 px) and respects reduced motion. Text appears in English, Cantonese (Hong Kong) or both, following the viewer's language setting.

## Hosting

Serve `custom-layers.json` from the same directory as the viewer's `index.html`. Replace it at any time; open viewers pick up the change within a minute.

## Checks

```text
node --test common/webapp/tests/
```

`customLayers.test.mjs` covers a valid file, every rejection rule, the layer and feature caps, text escaping, settings sanitising and round trips, the search modes and the bundled example.

## 廣東話

檢視器可顯示由地圖伺服器提供的額外圖層。請在檢視器首頁旁放置 `custom-layers.json`；若檔案不存在（HTTP 404），此功能不會出現，選單亦不會顯示入口。範例見 `public/custom-layers.example.json`。

檢視器會從同一來源載入檔案，並嚴格驗證，每 60 秒及按下「重新載入圖層」時重新讀取。若重新載入失敗或檔案無效，地圖會保留上一個正常版本，面板會指出錯誤位置。

### 檔案格式

格式見上方英文範例。重點：`version` 必須是 `1`；最多 64 個圖層、合共 5000 個項目；圖層 `id` 只可用 `a-z`、`0-9`、`_`、`-`，長度 1 至 64 且不可重複；`icon` 可選 `pin`、`star`、`info`、`home`、`shop`、`train`、`rail`、`elevator`、`bank`、`food`、`toilet`、`ball`、`plot`、`island`、`warp`、`portal`、`flag`；`colour` 為 `#rrggbb`。項目類型有 `point`（地點，需要 `position`）、`line`（路線，2 至 512 點）及 `area`（區域，3 至 512 點，可加 `minY`／`maxY` 成為立體區域）。`map` 是 BlueMap 的地圖識別碼，只有該地圖顯示時才會繪製該項目。

未知欄位會被忽略；任何欄位無效，整個檔案都會被拒絕。所有文字都以純文字顯示，檔案不能提供 HTML、連結、腳本、圖示網址或樣式類別。每個圖層都是獨立的標記集，與伺服器自己的標記及共用註記分開。

### 使用面板

在主選單開啟「自訂圖層」（只有檔案存在時才會出現）。

- **圖層**：顯示圖示、顏色、目前地圖上的項目數目及顯示開關；可「全部顯示」或「全部隱藏」。
- **每個圖層的設定**：顏色（色盤及色板）、不透明度、圖示大小、標籤顯示（一律、懸停、不顯示）、最遠顯示距離（方塊），以及「重設為伺服器預設」。
- **搜尋**：搜尋目前地圖上項目的名稱、備註及標籤。開啟正規表達式按鈕後，可使用建構器插入常用符號、選擇旗標 `i`、`m`、`s`、`u`、查看有效性訊息及用範例文字測試。搜尋字串上限 200 字元，結果上限 200 個。每個結果及圖層項目清單都有「飛往」，會將鏡頭移到該處。
- **詳情**：選擇項目會開啟詳情面板，顯示名稱、備註、標籤、座標、「複製」及「飛往」。
- **設定儲存**：選擇會保存在此檢視器網址的瀏覽器本機儲存空間。「匯出設定」下載 JSON，「匯入設定」讀回，「全部重設」清除。不會傳送到伺服器。
- 狀態列顯示載入時間、圖層及項目數目、載入錯誤，以及重新載入按鈕。

面板支援鍵盤操作，窄螢幕（360 px 起）會佔滿寬度，並尊重減少動態效果的設定。文字會按檢視器語言顯示英文、粵語或雙語。
