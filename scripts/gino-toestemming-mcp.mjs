// scripts/gino-toestemming-mcp.mjs
//
// Kleine MCP-server (stdio, zonder pakketten) voor --permission-prompt-tool van
// Claude Code. De PA start hem per Claude-proces mee. Claude Code roept de tool
// aan als iets niet op de allow-list staat; wij vragen het de PA via het lokale
// loket en wachten op het antwoord. Lukt dat niet: altijd weigeren.
//
// Bewust node:http en geen fetch: fetch breekt na 5 minuten wachten op antwoord
// af (headersTimeout) en Kersten krijgt 30 minuten.

import http from 'node:http'
import readline from 'node:readline'

const POORT = Number(process.env.GINO_POORT) || 47615
const TOKEN = process.env.GINO_TOKEN || ''
const MAX_MS = 40 * 60 * 1000

const schrijf = (bericht) => process.stdout.write(`${JSON.stringify(bericht)}\n`)
const weiger = (message) => ({ behavior: 'deny', message })

function vraagPa(tool_name, input) {
  return new Promise((klaar) => {
    const body = JSON.stringify({ tool_name, input })
    const req = http.request({
      host: '127.0.0.1', port: POORT, path: '/toestemming', method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'x-gino-token': TOKEN },
    }, (res) => {
      let tekst = ''
      res.setEncoding('utf8')
      res.on('data', d => { tekst += d })
      res.on('end', () => {
        try {
          const b = JSON.parse(tekst)
          if (b?.behavior === 'allow') return klaar({ behavior: 'allow', updatedInput: input })
          klaar(weiger(b?.message || 'Geweigerd.'))
        } catch { klaar(weiger('Geweigerd: geen geldig antwoord van de PA.')) }
      })
    })
    req.setTimeout(MAX_MS, () => req.destroy(new Error('te lang gewacht')))
    req.on('error', (e) => klaar(weiger(`Geweigerd: de PA is niet bereikbaar (${e.message}).`)))
    req.end(body)
  })
}

const TOOL = {
  name: 'toestemming',
  description: 'Interne permissie-afhandeling van de PA. Niet zelf aanroepen.',
  inputSchema: {
    type: 'object',
    properties: {
      tool_name: { type: 'string' },
      input: { type: 'object' },
      tool_use_id: { type: 'string' },
    },
    required: ['tool_name', 'input'],
  },
}

async function verwerk(m) {
  const { id, method, params } = m
  if (id === undefined || id === null) return // notificatie
  if (method === 'initialize') {
    return schrijf({ jsonrpc: '2.0', id, result: {
      protocolVersion: params?.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'gino-toestemming', version: '1.0.0' },
    } })
  }
  if (method === 'ping') return schrijf({ jsonrpc: '2.0', id, result: {} })
  if (method === 'tools/list') return schrijf({ jsonrpc: '2.0', id, result: { tools: [TOOL] } })
  if (method === 'tools/call') {
    if (params?.name !== TOOL.name) return schrijf({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Onbekende tool' } })
    const { tool_name, input } = params.arguments || {}
    const uit = await vraagPa(tool_name, input || {})
    return schrijf({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(uit) }] } })
  }
  schrijf({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Onbekende methode' } })
}

const regels = readline.createInterface({ input: process.stdin })
regels.on('line', (r) => {
  if (!r.trim()) return
  let m
  try { m = JSON.parse(r) } catch { return }
  verwerk(m).catch((e) => {
    if (m.id !== undefined && m.id !== null) schrijf({ jsonrpc: '2.0', id: m.id, result: { content: [{ type: 'text', text: JSON.stringify(weiger(`Geweigerd: ${e.message}`)) }] } })
  })
})
// Claude weg (gestopt, herstart): meteen weg, zo sluit de PA de vraag als verlopen.
regels.on('close', () => process.exit(0))
