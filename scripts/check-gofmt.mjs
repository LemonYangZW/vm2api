import { execFileSync } from 'node:child_process'

const files = execFileSync('gofmt', ['-l', 'worker', 'api-kernel'], {
  encoding: 'utf8',
}).trim()
if (!files) process.exit(0)
console.error(`gofmt needed:\n${files}`)
process.exit(1)
