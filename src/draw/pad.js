/**
 * 繪圖區：支援滑鼠、觸控、觸控筆。
 * - 固定 3:2 比例，所以縮放、手機旋轉之後筆畫位置仍然正確。
 * - 筆畫以正規化座標保存，可縮放進場景。
 */
import { h, button } from '../core/dom.js';
import { createStroke, hasEnough, paint, cloneStrokes } from './strokes.js';

const ASPECT = 2 / 3; // height / width

export function createPad({
  requirement, labels, guide, onDone, inkColor = '#2f2a26',
}) {
  const strokes = [];
  let current = null;
  let dpr = 1;
  let cssWidth = 0;

  const canvas = h('canvas', { class: 'pad-canvas', 'aria-label': '繪圖區' });
  const status = h('p', { class: 'pad-status', 'aria-live': 'polite', text: '' });
  const clearBtn = button(labels.clear, { class: 'btn btn-quiet' });
  const doneBtn = button(labels.done, { class: 'btn btn-primary' });
  const wrap = h('div', { class: 'pad' }, [
    h('div', { class: 'pad-frame' }, [canvas]),
    h('div', { class: 'pad-actions' }, [clearBtn, doneBtn, status]),
  ]);

  function toLocal(event) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.width, // 兩軸同尺度，保留比例
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cssWidth = rect.width;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.width * ASPECT * dpr);
    redraw();
  }

  function redraw() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = cssWidth * dpr;
    if (guide) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = Math.max(1, 1.6 * dpr);
      ctx.setLineDash([6 * dpr, 6 * dpr]);
      guide(ctx, scale, scale * ASPECT);
      ctx.restore();
    }
    paint(ctx, strokes, {
      scale,
      offsetX: 0,
      offsetY: 0,
      color: inkColor,
      minWidth: 1.5 * dpr,
    });
  }

  function refreshState() {
    const enough = hasEnough(strokes, requirement);
    doneBtn.disabled = !enough;
    status.textContent = enough ? '' : (strokes.length ? labels.needMore : '');
    clearBtn.disabled = strokes.length === 0;
  }

  function onDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    current = createStroke(0.014);
    current.points.push(toLocal(event));
    strokes.push(current);
    redraw();
    refreshState();
  }

  function onMove(event) {
    if (!current) return;
    event.preventDefault();
    const p = toLocal(event);
    const prev = current.points[current.points.length - 1];
    if (Math.hypot(p.x - prev.x, p.y - prev.y) < 0.004) return;
    current.points.push(p);
    redraw();
    refreshState();
  }

  function onUp() {
    if (!current) return;
    if (current.points.length === 1) current.points.push({ ...current.points[0] });
    current = null;
    refreshState();
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onUp);

  clearBtn.addEventListener('click', () => {
    strokes.length = 0;
    current = null;
    redraw();
    refreshState();
  });

  doneBtn.addEventListener('click', () => {
    if (!hasEnough(strokes, requirement)) {
      status.textContent = labels.needMore;
      return;
    }
    doneBtn.disabled = true;
    clearBtn.disabled = true;
    onDone(cloneStrokes(strokes));
  });

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;

  return {
    el: wrap,
    mount() {
      resize();
      if (ro) ro.observe(canvas);
      window.addEventListener('resize', resize);
      window.addEventListener('orientationchange', resize);
      refreshState();
    },
    destroy() {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    },
  };
}

/** 證件框參考輪廓 */
export function badgeGuide(ctx, w, h) {
  const bw = w * 0.56;
  const bh = bw * 0.68;
  const x = (w - bw) / 2;
  const y = (h - bh) / 2;
  ctx.strokeRect(x, y, bw, bh);
}

/** 譜架參考輪廓（淡淡的，不要求照著畫） */
export function standGuide(ctx, w, h) {
  const cx = w / 2;
  const deskW = w * 0.42;
  const deskY = h * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx - deskW / 2, deskY + h * 0.08);
  ctx.lineTo(cx + deskW / 2, deskY);
  ctx.moveTo(cx, deskY + h * 0.05);
  ctx.lineTo(cx, h * 0.8);
  ctx.moveTo(cx - w * 0.1, h * 0.88);
  ctx.lineTo(cx, h * 0.8);
  ctx.lineTo(cx + w * 0.1, h * 0.88);
  ctx.stroke();
}
