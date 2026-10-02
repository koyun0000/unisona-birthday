import * as cfg from './config/show.js';
import { AudioEngine } from './core/audio.js';
import { Clock, createSeq } from './core/clock.js';
import { h, button, clear } from './core/dom.js';
import { verifyPuzzle } from './puzzle/solver.js';
import { createArtSource } from './art/art-source.js';
import { introScene } from './scenes/intro.js';
import { badgeScene } from './scenes/badge.js';
import { standScene } from './scenes/stand.js';
import { rehearsalScene } from './scenes/rehearsal.js';
import { finaleScene } from './scenes/finale.js';

const SCENES = {
  intro: introScene,
  badge: badgeScene,
  stand: standScene,
  rehearsal: rehearsalScene,
  finale: finaleScene,
};

const root = document.getElementById('scene-root');
const captionEl = document.getElementById('caption');
const hudControls = document.getElementById('hud-controls');
const resumeLayer = document.getElementById('resume-layer');
const resumeButton = document.getElementById('resume-button');
document.getElementById('resume-text').textContent = cfg.TEXTS.resume;

const audio = new AudioEngine(cfg.AUDIO);
const art = createArtSource(cfg.ART);

const app = {
  cfg,
  audio,
  art,
  clock: new Clock(audio),
  seq: createSeq(),
  stage: null,
  current: null,
  cleanups: [],
  state: {
    badgeStrokes: null,
    badgeHref: null,
    standStrokes: null,
    standHref: null,
    reducedMotion: false,
    frozen: false,
  },

  setScene(node) {
    clear(root);
    root.appendChild(node);
  },

  setCaption(text) {
    captionEl.textContent = text || '';
    captionEl.classList.toggle('shown', Boolean(text));
  },

  onCleanup(fn) {
    this.cleanups.push(fn);
  },

  /** 切換場景時清掉所有音訊與計時器，避免重複播放 */
  teardown() {
    this.cleanups.forEach((fn) => { try { fn(); } catch { /* 忽略 */ } });
    this.cleanups = [];
    this.clock.clear();
    this.seq.clear();
    this.audio.stopAll();
  },

  goto(name) {
    this.teardown();
    this.current = name;
    SCENES[name](this);
  },

  restart() {
    this.teardown();
    this.stage = null;
    this.state.badgeStrokes = null;
    this.state.badgeHref = null;
    this.state.standStrokes = null;
    this.state.standHref = null;
    this.state.frozen = false;
    hideResume();
    this.goto('intro');
  },

  refreshHud() {
    soundBtn.textContent = audio.muted ? cfg.TEXTS.hud.soundOff : cfg.TEXTS.hud.soundOn;
    soundBtn.setAttribute('aria-pressed', String(!audio.muted));
    motionBtn.textContent = app.state.reducedMotion
      ? cfg.TEXTS.hud.motionOff : cfg.TEXTS.hud.motionOn;
    motionBtn.setAttribute('aria-pressed', String(app.state.reducedMotion));
  },
};

/* ---------------- HUD：聲音與動態 ---------------- */
const soundBtn = button(cfg.TEXTS.hud.soundOn, { class: 'btn btn-hud', 'aria-pressed': 'true' });
const motionBtn = button(cfg.TEXTS.hud.motionOn, { class: 'btn btn-hud', 'aria-pressed': 'false' });
hudControls.append(soundBtn, motionBtn);

soundBtn.addEventListener('click', () => {
  audio.setMuted(!audio.muted);
  app.refreshHud();
});

motionBtn.addEventListener('click', () => {
  app.state.reducedMotion = !app.state.reducedMotion;
  document.body.classList.toggle('reduced', app.state.reducedMotion);
  app.refreshHud();
});

// 尊重系統的「減少動態」設定
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reduceQuery.matches) {
  app.state.reducedMotion = true;
  document.body.classList.add('reduced');
}
app.refreshHud();

/* ---------------- 切到背景分頁時暫停 ---------------- */
function showResume() {
  resumeLayer.removeAttribute('hidden');
  resumeButton.focus({ preventScroll: true });
}

function hideResume() {
  resumeLayer.setAttribute('hidden', 'hidden');
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!audio.unlocked || app.state.frozen) return;
    audio.suspend();
    showResume();
  }
});

resumeButton.addEventListener('click', async () => {
  hideResume();
  await audio.resume();
});

/* ---------------- 啟動 ---------------- */
// 執行階段驗證設定檔：線索必須只有一組解。問題只寫到開發者主控台，不出現在玩家介面。
const check = verifyPuzzle({
  ids: cfg.CHARACTERS.map((c) => c.id),
  clues: cfg.CLUES,
  solution: cfg.SOLUTION_ORDER,
  initial: cfg.INITIAL_ORDER,
});
if (!check.ok) console.warn('[UNISONA] 設定檔問題：', check.problems.join(' / '));
if (cfg.FINALE.signLetters.join('') !== 'UNISONA') {
  console.warn('[UNISONA] 牌面字母不是 UNISONA。');
}

// 開發與自動測試用的檢視窗口（不出現在玩家介面）
window.__unisona = {
  check,
  audio,
  art,
  artSummary: () => art.summary(),
  scene: () => app.current,
  stage: () => app.stage,
  audioTime: () => audio.time,
  audioActive: () => audio.active.size,
};

app.goto('intro');
