# Telescope 尤塔 Live2D

目前已完整導入中文語錄與事件系統。以下「完整中文對話系統」為目前行為，前面的整合紀錄保留作為歷史說明。

展示位置：既有右側 `.tt-mentor`，以獨立大型藍色點陣後景、小型白色波點正方形、放大的 `YutaLive2D` 人物及下方對話氣泡組成。大型背景不含座標資訊。地圖與對話文案未改。背景已恢復並重新佈置，與 Globe 共用滑鼠慣性與漂浮邏輯。

## 資源與版本

- `Art/telescope/yuta-live2d/Live2DYuta.model3.json` 原引用 `Live2DYuta.2048/texture_00.png`。
- 網站端 `yutaAssets.js` 使用實際 `Texture-yuta.png`，不修改原模型或 PNG。
- Vite `import.meta.glob` 的 `?url` 為 moc3、motion3、貼圖產生正式版 URL；小 JSON 可由 Vite 內嵌成 data URL。
- 官方 CubismWebFramework 5.3 原始碼位於 `src/vendor/cubism`，保留 LICENSE。唯一整合擴充為 ShaderManager 的 `releaseGlContext(gl)`，讓每個 canvas 可獨立清理 shader，不影響其他模型。
- 官方 5.3 Core 固定來源：`https://cubism.live2d.com/sdk-web/core/06/live2dcubismcore.min.js`，存於 `public/vendor/live2d`；shader 同樣由本機提供，不依賴執行時 CDN。
- Core 必須先載入，才動態匯入 Framework（其模組頂層使用 Core enum）。載入前檢查 moc version，並啟用 moc consistency check。沒有降版或重寫模型。
- 貼圖在記憶體中採 premultiplied alpha 解碼與渲染，原 PNG 不變。

## 動作資源與接口

模型 `Live2DYuta.model3.json` 沒有內嵌 `FileReferences.Motions` 動作表；`yutaRuntime.js` 透過 `YUTA_MOTIONS` 載入並註冊各動作，名稱直接對應同名 `.motion3.json`：

| 名稱 | 實際檔案 |
| --- | --- |
| 待機1 | 待機1.motion3.json |
| 待機2 | 待機2.motion3.json |
| 待機3 | 待機3.motion3.json |
| 待機一般 | 待機一般.motion3.json |
| 指右邊-開心 | 指右邊-開心.motion3.json |
| 指右邊 | 指右邊.motion3.json |
| 開心 | 開心.motion3.json |
| 開場 | 開場.motion3.json |
| 感興趣 | 感興趣.motion3.json |
| 對話-思考 | 對話-思考.motion3.json |
| 對話-開心 | 對話-開心.motion3.json |
| 對話 | 對話.motion3.json |
| 對話-wink | 對話-wink.motion3.json |

`TelescopeTest` 的 `yuta` React ref 提供：

```js
yuta.current.play('指右邊')
yuta.current.startDialogue('對話-思考')
yuta.current.startDialogue('對話-開心')
yuta.current.startDialogue('對話-wink')
yuta.current.endDialogue()
```

`play(name)` 會排到目前動作結束後播放；`startDialogue(name)` 會以最新指定動作取代當前動作；`endDialogue()` 會回到待機。所有 motion 原檔雖設 Loop true，網站以 SDK `setLoop(false)` 播放完整單輪，統一由單一佇列安排，不修改動畫曲線。望遠鏡頁初次進場播放「開場」標記，後續段落只有明確標記才派送動作。

對話標記只在段落開始時派送一次；沒有標記的下一段只更新文字，不打斷當前動畫。指定動作自然結束後依待機3／待機一般／待機1 的 70%／15%／15% 權重銜接。待機一般或待機1 結束後接待機3；待機3 結束後隨機接待機一般或待機1；待機2僅在長時間沒有互動時偶爾觸發。模型由 `YutaLive2D` 單次掛載，不會因段落文字更新重新載入。

離頁時取消 RAF、終止資源請求、釋放 motion / model / renderer / texture / WebGL context。背景分頁停止累計動作時間。

## 展示框

- 右側原區域改為隨視窗高度與欄寬縮放的正方形。
- 背景層單獨圓角裁切；白色波點以 CSS radial-gradient 每 14 秒平移一個 32px 週期，無縫循環。
- 透明 WebGL canvas 在背景前方，外層 overflow visible。
- SVG filter 以當幀 SourceAlpha 膨脹 4px，填白後與當幀人物合併，因此描邊跟隨實際輪廓，沒有額外模型或延遲影像。
- reduced-motion 停止波點移動。

## 驗收（2026-11-08）

- Chromium 實際載入官方 5.3 Core 與此模型成功；開場結束進入待機一般。
- 八段動作均經逐一指定播放；對話開心指定後，endDialogue 可回到待機一般。
- 透明貼圖色彩正常，無黑底；截圖確認輪廓白邊、背景波點與人物超出背景。
- 1440×1000 與 1100×760 桌面視窗檢查；較小視窗展示容器為 300×300，背景保持正方形。
- 隨機觀測、衛星模式、收藏抽屜開關、返回離頁均經瀏覽器測試。
- 正式 build + preview 載入成功；原有 telescope observation / editor store 檢查通過。
- 展示畫面：`screenshots/yuta-live2d/desktop.png`、`desktop-small.png`。

驗收範圍為 Chromium；Safari / Firefox 尚未實測。對話動作接口已提供，既有台詞尚未標註指定動作，因此未新增自動情緒映射。


## 視覺改版（2026-11-08）

- 從原先 `.tt-character` 的樣式與座標 JSX 恢復獨立 `.tt-coordinate-backdrop`：原淡藍薄荷底、18px 點陣、斜角與即時 LATITUDE / LONGITUDE；位於角色卡片後方，沒有與小型白色波點背景合併。
- 小型卡片與人物以整組容器縮小，保持正方形、動態波點、SourceAlpha 白色描邊及超框。名字為 `✦ Yuta ✦`。
- Globe 原 FloatingGeometry 的效果抽成 `useFloatingGeometry`，兩頁共用；`useParallax` 仍統一處理滑鼠慣性，沒有新增另一套 pointer listener。
- 背景分散安排三個彩色方塊、底部彩點列、左下格線、上方方格點陣及右下圓點點陣，全部 pointer-events none。
- 原 Student Guide 與獨立 NEXT 已撤下。氣泡是一個原生 button，Enter / Space 與整塊點擊共用原對話分支；只有教學未完成時顯示 next 提示，最後一句以 aria-disabled 表示不可繼續。角色點擊與模式切換仍沿用原對話內容。
- 有效切句觸發 270ms 輕微彈動及 180ms 文字淡入；每次更新取消前次動畫，無動畫堆疊。reduced-motion 不啟動此動效，並停止裝飾漂浮及波點。
- Chromium 檢查 1440×1000、1100×760、900×650；角色卡片維持正方形，觀測、衛星模式、收藏抽屜正常。開場到待機正常，無 JavaScript 錯誤或 HTTP 載入失敗。
- 改版畫面：`screenshots/yuta-live2d/redesign-desktop.png`。


## 人物比例與分層修正（2026-11-08，取代上節尺寸與座標展示安排）

- 刪除後景中的 CURRENT OBSERVATION、LATITUDE、LONGITUDE、數字、方向字母及「觀測者的筆記」；藍色背景保持獨立裝飾。原有下方指南針與收藏中的必要觀測資料仍保留。
- `.tt-yuta-scene` 直接包含四個同層元素：`.tt-yuta-large-backdrop`、`.tt-yuta-background`、`YutaLive2D` 和 `.tt-yuta-name`。對話氣泡為下一個獨立元素。`YutaLive2D` 不再包住任何背景。
- `--tt-backdrop-inset`、`--tt-small-size` / `--tt-small-top`、`--tt-model-size` / `--tt-model-top` 分別控制大小與位置；場景高度以 `--tt-scene-height` 獨立控制。名字使用自己的 absolute 位置。
- 1440×1000：人物畫布 528×528（先前約 260×260）；1100×760：340×340；900×650：280×280。人物不被背景裁切，頭髮與衣袖超出小方框。
- 背景裝飾改為貼合地圖下緣的兩組淡化圖案，使用 Home 既有的漸隱遮罩語言；彩點列與模式操作區對齊，慣性方塊呼應構圖外緣。上方保留留白。
- 正式 preview 的四種尺寸均已擷取並人工檢視（1440×1000、1440×900、1100×760、900×650）。瀏覽器測試亦分別改動大小背景與人物尺寸，確認互不影響。
- 氣泡、Enter、隨機觀測、衛星模式、收藏開關及共用慣性方塊通過回歸；Live2D 開場正常轉為待機。未修改 moc3、PNG 或八段 motion3。
- 最終畫面：`screenshots/yuta-live2d/proportions-desktop.png` 與 `proportions-small.png`。


## 局部排版與圖案調整（2026-11-08）

- 裝飾由三個增為七個方塊，加入約 60–120px 的條紋、格線、棋盤格與波點方塊，與原有小純色方塊形成大小對比。全部透過既有 `useFloatingGeometry` 使用相同的滑鼠慣性與漂浮，不新增 pointer listener。
- 三個既有功能按鈕「隨機觀測／大家推薦／我的收藏」移入 `.tt-mentor-stage` 的獨立 grid 側欄。側欄向左延伸，不縮窄藍框或 Live2D；窄桌面視窗使用較窄的側欄與間距。
- 彩點列移入氣泡右下方，圓點 9px、間距 4px、z-index 2，位於原本淡點陣前方及 next 提示上方，pointer-events none。
- 名字向下微調到大框範圍內；較矮視窗僅微調人物上方留白，人物尺寸仍為 528 / 480 / 340 / 280px（對應已驗收的四種桌面尺寸），背景與人物仍獨立控制。
- `EditionChrome` 僅在 telescope / telescope-test 不顯示頁名小字，保留研究索引按鈕及其他頁的頁名。
- 正式 build / preview 實測四種桌面尺寸，確認名字完整位於大框內、按鈕側欄相鄰、角色未縮小；氣泡、三個輔助功能、衛星模式與圖案方塊慣性皆通過。無 JavaScript 錯誤或 HTTP 資源失敗。既有 observation、editor store 與 geometryMotion 檢查通過。
- 最新畫面：`screenshots/yuta-live2d/local-layout-desktop.png`、`local-layout-small.png`。


## 完整中文對話系統（2026-11-08）

### 修改檔案

- `src/components/telescopeTest/dialogue/yuta-original.txt`：使用者提供的完整原稿（唯一文案來源）。
- `dialogue/yutaDialogue.js`：編輯時結構化的 25 組、82 段資料，每段有 id / group / text / motion，組別有 trigger。保留句內換行與內層引號，僅移除編輯用外層引號。
- `dialogue/dialogueController.js`：獨立對話事件管理器、持久化、優先序、提示、洗牌及計數。
- `dialogue/useYutaDialogue.js`：React useSyncExternalStore 訂閱與可見頁面的提示計時。
- `dialogue/motionPolicy.js`：正常待機與長時間閒置的動作選擇。
- `TelescopeTest.jsx`：接上原本的隨機觀測與成功收藏事件、教學模糊鎖定、氣泡及鍵盤操作。
- `YutaLive2D.jsx`、`yutaRuntime.js`：沿用九段動作，依 segmentKey（不是動作名稱）辨認新段落；同名動作在新的段落也會重新播一次。單佇列、最新命令優先及既有平滑轉場保留。
- `data.js`：撤下舊英文角色台詞與暫時映射。
- `TelescopeTest.css`：僅讓氣泡文字保留換行，過長段落在同一氣泡內捲動，沒有修改氣泡外形或角色／裝飾排版。
- `scripts/import-yuta-dialogue.py`：編輯原稿後重新產生資料（不在瀏覽器執行）。
- `scripts/check-yuta-dialogue.mjs`：逐字比對原稿與結構化段落，並測試完整狀態與事件規則。

### 狀態與事件

`introActive` 只在完整首次教學進行中為 true；教學完成與 Telescope 是否已進入，由 App 層級的 ref 管理，只在目前網站載入期間有效。每次整頁重新載入後，第一次進入 Telescope 播完整教學；同一次載入中離開再進入則播三段 welcome。模糊和既有焦點圖形由 introActive 持續鎖定，期間沒有解除計時器；完成後重新使用既有 focusDuration 對焦過渡。

對話有 active / kind / group / index / segmentKey / hasNext；完成整組後保留最後台詞但 active=false。next 僅在還有下一段時顯示。最後一段 next 隱藏，但按鈕仍可點擊或用 Enter / Space 完成。140ms 重複點擊防護避免同一連點跳段；切句時取消上次氣泡動畫。

優先序為教學 > 主動功能 > 主動閒聊 > 自動提示 > 待機。教學不可中斷；主動閒聊可取代自動提示，但不可重新抽掉正在閱讀的閒聊。功能操作可取代其他非教學對話。自動提示不得取代任何 active 對話。

持久化 key：`genesis:telescope:yuta-dialogue:v1`（瀏覽器 `localStorage`）。記錄隨機／收藏計數、功能使用及提示狀態、14 組閒聊剩餘洗牌袋與上次抽到的組別；舊資料中的 `introCompleted` 僅為相容保留，不參與教學判定，也不再由完成教學更新。收藏只在原本 localStorage 寫入成功後通知管理器；已計數的相同觀測視角不重複計入。儲存失敗、取消收藏、單純開列表皆不增加次數。原收藏 key 不變。

`DIALOGUE_CONFIG` 集中設定 30 秒閒置、待機2 機率、45 秒未互動提示門檻、60 秒提示間隔、三功能提示順序與點擊防護。正常待機隨機選待機一般／待機1，完整播完才切換；對話仍在閱讀時禁止待機2，長時間無互動且沒有 active 對話才偶爾播一次待機2。玩家互動重置閒置時間。

### 驗證

- `node scripts/check-yuta-dialogue.mjs`：原稿 82 段逐字／換行／動作比對、14 組數量與順序、教學最終確認、持久化、優先序、洗牌跨輪不立即重複、提示、里程碑及閒置策略均通過。
- 正式 build / preview + Chromium：實際走完首次 4 段、回訪 3 段、14 組 61 段閒聊，逐段比對畫面文字與動畫，並確認末段需要再點擊才解鎖。
- 實際十次隨機觀測檢查第5／10次；收藏以先前累積數量作測試前置，再透過真正存檔 UI 驗證第1／5／10次。另測開列表、取消／重加相同視角及寫入失敗／成功重試。
- 瀏覽器虛擬時鐘（在頁面載入前安裝）：三個自動提示、閱讀中不插話、提示間隔、超過30秒且沒有對話才播待機2、播放一次回到正常待機均通過。
- 實際雙擊只前進一段、主動閒聊取代自動提示、功能取代閒聊均通過。無 JavaScript 錯誤或 HTTP 資源失敗。
- 既有 `check-telescope-observations.mjs`、`check-editor-store.mjs` 與正式建置通過。
- 畫面：`screenshots/yuta-live2d/chinese-intro.png`、`intro-final-confirmation.png`、`chinese-dialogue.png`。

編輯原稿後可執行：`python3 scripts/import-yuta-dialogue.py`，再執行 `node scripts/check-yuta-dialogue.mjs`。

補充驗收：900×650、prefers-reduced-motion 下，長段落保留在同一氣泡內捲動；下一段捲動位置歸零、無彈動動畫，原本 110px 氣泡高度維持不變。另以真實滑鼠雙擊確認不跳段；以模擬 localStorage 收藏寫入失敗確認計數不增加，恢復寫入後成功新增才增加一次。

文字捲動區限制在兩行高度，避免長段落與既有彩點／next 相交。台詞完整保留於同一氣泡，可捲動閱讀，不增加分段或改寫文字；氣泡、彩點與角色的位置和尺寸不變。

## 待機3、模式回應與大框圓點（最新規則）

此次沿用現有模型與渲染器，原始動作檔未修改，動作總數為十段。

### 修改檔案

- `TelescopeTest.jsx`：尤塔與氣泡使用相同 `advanceDialogue` 推進；只有沒有 active 對話時，尤塔才啟動閒聊。排除標示為互動控制項的子元素點擊，保留原有重複點擊防護與氣泡動效。模式顯示名稱、ARIA 與提示改為 MAP／VIEW，內部仍為 globe／satellite。
- `yutaAssets.js`：新增實際 `待機3.motion3.json` 映射，仍透過 Vite URL 與現有 loader 載入。
- `dialogue/motionPolicy.js`、`yutaRuntime.js`：正常循環為待機一般／待機1 → 待機3 → 隨機待機一般／待機1。指定動作結束採待機3 70%、待機一般 15%、待機1 15%。待機2僅在沒有 active 對話且長時間閒置時於待機3完成後偶爾觸發；播一次後回待機3。沒有 React effect 逐次啟動待機，仍在 SDK 佇列完成時自然銜接。
- `dialogue/modeDialogue.js`：原樣保存 MAP 三句、VIEW 三句、連切兩句；集中設定六次／十五秒、三十秒冷卻。
- `dialogue/dialogueController.js`：只計有效的模式變更，當前模式重複點擊不計；連切特殊語錄取代該次一般回應，觸發後清空窗口，冷卻期間不累積下一波。各回應池排除上次選到的句子。模式回應為已完成的單段 passive 回應，不需要點擊確認、不阻止控制操作；可由後續主動功能或閒聊取代，自動提示不覆蓋它。教學仍不可被模式語錄取代。
- `YutaLive2D.jsx`：段落動作與 active 閱讀狀態分開，因此 passive 模式回應也能指定動作播放一次，最新段落仍優先中斷舊動作。
- `homeSwatchColors.js`：主頁 `src/components/HeroSection.jsx` 的圓點是內嵌六色，沒有共用變數；採其準確色碼 `#f08fad #ffdcc9 #f5f1a4 #80b9e5 #a2d8de #e1d0f2`，沒有修改主頁。
- `telescopePlacement.js`、`TelescopeTest.css`：將彩點移為大型藍框的子層，依大框實際尺寸、小框與人物的安全側欄計算內距，垂直排列，保留9px圓形。ResizeObserver只調整圓點的變數，不修改大框、小框、人物、名字、氣泡或方塊。人物右側0.86畫布寬度為保守安全界，十段實際渲染像素測得最右可見範圍0.7825；另保留白色描邊間距。
- `TelescopePage.jsx`：只更新地圖的輔助名稱，沒有改變切換、樣式載入或相機功能。
- `scripts/check-telescope-modes.mjs`：新增模式、機率、循環及主頁色碼的回歸測試；`check-yuta-dialogue.mjs` 同步新待機規則。

### 實測結果

- 正式 build 與 Chromium：文字區／空白區點擊氣泡、點擊尤塔均能推進同一組對話；最後再確認一次才完成。沒有 active 對話時尤塔仍抽取閒聊。
- 十段動作均實際載入播放，待機3渲染像素會改變。實際循環記錄包含「待機3 → 待機一般 → 待機3 → 待機一般」；指定動作結束分別測到待機3、待機一般、待機1，後兩者下段必接待機3。
- 70／15／15權重以分層樣本10000個機率點驗證為7000／1500／1500；瀏覽器亦實測三個分支。待機2不打斷閱讀，只有30秒無互動後偶爾播放，播一次回待機3。
- MAP三句、VIEW三句及兩句連切回應皆透過真正模式按鈕觸發；已選按鈕不計、冷卻不重複觸發、最新回應不被舊樣式完成事件或自動提示覆蓋。
- 真實時鐘確認VIEW衛星影像與MAP地圖完成載入、恢復既有對焦，最新台詞仍保留。
- 實際讀取主頁與Telescope的computed backgroundColor逐色比對一致。1440×1000、1440×900、1100×760、900×650、850×650檢查六點全部位於旋轉大框內、與小框／名字不重疊。十段動作另以透明像素及描邊安全邊界檢查，圓點不覆蓋人物。
- 大框、小框、人物、名字、氣泡的量測值與前版相同。原有中文82段、觀測、編輯器狀態檢查與建置通過，無JavaScript或資源載入錯誤。
- 畫面：`screenshots/yuta-live2d/map-view-map.png`、`map-view-view.png`、`map-view-small.png`、`idle3-cycle.png`。

## 對話點擊、動畫連續性與完整長文修復（2026-11-08）

本節取代上文「兩行高度、氣泡內捲動」及「未標動作時回待機」的舊說明。台詞、模型與十段原始動畫、待機3機率、模式語錄、背景及人物尺寸均未更動。

### 實際原因與修改

- **長文裁切**：原 `.tt-dialogue-copy` 使用 `max-height:3.6em; overflow-y:auto`，只露出兩行；另有右側內距限制文字。現移除高度上限、內部捲動與額外避讓內距，保留字級和 `white-space:pre-wrap`，氣泡依內容增高。文字在點陣裝飾上層；低高度視窗需要時可捲動整頁，並增加底部閱讀空間。
- **動畫被重置**：原 `YutaLive2D` 每次段落 key 改變都呼叫 `startDialogue(motion)`，未標動作傳入 null，而 runtime 將 null 解讀成開始待機3。新增 `dialogue/motionDispatch.js`，只有明確動作才發指令；同一 key 去重、新 key 明確指定相同動作仍播放一次。active 閱讀狀態獨立通知，模型初始化 effect 不隨文字改變。runtime 與 motionPolicy 未修改。
- **氣泡點擊**：在原版的新瀏覽器情境中，實際 capture／bubble 事件追蹤顯示文字和空白點擊皆能到達氣泡，未重現「完全無回應」，也未找到透明遮罩攔截，不能將其當作已確認原因。本次移除內部文字捲動命中層，文字和裝飾不接收 pointer，氣泡直接命中、提高層級並由 capture 統一交給與尤塔相同的 advanceDialogue；保留互動子控制項排除與原140ms防連點。實際滑鼠座標點擊確認文字／空白均只前進一段。
- **圓點**：每色12px、各自白底18px（3px包裹），六個獨立圓形，保留主頁六色。量測定位改用18px外層，仍相對大型背景計算安全內距，不移動人物或背景。
- **座標**：獨立整組向左 translate，依固定研究索引的實際左邊界與 ResizeObserver 保留至少24px間距，研究索引不移動；座標文字、字型、字級皆不變。

修改檔案：`TelescopeTest.jsx`、`TelescopeTest.css`、`YutaLive2D.jsx`、`telescopePlacement.js`、新增 `dialogue/motionDispatch.js` 及 `scripts/check-yuta-motion-dispatch.mjs`。

### 實測結果

正式 build／preview，以 Playwright Chromium 實際載入模型、使用滑鼠座標、鍵盤及畫面量測；並檢視桌面與低高度截圖。

| 檢查 | 結果 |
| --- | --- |
| 尤塔、氣泡文字、氣泡空白共用推進；不重抽、不跳段 | 通過 |
| 最後一段再點一次完成；首次教學直到確認才解鎖 | 通過 |
| Enter、Space、快速雙擊 | 通過；雙擊只前進一段 |
| 指定動作未結束時切到未標動作段 | 通過；motion及serial不變，原動作繼續 |
| 原動作自然結束後切到未標動作段 | 通過；待機serial不變，正常循環繼續 |
| 新指定動作及連續兩段相同指定動作 | 通過；新段各觸發一次，重複render不重播 |
| 手動換行與三、四行長段落 | 通過；文字逐字相等、clientHeight等於scrollHeight，末字及標點完整 |
| 850×550長段落閱讀 | 通過；整頁可捲動169px，末字位於固定索引上方，氣泡內無捲動 |
| 白底18px／內色12px、逐色與Home一致 | 通過；每顆獨立白圓，置中且無陰影 |
| 1512×861、1440×1000、1100×760、900×650、850×650 | 通過；六個白色外層完整在旋轉大框內，不碰小框；座標距索引24px |
| MAP／VIEW按鈕、收藏列表 | 通過；開列表不增加收藏計數 |
| 待機3循環及70／15／15、待機2限制 | 既有規則測試通過；本次未改runtime或機率 |
| 原稿82段、14組閒聊、模式八句、里程碑及優先序 | 自動回歸通過 |
| 建置、觀測、編輯器狀態、motion dispatch | 通過 |
| 本輪瀏覽器JavaScript錯誤 | 無 |

本輪沒有重新遍歷全部外部衛星瓦片或收藏十次里程碑UI；既有功能邏輯未修改，相關狀態回歸測試通過。原使用者Chrome可讀取畫面，但原視窗自動輸入不可用；上述實際操作在另開Chromium完成，不代表已重現原使用者設定檔中的完全點擊失效。

畫面：[桌面長文](screenshots/yuta-live2d/dialogue-repair-desktop.png)、[低高度完整閱讀](screenshots/yuta-live2d/dialogue-repair-short-window.png)。
