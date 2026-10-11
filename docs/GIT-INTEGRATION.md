# Git 接入：主開發版本

日期：2026-10-11。經使用者確認，只進行本機版本管理，未 push、未部署。

## 現在的開發入口

`/Users/remoanpu/Desktop/GENESIS-Codex-Edition`，分支 `genesis-next`。
兩輪 Codex Edition 的程式、素材、動畫與樣式保留；僅更新交接文件。
新版提交以遠端 main `c876f5c5a35990b2b81b9aa5a495dfe43acc7aa7` 為直接 parent，保留遠端原有歷史。
實際最新 commit 使用 `git log -1 --oneline` 查閱；提交後驗證保存在 `.git/handover/final-verification.json`。

## 三份可獨立查閱與回復的歷史

| 歷史 | 新版 repository 內的固定參照 |
|---|---|
| 接入時遠端 main | `archive-remote-main-20261011` tag → `c876f5c5a35990b2b81b9aa5a495dfe43acc7aa7` |
| 原版本機 main | `archive-original-main-20261011` tag → `b2222d2f4a47959cd8e507075b165d225ce867be`；也有 `refs/backup/original/heads/main` |
| 原版當前未提交工作樹 | `archive/original-worktree-20261011` branch → `b1c51a9c0c0b118144d6df930d2ce628db4b4ff0` |

原版所有 19 個參照映射到 `refs/backup/original/*`，包含其他本機分支、當時的 remote-tracking 與開發 checkpoint。物件獨立儲存在新版 .git，沒有 alternates 或指向原版的 object 共享依賴。
兩套無共同祖先的 commit graph 沒有被強行 merge。原版工作樹封存提交的 parent 是原版本機 main，包含其 tracked 修改、刪除與 untracked 資料；額外保存未使用的字型及參考資料，共 316 個檔案。
node_modules、dist、快取、Git internals、.env 與本機私密設定不放入來源快照；它們仍原封不動留在 Original。

```bash
git log --oneline genesis-next
git log --oneline archive-remote-main-20261011
git log --oneline archive-original-main-20261011
git show --stat archive/original-worktree-20261011
git for-each-ref refs/backup/original/
```

若日後需要回復原版，可在新的空路徑建立獨立工作樹，不要 checkout 覆蓋主開發或 Original：

```bash
git worktree add --detach /private/tmp/GENESIS-Original-Restore archive/original-worktree-20261011
```

需要回復的是遠端旧版或本機已提交版本時，將最後的參照換成相應 archive tag。回復路徑若已存在，先另選新名稱。
備份參照皆只保留在本機。不要使用 `push --all`、`push --mirror` 或 `push --tags`，以免把大型備份／開發 checkpoint 一起發布。

## 日常 commit

```bash
cd /Users/remoanpu/Desktop/GENESIS-Codex-Edition
git status
git diff
# 明確選擇此次修改的路徑
git add src/ README.md
git diff --cached
git commit -m "Describe the change"
```

新版本機提交者目前為 `Codex <codex@localhost>`，避免冒用原版未設定的身份。日後可只在新版設定自己的 user.name / user.email，既有提交不需改寫。
.gitignore 保留實際字型及 Playfair Italic，排除 node_modules、dist、.env、快取與 versions/*.tar.gz；字型授權及原附 README 一併追蹤。
第一輪封存仍位於 versions/，沒有被刪除；它是本機大型封存，不進正式開發提交。
origin 維持 `https://github.com/S-h-u-a-n/Lar-s-website.git`。
此分支沒有 upstream；push.default 設為 nothing，日常裸 git push 不會自動發布；明確發布時另行指定分支。

## 未來正式發布的安全流程

1. 先 `git fetch origin`，確認遠端 main 是否有更新；若有，正常 merge 或建立新的整合分支檢查衝突，保留既有提交，不 force push。
2. 在 genesis-next 驗證 Pages 子路徑 `/Lar-s-website/`、Linux 大小寫、圖片／模型／字型追蹤及 Vite build。
3. 檢查原有遠端 deploy.yml 與目前 package-lock 相容；不要把遠端旧 TypeScript 模板覆蓋到新版本。已將遠端既有 deploy.yml 原封不動保存到新版，僅保留配置；未執行 workflow，也未修改 GitHub 設定。
4. 經使用者另行同意，才 `git push -u origin genesis-next` 並建立 PR，先檢查差異與建置。
5. 經正式發表確認後才合併至 main；遠端既有工作流程會在 main push 時部署 Pages。main 的合併／發布與本次本機接入是不同動作。

原版 `/Users/remoanpu/Desktop/The Wizard's GENESIS` 完全不動，包含原 .git 與未提交修改；沒有 stash、reset、clean、branch deletion 或部署。
本次驗證與基線完整存於新版 `.git/handover/`，可查看 source / refs / worktree 保護結果。
原 [PROJECT-HANDOVER.md](PROJECT-HANDOVER.md) 與 handover-state.json 是先前接入前的歷史報告，以本文件為目前狀態。
