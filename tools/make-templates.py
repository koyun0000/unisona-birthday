#!/usr/bin/env python3
"""
產生手繪用的範本（SVG）。

範本上有中心線、腳底線、頭部範圍、胸前徽章位置、頭上名牌位置，
照著畫就能跟遊戲裡的疊加物件對齊。

用法：
    python tools/make-templates.py
    python tools/make-templates.py --out templates

輸出的是 SVG，可以直接丟進 Procreate / Clip Studio / Illustrator 當底圖，
也可以用瀏覽器開起來另存成 PNG。
尺寸與 src/art/layout.js 同步，改那邊這裡就會跟著改。
"""
import argparse
import os
import re
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
LAYOUT = os.path.join(SITE, 'src', 'art', 'layout.js')

GUIDE = '#c9742c'
FAINT = 'rgba(47,42,38,0.28)'


def read_layout():
    """從 layout.js 把數字讀出來，避免兩邊各寫一份對不起來。"""
    src = open(LAYOUT, encoding='utf-8').read()
    out = {}
    for name in ('PERSON_BOX', 'SIGN_BOX', 'CONDUCTOR_BOX', 'CONDUCTOR_ARM_BOX',
                 'CONDUCTOR_ARM_PIVOT', 'STAGE_VIEW', 'DOOR_VIEW', 'DOOR_LEAF_BOX',
                 'SCANNER_BOX'):
        m = re.search(rf'{name}\s*=\s*\{{(.*?)\}}', src, re.S)
        if m:
            out[name] = {k: float(v) for k, v in re.findall(r'(\w+)\s*:\s*(-?[\d.]+)', m.group(1))}
    m = re.search(r'PX_PER_UNIT\s*=\s*(\d+)', src)
    out['PX'] = int(m.group(1)) if m else 3
    m = re.search(r'SYMBOL_SIZE\s*=\s*(\d+)', src)
    out['SYMBOL_SIZE'] = int(m.group(1)) if m else 21
    m = re.search(r'DEFAULT_ANCHORS\s*=\s*\{(.*?)\n\};', src, re.S)
    body = m.group(1) if m else ''
    anchors = {}
    for key in ('emblem', 'chip', 'card', 'rest'):
        mm = re.search(rf'{key}:\s*\{{(.*?)\}}', body)
        if mm:
            anchors[key] = {k: float(v) for k, v in re.findall(r'(\w+)\s*:\s*(-?[\d.]+)', mm.group(1))}
    out['ANCHORS'] = anchors
    return out


def svg_open(w, h, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}">\n'
            f'  <title>{title}</title>\n'
            f'  <rect width="{w}" height="{h}" fill="#ffffff"/>\n')


def label(x, y, text, size=20, anchor='start', color=GUIDE):
    return (f'  <text x="{x:.0f}" y="{y:.0f}" font-family="sans-serif" font-size="{size}" '
            f'fill="{color}" text-anchor="{anchor}">{text}</text>\n')


def person_template(L, note, show_sign=False):
    box, px = L['PERSON_BOX'], L['PX']
    w, h = int(box['w'] * px), int(box['h'] * px)
    # 局部座標 (ux, uy) -> 圖片座標
    def X(ux): return (ux - box['x']) * px
    def Y(uy): return (uy - box['y']) * px

    a = L['ANCHORS']
    out = svg_open(w, h, f'UNISONA 團員範本（{note}）')
    out += f'  <rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" fill="none" stroke="{FAINT}" stroke-width="2"/>\n'
    # 中心線
    out += f'  <line x1="{X(0):.0f}" y1="0" x2="{X(0):.0f}" y2="{h}" stroke="{GUIDE}" stroke-width="2" stroke-dasharray="8 8" opacity="0.6"/>\n'
    # 腳底線
    out += f'  <line x1="0" y1="{Y(0):.0f}" x2="{w}" y2="{Y(0):.0f}" stroke="{GUIDE}" stroke-width="3"/>\n'
    out += label(12, Y(0) - 12, '腳底線　腳要踩在這條線上', 22)
    # 頭頂建議線
    out += f'  <line x1="0" y1="{Y(-168):.0f}" x2="{w}" y2="{Y(-168):.0f}" stroke="{FAINT}" stroke-width="2" stroke-dasharray="6 6"/>\n'
    out += label(12, Y(-168) - 10, '頭頂參考線（可以超過一點）', 18, color=FAINT)
    # 胸前徽章
    em = a['emblem']
    out += (f'  <circle cx="{X(em["x"]):.0f}" cy="{Y(em["y"]):.0f}" r="{em["r"]*px:.0f}" '
            f'fill="none" stroke="{GUIDE}" stroke-width="3" stroke-dasharray="6 6"/>\n')
    out += label(X(em['x']) + em['r'] * px + 10, Y(em['y']) + 6, '胸前徽章（程式會蓋上去，這裡留白）', 18)
    # 頭上名牌
    ch = a['chip']
    out += (f'  <rect x="{X(ch["x"]-21):.0f}" y="{Y(ch["y"]-18):.0f}" width="{42*px:.0f}" height="{32*px:.0f}" '
            f'rx="{10*px:.0f}" fill="none" stroke="{GUIDE}" stroke-width="3" stroke-dasharray="6 6"/>\n')
    out += label(X(ch['x'] + 24), Y(ch['y']), '頭上名牌（程式會蓋上去）', 18)
    # 工作證（只有主角）
    cd = a['card']
    out += (f'  <rect x="{X(cd["x"]-18):.0f}" y="{Y(cd["y"]-14):.0f}" width="{36*px:.0f}" height="{28*px:.0f}" '
            f'fill="none" stroke="{FAINT}" stroke-width="3" stroke-dasharray="4 6"/>\n')
    out += label(12, Y(cd['y']) + 60, '主角的工作證會掛在這裡（玩家畫的）', 16, color=FAINT)
    if show_sign:
        sg = L['SIGN_BOX']
        out += (f'  <rect x="{X(sg["x"]):.0f}" y="{Y(sg["y"]):.0f}" width="{sg["w"]*px:.0f}" '
                f'height="{sg["h"]*px:.0f}" fill="none" stroke="{GUIDE}" stroke-width="3" '
                f'stroke-dasharray="10 6"/>\n')
        out += label(X(sg['x'] + sg['w']) + 10, Y(sg['y'] + sg['h'] / 2), 'UNISONA 牌子會出現在這裡', 17)
        out += label(X(sg['x'] + sg['w']) + 10, Y(sg['y'] + sg['h'] / 2) + 24,
                     '手請畫成托住這個框的下緣', 15, color=FAINT)
    out += label(12, 34, f'{note}', 30)
    out += f'  <text x="{w-12}" y="{h-16}" font-family="sans-serif" font-size="16" fill="{FAINT}" text-anchor="end">{w} x {h} px，存成去背 PNG</text>\n'
    out += '</svg>\n'
    return out


def conductor_template(L):
    box, px = L['CONDUCTOR_BOX'], L['PX']
    w, h = int(box['w'] * px), int(box['h'] * px)
    def X(ux): return (ux - box['x']) * px
    def Y(uy): return (uy - box['y']) * px
    piv = L['CONDUCTOR_ARM_PIVOT']
    out = svg_open(w, h, 'UNISONA 指揮範本（身體）')
    out += f'  <rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" fill="none" stroke="{FAINT}" stroke-width="2"/>\n'
    out += f'  <line x1="{X(0):.0f}" y1="0" x2="{X(0):.0f}" y2="{h}" stroke="{GUIDE}" stroke-width="2" stroke-dasharray="8 8" opacity="0.6"/>\n'
    out += f'  <line x1="0" y1="{Y(0):.0f}" x2="{w}" y2="{Y(0):.0f}" stroke="{GUIDE}" stroke-width="3"/>\n'
    out += label(12, Y(0) - 12, '腳底線', 20)
    out += (f'  <circle cx="{X(piv["x"]):.0f}" cy="{Y(piv["y"]):.0f}" r="10" fill="none" '
            f'stroke="{GUIDE}" stroke-width="3"/>\n')
    out += (f'  <line x1="{X(piv["x"])-18:.0f}" y1="{Y(piv["y"]):.0f}" x2="{X(piv["x"])+18:.0f}" '
            f'y2="{Y(piv["y"]):.0f}" stroke="{GUIDE}" stroke-width="2"/>\n')
    out += (f'  <line x1="{X(piv["x"]):.0f}" y1="{Y(piv["y"])-18:.0f}" x2="{X(piv["x"]):.0f}" '
            f'y2="{Y(piv["y"])+18:.0f}" stroke="{GUIDE}" stroke-width="2"/>\n')
    out += label(X(piv['x']) + 24, Y(piv['y']) + 6, '右肩（右手不要畫在這張）', 17)
    out += label(12, 34, '指揮・身體', 28)
    out += f'  <text x="{w-12}" y="{h-16}" font-family="sans-serif" font-size="15" fill="{FAINT}" text-anchor="end">{w} x {h} px，去背 PNG</text>\n'
    out += '</svg>\n'
    return out


def conductor_arm_template(L):
    box, px = L['CONDUCTOR_ARM_BOX'], L['PX']
    w, h = int(box['w'] * px), int(box['h'] * px)
    def X(ux): return (ux - box['x']) * px
    def Y(uy): return (uy - box['y']) * px
    piv = L['CONDUCTOR_ARM_PIVOT']
    out = svg_open(w, h, 'UNISONA 指揮範本（右手與指揮棒）')
    out += f'  <rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" fill="none" stroke="{FAINT}" stroke-width="2"/>\n'
    out += (f'  <circle cx="{X(piv["x"]):.0f}" cy="{Y(piv["y"]):.0f}" r="12" fill="none" '
            f'stroke="{GUIDE}" stroke-width="3"/>\n')
    out += (f'  <line x1="{X(piv["x"])-22:.0f}" y1="{Y(piv["y"]):.0f}" x2="{X(piv["x"])+22:.0f}" '
            f'y2="{Y(piv["y"]):.0f}" stroke="{GUIDE}" stroke-width="2"/>\n')
    out += (f'  <line x1="{X(piv["x"]):.0f}" y1="{Y(piv["y"])-22:.0f}" x2="{X(piv["x"]):.0f}" '
            f'y2="{Y(piv["y"])+22:.0f}" stroke="{GUIDE}" stroke-width="2"/>\n')
    out += label(X(piv['x']) + 28, Y(piv['y']) - 10, '旋轉中心＝肩膀', 18)
    out += label(X(piv['x']) + 28, Y(piv['y']) + 14, '手從這裡往右上方伸出', 16, color=FAINT)
    out += label(12, 30, '指揮・右手＋指揮棒', 26)
    out += f'  <text x="{w-12}" y="{h-14}" font-family="sans-serif" font-size="15" fill="{FAINT}" text-anchor="end">{w} x {h} px，去背 PNG</text>\n'
    out += '</svg>\n'
    return out


def box_template(w, h, title, note):
    out = svg_open(w, h, title)
    out += f'  <rect x="0.5" y="0.5" width="{w-1}" height="{h-1}" fill="none" stroke="{FAINT}" stroke-width="2"/>\n'
    out += f'  <line x1="{w/2:.0f}" y1="0" x2="{w/2:.0f}" y2="{h}" stroke="{GUIDE}" stroke-width="2" stroke-dasharray="8 8" opacity="0.5"/>\n'
    out += f'  <line x1="0" y1="{h/2:.0f}" x2="{w}" y2="{h/2:.0f}" stroke="{GUIDE}" stroke-width="2" stroke-dasharray="8 8" opacity="0.5"/>\n'
    out += label(14, 34, title, 26)
    for i, line in enumerate(note.split('\n')):
        out += label(14, 64 + i * 26, line, 18, color=FAINT)
    out += f'  <text x="{w-12}" y="{h-14}" font-family="sans-serif" font-size="15" fill="{FAINT}" text-anchor="end">{w} x {h} px</text>\n'
    out += '</svg>\n'
    return out


def read_characters():
    """從 src/config/show.js 讀出七位團員，確保檔名清單跟設定檔一致。"""
    src = open(os.path.join(SITE, 'src', 'config', 'show.js'), encoding='utf-8').read()
    m = re.search(r'export const CHARACTERS = \[(.*?)\n\];', src, re.S)
    out = []
    for line in (m.group(1) if m else '').splitlines():
        mm = re.search(r"id:\s*'(\w+)'.*?label:\s*'(.+?)'.*?symbol:\s*'(\w+)'", line)
        if mm:
            out.append({'id': mm.group(1), 'label': mm.group(2), 'symbol': mm.group(3)})
    return out


def checklist(L, chars):
    px = L['PX']
    pbox = L['PERSON_BOX']
    pw, ph = int(pbox['w'] * px), int(pbox['h'] * px)
    cb, ab = L['CONDUCTOR_BOX'], L['CONDUCTOR_ARM_BOX']
    sg, leaf, sc = L['SIGN_BOX'], L['DOOR_LEAF_BOX'], L['SCANNER_BOX']
    stage, door = L['STAGE_VIEW'], L['DOOR_VIEW']

    rows = []
    for c in chars:
        for pose, note in (('normal', '平常站著、閉著嘴、手自然放下'),
                           ('sing', '張嘴在唱、手放下'),
                           ('sign', '雙手舉過頭 ＋ 張嘴在唱')):
            rows.append((f"{c['id']}-{pose}.png", f"{pw} x {ph}",
                         f"{c['label']}｜{note}", f'person-{pose}.svg'))
    for c in chars:
        rows.append((f"symbol-{c['symbol']}.png", '128 x 128',
                     f"{c['label']} 的徽章圖案，置中", 'symbol.svg'))
    rows += [
        ('conductor-body.png', f"{int(cb['w']*px)} x {int(cb['h']*px)}",
         '指揮的身體、頭、左手。右手不要畫', 'conductor-body.svg'),
        ('conductor-arm.png', f"{int(ab['w']*px)} x {int(ab['h']*px)}",
         '指揮的右手＋指揮棒', 'conductor-arm.svg'),
        ('conductor-body-smile.png', f"{int(cb['w']*px)} x {int(cb['h']*px)}",
         '指揮微笑版（可省略）', 'conductor-body.svg'),
        ('stage-backdrop.png', f"{int(stage['w']*2)} x {int(stage['h']*2)}",
         '舞台背牆與地板。交界放在高度 55% 附近', 'stage-backdrop.svg'),
        ('door-backdrop.png', f"{int(door['w']*2)} x {int(door['h']*2)}",
         '後台入口。門片與感應器不要畫', 'door-backdrop.svg'),
        ('door-leaf.png', f"{int(leaf['w']*px)} x {int(leaf['h']*px)}",
         '門片，會往右滑開', 'door-leaf.svg'),
        ('scanner.png', f"{int(sc['w']*px)} x {int(sc['h']*px)}",
         '感應器。指示燈不要畫', 'scanner.svg'),
        ('sign-board.png', f"{int(sg['w']*px)} x {int(sg['h']*px)}",
         '空白牌面。字母由程式畫上去', 'sign-board.svg'),
    ]

    body = ['# 手繪檔名清單', '',
            '**全部放在 `assets/art/` 這個資料夾裡**（沒有就自己建一個）。', '',
            '檔名要完全一樣，大小寫也要一樣。畫好一張就把 `src/config/show.js` 的 `ART` ',
            '對應那行取消註解，沒畫的保持註解，遊戲會自動用程式畫的 SVG 代替。', '',
            '去背 PNG。若你是向量作畫，存成 `.svg` 也可以，記得設定檔裡的副檔名要跟著改。', '',
            f'共 {len(rows)} 張（其中 `conductor-body-smile.png` 可省略）。', '',
            '| 檔名 | 尺寸 | 畫什麼 | 對應範本 |',
            '| --- | --- | --- | --- |']
    for name, size, what, tpl in rows:
        body.append(f'| `{name}` | {size} | {what} | `templates/{tpl}` |')
    body += ['', '## 三張全身圖的注意事項', '',
             '- 三張的**身體要畫在同一個位置**。遊戲是直接硬切換圖，位置不一致切換時會抖。',
             '  建議同一個檔案開三個圖層，只改嘴巴和手臂。',
             '- 腳要踩在範本的**腳底線**上，身體對齊**中心線**。',
             '- **胸前徽章的圓圈**和**頭上名牌的方框**請留白，程式會疊上去。',
             '- `sign` 那張要**張嘴**：結尾是一邊唱長音一邊舉牌。',
             '- `sign` 的手請托住範本上那個牌子虛線框的下緣。', '',
             '## 位置對不上的時候', '',
             '不用重畫，改 `src/config/show.js` 的 `ART.anchors` 微調即可，寫法見 `ASSETS.md`。', '']
    return '\n'.join(body)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(SITE, 'templates'))
    args = ap.parse_args()
    out = args.out
    os.makedirs(out, exist_ok=True)
    L = read_layout()
    px = L['PX']

    files = {}
    for name, note in (('normal', '平常｜閉著嘴、手自然放下'),
                       ('sing', '唱歌｜張嘴在唱、手放下'),
                       ('sign', '舉牌｜雙手舉過頭 ＋ 張嘴在唱')):
        files[f'person-{name}.svg'] = person_template(L, note, show_sign=(name == 'sign'))

    files['conductor-body.svg'] = conductor_template(L)
    files['conductor-arm.svg'] = conductor_arm_template(L)

    sym = 128
    files['symbol.svg'] = box_template(
        sym, sym, '徽章',
        '七個各一張，圖案置中。\n線條粗一點，縮到很小也要認得出來。\n去背 PNG。')

    sign = L['SIGN_BOX']
    files['sign-board.svg'] = box_template(
        int(sign['w'] * px), int(sign['h'] * px), '舉牌・空白牌面',
        '字母由程式用文字畫上去，\n所以這張請畫空白的牌子就好。')

    stage = L['STAGE_VIEW']
    files['stage-backdrop.svg'] = box_template(
        int(stage['w'] * 2), int(stage['h'] * 2), '舞台背景',
        '只畫背牆與地板。\n人、譜架、指揮都由程式疊上去。\n地板與牆的交界建議在高度的 55% 附近。')

    door = L['DOOR_VIEW']
    files['door-backdrop.svg'] = box_template(
        int(door['w'] * 2), int(door['h'] * 2), '後台入口背景',
        '門片與感應器不要畫進去（它們會動）。\n門框可以畫。')

    leaf = L['DOOR_LEAF_BOX']
    files['door-leaf.svg'] = box_template(
        int(leaf['w'] * px), int(leaf['h'] * px), '門片',
        '會往右滑開，所以請畫成單獨一片門。')

    sc = L['SCANNER_BOX']
    files['scanner.svg'] = box_template(
        int(sc['w'] * px), int(sc['h'] * px), '感應器',
        '指示燈不要畫，由程式疊上去變色。')

    chars = read_characters()
    files['檔名清單.md'] = checklist(L, chars)

    for name, body in files.items():
        path = os.path.join(out, name)
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(body)
        print(f'  {name}')
    print(f'\n共 {len(files)} 個檔案，輸出到 {out}')
    print(f'角色：{"、".join(c["label"] + "(" + c["id"] + ")" for c in chars)}')


if __name__ == '__main__':
    main()
