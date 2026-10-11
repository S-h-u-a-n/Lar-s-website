# 五個 Test 功能頁正式接入

日期：2026-10-10。

## 正式目的地

| Big 物件 | 實際元件 | 檔案 |
| --- | --- | --- |
| globe | GlobeTest | src/components/globeTest/GlobeTest.jsx |
| telescope | TComicPage → TelescopeTest（首次）；重訪沿用介紹／Enter，不重播漫畫 | src/components/TComicPage.jsx、src/components/telescopeTest/TelescopeTest.jsx |
| book-open1 | NaturalTest | src/components/naturalTest/NaturalTest.jsx |
| book-close1 | HumanTest | src/components/humanTest/HumanTest.jsx |
| ball | BallTest | src/components/ballTest/BallTest.jsx |

App 保留既有 screen state 名稱 globe／telescope，實際掛載新版元件；開發 dev=globe-test／telescope-test 仍可使用。五頁 BACK 統一走 returnFromPortal，正式會返回 scene（掛載 BigTest）。Natural、Human、Ball 既有直接物件入口沒有修改。

## 修改檔案

- src/App.jsx：GlobeTest／TelescopeTest 正式 lazy import，替換旧功能頁導航引用；漫畫完成後目的地沿用 telescope state，掛載 TelescopeTest。移除望遠鏡重訪 Enter 的重複介紹攔截。文字 pageId 映射回各 Test 命名；編輯器與草稿置於現有圓形轉場層內，避免被覆蓋。
- src/components/globeTest/Text.jsx
- src/components/telescopeTest/Text.jsx
- src/components/naturalTest/Text.jsx
- src/components/humanTest/Text.jsx
- src/components/ballTest/Text.jsx
- docs/Test-pages-integration.md

五個 Text 包裝元件使用既有 usePersistedEditableText，使正式建置能唯讀顯示 Test 原儲存鍵內的設定。沒有改動 ID／儲存鍵，沒有資料遷移或清空。原舊頁面檔案保留，但 App 不再 import GlobePage／TelescopePage；GlobeTest 對 GlobePage.css 的共用樣式引用保留。Intro、Story、Main、Big 視覺及各功能頁布局未改動。

## 實際驗證

Chrome 正式 build 預覽 http://127.0.0.1:4175/（無 dev query），頁面截圖 viewport 1512 × 805。

- 從 Intro 的 Enter，逐段完成 Story，進入 Main，再進入正式 BigTest。
- 直接點擊模型 globe：經原 CircularReveal 進入 GlobeTest；選 Earth、Asia、章節，NEXT 角色對話更新，關閉仍保留筆記；BACK 返回 BigTest。
- 直接點擊模型 telescope：經原 CircularReveal 顯示 TComicPage；逐段完成漫畫後，顯示 TelescopeTest 圓形真實地圖、角色預留区及對話。GLOBE／STREET 狀態切換、LOG 開關與 MY COLLECTION 介面正常；BACK 返回 BigTest。
- book-open1 模型單次點擊直接顯示 NaturalTest；LAND & GEOLOGY 定位與 VOLCANO 閱讀面板開關正常；BACK 返回 BigTest。
- book-close1 模型單次點擊直接顯示 HumanTest；分類定位與推薦閱讀面板開關正常；BACK 返回 BigTest。
- ball 模型單次點擊顯示 BallTest；作品箭頭更新選擇與對話，封面詳細面板開關與對話繼續可操作；BACK 返回 BigTest。
- 補測開發版：從 dev=t-comic 完成漫畫、BACK 返回正式 scene，再次點擊 telescope 保留聚焦介紹／Enter；Enter 進入 TelescopeTest，沒有重播漫畫。TEXT 編輯器可開啟並列出 TelescopeTest 的原 ID 文字，未修改欄位。
- npm run build 與 git diff --check 通過；大 chunk 警告仍存在。

TelescopeTest 的 STREET 本來就是衛星地形預覽，真正街景尚未連接，本次未擴充。未新增／刪除收藏測試資料；未逐項重測全部五頁互動、所有儲存值與多種視窗尺寸；正式 origin 未注入任何測試設定。最後的重訪／編輯器相容修正已在開發版實測並完成正式 build，未再次重跑完整 production 進站序列。

沒有刪除檔案、素材，或清除／重設使用者資料。
