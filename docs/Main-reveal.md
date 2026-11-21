# Main 正方形拼貼揭幕

直接重製原有 MainArtworkReveal。沿用 HeroSection 的圖片 overlay 與唯一 body portal 遮罩；未修改 Header、App、Main 排版、文字、按鈕、其他頁面或既有轉場，未加入依賴。

## 統一設定

`src/components/main/revealConfig.js` 集中色彩、配色權重、圓角、細縫、響應式尺寸、五個互動位置、圖片相對座標、hover／單格／圖片／波浪時間及翻角變化。

預設：#26BADE、#EBF75C、#FFD0DB、#F6EEDF；22% 左上與右下圓角；3px 縫；hover 300ms／反向 220ms；單格 400ms／預備 6°／正式 90°；main-1 1000ms；五格手動揭開；最後等待 180ms、波浪 1500ms；距離延遲 ±30ms、翻角 ±8°。

十色配色依 45%／35%／20% 分組配額洗牌，再在各組內抽色，避開已知四鄰同色。每次元件掛載產生新 seed，ID 色彩存在 cache 中，render 與 resize 不會重抽。

## 幾何與覆蓋

可見外框根據 documentElement.clientWidth、innerHeight 及 Header DOM 下緣量測。每個完整單元為正方形，邊緣允許裁切；不存在拉長的末列或全域米白背景。每格自己的正方形米白底負責縫隙與圓角缺口，彩色表面內縮 gap/2 並裁切 hover 圓形；旋轉、淡出與移除作用於完整單元，米白部分同步消失。

以原 JPEG 的可調 face.center 與 face.clip 經圖片真實 DOM 大小、位置與旋轉矩陣換算臉部中心與差分範圍。完整方格格線以臉部單元 (0:0) 為基準，響應式邊長參考 clamp(88px, 9vw, 126px)，當完整差分位置更大時適度增大整個等邊格線。每次 resize 重新計算可見行列，已揭開 ID 保留；其餘互動目標從集中設定的不同畫面區域選擇未揭開且可見的格子。

## 狀態與圖片

ready → hover（可逆）→ revealing → 下一格 ready；第五格完成 → final → complete。同步 ref 鎖避免重複點擊。Hover 使用左下角固定圓心、easeOutCubic 與持續填色進度；click 接續目前值直到填滿，不把圓形重設為零。單格以 Web Animations API 輕抬、翻至側面並淡出，只有該 ID 移除。

Mainart.JPG、main-1.jpg、main-2.jpg 均為 8994 × 4048 JPEG，實際內容分別為原圖、注意、眨眼。三圖先 decode；兩張差分的完整影像在原圖片容器內先掛載、初始 opacity 0，不參與排版。第一格移除之後才顯示 main-1，獨立計時 1000ms 後顯示 main-2，其他點擊不重設此計時。main-2 保持至整片遮罩完成。完成時原圖與 complete 狀態同一次更新，清除圖片計時器、格子、遮罩及差分影像；卸載取消全部 RAF、動畫與計時器。

最終單一 RAF 時間軸以第五格為起點，按距離延遲傳遞；每格先抬 6°、再朝主要波浪方向翻至 90°±8°、接近側面時收起並淡出。每格完成就移除其米白與彩色單元。新出現在 resize 後的格子接入當前時間軸，原格子的進度不重置。無爆炸、位移飛散、粒子、鏡頭縮放、發光或卡片陰影。

## 實際驗收

- 四種桌面尺寸：1024 × 768、1280 × 720、1920 × 1080、2560 × 720；遮罩皆從 header.bottom（87px）覆蓋至左右與底部，所有單元寬高相同，第一格涵蓋實際臉部，僅一個互動格，scrollWidth 等於視窗寬度。
- 行列依尺寸調整，實測可見格數 80／60／60／30。另以五種尺寸對整個遮罩取樣確認無未覆蓋區域，並檢查五個目標互異與 palette cache 穩定。
- 第一輪 60 → 59 → 58 → 57 → 56 → 55；第一至第四格各僅移除一個 ID，其他單元 DOM 邊界與 transform 完全一致。前四次全域 waveTiles = 0。
- Hover 不點擊時會填粉紅色，圓心 left=0、top=100%，被 22% 圓角表面裁切；移出後平順回到 scale 0。點擊承接中途進度（觀察到 scale 0.0779），未重新歸零。
- 第一格米白與表面同步移除，ID 0:0 不再存在。揭開後 data-expression=attention；720ms 時仍為 attention，約 1004ms 時變 wink。第二至第四格完成後仍為 wink。
- 第一格揭開後 resize 至 1024 × 768，仍在第二步，0:0 未復原，expression=wink，所有單元仍正方形。
- 最終開始時 55 格，約 1050ms 時剩 37 格，之後 0 格；波浪開始後只觀察到 waiting／lift／flip，無 translate。遮罩背景透明，米白按單元移除。
- 波浪中 resize 至 1920 × 1080，仍正常完成；第五格完成後至清理約 1643ms（含 180ms 停頓）。完成遮罩、格子、差分影像數皆為 0；顯示保留的 Mainart.JPG。
- 原有 Enter the world 可進入 3D world，Back 可回 Main；瀏覽器無錯誤。production build 通過。

驗證圖片：/tmp/main-collage-initial.png、/tmp/main-collage-hover.png、/tmp/main-collage-wave.png、/tmp/main-collage-wave-late.png、/tmp/main-collage-complete.png。

額外 resize 競態驗證：第三格填色／翻格中縮至 2560 × 400，點擊 ID -2:2 已移至視窗外（top 約 743px），仍維持同一個 actor 完成揭開。恢復視窗後此 ID 數為 0，第四步正常啟用，再完成第五步與波浪，無錯誤或卡住。
