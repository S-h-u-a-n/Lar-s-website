# The Wizard’s GENESIS — 主開發版本

自 2026-10-11 起，這個資料夾承接兩輪 Codex Edition，作為接下來主要開發版本。視覺、互動與原創素材保留。已完成本機 Git 接入，主分支為 `genesis-next`；尚未 push 或部署正式網站。

- 開發路徑：`/Users/remoanpu/Desktop/GENESIS-Codex-Edition`
- 開啟 `GENESIS-Main.code-workspace` 即可在 VS Code 開發，工作區只包含新版本。
- `npm run dev` → http://127.0.0.1:5186/
- `npm run build` → dist
- `npm run preview` → http://127.0.0.1:4186/
- 已安装依賴，這次不用再安裝。新環境用 `npm ci`，Node 符合 Vite 的 `^20.19.0 || >=22.12.0` 要求。

[目前 Git 接入與日常開發](docs/GIT-INTEGRATION.md) · [接入前交接紀錄](docs/PROJECT-HANDOVER.md) · [兩輪設計及啟動說明](README-CODEX.md) · [第二輪紀錄](docs/Codex-Edition-round2.md)

原版保留在 `/Users/remoanpu/Desktop/The Wizard's GENESIS`，包含未提交修改、Git 歷史、素材及開發紀錄；不要在原版進行新開發或清理。第一輪 Edition 封存仍在 `versions/`。
