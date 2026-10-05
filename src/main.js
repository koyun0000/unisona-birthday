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
    readOrientation();
  },

  refreshHud() {
    soundBtn.textContent = audio.muted ? cfg.TEXTS.hud.soundOff : cfg.TEXTS.hud.soundOn;
    soundBtn.setAttribute('aria-pressed', String(!audio.muted));
    motionBtn.textContent = app.state.reducedMotion
      ? cfg.TEXTS.hud.motionOff : cfg.TEXTS.hud.motionOn;
    motionBtn.setAttribute('aria-pressed', String(app.state.reducedMotion));
  },
};

/* ---------------- 社團 logo（有設定才換掉文字） ---------------- */
if (cfg.ART.logo && cfg.ART.logo.file) {
  const brand = document.getElementById('hud-brand');
  const img = h('img', {
    class: 'brand-logo',
    src: './assets/' + cfg.ART.logo.file,
    alt: cfg.ART.logo.alt || 'UNISONA',
  });
  if (cfg.ART.logo.height) img.style.height = `${cfg.ART.logo.height}px`;
  brand.replaceChildren(img);
  brand.classList.add('has-logo');
}

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

/* ---------------- 暫停：切到背景分頁，或畫面轉成直向 ---------------- */
const rotateLayer = document.getElementById('rotate-layer');
const rotateText = document.getElementById('rotate-text');
const rotateSub = document.getElementById('rotate-sub');
const rotateTip = document.getElementById('rotate-tip');

// 兩種會讓遊戲暫停的狀況，分開記錄，才不會互相蓋掉
const blockers = { hidden: false, portrait: false };
let tipTimer = 0;

const portraitQuery = window.matchMedia('(orientation: portrait)');
const coarseQuery = window.matchMedia('(pointer: coarse)');
const isTouch = () => coarseQuery.matches || navigator.maxTouchPoints > 0;

function refreshBlockers() {
  const t = cfg.TEXTS.rotate;

  if (blockers.portrait) {
    rotateText.textContent = isTouch() ? t.touch : t.desktop;
    rotateSub.textContent = t.sub;
    rotateLayer.removeAttribute('hidden');
    if (!tipTimer) {
      tipTimer = window.setTimeout(() => {
        rotateTip.textContent = isTouch() ? t.tipTouch : t.tipDesktop;
        rotateTip.removeAttribute('hidden');
      }, t.tipDelayMs);
    }
  } else {
    rotateLayer.setAttribute('hidden', 'hidden');
    rotateTip.setAttribute('hidden', 'hidden');
    if (tipTimer) { clearTimeout(tipTimer); tipTimer = 0; }
  }

  // 直向的提示蓋在最上層，這時候不要再疊一個「繼續」按鈕
  if (blockers.hidden && !blockers.portrait) {
    resumeLayer.removeAttribute('hidden');
    resumeButton.focus({ preventScroll: true });
  } else {
    resumeLayer.setAttribute('hidden', 'hidden');
  }

  document.body.classList.toggle('blocked', blockers.hidden || blockers.portrait);
}

function hideResume() {
  blockers.hidden = false;
  refreshBlockers();
}

function setPortrait(on) {
  if (blockers.portrait === on) return;
  blockers.portrait = on;
  refreshBlockers();
  if (!audio.unlocked || app.state.frozen) return;
  if (on) audio.suspend();
  // 轉回橫向就直接接著玩，不用再按一次按鈕
  else if (!blockers.hidden) audio.resume();
}

const readOrientation = () => setPortrait(portraitQuery.matches);

if (portraitQuery.addEventListener) portraitQuery.addEventListener('change', readOrientation);
else portraitQuery.addListener(readOrientation);
window.addEventListener('resize', readOrientation);
window.addEventListener('orientationchange', readOrientation);
readOrientation();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!audio.unlocked || app.state.frozen) return;
    audio.suspend();
    blockers.hidden = true;
    refreshBlockers();
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
