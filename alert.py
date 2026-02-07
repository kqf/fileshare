import asyncio
import json
import sys
from contextlib import suppress
from dataclasses import dataclass, field
from functools import partial
from pathlib import Path

from aiohttp import web
from environs import Env
from telegram import Bot


@dataclass(slots=True)
class Logger:
    bot_token: str
    chat_id: str
    bot: Bot = field(init=False, repr=False)

    def __post_init__(self):
        self.bot = Bot(self.bot_token)

    async def notify(self, text: str, image: Path | None = None):
        print(text)
        print()

        if image:
            await self.bot.send_photo(
                chat_id=self.chat_id,
                photo=image.open("rb"),
                caption=text,
            )
            return

        await self.bot.send_message(
            chat_id=self.chat_id,
            text=text,
        )


def build_logger() -> Logger:
    env = Env()
    env.read_env()
    return Logger(
        bot_token=env.str("TG_BOT_TOKEN"),
        chat_id=env.str("TG_CHAT_ID"),
    )


client_context: dict[str, dict] = {}


async def handle_context(request: web.Request, logger: Logger) -> web.Response:
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

        await logger.notify(msg)

    return web.Response(status=204)


async def handle_frame(request: web.Request, logger: Logger) -> web.Response:
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
    await logger.notify(msg, image=path)

    return web.Response(status=204)


async def read_stdin(logger: Logger) -> None:
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
            await handle_log(json.loads(line), logger)


async def handle_log(log: dict, logger: Logger) -> None:
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
    await logger.notify(msg)


async def main() -> None:
    logger = build_logger()
    await logger.notify("Deployed the alerter")

    print("starting the alerter")
    print("🟢 waiting for nginx logs...\n")
    app = web.Application()
    app.router.add_post("/_context", partial(handle_context, logger=logger))
    app.router.add_post("/_frame", partial(handle_frame, logger=logger))

    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "127.0.0.1", 3001).start()

    print("🟢 listening on 127.0.0.1:3001\n")
    # await read_stdin(logger)


if __name__ == "__main__":
    asyncio.run(main())
