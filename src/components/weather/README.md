# Bottled Weather 正式功能頁

專案：`/Users/remoanpu/Desktop/GENESIS-Codex-Edition`。入口為 Big 桌上的 `potion-*` 模型，也可從世界封面的第六張工具卡、研究室工具清單或全站研究索引進入。

```sh
npm run dev
```

正式頁直達：<http://127.0.0.1:5186/?edition=weather>；Big：<http://127.0.0.1:5186/?edition=lab>。原獨立預覽 `weather-potions.html` 保留。正式頁不依賴 DEV 判斷，`npm run build` 會包含它。

## 整合位置

進場信件由 `WeatherLetter.jsx`、`WeatherLetter.css` 與 `letterContent.js` 負責，`WeatherPotions.jsx` 透過 `letterSession.js` 判定本次頁面載入期間是否已顯示；狀態只存在 JavaScript 模組記憶體中，因此 SPA 頁面切換返回時不會重複自動開啟，重新整理後則會重新顯示。信件實際開啟後才標記為已顯示。左側介紹中的小型「✉ 重讀信件」入口會先停止倒入，再重新開啟，不受自動顯示紀錄限制。遮罩沿用 Big 文件彈窗的 `#fdf9ee99` 與 3px 模糊。使用既有 Framer Motion 緩動與原生 `dialog.showModal()`：背景維持 inert 到淡出卸載完成，關閉按鈕／背景點擊／Escape 皆走同一個退出流程，最後將焦點送回重讀入口。信件改為獨立紙張構圖：置中標題、四段原文與右下署名；研究室對話放在主信紙下方獨立的白色小紙條，以淡紫膠帶、輕微傾斜與小字區分，三句仍統一靠左，沒有聊天氣泡。使用現行首頁的米白、淡粉、薄荷與細線設計元素，未加入圖片。短視窗可捲動整份來信與紙外討論，關閉入口保持可用，遵循 reduced-motion。不修改 Canvas 的準備 callback、模擬迴圈或藥水規則。

- `src/App.jsx`：正式頁 lazy import、直達網址、portal destination、返回；預載 weather 模組／CSS，再啟動既有 CircularReveal。
- `src/components/weather/WeatherPage.jsx`：正式頁薄包裝，既有沙盒元件接收 App 的返回／世界封面 callback。
- `src/components/bigInteractionRegistry.js`、`MainScene.jsx`：沿用實際 `potion-*` mesh 群組／raycast，首次及重訪均走 portal。
- `src/components/portalDestinations.js`、`portalComics/config.js`：potion 的頁面註冊、共用曲線轉場配色與 icon；不新增漫畫或轉場元件。
- `src/edition/config.js`、`palette.js`：第六件正式工具、頁名、配色；共用 Big 清單／研究索引由 TOOLS 自動產生。
- `src/components/ExploreSection.jsx`、`src/edition/edition.css`：世界封面六張工具卡。
- 正式 icon 使用使用者提供的 `Art/Big/Big-icon/icon-potion.PNG`，不修改圖片；Big 3D 模型與原 hover 插畫不變。

進入沿用 CircularReveal；返回沿用 CurveTransition → Big 的 PortalPageArrival → 揭幕完成。返回會登記 potion 為已探索。世界封面／跨頁索引沿用原紙幕導覽。Weather 的 fixed 容器自行捲動，頁尾為全站固定研究索引留出空間。

## 粒子操作修改

- `src/dev/weatherPotions/WeatherPotions.jsx`：左鍵點擊、按住、pointer capture、合併事件及完整路徑插值；離開畫布／放手／取消／失焦停止，重新進入不連接畫布外軌跡。瓶子拖曳與 Space／Enter 長按保留。
- `useWorld.js`：paint 直接修改模型 ref；pointer move 不把每個粒子送進 React。
- `fallingSand/brush.js`：每 2 格插值蓋章，立即填入真實材料；不排隊，因此放手後不延遲注入。地層與已有液體不被覆寫；遇固體在上方空格投入。
- `fallingSand/config.js`：每秒投入雨水 350、雪 260、雲 110、岩漿 120（原為 190／140／65／42），45%／100% 份量仍保留。各瓶筆刷半徑 5／7／10／6 格；陽光、寒冷、風和彩虹使用各自熱量／風力／光學規則。
- `fallingSand/weather.js`：連續物質來源跟隨筆刷座標，鍵盤保留廣域天氣模式。
- `fallingSand/renderer.js`、`simulation.js`：paintRevision 讓步進間的新筆刷也可更新 Canvas。
- `WeatherPotions.css`：操作時禁止文字選取；正式版自己的捲動容器／返回按鈕樣式，既有三欄、美術與框內結局不變。以限定選擇器修正共用 CSS 在封面／索引／直達入口隱藏 weather 頁首的問題。
- `fallingSand/endings.js`：五種原條件及 75 秒自由實驗／8 秒持續成立不變；諾亞方舟額外承認海面已填到頂端的極端洪水，避免強輸入填滿封閉網格後因升速歸零而漏判。
- `fallingSand/brush.test.js`：快速軌跡無斷線、單點、持續及停止、物質守恆、不覆寫地層、不同瓶特性與滿格／結局邊界。

未重畫沙盒、沒有新增套件／素材、沒有整體導覽重構，未建立 Git commit。原保存版本與既有未提交的 fallingSand 實作均保留。

## 檢查

```sh
node --test src/dev/weatherPotions/fallingSand/*.test.js src/dev/weatherPotions/*.test.js
npm run build
npm run preview
```

本次 33 項測試通過：6 筆刷、12 真實格子模擬（包含七瓶停止、重要連鎖反應、五種結局與重設）、15 舊版保存實作回歸。正式 build 通過；原有主 bundle 超過 500KB 的提示仍存在。

Chrome 實際確認開發版與正式建置從 Big 真正藥水 mesh 進入、共用圓形轉場、返回曲線轉場完成／已探索／icon 顯示。正式版實際快速拖曳、長按雨水、寒冷→冰封、陽光→融冰／蒸發／凝結、多雲、風、岩漿→蒸氣／新岩石、彩虹及回溯，放手讀数為「已停止」，無文字選取。Globe 的操作／返回與正式 Telescope 的紀錄抽屜／返回另做回歸。

正式版停手後於 97.6 模擬秒觸發亞特蘭提斯，投入雨滴保持 10207；結局背景為 `blur(2.4px) contrast(0.72) saturate(0.72)`，卡片完全在 world-stage 內，全頁 Modal 數為零，按「啟用回溯魔法」恢復初始世界。五結局另外全部由完整網格模擬測試觸發。

本機開發 Chrome 的 TelescopeTest.jsx 被瀏覽器端阻擋（`ERR_BLOCKED_BY_CLIENT`），Vite 對該模組實際回應 200；正式建置 Telescope 的地圖、LOG／CLOSE、返回 Big 均正常。未改動 Telescope 原始碼或任何瀏覽器設定，沒有清除儲存資料。

## 技術參考署名（2026-10-30）

正式頁尾新增 Sandspiel 參考署名與新分頁 GitHub 連結。保留上游完整 MIT 文字於 `public/licenses/sandspiel-MIT.txt`，來源為 https://github.com/MaxBittker/sandspiel/blob/master/LICENSE 。該授權文字屬於 Sandspiel，不會將本網站、使用者美術或其他原始碼改授權為 MIT。

核對正式 `fallingSand` 呼叫鏈：格子交換、更新標記、砂粒重力／斜滑／沉水與植物鄰格生長參考 Sandspiel 原理；本地為獨立 JavaScript 實作，沒有辨識到直接複製或逐行轉譯的 Sandspiel 程式段。根部／支撐、生長粒子遇水啟動、氣候與結局為本地規則。未匯入 Sandspiel 的 Rust/WASM、WebGL renderer、shader 或 UI。

未使用 PavelDoGreat/WebGL-Fluid-Simulation 的速度／壓力求解、shader 或其他程式；本地 `fluid()` 是材料格交換函式，不是該專案的流體模組。因此頁尾不列 Pavel Dobryakov。未找到其他直接引用的第三方模擬程式碼。既有共用轉場與字體的來源／授權不屬於本模擬引擎，本次不更動。
