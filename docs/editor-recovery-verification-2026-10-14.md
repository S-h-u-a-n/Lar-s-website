# 編輯器恢復驗證 — 2026-10-14

## 工作區與既有證據

- 開始時 Git 有 29 個已追蹤檔案修改，以及編輯器、天氣頁與素材等未追蹤成果。未重設工作區、清除草稿或 commit。
- 已讀取 2026-10-13 20:14–21:22 的 Codex session 交接紀錄。昨天已實測主要頁面的開啟／切換／關閉與 Config、文字與版面拖曳、Globe gizmo 與 mesh 選取、材質重載、動態文件、Add Text 重載、Bottled Weather 筆刷與往返。本文件將此列為「沿用昨天紀錄」，不宣稱今天重做全部操作。
- 昨天尚待：最新尺寸量測／觀察器回歸、正式版實際開頁、響應式與特殊巢狀座標、最終文件。

## 今日通過

1. `node scripts/check-editor-store.mjs`：頁面隔離、舊同名草稿分離、開啟與註冊不寫回、只在修改時保存、Config 範圍、Add/Delete、損壞文字草稿保留。使用獨立 Map，不接觸瀏覽器草稿。
2. `npm run build` 成功；`git diff --check` 通過。建置仍有既有的大 chunk 提示。
3. 最新 DOM 適配層：封面、研究室、Globe、Telescope、自然、人文、作品、Bottled Weather 都能開啟 IMG，列出實際元素與有限的寬高數值。兩個漫畫確認沿用原生 LayoutEditor。
4. Bottled Weather TEXT：選取「把一場天氣，倒進世界裡。」；X 由 0 改 3，DOM 出現 `translate: 3px`。Config 的 `pageId=bottled-weather`、元素 ID `codex-bottled-weather-dom-p-ft109e`、x=3 與 selector 正確。
5. Bottled Weather IMG：選取 margin note，X 由 0 改 4。Config 有正確頁面、元素 ID、x=4、`changedFields=[x]` 及 local CSS px 座標。重載後輸入值與 DOM translate 仍為 4。Escape 關閉面板。
6. 開場 earth-me.glb：開啟 3D，修改 root position X=0.1、rotation Z=12°、scale X=0.011；Copy JSON 含 `pageId=intro`、模型名、物件路徑及三組數值；重載後三組值仍正確。關閉編輯器後面板消失。
7. 動態來信：關閉 IMG 後原有「來信」按鈕可開啟文件；再次開啟 IMG 可列出 document-panel 與 cover；Escape 只關編輯器，文件保留，再用 Close 正常關閉。自然分類按鈕在關閉編輯器後可完成內容展開。
8. 正式版實際載入開場、封面、研究室、Globe、Telescope、自然、人文、作品、創世漫畫、Telescope 漫畫及天氣頁：編輯器入口／文字／版面／3D 面板數量均為 0。正式 JS 產物不含 Text Editor、Copy Config、Model Transform 或 TransformControls 實作字串。仍保留 LayoutEditor 用於正式漫畫的圖片呈現及部分 CSS／排除選擇器；不能稱所有編輯器相關字串與樣式均被刪除。
9. 正式 Bottled Weather：從研究室工具進入、選取陽光（aria-pressed=true）、返回研究室，已探索標記正常。筆刷完整行為沿用昨天紀錄。

上述測試修改的文字／版面 X 與開場模型三個欄位已逐欄恢復測試前值；未使用 Clear Draft、Reset Page 或 Reset All。保存鍵可能新增測試欄位的原值，未刪除任何既有草稿。

## 本次直接修復

- DOM 版面草稿 JSON 損壞或不是已知陣列格式时，原先只警告、下次修改仍可能覆寫。現在禁止寫回不可讀草稿，記憶體修改仍可匯出。
- 3D 變形草稿同樣補上不可讀／非物件格式保護；切換模型時先清空記憶體快取，避免沿用前一模型資料。保存各物件時保留未知既有欄位。
- 材質保存拒絕非物件格式；恢復 opacity 草稿時同步設定 transparent，避免小於 1 的 opacity 在重載後未啟用透明渲染。
- 修改限於 `DomPageAdapter.jsx`、`ModelTransformEditor.jsx`、`ModelMaterialEditor.jsx` 及本驗證文件。沒有重構天氣模擬或其他功能。

## 未驗證／剩餘手動項目

- **未驗證**：本次新增的損壞版面／變形／材質格式保護之瀏覽器故障注入，以及材質透明度重載的視覺效果。已做程式檢查與建置，但既有文字 store 測試不涵蓋這三個元件。沒有為故障注入污染使用者草稿。
- **未驗證**：手機／平板響應式。嘗試 390×844 override 後 DOM 仍回報 1512×805，因此未視為有效尺寸測試；已 reset override。
- **未驗證**：特殊多層旋轉、非均勻縮放、3D perspective、零比例父層下的完整拖曳座標矩陣；一般縮放拖曳沿用昨天測試。
- **未驗證**：所有動畫的逐幀視覺與全部路徑的完整回歸、所有模型／mesh／材質欄位的排列組合、所有天氣結局及地圖外部資源可用性。今天的正式版載入與入口檢查不能替代這些測試。

## 支援範圍（開發模式）

| 正式頁面 | pageId | 編輯器 |
| --- | --- | --- |
| 開場 | intro | TEXT、IMG/DOM 版面、3D 變形／材質／Earth shader |
| 世界封面 | home | TEXT、IMG/DOM 版面 |
| 創世研究室／Big | big-test | TEXT、IMG/DOM 版面（含動態文件與介紹）、3D 變形／材質 |
| 天體觀測 | globe-test | TEXT、IMG/DOM 版面、3D 變形／材質／shader |
| 遠方的地球／Telescope | telescope-test | TEXT、IMG/DOM 版面；地圖不是 3D 模型編輯器 |
| 自然研究 | natural-test | TEXT、IMG/DOM 版面 |
| 人文研究 | human-test | TEXT、IMG/DOM 版面 |
| 喜愛的作品 | ball-test | TEXT、IMG/DOM 版面 |
| 魔法天氣藥水 | bottled-weather | TEXT、IMG/DOM 版面；像素模擬 canvas 不提供 3D 編輯 |
| 創世故事 | comic | TEXT、原生 storybook-intro IMG；圖中烘焙文字不屬於可編輯 DOM 文字 |
| 望遠鏡的故事 | t-comic | TEXT、原生 t-comic IMG；圖中烘焙文字不屬於可編輯 DOM 文字 |

3D 的 cosmos_plane_01 billboard 旋轉由既有 render loop 控制，編輯器明確唯讀。IMG 為既有元素的位置／尺寸／旋轉／層級編輯，不等於替換素材或重建 canvas。其他尚未實作的 portal placeholder 依實際 DOM 提供文字及圖片／SVG 目標，不宣稱有模型。
