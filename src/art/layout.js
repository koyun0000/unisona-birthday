/**
 * 手繪圖片的版面規格。
 *
 * 這些數字同時給三個地方用：
 *   1. 遊戲把圖片貼進場景時的座標
 *   2. tools/make-templates.py 產生的繪圖範本
 *   3. ASSETS.md 裡寫給繪者的尺寸
 *
 * 改這裡就等於同時改掉三者，不會對不起來。
 */

/** 1 個 SVG 單位 = 3 px，所以範本是遊戲尺寸的 3 倍，縮小後仍然清楚 */
export const PX_PER_UNIT = 3;

/* ---------------- 團員 ---------------- */
/**
 * 小人的局部座標：腳底在 (0, 0)，身體往負 y 方向長。
 * 圖片框左上角在 (-80, -250)，寬 160、高 280 個單位。
 * 換算成範本就是 480 × 840 px，中心線在 x = 240，腳底線在 y = 750。
 */
export const PERSON_BOX = { x: -80, y: -250, w: 160, h: 280 };

/** 牌子（結尾舉起來的那張）。字母仍然是 SVG 文字，不會印在圖片裡 */
export const SIGN_BOX = { x: -31, y: -252, w: 62, h: 50 };

/** 胸前徽章、頭上名牌、工作證的預設位置，可以每個角色各自覆蓋 */
export const DEFAULT_ANCHORS = {
  emblem: { x: 0, y: -103, r: 16 },
  chip: { x: 0, y: -185 },
  card: { x: -30, y: -79, rot: -8 },
  rest: { x: 34, y: -160 },
};

/* ---------------- 指揮 ---------------- */
/** 指揮的身體：右手不要畫在這張裡（右手要單獨旋轉） */
export const CONDUCTOR_BOX = { x: -60, y: -175, w: 120, h: 195 };

/** 指揮的右手＋指揮棒。pivot 是肩膀，整張圖會繞著它轉 */
export const CONDUCTOR_ARM_BOX = { x: -20, y: -170, w: 120, h: 110 };
export const CONDUCTOR_ARM_PIVOT = { x: 13, y: -108 };

/* ---------------- 徽章 ---------------- */
/** 七個圖案徽章，畫在正方形裡，置中 */
export const SYMBOL_SIZE = 21;

/* ---------------- 場景 ---------------- */
export const STAGE_VIEW = { x: 0, y: 0, w: 1000, h: 700 };
export const DOOR_VIEW = { x: 0, y: 0, w: 1000, h: 380 };
export const DOOR_FRAME = { x: 598, y: 70, w: 212, h: 250 };
export const DOOR_LEAF_BOX = { x: 602, y: 74, w: 204, h: 246 };
export const SCANNER_BOX = { x: 530, y: 142, w: 50, h: 82 };

/** 範本的像素尺寸 */
export function boxToPixels(box) {
  return { w: Math.round(box.w * PX_PER_UNIT), h: Math.round(box.h * PX_PER_UNIT) };
}
