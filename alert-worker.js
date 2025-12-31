import readline from 'node:readline'
import process from 'node:process'

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
})

console.log('🟢 Log parser started. Waiting for Nginx logs...\n')

rl.on('line', (line) => {
  if (!line.trim()) return

  try {
    const log = JSON.parse(line)

    const {
      time,
      ip,
      method,
      uri,
      status,
      ua,
    } = log

    const statusIcon =
      status >= 500 ? '🔥' :
      status >= 400 ? '⚠️' :
      '✅'

    console.log(
      `${statusIcon}  ${time}\n` +
      `    IP:      ${ip}\n` +
      `    Method:  ${method}\n` +
      `    URI:     ${uri}\n` +
      `    Status:  ${status}\n` +
      `    UA:      ${ua}\n`
    )
  } catch (err) {
    console.error('❌ Failed to parse log line:')
    console.error(line)
    console.error(err.message)
  }
})
