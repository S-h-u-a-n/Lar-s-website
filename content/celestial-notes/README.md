# 天球見聞 Markdown 編輯說明

每篇見聞各存成 `content/celestial-notes/` 下的一個 `.md` 檔案。建議使用容易辨認且不重複的英文檔名，例如 `note-orbis-academy.md`；不要使用 `README.md` 作為文章檔名。

檔案開頭使用 YAML Front Matter。`id`、`title`、`status` 必填；`author`、`date`、`order`、`subtitle`、`signature`、`icon`、`iconAlt`、`theme` 可省略。`id` 在天球見聞分類中必須唯一；修改標題不會改變文章識別。

```md
---
id: note-orbis-academy
title: 關於王立 ORBIS 學院
author: ""
date: ""
order: 1
status: published
---

這裡開始撰寫天球見聞的內容。

## 小標題

可以介紹學院、魔法、歷史、文化或其他世界觀設定，並使用 **粗體**、清單與 Markdown 連結。
```

- `title` 顯示為文章標題；作者與日期留空時不會顯示。
- `order` 數字越小越前面；相同或省略時以 `id` 排序。
- `status: published` 會顯示；`status: draft` 會保留檔案但不出現在正式列表。
- 正文支援段落、`## 小標題`、`**粗體**`、清單與 Markdown 連結。
- `subtitle` 可填副標題；`signature` 可填署名。
- `icon` 可選填 `Art/Big/Big-letter/` 中的圖片檔名，`iconAlt` 可提供圖片替代文字。`theme` 可選用 `butterMint`、`strawberryMint`、`peachSky`、`skyButter`、`mintPeach` 或 `lavenderSky` 卡片配色；未指定時沿用此分類的預設卡片樣式。既有學院校徽卡使用 `icon: orbis.PNG` 與 `theme: butterMint`。
- 每篇見聞一個檔案；如果需要跨頁，可在正文獨立一行加入 `<!-- pagebreak -->`。
- 存檔後 Vite 開發頁面會自動更新；新增 `.md` 檔案也會自動加入，不必修改程式碼。
