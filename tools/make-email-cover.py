#!/usr/bin/env python3
"""
產生電子郵件用的封面：一個會晃、會掀開一條縫、有音符飄出來的禮物盒。

為什麼要這樣做：郵件軟體一律會刪掉 <script>，信裡跑不了任何互動，
所以信件只能放圖。GIF 是信裡唯一會動的東西。

輸出：
    assets/email-cover.gif   會動的封面（信件用）
    assets/email-cover.png   靜態第一格（Outlook 只顯示第一格，也可當分享預覽圖）

用法：
    python tools/make-email-cover.py
    python tools/make-email-cover.py --frames 48 --hint "點開看看"

需要 playwright 與 pillow：
    pip install playwright pillow
    python -m playwright install chromium
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
PAGE = os.path.join(HERE, 'email-cover', 'cover.html')
W, H = 600, 380


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(SITE, 'assets'))
    ap.add_argument('--frames', type=int, default=44, help='一個循環的格數')
    ap.add_argument('--ms', type=int, default=70, help='每格毫秒')
    ap.add_argument('--hint', default=None, help='蓋子打開後出現的提示字')
    ap.add_argument('--colors', type=int, default=64, help='GIF 調色盤顏色數，越少檔案越小')
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
        from PIL import Image
    except ImportError as exc:
        print(f'缺少套件：{exc}\n請先執行：pip install playwright pillow'
              f'\n然後：python -m playwright install chromium')
        return 1

    os.makedirs(args.out, exist_ok=True)
    frames = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_context(viewport={'width': W, 'height': H},
                                   device_scale_factor=2).new_page()
        page.goto('file:///' + PAGE.replace('\\', '/'), wait_until='load')
        if args.hint:
            page.evaluate('(t) => { document.getElementById("hint").textContent = t; }', args.hint)

        for i in range(args.frames):
            page.evaluate('(t) => window.setFrame(t)', i / args.frames)
            page.wait_for_timeout(16)
            shot = page.screenshot(type='png')
            frames.append(shot)

        # 靜態圖用「蓋子剛掀開一條縫」那一格：Outlook 只看得到它，
        # 所以不能是完全闔上的無聊畫面。
        page.evaluate('() => window.setFrame(0.66)')
        page.wait_for_timeout(30)
        still = page.screenshot(type='png')
        browser.close()

    import io
    imgs = [Image.open(io.BytesIO(b)).convert('RGB') for b in frames]
    small = [im.resize((W, H), Image.LANCZOS) for im in imgs]
    pal = [im.quantize(colors=args.colors, method=Image.MEDIANCUT) for im in small]

    gif_path = os.path.join(args.out, 'email-cover.gif')
    pal[0].save(gif_path, save_all=True, append_images=pal[1:],
                duration=args.ms, loop=0, optimize=True, disposal=2)

    png_path = os.path.join(args.out, 'email-cover.png')
    Image.open(io.BytesIO(still)).convert('RGB').save(png_path, optimize=True)

    print(f'  {gif_path}  {os.path.getsize(gif_path)/1024:.0f} KB  '
          f'（{args.frames} 格，每格 {args.ms}ms）')
    print(f'  {png_path}  {os.path.getsize(png_path)/1024:.0f} KB  （靜態，Outlook 與分享預覽用）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
