import asyncio
import json
import sys
from contextlib import suppress
from aiohttp import web

client_context: dict[str, dict] = {}


async def handle_context(request: web.Request) -> web.Response:
    with suppress(Exception):
        client_context[request.remote] = await request.json()
        print("📥 context received from", request.remote)
    return web.Response(status=204)


async def handle_frame(request: web.Request) -> web.Response:
    reader = await request.multipart()
    field = await reader.next()

    if field is None or field.name != "image":
        return web.Response(status=400, text="no image")

    with open("tmp.jpg", "wb") as f:
        while chunk := await field.read_chunk():
            f.write(chunk)

    print("📸 frame received: tmp.jpg")
    return web.Response(status=204)


async def read_stdin() -> None:
    loop = asyncio.get_running_loop()
    reader = asyncio.StreamReader()
    await loop.connect_read_pipe(
        lambda: asyncio.StreamReaderProtocol(reader),
        sys.stdin,
    )

    async for raw in reader:
        line = raw.decode().strip()
        if not line:
            continue

        with suppress(json.JSONDecodeError):
            log = json.loads(line)
            await handle_log(log)


async def handle_log(log: dict) -> None:
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


async def main() -> None:
    print("starting the alerter")
    print("🟢 waiting for nginx logs...\n")

    app = web.Application()
    app.router.add_post("/_context", handle_context)
    app.router.add_post("/_frame", handle_frame)

    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "127.0.0.1", 3001).start()
    print("🟢 listening on 127.0.0.1:3001\n")
    await read_stdin()


if __name__ == "__main__":
    asyncio.run(main())
