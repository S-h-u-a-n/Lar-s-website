# 望遠鏡「大家推薦」照片

核對日期：2026-11-21。15 張全部下載成功，沿用 0 張，沒有替代圖片、下載失敗或尚未核實的授權。總計 3,473,289 bytes（3.47 MB / 3.31 MiB）。

所有圖檔位於 `public/images/telescope/recommendations/`。原始推薦內容只更新 photoPath，地點、文案、角色、順序、座標與連結均保留。與原有 public 素材比對 SHA-256 後，沒有重複圖檔，沒有覆蓋原創素材。

## 來源與授權

Commons 使用官方 1280px 等比例 JPEG 縮圖（請求 1200px，API 回傳 1280px 標準尺寸）。Pexels 使用官方 images.pexels.com 的相同照片 ID，寬 1200px、auto=compress、cs=tinysrgb、fit=max，沒有 crop、fit=crop 或高度限制。下載後沒有二次壓縮、圖檔裁切、拉伸或轉檔；網頁顯示採 cover 裁切。15 張均為 JPEG，尺寸與來源比例相符，沒有需要保留的透明背景。

Commons 逐張核對檔案頁的 imageinfo/extmetadata 與 wikitext，保留來源修訂 ID。Pexels 程式讀取頁面回傳 403，因此改用原生 Chrome 開啟指定頁，逐張確認攝影者、照片 ID、原始尺寸及頁面「免費」授權連結；圖檔直接從 Pexels 官方伺服器下載。Pexels License 允許網站使用，標註攝影者並非必要，但本次全部提供署名及原始頁面；不得暗示人物／品牌背書、轉售未修改照片或作為圖庫重新散布。條款入口：[Pexels License](https://www.pexels.com/license/)。

完整來源資料、修改紀錄、檔案大小與 SHA-256 見 [TelescopeRecommendationImageLicenses.json](TelescopeRecommendationImageLicenses.json)。前端沿用既有 PhotoCredit 的 ⓘ 與原生 dialog，僅新增可選的來源連結文字；其他頁面預設仍為 Commons。

阿瑞娜提供的連結缺少 `arp` 前後的空格。透過 Commons 標題搜尋核實同名的指定裁切版本，實際檔名為 `Glastonbury tor (the final climb) arp (cropped).jpg`，沒有換用其他照片。哈里特與阿瑞娜的指定來源檔本身已是裁切版本，本地圖檔保留該版本完整構圖；網頁顯示另以 cover 置中裁切。

## 排版與安普說明

圖片框保留原來的 `aspect-ratio:16/7`、`min-height:110px`、14px 圓角與邊線。依後續更正，15 張統一使用 `object-fit:cover`、`object-position:center`、width/height 100%，保持原始比例填滿圖框，超出部分在框內裁切，不拉伸。原有 overflow:hidden 限制圖片範圍，框外留白不變；圖框底色與裝飾線設定沿用。僅推薦照片的 CSS 被調整，角色頭像保留既有呈現方式。圖片使用 lazy loading 與 async decoding。

安普目前推薦埃爾凱斯／古犬城。Commons 原始頁說明指定圖片為古埃及新王國時期阿努比斯小雕像，並提及其與古犬城的信仰關係。圖片下方說明為：「此處以古埃及新王國時期的阿努比斯木雕小像，呈現古犬城與阿努比斯信仰的文化連結；照片為文物參考，並非埃爾凱斯遺址實景。」沒有宣稱遺址沒有照片，也沒有暗示該文物出土於推薦地點。

後續圖片框置中調整：保留原有預留區比例及版面編輯器儲存的圖片寬高，將圖片從左上角的 absolute 定位改為 Grid 中央格，兩側與上下使用相同的彈性軌道。ⓘ 與圖片共用中央格並靠右下對齊，圖片本身設 12px 圓角。保留 DOM 層級，避免既有版面編輯器以選擇器識別的尺寸設定失效；未加入尺寸量測、固定位置偏移或新的邊框／陰影。瀏覽器已目視確認置中與圓角，並核對拉爾圖片調整前後仍為 463.047 × 201.453px。

## 驗證與維護

- 相關 24 項測試通過：15 位角色的精確來源對應、圖檔雜湊／尺寸比例／唯一性、授權欄位、SSR 的 base-aware 本地路徑、lazy loading、共用 ⓘ、安普說明、既有文章與圖片回歸。
- `npm run build` 通過，保留既有大型 bundle 提醒。
- 本機開發 5186 與正式產物預覽 4186 的 `/Lar-s-website/` 下，15/15 圖片 HTTP 200、圖片 MIME、SHA-256 全部相符。
- `git diff --check` 通過。原始推薦 Markdown 扣除註解與 photoPath 後，與 HEAD 完全一致。
- 可重跑 `node scripts/check-telescope-recommendation-photos.mjs`；附加開發、預覽或正式根網址，可一併檢查 HTTP／MIME／雜湊。
- 獨立瀏覽器檢查入口：開發伺服器下的 `scripts/fixtures/telescope-recommendation-photos.html`，直接使用正式 RecommendationCard、CSS 與 PhotoCredit，方便排除地圖服務影響。
- 瀏覽器連線服務不可用。原生 Chrome 可核對來源，但本機頁面畫面擷取不完整，且共用瀏覽器期間有使用者操作，未完成可靠的桌面／觸控目視及 dialog 互動測試。仍需人工確認 15 張照片置中裁切後的主體位置、ⓘ 開關與焦點返回、安普說明及觸控捲動。

本次只保留本地修改，未執行 Git push 或 GitHub Pages 部署。

## 逐張清單

| 角色 | 指定來源 | 作者 | 授權 | 本機尺寸 | bytes |
|---|---|---|---|---|---:|
| 拉爾 | [Svalbard Global Seed Vault Exterior 2020.jpg](https://commons.wikimedia.org/wiki/File:Svalbard_Global_Seed_Vault_Exterior_2020.jpg) | Cierra Martin for Crop Trust | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | 1280 x 913 | 345849 |
| 伊爾 | [基隆市](https://www.pexels.com/zh-tw/photo/26065891/) | Alix Lee | [Pexels License](https://www.pexels.com/license/) | 1200 x 800 | 161702 |
| 俄斯塔 | [British Museum at night 2024-12-20.jpg](https://commons.wikimedia.org/wiki/File:British_Museum_at_night_2024-12-20.jpg) | Andy Li | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | 1280 x 964 | 313824 |
| 尤塔 | [秋季羅德島州普羅維登斯市的城市天際線](https://www.pexels.com/zh-tw/photo/34571466/) | Beth Fitzpatrick | [Pexels License](https://www.pexels.com/license/) | 1200 x 800 | 196768 |
| 里德 | [伏見稻荷大社絢麗多彩的鳥居](https://www.pexels.com/zh-tw/photo/39195537/) | Bruna Santos | [Pexels License](https://www.pexels.com/license/) | 1200 x 800 | 162753 |
| 安普 | [木雕阿努比斯像.jpg](https://commons.wikimedia.org/wiki/File:%E6%9C%A8%E9%9B%95%E9%98%BF%E5%8A%AA%E6%AF%94%E6%96%AF%E5%83%8F.jpg) | 丘崈 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | 1280 x 1280 | 208667 |
| 哈里特 | [American Airlines Center (6246886325) cropped.jpg](https://commons.wikimedia.org/wiki/File:American_Airlines_Center_(6246886325)_cropped.jpg) | Jeff Attaway | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 1280 x 1040 | 387866 |
| 凱恩 | [壯闊的峽谷風景](https://www.pexels.com/zh-tw/photo/4228971/) | Amber Stevens | [Pexels License](https://www.pexels.com/license/) | 1200 x 800 | 205881 |
| 賽斯 | [伊斯坦堡大巴扎充滿活力的內部景象](https://www.pexels.com/zh-tw/photo/37687962/) | Tayssir Kadamany | [Pexels License](https://www.pexels.com/license/) | 1200 x 800 | 272627 |
| 檑恪楒 | [加拉帕戈斯陸龜在自然栖息地](https://www.pexels.com/zh-tw/photo/26381580/) | Lloyd Douglas | [Pexels License](https://www.pexels.com/license/) | 1200 x 800 | 164968 |
| 帕托 | [秘魯著名的納斯卡線條鳥瞰圖](https://www.pexels.com/zh-tw/photo/40692070/) | Radha Daehne | [Pexels License](https://www.pexels.com/license/) | 1200 x 675 | 133453 |
| 阿瑞娜 | [Glastonbury tor (the final climb) arp (cropped).jpg](https://commons.wikimedia.org/wiki/File:Glastonbury_tor_(the_final_climb)_arp_(cropped).jpg) | Adrian Pingstone (Arpingstone) | [Public domain](https://commons.wikimedia.org/wiki/File:Glastonbury_tor_(the_final_climb)_arp_(cropped).jpg#Licensing) | 1280 x 768 | 230838 |
| 德俄斯庫里 | [Pefnos egg.jpg](https://commons.wikimedia.org/wiki/File:Pefnos_egg.jpg) | Kavouras55 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 1280 x 830 | 253953 |
| 法雷奈 | [美國佛羅里達州太空中心的宇宙飛船](https://www.pexels.com/zh-tw/photo/13228960/) | john mckenna | [Pexels License](https://www.pexels.com/license/) | 1200 x 800 | 174469 |
| 伊西斯 | [國會圖書館內部的優雅建築](https://www.pexels.com/zh-tw/photo/36623370/) | Quang Vuong | [Pexels License](https://www.pexels.com/license/) | 1200 x 800 | 259671 |
