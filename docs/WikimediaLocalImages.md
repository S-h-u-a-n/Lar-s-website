# Wikimedia 圖片本機化驗證

完成日期：2026-11-21。

## 盤點與處理

掃描專案 Markdown、JS/JSX、CSS、JSON 及其他文字檔，排除 node_modules、.git 與 dist。所有目前使用的 Commons 圖片均由 `commonsPhotos.json`、`solarPhotos.json` 資料陣列提供，透過 `ReadingPhoto` → `ResearchPhoto` 顯示；Markdown 提供文章正文，沒有 Wikimedia 圖片語法需要另行轉換。授權來源及下載網址保留為資訊連結，不作為 img 的遠端 src。

圖片原本已是本機檔案，真正的部署問題是 `/research-photos/`、`/solar-photos/` 的絕對路徑繞過 Vite base。81 張均沿用既有檔案，移至 `public/images/{natural,human,solar}/`；未重新下載或重新壓縮。新增 `photoUrl` 只處理本次 `/images/` 圖片，由 `import.meta.env.BASE_URL` 組合公開網址。保留原有順序、尺寸、比例、object-fit、延遲載入與授權視窗；動畫 GIF 與 PNG 原樣保留。

原創 food-culture 照片與其他非 Commons 素材的檔案、名稱及資料引用均未改動。未被目前資料引用的舊素材保留原位，避免誤刪。

| 分類 | 張數 | Commons 原始檔案合計（bytes） | 目前網站版本（bytes） |
|---|---:|---:|---:|
| natural | 36 | 351,007,509 | 18,585,631 |
| human | 33 | 846,075,474 | 18,171,434 |
| solar | 12 | 64,560,042 | 3,099,587 |
| 合計 | 81 | 1,261,643,025 | 39,856,652 |

- 本次新增下載：0；下載失敗：0；成功沿用及搬移：81。
- 本次搬移前後皆為 39,856,652 bytes（約 39.86 MB），每張 SHA-256 完全相同；沒有宣稱本次有額外壓縮效果。
- Commons 原始大小由本次 imageinfo 查得；既有網站版本合計較原始檔小約 96.84%。原始圖包含非常大的高解析度檔，沒有為了統計而下載原圖。
- 圖片沿用適合既有閱讀圖框及高解析度螢幕的 1280px／1920px 等版本；低解析度圖片與動畫未放大，沒有強制統一尺寸。
- 81 個來源頁、81 個本機路徑、81 個不同檔案雜湊；無重複素材或缺少檔案。

## 授權

2026-11-21 透過 Commons API 逐張查閱檔案頁 imageinfo/extmetadata、來源頁修訂 ID 與原始檔案大小；特殊授權另查頁面 wikitext。保留原有逐張 ⓘ 視窗，更新其核對日期與實際作者／授權資料；沒有新增另一套前端授權系統。

完整逐張資料見 [ResearchImageLicenses.md](ResearchImageLicenses.md) 與 [ResearchImageLicenses.json](ResearchImageLicenses.json)。JSON 保留 Commons 原始授權中繼資料、官方縮圖網址、原始檔案網址、作者、條款連結、修改紀錄、修訂 ID、目前檔案大小與 SHA-256。木星維持 JPL 條款；手斧採檔案頁明列的 CC0 替代授權。

## 已執行驗證

- 24 項測試全部通過：圖片、來源／授權、檔案完整性、無重複、根目錄及兩種子路徑解析、原創照片、GIF、文章 Markdown 與圖片順序、天體資料。
- `npm run build` 通過；建置保留既有超過 500 kB bundle 提醒。
- 根目錄開發伺服器 `http://127.0.0.1:5187/`：81/81 圖片 HTTP 成功且 SHA-256 相符。
- 模擬 GitHub Pages 正式產物預覽 `http://127.0.0.1:4186/Lar-s-website/`：81/81 圖片 HTTP 成功且 SHA-256 相符。
- `node scripts/check-commons-images.mjs` 驗證本機全部檔案；可附上網站根網址，重跑 HTTP 狀態、圖片 MIME 與雜湊檢查。
- 原創照片與 Git HEAD 的二進位內容相同。
- 瀏覽器控制服務回報 unavailable，無法完成實際瀏覽器畫面及互動測試；HTTP、SSR 與檔案檢查不能取代目視驗證。
- 既有 `origin-of-life.md` 標題與主題名稱不同的測試提示仍存在，未修改文章正文。

## 正式部署後確認

1. GitHub Pages 使用的 repository 路徑與 `vite.config.js` 的 `/Lar-s-website/` 一致；發布包含本次 `public/images/` 的完整建置產物。
2. 在正式網址執行 `node scripts/check-commons-images.mjs https://你的網域/Lar-s-website/`，確認 81 張回應、MIME 與內容均正確。
3. 桌面及手機實際開啟自然、人文與天體閱讀頁，確認圖片完整顯示、GIF 播放、ⓘ 授權視窗、連結與關閉互動；重新整理並排除舊快取影響。
