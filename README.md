# UNISONA 生日互動小遊戲

寄給社員的生日祝福。社員從電子郵件點圖片進來，花兩三分鐘玩完一次排練，
最後停在七位團員舉牌組成 UNISONA 的畫面。

全體社員共用同一份內容，一年更新一次即可。不需要登入、資料庫、後端或付費 AI API。

---

## 一分鐘看懂

- 純靜態網頁，沒有建置步驟，沒有相依套件。原生 ES Modules + SVG + Canvas + Web Audio。
- 所有資源路徑都是相對路徑（`./`），可以直接放在 GitHub Pages 的 repository 子路徑下。
- 玩家畫的工作證與譜架只存在分頁記憶體裡，重新整理就重來，不會上傳任何東西。
- 缺少人聲錄音時，用合成音播放完整可玩的版本。替換音源的方法見 `ASSETS.md`。

## 流程

| 關卡 | 內容 |
| --- | --- |
| 開場 | 小人跑向後台入口，按「開始」同時解鎖音訊 |
| 第一關 | 畫一張工作證，實際筆畫縮放進證件框掛在主角胸前，掃描通過、開門 |
| 第二關 | 畫一個譜架，實際筆畫被複製成七座，七位團員排成圓弧，指揮就位 |
| 第三關 | 依四張便條調整七人左右順序；排對之後完整輪唱一次，玩家自己聽出生日歌第一句 |
| 第四關 | 正式演出：前三句逐音接唱，最後一句七人合唱並延長，舉牌組成 UNISONA，指揮棒帶出 HAPPY BIRTHDAY，畫面永久定格 |

---

## 在本機跑起來

因為使用 ES Modules，不能直接用 `file://` 開啟，需要一個本機伺服器。

```bash
# Python（任何版本 3.x）
cd unisona-birthday
python -m http.server 8080
# 瀏覽器開 http://localhost:8080/

# 或 Node
npx serve .
```

沒有建置步驟。改完原始碼重新整理瀏覽器即可。

## 驗證設定檔

```bash
node tools/verify-puzzle.mjs
```

會枚舉七人的 5040 種排列，確認四張便條只有一組解，並檢查角色、旋律、
演出段落、結尾牌面等設定是否一致。遊戲啟動時也會跑同一份 `verifyPuzzle()`，
有問題只會寫到開發者主控台，不會出現在玩家介面。

---

## 部署到 GitHub Pages

這是靜態網站，沒有建置步驟，所以用「從分支部署」最簡單。

### 方式一：從分支部署（建議）

1. 把 `unisona-birthday/` 底下的檔案推上 GitHub repository。
   - 若把整個資料夾當成 repository 根目錄，網址會是
     `https://<帳號>.github.io/<repo>/`
   - 若放在既有 repository 的子資料夾，請把該資料夾設為 Pages 來源，或移到 `docs/`。
2. Repository → **Settings → Pages**
   - Source：**Deploy from a branch**
   - Branch：`main`，資料夾 `/ (root)` 或 `/docs`
3. 等一兩分鐘，開 `https://<帳號>.github.io/<repo>/`。

`.nojekyll` 已經包含在內，Jekyll 不會處理或跳過任何檔案。

### 方式二：GitHub Actions

若偏好用 Actions，建立 `.github/workflows/pages.yml`：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .          # 若放在子資料夾，改成 ./unisona-birthday
      - id: deployment
        uses: actions/deploy-pages@v4
```

然後在 **Settings → Pages** 把 Source 設成 **GitHub Actions**。

### 子路徑注意事項

`index.html` 只參照三個資源，而且都是相對路徑：

```html
<link rel="icon" href="./favicon.svg">
<link rel="stylesheet" href="./styles/main.css">
<script type="module" src="./src/main.js"></script>
```

所有 JS 之間也都用相對 import。整個專案沒有任何以 `/` 開頭的資源路徑，
所以放在 `https://<帳號>.github.io/<repo>/` 這種子路徑底下不會出現 404。
新增圖片或音檔時請維持同樣規則（例如 `./assets/audio/solo-c4.mp3`）。

### 電子郵件的入口

在郵件裡放一張靜態圖片，連到 Pages 網址即可：

```html
<a href="https://<帳號>.github.io/<repo>/">
  <img src="https://<帳號>.github.io/<repo>/assets/email-cover.png"
       alt="UNISONA 生日排練" width="600">
</a>
```

郵件用的封面圖是選配，見 `ASSETS.md`。

---

## 年度換版：只改一個檔案

`src/config/show.js` 集中了所有會換的東西：

| 區塊 | 內容 |
| --- | --- |
| `CHARACTERS` | 七位團員的 id、文字標籤、圖案徽章、顏色、排練音 |
| `HERO_ID` | 哪一位是主角（戴玩家畫的工作證） |
| `SOLUTION_ORDER` / `INITIAL_ORDER` | 正解站位與開場站位 |
| `CLUES` | 四張便條的條件與文字 |
| `REHEARSAL` | 排練的 tempo、事件時間、提示與自動協助的時機 |
| `PERFORMANCE` | 正式演出的 tempo、四句的音高與節奏、接唱分配、舉牌與定格時間點、字幕 |
| `FINALE` | 七張牌的字母、結尾文字 |
| `AUDIO` | 是否使用人聲錄音、檔名對照、音量 |
| `TEXTS` | 全部介面文案 |
| `DRAW_REQUIREMENTS` | 繪畫關卡的寬鬆判定門檻 |

改完 `CHARACTERS` 或 `CLUES` 之後一定要重跑 `node tools/verify-puzzle.mjs`，
確認線索仍然只有一組解。

### 可用的圖案徽章

`src/art/figures.js` 的 `SYMBOLS`：`star`、`moon`、`leaf`、`wave`、`mount`、`grid`、`heart`。
要新增圖案就在那裡加一筆 SVG path。徽章同時用圖案與文字呈現，
不是只靠顏色辨識，所以色盲或單色列印也分得出來。

---

## 設計假設：第七位團員

生日歌第一句只有六次起音，但舞台上有七位團員。
第一版採用 **「六位唱音 ＋ 一位休止」**：

- 正確站位的排練事件是 C4、C4、D4、C4、F4、E4、休止。
- 第七位在排練時負責休止，用可見的休止符與呼吸動作表示。
- **正式演出時第七位也要唱**：第二句由第 2 到第 7 位接唱、第三句七人各接一音、
  第四句七人齊唱，所以七位都參與。

這是可修改的設計假設，不是使用者指定的規格。設定寫在
`DESIGN_ASSUMPTIONS.rehearsalSeventhMemberMode`。

其他可行方案（目前未實作，若要改版可從這裡開始）：

1. **`double-last`** — 把最後一個長音拆成兩個起音（「to—you」唱成兩次起音），
   讓七個人各有一音。實作方式：在 `REHEARSAL.events` 把第 6 個事件
   `{beat:4, dur:3}` 改成 `{beat:4, dur:1.5}` 與 `{beat:5.5, dur:1.5}`，
   並把第七位的 `rehearsalNote` 設成 `'E4'`（同音延續）或 `'F4'`。
2. **八拍兩小節版** — 改用第二句 `C C D C G F`（六音）＋ 第七位唱終止音 `F4`，
   變成七音的完整終止式。需要同步調整 `SOLUTION_ORDER` 與便條。
3. **雙人同音** — 讓兩位團員共享同一個起音（齊唱一音），七人六音。
   需要把 `REHEARSAL.events` 的事件改成可對應多個位置。

三種方案都只需要改 `src/config/show.js` 與（方案 3）排練排程的一小段，
不需要重寫遊戲。

---

## 專案結構

```
unisona-birthday/
├── index.html
├── favicon.svg
├── .nojekyll
├── README.md
├── ASSETS.md
├── styles/
│   └── main.css
├── src/
│   ├── main.js              應用殼層、HUD、場景切換、背景分頁暫停
│   ├── config/show.js       全部可換版設定
│   ├── core/
│   │   ├── audio.js         Web Audio 引擎（合成音 / 人聲錄音）
│   │   ├── clock.js         以 AudioContext 時間為基準的共用時間軸
│   │   └── dom.js           HTML / SVG 建立與座標轉換
│   ├── draw/
│   │   ├── pad.js           繪圖區（滑鼠、觸控、觸控筆）
│   │   └── strokes.js       筆畫資料、縮放、轉成圖像
│   ├── art/
│   │   ├── figures.js       小人、指揮、徽章圖案（純 SVG）
│   │   ├── door.js          後台入口場景
│   │   └── stage.js         舞台：七人、七座譜架、指揮、舉牌、結尾字
│   ├── puzzle/solver.js     線索判定與排列枚舉
│   └── scenes/              五個場景
└── tools/verify-puzzle.mjs  設定檔驗證
```

## 技術重點

- **時間基準**：聲音與畫面都讀同一個 `AudioContext.currentTime`。
  切到背景分頁時 `suspend()`，`currentTime` 停住，事件不會觸發，
  回來按「繼續」`resume()`，不會補播堆積的事件。
- **不重複觸發**：每一輪排練有一個 token，暫停、重播、成功都會讓舊 token 失效。
  切場景時 `teardown()` 會清掉所有計時器並停掉所有音訊節點。
- **玩家筆畫**：以正規化座標保存（x 以繪圖區寬度為 1），
  可以等比縮放到任何目標框，所以同一份譜架筆畫能被複製成七座。
- **座標正確性**：點擊與拖曳用 `getScreenCTM().inverse()` 轉換，
  視窗縮放、手機旋轉之後位置仍然正確。繪圖區固定 3:2 比例，筆畫不會被拉壞。
- **拖曳不誤觸捲動**：排練時舞台 SVG 設 `touch-action: none`。
- **無障礙**：團員可以用 Tab 聚焦、Enter 選取；
  舞台下方有「目前由左到右的站位」按鈕列，手機與鍵盤都能完成排序；
  徽章同時用圖案與文字；靜音狀態下只靠便條也能解開；
  支援系統的「減少動態效果」設定，也提供可見的切換按鈕。

## 已知限制

- 需要支援 Web Audio 與 ES Modules 的瀏覽器（近年的 Chrome、Safari、Firefox、Edge）。
- 目前使用合成音。人聲錄音的規格與替換方式見 `ASSETS.md`。
- 進度不會保存，重新整理就從頭開始（這是刻意的）。
