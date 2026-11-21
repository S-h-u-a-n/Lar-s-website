# 研究日誌 Markdown 編輯說明

每篇日誌各存成 `content/research-logs/` 下的一個 `.md` 檔案。建議使用容易辨認且不重複的英文檔名，例如 `log-first-observation.md`；不要使用 `README.md` 作為文章檔名。

檔案開頭使用 YAML Front Matter。`id`、`title`、`status` 必填；`author`、`date`、`order` 可省略。`id` 在研究日誌分類中必須唯一；標題可修改而不影響日誌識別。

```md
---
id: log-first-observation
title: 第一次研究紀錄
author: 拉爾
date: ""
order: 1
status: published
---

今天的研究紀錄。

## 小標題

可以撰寫多個段落，也可以使用 **粗體**、清單與連結。

<!-- pagebreak -->

這是同一篇日誌的下一頁，翻頁時會接續顯示。
```

- `title` 顯示為日誌標題；作者與日期留空時不會顯示。
- `order` 數字越小越前面；相同或省略時以 `id` 排序。
- `status: published` 會顯示；`status: draft` 會保留檔案但不出現在正式列表。
- 正文支援段落、`## 小標題`、`**粗體**`、清單與 Markdown 連結。
- 同一篇日誌需要分頁時，在要換頁的位置單獨加入 `<!-- pagebreak -->`。分頁標記不會顯示在正文；上一頁／下一頁會先走完本文各頁，再依 `order` 接到前一篇或下一篇日誌。
- 日誌不要為每一頁建立不同檔案；一篇日誌一個 `.md` 檔案，分頁標記保留原本的閱讀順序。
- 存檔後 Vite 開發頁面會自動更新；新增 `.md` 檔案也會自動加入，不必修改程式碼。
