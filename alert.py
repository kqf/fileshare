import asyncio
import json
import sys
from contextlib import suppress
from pathlib import Path

from aiohttp import web
from environs import Env
from telethon import TelegramClient


env = Env()
env.read_env()

TG_API_ID = env.int("TG_API_ID")
TG_API_HASH = env.str("TG_API_HASH")
TG_BOT_TOKEN = env.str("TG_BOT_TOKEN")
TG_CHAT_ID = env.str("TG_CHAT_ID")


tg = TelegramClient(
    "alerter",
    TG_API_ID,
    TG_API_HASH,
).start(bot_token=TG_BOT_TOKEN)


async def notify(text: str, image: Path | None = None) -> None:
    if image:
        await tg.send_file(TG_CHAT_ID, image, caption=text)
    else:
        await tg.send_message(TG_CHAT_ID, text)


client_context: dict[str, dict] = {}


async def handle_context(request: web.Request) -> web.Response:
    with suppress(Exception):
        payload = await request.json()
        client_context[request.remote] = payload

        msg = (
            "📥 Context received\n"
            f"IP: {request.remote}\n"
            f"Screen: {payload.get('screen')}\n"
            f"Viewport: {payload.get('viewport')}\n"
            f"TZ: {payload.get('timezone')}\n"
            f"Lang: {payload.get('language')}"
        )

        print(msg)
        await notify(msg)

    return web.Response(status=204)


async def handle_frame(request: web.Request) -> web.Response:
    reader = await request.multipart()
    field = await reader.next()

    if field is None or field.name != "image":
        return web.Response(status=400, text="no image")

    path = Path("tmp.jpg")
    with open(path, "wb") as f:
        while chunk := await field.read_chunk():
            f.write(chunk)

    msg = "📸 Frame received"
    print(msg)
    await notify(msg, image=path)

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
            await handle_log(json.loads(line))


async def handle_log(log: dict) -> None:
    ip = log.get("ip")
    ctx = client_context.pop(ip, None)

    msg = (
        "🌐 HTTP request\n"
        f"{log.get('time')} {ip}\n"
        f"{log.get('method')} {log.get('uri')}\n"
        f"Status: {log.get('status')}"
    )

    if ctx:
        msg += (
            "\n\nContext:\n"
            f"Screen: {ctx.get('screen')}\n"
            f"Viewport: {ctx.get('viewport')}\n"
            f"TZ: {ctx.get('timezone')}\n"
            f"Lang: {ctx.get('language')}"
        )

    print(msg)
    await notify(msg)
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
