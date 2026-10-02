/**
 * 手繪圖片的來源。
 *
 * 規則只有一條：設定檔裡有填檔名就回傳路徑，沒填就回傳 null，
 * 呼叫端看到 null 就改用程式畫的 SVG。
 *
 * 所以可以一個角色、一個場景慢慢換，中途任何時候都是完整可玩的。
 */
import { DEFAULT_ANCHORS } from './layout.js';

export function createArtSource(config) {
  const base = config?.basePath ?? './assets/art/';
  const url = (file) => (file ? base + file : null);

  return {
    /** 一位團員的三張全身圖；完全沒填就回傳 null（整個角色用 SVG） */
    personPoses(id) {
      const entry = config?.persons?.[id];
      if (!entry || !entry.normal) return null;
      return {
        normal: url(entry.normal),
        sing: url(entry.sing) || url(entry.normal),
        sign: url(entry.sign) || url(entry.sing) || url(entry.normal),
      };
    },

    symbol(key) {
      return url(config?.symbols?.[key]);
    },

    conductor() {
      const c = config?.conductor;
      if (!c || !c.body) return null;
      return {
        body: url(c.body),
        bodySmile: url(c.bodySmile),
        arm: url(c.arm),
      };
    },

    scene(key) {
      return url(config?.scenes?.[key]);
    },

    signBoard() {
      return url(config?.sign?.board);
    },

    /** 手繪的身體比例不同時，可以逐一調整疊加物件的位置 */
    anchorsFor(id) {
      const override = config?.anchors?.[id] ?? {};
      return {
        emblem: { ...DEFAULT_ANCHORS.emblem, ...(override.emblem ?? {}) },
        chip: { ...DEFAULT_ANCHORS.chip, ...(override.chip ?? {}) },
        card: { ...DEFAULT_ANCHORS.card, ...(override.card ?? {}) },
        rest: { ...DEFAULT_ANCHORS.rest, ...(override.rest ?? {}) },
      };
    },

    /** 開發時用來確認目前有幾張圖被接上 */
    summary() {
      const persons = Object.keys(config?.persons ?? {}).length;
      const symbols = Object.keys(config?.symbols ?? {}).length;
      const scenes = Object.keys(config?.scenes ?? {}).length;
      return {
        persons,
        symbols,
        scenes,
        conductor: Boolean(config?.conductor?.body),
        sign: Boolean(config?.sign?.board),
      };
    },
  };
}
