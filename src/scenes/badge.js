import { h } from '../core/dom.js';
import { createDoorScene } from '../art/door.js';
import { createPad, badgeGuide } from '../draw/pad.js';
import { toDataURL } from '../draw/strokes.js';

/** 第一關：畫工作證。玩家的實際筆畫會被縮放進證件框，掛在主角胸前。 */
export function badgeScene(app) {
  const t = app.cfg.TEXTS.badge;
  const heroChar = app.cfg.CHARACTERS.find((c) => c.id === app.cfg.HERO_ID);
  const door = createDoorScene({ heroChar });
  door.moveHero(330);

  const prompt = h('p', { class: 'prompt', text: t.prompt });
  const sub = h('p', { class: 'sub', text: t.sub });

  const pad = createPad({
    requirement: app.cfg.DRAW_REQUIREMENTS.badge,
    labels: { clear: t.clear, done: t.done, needMore: t.needMore },
    guide: badgeGuide,
    onDone: finish,
  });

  const scene = h('section', { class: 'scene scene-badge' }, [
    door.el,
    prompt,
    sub,
    pad.el,
  ]);

  app.setScene(scene);
  app.setCaption('');
  pad.mount();
  app.onCleanup(() => pad.destroy());

  // 裡面零散的暖聲
  if (app.audio.unlocked) {
    const warmUp = ['C4', 'F4', 'E4', 'G4', 'D4', 'C4'];
    warmUp.forEach((name, i) => {
      const at = app.audio.time + 1.1 + i * 1.45 + Math.random() * 0.5;
      app.audio.note({
        freq: app.cfg.NOTES[name], noteName: name, start: at, dur: 0.55, kind: 'rehearsal', gain: 0.22,
      });
    });
  }

  function finish(strokes) {
    app.state.badgeStrokes = strokes;
    const href = toDataURL(strokes, { w: 33, h: 25, padding: 0.06, resolution: 9 });
    app.state.badgeHref = href;

    pad.el.classList.add('leaving');
    app.seq.after(380, () => pad.el.remove());

    door.placeHero({ withCard: true, cardHref: href });
    door.moveHero(330);

    app.seq.after(60, () => {
      door.setHeroRunning(true);
      door.moveHero(492);
      prompt.textContent = t.scanning;
      sub.textContent = '';
    });
    app.seq.after(1100, () => {
      door.setHeroRunning(false);
      door.raiseCard(true);
      door.setScanner('busy');
    });
    app.seq.after(2000, () => {
      door.setScanner('ok');
      prompt.textContent = t.pass;
      door.raiseCard(false);
      door.openDoor();
    });
    app.seq.after(2750, () => {
      door.setHeroRunning(true);
      door.moveHero(706, 0.9);
    });
    app.seq.after(3450, () => door.fadeHero(true));
    app.seq.after(4050, () => app.goto('stand'));
  }
}
