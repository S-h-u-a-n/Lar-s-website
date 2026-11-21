# Ball 音樂分類：目前實作

音樂直接使用其他分類的 `WorkSelector`、`motion.button` 與 `Cover`。卡片比例、Hover 同步縮放、切換動畫、邊框、圓形／斜線／格線及頁面後方網點均走既有結構。只在無海報封面內增加歌名與歌手的文字排版。

Spotify iframe 只存在於 `WorkDialog` 的內容捲動區，沿用目前六首歌曲連結。詳情外框與比例未改動。列表播放器、固定規則、播放器高度計算、音樂列表專用寬度與捲動、雙色裝飾及 `musicPalette` 設定已移除。

配色採其他分類的資料陣列依索引輪替方式，直接使用先前已取樣的 `Art/IntroScreen/square` 素材 RGB：

| 歌曲 | 素材 | 背景 |
| --- | --- | --- |
| TATTOO | 2s.PNG | #FFD6C6 |
| さよーならまたいつか！ | 8s.PNG | #FFE4C5 |
| 内臓ありますか | 12s.PNG | #FBF4EB |
| Rubia | 13s.PNG | #C6D483 |
| 春は溶けて | 3s.PNG | #EAEB8E |
| 幽霊街と逆説 | 7s.PNG | #FFB5AB |

2026-11-18 Chrome 驗證：六首依序測試 Hover、回復收合、上下切換、點擊詳情；列表均無 Spotify iframe，詳情均有對應播放器。檢查桌面收合／展開畫面與詳情實際載入，並切回電影確認海報與卡片正常。

驗證命令：`npm run build`；`node --test src/components/ballTest/spotifyEmbed.test.mjs`。
