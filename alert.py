import asyncio
import json
import sys
from aiohttp import web

client_context = {}


async def handle_context(request: web.Request):
    try:
        payload = await request.json()
        ip = request.remote
        client_context[ip] = payload
        print("📥 context received from", ip)
    except Exception as e:
        print("❌ bad payload:", e)

    return web.Response(status=204)


async def handle_frame(request: web.Request):
    reader = await request.multipart()

    field = await reader.next()
    if not field or field.name != "image":
        return web.Response(status=400, text="no image")

    path = "tmp.jpg"
    with open(path, "wb") as f:
        while chunk := await field.read_chunk():
            f.write(chunk)

    print("📸 frame received:", path)
    return web.Response(status=204)


async def read_stdin():
    loop = asyncio.get_running_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        line = await reader.readline()
        if not line:
            await asyncio.sleep(0.05)
            continue

        line = line.decode().strip()
        if not line:
            continue

        try:
            log = json.loads(line)
        except Exception:
            print("❌ invalid log:", line)
            continue

        ip = log.get("ip")
        ctx = client_context.pop(ip, None)

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


async def main():
    print("starting the alerter")
    print("🟢 waiting for nginx logs...\n")

    app = web.Application()
    app.router.add_post("/_context", handle_context)
    app.router.add_post("/_frame", handle_frame)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", 3001)

    print("🟢 listening on 127.0.0.1:3001\n")
    await site.start()

    # run stdin reader forever
    await read_stdin()


if __name__ == "__main__":
    asyncio.run(main())
