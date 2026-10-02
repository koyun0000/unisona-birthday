export const SVG_NS = 'http://www.w3.org/2000/svg';

function applyAttrs(node, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'text') { node.textContent = String(value); continue; }
    if (key === 'html') { node.innerHTML = String(value); continue; }
    if (key === 'class') { node.setAttribute('class', value); continue; }
    if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) node.dataset[dk] = dv;
      continue;
    }
    if (key === 'style' && typeof value === 'object') {
      for (const [sk, sv] of Object.entries(value)) node.style.setProperty(sk, sv);
      continue;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
      continue;
    }
    node.setAttribute(key, String(value));
  }
}

function appendAll(node, children) {
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

/** 建立 HTML 元素 */
export function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  appendAll(node, children);
  return node;
}

/** 建立 SVG 元素 */
export function s(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  applyAttrs(node, attrs);
  appendAll(node, children);
  return node;
}

/** 螢幕座標轉成 SVG 使用者座標（縮放、旋轉後都正確） */
export function clientToSvg(svgEl, clientX, clientY) {
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const out = pt.matrixTransform(ctm.inverse());
  return { x: out.x, y: out.y };
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function button(label, attrs = {}) {
  return h('button', { type: 'button', ...attrs, text: label });
}
