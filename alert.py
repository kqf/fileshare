from contextlib import suppress
from dataclasses import dataclass, field
from functools import partial
from pathlib import Path
import tempfile

import aiohttp_cors
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
        if image:
            with image.open("rb") as f:
                await self.bot.send_photo(
                    chat_id=self.chat_id,
                    photo=f,
                    caption=text,
                )
            return

        await self.bot.send_message(
            chat_id=self.chat_id,
            text=text,
            parse_mode="markdown",
        )


def build_logger() -> Logger:
    env = Env()
    env.read_env()
    return Logger(
        bot_token=env.str("TG_BOT_TOKEN"),
        chat_id=env.str("TG_CHAT_ID"),
    )


def sanitize(key):
    clean = key.replace("`", "")
    return f"`{clean}`"


async def handle_context(request: web.Request, logger: Logger) -> web.Response:
    with suppress(Exception):
        payload = await request.json()
        hitems = request.headers.items()
        headers = "".join(f"{k}: {sanitize(v)} \n" for k, v in hitems)

        msg = (
            "📥 Context received\n"
            f"IP: {request.remote}\n"
            f"Screen: {payload.get('screen')}\n"
            f"Viewport: {payload.get('viewport')}\n"
            f"TZ: {payload.get('timezone')}\n"
            f"Lang: {payload.get('language')}\n"
            "**Headers**\n" + headers
        )

        await logger.notify(msg)

    return web.Response(status=204)


async def handle_frame(request: web.Request, logger: Logger) -> web.Response:
    reader = await request.multipart()
    field = await reader.next()

    if not field or field.name != "image":
        return web.Response(status=400, text="no image")

    with tempfile.NamedTemporaryFile(suffix=".jpg") as f:
        while chunk := await field.read_chunk():
            f.write(chunk)

        f.flush()
        f.seek(0)

        msg = "📸 Frame received"
        print(msg)
        await logger.notify(msg, image=Path(f.name))

    return web.Response(status=204)


async def handle_version(request: web.Request) -> web.Response:
    return web.Response(text="Hello world")


async def handle_ngx_log(request: web.Request, logger: Logger) -> web.Response:
    headers = request.headers
    print("Here")
    msg = (
        f"🌐 HTTP request from `{headers.get('X-Real-IP')}`\n"
        f"`{headers.get('X-Request-Time')}`\n"
        f"`{headers.get('X-Request-Method')}` "
        f"`{headers.get('X-Request-URI')}`\n"
        f"UA: `{headers.get('X-User-Agent')}`"
    )

    await logger.notify(msg)
    return web.Response(status=204)


async def on_startup(app: web.Application, logger: Logger) -> None:
    await logger.notify("🟢 Starting the alerter")
    await logger.notify("🟢 Waiting for nginx logs...\n")
    await logger.notify("🟢 Listening on 127.0.0.1:3001\n")


def create_app() -> web.Application:
    app = web.Application()
    logger = build_logger()
    app.router.add_post("/_context", partial(handle_context, logger=logger))
    app.router.add_post("/_frame", partial(handle_frame, logger=logger))
    app.router.add_get("/version", handle_version)
    app.router.add_post("/_nginx_log", partial(handle_ngx_log, logger=logger))
    app.on_startup.append(partial(on_startup, logger=logger))

    cors = aiohttp_cors.setup(app)
    for route in list(app.router.routes()):
        cors.add(route)
    return app


def main():
    web.run_app(
        create_app(),
        host="0.0.0.0",
        port=3001,
    )


if __name__ == "__main__":
    main()
