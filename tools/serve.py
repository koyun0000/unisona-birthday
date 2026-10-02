#!/usr/bin/env python3
"""
本機預覽伺服器，刻意模擬 GitHub Pages 的 repository 子路徑。

GitHub Pages 的網址是 https://<帳號>.github.io/<repo>/ ，
如果程式裡有任何以 "/" 開頭的絕對路徑，在本機用一般的
`python -m http.server` 看起來都正常，上傳之後才會 404。

這支伺服器把網站掛在 /<repo>/ 底下，而且把子路徑之外的請求一律回 404，
所以上傳之前就能在 127.0.0.1 把這類問題抓出來。

用法：
    python tools/serve.py                 # http://127.0.0.1:8080/unisona-birthday/
    python tools/serve.py --port 9000
    python tools/serve.py --base my-repo  # 換成實際的 repository 名稱
    python tools/serve.py --root          # 不模擬子路徑，直接掛在根目錄
"""
import argparse
import functools
import http.server
import os
import socketserver
import sys
import threading
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)

EXTRA_TYPES = {
    '.mjs': 'text/javascript',
    '.js': 'text/javascript',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
}


class Handler(http.server.SimpleHTTPRequestHandler):
    prefix = '/'
    missed = []

    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if self.prefix != '/':
            if clean == self.prefix.rstrip('/'):
                clean = '/'
            elif clean.startswith(self.prefix):
                clean = clean[len(self.prefix) - 1:]
            else:
                # 子路徑之外的請求：回 404，讓絕對路徑的問題立刻現形
                Handler.missed.append(clean)
                return os.path.join(SITE, '__not_in_subpath__')
        return super().translate_path(clean)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext in EXTRA_TYPES:
            return EXTRA_TYPES[ext]
        return super().guess_type(path)

    def end_headers(self):
        # 開發時不要快取，改完重新整理就看得到
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        msg = fmt % args
        mark = '  404 <- 不在子路徑內，上傳後會壞' if ' 404 ' in msg else ''
        sys.stderr.write(f'{msg}{mark}\n')


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 128


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8080)
    ap.add_argument('--base', default=os.path.basename(SITE),
                    help='模擬的 repository 名稱（預設為本資料夾名稱）')
    ap.add_argument('--root', action='store_true', help='不模擬子路徑')
    ap.add_argument('--no-open', action='store_true', help='不要自動開瀏覽器')
    args = ap.parse_args()

    Handler.prefix = '/' if args.root else f'/{args.base.strip("/")}/'
    url = f'http://127.0.0.1:{args.port}{Handler.prefix}'

    os.chdir(SITE)
    with Server(('127.0.0.1', args.port), functools.partial(Handler, directory=SITE)) as httpd:
        print(f'網站根目錄：{SITE}')
        print(f'預覽網址　：{url}')
        if not args.root:
            print('（已模擬 GitHub Pages 子路徑；任何 404 都代表上傳後會壞掉）')
        print('按 Ctrl+C 結束。\n')
        if not args.no_open:
            threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n已停止。')
            if Handler.missed:
                print('以下請求落在子路徑之外，請改成相對路徑：')
                for m in sorted(set(Handler.missed)):
                    print('  ' + m)
                sys.exit(1)


if __name__ == '__main__':
    main()
