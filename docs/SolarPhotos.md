# 太陽系照片與比例說明

圖片與逐張作者、原始檔案頁、授權連結、修改方式，統一記錄於 `src/components/globeTest/solarPhotos.json`。2026-11-15 透過 Wikimedia Commons imageinfo / extmetadata 核對，木星另核對檔案頁的 Licensing 段落（JPL Image 使用條款，非自行推定為 CC 授權）。目前沒有缺少必要授權欄位的圖片。

照片現位於 `public/images/solar/`（2026-11-21 統一整理；沿用既有檔案，沒有重新下載或轉檔）。最新逐張核對資料見 `docs/ResearchImageLicenses.json`，圖片引用由共用 `photoUrl` 套用 Vite `BASE_URL`。天王星原始 TIFF 轉 JPEG；太陽與天王星等比例縮小至最長邊 1280，其餘採 Commons 1280px 縮圖。所有圖片完整顯示於 4:3 框，沒有裁切。

照片直接使用自然／人文閱讀頁的 `ReadingPhoto` → `ResearchPhoto` + `PhotoCredit`，原來限於自然頁的圖框、留白及右下角資訊按鈕樣式已抽到 `research/ResearchPhoto.css`，由三個頁面共用。移除 `SolarPhoto` 與底部授權列；共用 ReadingPhoto 也支援直接點擊圖片，鍵盤使用右下角資訊按鈕。原生版權 dialog 維持同一元件，關閉後先解除原生模態再返回按鈕焦點。

行星筆記改用整幅觀測照片、黃底影像標籤、雙欄數據與薄荷色分隔線。筆記本原始 CSS 加上視窗寬度上限，避免版面編輯器保存的 632.69px 寬度令手機內容超出可視範圍。

比例說明使用一個共用原生 dialog。沿用 `WorkDialog` 的 AnimatePresence／motion 分層進退場機制，以及 `CharacterFile` 的輕微位移、縮放與 easing；紙張、墨色、薄荷邊線、黃底標籤、黃銅星號來自現有 Edition／Globe 視覺。卡片與遮罩同時淡入淡出，退場結束才卸載 dialog、解除焦點限制；Escape 會防止瀏覽器提前關閉。useReducedMotion 會取消位移、縮放及動畫時間。

自動顯示記錄仍只存於 solarIntroduction 模組記憶體，離開觀測頁後重進不重複，完整重新整理後重置。手動開啟不讀寫該記錄。

本次調整檔案：
- `globeTest/ResearchNotes.jsx`、`GlobeTest.jsx`、`GlobeTest.css`：觀測照片與數據構圖、共用視窗退場生命週期、面板寬度上限。
- `globeTest/SolarScaleDialog.jsx`、新增 `SolarObservation.css`：比例筆記卡及進退場動畫；移除 `SolarPhoto.jsx`。
- `research/ReadingPhoto.jsx`、`ResearchPhoto.jsx`、`PhotoCredit.jsx`、新增 `ResearchPhoto.css`：共用照片樣式、圖片點擊與版權視窗焦點修正。
- `naturalTest/NaturalTest.css`：移除已抽出的圖片樣式，保留原有頁面專屬排版。
- `docs/SolarPhotos.md`：實作及驗證紀錄。圖片來源資料與所有圖片檔未更動。

驗證（2026-11-15）：
- `node --test src/components/globeTest/solarPhotos.test.mjs src/components/globeTest/globeContent.test.mjs`：7 項通過，涵蓋全部本機照片、授權欄位、首次顯示／重載狀態及既有介紹內容解析。
- `npm run build` 通過，`git diff --check` 通過。
- Chrome 實際檢查桌面、390 × 844 手機與 800 × 600 預覽；地球、木星及長幅土星照片的完整顯示，手機數據捲動閱讀，比例圖及土星圖片點擊版權、Escape 與焦點返回，標題資訊按鈕手動重開及鍵盤操作。
- DevTools Animations 以 10% 播放檢查進退場，觀察退場過程保留卡片與遮罩，結束後解除模態；另切換 prefers-reduced-motion 模擬檢查，完成後還原播放速度與模擬偏好。
