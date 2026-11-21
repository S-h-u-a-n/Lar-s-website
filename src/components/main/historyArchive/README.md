# 主頁：人類歷史長卷

預覽：`http://127.0.0.1:5186/?edition=main`，探索工具之後、角色介紹之前。

## 資料與素材

- `content/history/01-*.md`～`18-*.md`：18 個時代的正式文章來源，包含地區、年代、導言、章節、正文與原文參考資料。`parseArticle.js` 依原始空行分段與獨立章節行解析，不要求 Markdown 標題語法；參考資料中的網址會轉為可點擊連結。
- `records.json`：只保留 `people-1`～`people-18` 的人物 ID 與仍有使用的插畫註記，不再存放文章正文、年代、地區或來源。
- `data.js`：以 Vite `import.meta.glob(..., { query: '?raw' })` 依檔名前綴排序讀取 Markdown，再組合文章、定位、透明命中遮罩與插畫 URL。
- `wikipediaReferenceIds.json`：保留各時代原有的 Wikipedia 來源 ID 對應；`sources.json` 與 `references.js` 依各自時代的 ID 重建舊有參考連結。
- 參考資料展開區先列原 Wikipedia 連結與核對說明，再列 Markdown 原始參考文字及連結；相同網址依 `referenceKey` 去重，不會跨時代共用來源。
- 18 張原始 `Art/IntroScreen/history/people-1.PNG`～`people-18.PNG` 均為 2109×2984，未重繪、裁切、拉伸、鏡射或覆寫。

## 動畫與排列

`layout.js` 依進站 placements 的不透明 bounds，把每個人物可見高度統一成 1060×顯示比例，腳底落在共同基準線。保留原本從右到左的順序；PNG 容器高度會隨透明留白不同而改變。相鄰不透明 bounds 保留可見高度 32% 的水平空隙，桌機約95px；以可見輪廓推算總寬，不以PNG透明外框當間距。

`useArchiveMotion.js` 只引用進站的互動 config 與 interactionMath：

- 主頁所有人物固定在正常展示姿態，不再依解碼、水平捲動或進入視野播放 translateY、淡入及自動縮放提示。
- 相同腳底支點、hover 1.10 倍、95/20 scale spring、78/16 hover 回彈、72/13 sway spring、原始 impulse 與角度限制仍保留。
- 輸入和回彈只在需要時排程 RAF；IntersectionObserver 僅暫停整個區塊離屏時的運算，不觸發任何人物進場。沒有每幀 React setState。
- 命中測試以 localPoint 反算腳底縮放及二軸旋轉，再使用原版 alpha bits，透明區不會命中。

進站檔案本身不修改。主頁不載入其地球、背景演出或進站捲動鎖定。

## 詳情轉場

`HistoryObservation.jsx`：修正首次 AnimatePresence initial=false 抑制起點的問題。原位框、旋轉、縮放、透視與腳底支點一起量測並保留；背景姿態暫停，同一 motion image 往返來源與左側目標。切換依人物實際水平位置尋找左右鄰者，並預載相鄰插畫；人物旁的三角與文字導覽依畫面位置設定首尾邊界。詳情保持同一固定展示區，右側可獨立捲動，Escape 收起。背景 inert，長卷位置與主頁捲動位置保留。

拖曳、觸控板水平滑動、Shift＋滾輪、進度滑桿、年代索引與探索按鈕沿用。普通垂直滾輪仍可捲動主頁。拖曳 6px 門檻與 350ms click 抑制避免誤開。

## 歷史分期與仍待作者確認

- 沿用既有時代對應，包含作者已確認的宋朝。插畫不指認特定真實人名。
- people-1 的具體南方古猿物種、people-2 的物種與用火意象仍待確認，不以服裝或火焰推定精確年代；資料中明確提示。
- 戰爭插畫的具體國籍／軍種未經確認，不作指定。
- 古希臘本卷聚焦前8～前1世紀；伊斯蘭黃金時代採約8～14世紀，文藝復興採約14～17世紀，註明分期不同。
- 十字軍1096～1291指聖地戰事；蒙古各汗國不能以元朝1368年滅亡一概終止。
- 工業革命1760～1840指英國早期；二戰採通常1939～1945範圍，另說明亞洲1937年全面中日戰爭。
- 人類演化是分枝，文明發展互有重疊；圖像不是等比例年代尺，也不是全球共同必經順序。

## 檢查

`node --test src/components/main/historyArchive/archive.test.mjs`（4項）

`node --test src/components/main/scrollPathMap.test.mjs`（2項：直線高度映射、迴圈連續性與可逆性）

`node --test src/components/main/historyArchive/archive.test.mjs src/dev/history/*.test.mjs`

`npm run build`

組合測試原有 initialPeopleHint.test.mjs 的兩個斷言仍使用舊500ms／180ms，而原始實作已是650ms／220ms。本次保留進站實作與其舊測試，不為消除失敗而修改演出參數。

瀏覽器檢查：18個時代、首尾三角邊界、往返中間影格、背景與資料獨立捲動、拖曳防誤開、前後人物高度、1024px及一般桌機排版、進站與主頁其他區塊。

## 主頁線條進度

`../HomeGeometry.jsx` 保留既有SVG路徑與區塊定位，在重新量測時依路徑弧長採樣769個實際y座標。`../scrollPathMap.js` 用單調回歸處理角色區迴圈的向上回折，再以少量弧長分量展開平台區間，採單調三次插值讓段落間速率連續。

每次scroll只排程一次RAF，以目前視窗82%高度對應路徑，不再使用整頁百分比的1.7次方或90ms追趕延遲。頁面ResizeObserver和resize會重新建立映射，往上捲動沿同一映射返回；不修改人物動畫、主頁其他區塊外觀或原始插畫。筆端位置可從`.home-geometry`的`data-tip-y`（視窗座標）與`data-draw-mapped`檢查。

## 長文閱讀檢查

閱讀區沿用 flex:1、min-height:0 與 overflow-y:auto，正文按 paragraphs 逐段渲染，未設行數截斷或固定正文高度。底部導覽位於捲動區之外。

`node --test src/components/main/historyArchive/*.test.mjs src/dev/history/interactions.test.mjs` 檢查 Markdown 順序、解析出的文章欄位、章節及段落渲染、參考資料連結與既有互動。渲染測試採獨立暫存目錄，避免影響開發預覽的相依套件快取。
