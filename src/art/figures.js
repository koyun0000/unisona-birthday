/**
 * 角色與道具全部用 SVG 畫，不需要任何 PNG 就能開發。
 * 小人的局部座標：腳底在 (0, 0)，身體往負 y 方向長。
 */
import { s } from '../core/dom.js';

/* ---------------- 徽章圖案（24 x 24 方框內） ---------------- */
export const SYMBOLS = {
  star: {
    d: 'M12 2.4 L14.7 9.2 L21.9 9.6 L16.3 14.1 L18.3 21 L12 17 L5.7 21 L7.7 14.1 L2.1 9.6 L9.3 9.2 Z',
    fill: true,
  },
  moon: {
    d: 'M13.9 3.1 C8.1 5 4.8 8.8 4.8 12.3 C4.8 16.3 8.4 20.6 14.4 21.2 '
      + 'C9.8 18.2 8.2 15.2 8.2 12.1 C8.2 8.4 10.4 5 13.9 3.1 Z',
    fill: true,
  },
  leaf: {
    d: 'M12 2.6 C18.6 7 19.5 15.4 12 21.4 C4.5 15.4 5.4 7 12 2.6 Z M12 5.5 L12 19.4',
    fill: true,
  },
  wave: {
    d: 'M2.6 9.4 Q6.1 4.9 9.6 9.4 T16.6 9.4 T21.4 9.4 M2.6 15.6 Q6.1 11.1 9.6 15.6 T16.6 15.6 T21.4 15.6',
    fill: false,
    sw: 2.4,
  },
  mount: {
    d: 'M1.8 19.6 L9 6.4 L13.4 13.6 L17 8.4 L22.2 19.6 Z',
    fill: true,
  },
  grid: {
    d: 'M4 4 H20 V20 H4 Z M4 12 H20 M12 4 V20',
    fill: false,
    sw: 2.2,
  },
  heart: {
    d: 'M12 20.6 C4.5 15 3 11.4 3 8.9 C3 5.9 5.2 3.9 7.6 3.9 C9.5 3.9 11.1 5 12 6.8 '
      + 'C12.9 5 14.5 3.9 16.4 3.9 C18.8 3.9 21 5.9 21 8.9 C21 11.4 19.5 15 12 20.6 Z',
    fill: true,
  },
};

/** 回傳一個以 (0,0) 為中心、邊長 size 的徽章圖案 group */
export function symbolNode(key, size, extra = {}) {
  const spec = SYMBOLS[key];
  const k = size / 24;
  const g = s('g', {
    transform: `translate(${-size / 2} ${-size / 2}) scale(${k})`,
    ...extra,
  });
  g.appendChild(s('path', {
    d: spec.d,
    fill: spec.fill ? 'currentColor' : 'none',
    stroke: 'currentColor',
    'stroke-width': spec.fill ? 0.9 : (spec.sw || 2.2),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }));
  return g;
}

/** 小 SVG，給便條、HTML 介面使用 */
export function symbolBadgeSvg(key, px = 34) {
  const svg = s('svg', {
    class: 'symbol-chip',
    viewBox: '-20 -20 40 40',
    width: px,
    height: px,
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.appendChild(s('circle', { cx: 0, cy: 0, r: 17, class: 'symbol-chip-bg' }));
  svg.appendChild(symbolNode(key, 21));
  return svg;
}

/* ---------------- 休止符與音符 ---------------- */
export function restGlyph() {
  return s('path', {
    class: 'rest-glyph',
    d: 'M-5 -9 L4 -3 L-3 2 L5 9',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 3,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
}

export function noteGlyph() {
  const g = s('g', { class: 'note-glyph' });
  g.appendChild(s('ellipse', {
    cx: -4, cy: 6, rx: 5.4, ry: 4.1, transform: 'rotate(-20 -4 6)', fill: 'currentColor',
  }));
  g.appendChild(s('path', {
    d: 'M1.2 5 L1.2 -10 Q7 -8.6 8.6 -4.4', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round',
  }));
  return g;
}

/* ---------------- 小人 ---------------- */
/**
 * @returns {{g:SVGGElement, parts:object}}
 */
export function createPerson({
  id, label, symbol, tint, letter, withCard = false, cardHref = null,
}) {
  const g = s('g', {
    class: 'person',
    dataset: { id },
    role: 'button',
    tabindex: '0',
    'aria-label': `團員 ${label}`,
  });
  const inner = s('g', { class: 'person-inner' });
  g.appendChild(inner);

  // 亮起時的柔光
  inner.appendChild(s('ellipse', {
    class: 'person-glow', cx: 0, cy: -100, rx: 54, ry: 112,
  }));

  // 腿
  inner.appendChild(s('path', {
    class: 'ink leg',
    d: 'M -9 0 L -4.5 -66 M 9 0 L 4.5 -66 M -14 0 L -6 0 M 6 0 L 14 0',
  }));

  // 身體
  inner.appendChild(s('path', {
    class: 'torso',
    d: 'M -17 -66 Q -19.5 -112 -14 -126 Q 0 -131.5 14 -126 Q 19.5 -112 17 -66 Z',
    style: { '--tint': tint },
  }));

  // 手臂（放下 / 舉起 兩種）
  const armsDown = s('path', {
    class: 'ink arms arms-down',
    d: 'M -14 -122 Q -27 -108 -25 -90 M 14 -122 Q 27 -108 25 -90',
  });
  const armsUp = s('path', {
    class: 'ink arms arms-up',
    d: 'M -14 -122 Q -31 -152 -23 -194 M 14 -122 Q 31 -152 23 -194',
  });
  inner.appendChild(armsDown);
  inner.appendChild(armsUp);

  // 胸前徽章（圖案）
  const emblem = s('g', { class: 'emblem', transform: 'translate(0 -104)' });
  emblem.appendChild(s('circle', { class: 'emblem-bg', cx: 0, cy: 0, r: 16, style: { '--tint': tint } }));
  emblem.appendChild(symbolNode(symbol, 21));
  inner.appendChild(emblem);

  // 頭
  inner.appendChild(s('circle', { class: 'head', cx: 0, cy: -148, r: 20 }));
  inner.appendChild(s('path', {
    class: 'ink hair',
    d: 'M -11 -165 Q -8 -172 -4 -166 M -2 -167 Q 1 -175 5 -167 M 7 -164 Q 11 -170 14 -162',
  }));
  inner.appendChild(s('circle', { class: 'eye', cx: -7, cy: -152, r: 2 }));
  inner.appendChild(s('circle', { class: 'eye', cx: 7, cy: -152, r: 2 }));
  inner.appendChild(s('path', {
    class: 'ink mouth mouth-closed', d: 'M -7 -138 Q 0 -133.5 7 -138',
  }));
  inner.appendChild(s('ellipse', {
    class: 'mouth mouth-open', cx: 0, cy: -137, rx: 5.4, ry: 7,
  }));

  // 文字標籤（與圖案徽章雙重辨識）
  const chip = s('g', { class: 'name-chip' });
  chip.appendChild(s('rect', { x: -21, y: -203, width: 42, height: 32, rx: 10 }));
  chip.appendChild(s('text', { x: 0, y: -180, class: 'name-chip-text', text: label }));
  inner.appendChild(chip);

  // 玩家畫的工作證（只有主角有）
  let card = null;
  if (withCard) {
    card = s('g', { class: 'id-card' });
    card.appendChild(s('path', {
      class: 'ink lanyard', d: 'M -4 -127 L -41 -93 M 4 -127 L -19 -93',
    }));
    const holder = s('g', { transform: 'translate(-30 -79) rotate(-8)' });
    holder.appendChild(s('rect', {
      class: 'id-card-bg', x: -18, y: -14, width: 36, height: 28, rx: 3,
    }));
    if (cardHref) {
      holder.appendChild(s('image', {
        href: cardHref, x: -16.5, y: -12.5, width: 33, height: 25, preserveAspectRatio: 'xMidYMid meet',
      }));
    }
    holder.appendChild(s('rect', {
      class: 'id-card-edge', x: -18, y: -14, width: 36, height: 28, rx: 3,
    }));
    card.appendChild(holder);
    inner.appendChild(card);
  }

  // 休止符提示
  const rest = s('g', { class: 'rest-mark', transform: 'translate(34 -160)' });
  rest.appendChild(s('circle', { class: 'rest-bg', cx: 0, cy: 0, r: 15 }));
  rest.appendChild(restGlyph());
  inner.appendChild(rest);

  // 舉牌（結尾）
  const sign = s('g', { class: 'letter-sign' });
  sign.appendChild(s('rect', {
    class: 'letter-sign-bg', x: -31, y: -252, width: 62, height: 50, rx: 5,
  }));
  sign.appendChild(s('text', { class: 'letter-sign-text', x: 0, y: -216, text: letter || '' }));
  inner.appendChild(sign);

  // 觸控熱區（放最後，方便手指點到）
  const hit = s('rect', {
    class: 'person-hit', x: -58, y: -210, width: 116, height: 232,
  });
  g.appendChild(hit);

  return { g, parts: { inner, armsDown, armsUp, sign, card, chip, rest, hit } };
}

/* ---------------- 指揮 ---------------- */
export function createConductor() {
  const g = s('g', { class: 'conductor' });
  const inner = s('g', { class: 'conductor-inner' });
  g.appendChild(inner);

  inner.appendChild(s('path', {
    class: 'ink leg', d: 'M -8 0 L -4 -58 M 8 0 L 4 -58 M -13 0 L -5 0 M 5 0 L 13 0',
  }));
  inner.appendChild(s('path', {
    class: 'torso conductor-torso',
    d: 'M -16 -58 Q -18 -98 -13 -112 Q 0 -117 13 -112 Q 18 -98 16 -58 Z',
  }));
  inner.appendChild(s('path', {
    class: 'ink', d: 'M -13 -108 Q -27 -94 -25 -76',
  }));

  // 右手＋指揮棒，繞肩膀旋轉
  const batonArm = s('g', { class: 'baton-arm' });
  batonArm.appendChild(s('path', {
    class: 'ink', d: 'M 13 -108 L 33 -128',
  }));
  batonArm.appendChild(s('path', {
    class: 'baton', d: 'M 33 -128 L 62 -146',
  }));
  batonArm.appendChild(s('circle', { class: 'baton-tip', cx: 62, cy: -146, r: 3.4 }));
  inner.appendChild(batonArm);

  inner.appendChild(s('circle', { class: 'head', cx: 0, cy: -133, r: 18 }));
  inner.appendChild(s('path', {
    class: 'ink hair', d: 'M -12 -148 Q -6 -156 0 -149 M 2 -150 Q 8 -157 13 -147',
  }));
  inner.appendChild(s('circle', { class: 'eye', cx: -6, cy: -137, r: 1.9 }));
  inner.appendChild(s('circle', { class: 'eye', cx: 6, cy: -137, r: 1.9 }));
  inner.appendChild(s('path', {
    class: 'ink mouth conductor-mouth', d: 'M -6 -125 Q 0 -121.5 6 -125',
  }));

  return { g, parts: { inner, batonArm, mouth: inner.querySelector('.conductor-mouth') } };
}

/** 主角手上的樂譜 */
export function sheetMusic() {
  const g = s('g', { class: 'sheet' });
  g.appendChild(s('path', { class: 'sheet-bg', d: 'M -16 -12 L 16 -16 L 16 12 L -16 16 Z' }));
  g.appendChild(s('path', {
    class: 'ink',
    d: 'M -11 -6 L 11 -9 M -11 -1 L 11 -4 M -11 4 L 11 1 M -11 9 L 11 6',
    'stroke-width': 1.2,
  }));
  return g;
}
