/**
 * 筆畫資料與繪製。
 * 筆畫座標是正規化的：x 以繪圖區寬度為 1，y 用同一個尺度（所以比例不會被拉壞）。
 * 這樣同一份筆畫資料可以被縮放到任何目標框（證件框、譜架位置）。
 */

export function createStroke(width) {
  return { width, points: [] };
}

export function strokeCount(strokes) {
  return strokes.filter((s) => s.points.length > 1).length;
}

export function pointCount(strokes) {
  return strokes.reduce((n, s) => n + s.points.length, 0);
}

export function totalLength(strokes) {
  let len = 0;
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.points.length; i += 1) {
      const dx = stroke.points[i].x - stroke.points[i - 1].x;
      const dy = stroke.points[i].y - stroke.points[i - 1].y;
      len += Math.hypot(dx, dy);
    }
  }
  return len;
}

/** 不做影像辨識，只檢查筆畫量是否足夠 */
export function hasEnough(strokes, req) {
  return strokeCount(strokes) >= req.minStrokes
    && pointCount(strokes) >= req.minPoints
    && totalLength(strokes) >= req.minLength;
}

export function bounds(strokes) {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const p of stroke.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (minX === Infinity) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * 畫出筆畫。transform 把正規化座標映射成 canvas 像素：
 * px = p.x * scale + offsetX
 */
export function paint(ctx, strokes, { scale, offsetX, offsetY, color, widthScale = 1, minWidth = 1.2 }) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    const pts = stroke.points;
    if (pts.length === 0) continue;
    ctx.lineWidth = Math.max(minWidth, stroke.width * scale * widthScale);
    ctx.beginPath();
    const x0 = pts[0].x * scale + offsetX;
    const y0 = pts[0].y * scale + offsetY;
    if (pts.length === 1) {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + 0.01, y0);
    } else {
      ctx.moveTo(x0, y0);
      for (let i = 1; i < pts.length - 1; i += 1) {
        const cx = pts[i].x * scale + offsetX;
        const cy = pts[i].y * scale + offsetY;
        const nx = (pts[i].x + pts[i + 1].x) / 2 * scale + offsetX;
        const ny = (pts[i].y + pts[i + 1].y) / 2 * scale + offsetY;
        ctx.quadraticCurveTo(cx, cy, nx, ny);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x * scale + offsetX, last.y * scale + offsetY);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 把實際筆畫等比縮放、置中到 w x h 的畫布裡。
 * 回傳 canvas（呼叫端可轉成 dataURL 放進 SVG）。
 */
export function renderFitted(strokes, {
  w, h, padding = 0.08, color = '#2f2a26', resolution = 3, fill = null,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * resolution));
  canvas.height = Math.max(1, Math.round(h * resolution));
  const ctx = canvas.getContext('2d');
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const box = bounds(strokes);
  if (!box) return canvas;

  const padX = canvas.width * padding;
  const padY = canvas.height * padding;
  const availW = canvas.width - padX * 2;
  const availH = canvas.height - padY * 2;
  const bw = Math.max(box.width, 0.02);
  const bh = Math.max(box.height, 0.02);
  // 等比縮放，但限制放大倍率，避免一個小點被放到整個框
  const natural = canvas.width;
  const scale = Math.min(availW / bw, availH / bh, natural * 2.4);
  const offsetX = (canvas.width - bw * scale) / 2 - box.minX * scale;
  const offsetY = (canvas.height - bh * scale) / 2 - box.minY * scale;

  paint(ctx, strokes, {
    scale,
    offsetX,
    offsetY,
    color,
    widthScale: 1,
    minWidth: Math.max(1.5, resolution),
  });
  return canvas;
}

export function toDataURL(strokes, options) {
  return renderFitted(strokes, options).toDataURL('image/png');
}

export function cloneStrokes(strokes) {
  return strokes.map((s) => ({ width: s.width, points: s.points.map((p) => ({ x: p.x, y: p.y })) }));
}
