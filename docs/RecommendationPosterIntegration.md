# 推薦頁海報本地整合紀錄

日期：2026-11-21。依使用者後續明確指示將全部指定海報整合至本地；保留原有來源、作品權利相關方、授權查核資料與侵權處理聲明。本次沒有重新調查，也未將整合要求記作第三方授權。

## 整合結果

- 15 張成功下載、0 張失敗，15 個不同 SHA-256，無重複檔案。
- 下載版本合計 2,747,677 bytes；處理後合計 **2,627,902 bytes（約 2.63 MB）**。這是實際取得之網頁尺寸檔案的比較，不是原始超大圖容量的比較。
- 9 張 TMDB 海報採用相同檔名的官方 w780 版本。其他圖片沿用指定網址；Fate/Grand Order 等比例由 1400 × 1347 縮為 1200 × 1154，JPEG 適度壓縮。其他檔案保留已壓縮的下載內容，避免重新編碼反而變大。
- 保留原始比例及既有 WebP；沒有永久裁切或放大小圖。卡片沿用 cover、詳情沿用 contain；沒有更動圖片框尺寸、圓角或排版。
- Okay for Now（300 × 450）與 All Tomorrows（189 × 267）為指定 Google 快取解析度，未擅自換圖或放大；大尺寸螢幕可能較模糊。
- 音樂六部及內容不變。其他五類各三部，分類順序沿用現況，各類作品依指定順序。Deadpool、Persona 3 Reload 原有推薦正文與對話保留；13 部新作品文案留空。
- 原有 REMOANPU 自繪海報檔案留存，現行作品資料改指向本次指定海報。兩篇 Markdown 僅修正海報來源描述，推薦正文不變。
- 所有逐張來源、尺寸、處理紀錄、下載及最終 SHA-256 記於 [posterSources.json](../src/components/ballTest/posterSources.json)。既有 `permissionStatus` 保留，不把下載成功視為權利確認。

## 本地圖片清單

| 作品 | 本地路徑 | 尺寸 px | 容量 bytes |
|---|---|---|---|
| The Big Short | `/images/recommendations/movies/the-big-short.jpg` | 780 × 1170 | 213,841 |
| The Parent Trap | `/images/recommendations/movies/the-parent-trap.jpg` | 780 × 1171 | 137,745 |
| Deadpool | `/images/recommendations/movies/deadpool.jpg` | 780 × 1170 | 157,400 |
| HUNTER × HUNTER | `/images/recommendations/anime/hunter-x-hunter.jpg` | 780 × 1170 | 267,882 |
| WITCH WATCH | `/images/recommendations/anime/witch-watch.jpg` | 780 × 1103 | 233,650 |
| 月刊少女野崎くん | `/images/recommendations/anime/monthly-girls-nozaki-kun.jpg` | 780 × 1103 | 251,787 |
| 老窮奇幻紀事 | `/images/recommendations/literature/old-poverty-chronicles.webp` | 348 × 348 | 11,336 |
| Okay for Now | `/images/recommendations/literature/okay-for-now.jpg` | 300 × 450 | 13,973 |
| All Tomorrows | `/images/recommendations/literature/all-tomorrows.jpg` | 189 × 267 | 9,024 |
| Hamilton | `/images/recommendations/performing-arts/hamilton.jpg` | 780 × 1170 | 207,190 |
| Come From Away | `/images/recommendations/performing-arts/come-from-away.jpg` | 780 × 1170 | 342,264 |
| Next to Normal | `/images/recommendations/performing-arts/next-to-normal.jpg` | 780 × 1170 | 275,023 |
| Persona 3 Reload | `/images/recommendations/games/persona-3-reload.jpg` | 533 × 800 | 93,337 |
| 人狼村之謎（Raging Loop／レイジングループ） | `/images/recommendations/games/raging-loop.webp` | 440 × 440 | 36,026 |
| Fate/Grand Order | `/images/recommendations/games/fate-grand-order.jpg` | 1200 × 1154 | 377,424 |

## 驗證

- 推薦頁資料、圖片、角色與既有圖片相關測試：18/18 通過。
- `npm run build` 通過；保留既有 chunk 大小提示，沒有建置錯誤。
- `scripts/check-recommendation-posters.mjs` 核對 15 個檔案大小與 SHA-256；開發環境 5186 與正式建置預覽 4186 的 `/Lar-s-website/` 路徑均為 15/15 HTTP 200、image MIME、內容雜湊一致。
- 瀏覽器確認指定作品清單及詳情海報／ⓘ 控制項存在。此次瀏覽器工具的畫面擷取未可靠反映即時畫面，故不把它記為完整桌機／觸控視覺驗收。
- 尚需人工於實際裝置確認所有卡片互動、ⓘ 視窗位置及兩張低解析度封面的觀感。正式部署後再確認 Pages 快取與圖片請求；本次沒有 push 或部署。
