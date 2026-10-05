#!/usr/bin/env python3
"""
把 logo 整理成遊戲可以用的去背 PNG。

做三件事：
  1. 去背：背景是單色時，依照每個像素離背景色多遠算出透明度，
     邊緣的半透明像素會還原成原本的顏色，不會留下一圈灰邊。
  2. 裁掉四周多餘的空白。
  3. 縮到指定高度（預設 160px，夠 HUD 在高解析螢幕上用）。

用法：
    python tools/prepare-logo.py 原始檔.png
    python tools/prepare-logo.py 原始檔.png --height 240
    python tools/prepare-logo.py 原始檔.png --keep-bg      # 已經去背過就加這個
    python tools/prepare-logo.py 原始檔.png --tolerance 40 # 去背不乾淨時調大

輸出：assets/logo.png
SVG 原檔不需要跑這支，直接放進 assets/ 即可。
"""
import argparse
import os
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('--out', default=os.path.join(SITE, 'assets', 'logo.png'))
    ap.add_argument('--height', type=int, default=160)
    ap.add_argument('--tolerance', type=int, default=46,
                    help='離背景色多遠算是完全不透明。邊緣被吃掉就調小')
    ap.add_argument('--floor', type=int, default=14,
                    help='雜訊門檻：差距小於這個值一律視為背景。'
                         '掃描或有顆粒的圖要調大，背景才不會留下一層灰霧')
    ap.add_argument('--keep-bg', action='store_true', help='來源已經是透明背景')
    ap.add_argument('--margin', type=int, default=2)
    args = ap.parse_args()

    try:
        from PIL import Image
    except ImportError:
        print('缺少 pillow，請先執行：pip install pillow')
        return 1

    if not os.path.exists(args.source):
        print(f'找不到檔案：{args.source}')
        return 1

    im = Image.open(args.source).convert('RGBA')
    w, h = im.size
    print(f'來源：{args.source}  {w} x {h}')

    if not args.keep_bg:
        px = im.load()
        # 以四個角落的平均值當背景色
        corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
        bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
        print(f'偵測到的背景色：RGB{bg}')

        floor = max(0, args.floor)
        tol = max(floor + 1, args.tolerance)
        span = tol - floor
        kept = 0
        out = Image.new('RGBA', (w, h))
        op = out.load()
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0:
                    op[x, y] = (0, 0, 0, 0)
                    continue
                d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
                # 低於門檻的一律當成背景，否則掃描顆粒會變成一層半透明灰霧
                if d <= floor:
                    op[x, y] = (0, 0, 0, 0)
                    continue
                kept += 1
                alpha = min(255, int((d - floor) * 255 / span))
                if alpha >= 250:
                    op[x, y] = (r, g, b, 255)
                else:
                    # 邊緣像素是 logo 與背景混出來的，把背景的成分扣掉
                    f = alpha / 255
                    un = tuple(
                        max(0, min(255, int((c - bgc * (1 - f)) / f)))
                        for c, bgc in ((r, bg[0]), (g, bg[1]), (b, bg[2]))
                    )
                    op[x, y] = (*un, alpha)
        pct = kept * 100 / (w * h)
        print(f'保留的像素：{pct:.1f}%')
        if pct > 70:
            print('  提示：保留比例偏高，背景可能沒去乾淨，試著加大 --floor')
        elif pct < 1:
            print('  提示：保留比例偏低，logo 可能被吃掉了，試著調小 --floor')
        im = out

    box = im.getbbox()
    if box:
        m = args.margin
        box = (max(0, box[0] - m), max(0, box[1] - m),
               min(im.width, box[2] + m), min(im.height, box[3] + m))
        im = im.crop(box)
        print(f'裁切後：{im.width} x {im.height}')

    if im.height != args.height:
        ratio = args.height / im.height
        im = im.resize((max(1, round(im.width * ratio)), args.height), Image.LANCZOS)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    im.save(args.out, optimize=True)
    print(f'\n輸出：{args.out}  {im.width} x {im.height}  '
          f'{os.path.getsize(args.out) / 1024:.0f} KB')
    print('\n接下來把 src/config/show.js 的 ART.logo 取消註解：')
    print("    logo: { file: 'logo.png', alt: 'UNISONA' },")
    return 0


if __name__ == '__main__':
    sys.exit(main())
