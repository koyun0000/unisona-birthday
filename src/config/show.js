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
  useSamples: false,
  sampleBasePath: './assets/audio/',
  samples: {
    // 排練用短音
    'rehearsal.C4': 'rehearsal-c4.mp3',
    'rehearsal.D4': 'rehearsal-d4.mp3',
    'rehearsal.E4': 'rehearsal-e4.mp3',
    'rehearsal.F4': 'rehearsal-f4.mp3',
    // 逐音接唱
    'solo.C4': 'solo-c4.mp3',
    'solo.D4': 'solo-d4.mp3',
    'solo.E4': 'solo-e4.mp3',
    'solo.F4': 'solo-f4.mp3',
    'solo.G4': 'solo-g4.mp3',
    'solo.A4': 'solo-a4.mp3',
    'solo.C5': 'solo-c5.mp3',
    // 最後一句合唱
    'chorus.F4': 'chorus-f4.mp3',
    'chorus.G4': 'chorus-g4.mp3',
    'chorus.A4': 'chorus-a4.mp3',
    'chorus.Bb4': 'chorus-bb4.mp3',
  },
  masterVolume: 0.85,
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
};

/* ------------------------------------------------------------------ *
 * 動態設定
 * ------------------------------------------------------------------ */
export const MOTION = {
  swapMs: 450,
  confettiCount: 14,
};
