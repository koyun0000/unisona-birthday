import { h, button } from '../core/dom.js';
import { symbolBadgeSvg } from '../art/figures.js';
import { unsatisfiedClues, clueSatisfied } from '../puzzle/solver.js';

/**
 * 第三關：排練排序謎題。
 * - 每一輪由左到右輪唱；每個人有固定的聲音事件，聲音跟著角色移動。
 * - 交換位置後，下一輪才採用新順序，所以不會有音訊重疊。
 * - 正確順序完整輪唱一次之後才算成功。
 */
export function rehearsalScene(app) {
  const { TEXTS, CHARACTERS, CLUES, SOLUTION_ORDER, REHEARSAL, NOTES } = app.cfg;
  const t = TEXTS.rehearsal;
  const stage = app.stage;
  const beatSec = 60 / REHEARSAL.tempo;
  const charById = new Map(CHARACTERS.map((c) => [c.id, c]));

  let roundToken = 0;
  let paused = false;
  let solved = false;
  let selected = null;
  let hintCount = 0;
  let assistUnlocked = false;
  let assisting = false;

  /* ---------------- 便條 ---------------- */
  const clueCards = CLUES.map((clue) => {
    const icons = h('div', { class: 'clue-icons' }, clue.icons.map((k) => symbolBadgeSvg(k, 30, app.art)));
    const card = h('li', { class: 'clue' }, [
      icons,
      h('p', { class: 'clue-text', text: clue.text }),
      h('span', { class: 'clue-mark', 'aria-hidden': 'true' }),
    ]);
    return { clue, card };
  });

  const cluePanel = h('section', { class: 'clue-panel' }, [
    h('h2', { class: 'panel-title', text: t.notes }),
    h('ul', { class: 'clue-list' }, clueCards.map((c) => c.card)),
  ]);

  /* ---------------- 控制 ---------------- */
  const pauseBtn = button(t.pause, { class: 'btn btn-quiet' });
  const replayBtn = button(t.replay, { class: 'btn btn-quiet' });
  const hintBtn = button(t.hint, { class: 'btn btn-quiet' });
  const assistBtn = button(t.assist, { class: 'btn btn-quiet', disabled: true });

  const controls = h('div', { class: 'controls' }, [pauseBtn, replayBtn, hintBtn, assistBtn]);

  /* 替代操作：左到右的站位列，手機上也看得清楚每個人的圖案與文字 */
  const strip = h('ol', { class: 'order-strip', 'aria-label': t.strip });

  const scene = h('section', { class: 'scene scene-rehearsal' }, [
    h('div', { class: 'stage-holder' }, [stage.el]),
    strip,
    h('p', { class: 'prompt', text: t.prompt }),
    h('p', { class: 'sub', text: t.how }),
    controls,
    cluePanel,
  ]);

  app.setScene(scene);
  app.setCaption('');
  stage.setView([0, 120, 1000, 580]);
  stage.warmLights(false);
  stage.conductorSmile(false);
  stage.enableDrag({ onSwap: handleSwap, onTap: handleTap });
  app.onCleanup(() => stage.disableDrag());

  updateUI();
  startRound();

  const assistTimer = app.seq.after(REHEARSAL.autoAssistAfterMs, unlockAssist);
  app.onCleanup(() => clearTimeout(assistTimer));

  /* ---------------- 一輪輪唱 ---------------- */
  function startRound() {
    if (solved || paused) return;
    roundToken += 1;
    const token = roundToken;
    const snapshot = stage.order.slice();
    const t0 = app.audio.time + 0.3;

    stage.clearSinging();
    stage.clearRest();

    REHEARSAL.events.forEach((ev, i) => {
      const id = snapshot[i];
      const ch = charById.get(id);
      const start = t0 + ev.beat * beatSec;
      const dur = ev.dur * beatSec;

      if (ch.rehearsalNote) {
        app.audio.note({
          freq: NOTES[ch.rehearsalNote],
          noteName: ch.rehearsalNote,
          start,
          dur: Math.min(dur, 0.95),
          kind: 'rehearsal',
        });
      }

      app.clock.at(start, () => {
        if (token !== roundToken) return;
        stage.clearSinging();
        stage.clearRest();
        if (ch.rehearsalNote) stage.setSinging(id, true);
        else stage.setRest(id, true);
      });
      app.clock.at(start + Math.min(dur, 0.8), () => {
        if (token !== roundToken) return;
        stage.setSinging(id, false);
      });
    });

    const roundEnd = t0 + REHEARSAL.roundLengthBeats * beatSec;
    app.clock.at(roundEnd, () => {
      if (token !== roundToken) return;
      stage.clearSinging();
      stage.clearRest();
      if (!solved && snapshot.join() === SOLUTION_ORDER.join()) succeed();
    });
    app.clock.at(roundEnd + REHEARSAL.roundGapBeats * beatSec, () => {
      if (token !== roundToken || solved || paused) return;
      startRound();
    });
  }

  function stopRound() {
    roundToken += 1;
    app.audio.stopAll();
    stage.clearSinging();
    stage.clearRest();
  }

  /* ---------------- 互動 ---------------- */
  function handleSwap(i, j) {
    if (solved || i === j) { stage.applyOrder(true); return; }
    stage.clearSelected();
    selected = null;
    stage.swap(i, j);
    updateUI();
  }

  function handleTap(id) {
    if (solved) return;
    if (selected === null) {
      selected = id;
      stage.setSelected(id, true);
      renderStrip();
      return;
    }
    if (selected === id) {
      stage.setSelected(id, false);
      selected = null;
      renderStrip();
      return;
    }
    const i = stage.order.indexOf(selected);
    const j = stage.order.indexOf(id);
    stage.clearSelected();
    selected = null;
    stage.swap(i, j);
    updateUI();
  }

  function renderStrip() {
    strip.replaceChildren(...stage.order.map((id, i) => {
      const ch = charById.get(id);
      const btn = h('button', {
        type: 'button',
        class: `slot-btn${selected === id ? ' selected' : ''}`,
        dataset: { id },
        'aria-label': `左邊數第 ${i + 1} 位：${ch.label}`,
        'aria-pressed': String(selected === id),
        disabled: solved,
      });
      btn.appendChild(symbolBadgeSvg(ch.symbol, 26, app.art));
      btn.appendChild(h('span', { class: 'slot-label', text: ch.label }));
      btn.addEventListener('click', () => handleTap(id));
      return h('li', {}, [btn]);
    }));
  }

  function updateUI() {
    refreshClues();
    renderStrip();
  }

  function refreshClues() {
    let allOk = true;
    clueCards.forEach(({ clue, card }) => {
      const ok = clueSatisfied(clue, stage.order);
      card.classList.toggle('ok', ok);
      card.classList.remove('focus');
      if (!ok) allOk = false;
    });
    if (allOk && !solved) app.setCaption(t.allClues);
    else if (!solved) app.setCaption('');
  }

  /* ---------------- 提示與自動協助 ---------------- */
  function unlockAssist() {
    if (assistUnlocked) return;
    assistUnlocked = true;
    assistBtn.disabled = false;
  }

  hintBtn.addEventListener('click', () => {
    if (solved || assisting) return;
    hintCount += 1;
    const unsat = unsatisfiedClues(CLUES, stage.order);

    if (unsat.length === 0) {
      app.setCaption(t.allClues);
    } else if (hintCount === 1) {
      const target = clueCards.find((c) => c.clue.id === unsat[0].id);
      target.card.classList.add('focus');
      app.setCaption(t.hintClue);
    } else if (hintCount === 2) {
      placeOneCorrectly();
      app.setCaption(t.hintPlaced);
    } else {
      app.setCaption(t.hintAssist);
    }
    if (hintCount >= REHEARSAL.hintsBeforeAssist) unlockAssist();
  });

  function placeOneCorrectly() {
    const order = stage.order.slice();
    for (let i = 0; i < order.length; i += 1) {
      if (order[i] !== SOLUTION_ORDER[i]) {
        const j = order.indexOf(SOLUTION_ORDER[i]);
        stage.swap(i, j);
        updateUI();
        return;
      }
    }
  }

  assistBtn.addEventListener('click', () => {
    if (solved || assisting) return;
    assisting = true;
    assistBtn.disabled = true;
    hintBtn.disabled = true;
    stage.clearSelected();
    selected = null;

    const steps = [];
    const work = stage.order.slice();
    for (let i = 0; i < work.length; i += 1) {
      if (work[i] !== SOLUTION_ORDER[i]) {
        const j = work.indexOf(SOLUTION_ORDER[i]);
        [work[i], work[j]] = [work[j], work[i]];
        steps.push([i, j]);
      }
    }
    steps.forEach(([i, j], k) => {
      app.seq.after(260 + k * 420, () => {
        stage.swap(i, j);
        updateUI();
      });
    });
    app.seq.after(260 + steps.length * 420 + 120, () => { assisting = false; });
  });

  /* ---------------- 暫停 / 重播 ---------------- */
  pauseBtn.addEventListener('click', () => {
    if (solved) return;
    paused = !paused;
    pauseBtn.textContent = paused ? t.resume : t.pause;
    pauseBtn.classList.toggle('active', paused);
    if (paused) stopRound();
    else startRound();
  });

  replayBtn.addEventListener('click', () => {
    if (solved) return;
    paused = false;
    pauseBtn.textContent = t.pause;
    pauseBtn.classList.remove('active');
    stopRound();
    startRound();
  });

  /* ---------------- 成功 ---------------- */
  function succeed() {
    solved = true;
    stopRound();
    stage.disableDrag();
    stage.clearSelected();
    selected = null;
    renderStrip();
    [pauseBtn, replayBtn, hintBtn, assistBtn].forEach((b) => { b.disabled = true; });
    app.setCaption('');

    // 七人互看、站直，指揮微笑，短暫安靜後燈光轉暖
    stage.setExchange(CHARACTERS.map((c) => c.id));
    app.seq.after(900, () => {
      stage.setExchange([]);
      stage.standStraight();
      stage.conductorSmile(true);
    });
    app.seq.after(1700, () => stage.warmLights(true));
    app.seq.after(2900, () => app.goto('finale'));
  }
}
