# BigTest 正式接入與驗證

日期：2026-10-10。

## 接入

App 的正式 scene 與開發 big-test 均掛載既有 BigTest，沒有重建視覺或第二份 WebGL renderer。MainScene 仍是共用 3D／互動核心，舊 Big 的裝飾與文件元件仍保留。正式無 query 入口維持 Intro → Story → Main → Big。

NaturalTest／HumanTest／BallTest 改為正式建置可用的 lazy 元件。模型 book-open1、book-close1、ball 的原有直接入口不再受 DEV 條件限制。globe、telescope 的既有進入方式不變；首次望遠鏡仍經 TComicPage。圓形揭幕和 returnFromPortal 共用原有程式。

## 本次修改檔案

- src/App.jsx：正式掛載與目的地 lazy 引用。
- src/components/MainScene.jsx：三個直接物件入口解除 DEV 限制。
- src/components/bigTest/BigTest.jsx：正式唯讀文字還原與草稿文字顯示。
- src/components/bigTest/EditableText.jsx：接入唯讀正式文字 hook。
- src/dev/useEditableText.js：新增 opt-in 正式文字讀取，其他頁面的 hook 行為不變。
- src/dev/textEditorStore.js：正式模式不訂閱／寫入 localStorage。
- src/dev/TextDraftLayer.jsx：正式僅顯示已保存草稿，不註冊開發 DOM。
- unused-assets-report.md：唯讀素材候選盤點。
- docs/BigTest-integration.md：本記錄。

## 設定與資料

BigTest 的 ID 前綴 big-test- 和儲存鍵 genesis:text-editor:big-test:v1 保持不變；正式 scene 的 TEXT pageId 亦使用 big-test，以保留既有草稿範圍。正式建置讀取已保存值，不遷移、清空、重設或覆写儲存資料；開發模式沿用原有編輯／保存功能。

BigTest 幾何、動畫與鏡頭適配仍沿用原 config／viewportFraming；模型 renderer 和互動未改寫。舊 Big 的 layout-editor:big-leftside 及各 expanded 文件鍵不遷移至新版，其原資料仍保留。原 3D 編輯器沒有查到獨立的 localStorage 自動保存機制，不能宣稱新增了其保存能力。

Big 頁物件介紹筆記的六個 ENTER 位置使用獨立文字編輯器項目（`big-test-enter-position-{interactionId}`），以筆記紙張為基準使用中心百分比座標；拖曳與座標欄位的變更沿用 `genesis:text-editor:big-test:v1` 自動保存。使用者提供的編輯器匯出資料包含六個物件各自的座標，已作為各自的預設值恢復；現有的每物件保存值仍優先於預設值。

localStorage 受 origin 限制：原開發網址的設定不會自行跨 port／網域出現在部署站。如需跨來源設定，須另行使用既有匯出資料確認，這次不做資料搬移。

## 實際測試

使用 Chrome 與 npm run preview 的正式建置（http://127.0.0.1:4174/，無 dev query）。瀏覽器截圖尺寸 1852 × 1266，含瀏覽器 UI；本次未量測 CSS viewport，不把此數字當成頁面可用尺寸。

| 項目 | 實際結果 |
| --- | --- |
| Intro → Story → Main → Big | 完整逐步操作到新版 Big；主模型與新版 UI 出現 |
| book-open1 → NaturalTest → BACK | 模型單次點擊直接進入，揭幕與返回新版 Big 正常 |
| book-close1 → HumanTest → BACK | 模型單次點擊直接進入，揭幕與返回新版 Big 正常 |
| ball → BallTest → BACK | 直接進入 OUR FAVORITES!，揭幕與返回正常 |
| globe → Globe → BACK | 既有 Globe 模型顯示，返回新版 Big 正常 |
| telescope → TComicPage → Telescope → BACK | 首次揭幕、漫畫逐頁推進、正式 MAP／VIEW 介面與真實地圖出現，返回新版 Big 正常 |
| 模型介紹／聚焦 | 點擊 chair2 顯示介紹；模型左移放大、三組背景聯動；空白點擊後復位 |
| Daily Maintenance | 點擊任一圓點全組展開，再次點擊全組收合 |
| Letter、Diary、Notes | 三者均能開啟與關閉；白色模糊遮罩、面板、文字與網點可見 |
| TEXT | 開發 http://127.0.0.1:5174/?dev=big-test 可開啟原編輯器；刷新前後標題 X=26、Y=1、字級=27、字體 Playfair Display、色彩 #fffef8 相同；未修改任何欄位 |
| npm run build | 通過；既有大 chunk 警告仍存在 |

正式建置 saved-text／draft 的讀取與不寫入條件已檢查；未在 production origin 注入測試設定。未逐項測試所有模型 Hover／拖曳、介紹卡堆疊、重訪望遠鏡、所有子頁完整功能或多種視窗尺寸；本次不宣稱這些項目全部通過。所有素材與使用者資料未刪除。

## 素材盤點

見根目錄 unused-assets-report.md：A 30、B 32、C 104 個資源。A/B 均為人工候選；尤其舊 Big 資源仍有 import，解除程式引用之前不能刪除。報告列出逐檔路徑、類型、大小、理由、信心與舊 Big 關係。
