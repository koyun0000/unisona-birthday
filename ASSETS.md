# 素材清單

目前這個版本**不需要任何外部素材就能完整玩到結尾**。
所有角色、場景、道具都由程式即時繪製，所有聲音都由合成器產生。

這份文件說明：哪些東西已經不用你提供、哪些可以選擇性替換、
正式版若要用真人合唱需要錄什麼、以及替換的位置與設定方法。

---

## 一、已由程式生成，不需要你提供

| 項目 | 產生方式 | 檔案位置 |
| --- | --- | --- |
| 七位團員小人（頭、身體、手腳、嘴型、呼吸動作） | SVG path | `src/art/figures.js` → `createPerson()` |
| 指揮與指揮棒（含隨節拍擺動） | SVG path | `src/art/figures.js` → `createConductor()` |
| 七種圖案徽章（星、月、葉、浪、山、窗、心） | SVG path | `src/art/figures.js` → `SYMBOLS` |
| 團員文字名牌 | SVG text | `src/art/figures.js` |
| 後台入口（牆、門、門框、感應器、門後暖光） | SVG | `src/art/door.js` |
| 舞台（背牆、地板、暖光漸層） | SVG + radialGradient | `src/art/stage.js` → `buildBackdrop()` |
| 七張 UNISONA 牌子與字母 | SVG text（字串來自設定，不會拼錯） | `src/config/show.js` → `FINALE.signLetters` |
| 結尾的 HAPPY BIRTHDAY | SVG text + 指揮棒軌跡路徑 | `src/art/stage.js` → `prepareGreeting()` |
| 音符彩帶 | SVG path + CSS 動畫 | `src/art/figures.js` → `noteGlyph()` |
| 休止符記號 | SVG path | `src/art/figures.js` → `restGlyph()` |
| 網站圖示 | SVG | `favicon.svg` |
| 主角手上的樂譜 | SVG | `src/art/figures.js` → `sheetMusic()` |
| 工作證與七座譜架 | **玩家當場畫的筆畫**，縮放後貼進場景 | `src/draw/strokes.js` |

字母與文字一律用 SVG `<text>` 呈現，不會把文字燒進圖片裡，
所以不會有拼錯或換版要重做圖的問題。

---

## 二、可選擇用圖片替換（不做也沒關係）

這些是純粹的美術升級，程式在沒有檔案時完全不會去抓，也不會出現 404。

| 用途 | 建議檔名 | 格式 | 尺寸建議 | 透明背景 | 替換位置 |
| --- | --- | --- | --- | --- | --- |
| 電子郵件封面圖（信裡那張可點的圖） | `assets/email-cover.png` | PNG 或 JPG | 1200 × 630 | 不需要 | 只放在信件 HTML，程式不使用 |
| 舞台背景（取代純色背牆） | `assets/stage-backdrop.png` | PNG | 2000 × 1400（viewBox 1000 × 700 的 2 倍） | 不需要 | `src/art/stage.js` → `buildBackdrop()`，把 `.wall` 與 `.floor` 換成 `<image>` |
| 後台入口背景 | `assets/door-backdrop.png` | PNG | 2000 × 760 | 不需要 | `src/art/door.js` 的 `bg` 群組 |
| 社團標誌（放在左上角 UNISONA 字樣旁） | `assets/logo.svg` | SVG 優先 | 高度 24px 等比 | **需要** | `index.html` 的 `#hud-brand` |
| 社會分享縮圖（Open Graph） | `assets/og-image.png` | PNG | 1200 × 630 | 不需要 | `index.html` 加 `<meta property="og:image" content="./assets/og-image.png">` |

替換規則：**所有路徑都必須是相對路徑**（`./assets/...`），
否則部署到 GitHub Pages 的 repository 子路徑時會 404。

角色本身建議維持 SVG。小人會張嘴、彈跳、舉牌、被拖曳，
換成 PNG 會失去這些動作，而且要為每個狀態準備一張圖。

---

## 三、正式版需要的人聲錄音

音訊架構已經分成三層，錄音只要照層次準備就能直接換上。

### 層次一：排練用短音（第三關）

排練時每個人唱一個短音，玩家靠這些音判斷站位對不對。

| 檔名 | 音高 | 長度 | 唱法 |
| --- | --- | --- | --- |
| `rehearsal-c4.mp3` | C4（261.63 Hz） | 0.6–1.0 秒 | 單人、乾淨、短促，「啦」或閉口哼鳴 |
| `rehearsal-d4.mp3` | D4（293.66 Hz） | 同上 | 同上 |
| `rehearsal-e4.mp3` | E4（329.63 Hz） | 同上 | 同上 |
| `rehearsal-f4.mp3` | F4（349.23 Hz） | 同上 | 同上 |

- 四個音請用**同一位歌手、同一個母音、同一個音量**錄，
  因為玩家要靠音高差異解謎，音色不一致會干擾判斷。
- 起音要乾淨俐落（attack 短），尾巴自然收掉。
- 不要加殘響；殘響會讓快速的六連音糊在一起。

### 層次二：逐音接唱（第四關前三句）

正式演出的前三句是一個人唱一個起音，像傳接球一樣交棒。

| 檔名 | 音高 | 長度 |
| --- | --- | --- |
| `solo-c4.mp3` | C4 | 至少 2.2 秒（最長的一音是 3 拍） |
| `solo-d4.mp3` | D4 | 同上 |
| `solo-e4.mp3` | E4 | 同上 |
| `solo-f4.mp3` | F4 | 同上 |
| `solo-g4.mp3` | G4（392.00 Hz） | 同上 |
| `solo-a4.mp3` | A4（440.00 Hz） | 同上 |
| `solo-c5.mp3` | C5（523.25 Hz） | 同上 |

- 建議七位團員各錄一個，讓每個角色有自己的聲音；
  也可以一位歌手錄完七個音。
- 每個檔案都是**單一持續音**，不是一句旋律。遊戲會依節奏排程起音時間。
- 音量盡量一致（建議錄完做 peak normalize 到 −3 dBFS）。

### 層次三：最後一句合唱與延長尾音（第四關第四句）

最後一句七人齊唱，最後一音要撐滿舉牌的時間。

| 檔名 | 音高 | 長度 | 說明 |
| --- | --- | --- | --- |
| `chorus-bb4.mp3` | B♭4（466.16 Hz） | ≥ 1.2 秒 | 合唱齊唱 |
| `chorus-a4.mp3` | A4 | ≥ 1.2 秒 | 合唱齊唱 |
| `chorus-g4.mp3` | G4 | ≥ 1.2 秒 | 合唱齊唱 |
| `chorus-f4.mp3` | F4 | **≥ 6 秒** | 最後一音，延長音期間七人舉牌 |

- `chorus-f4.mp3` 同時用在倒數第三音與最後的延長音，所以要錄得夠長。
  若想分開，可以另外錄 `chorus-f4-long.mp3` 並在設定裡指定。
- 合唱可以加一點自然空間感，但不要長殘響，否則會蓋掉收尾。
- 最後一音請自然漸弱收束，不要硬切。

### 共通規格

| 項目 | 建議 |
| --- | --- |
| 格式 | MP3（相容性最好）或 M4A；也可用 OGG，但 Safari 支援較差 |
| 取樣率 | 44.1 kHz |
| 位元率 | 192 kbps 以上 |
| 聲道 | 單音（排練音、接唱音）；立體聲（合唱） |
| 前置靜音 | **必須修掉**。檔案開頭若有空白，起音會延遲，整段節奏會偏掉 |
| 音量 | peak 約 −3 dBFS，各檔之間一致 |
| 檔案大小 | 每個檔案盡量小於 150 KB，整包建議 2 MB 以內 |

### 節拍與時間要求

遊戲用統一的 tempo 與事件時間控制，錄音本身**不需要**含節奏。

| 段落 | tempo | 拍號 | 節奏（拍） |
| --- | --- | --- | --- |
| 排練（第一句） | 100 BPM | 3/4 | 0.75 / 0.25 / 1 / 1 / 1 / 3，第 7 拍為休止 |
| 正式演出 | 96 BPM | 3/4 | 第 1、2、4 句同上；第 3 句為 0.75 / 0.25 / 1 / 1 / 1 / 1 / 2 |
| 最後一音 | 96 BPM | — | 延長 8 拍（5 秒） |

你只要提供**單音**，遊戲負責把它放在正確的時間點。
如果錄音的音高或節奏跟暫用版本不同，只要改 `src/config/show.js` 的
`PERFORMANCE.phrases`（音高、節奏）與 `REHEARSAL.events`（排練時間），
不需要動遊戲邏輯。

---

## 四、怎麼把錄音裝上去

1. 建立資料夾 `unisona-birthday/assets/audio/`。
2. 把檔案依上表命名放進去。
3. 打開 `src/config/show.js`，把 `AUDIO.useSamples` 改成 `true`：

```js
export const AUDIO = {
  useSamples: true,                    // ← 改這裡
  sampleBasePath: './assets/audio/',   // 相對路徑，子路徑部署才不會 404
  samples: {
    'rehearsal.C4': 'rehearsal-c4.mp3',
    'solo.C4': 'solo-c4.mp3',
    'chorus.F4': 'chorus-f4.mp3',
    // ...
  },
  masterVolume: 0.85,
};
```

4. 重新整理頁面。

### 可以只換一部分

`samples` 的 key 是 `<音色>.<音名>`。
程式對每個音先找對應的錄音，找不到就用合成音，所以可以分批上線：
例如先放好四個排練短音，其他維持合成音，遊戲一樣完整可玩。

如果某個檔案缺失、下載失敗或解碼失敗，程式會安靜地退回合成音，
不會噴錯、不會中斷遊戲。

### 想調整音量平衡

- 全域音量：`AUDIO.masterVolume`
- 單一音色的相對音量：`src/scenes/finale.js` 裡 `app.audio.note({ ..., gain })`

---

## 五、目前聲音的真實狀態

**現在聽到的是合成器，不是真人合唱。**
合成音用鋸齒波加上共振峰濾波與微顫音模擬人聲，足以讓人聽出生日歌的旋律，
但不應該對外宣稱是 UNISONA 的錄音。

正式寄出前若要用真人聲音，請依第三節準備錄音並照第四節裝上。
若來不及，目前這個版本仍然是完整、可玩、可寄出的，
只是音色是合成的。

---

## 六、素材檢查表

寄出之前可以照這張表確認：

- [ ] 所有新增的檔案路徑都是相對路徑（`./assets/...`）
- [ ] 錄音檔開頭沒有空白
- [ ] `chorus-f4.mp3` 長度至少 6 秒
- [ ] 四個排練短音是同一位歌手、同一個母音
- [ ] 各檔案音量一致
- [ ] 改完設定後重跑 `node tools/verify-puzzle.mjs`
- [ ] 部署到 GitHub Pages 後，開開發者工具確認沒有 404
