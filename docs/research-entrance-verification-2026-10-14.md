# 自然／人文進場引導驗證

## 實作

兩頁共用 `useResearchEntrance`，沿用 `useResearchCamera` 的 world transform 與既有緩動曲線：全景停留 1050ms → 鏡頭聚焦 1500ms → 顏料提示 1800ms。自然選取 LAND & GEOLOGY，人文選取實際第一項 HISTORY & CIVILIZATION。

顏料提示以三層不規則、柔化的 CSS 漸層擴散，在既有圖形／文字下方使用各主題原有顏色，最後淡出。pointer-events 為 none，不新增美術資產，不更改研究資料、既有素材或細項排版。

原有 edition 樣式使細項超出 category 的資料高度；引導會量測實際卡片與標題范围來決定鏡頭目標，確保第一主題的兩張細項都入鏡。全景縮放下限與細項可見門檻依 viewport 調整，避免小視窗無法展示全畫布或聚焦後細項被隱藏。

App 只向自然／人文傳遞 entranceReady，引導等待既有圆窗／紙幕轉場完成。入口頁的相機在 layout effect 先畫全景，避免初始原始比例闪現。

滑鼠、滾輪與鍵盤操作會停止未完成的自動引導，取消待執行 timer，並把 camera target 設為当前实际視角，再由原有拖曳／縮放接手。結束不還原全景。resize 與減少動態設定改變也會取消引導；prefers-reduced-motion 初始為 reduce 時直接聚焦，不播放鏡頭移動或顏料效果。

## 通過的實際檢查

- 開發版兩頁均觀察到 overview → focusing → wash → done，主題正確，原有細項可見。
- 1512×805 及實際較小的 935×502 視窗：量測第一主題兩張卡片均在 viewport 內；人文小視窗的 world 保持 normal 層級。
- 自然／人文 wash 與 done 的 world transform 相同，結束無視角跳動。
- 原有拖曳、縮放按鈕、OVERVIEW、分類選單、自然 VOLCANO 與人文 FIRST CITIES 閱讀正常。動畫 focusing 期間按縮小後 phase=interrupted。
- 正式版人文關閉閱讀動畫完成後，world transform 完全回到進入閱讀前的聚焦值。
- 從研究室工具開啟自然頁，focusing 時最近 `.circular-reveal` 的 data-reveal-phase 已為 idle。
- 最新正式版兩頁均完成 wash → done，顏料層的 CSS animation 名稱為 nt-pigment-fade、pointer-events=none、自然層有三個 blob，主題正確。
- `npm run build`、`git diff --check` 通過；建置仍有既有大 chunk 提示。
- `node scripts/check-research-entrance.mjs` 通過。使用真正 hook 原始碼與確定性時鐘／DOM 尺寸，驗證小視窗全景、途中取消、縮放銜接、完成回呼時機、最終視角穩定及 reduced-motion StrictMode effect replay。
- 既有 `node scripts/check-editor-store.mjs` 通過。未清除草稿、修改研究內容或執行 commit。

## 驗證範圍

減少動態效果的分支已做程式測試，未實際改動使用者的系統設定來驗證。極小手機尺寸、觸控多指操作、所有主題／閱讀內容組合，以及顏料動畫中段的完整逐幀視覺檢查尚未驗證。一般桌面畫面、鏡頭流程、實際元素範圍與原有核心互動已檢查。
