import http from 'node:http'
import readline from 'node:readline'
import process from 'node:process'

const CONTEXT_TTL_MS = 5 * 60 * 1000 // 5 minutes
const clientContext = new Map()

function cleanupContext() {
    const now = Date.now()
    for (const [ip, ctx] of clientContext.entries()) {
        if (now - ctx.timestamp > CONTEXT_TTL_MS) {
            clientContext.delete(ip)
        }
    }
}
setInterval(cleanupContext, 60_000)

http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/_context') {
        let body = ''

        req.on('data', chunk => {
            body += chunk.toString()
        })

        req.on('end', () => {
            try {
                const payload = JSON.parse(body)
                const ip = req.socket.remoteAddress

                clientContext.set(ip, {
                    ...payload,
                    timestamp: Date.now(),
                })

                console.log('📥 Client context received')
                console.log('IP:', req.socket.remoteAddress)
                console.log('Screen:', payload.screen)
                console.log('Viewport:', payload.viewport)
                console.log('Timezone:', payload.timezone)
                console.log('Language:', payload.language)
            } catch (err) {
                console.error('❌ Failed to parse client context', err)
            }

            res.writeHead(204)
            res.end()
        })

        return
    }

    res.writeHead(404)
    res.end()
}).listen(3001, () => {
    console.log('🟢 Context server listening on 127.0.0.1:3001\n')
})

const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
})

console.log('🟢 Waiting for Nginx logs...\n')

rl.on('line', (line) => {
    if (!line.trim()) return

    let log
    try {
        log = JSON.parse(line)
    } catch {
        console.error('❌ Invalid JSON log line:')
        console.error(line)
        return
    }

    const {
        time,
        ip,
        method,
        uri,
        status,
        ua,
    } = log

    const ctx = clientContext.get(ip)

    const statusIcon = '✅'

    console.log(
        `${statusIcon}  ${time}\n` +
        `    IP:       ${ip}\n` +
        `    Method:   ${method}\n` +
        `    URI:      ${uri}\n` +
        `    Status:   ${status}\n` +
        `    UA:       ${ua}`
    )

    if (ctx) {
        console.log(
            `    Context:\n` +
            `      Screen:   ${ctx.screen?.width}x${ctx.screen?.height}\n` +
            `      Viewport: ${ctx.viewport?.width}x${ctx.viewport?.height}\n` +
            `      TZ:       ${ctx.timezone}\n` +
            `      Lang:     ${ctx.language}`
        )
    }

    console.log('')
})
