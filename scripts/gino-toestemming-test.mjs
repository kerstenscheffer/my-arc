// scripts/gino-toestemming-test.mjs
//
// Test van de permissiecode, zonder database en zonder iets te versturen:
//   node scripts/gino-toestemming-test.mjs
// Controleert de harde blokkades en de maskering, en praat daarna met de
// MCP-server zoals Claude Code dat doet (zonder PA: dan moet hij weigeren).

import { spawn } from 'node:child_process'
import path from 'node:path'
import { HARDE_BLOKKADES, zelftest } from './gino-blokkade.mjs'

const fouten = zelftest()
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

console.log(fouten.length ? `\n${fouten.length} fout(en)` : '\nAlles goed.')
process.exit(fouten.length ? 1 : 0)
