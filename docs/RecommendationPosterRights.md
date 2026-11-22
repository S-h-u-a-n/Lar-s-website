# 推薦頁指定海報與權利調查

> **目前狀態（2026-11-21）**：已依使用者後續明確指示完成 15 張指定海報的本地整合，下載失敗 0 張，總容量 2,627,902 bytes。整合紀錄與驗證結果見 [RecommendationPosterIntegration.md](RecommendationPosterIntegration.md)。既有權利調查資料保留；整合指示沒有被記作第三方授權。
>
> **以下為整合前的歷史查核紀錄**：「未下載／未上架」、0 bytes、自繪圖仍在展示等敘述僅描述當時狀態，現行展示及檔案狀態以整合紀錄與 `posterSources.json` 為準。以下研究內容未重新調查。

查核日期：2026-11-21。此文件記錄使用者指定的 15 張圖片，並區分來源平台、作品相關方、指定圖的權利人及實際展示許可。不是授權書，也不宣稱非營利推薦自然具有轉載權。

## 本次結果

- 保留六個分類的原有順序：電影、遊戲、動漫、文學、表演藝術、音樂。前五類各三部，組內依使用者指定順序；音樂六部與原有內容完全保留。
- 舊暫用作品已從資料移除。Deadpool、Persona 3 Reload 的既有資料與推薦 Markdown、自繪海報維持原狀；其餘 13 部新作品的介紹、推薦理由與對話留空，不加入「待補充」或虛構文案。
- 精確保存 15 個指定圖片網址，未更換版本。**可確認允許此次本地重新託管的指定海報：0 張；待確認：15 張。**
- **新增／沿用指定海報：0 張；新增圖片總容量：0 bytes。**尚未嘗試下載圖檔，因此不是下載失敗。沒有用遠端 img、CSS 背景或快取外連繞過此限制。
- 目前保留兩部既有作品的自繪素材，其餘卡片使用原本幾何底圖及作品名稱。這些底圖不是指定海報的替代版本，也不標成官方海報。
- 沒有建立空的 public 圖片目錄。逐張的預定路徑已記於 `plannedLocalPath`，將來取得許可後才放入 `public/images/recommendations/{movies,anime,literature,performing-arts,games}/`。
- 沿用共用 `PhotoCredit` 的 ⓘ 按鈕、原生 dialog、焦點返回與來源連結。作品詳情圖框右下角提供調查資訊；不在卡片按鈕內再巢狀放置按鈕。
- 作品索引底部加入可展開的權利聲明，並在海報資訊內重用。信箱沿用網站既有 `HomeAuthor.jsx` 的 `newworldremo@gmail.com`，提供 mailto 連結。未寄信，也未驗證郵件投遞；正式公開前仍應確認站長能收信。

## 資料與顯示原則

唯一的逐張機器可讀資料：[posterSources.json](../src/components/ballTest/posterSources.json)。欄位包含原始指定網址、平台、來源作品頁（能確認時）、官方作品參考頁、作品相關方及其角色、正式版權字樣（有查得時）、指定圖片權利人、封面設計／插畫者、使用條件、待辦、預定路徑、是否下載與容量。

全部 `permissionStatus` 為 `pending-permission`，`localPath` 為 null，`downloaded` 為 false。已確認的發行商、作者或製作單位，不能直接推導為這張海報的唯一著作權人；因此 `posterRightsHolder` 逐張明列「尚待確認」。官方作品頁連結也不冒充為指定圖片的已確認原始發布頁。

海報圖片未取得，因此僅能完成指定網址與作品資料的對應核對，未完成圖片內容、版次、語言、製作年份或與官方素材完全同一性的視覺核對。不得把此文件描述成「15 張海報已上架」。

## 平台使用條件

- **TMDB（9 張）**：[官方 API FAQ](https://developer.themoviedb.org/docs/faq) 提供有條件的非商業 API 使用方案，同時明示不主張擁有圖片。API 存取與底層海報權利須分別確認。本次未接入 API、未載入指定海報；若日後採用 API，還需遵守官方 logo、署名及非背書聲明等要求，不能只加入本地侵權處理聲明就視為已授權。
- **MobyGames（2 張）**：[官方 FAQ](https://www.mobygames.com/info/faq6/) 的可用規定明確談到附署名使用最多 20 張遊戲截圖，但沒有明確將該規定擴及此次指定的包裝封面。[條款](https://www.mobygames.com/info/terms/)另有限制未經允許的使用。直接讀取條款及 FAQ 回傳 403，已核對官方搜尋索引內容；仍應向平台／相應權利人確認這兩張封面的許可，不能把截圖規則直接套用於封面。
- **博客來（1 張）**：[會員服務條款](https://www.books.com.tw/data/qanda/servicepolicy.htm)說明網站圖片的權利可能屬平台或其他權利人。已找到官方出版社的同名書介紹，但指定電子書封面的美術權利鏈與轉載許可未確認。
- **Google 圖片快取（2 張）**：[Google 圖片使用說明](https://support.google.com/websearch/answer/29508)要求回到實際提供者確認授權。精確搜尋兩個快取 token 未找到可核實的原始發布頁；Google 不是所示封面的著作權人。未把其他版次的設計／插畫署名或許可套用過來。
- **巴哈姆特（1 張）**：[來源平台條款](https://user.gamer.com.tw/help/detail.php?sn=294)限制未經書面許可的轉載／展示。指定 CDN 圖未能追溯原始文章及官方素材，不能把巴哈當成作品或圖片權利人。

以上是目前查得的使用條件與本次處理決定，不是認定所有來源絕對禁止利用。仍需確認相應權利、適用範圍及任何例外，而非自行假定已有許可。

## 逐張資料表

以下「相關方」僅表示查證到的作者、出版、製作、發行或授權窗口角色；所有指定圖片的實際美術／攝影權利人及本站展示許可仍待確認。

| 作品 | 指定來源 | 已確認的作品相關方與證據 | 圖片權利／本地託管狀態 |
|---|---|---|---|
| The Big Short | [TMDB](https://image.tmdb.org/t/p/original/znvo8sEcGSHaZ9C59dqQLYf0YAC.jpg) | [Paramount Pictures](https://www.paramount.com/movies/the-big-short)（官方電影發行／介紹來源） | 尚待確認；未下載／未上架 |
| The Parent Trap | [TMDB](https://image.tmdb.org/t/p/original/p4dGmi8u9W0HHyVXcgWPoiFfKTF.jpg) | [Disney／Walt Disney Pictures](https://movies.disney.com/the-parent-trap-1998)（1998 年電影的官方發行／介紹來源） | 尚待確認；未下載／未上架 |
| Deadpool | [TMDB](https://image.tmdb.org/t/p/original/3E53WEZJqP6aM84D8CckXx4pIHw.jpg) | [20th Century Studios](https://www.20thcenturystudios.com/movies/deadpool)（電影官方發行／介紹來源）；[Marvel](https://www.20thcenturystudios.com/movies/deadpool)（角色相關權利；依既有作品資訊，不代表海報設計權歸屬） | 尚待確認；未下載／未上架 |
| HUNTER × HUNTER | [TMDB](https://image.tmdb.org/t/p/original/pAmBHolwskLDOsQlPSAevsToQpw.jpg) | [冨樫義博／集英社](https://www.ntv.co.jp/hunterhunter/caststaff/index.html)（原作者／出版方）；[バップ、日本テレビ、集英社、マッドハウス](https://www.ntv.co.jp/hunterhunter/caststaff/index.html)（2011 年動畫官方列示的製作著作相關方） | 尚待確認；未下載／未上架 |
| WITCH WATCH | [TMDB](https://image.tmdb.org/t/p/original/6thVm2QGuRqCdiT4nZ6tSFLoYc4.jpg) | [篠原健太／集英社・ウィッチウォッチ製作委員会・MBS](https://witchwatch-anime.com/)（動畫官方版權列示） | 尚待確認；未下載／未上架 |
| 月刊少女野崎くん | [TMDB](https://image.tmdb.org/t/p/original/4842Nau95xD3D2G2vgmFxiVIFP8.jpg) | [椿いづみ／スクウェアエニックス・「月刊少女野崎くん」製作委員会](https://www.kadokawa.co.jp/product/video2565/)（動畫官方版權列示） | 尚待確認；未下載／未上架 |
| 老窮奇幻紀事 | [博客來](https://im1.book.com.tw/image/getImage?i=https://www.books.com.tw/img/E05/021/28/E050212894.jpg&v=66135f72k&w=348&h=348) | [呂苡榕](https://www.mirrorfiction.com/news/1000)（作者）；[鏡文學](https://www.mirrorfiction.com/news/1000)（出版社） | 尚待確認；未下載／未上架 |
| Okay for Now | [Google 圖片快取](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrBCjJLEQ3BDxy6TOOxujZHc2qG2wMru3dg20_HUIe4g&s=10) | [Gary D. Schmidt](https://www.nationalbook.org/books/okay-for-now/)（作者）；[Clarion Books／HarperCollins](https://www.harpercollins.com/products/okay-for-now-gary-d-schmidt)（出版相關方，未確認指定封面版次） | 尚待確認；未下載／未上架 |
| All Tomorrows | [Google 圖片快取](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqfTkwjwYun7CygmFF-EB1B3n6qs1fujOjzsxtGnpl6w&s) | [C. M. Kösemen](https://cmkosemen.com/books.html)（作者與插畫創作者）；[Wilton Square Books](https://cmkosemen.com/books.html)（作者書目列示的英語實體版出版方；不代表此快取圖的版次） | 尚待確認；未下載／未上架 |
| Hamilton | [TMDB](https://image.tmdb.org/t/p/original/h1B7tW0t399VDjAcWJh8m87469b.jpg) | [Lin-Manuel Miranda](https://hamiltonmusical.com/london/cast-creative/)（音樂劇劇本、作曲與作詞）；[Disney](https://thewaltdisneycompany.com/news/hamilton-film-coming-exclusively-to-disney-beginning-july-3/)（2020 年影像發行相關方） | 尚待確認；未下載／未上架 |
| Come From Away | [TMDB](https://image.tmdb.org/t/p/original/9hAdtFyiRPyUYtWHzlPIDVsIUQ2.jpg) | [Irene Sankoff／David Hein](https://www.mtishows.com/come-from-away)（音樂劇編劇、作曲與作詞）；[Apple；eOne／Junkyard Dog Productions／RadicalMedia／Alchemy Production Group](https://www.apple.com/tv-pr/originals/come-from-away/)（2021 年影像發行及製作相關方） | 尚待確認；未下載／未上架 |
| Next to Normal | [TMDB](https://image.tmdb.org/t/p/original/whKyzehrdUDDhhseHTvuttHZUkH.jpg) | [Tom Kitt](https://www.mtishows.com/next-to-normal)（作曲）；[Brian Yorkey](https://www.mtishows.com/next-to-normal)（劇本與歌詞）；[Music Theatre International](https://www.mtishows.com/next-to-normal)（所查舞台版本的演出授權窗口，非據此認定為海報權利人） | 尚待確認；未下載／未上架 |
| Persona 3 Reload | [MobyGames](https://cdn.mobygames.com/covers/18191503-persona-3-reload-windows-apps-front-cover.jpg) | [ATLUS／SEGA](https://asia.sega.com/p3r/cht/)（官方權利標示） | 尚待確認；未下載／未上架 |
| 人狼村之謎（Raging Loop／レイジングループ） | [MobyGames](https://cdn.mobygames.com/7bb5839a-abfc-11ed-82af-02420a000136.webp) | [KEMCO／dwango](https://www.kemco.jp/applipage/ps/top.html)（官方遊戲版權列示，年份依版本而異） | 尚待確認；未下載／未上架 |
| Fate/Grand Order | [巴哈姆特](https://p2.bahamut.com.tw/B/2KU/36/0001206836.JPG) | [TYPE-MOON／FGO PROJECT](https://www.fate-go.jp/)（遊戲官方版權列示） | 尚待確認；未下載／未上架 |

## 逐張追溯與尚缺資料

### The Big Short

指定 TMDB 圖與官方素材版本的同一性及海報設計權歸屬尚待確認。

### The Parent Trap

以 1998 年電影官方頁為作品參考；指定圖的版本與權利鏈尚待確認。

### Deadpool

指定 TMDB 圖尚未獲准上架；目前繼續使用 REMOANPU 自繪海報。

### HUNTER × HUNTER

作品另有 1999 年動畫版本；未確認指定圖的動畫年分／版本，不把 2011 年製作名單當成指定圖的唯一權利人。

### WITCH WATCH

官方頁可追溯作品權利相關方；未確認指定 TMDB 版本的海報再利用許可。

已查得的作品版權字樣（不代表指定圖片取得授權）：`©篠原健太／集英社・ウィッチウォッチ製作委員会・MBS`。出處：[篠原健太／集英社・ウィッチウォッチ製作委員会・MBS](https://witchwatch-anime.com/)。

### 月刊少女野崎くん

官方作品頁不等於指定海報的重新託管授權。

已查得的作品版權字樣（不代表指定圖片取得授權）：`©椿いづみ／スクウェアエニックス・「月刊少女野崎くん」製作委員会`。出處：[椿いづみ／スクウェアエニックス・「月刊少女野崎くん」製作委員会](https://www.kadokawa.co.jp/product/video2565/)。

### 老窮奇幻紀事

可追溯官方出版社對同名書的介紹；指定電子書封面的設計者／攝影者與授權鏈仍待確認。

作者：呂苡榕；出版相關方：鏡文學；此版本封面設計者、封面插畫者：尚待確認。指定來源版本尚待確認；作者、出版社與封面設計／插畫權利分別記錄。

### Okay for Now

有多種版本；不得將其他版次的封面插畫署名套用到此快取圖。

作者：Gary D. Schmidt；出版相關方：Clarion Books／HarperCollins；此版本封面設計者、封面插畫者：尚待確認。指定來源版本尚待確認；作者、出版社與封面設計／插畫權利分別記錄。

### All Tomorrows

作者官方書目可核對作者及出版方，但指定快取圖未能追溯原頁；不能因原作曾免費提供閱讀便推定封面可轉載。

作者：C. M. Kösemen；出版相關方：Wilton Square Books；此版本封面設計者、封面插畫者：尚待確認。指定來源版本尚待確認；作者、出版社與封面設計／插畫權利分別記錄。

### Hamilton

舞台作品、2020 年影像及特定海報美術的權利須區分；此 TMDB 圖的製作版本及美術權利人尚待確認。

### Come From Away

Apple 官方提供 Key Art 入口，但未核實與指定 TMDB 圖相同，也未確認本站符合該宣傳素材使用條件；不另行替換或下載。

### Next to Normal

MTI 舞台演出／宣傳方案不代表此 TMDB 海報已有許可；指定海報的演出版本、攝影與設計者待確認。

### Persona 3 Reload

來源檔名標示 Windows Apps front cover；尚未核實掃描／上傳者及封面再利用許可。實況或遊戲截圖規範不等於包裝封面授權。目前保留 REMOANPU 自繪海報。

已查得的作品版權字樣（不代表指定圖片取得授權）：`©ATLUS ©SEGA All rights reserved.`。出處：[ATLUS／SEGA](https://asia.sega.com/p3r/cht/)。

### 人狼村之謎（Raging Loop／レイジングループ）

不以 2024 年官方產品標示推定此指定圖的發行地區、平台、年份或美術權利鏈；原始 MobyGames 圖片頁未確認。

已查得的作品版權字樣（不代表指定圖片取得授權）：`© 2015-2024 KEMCO / ©2015-2024 dwango`。出處：[KEMCO／dwango](https://www.kemco.jp/applipage/ps/top.html)。

### Fate/Grand Order

指定巴哈 CDN 圖的新聞／發布頁及所對應的官方素材未能追溯，不把平台當成著作權人。

已查得的作品版權字樣（不代表指定圖片取得授權）：`©TYPE-MOON / FGO PROJECT`。出處：[TYPE-MOON／FGO PROJECT](https://www.fate-go.jp/)。


## 取得許可後的上架條件

逐張確認圖片本身的原始發布者與權利人，留存涵蓋本網站本地託管／公開展示／必要縮圖或網頁裁切的許可、署名方式、適用地區、期限及撤回條件。不能將出版社身分、官方作品頁、實況政策、舞台演出授權或媒體下載入口自行擴張成這張指定圖的再利用許可。

僅下載同一指定圖的合適解析度版本。Google 快取先找回原始頁；若無法核實同一版本，不另找替代圖。新增的 `/images/` 圖片經既有 `photoUrl` 套用 Vite base，支援 `/Lar-s-website/`。不得將 `plannedLocalPath` 當成已存在的圖檔路徑。

## 侵權處理聲明

本站展示之作品封面、海報及相關視覺素材，其著作權與商標權歸各自權利人所有。本站僅作非營利性作品介紹與推薦，不主張擁有他人素材之權利。如權利人認為使用內容涉及侵權，請透過 [newworldremo@gmail.com](mailto:newworldremo@gmail.com) 通知，我們將立即移除相關素材並配合處理。此聲明不替代素材使用授權。

## 驗證紀錄

- 18 項相關測試通過，涵蓋六類順序、五類每類三部、移除舊暫用作品、新作品無虛構文案、保留既有推薦／自繪素材、音樂回歸、15 筆來源資料、未授權圖不進入 img、來源細節及現有聯絡信箱。
- 以修改前快照比對，音樂資料及 Deadpool／Persona 3 Reload 兩筆既有作品紀錄逐字相同；推薦 Markdown 未修改。
- 正式建置通過，保留既有大型 bundle 提醒。`git diff --check` 通過。
- Chrome 實測 `/Lar-s-website/?dev=ball-test`：索引共 21 件（五類各三部、音樂六部）；來源視窗可開啟、Escape 僅關閉上層來源視窗、返回作品並恢復 ⓘ 焦點；索引聲明與 mailto 顯示正確。
- 檢查桌面、390×844 窄視窗、844×390 觸控橫向手機及 1024×768 觸控平板。來源資訊在受限高度內可捲動。390×844 觸控直向沿用網站既有「請將裝置橫向旋轉」提示，未修改原有方向限制。
- 目前沒有新增海報圖檔可做實際本地 HTTP 圖片驗證；測試已確認未授權網址不被外連載入，並確認 `Cover` 經 `photoUrl` 處理 `/images/` 子路徑。既有自繪素材仍由 Vite import 管理。
- 正式上線前仍須：逐張取得適當許可、核對指定海報的實際內容／版次、驗證下載圖檔與正式子路徑，以及確認聯絡信箱可接收權利通知。

## 主要修改

- `src/components/ballTest/data.js`：更新五類作品清單，保留音樂及兩部既有作品內容。
- `posterSources.json`、`PosterCopyright.jsx`：逐張來源／權利調查與既有 ⓘ 內容、共用侵權聲明。
- `WorkDialog.jsx`、`WorkIndexDialog.jsx`、`BallTest.css`：詳情頁來源按鈕、索引中的聲明；不更動海報框尺寸與展示方式。
- `WorkSelector.jsx`：沿用共用 `photoUrl` 處理未來本地海報的 Vite base。
- `src/components/research/PhotoCredit.jsx`：僅加入可選內容插槽，原有頁面的預設署名內容不變。
- `posterSources.test.mjs`：資料、權限狀態與渲染回歸檢查。

所有修改留在本地；未執行 Git push、未部署 GitHub Pages、未替使用者寄送授權或侵權通知。
