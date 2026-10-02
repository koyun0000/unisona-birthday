import { h, button } from '../core/dom.js';

/**
 * 第四關：正式生日演出與定格。
 * - 前三句逐音接唱（每個起音交給一位團員），第四句七人齊唱。
 * - 最後一音延長，延長期間七人依序舉牌組成 UNISONA。
 * - 指揮棒軌跡帶出 HAPPY BIRTHDAY，之後畫面永久停留。
 */
export function finaleScene(app) {
  const { PERFORMANCE, FINALE, NOTES, TEXTS, MOTION } = app.cfg;
  const stage = app.stage;
  const beatSec = 60 / PERFORMANCE.tempo;
  const cues = PERFORMANCE.cues;

  stage.disableDrag();
  stage.warmLights(true);
  stage.conductorSmile(true);
  stage.clearSinging();
  stage.clearRest();
  stage.clearSelected();

  const replayBtn = button(TEXTS.finale.replay, { class: 'btn btn-quiet' });
  const actions = h('div', { class: 'controls finale-controls', hidden: 'hidden' }, [replayBtn]);

  const scene = h('section', { class: 'scene scene-finale' }, [
    h('div', { class: 'stage-holder' }, [stage.el]),
    actions,
  ]);
  app.setScene(scene);
  app.setCaption('');

  // 鏡頭拉遠，讓出上方寫 HAPPY BIRTHDAY 的空間
  app.onCleanup(stage.tweenView([0, 120, 1000, 580], [0, 0, 1000, 700], 1400));

  stage.prepareGreeting(FINALE.greeting);
  stage.setGreetingProgress(0);

  const t0 = app.audio.time + 0.45;
  const atBeat = (b) => t0 + (b + PERFORMANCE.leadInBeats) * beatSec;

  /* ---------------- 音樂與角色 ---------------- */
  PERFORMANCE.phrases.forEach((phrase) => {
    const kind = phrase.mode === 'chorus' ? 'chorus' : 'solo';
    phrase.notes.forEach((noteName, i) => {
      const ev = phrase.rhythm[i];
      const start = atBeat(phrase.startBeat + ev.beat);
      const dur = ev.dur * beatSec;
      const isLast = phrase.mode === 'chorus' && i === phrase.notes.length - 1;

      app.audio.note({
        freq: NOTES[noteName],
        noteName,
        start,
        dur,
        kind,
        gain: kind === 'chorus' ? 1 : 0.95,
      });

      const slots = phrase.singers === 'all'
        ? [0, 1, 2, 3, 4, 5, 6]
        : [phrase.singers[i]];

      app.clock.at(start, () => {
        stage.clearSinging();
        slots.forEach((slot) => {
          const entry = stage.personAt(slot);
          if (entry) stage.setSinging(entry.ch.id, true);
        });
      });

      const visualOff = isLast ? dur : Math.min(dur * 0.92, 1.25);
      app.clock.at(start + visualOff, () => {
        if (isLast) return; // 延長音期間一直保持張嘴
        slots.forEach((slot) => {
          const entry = stage.personAt(slot);
          if (entry) stage.setSinging(entry.ch.id, false);
        });
      });
    });
  });

  /* ---------------- 字幕 ---------------- */
  PERFORMANCE.captions.forEach((c) => {
    app.clock.at(atBeat(c.beat), () => app.setCaption(c.text));
  });

  /* ---------------- 舉牌：UNISONA ---------------- */
  FINALE.signLetters.forEach((_, slot) => {
    app.clock.at(atBeat(cues.signsStartBeat + slot * cues.signStaggerBeats), () => {
      stage.raiseSignAt(slot);
    });
  });

  /* ---------------- 音符彩帶 ---------------- */
  if (!app.state.reducedMotion) {
    app.clock.at(atBeat(cues.confettiBeat), () => stage.confetti(MOTION.confettiCount));
  }

  /* ---------------- 指揮動作與 HAPPY BIRTHDAY ---------------- */
  const BAR = [
    { b: 0, a: -34 },
    { b: 1, a: 2 },
    { b: 2, a: 28 },
    { b: 3, a: -34 },
  ];
  const smooth = (x) => x * x * (3 - 2 * x);
  const lerp = (a, b, x) => a + (b - a) * x;

  function barAngle(bp) {
    const phase = ((bp % 3) + 3) % 3;
    for (let i = 0; i < 3; i += 1) {
      if (phase >= BAR[i].b && phase <= BAR[i + 1].b) {
        const x = (phase - BAR[i].b) / (BAR[i + 1].b - BAR[i].b);
        return lerp(BAR[i].a, BAR[i + 1].a, smooth(x));
      }
    }
    return BAR[0].a;
  }

  const sustainBeat = 28; // 最後一音起點
  let frozen = false;

  const stopTick = app.clock.onTick((now) => {
    if (frozen) return;
    const bp = (now - t0) / beatSec - PERFORMANCE.leadInBeats;

    let angle;
    if (bp < cues.conductorRaise) angle = 0;
    else if (bp < 0) angle = lerp(0, BAR[0].a, smooth((bp - cues.conductorRaise) / (0 - cues.conductorRaise)));
    else if (bp < sustainBeat) angle = barAngle(bp);
    else if (bp < cues.conductorCloseBeat) angle = -8 + 5 * Math.sin((bp - sustainBeat) * 1.9);
    else angle = lerp(-8, 48, smooth(Math.min(1, (bp - cues.conductorCloseBeat) / 1.5)));
    stage.setBatonAngle(angle);

    const gp = (bp - cues.greetingStartBeat) / cues.greetingDurationBeats;
    if (gp > 0) stage.setGreetingProgress(Math.min(1, gp));
  });

  app.clock.at(atBeat(cues.freezeBeat), () => {
    frozen = true;
    stopTick();
    stage.setGreetingProgress(1);
    app.audio.stopAll();
    app.state.frozen = true;
    actions.removeAttribute('hidden');
    actions.classList.add('shown');
  });

  replayBtn.addEventListener('click', () => {
    app.restart();
  });
}
