import json
import sys
import time
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

client_context = {}


class ContextHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/_context":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            payload = json.loads(body)
            ip = self.client_address[0]

            client_context[ip] = payload

            print("📥 context received from", ip)
        except Exception as e:
            print("❌ bad payload:", e)

        self.send_response(204)
        self.end_headers()

    def log_message(self, *args):
        pass


def start_server():
    server = HTTPServer(("127.0.0.1", 3001), ContextHandler)
    print("🟢 listening on 127.0.0.1:3001\n")
    server.serve_forever()


def main():
    print("🟢 waiting for nginx logs...\n")
    threading.Thread(target=start_server, daemon=True).start()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            log = json.loads(line)
        except Exception:
            print("❌ invalid log:", line)
            continue

        ip = log.get("ip")
        ctx = client_context.get(ip)

        print(
            f"{log.get('time')} {ip} "
            f"{log.get('method')} {log.get('uri')} "
            f"{log.get('status')}"
        )

        if ctx:
            print(
                f"  screen:   {ctx.get('screen')}\n"
                f"  viewport: {ctx.get('viewport')}\n"
                f"  tz:       {ctx.get('timezone')}\n"
                f"  lang:     {ctx.get('language')}"
            )

        print()


if __name__ == "__main__":
    main()
