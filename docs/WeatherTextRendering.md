# 魔法天氣藥水文字閃動／殘影排查

## 確認的環境與原因

2026-11-15 以使用者獨立 Google Chrome 原分頁檢查：
`http://127.0.0.1:5186/?edition=bottled-weather`。
當時僅一個 Node 監聽伺服器，PID 2474，cwd 為本專案；Chrome 載入 `@vite/client` 與 `src/main.jsx`，非 dist 舊建置。實際模組 HTTP 回應 200、`Cache-Control: no-cache`，包含現行空字串條件渲染。頁面沒有 active Service Worker controller。沒有以清除快取、關閉 GPU 或停用動畫作修復。

原分頁逐一切換九瓶：各有一個 `.wp-potion-remark`，一個說明文字節點，computed text-shadow 為 none、動畫結束 opacity 為 1，沒有額外 `.text-draft`。部分介紹文字與 JSX 不同，因該來源有保存的文字編輯草稿，不能據此判定版本錯誤。

在隔離的 localhost 來源透過真實文字編輯器 store 清空說明後，MutationObserver 於 700ms 內捕捉至少 30 次空字串／原句交替：

1. `applyTextRecord` 依編輯值將文字清空。
2. `DomPageAdapter.scan` 的 `!text.trim()` 跳過空白節點，未加入 seenText。
3. 清理流程誤認該元素已離場，呼叫 `restoreText` 恢復原句、解除登錄。
4. 下一次掃描重新登錄並套用保存的空字串，循環重複。

這是可實測的 DOM 改寫循環，不是只靠畫面猜測 GPU／CSS 原因。React 的空 note 防護處理的是來源資料；編輯器是直接改寫 DOM，因此不能阻止這個循環。共用掃描器也處理左側介紹與備註，故納入一起驗證。

## 最小修復

只調整 `src/dev/DomPageAdapter.jsx` 的文字掃描條件：先取得已登錄 record，僅跳過「沒有 record 的空白元素」。已登錄且被編輯成空白的元素仍被追蹤，不再誤觸還原清理。

本次沒有修改九瓶資料／文案、WeatherPotions.jsx 的既有空文案防護、CSS、動畫、模擬引擎或保存資料格式；沒有清除使用者 127.0.0.1 來源草稿。

## Chrome 回歸工具

`http://localhost:5186/scripts/fixtures/weather-text.html`

使用真實 WeatherPotions、DomPageAdapter 與文字 store，自動依序測試九瓶及 `.wp-lead`、`.wp-description`、`.wp-margin-note p`。每組清空、等待、重新輸入診斷文字、等待、還原原值。觀察文字變動次數、登錄身份、單一說明容器、computed opacity／text-shadow。只在 localhost 執行，完成後恢復測試前的兩個文字 storage key，不觸碰使用者 127.0.0.1 來源。

首次新載入版本結果：12 組全部通過，文字變動各 2–3 次（清空、重輸入、還原），最終 opacity=1、text-shadow=none；截圖確認正常說明、介紹與備註未重疊。熱更新中的舊分頁曾仍記錄舊循環與失敗結果，沒有將它計入修復成功證據；成功結論以新載入回歸頁為準。

前景重新整理後再次完成 12 組、0 失敗。背景執行曾產生未登錄節點與 opacity=0 的無效測試：瀏覽器延後 RAF 登錄，但定時器已開始編輯。回歸工具已增加可見性與登錄等待；沒有為此改動正式頁動畫。

最後回到使用者原本的 127.0.0.1 正式路由分頁，重新載入後保留其原有介紹／備註草稿；關閉診斷工具，實際依序點選九瓶再回雨水並截圖，當時藥水說明及介紹未見重影。沒有改寫該來源的文字草稿。

輔助檢查：`node scripts/check-editor-store.mjs`、`node --test src/dev/domLayout.test.mjs`、`git diff --check`、正式建置。這些只作回歸補充，不作消除視覺殘影的證明。

限制：已重現並修復清空後反覆還原的路徑；截圖不能證明所有瞬間的 Chrome 合成殘影都不存在。沒有修改來源文案做磁碟 HMR 測試，避免更動使用者九瓶內容；其他瀏覽器與不同電腦未測。
