# 主頁許願箱

元件：`../HomeWishbox.jsx`、`../HomeWishbox.css`。
使用瀏覽器直接 POST Web3Forms，不經代理、不公開收件信箱，不向 console／分析服務輸出願望、信箱或 API 回應。

## 本機設定

專案根目錄 `.env.local`：

```dotenv
VITE_WEB3FORMS_ACCESS_KEY=你的 Web3Forms Access Key
```

已依本次提供的公開識別碼設定 `.env.local`；此檔已被 `.gitignore` 排除。
新環境可複製根目錄 `.env.example` 為 `.env.local` 再填值。VITE_ 變數會編入前端，並非私密伺服器金鑰。
變更環境變數後重新啟動 `npm run dev`。部署時在建置環境設定同名變數，再執行 `npm run build`。

主頁預覽：http://127.0.0.1:5186/?edition=main ，許願箱在角色介紹區塊下方。

## 垃圾訊息防護

採官方支援的 hCaptcha（Web3Forms 提供的公開 sitekey），搭配 `botcheck` honeypot、前端雙重提交鎖與服務端的垃圾訊息檢查。
不需安裝套件。驗證程式只在開始填寫／操作表單時載入。阻擋第三方腳本或驗證逾期時會提示重試，不會繞過驗證。

**請到 Web3Forms 後台選取該表單，將 Block Spam / Captcha 設定為 hCaptcha**，確保服務端拒絕沒有有效 token 的直接請求。Access Key 本身無法讓程式代替你更改此帳號設定。
官方已將單獨 honeypot 標為不建議，因此不提供停用 captcha 的正式旁路。

## 真實寄送測試

hCaptcha 官方不支援 `localhost`／`127.0.0.1` 作為 supplied hostname。純 UI 可在上述網址測試；真正完成驗證並寄送，請使用正式網站網域，或為本機設定測試網域：

1. 自行在 hosts 檔加入 `127.0.0.1 genesis.test`（macOS：`/private/etc/hosts`，需系統管理權限；此實作沒有修改 hosts）。
2. `npm run dev`，開啟 http://genesis.test:5186/?edition=main 。Vite 已明確允許此測試 hostname。
3. 滑至許願箱，先測試空白願望及錯誤信箱：不得出現提交請求。
4. 輸入一段可辨識的測試願望，信箱留白，手動完成 hCaptcha 後按「寄出願望 ✧」。
5. Network 中應只有一次 `POST https://api.web3forms.com/submit`。僅 HTTP 成功且 JSON `success === true` 才會出現成功文字與動畫。
6. 到 Web3Forms 綁定收件信箱（含垃圾郵件匣）確認通知，確認指定主旨與願望內容。
7. 選「再寫下一個願望」，使用你自己的測試信箱再寄一次，於通知郵件按回覆，確認 Reply-To 為填寫的地址。網站不會自動回信。
8. 可離線測試錯誤：請求失敗後內容必須保留，重新連線、重新驗證後可重試。逾時／斷線可能發生於服務已接收之後，故不自動重送，避免重複通知。

表單只有成功後才清空。送出中欄位唯讀、按鈕停用，20 秒逾時取消。失敗保留內容並重置一次性驗證；換頁時取消請求，避免卸載後更新 UI。

## 檢查

`node --test src/components/main/wishbox/service.test.mjs` 使用完全本機的模擬 transport，沒有對外寄信。
另執行 `npm run build` 與瀏覽器排版／驗證檢查。測試 key/token 只存在單元測試，不會編入產品或繞過正式 hCaptcha。

官方參考：
- https://docs.web3forms.com/getting-started/api-reference
- https://docs.web3forms.com/getting-started/customizations/custom-reply-to
- https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha
- https://docs.hcaptcha.com/#local-development
