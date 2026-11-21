# Telescope 觀測輔助功能 — 2026-10-14

## 完成內容

- 圓窗右上附近三個 32px 圓形入口：隨機觀測、學長推薦、我的收藏。相對 `.tt-window-anchor` 絕對定位，不固定於瀏覽器右上。標籤、tooltip、鍵盤焦點及 accessible name 齊備。
- 隨機清單獨立於推薦：台北、格林威治、阿塔卡馬、京都、雷克雅維克。使用預設觀測縮放，保留目前 globe/satellite 模式和方向／俯仰／傾斜；不連續挑同一地點。
- 推薦資料為空陣列 `RECOMMENDATIONS`，預留 `{ id, name, observation, description }` 结构，入口只顯示未完成提示。原本 SCHOOL RECORDS 與角色內容未新增或改寫。
- 我的收藏復用 LOG 抽屜，名稱選填；無名稱時用模式與座標命名。保存目前畫面，而非預設景點。相同相機狀態提供「取消目前收藏」，清單提供 VIEW LOCATION / DELETE。
- 新入口開啟抽屜時不使用背景遮罩、不攔截圓窗操作；原 LOG 的 modal 操作保留。
- 收藏保留原 key `genesis:telescope-test:collection:v1` 和既有欄位。新增 pitch、roll、savedAt；保存 longitude/latitude/zoom/bearing/mode。相機移動或樣式切換中不保存不完整狀態。損壞或未知收藏格式禁止覆寫；storage 寫入失敗顯示訊息。
- 去重容許相機恢復浮點誤差：座標 <0.00001°、zoom <0.001、方向／俯仰／傾斜 <0.005°。名稱不影響同一觀測狀態的識別。

## 地圖接入

仍使用現有 MapLibre 實例、OpenFreeMap Liberty 與 EOX 衛星／Mapterhorn 地形來源，沒有更换服務。`TelescopeMap` 新增 pitch、roll 的 capture/flyTo，並在 style.load 完成且模式一致後執行待恢復視角，不再只等待 idle；避免資源尚未 idle 時恢復請求卡住。

MapLibre 相機支援 center、zoom、bearing、pitch、roll：[CameraOptions 官方文件](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/)。

開發版 DOM 文字適配層新增 `data-dev-text-dynamic` opt-out；只有此次新增的狀態文字／動態操作按鈕使用，避免編輯器把收藏按鈕與相機摘要寫回舊文字。

## 實際驗證

- 桌面開發頁與正式預覽均看見三個入口；正式版量測 toolbar 的 position=absolute，位置跟随圓窗 anchor，沒有開發編輯器入口。
- GLOBE 隨機觀測到阿塔卡馬，座標變為 -23.020°, -68.210°。
- SATELLITE 隨機觀測到格林威治，51.477900°, 0.000000°，實際截圖看見衛星地形。
- 學長推薦顯示未完成提示，資料陣列為空。
- 保存任意當前觀測、重新整理仍存在、VIEW LOCATION 恢復、取消目前收藏與 DELETE 均實測。
- 衛星測試狀態 zoom=2、bearing 約 -3.234°、pitch 約 68.705°；重新整理回到 GLOBE 後，重開收藏成功切到 SATELLITE 並恢復這些值。收藏按鈕顯示「取消目前收藏」，不新增相同狀態。
- 收藏抽屜開啟時，實際拖曳圓窗，座標從格林威治變至约 51.513207°, -0.048843°；鍵盤 + 縮放也成功，抽屜摘要同步更新。
- 原角色點擊仍顯示原 active 對話，GLOBE / SATELLITE 切換正常；BACK 返回後研究室正常顯示，望遠鏡已探索標記正常。
- 正式版保存與取消收藏正常，推荐抽屜正常；新版本正式建置成功。`node scripts/check-telescope-observations.mjs`、既有 `node scripts/check-editor-store.mjs`、`git diff --check` 均通過。
- 本次自建測試紀錄已透過介面移除。原有「Codex Edition 操作驗證」收藏保留，沒有清空 localStorage 或 commit。

## 限制／未驗證

- 現有頁面没有真正的街景／panorama 服務，SATELLITE 是衛星地形；沒有 panorama ID 可保存或恢復。
- 收藏是相機狀態，不是畫面截图或離線圖磚；影像与地形仍依外部服務、網路、來源版本及視窗尺寸。不能保證逐像素相同，地形相機計算也可能產生很小浮點差異。
- 舊收藏沒有 pitch/roll：roll 使用 0；satellite 舊 pitch 使用既有 70°，globe 使用目前既有模式俯仰，无法找回过去未保存的值。
- 未驗證所有預設地点／缩放组合的圖磚、非零 roll 的實際視覺恢復、極端高俯仰／極區、手機響應式、瀏覽器禁用 storage 的 UI 故障注入。相機身份／舊資料／未知格式的資料層測試已通過。
- 尚不包含自動登入、跨裝置同步或圖片素材生成。
