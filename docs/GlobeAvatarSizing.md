# Globe 閒聊頭像尺寸排查

## 根因與修復

27 張角色原圖皆為 2048×2048，正常設計為 84×84 外框與 `object-fit: contain`。
問題來自 `DomPageAdapter`，不是圖片比例：

- Globe 已發布版面含 469 個頭像按鈕的 84px 快照，以及 469 個圖片的 100px 快照；這 938 筆的 `changedFields` 皆為空，並非人為編輯。
- 隱藏圖片的 computed width/height 可回傳 `100%`；舊 `parseFloat` 將它誤認成 100px。
- Adapter 忽略 `changedFields`，套用未編輯的快照；之後又把自身寫入的尺寸量成預設值，依數值比較反覆移除、重加行內尺寸。內容切換、圖片 load、resize 都會觸發重掃。
- 因此外框仍為 84px，圖片卻間歇變成 100px，受到 overflow 裁切，看起來像頭像突然放大。

修復集中於 `src/dev/domLayout.js` 與 `DomPageAdapter.jsx`：僅套用明確修改的欄位，保留舊式稀疏草稿相容性；將百分比與 px 測量區分；以覆寫意圖決定行內樣式，避免自身量測回饋。頭像標示 `data-layout-owned="component"`，按鈕與圖片尺寸由元件共同管理，舊頭像草稿不再介入。沒有清除使用者 localStorage 或變更設定 revision。

`StoryDialog.jsx` 與 `GlobeTest.css` 統一 button/div 外框的 flex 尺寸與 reset，文字區使用獨立的可收縮 flex 欄；保留 84px、14px 圓角、原有 contain 與角色檔案點擊功能。移除 config 中 938 筆未編輯頭像快照，保留其餘紀錄與真正修改過的筆記寬度。

## 實際驗證

開發回歸頁：`http://localhost:5186/scripts/fixtures/globe-avatar.html`。
它使用真實 StoryDialog、所有閒聊資料、DomPageAdapter 與 CharacterFile，透過 computed styles、圖片 complete/naturalWidth 與 MutationObserver 採樣；版面草稿只放在記憶體，不改寫使用者草稿。

| 情境 | 結果 |
| --- | --- |
| 修復前相同切換流程 | 3,935 次採樣、241 次異常、364 次頭像行內樣式變動；實際觀測到 84px 外框 / 100px 圖片 |
| 修復後相同切換流程 | 3,935 次採樣、0 次異常、0 次頭像行內樣式變動 |
| 新圖片 URL、未完成載入時快速切換 | 5,463 次採樣，包含未載入狀態，0 次異常 |
| 回放舊頭像草稿（210×42、旋轉 7 度） | 仍為 84×84，0 次異常 |
| 390px 視窗、編輯器開啟 | 3,936 次採樣、0 次異常 |
| 320px 視窗、編輯器關閉 | 3,936 次採樣、0 次異常 |
| 重新整理後再執行切換 | 3,935 次採樣、0 次異常 |

切換流程涵蓋所有有內容章節的首、第二、中間、末句，以及 24 名實際發言角色，並開啟真實角色檔案卡再關閉返回。

自動回歸：`node --test src/dev/domLayout.test.mjs src/components/globeTest/globeContent.test.mjs src/components/globeTest/solarPhotos.test.mjs src/components/research/articleMarkdown.test.mjs`（27 項）。另執行 `node scripts/check-editor-store.mjs` 與 `npm run build`。

限制：瀏覽器實測為桌面 Chrome（含裝置尺寸模擬），回歸頁隔離地球 WebGL 模型；未完成其他瀏覽器、真實手機與長時間背景分頁測試。已重現並修復上述尺寸覆寫路徑，不宣稱排除所有尚未觀測的環境問題。
