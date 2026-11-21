# 正式導航與資源就緒修復驗證（2026-10-31）

## 問題判定與變更

- 原版 START 在暖快取下未穩定重現永久卡住，不能宣稱已找出所有使用者現場故障的唯一原因。已確認原碼的通用遮幕在目的頁切換後固定 180ms 就揭開，並未等待 Big 模型。GLB 成功回呼也在首幀之前發布 ready；非同步場景初始化缺少完整例外收斂，沒有載入逾時失敗出口。
- 保留既有 CurveTransition。Big 現在必須完成必要 GLB、內嵌貼圖解碼、原有場景/材質/互動登錄、GPU compileAsync 與實際 render，才發布 ready。檢查 GLB metadata：42 張內嵌圖片，沒有外部圖片 URI。Hover 圖示、開發編輯器與其他功能頁不列入必要資源等待。
- 必要準備逾時 60 秒是失敗而非成功：取消載入，露出既有錯誤/重試 UI。WebGL 建立、載入/解析、依賴、編譯、render 及 context loss 都有失敗出口。失敗與 loading 狀態的 Canvas 不接收操作；就緒後恢復。
- 實作過程中實際發現 Three FileLoader 會以 URL 共用在途請求，StrictMode 舊掛載 abort 會波及新掛載。改用各掛載自己的 fetch AbortController，再 parseAsync；晚到結果不得更新已卸載頁面。這是修復期間發現的取消競爭，不能據此斷言原版已存在同一個 abort 故障。
- Big loading 不再顯示 ResourceStatus 的準備文字或其專屬 loading UI；保留現有遮幕圖像、美術素材及錯誤/重試 UI。沒有刪改 Art、Mode、Font。
- 功能頁 CircularReveal 改為等待 Suspense 內真正掛載的目的頁，Bottled Weather 仍等待已繪製的 WorldCanvas。lazy 匯入或初始 effect 例外有錯誤邊界，不永遠留在 closed。
- 最新正式建置的直接 Big 入口實際重現「模型 ready 但遮幕仍 covering」。SVG 等待 dimensions 才掛載，若那時 phase 已是 covering，initial=false 會跳過動畫與完成回呼。SVG/path 現在明確從原有 idle 開始；沒有更換路徑、時長或 easing。
- 轉場期間 shell inert，研究室工具與索引停用；完成時釋放導航鎖。保留原有曲線、圓形、故事及五次主視覺揭幕。PortalPageArrival 的 reduced-motion 交接不依賴被取消的 CSS 動畫結束事件。
- 自然/人文在原揭幕完成後，從下一個可見畫面開始總覽停留 1250ms。隱藏分頁不計時；手動 pointer/wheel/key、離開頁面會取消等待。兩頁原資料均為六個主題，未更動數量。手動選取不會被自動展開覆蓋；既有常駐圓形、縮放透明度、空白收合、文章關閉保留。

## 實際瀏覽器驗證

| 路徑/情境 | 結果 |
| --- | --- |
| 正式長圖 → Into the World → 故事 → 前往WorlD → 主頁 | 通過，原轉場完成 |
| 主頁五次主視覺揭幕 → START → Big（開發模式） | 通過；實際讀到 loading + covered + inert，之後 ready + idle |
| 正式建置預覽 4186，揭幕完成後連點 START | 通過；單一 Canvas；loading 時保留遮幕，ready 才退出；瀏覽器 error log 為空 |
| Big 錯誤畫面的重新準備 | 實測可從錯誤恢復 ready；該錯誤來自修復期間的 StrictMode abort 競爭，並非故意斷網 |
| Big 3D 書本 → 自然頁 | 通過，模型射線點擊與圓形揭幕有效 |
| 自然/人文轉場完成後先總覽、再自動展開 | 兩頁通過；總覽 selected=null，之後 land/history，沒有自動開文章 |
| 自然頁等待期間先縮放、先手動選海洋 | 通過；取消自動展開，手選保持 water |
| 自然 → Big；Big → 人文；人文研究索引 → 研究室 | 通過；返回資源 ready，索引可導航 |
| Big → Globe → Big | 通過，頁面顯示且返回轉場完成；未完整測試所有天體與故事內容 |
| Big → Telescope 故事 → 開始觀測 → Telescope → Big | 通過；地圖 loading/focusing 最後退出；未測所有地圖模式/收藏 |
| Big → Bottled Weather → Big | 通過；已繪製畫布後揭幕，返回時模型必要資源尚未完成會繼續等待 |
| Big → Favorites → Big | 通過，未測所有作品詳情 |
| 多次返回 Big 後模型物件介紹、放回研究桌 | 通過 |
| 返回 Big 後指標/Hover | 實測 canvas cursor=pointer，Hover 節點 display=block、opacity=1；只有一個 Canvas 與 Hover 節點 |
| 最新正式建置直接 Big 入口、返回主頁後再連點 START | 通過；修正首次 SVG covering 掛載競爭後，最終 ready / idle / inert=false / canvas pointerEvents=auto，error log 為空 |
| 正式建置 Big → 自然頁 | 通過；reveal idle 時仍是總覽，再自動展開且 circle opacity=.4 |

## 自動測試與限制

- 85 項測試通過：asyncReadiness、既有 history、storybook layout、WeatherPotions 與 fallingSand 測試。
- 新增 6 項測試覆蓋：必要資源 timeout 必須失敗、首幀只提交一次、卸載忽略晚到完成、可見總覽 1250ms、隱藏時間不計算/操作取消、隱藏掛載等待可見。
- npm run build、git diff --check 通過。仍有原有大型 chunk 警告。
- 沒有實際注入網路斷線、損壞 GLB、GPU context loss；這些錯誤出口有程式防護，但不能回報已在瀏覽器故障注入通過。未驗證實體慢速網路、低階 GPU、Safari/Firefox、真實觸控與作業系統 reduced-motion 切換。
- 沒有修改模型位置、材質值、燈光、相機構圖、分類內容或美術素材；沒有 Commit 或 Push。
