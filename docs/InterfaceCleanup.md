# Globe／自然／人文介面整理

2026-11-15。只整理呈現，沒有修改 Markdown 正文、圖片資料、地球模型或資料來源。

## 共用排版

- Globe 目前有 7 個洲別（含南極），全部保留。各洲與行星仍使用同一個 `ScienceIntroduction`，統一標題、雙欄基本數據、薄荷色章節標記與間距；沒有照片的洲別不建立圖片框或空白欄位。
- 介紹文字依原本的空行分段，保留所有文字。洲別導航移到介紹上方，切換時在繪製前重置筆記捲動位置。
- 自然／人文文章使用同一份 `ArticleContent.css`，統一各級標題、段落、列表、引用、連結、閱讀寬度及長字串換行。補上共用渲染器缺少的引用區塊與更深層標題支援。
- 閱讀面板設定視窗寬度上限及單一垂直捲動區。手機頁首整理為兩列，標題與副標題不再被閱讀面板遮住；頁首、閱讀面板與探索視圖使用相同邊界。
- 圖片繼續使用既有 `ReadingPhoto`／`ResearchPhoto`／`PhotoCredit`：4:3、完整顯示、保留留白及原授權功能。刪除已無元件使用的舊圖片定位、印刷照片旋轉 CSS。

## 暫時隱藏及恢復

`src/components/research/presentationFlags.js` 是唯一的顯示開關：

- `studentNotes: false`：自然及人文的 Student Note 不掛載，不佔版面；原資料、元件分支與樣式均保留。
- `unfinishedContent: false`：Globe 沒有對話內容的故事入口隱藏，沒有任何可閱讀故事時不顯示空的 Student stories 標題。已有對話的 draft 與完成故事仍保留。人文推薦區的缺圖封面佔位也受此開關控制，正常封面保留。

未刪除 `NOTES`、`content.note`、故事、按鈕處理函式或封面佔位分支。將對應開關改為 `true` 即可重新啟用。

## 修改檔案

| 檔案 | 調整 |
| --- | --- |
| `src/components/globeTest/ResearchNotes.jsx` | 共用資訊結構、真正分段、洲別導航、無內容故事顯示條件 |
| `src/components/globeTest/SolarObservation.css` | 將行星限定的數據樣式改為洲別／行星共用，補齊章節及換行規則 |
| `src/components/research/ArticleContent.jsx` | 共用引用及標題渲染，載入共用文章樣式 |
| `src/components/research/ArticleContent.css`（新增） | 集中管理兩頁文章的文字層次與間距 |
| `src/components/research/presentationFlags.js`（新增） | 可恢復的 Student Note／未完成內容開關 |
| `src/components/naturalTest/ReadingPanel.jsx` | 接入 Student Note 開關 |
| `src/components/naturalTest/NaturalTest.css` | 移除重複文章／過期圖片樣式；閱讀面板及手機頁首尺寸整理 |
| `src/components/humanTest/HumanReadingPanel.jsx` | 接入 Student Note／空封面開關 |
| `src/components/humanTest/HumanTest.css` | 移除已失效的舊印刷照片旋轉規則 |
| `src/components/research/articleMarkdown.test.mjs` | 增加語義渲染、全部洲別、隱藏開關及資料保留檢查 |

## 驗證

- 21 項測試通過：涵蓋全部 36 篇自然、35 篇人文文章的正文與圖片掛載、標題／段落／列表／引用／安全連結、7 個洲別的資料與共用面板、既有天體資料及首次提示狀態、Student Note 資料保留與不顯示。
- 執行：`node --test src/components/research/articleMarkdown.test.mjs src/components/globeTest/globeContent.test.mjs src/components/globeTest/solarPhotos.test.mjs`。
- `npm run build`、`git diff --check` 通過。
- Chrome 桌面實際逐一切換亞洲、歐洲、非洲、北美洲、南美洲、大洋洲、南極洲，確認選取狀態、標題、基本數據與段落；390 × 844 預覽檢查較長北美洲標題與洲別導航。
- Chrome 桌面及 390 × 844 預覽檢查自然「岩石與岩石循環」、人文「文明與發展」：圖片完整呈現、長文捲動與換行、次標題、文末沒有 Student Note 空白；兩頁圖片來源與授權視窗均可開啟。全篇資料渲染由自動測試覆蓋，沒有逐篇人工改寫。

## 保留待確認

- `content/natural/origin-of-life.md` 標題為「動物行為」，目前主題資料名稱為「生命起源」。已有載入警告；這是內容對應問題，未擅改檔案、主題名稱或正文。
- 文章正文中的「後續研究／資料仍在整理」段落，屬於 Markdown 內容，保留待內容層確認，不以 UI 條件偷偷移除。
- 完成的 Student stories、參考資料、探索連結、洲別及分類導航保留。`3D / IMG / TEXT` 有實際編輯用途，且既有程式已限定開發模式，未另外變更。
