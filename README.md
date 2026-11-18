# 個人財務雲端儀表板（部署起始版）

## 已實作
- 原有2026–2040 ETF/銀行/房貸逐月試算、可調整參數、JSON與CSV匯出
- Supabase Email OTP/Magic Link 登入
- `user_settings` 表與 RLS：每位使用者只能讀寫自己的參數
- 登入後雲端讀取、儲存、手機/電腦同步；私人初始資料**不包含**在公開網站程式
- GitHub Actions 平日排程讀取 TWSE 八檔 ETF 最新可取得收盤價，資料日期需另核對
- 顯示按登錄股數計算的即時行情估值（**尚未取代未來模擬起點**）

## 尚未完成，不應誤認已上線
- 未部署正式網址；需你自己的 GitHub、Supabase 帳號
- 自動配息公告解析及發放日同步尚未實作。須先確認官方資料 API 的欄位與公告日期，避免錯誤配息入帳
- 市場資料目前只更新行情顯示，不會自動修改ETF預測起始市值、實際交易股數或股利再投入紀錄
- 原試算以固定年化殖利率、月度除息模型推估，不等於真實交易帳本
- 登入後同步為「最後一次寫入覆蓋」，多裝置同時編輯可能衝突

## 部署步驟
1. 建立 Supabase 專案，進入 SQL Editor 執行 `schema.sql`。
2. 在 Authentication > Providers 啟用 Email，設定 Site URL 與 Redirect URLs 為你的正式 GitHub Pages 網址（如 `https://帳號.github.io/儲存庫/`）。
3. 複製 Supabase **Project URL** 與 **publishable/anon key** 到 `config.js`。**絕不可填入 service_role 或 secret key**。
4. 將 `finance_cloud_site/` 內容放入 GitHub repository，Settings > Pages 設定從 main 分支 root 部署。GitHub Pages 使用 HTTPS。
5. 開啟網址、輸入 Email、點選信箱中的登入連結。
6. 使用「匯入參數」載入另附的 `私人參數_首次匯入_請勿上傳公開儲存庫.json`，然後點選「儲存到私人雲端」。
7. 在 repository Settings > Actions > General 檢查 Actions 具備 write 權限；手動執行一次 Update TWSE market quotes 工作流程，確認 `data/market.json` 更新。

## 隱私及注意事項
- **不要**將私人參數 JSON、密碼、銀行帳戶資料上傳至公開 GitHub repository。
- `config.js` 中的 Supabase anon/publishable key 可公開，資料保護依賴資料庫 RLS 與驗證，請先測試 RLS。
- GitHub Pages 本身不保護網站原始碼，所有 HTML/JS 都是公開的。
- 這是可部署的起始版，尚非完成的每日股利自動入帳系統。
