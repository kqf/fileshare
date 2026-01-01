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

ttp.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/_context') {
    res.writeHead(404)
    return res.end()
  }

  let body = ''
  req.on('data', chunk => (body += chunk))
  req.on('end', () => {
    const ip =
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      'unknown'

    try {
      const payload = JSON.parse(body || '{}')
      clientContext.set(ip, {
        ...payload,
        timestamp: Date.now(),
      })

      console.log('📥 Client context received')
      console.log(`    IP:        ${ip}`)
      console.log(`    Screen:    ${payload.screen?.width}x${payload.screen?.height}`)
      console.log(`    Viewport:  ${payload.viewport?.width}x${payload.viewport?.height}`)
      console.log(`    Timezone:  ${payload.timezone}`)
      console.log(`    Language:  ${payload.language}\n`)
    } catch {
      console.log(`📥 Client context received (invalid JSON) from ${ip}`)
    }

    res.writeHead(204)
    res.end()
  })
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

  const statusIcon =
    status >= 500 ? '🔥' :
    status >= 400 ? '⚠️' :
    '✅'

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
