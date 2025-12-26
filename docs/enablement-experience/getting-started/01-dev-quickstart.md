# 開發環境快速開始 (Dev Quickstart)

> 來源：`docs-old/README.md` 與相關快速啟動筆記。提供最小可行步驟，詳情以本目錄 README 為準。

## 🧰 前置需求
- Node.js 20+
- pnpm 或 npm (專案使用 npm scripts)
- Firebase CLI (`npm i -g firebase-tools`)
- Chrome / Edge 最新版

## 🚀 啟動步驟
1) 安裝依賴
```bash
npm ci
```
2) 環境設定  
複製 `.env.example` / `environment.ts` 模板，填入 Firebase 專案設定。
3) 啟動前端
```bash
npm start
```
4) (選用) 啟動 Firebase Emulator
```bash
firebase emulators:start --import=./test/firebase-emulator.setup.ts
```
5) 驗證可正常登入與載入 Blueprint / Task 列表。

## ✅ 檢查清單
- [ ] `npm ci` 無錯誤
- [ ] 前端可在 `localhost:4200` 啟動
- [ ] 若使用 Emulator，Auth / Firestore / Functions 正常啟動
- [ ] `.env` / `environment.ts` 已填入對應專案設定

## 相關來源
- `docs-old/README.md`
