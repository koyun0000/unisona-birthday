import { h, button } from '../core/dom.js';
import { createDoorScene } from '../art/door.js';

/** 開場：快遲到了。由「開始」按鈕解鎖音訊。 */
export function introScene(app) {
  const t = app.cfg.TEXTS.intro;
  const hero = app.cfg.CHARACTERS.find((c) => c.id === app.cfg.HERO_ID);
  const door = createDoorScene({ heroChar: hero, art: app.art });
  door.moveHero(330);
  door.setHeroRunning(true);

  const start = button(t.start, { class: 'btn btn-primary btn-big' });

  const scene = h('section', { class: 'scene scene-intro' }, [
    h('p', { class: 'kicker', text: t.title }),
    door.el,
    h('p', { class: 'prompt', text: t.line }),
    h('p', { class: 'sub', text: t.hint }),
    h('div', { class: 'actions' }, [start]),
    h('p', { class: 'fineprint', text: t.note }),
  ]);

  app.setScene(scene);
  app.setCaption('');
  start.focus({ preventScroll: true });

  start.addEventListener('click', async () => {
    start.disabled = true;
    await app.audio.unlock();
    app.refreshHud();
    app.goto('badge');
  });
}
