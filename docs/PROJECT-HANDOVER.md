> 本文件是接入前的歷史紀錄。Git 已經使用者同意接入，最新狀態請見 [GIT-INTEGRATION.md](GIT-INTEGRATION.md)。

# The Wizard’s GENESIS 正式開發交接

日期：2026-10-11。狀態：本機主開發入口已完成；Git 歷史接入等待確認；未 push、未部署。

## 版本保護與備份

- Original：`/Users/remoanpu/Desktop/The Wizard's GENESIS`。原資料夾就是完整歷史留存，包含 .git、所有既有素材、未提交與未追蹤檔案、開發紀錄及配置。沒有重新複製一份，也沒有刪除任何內容。
- 主開發：`/Users/remoanpu/Desktop/GENESIS-Codex-Edition`。維持目前兩輪設計，沒有替换舊版 CSS 或新做頁面。
- 第一輪 Edition 封存：`versions/round-1-20261011-122856.tar.gz`；第二輪程式與素材保持在主開發資料夾。
- 本次對原版 316 個來源／紀錄檔案記錄 SHA256、大小、修改時間，Git HEAD／全部 refs／狀態／remote 一併保存；完成後比對一致。原版的 deleted/modified/untracked 都是交接開始時既有狀態，沒有清理或重設。
- 原版 `git fsck --connectivity-only --no-dangling` 成功。這是原資料夾留存，不是另外的外接磁碟備份。
- 新版本含全部 132 個原版 Art/Mode/public 檔案，雜湊一致；所有 src 檔案皆存在。原版 Font 多數未使用的靜態字重未再複製；實際使用字型與授權完整存在。原版 reference、texture-comparison 等開發參考仍完整留在 Original，非運行依賴。
- 已補回 `curve-test.html`，其 src/dev/CurveTest.jsx 與編輯器程式原已存在。

## 已完成的接入準備

- 建立 `README.md` 主開發入口。
- 建立 `GENESIS-Main.code-workspace`，只開新版本，不混入 Original。
- 建立 `.gitignore`：排除依賴、建置、私密環境、快取與大型封存；保留實際使用字型及新增的 Playfair Italic。沒有 git init／git add／commit。
- 保留 Vite/React/Three/Framer Motion/MapLibre、package-lock 與原有素材載入方式。不重新安裝依賴。
- 運行程式沒有引用 Original 或 /private/tmp，也沒有硬編碼的本機服務網址；5186/4186 只在啟動 scripts 與說明中。`scripts/verify-original.py` 是明確的唯讀稽核工具，非網站運行依賴。

## Git／GitHub 已確認狀態

Original 分支 main，HEAD `b2222d2f4a47959cd8e507075b165d225ce867be`。
本機分支還有 backup-before-cleanup、current-website-clean；保留不動。
Origin：`https://github.com/S-h-u-a-n/Lar-s-website.git`。
Edition 目前沒有 .git，因此沒有分支、commit 或 remote。
遠端 main 唯讀查得 `c876f5c5a35990b2b81b9aa5a495dfe43acc7aa7`，與本機 origin/main 相符。
`git merge-base main origin/main` 回傳 1：本機 main 與遠端 main 沒有共同祖先，不可以當成正常快進 push。

原版本機沒有 `.github/workflows`，Vite base 預設 `/`；新版也維持 `/`。
遠端 main 是舊 React/TypeScript 模板，build 為 tsc -b && vite build；不得套用它的舊程式或 build script 覆蓋新版。
遠端 `vite.config.ts` 設定 `/Lar-s-website/`；`deploy.yml` 用 Node 22、npm ci、npm run build、上傳 dist、actions/deploy-pages。
工作流程在 push main 或 workflow_dispatch 觸發。此次沒有執行任一觸發。
公開 `https://s-h-u-a-n.github.io/Lar-s-website/` 回應 HTTP 200；未認證的 Pages API 回應 404，因此未確認帳戶內 Pages Settings 的細節。
依據：[遠端工作流程](https://github.com/S-h-u-a-n/Lar-s-website/blob/main/.github/workflows/deploy.yml)、[遠端 Vite 設定](https://github.com/S-h-u-a-n/Lar-s-website/blob/main/vite.config.ts)。

## 待使用者確認的具體 Git 方案

建議保留現有两個資料夾與路徑，在 Edition 接入同一個 repository 的完整歷史，使用新分支 `genesis-next`，不改 main、不 push。

1. 只在暫存位置 clone 既有遠端 Git 歷史，不 checkout 舊版程式至 Edition。
2. 唯讀匯入 Original 本機的全部分支，放在獨立 `original-history/*` refs；不使用 shared alternates，不讓新版 Git 依賴原版路徑。
3. 另在新 repository 的歷史封存分支保存 Original 當前工作樹，包括未提交與未追蹤內容；Original 本身不 commit、不改動。
4. `genesis-next` 從當時遠端 main 建立，以 Edition 當前程式與素材作為新提交，保留兩輪設計。兩套歷史以 refs 保留，不強行 merge unrelated histories。
5. 新版 origin 承接相同 GitHub repo；原版 origin 不變。忽略規則排除私密設定、依賴及封存，不刪除本機檔案。
6. 以本機分支／完整檔案差異讓使用者驗收；遠端工作流程保留但本次不發布。

以上涉及新 repository 接入與 remote，依本次要求尚未執行。實施前需確認，並重新檢查遠端是否有新 commit。Git 歷史獨立保存會增加磁碟使用量；應先確認可用空間，不能以刪除 Original 換取空間。

## 啟動與 VS Code

雙擊 `GENESIS-Main.code-workspace`，或 VS Code → File → Open Folder → 選擇主開發資料夾。

```bash
cd /Users/remoanpu/Desktop/GENESIS-Codex-Edition
npm run dev
```

http://127.0.0.1:5186/。已有同一版本 server 時直接開網址，不必重啟。
正式建置 `npm run build`；建置預覽 `npm run preview` → http://127.0.0.1:4186/。
Node 目前 v24.21.0；Vite 8.3 的要求為 ^20.19.0 或 >=22.12.0。現有依賴不需重裝；新機器使用 npm ci。

## 驗證

本次只做一次正常正式建置，674 modules，成功。保留大型 bundle 提示，未更改效能或設計。
Chrome：Main 完成五次揭幕 → 研究室模型實際載入；Natural/Human/Favorites/Telescope/Globe 五頁載入；Globe 地球選取開啟 Earth 筆記 → 返回研究室。該次 smoke test console error 為空。
圖片與 3D 資源皆從本專案 import/new URL 及 Vite 打包載入。各頁完整互動與桌面尺寸實測沿用第二輪紀錄；本次未再次播放完整故事／漫畫、寫收藏或跑大型效能測試，以節省電力。

## 未來 GitHub Pages 部署

取得 Git 接入與發布授權後，先在 genesis-next 測試 `/Lar-s-website/` 的 base：可用 `npm run build -- --base=/Lar-s-website/`，或正式確定部署目標後改 Vite config。當前 base 保留 `/`，不宣稱能直接上傳至專案子路徑。
確認 Linux 大小寫、所有字型／模型已追蹤、外部地圖可用，並保留新版 package-lock 及 vite build。
檢查 Pages Settings 使用 GitHub Actions 及既有 workflow 的相容性。經使用者驗收後再決定合併／push main；這一步會觸發正式部署，需另行授權。本次不做。

## 空間清單（du，約值）

| 項目 | Original | 主開發 |
|---|---:|---:|
| 整個資料夾 | 1.9 GB | 777 MB |
| Git 歷史 | 874 MB | 尚無 |
| node_modules | 121 MB | 121 MB |
| dist | 215 MB | 213 MB |
| Art | 72 MB | 74 MB |
| Mode | 88 MB | 88 MB |
| Font | 555 MB | 48 MB |
| Edition 第一輪封存 | — | 208 MB |

Original 有約 507 MB 額外字型字重，仍完整保留。原始依賴／dist 約 336 MB、新版約 334 MB 可重建，但此次未刪除。
/private/tmp/GENESIS-Codex-Edition 是第一輪作業副本，並非目前主開發；可待確認與封存比對後再考慮移除，這次不動。
原版 .git 多為鬆散 objects；日後可先做獨立 Git 備份再評估非刪史的壓縮，這次不 gc、prune 或清理。

完整狀態與原版比對：`handover-state.json`。未更名、覆蓋、搬移、清空或部署任何版本。
