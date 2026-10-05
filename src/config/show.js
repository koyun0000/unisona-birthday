/**
 * 年度換版只需要改這個檔案：角色、徽章、線索、旋律、節奏、文字、結尾字母。
 * 本檔案不使用任何 DOM API，可以直接被 Node 匯入（tools/verify-puzzle.mjs）。
 */

/* ------------------------------------------------------------------ *
 * 設計假設（可修改，非使用者硬性指定）
 * ------------------------------------------------------------------ */
export const DESIGN_ASSUMPTIONS = {
  /**
   * 生日歌第一句只有六次起音，但舞台上需要七位團員。
   * 第一版採用「六位唱音 ＋ 一位休止」：排練時第七位負責休止符，
   * 正式演出時第七位改為參與（見 PERFORMANCE.phrases 的 singers）。
   * 其他可行方案列於 README。
   */
  rehearsalSeventhMemberMode: 'rest', // 'rest' | 'double-last'（未實作，見 README）
  rehearsalRestIndex: 6,              // 休止落在第幾個位置（0 起算）
};

/* ------------------------------------------------------------------ *
 * 音高表（等律 A4 = 440）
 * ------------------------------------------------------------------ */
export const NOTES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  Bb4: 466.16,
  C5: 523.25,
};

/* ------------------------------------------------------------------ *
 * 七位團員：圖案徽章 ＋ 文字標籤（雙重辨識，不只靠顏色）
 * ------------------------------------------------------------------ */
export const CHARACTERS = [
  { id: 'star',  label: '星', symbol: 'star',  tint: '#f3c969', rehearsalNote: 'C4' },
  { id: 'mount', label: '山', symbol: 'mount', tint: '#9ec6a4', rehearsalNote: 'C4' },
  { id: 'leaf',  label: '葉', symbol: 'leaf',  tint: '#b7d08a', rehearsalNote: 'D4' },
  { id: 'moon',  label: '月', symbol: 'moon',  tint: '#cfc3e8', rehearsalNote: 'C4' },
  { id: 'heart', label: '心', symbol: 'heart', tint: '#f0a9a0', rehearsalNote: 'F4' },
  { id: 'wave',  label: '浪', symbol: 'wave',  tint: '#9fc7de', rehearsalNote: 'E4' },
  { id: 'grid',  label: '窗', symbol: 'grid',  tint: '#dcc6a8', rehearsalNote: null }, // null = 休止
];

/** 主角（第一關畫的工作證掛在這個角色身上） */
export const HERO_ID = 'star';

/** 謎題唯一解（由 tools/verify-puzzle.mjs 與執行階段共同驗證） */
export const SOLUTION_ORDER = ['star', 'mount', 'leaf', 'moon', 'heart', 'wave', 'grid'];

/** 開場站位：刻意不是正解，而且聽起來不像完整旋律 */
export const INITIAL_ORDER = ['wave', 'moon', 'grid', 'heart', 'star', 'leaf', 'mount'];

/* ------------------------------------------------------------------ *
 * 排練便條（線索）。kind 由 src/puzzle/solver.js 解釋。
 * ------------------------------------------------------------------ */
export const CLUES = [
  {
    id: 'c1',
    kind: 'leftmost',
    a: 'star',
    icons: ['star'],
    text: '星 站在最左邊。',
  },
  {
    id: 'c2',
    kind: 'rightmost',
    a: 'grid',
    icons: ['grid'],
    text: '窗 站在最右邊，這一輪由他負責休止。',
  },
  {
    id: 'c3',
    kind: 'chain',
    seq: ['mount', 'leaf', 'moon'],
    icons: ['mount', 'leaf', 'moon'],
    text: '由左到右，山、葉、月 三個人連著站在一起。',
  },
  {
    id: 'c4',
    kind: 'compound',
    parts: [
      { kind: 'adjacentRight', a: 'heart', b: 'wave' },
      { kind: 'leftOf', a: 'mount', b: 'heart' },
    ],
    icons: ['heart', 'wave'],
    text: '心 的右邊緊接著 浪；而 山 站在 心 的左邊。',
  },
];

/* ------------------------------------------------------------------ *
 * 排練：生日歌第一句的節奏（3/4，拍為四分音符）
 * beat = 起音時間（拍），dur = 長度（拍）
 * ------------------------------------------------------------------ */
export const REHEARSAL = {
  tempo: 100,
  // 第 i 個位置的事件
  events: [
    { beat: 0,    dur: 0.75 },
    { beat: 0.75, dur: 0.25 },
    { beat: 1,    dur: 1 },
    { beat: 2,    dur: 1 },
    { beat: 3,    dur: 1 },
    { beat: 4,    dur: 3 },
    { beat: 7,    dur: 1 },   // 第七位：休止
  ],
  roundLengthBeats: 8,
  roundGapBeats: 1.6,
  autoAssistAfterMs: 150000,
  hintsBeforeAssist: 3,
};

/* ------------------------------------------------------------------ *
 * 正式演出：四句生日歌。
 * 前三句「逐音接唱」（一人一個起音），第四句全體合唱，最後一音延長。
 * singers = 位置索引（0 = 最左）；'all' = 七人齊唱。
 * ------------------------------------------------------------------ */
const PHRASE_RHYTHM_6 = [
  { beat: 0,    dur: 0.75 },
  { beat: 0.75, dur: 0.25 },
  { beat: 1,    dur: 1 },
  { beat: 2,    dur: 1 },
  { beat: 3,    dur: 1 },
  { beat: 4,    dur: 3 },
];

const PHRASE_RHYTHM_7 = [
  { beat: 0,    dur: 0.75 },
  { beat: 0.75, dur: 0.25 },
  { beat: 1,    dur: 1 },
  { beat: 2,    dur: 1 },
  { beat: 3,    dur: 1 },
  { beat: 4,    dur: 1 },
  { beat: 5,    dur: 2 },
];

export const PERFORMANCE = {
  tempo: 96,
  leadInBeats: 2,          // 指揮起拍
  phrases: [
    {
      id: 'p1', startBeat: 0, mode: 'solo',
      notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4'],
      rhythm: PHRASE_RHYTHM_6,
      singers: [0, 1, 2, 3, 4, 5],
    },
    {
      id: 'p2', startBeat: 8, mode: 'solo',
      notes: ['C4', 'C4', 'D4', 'C4', 'G4', 'F4'],
      rhythm: PHRASE_RHYTHM_6,
      singers: [1, 2, 3, 4, 5, 6],
    },
    {
      id: 'p3', startBeat: 16, mode: 'solo',
      notes: ['C4', 'C4', 'C5', 'A4', 'F4', 'G4', 'F4'],
      rhythm: PHRASE_RHYTHM_7,
      singers: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      id: 'p4', startBeat: 24, mode: 'chorus',
      notes: ['Bb4', 'Bb4', 'A4', 'F4', 'G4', 'F4'],
      // 最後一音延長
      rhythm: [
        { beat: 0,    dur: 0.75 },
        { beat: 0.75, dur: 0.25 },
        { beat: 1,    dur: 1 },
        { beat: 2,    dur: 1 },
        { beat: 3,    dur: 1 },
        { beat: 4,    dur: 8 },
      ],
      singers: 'all',
    },
  ],
  cues: {
    conductorRaise: -1.6,
    signsStartBeat: 28.5,
    signStaggerBeats: 0.22,
    confettiBeat: 29.2,
    greetingStartBeat: 30.8,
    greetingDurationBeats: 3.6,
    conductorCloseBeat: 34.6,
    freezeBeat: 36.8,
  },
  captions: [
    { beat: -1.6, text: '指揮抬手。' },
    { beat: 0,    text: '' },
    { beat: 28.6, text: 'UNISONA' },
    { beat: 36.9, text: '生日快樂，今年也一起唱。' },
  ],
};

/* ------------------------------------------------------------------ *
 * 結尾
 * ------------------------------------------------------------------ */
export const FINALE = {
  signLetters: ['U', 'N', 'I', 'S', 'O', 'N', 'A'],
  greeting: 'HAPPY BIRTHDAY',
};

/* ------------------------------------------------------------------ *
 * 繪畫關卡的寬鬆判定（不做 AI 辨識，只要有足夠筆畫）
 * ------------------------------------------------------------------ */
export const DRAW_REQUIREMENTS = {
  badge: { minStrokes: 1, minPoints: 14, minLength: 0.55 },
  stand: { minStrokes: 1, minPoints: 16, minLength: 0.7 },
};

/* ------------------------------------------------------------------ *
 * 音訊：預設全部用合成音，加入人聲錄音後把 useSamples 改成 true。
 * 詳見 ASSETS.md
 * ------------------------------------------------------------------ */
export const AUDIO = {
  // 放了人聲錄音之後改成 true
  useSamples: false,
  sampleBasePath: './assets/audio/',

  /**
   * 只列出「確實已經放進 assets/audio/ 的檔案」。
   * 沒列到的音會用合成音，可以分批上線。
   *
   * 注意：列了卻不存在的檔案會在瀏覽器主控台留下 404 錯誤，
   * 所以請把還沒錄好的那幾行保持註解掉。
   * 副檔名沒有限制（mp3 / m4a / wav 都可以），但建議用 mp3，檔案小很多。
   *
   * key 的格式是 <音色>.<音名>：
   *   rehearsal = 第三關排練的短音
   *   solo      = 第四關前三句的逐音接唱
   *   chorus    = 第四關最後一句的合唱
   */
  samples: {
    // 'rehearsal.C4': 'rehearsal-c4.mp3',
    // 'rehearsal.D4': 'rehearsal-d4.mp3',
    // 'rehearsal.E4': 'rehearsal-e4.mp3',
    // 'rehearsal.F4': 'rehearsal-f4.mp3',

    // 'solo.C4': 'solo-c4.mp3',
    // 'solo.D4': 'solo-d4.mp3',
    // 'solo.E4': 'solo-e4.mp3',
    // 'solo.F4': 'solo-f4.mp3',
    // 'solo.G4': 'solo-g4.mp3',
    // 'solo.A4': 'solo-a4.mp3',
    // 'solo.C5': 'solo-c5.mp3',

    // 'chorus.F4': 'chorus-f4.mp3',
    // 'chorus.G4': 'chorus-g4.mp3',
    // 'chorus.A4': 'chorus-a4.mp3',
    // 'chorus.Bb4': 'chorus-bb4.mp3',
  },
  masterVolume: 0.85,
};

/* ------------------------------------------------------------------ *
 * 手繪圖片插槽。
 *
 * 留白（沒填的項目）就用程式畫的 SVG，所以可以一個角色一個角色慢慢換，
 * 中途任何時候都是完整可玩的。只要填了檔名就會改用你的圖。
 *
 * 尺寸、對齊方式、繪圖範本見 ASSETS.md 與 tools/make-templates.py。
 * 所有路徑都是相對路徑，部署到 GitHub Pages 子路徑才不會 404。
 *
 * 注意：填了卻不存在的檔名，瀏覽器會留下 404 錯誤訊息（遊戲仍可玩）。
 * 還沒畫好的請保持註解。
 * ------------------------------------------------------------------ */
export const ART = {
  basePath: './assets/art/',

  /**
   * 每位團員三張全身圖（去背 PNG，480 × 840）：
   *   normal 平常站著、閉著嘴、手自然放下
   *   sing   張嘴在唱、手放下
   *   sign   雙手舉過頭 ＋ 張嘴在唱（結尾舉牌時是邊唱邊舉）
   */
  persons: {
    // star:  { normal: 'star-normal.png',  sing: 'star-sing.png',  sign: 'star-sign.png' },
    // mount: { normal: 'mount-normal.png', sing: 'mount-sing.png', sign: 'mount-sign.png' },
    // leaf:  { normal: 'leaf-normal.png',  sing: 'leaf-sing.png',  sign: 'leaf-sign.png' },
    // moon:  { normal: 'moon-normal.png',  sing: 'moon-sing.png',  sign: 'moon-sign.png' },
    // heart: { normal: 'heart-normal.png', sing: 'heart-sing.png', sign: 'heart-sign.png' },
    // wave:  { normal: 'wave-normal.png',  sing: 'wave-sing.png',  sign: 'wave-sign.png' },
    // grid:  { normal: 'grid-normal.png',  sing: 'grid-sing.png',  sign: 'grid-sign.png' },
  },

  /** 七個圖案徽章（去背 PNG，128 × 128，置中） */
  symbols: {
    // star: 'symbol-star.png',
    // moon: 'symbol-moon.png',
    // leaf: 'symbol-leaf.png',
    // wave: 'symbol-wave.png',
    // mount: 'symbol-mount.png',
    // grid: 'symbol-grid.png',
    // heart: 'symbol-heart.png',
  },

  /** 指揮。右手要單獨一張，才能跟著節拍轉 */
  conductor: {
    // body: 'conductor-body.png',             // 360 × 585，右手不要畫
    // bodySmile: 'conductor-body-smile.png',  // 同上，微笑版（可省略）
    // arm: 'conductor-arm.png',               // 360 × 330，右手＋指揮棒
  },

  /** 舞台與後台入口的背景 */
  scenes: {
    // stage: 'stage-backdrop.png',   // 2000 × 1400
    // door: 'door-backdrop.png',     // 2000 × 760，門與感應器不要畫進去
    // doorLeaf: 'door-leaf.png',     // 612 × 738，會往右滑開
    // scanner: 'scanner.png',        // 150 × 246，指示燈不要畫，由程式疊上去
  },

  /** 結尾的牌子。字母由程式用文字畫上去，不會拼錯，所以請畫空白牌面 */
  sign: {
    // board: 'sign-board.png',       // 186 × 150
  },

  /**
   * 社團 logo。放進 assets/ 之後把下面這行取消註解，
   * 左上角的「UNISONA」文字就會換成圖。
   * 路徑是相對於 basePath 的上一層（assets/），不是 assets/art/。
   * 去背的 PNG 或 SVG 都可以；PNG 建議高度 160px 以上。
   * 結尾那七張 U-N-I-S-O-N-A 牌子不會換成 logo，那是七個人各舉一個字母拼出來的。
   */
  logo: { file: 'logo.png', alt: 'UNISONA', height: 22 },
  // logo: { file: 'logo.png', alt: 'UNISONA', height: 22 },

  /**
   * 手繪的身體比例跟 SVG 小人不一定一樣，
   * 這裡可以逐一微調胸前徽章、頭上名牌、工作證的位置。
   * 省略就用 src/art/layout.js 的 DEFAULT_ANCHORS。
   */
  anchors: {
    // star: { emblem: { x: 2, y: -108, r: 17 }, chip: { x: 0, y: -192 } },
  },
};

/* ------------------------------------------------------------------ *
 * 文案（繁體中文，不使用 emoji）
 * ------------------------------------------------------------------ */
export const TEXTS = {
  intro: {
    title: 'UNISONA 排練紀錄',
    line: '糟了，要遲到了……工作證呢？',
    hint: '裡面已經傳出零散的暖聲。',
    start: '開始',
    note: '點一下「開始」會同時打開聲音。',
  },
  badge: {
    prompt: '幫他畫一張工作證。',
    sub: '隨便畫都可以，門口的掃描機不太挑。',
    clear: '清除',
    done: '完成',
    needMore: '再畫幾筆就可以了。',
    scanning: '掃描中……',
    pass: '通過。門開了。',
  },
  stand: {
    prompt: '樂譜有了……還少一個譜架。',
    sub: '畫一個譜架，等一下會變成七座。',
    clear: '清除',
    done: '完成',
    needMore: '再畫幾筆就可以了。',
    building: '七座譜架就位。',
    entering: '團員陸續上台。',
  },
  rehearsal: {
    prompt: '排練開始。依照便條，調整七個人的左右順序。',
    how: '拖曳兩人可以交換；也可以先點第一個人，再點第二個人。',
    strip: '目前由左到右的站位',
    notes: '排練便條',
    pause: '暫停',
    resume: '繼續',
    replay: '重播這一輪',
    hint: '提示',
    assist: '直接排好',
    restLabel: '休止',
    hintClue: '看這張便條，現在的站位還不符合。',
    hintPlaced: '幫你把一個人放到對的位置了。',
    hintAssist: '需要的話，可以按「直接排好」。',
    allClues: '四張便條都符合了，聽完這一輪。',
    success: '',
  },
  finale: {
    replay: '再玩一次',
    closing: '生日快樂，今年也一起唱。',
  },
  hud: {
    soundOn: '聲音：開',
    soundOff: '聲音：關',
    motionOn: '動態：正常',
    motionOff: '動態：減少',
  },
  resume: '排練暫停了。',

  /**
   * 直向時的提示。
   * 網頁沒辦法真的強制轉向（iOS 完全不支援 orientation.lock），
   * 所以改成蓋一層提示，擋到使用者自己轉過來為止。
   */
  rotate: {
    touch: '請把螢幕轉成橫向',
    desktop: '請把視窗調寬一點',
    sub: '這個排練只有橫向版本',
    tipTouch: '轉了沒反應的話，請先關掉螢幕的旋轉鎖定',
    tipDesktop: '把瀏覽器視窗拉寬，或是放到最大',
    tipDelayMs: 4000,
  },
};

/* ------------------------------------------------------------------ *
 * 動態設定
 * ------------------------------------------------------------------ */
export const MOTION = {
  swapMs: 450,
  confettiCount: 14,
};
