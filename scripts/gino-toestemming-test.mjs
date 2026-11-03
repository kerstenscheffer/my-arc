// scripts/gino-toestemming-test.mjs
//
// Test van de permissiecode, zonder database en zonder iets te versturen:
//   node scripts/gino-toestemming-test.mjs
// Controleert de harde blokkades en de maskering, en praat daarna met de
// MCP-server zoals Claude Code dat doet (zonder PA: dan moet hij weigeren).

import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { HARDE_BLOKKADES, zelftest } from './gino-blokkade.mjs'
import { veiligZelftest } from './gino-veilig.mjs'

const fouten = [...zelftest(), ...veiligZelftest()]
console.log('Harde blokkades:')
for (const b of HARDE_BLOKKADES) console.log(`  → ${b}`)
for (const f of fouten) console.log(`FOUT ${f}`)

const map = path.dirname(new URL(import.meta.url).pathname)
// Poort 1: daar luistert niets, dus de server hoort te weigeren.
const p = spawn(process.execPath, [path.join(map, 'gino-toestemming-mcp.mjs')], {
  stdio: ['pipe', 'pipe', 'inherit'], env: { ...process.env, GINO_POORT: '1', GINO_TOKEN: 'test' },
})
const antwoorden = new Map()
let buf = ''
p.stdout.on('data', (d) => {
  buf += d
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1)
    antwoorden.get(m.id)?.(m)
  }
})
const roep = (id, method, params) => new Promise((klaar) => {
  antwoorden.set(id, klaar)
  p.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
})

const init = await roep(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } })
if (init.result?.protocolVersion !== '2025-06-18') fouten.push('initialize geeft de versie niet terug')
const lijst = await roep(2, 'tools/list', {})
if (lijst.result?.tools?.[0]?.name !== 'toestemming') fouten.push('tools/list mist de tool')
const call = await roep(3, 'tools/call', { name: 'toestemming', arguments: { tool_name: 'Bash', input: { command: 'npm run lint' } } })
const besluit = JSON.parse(call.result?.content?.[0]?.text || '{}')
if (besluit.behavior !== 'deny') fouten.push(`zonder PA moet hij weigeren, kreeg: ${JSON.stringify(besluit)}`)
p.stdin.end()

// Tweede ronde: met een nep-loket dat pas na 1,5 s antwoordt, net als de PA.
const loket = http.createServer((req, res) => {
  let body = ''
  req.on('data', d => { body += d })
  req.on('end', () => setTimeout(() => {
    const { input } = JSON.parse(body)
    if (req.headers['x-gino-token'] !== 'test2') { res.statusCode = 403; return res.end(JSON.stringify({ behavior: 'deny', message: 'sleutel' })) }
    res.end(JSON.stringify(input.command === 'ja' ? { behavior: 'allow', updatedInput: { command: 'NIET DIT' } } : { behavior: 'deny', message: 'Afgewezen' }))
  }, 1500))
})
await new Promise(k => loket.listen(0, '127.0.0.1', k))
const p2 = spawn(process.execPath, [path.join(map, 'gino-toestemming-mcp.mjs')], {
  stdio: ['pipe', 'pipe', 'inherit'], env: { ...process.env, GINO_POORT: String(loket.address().port), GINO_TOKEN: 'test2' },
})
const antw2 = new Map()
let buf2 = ''
p2.stdout.on('data', (d) => {
  buf2 += d
  let i
  while ((i = buf2.indexOf('\n')) >= 0) {
    const m = JSON.parse(buf2.slice(0, i)); buf2 = buf2.slice(i + 1)
    antw2.get(m.id)?.(m)
  }
})
const roep2 = (id, args) => new Promise((klaar) => {
  antw2.set(id, klaar)
  p2.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'toestemming', arguments: args } })}\n`)
})
const [ja, nee] = await Promise.all([
  roep2(10, { tool_name: 'Bash', input: { command: 'ja' } }),
  roep2(11, { tool_name: 'Bash', input: { command: 'nee' } }),
])
const jaUit = JSON.parse(ja.result.content[0].text)
const neeUit = JSON.parse(nee.result.content[0].text)
// Allow geeft altijd de originele invoer terug: het loket kan het commando niet wijzigen.
if (jaUit.behavior !== 'allow' || jaUit.updatedInput?.command !== 'ja') fouten.push(`allow klopt niet: ${JSON.stringify(jaUit)}`)
if (neeUit.behavior !== 'deny' || neeUit.message !== 'Afgewezen') fouten.push(`deny klopt niet: ${JSON.stringify(neeUit)}`)
p2.stdin.end()
loket.close()

console.log(fouten.length ? `\n${fouten.length} fout(en)` : '\nAlles goed.')
process.exit(fouten.length ? 1 : 0)
