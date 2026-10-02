/**
 * 舞台。第二關建立之後一直保留到定格結尾：
 * 玩家畫的工作證、七座玩家畫的譜架、七位團員、指揮都在這裡。
 */
import { s, clientToSvg } from '../core/dom.js';
import { createPerson, createConductor, sheetMusic, noteGlyph } from './figures.js';

export const SLOT_X = [100, 233, 367, 500, 633, 767, 900];
export const slotFootY = (i) => 400 + 20 * Math.abs(i - 3);
const STAND_W = 110;
const STAND_H = 120;
const STAND_TOP_OFFSET = -64;

export class Stage {
  /**
   * @param {object} opts
   * @param {Array} opts.characters 角色設定
   * @param {string} opts.heroId
   * @param {string[]} opts.order 初始站位（角色 id）
   * @param {string[]} opts.signLetters 七張牌的字母
   * @param {string|null} opts.cardHref 玩家畫的工作證 dataURL
   */
  constructor({ characters, heroId, order, signLetters, cardHref }) {
    this.characters = characters;
    this.heroId = heroId;
    this.order = order.slice();
    this.persons = new Map();
    this.stands = [];
    this.dragHandlers = null;

    const svg = s('svg', {
      class: 'stage',
      viewBox: '0 0 1000 700',
      role: 'img',
      'aria-label': '舞台',
      preserveAspectRatio: 'xMidYMid meet',
    });
    this.el = svg;

    svg.appendChild(this.buildBackdrop());

    this.personLayer = s('g', { class: 'person-layer' });
    this.standLayer = s('g', { class: 'stand-layer' });
    this.conductorLayer = s('g', { class: 'conductor-layer' });
    this.effectLayer = s('g', { class: 'effect-layer', 'aria-hidden': 'true' });
    this.greetingLayer = s('g', { class: 'greeting-layer', 'aria-hidden': 'true' });

    svg.appendChild(this.personLayer);
    svg.appendChild(this.standLayer);
    svg.appendChild(this.conductorLayer);
    svg.appendChild(this.effectLayer);
    svg.appendChild(this.greetingLayer);

    // 團員
    characters.forEach((ch) => {
      const slot = this.order.indexOf(ch.id);
      const { g, parts } = createPerson({
        id: ch.id,
        label: ch.label,
        symbol: ch.symbol,
        tint: ch.tint,
        letter: '',
        withCard: ch.id === heroId,
        cardHref,
      });
      g.classList.add('hidden');
      this.personLayer.appendChild(g);
      this.persons.set(ch.id, { ch, g, parts, slot });
    });

    this.signLetters = signLetters;

    // 指揮
    const conductor = createConductor();
    this.conductor = conductor;
    conductor.g.classList.add('hidden');
    conductor.g.setAttribute('transform', 'translate(500 668)');
    this.conductorLayer.appendChild(conductor.g);

    // 主角手上的樂譜
    this.sheet = sheetMusic();
    this.sheet.classList.add('hidden');
    this.personLayer.appendChild(this.sheet);

    this.applyOrder(false);
  }

  buildBackdrop() {
    const g = s('g', { class: 'backdrop', 'aria-hidden': 'true' });

    const defs = s('defs');
    const glow = s('radialGradient', { id: 'u-glow' });
    glow.appendChild(s('stop', { offset: '0%', 'stop-color': '#ffd98a', 'stop-opacity': '0.95' }));
    glow.appendChild(s('stop', { offset: '55%', 'stop-color': '#ffd98a', 'stop-opacity': '0.4' }));
    glow.appendChild(s('stop', { offset: '100%', 'stop-color': '#ffd98a', 'stop-opacity': '0' }));
    defs.appendChild(glow);
    const warm = s('radialGradient', { id: 'u-warm' });
    warm.appendChild(s('stop', { offset: '0%', 'stop-color': '#f6c66a', 'stop-opacity': '0.55' }));
    warm.appendChild(s('stop', { offset: '62%', 'stop-color': '#f6c66a', 'stop-opacity': '0.26' }));
    warm.appendChild(s('stop', { offset: '100%', 'stop-color': '#f6c66a', 'stop-opacity': '0' }));
    defs.appendChild(warm);
    const sel = s('radialGradient', { id: 'u-select' });
    sel.appendChild(s('stop', { offset: '0%', 'stop-color': '#c9742c', 'stop-opacity': '0.6' }));
    sel.appendChild(s('stop', { offset: '100%', 'stop-color': '#c9742c', 'stop-opacity': '0' }));
    defs.appendChild(sel);
    g.appendChild(defs);

    g.appendChild(s('rect', { class: 'wall', x: 0, y: 0, width: 1000, height: 382 }));
    g.appendChild(s('path', { class: 'floor', d: 'M 0 382 L 1000 382 L 1000 700 L 0 700 Z' }));
    g.appendChild(s('path', { class: 'floor-line', d: 'M 0 382 L 1000 382' }));
    // 暖光（成功之後打開）
    g.appendChild(s('ellipse', { class: 'warm-glow', cx: 500, cy: 400, rx: 640, ry: 360 }));
    return g;
  }

  /** 第二關先把鏡頭拉近主角，譜架出現時再拉遠 */
  setView(box) {
    this.el.setAttribute('viewBox', box.join(' '));
  }

  tweenView(from, to, ms) {
    const start = performance.now();
    let raf = 0;
    const step = (now) => {
      const x = Math.min(1, (now - start) / ms);
      const e = x * x * (3 - 2 * x);
      this.setView(from.map((v, i) => v + (to[i] - v) * e));
      if (x < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }

  /* ---------------- 站位 ---------------- */

  applyOrder(animate = true) {
    this.order.forEach((id, i) => {
      const entry = this.persons.get(id);
      if (!entry) return;
      entry.slot = i;
      if (!animate) entry.g.classList.add('no-anim');
      entry.g.style.transform = `translate(${SLOT_X[i]}px, ${slotFootY(i)}px)`;
      entry.g.setAttribute('aria-label', `團員 ${entry.ch.label}，左邊數第 ${i + 1} 位`);
      if (!animate) {
        // 下一幀再開啟動畫，避免初次定位出現滑動
        requestAnimationFrame(() => entry.g.classList.remove('no-anim'));
      }
    });
  }

  setOrder(order, animate = true) {
    this.order = order.slice();
    this.applyOrder(animate);
  }

  swap(i, j) {
    const next = this.order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    this.setOrder(next, true);
    return next;
  }

  personAt(index) {
    return this.persons.get(this.order[index]);
  }

  nearestSlot(x) {
    let best = 0;
    let bestDist = Infinity;
    SLOT_X.forEach((sx, i) => {
      const d = Math.abs(sx - x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  /* ---------------- 進場 ---------------- */

  showHeroAlone() {
    const hero = this.persons.get(this.heroId);
    hero.g.classList.remove('hidden');
    hero.g.classList.add('no-anim');
    hero.g.style.transform = 'translate(500px, 430px)';
    requestAnimationFrame(() => hero.g.classList.remove('no-anim'));
    this.sheet.classList.remove('hidden');
    this.sheet.setAttribute('transform', 'translate(541 349) rotate(6)');
  }

  setStandImage(href) {
    this.standHref = href;
    this.standLayer.replaceChildren();
    this.stands = SLOT_X.map((x, i) => {
      const g = s('g', { class: 'stand hidden', dataset: { slot: String(i) } });
      g.appendChild(s('image', {
        href,
        x: x - STAND_W / 2,
        y: slotFootY(i) + STAND_TOP_OFFSET,
        width: STAND_W,
        height: STAND_H,
        preserveAspectRatio: 'xMidYMid meet',
      }));
      this.standLayer.appendChild(g);
      return g;
    });
  }

  revealStand(i) {
    if (this.stands[i]) this.stands[i].classList.remove('hidden');
  }

  enterMember(id) {
    const entry = this.persons.get(id);
    if (!entry) return;
    entry.g.classList.remove('hidden');
    entry.g.classList.add('entering');
    const i = entry.slot;
    entry.g.style.transform = `translate(${SLOT_X[i]}px, ${slotFootY(i)}px)`;
    requestAnimationFrame(() => entry.g.classList.remove('entering'));
  }

  heroTakeSlot() {
    const hero = this.persons.get(this.heroId);
    const i = hero.slot;
    hero.g.style.transform = `translate(${SLOT_X[i]}px, ${slotFootY(i)}px)`;
    this.sheet.classList.add('hidden');
  }

  showConductor() {
    this.conductor.g.classList.remove('hidden');
  }

  /* ---------------- 演唱表現 ---------------- */

  setSinging(id, on) {
    const entry = this.persons.get(id);
    if (!entry) return;
    entry.g.classList.toggle('sing', on);
  }

  clearSinging() {
    this.persons.forEach((e) => e.g.classList.remove('sing'));
  }

  setRest(id, on) {
    const entry = this.persons.get(id);
    if (!entry) return;
    entry.g.classList.toggle('resting', on);
  }

  clearRest() {
    this.persons.forEach((e) => e.g.classList.remove('resting'));
  }

  setSelected(id, on) {
    const entry = this.persons.get(id);
    if (!entry) return;
    entry.g.classList.toggle('selected', on);
  }

  clearSelected() {
    this.persons.forEach((e) => e.g.classList.remove('selected'));
  }

  setExchange(ids) {
    this.persons.forEach((e, id) => e.g.classList.toggle('glance', ids.includes(id)));
  }

  standStraight() {
    this.persons.forEach((e) => {
      e.g.classList.remove('glance');
      e.g.classList.add('ready');
    });
  }

  conductorSmile(on) {
    const mouth = this.conductor.parts.mouth;
    mouth.setAttribute('d', on ? 'M -7 -126 Q 0 -118 7 -126' : 'M -6 -125 Q 0 -121.5 6 -125');
  }

  /** 指揮棒角度，由時間軸驅動，與節拍一致 */
  setBatonAngle(deg) {
    this.conductor.parts.batonArm.setAttribute('transform', `rotate(${deg.toFixed(2)} 13 -108)`);
  }

  /* ---------------- 結尾 ---------------- */

  raiseSignAt(slotIndex) {
    const entry = this.personAt(slotIndex);
    if (!entry) return;
    const text = entry.parts.sign.querySelector('.letter-sign-text');
    text.textContent = this.signLetters[slotIndex];
    entry.g.classList.add('holding-sign');
  }

  warmLights(on) {
    this.el.classList.toggle('warm', on);
  }

  confetti(count) {
    for (let i = 0; i < count; i += 1) {
      const left = i % 2 === 0;
      const x = left ? 22 + Math.random() * 54 : 924 + Math.random() * 54;
      const g = noteGlyph();
      g.classList.add('confetti');
      g.setAttribute(
        'transform',
        `translate(${x.toFixed(1)} -40) rotate(${(Math.random() * 50 - 25).toFixed(1)}) scale(2.1)`,
      );
      g.style.setProperty('--delay', `${(Math.random() * 1.6).toFixed(2)}s`);
      g.style.setProperty('--dur', `${(5 + Math.random() * 3).toFixed(2)}s`);
      this.effectLayer.appendChild(g);
    }
  }

  /**
   * 指揮棒軌跡帶出 HAPPY BIRTHDAY。
   * 字母用 SVG text 逐一出現，不會拼錯，也不需要圖片。
   */
  prepareGreeting(text) {
    this.greetingLayer.replaceChildren();
    const path = s('path', {
      class: 'greeting-trail',
      d: 'M 118 78 Q 330 26 520 58 Q 720 94 886 40',
      fill: 'none',
    });
    this.greetingLayer.appendChild(path);
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const chars = Array.from(text);
    const letters = chars.map((ch, i) => {
      if (ch === ' ') return null;
      const p = path.getPointAtLength(length * ((i + 0.5) / chars.length));
      const node = s('text', {
        class: 'greeting-letter',
        x: p.x.toFixed(1),
        y: (p.y + 24).toFixed(1),
        text: ch,
      });
      this.greetingLayer.appendChild(node);
      return { node, at: (i + 0.6) / chars.length };
    }).filter(Boolean);

    const tip = s('circle', { class: 'greeting-tip', cx: 118, cy: 78, r: 5 });
    this.greetingLayer.appendChild(tip);

    this.greeting = { path, length, letters, tip };
    return this.greeting;
  }

  setGreetingProgress(p) {
    if (!this.greeting) return;
    const { path, length, letters, tip } = this.greeting;
    const clamped = Math.max(0, Math.min(1, p));
    path.style.strokeDashoffset = `${length * (1 - clamped)}`;
    const point = path.getPointAtLength(length * clamped);
    tip.setAttribute('cx', point.x.toFixed(1));
    tip.setAttribute('cy', point.y.toFixed(1));
    tip.style.opacity = clamped > 0 && clamped < 1 ? '1' : '0';
    letters.forEach((l) => {
      if (clamped >= l.at) l.node.classList.add('shown');
    });
  }

  /* ---------------- 拖曳與點選 ---------------- */

  enableDrag({ onSwap, onTap }) {
    if (this.dragHandlers) return;
    const svg = this.el;
    let drag = null;

    const onPointerDown = (event) => {
      const target = event.target.closest?.('.person');
      if (!target) return;
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      const id = target.dataset.id;
      const entry = this.persons.get(id);
      const start = clientToSvg(svg, event.clientX, event.clientY);
      drag = {
        id, entry, start, moved: false, index: entry.slot,
        originX: SLOT_X[entry.slot], originY: slotFootY(entry.slot),
      };
      target.setPointerCapture?.(event.pointerId);
      target.classList.add('dragging');
    };

    const onPointerMove = (event) => {
      if (!drag) return;
      event.preventDefault();
      const p = clientToSvg(svg, event.clientX, event.clientY);
      const dx = p.x - drag.start.x;
      const dy = p.y - drag.start.y;
      if (!drag.moved && Math.hypot(dx, dy) > 7) drag.moved = true;
      if (!drag.moved) return;
      drag.entry.g.style.transform =
        `translate(${drag.originX + dx}px, ${drag.originY + dy * 0.35}px)`;
      const slot = this.nearestSlot(drag.originX + dx);
      this.stands.forEach((st, i) => st.classList.toggle('target', i === slot && slot !== drag.index));
    };

    const finish = (event) => {
      if (!drag) return;
      const current = drag;
      drag = null;
      current.entry.g.classList.remove('dragging');
      this.stands.forEach((st) => st.classList.remove('target'));
      if (!current.moved) {
        onTap(current.id);
        this.applyOrder(true);
        return;
      }
      const p = clientToSvg(svg, event.clientX, event.clientY);
      const slot = this.nearestSlot(p.x);
      if (slot !== current.index) onSwap(current.index, slot);
      else this.applyOrder(true);
    };

    const onKeyDown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest?.('.person');
      if (!target) return;
      event.preventDefault();
      onTap(target.dataset.id);
    };

    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', finish);
    svg.addEventListener('pointercancel', finish);
    svg.addEventListener('keydown', onKeyDown);
    svg.classList.add('interactive');

    this.dragHandlers = () => {
      svg.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerup', finish);
      svg.removeEventListener('pointercancel', finish);
      svg.removeEventListener('keydown', onKeyDown);
      svg.classList.remove('interactive');
    };
  }

  disableDrag() {
    if (this.dragHandlers) {
      this.dragHandlers();
      this.dragHandlers = null;
    }
    this.persons.forEach((e) => {
      e.g.removeAttribute('tabindex');
      e.g.removeAttribute('role');
    });
  }
}
