/** 後台入口。開場與第一關共用。 */
import { s } from '../core/dom.js';
import { createPerson } from './figures.js';

const FRAME = { x: 598, y: 70, w: 212, h: 250 };

export function createDoorScene({ heroChar, art = null }) {
  const svg = s('svg', {
    class: 'door-scene',
    viewBox: '0 0 1000 380',
    role: 'img',
    'aria-label': '後台入口',
    preserveAspectRatio: 'xMidYMid meet',
  });

  const defs = s('defs');
  const clip = s('clipPath', { id: 'door-clip' });
  clip.appendChild(s('rect', {
    x: FRAME.x + 4, y: FRAME.y + 4, width: FRAME.w - 8, height: FRAME.h - 4,
  }));
  defs.appendChild(clip);
  svg.appendChild(defs);

  const bg = s('g', { 'aria-hidden': 'true' });
  const painted = art && art.scene('door');
  if (painted) {
    bg.appendChild(s('image', {
      class: 'door-art',
      href: painted,
      x: 0, y: 0, width: 1000, height: 380,
      preserveAspectRatio: 'none',
    }));
  } else {
    bg.appendChild(s('rect', { class: 'night', x: 0, y: 0, width: 1000, height: 380 }));
    bg.appendChild(s('path', { class: 'ground', d: 'M 0 320 L 1000 320 L 1000 380 L 0 380 Z' }));
    bg.appendChild(s('path', { class: 'floor-line', d: 'M 0 320 L 1000 320' }));
    bg.appendChild(s('rect', { class: 'wall', x: 250, y: 24, width: 750, height: 296 }));
    bg.appendChild(s('path', {
      class: 'wall-seam', d: 'M 250 24 L 250 320 M 330 86 L 520 86 M 330 150 L 450 150',
    }));
  }
  // 門後的暖光（開門之後才亮）
  bg.appendChild(s('rect', {
    class: 'inside-glow',
    x: FRAME.x + 4, y: FRAME.y + 4, width: FRAME.w - 8, height: FRAME.h - 4,
  }));
  svg.appendChild(bg);

  const panel = s('g', { class: 'door-panel', 'clip-path': 'url(#door-clip)', 'aria-hidden': 'true' });
  const leafArt = art && art.scene('doorLeaf');
  if (leafArt) {
    panel.appendChild(s('image', {
      href: leafArt,
      x: FRAME.x + 4, y: FRAME.y + 4, width: FRAME.w - 8, height: FRAME.h - 4,
      preserveAspectRatio: 'none',
    }));
  } else {
    panel.appendChild(s('rect', {
      class: 'door-leaf', x: FRAME.x + 4, y: FRAME.y + 4, width: FRAME.w - 8, height: FRAME.h - 4,
    }));
    panel.appendChild(s('path', {
      class: 'ink',
      d: `M ${FRAME.x + 34} ${FRAME.y + 54} L ${FRAME.x + FRAME.w - 34} ${FRAME.y + 54} `
        + `M ${FRAME.x + 34} ${FRAME.y + 118} L ${FRAME.x + FRAME.w - 34} ${FRAME.y + 118}`,
    }));
    panel.appendChild(s('circle', {
      class: 'door-knob', cx: FRAME.x + FRAME.w - 26, cy: FRAME.y + 150, r: 6,
    }));
  }
  svg.appendChild(panel);

  if (!painted) {
    svg.appendChild(s('rect', {
      class: 'door-frame',
      x: FRAME.x, y: FRAME.y, width: FRAME.w, height: FRAME.h, rx: 4, 'aria-hidden': 'true',
    }));
  }

  const scanner = s('g', { class: 'scanner', 'aria-hidden': 'true' });
  const scannerArt = art && art.scene('scanner');
  if (scannerArt) {
    scanner.appendChild(s('image', {
      href: scannerArt, x: 530, y: 142, width: 50, height: 82, preserveAspectRatio: 'xMidYMid meet',
    }));
  } else {
    scanner.appendChild(s('rect', { class: 'scanner-body', x: 530, y: 142, width: 50, height: 82, rx: 10 }));
    scanner.appendChild(s('path', {
      class: 'ink', d: 'M 541 190 L 569 190 M 541 204 L 569 204', 'stroke-width': 1.8,
    }));
  }
  // 指示燈一律由程式畫，狀態才能跟著掃描流程變色
  scanner.appendChild(s('circle', { class: 'scanner-light', cx: 555, cy: 164, r: 8 }));
  svg.appendChild(scanner);

  const actors = s('g', { class: 'door-actors' });
  svg.appendChild(actors);

  let hero = null;
  function placeHero({ withCard, cardHref }) {
    const previous = hero ? hero.g.style.transform : '';
    if (hero) hero.g.remove();
    hero = createPerson({
      id: heroChar.id,
      label: heroChar.label,
      symbol: heroChar.symbol,
      tint: heroChar.tint,
      withCard,
      cardHref,
    });
    hero.g.classList.add('door-hero');
    hero.g.removeAttribute('role');
    hero.g.removeAttribute('tabindex');
    hero.g.querySelector('.person-hit')?.remove();
    hero.g.querySelector('.name-chip')?.remove();
    hero.g.querySelector('.rest-mark')?.remove();
    hero.g.querySelector('.letter-sign')?.remove();
    if (previous) hero.g.style.transform = previous;
    actors.appendChild(hero.g);
    return hero;
  }

  placeHero({ withCard: false, cardHref: null });

  return {
    el: svg,
    placeHero,
    moveHero(x, scale = 1.15) {
      hero.g.style.transform = `translate(${x}px, 320px) scale(${scale})`;
    },
    setHeroRunning(on) {
      hero.g.classList.toggle('running', on);
    },
    fadeHero(on) {
      hero.g.classList.toggle('gone', on);
    },
    raiseCard(on) {
      hero.g.classList.toggle('offering', on);
    },
    setScanner(state) {
      scanner.classList.remove('busy', 'ok');
      if (state) scanner.classList.add(state);
    },
    openDoor() {
      panel.classList.add('open');
      svg.classList.add('door-open');
    },
  };
}
