# 同行者檔案館（獨立實驗）

啟動 `npm run dev`，開啟 http://127.0.0.1:5186/?dev=characters 。
`?dev=characters` 是保留的開發實驗入口。
正式主頁 `?edition=main` 下方已有角色介紹區塊，透過 App 紙幕轉場進入同一個 `CharactersPage`；也可用 `?edition=characters` 直接開啟（含正式建置）。
`CharactersPage` 接受可選的 `onBack`，App 只在角色頁返回首頁時還原先前捲動位置，其他返回流程不變。

首頁展示元件與文案位於 `src/components/main/HomeCharacters.jsx`，樣式位於同目錄 `HomeCharacters.css`。
頭像在區塊接近視窗時才載入，可按左右按鈕、鍵盤方向鍵或橫向滑動切換。首頁文案是可修改的暫定介紹，不代表正式人物設定。

## 素材與資料

`characters.js` 以 Vite glob 自動收錄 `Art/avatar` 的 JPG/JPEG/PNG/WebP/AVIF/GIF（含全大寫副檔名），載入失敗者不加入角色牆。
新增圖片後 Vite 會重新整理模組；需要時重新載入頁面即可。不必調整數量或建立佔位符。
圖片原件不會被修改，牆上所有容器均為一致的 1:1 圓角正方形，圖片使用 `object-fit: contain`。

檔名去除副檔名就是角色穩定 ID，也是未提供正式名稱時的顯示名稱。請勿為同一角色放多個同名、不同副檔名檔案。
在 `characterProfiles.json` 以該 ID 補入資料，例如（僅說明欄位格式，非正式人物設定）：

```json
{
  "圖片檔名": {
    "name": "正式姓名",
    "year": "年級",
    "department": "學系或身分",
    "specialties": ["特長"],
    "missions": ["參與任務"],
    "notes": "人物介紹或備註，可使用換行。"
  }
}
```

空欄位顯示待補錄。索引編號僅代表本次收藏排序，不是正式角色學號。

## 互動與效能

固定格位池依 viewport 大小分配，拖曳不會增加節點數；格位回收與位置更新在單一 RAF 迴圈，沒有 React 每幀更新。
列間錯開圖片序列（每列偏移四位），格線本身對齊。尺寸 160px、水平步距 210px、垂直步距 200px；小螢幕為 116px / 146px。
只提供短暫位置平滑，沒有放手速度慣性、畫布縮放、自動漂移或旋轉。入場為 480ms 縮放淡入，按格位錯開最多 140ms。
循環位置以角色週期正規化，避免累積巨大座標。6px 拖曳門檻與放開後 click 抑制避免誤開。
詳情使用原生 modal dialog（焦點限制、Escape、焦點返回）；開啟後背景 inert、畫布停止，關閉保留位置。
獨立角色索引提供每位角色唯一的鍵盤按鈕，避免重複格位污染 Tab 順序。支援 reduced-motion。

目前原圖 2048px，瀏覽器仍需解碼原始圖像；若未來素材量大，可另由素材流程提供適當尺寸衍生圖，不應直接覆寫原件。

驗證：`node --test src/dev/characters/gridMath.test.mjs`、`npm run build`，另須在瀏覽器檢查實際操作與排版。
