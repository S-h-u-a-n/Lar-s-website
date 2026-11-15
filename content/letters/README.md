# 來信 Markdown 編輯說明

每封信各存成 `content/letters/` 下的一個 `.md` 檔案。建議用容易辨認且不重複的英文檔名，例如 `letter-from-academy.md`；不要使用 `README.md` 作為文章檔名。

檔案開頭使用 YAML Front Matter。`id`、`title`、`status` 必填；`from`、`to`、`date`、`order`、`subtitle`、`signature`、`icon`、`iconAlt` 可省略。`id` 在來信分類中必須唯一；標題可隨時修改而不影響信件識別。

```md
---
id: letter-from-academy
title: 王立 ORBIS 學院通知
from: 學院事務處
to: B-612 研究室
date: ""
order: 1
status: published
---

親愛的研究室成員：

這裡開始撰寫信件正文。

可以自由分段，也可以使用 **粗體** 等 Markdown 格式。

此處為署名。
```

- `title` 顯示為信件標題；`from`、`to`、`date` 是可選的寄件資訊，正文可自行保留稱謂與署名。
- `order` 數字越小越前面；相同或省略時以 `id` 排序。
- `status: published` 會顯示；`status: draft` 會保留檔案但不出現在正式列表。
- `subtitle` 可提供英文副標題；`signature` 可填信件署名。
- `icon` 可選填 `Art/Big/Big-letter/` 中的圖片檔名，`iconAlt` 可提供圖片替代文字。未提供圖片時會使用預設信封圖樣。
- 正文支援段落、`## 小標題`、`**粗體**`、清單與 Markdown 連結。
- 每封信一個檔案；若正文需要跨頁，使用獨立一行 `<!-- pagebreak -->` 分頁，閱讀器會依序翻頁。
- 存檔後 Vite 開發頁面會自動更新；新增 `.md` 檔案也會自動加入，不必修改程式碼。
