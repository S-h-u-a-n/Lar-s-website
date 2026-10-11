# Main 布局與 TEXT 相容性驗證

日期：2026-10-10。僅 Main 啟用的新行為；Intro／Story／Big 導航與功能未改動。

## 修改檔案

- src/App.jsx：僅傳入 Main 是否可編輯的 props，導航邏輯未改。
- src/components/HeroSection.jsx：白色方塊和文字共用 IMG 定位容器；安全讀取原 Main layout；Main TEXT 保存與正式唯讀草稿顯示。
- src/components/Prelude.css：Main 專用群組右移、容器字級、文字換行與内容安全展開。
- src/components/main/Text.jsx：現有文字 hook 的 Main 包裝，未建立新編輯器。
- src/components/Header.jsx、Footer.jsx：只在 Main 啟用文字註冊，其他頁保留原顯示。
- src/components/ExploreSection.jsx、ExploreCard.jsx：Main 目錄與條目文字註冊。
- docs/Main-layout-verification.md：本文件。

## config 與定位

主視覺實際路徑為 Art/Main-art/Mainart.JPG，保持原圖與原長寬比 8994/4048。main-artwork 的 source config 未改：x=-69.48、y=-41.83、width=186.98、rotation=0。原 layout-editor:main-layout-v1 與 main-background-block ID 保留；新增安全唯讀還原，僅合併有限數值的原布局欄位，不遷移／清空／重寫存檔。開發編輯仍走原 LayoutEditor。

IMG 原座標是相對 hero-art 的百分比：x／width 依容器寬度，y／height 依容器高度。保留 art 的 grid、尺寸與 aspect-ratio；將 hero-copy 放進白色方塊，兩者共用定位基準，文字可由 TEXT 額外微調。組別以獨立 CSS translate clamp(12px,2vw,32px) 0 右移，不改存檔 x 值、不覆蓋原 rotation 或文字 translate。原 rise-in 動畫保留。

白色方塊的既有圓角／背景保留；内容以百分比內距、cqw 與 clamp 字級綁定方塊寬度。內容較高時背景可自然延伸，避免舊 fixed-height 裁掉文字或按鈕；既有 height 設定仍作最低高度。未編輯屬性由 CSS 響應式控制，TEXT 已修改的屬性仍由現有 buildTextStyle 套用。

TEXT 保存鍵：genesis:text-editor:home:v1，限定 home- ID 與 home 頁草稿；正式版唯讀載入，開發版沿用現有保存。保留原 home-hero-eyebrow 與 home-hero-intro ID，其餘新增31個，合計33個。圖示／箭頭等純裝飾不當作語意文字。

## TEXT ID 清單

### Hero

- `home-hero-eyebrow`（沿用）
- `home-hero-title-pre`
- `home-hero-title-main`
- `home-hero-title-subtitle`
- `home-hero-intro`（沿用）
- `home-hero-enter`
- `home-hero-scroll`

### Header

- `home-header-wordmark`
- `home-header-home`
- `home-header-world`
- `home-header-characters`
- `home-header-archive`
- `home-header-story`
- `home-header-about`

### Explore

- `home-explore-eyebrow`
- `home-explore-title`
- `home-explore-title-em`
- `home-explore-description`
- `home-explore-more`

### Cards

- `home-card-1-index`
- `home-card-1-title`
- `home-card-1-description`
- `home-card-2-index`
- `home-card-2-title`
- `home-card-2-description`
- `home-card-3-index`
- `home-card-3-title`
- `home-card-3-description`
- `home-card-4-index`
- `home-card-4-title`
- `home-card-4-description`

### Footer

- `home-footer-credit`
- `home-footer-copyright`

## 實際測試

Chrome http://127.0.0.1:5174/（無 dev query）走正常進站；另使用既有開發入口回到 Main 進行初次布局量測。以下尺寸是瀏覽器 CSS viewport。

| 尺寸／縮放 | 結果 |
| --- | --- |
| 1512×861，100% | 白色方塊 x 從20.97變51.21，右移30.24px；文字由75.59變105.56，右移29.97px。主視覺 before／after x=-17.57、y=105.93、寬1604.11、高721.97，完全一致。 |
| 1366×768 | 文字完整位於方塊內；GENESIS無橫向溢出，無整頁水平捲軸。 |
| 1920×1080 | 同上，維持原圖長寬比例与 config。 |
| 1024×768 | 同上；方塊依內容增高，按鈕保留於方塊內。 |
| 1280×600 | 同上；短視窗下原有頁面可縱向捲動，沒有文字裁切。 |
| Chrome110%，可用1374×782 | 文字仍在方塊內，無水平溢出；完成後恢復100%（1512×861）。 |

實際編輯器與功能測試：

- DOM 與 TEXT 下拉選單均確認33個独立 ID。
- 將 Enter 的文字暫改 Enter the world · QA、字級改11px，即時顯示；重新載入無 query 正式入口，走 Intro → Story → Main 後，文字與11px仍存在。完成後透過欄位還原 Enter the world／10px，未按 Reset。
- IMG 可選 main-artwork 與 main-background-block，主視覺仍為原 x/y/width。暫將方塊 X 增0.5%，方塊與文字均向右4.29px；填回原精確 X=-64.98779732633956，兩者完全復位。原高度135.1%、寬57.6%、圓角12%保持。
- Main 的 Enter the world 仍正常进入新版 Big，原進場與转場保持。
- npm run build、git diff --check 通過；既有大 chunk 警告仍存在。

尚未實測正式 build origin 的已保存設定（瀏覽器資料受 origin 隔離）、每個文字屬性的逐項保存、任意極端長文與超大人工字級、完整手機直式。手機仍沿用既有橫屏提示。沒有刪除素材、清空資料，沒有 Git commit 或 push。
