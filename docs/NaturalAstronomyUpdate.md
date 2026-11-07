# 自然頁分類更新（2026-11-07）

> 本文保留第一次更新至 37 篇時的盤點紀錄。後續已依每類六篇重新整理，現行 36 篇清單與合併說明見 [六類主題平衡報告](NaturalSixTopics.md)。

預覽：<http://127.0.0.1:5186/?dev=natural-test>

## 盤點與分類結果

原有六類各 5 篇，共 30 篇。文章由 `articles.js` 提供，分類及卡片由 `data.js` 的 CATEGORIES、ENTRIES、ARTICLES、NOTES 產生；分類選單及概覽卡片均讀取同一份分類資料。原文章的參考連結位於各自的 sources，沒有依分類名稱建立的文章網址。文章 ID 全部保留，搬移不會改變文章、筆記或來源的對應。

| 分類 | 更新後完整小主題 |
| --- | --- |
| 陸地與地質（5） | 火山、地震、板塊構造、岩石與礦物、山脈與河谷 |
| 海洋與水域（5） | 洋流、水循環、河流與湖泊、潮汐、深海 |
| 大氣與氣候（5） | 雲、極光、風暴、地球大氣層、氣候與季節 |
| 植物與真菌（6） | 光合作用、開花植物、傳粉生物、樹木與森林、真菌與蘑菇、種子與傳播 |
| 動物與生命（9） | 生物演化、動物多樣性、動物行為、生物適應、生命起源、生態系統、食物網、生物多樣性、生態保育 |
| 宇宙與天文（7） | 天文觀測與方法、恆星的形成與演化、星系與銀河系、黑洞與重力證據、宇宙學與大霹靂、太空探測與人類航天、系外行星與生命搜尋 |

原生態分類的重新分配：

| 原小主題／ID | 目的分類 | 判斷 |
| --- | --- | --- |
| 傳粉生物／pollinators | 植物與真菌 | 接在開花植物之後，專談授粉機制及植物與訪花者的關係；與種子傳播區分。 |
| 生態系統／ecosystems | 動物與生命 | 談生物與非生物環境、物質循環及系統變化。 |
| 食物網／food-webs | 動物與生命 | 專談攝食連結、營養階層與能量傳遞，與生態系統的整體框架區分。 |
| 生物多樣性／biodiversity | 動物與生命 | 保留基因、物種及生態系統三層次；動物多樣性仍專談動物類群及身體構造。 |
| 生態保育／conservation | 動物與生命 | 接續多樣性，專談證據、管理措施、監測及社會參與。 |

沒有合併、刪除或改名原有小主題，亦未複製成不同分類的重複卡片。這五篇原本已有不同重點，不為維持固定篇數強行合併。調整植物與生命分類的簡介以反映新增範圍。總數現在為 37 篇。

## 天文內容規格與來源

沿用中英文名稱、卡片摘要、繁中導言、兩個知識段落、觀察筆記及 REFERENCES 的既有結構。新文案用繁中重新組織，不搬貼原文；來源查閱日期為 2026-11-07，保留既有 CC BY-SA 4.0 說明。舊文章未假更新查閱日期。

| 新主題 | 主要維基百科參考條目 |
| --- | --- |
| 天文觀測與方法 | [Observational astronomy](https://en.wikipedia.org/wiki/Observational_astronomy)、[Astronomical spectroscopy](https://en.wikipedia.org/wiki/Astronomical_spectroscopy) |
| 恆星的形成與演化 | [Stellar evolution](https://en.wikipedia.org/wiki/Stellar_evolution) |
| 星系與銀河系 | [Galaxy](https://en.wikipedia.org/wiki/Galaxy) |
| 黑洞與重力證據 | [Black hole](https://en.wikipedia.org/wiki/Black_hole) |
| 宇宙學與大霹靂 | [Big Bang](https://en.wikipedia.org/wiki/Big_Bang) |
| 太空探測與人類航天 | [Space exploration](https://en.wikipedia.org/wiki/Space_exploration) |
| 系外行星與生命搜尋 | [Exoplanet](https://en.wikipedia.org/wiki/Exoplanet)、[Astrobiology](https://en.wikipedia.org/wiki/Astrobiology)、[Extraterrestrial life](https://en.wikipedia.org/wiki/Extraterrestrial_life) |

未解問題明確標示：最低質量恆星的完整晚期演化屬模型推論、黑洞中心與量子重力仍待研究、暴脹機制及暗物質／暗能量本質未定、宜居帶與可能生物特徵不能等同生命確認。沒有使用會很快過時的系外行星數量或未來任務時間表。

沒有新增太陽系專篇。太空探索文章僅保留歷史里程碑與任務方法的簡介，不重寫地球、月球或太陽的詳細資料；文章內有「前往天體觀測 ↗」按鈕。它經 ReadingPanel → NaturalTest → App 的既有 editionNavigate('globe') 轉場，不使用 location、整頁載入或另開視窗。

新分類 ID 為 astronomy，分類裝飾沿用網站已有的 orbit 幾何樣式，小主題沿用既有 sun 線條圖標，不再帶入舊環境分類的預設 leaf 圖標。其他五類的分類名稱不變。

## 檔案及驗證

- `src/components/naturalTest/data.js`：歸類、簡介、分類名稱與裝飾資料。
- `src/components/naturalTest/astronomyArticles.js`：七篇新文章、來源日期與相關頁面資料。
- `src/components/naturalTest/articles.js`：將新文章接入既有文章索引。
- `src/components/naturalTest/NaturalTest.jsx`、`ReadingPanel.jsx`、`src/App.jsx`：傳遞並使用既有站內導航。
- `src/components/naturalTest/NaturalTest.css`：相關頁面按鈕沿用現有色彩及按鈕造型，沒有修改畫布、分類卡片或展開動畫樣式。
- `src/components/naturalTest/data.test.mjs`：分類及資料完整性檢查。

自動檢查：六個分類名稱、37 個唯一小主題、五篇搬移歸屬、文章／筆記／來源可解析、卡片座標仍在自動計算的分類範圍內、七篇新文章的來源日期與 globe 路由。

實際 Chrome 檢查：新分類選單及卡片名稱、七篇天文主題展開、天文觀測文章正文及參考資料、植物分類中的傳粉文章、生命分類的九篇清單及最後一篇生態保育、閱讀面板獨立捲動、太空探索文章內部連結轉場到天體觀測、從研究索引返回自然頁。沒有手動逐篇打開全部 37 篇；全體文章的結構與歸屬由資料檢查覆蓋。

未建立 Git Commit 或 Push。
