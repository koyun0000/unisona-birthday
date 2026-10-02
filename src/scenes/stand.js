import { h } from '../core/dom.js';
import { createPad, standGuide } from '../draw/pad.js';
import { toDataURL } from '../draw/strokes.js';
import { Stage } from '../art/stage.js';

/** 第二關：畫譜架。玩家的筆畫被縮放、複製成七座譜架。 */
export function standScene(app) {
  const t = app.cfg.TEXTS.stand;

  const stage = new Stage({
    characters: app.cfg.CHARACTERS,
    heroId: app.cfg.HERO_ID,
    order: app.cfg.INITIAL_ORDER,
    signLetters: app.cfg.FINALE.signLetters,
    cardHref: app.state.badgeHref,
  });
  app.stage = stage;
  stage.disableDrag();
  stage.showHeroAlone();
  // 先把鏡頭拉近主角，等譜架出現再拉遠到整個舞台
  const CLOSE_VIEW = [300, 192, 400, 280];
  const WIDE_VIEW = [0, 120, 1000, 580];
  stage.setView(CLOSE_VIEW);

  const prompt = h('p', { class: 'prompt', text: t.prompt });
  const sub = h('p', { class: 'sub', text: t.sub });

  const pad = createPad({
    requirement: app.cfg.DRAW_REQUIREMENTS.stand,
    labels: { clear: t.clear, done: t.done, needMore: t.needMore },
    guide: standGuide,
    onDone: finish,
  });

  const scene = h('section', { class: 'scene scene-stand' }, [
    h('div', { class: 'stage-holder' }, [stage.el]),
    prompt,
    sub,
    pad.el,
  ]);

  app.setScene(scene);
  app.setCaption('');
  pad.mount();
  app.onCleanup(() => pad.destroy());

  function finish(strokes) {
    app.state.standStrokes = strokes;
    const href = toDataURL(strokes, { w: 110, h: 120, padding: 0.05, resolution: 3 });
    app.state.standHref = href;
    stage.setStandImage(href);

    pad.el.classList.add('leaving');
    app.seq.after(380, () => pad.el.remove());

    prompt.textContent = t.building;
    sub.textContent = '';

    const cancelZoom = stage.tweenView(CLOSE_VIEW, WIDE_VIEW, 1100);
    app.onCleanup(cancelZoom);

    // 七座譜架依序出現
    for (let i = 0; i < 7; i += 1) {
      app.seq.after(620 + i * 170, () => stage.revealStand(i));
    }

    // 七個小人陸續出場，排成圓弧；主角回到自己的位置
    const others = app.cfg.INITIAL_ORDER.filter((id) => id !== app.cfg.HERO_ID);
    app.seq.after(1900, () => {
      prompt.textContent = t.entering;
      stage.heroTakeSlot();
    });
    others.forEach((id, i) => {
      app.seq.after(2100 + i * 190, () => stage.enterMember(id));
    });

    app.seq.after(2100 + others.length * 190 + 320, () => stage.showConductor());
    app.seq.after(2100 + others.length * 190 + 1100, () => app.goto('rehearsal'));
  }
}
