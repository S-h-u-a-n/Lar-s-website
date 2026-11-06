# 作者名片與社群網址

`HomeAuthor.jsx` 是正式主頁許願箱後的最後一個主要內容區塊。
樣式集中於 `HomeAuthor.css`，作者頭像直接引用 `Art/Main-art/REMOANPU.jpg`，不修改原圖。

請在同目錄 **`authorLinks.json`** 填入六個平台的 `url`，例如：

```json
{ "id": "x", "label": "X（Twitter）", "mark": "X", "url": "https://你的實際個人網址" }
```

保留原有六筆資料，只修改網址即可。空白、非 HTTP(S) 或格式不合法的網址顯示為停用按鈕，沒有 href、不跳轉、不連到平台首頁。
有效網址以新分頁開啟，具備 `rel="noopener noreferrer"`；也有 Hover、按下與鍵盤焦點回饋。
各平台目前皆為空白，旁邊的小記號是文字標籤，不是額外下載的美術或官方 Logo。

主頁順序：主視覺 → 探索 → 角色介紹 → 許願箱 → 作者名片 → 既有 Footer。
可在 `App.jsx` 中 `HomeAuthor` 與 `Footer` 之間繼續加入來源／借物表；名片與線條不依賴 Footer 固定高度。
`HomeGeometry.jsx` 的同一條 SVG 線延續原有捲動動畫，收在名片左側星標。

預覽：`npm run dev`，開啟 http://127.0.0.1:5186/?edition=main 並向下捲動。
