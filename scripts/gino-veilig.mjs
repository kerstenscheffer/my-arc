// scripts/gino-veilig.mjs (3 nov 2026)
//
// Minder klikken zonder de echte vragen kwijt te raken. In één dag vroeg Gino 65 keer
// toestemming, Kersten keurde alles goed: vooral lezen en tellen. Dit draait NA
// hardeBlokkade; wat daar geblokkeerd is, komt hier nooit.
//
//   veiligeBash(cmd)  alleen lezen, of schrijven in ~/Gino of /tmp → geen kaart
//   familieVan(cmd)   python, node -e, yt-dlp, curl, ffmpeg: één kaart per opdracht
//
//   vrijeBash(cmd, lees) (5 nov) ook scripts, downloads en samengestelde opdrachten, zolang
//                     ze niets versturen of schrijven; scripts worden eerst nagelezen
//   leesTool(tool)    (5 nov) lees-tools van vaste koppelingen, zonder kaart
//
// Twijfel = null = gewoon een kaart. Niet herkend is nooit veilig.
// Puur: geen database, geen netwerk. Testen: node scripts/gino-toestemming-test.mjs
// Deze code-opdrachten mogen dit bestand niet aanpassen (deny-regel in de PA).

import path from 'node:path'
import { hardeBlokkade } from './gino-blokkade.mjs'

const ALTIJD_LEZEN = new Set([
  'ls', 'cat', 'head', 'tail', 'wc', 'grep', 'egrep', 'rg', 'cut', 'tr', 'uniq', 'pwd', 'which', 'stat', 'du', 'df',
  'echo', 'printf', 'true', 'false', 'test', '[', ':', 'file', 'basename', 'dirname', 'ffprobe', 'sw_vers', 'uname',
  'ps', 'pgrep', 'mdfind', 'jq', 'pdftotext', 'pdfinfo', 'nl', 'seq', 'sleep', 'cd', 'date', 'sort', 'find', 'sed', 'awk',
])
const GIT_LEZEN = new Set(['status', 'log', 'diff', 'show', 'rev-parse', 'check-ignore', 'ls-files', 'blame'])
// onthoud: Gino's eigen geheugen, raakt niets van klanten.
const PA_DB_LEZEN = new Set(['lees', 'schema', 'projecten', 'project', 'experimenten', 'herinneringen', 'geheugen', 'tijd', 'onthoud'])
const LUS_WOORDEN = new Set(['do', 'done', 'then', 'else', 'elif', 'fi', 'if', 'while', 'until'])
const THUIS = '(?:~|\\$HOME|\\$\\{HOME\\}|/Users/[\\w.-]+)'
const VRIJE_MAP = new RegExp(`^["']?(?:/dev/null|/tmp/|/private/tmp/|${THUIS}/Gino/)`)
const VEILIG_WOORD = /^[\w@%+=:,./~^-]+$/

// Schrijven, verwijderen of versturen in een script: dan altijd een kaart.
const GEVAARLIJK = /\b(insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s|alter\s|truncate\s|create\s+(table|function|policy))\b|\.(insert|update|upsert|delete|rpc|remove)\(|\b(rmtree|rmSync|unlinkSync|unlink|os\.remove|os\.system|subprocess|child_process|execSync|spawn)\b|\b(POST|PATCH|PUT|DELETE)\b|--data\b|--form\b|--upload-file\b|\s-[dFT]\s|--post/

// Quotes en heredocs eruit, zodat scheiders en > in tekst niet tellen. Geeft null bij twijfel.
function ontleed(cmd) {
  const hulp = []
  let s = String(cmd || '')
  s = s.replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\2(?=\n|$)/g, (_, __, ___, rest) => { hulp.push('heredoc'); return `<<HEREDOC${rest}` })
  if (/<<-?\s*['"]?\w+/.test(s.replace(/<<HEREDOC/g, ''))) return null
  // Quotes: enkel is letterlijk; dubbel mag geen substitutie bevatten (die checken we los).
  const subst = []
  let uit = '', i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === '\\') { uit += '_'; i += 2; continue }
    if (c === "'") {
      const e = s.indexOf("'", i + 1)
      if (e < 0) return null
      uit += `Q${hulp.push(s.slice(i + 1, e)) - 1}Q`
      i = e + 1
      continue
    }
    if (c === '"') {
      let e = i + 1
      while (e < s.length && s[e] !== '"') e += s[e] === '\\' ? 2 : 1
      if (e >= s.length) return null
      const binnen = s.slice(i + 1, e)
      if (/`/.test(binnen)) return null
      for (const m of binnen.matchAll(/\$\(([^()]*)\)/g)) subst.push(m[1])
      if (/\$\((?![^()]*\))/.test(binnen)) return null
      uit += `Q${hulp.push(binnen) - 1}Q`
      i = e + 1
      continue
    }
    uit += c
    i += 1
  }
  if (/`/.test(uit)) return null
  // $(…) buiten quotes: alleen zonder nesting, inhoud wordt apart gecontroleerd.
  uit = uit.replace(/\$\(([^()]*)\)/g, (_, b) => { subst.push(b); return 'SUBST' })
  if (/\$\(|<\(|>\(/.test(uit)) return null
  // 2>&1 en &> vóór het splitsen op &.
  uit = uit.replace(/\d*>&\d+/g, ' ').replace(/&>/g, '>')
  return { tekst: uit, hulp, subst }
}

const onderdelen = (tekst) => tekst.split(/\n|;;|;|&&|\|\||\||&/).map(x => x.trim()).filter(Boolean)
const woorden = (seg) => seg.split(/\s+/).filter(Boolean)

// Omleidingen eruit; schrijven mag alleen naar /tmp, ~/Gino of /dev/null.
function zonderOmleiding(seg, hulp) {
  let goed = true
  const schoon = seg.replace(/(\d?&?>>?|&>)\s*(&\d|\S+)|<HEREDOC|<\s*\S+/g, (m, pijl, doel) => {
    if (!pijl) return ' '
    if (doel.startsWith('&')) return ' '
    const q = doel.match(/^Q(\d+)Q$/)
    const pad = q ? hulp[Number(q[1])] : doel
    if (!VRIJE_MAP.test(pad) || pad.includes('..')) goed = false
    return ' '
  }).replace(/<<HEREDOC/g, ' ')
  return goed ? schoon.trim() : null
}

function segmentLeest(seg, ctx) {
  const w = woorden(seg)
  while (w.length && (LUS_WOORDEN.has(w[0]) || /^\w+=\S*$/.test(w[0]))) w.shift()
  if (!w.length) return true
  const [c, ...rest] = w
  const tekst = (x) => { const q = x.match(/^Q(\d+)Q$/); return q ? ctx.hulp[Number(q[1])] : x }
  if (c === 'for') return rest[1] === 'in'
  if (c === 'mkdir' || c === 'touch') return rest.filter(a => !a.startsWith('-')).every(a => VRIJE_MAP.test(tekst(a)) && !tekst(a).includes('..'))
  // Nakijken en bouwen: schrijft alleen naar dist. eslint --fix wijzigt code, dus dan een kaart.
  if (c === 'npx') return rest[0] === 'eslint' && !rest.some(a => a.startsWith('--fix') || a.startsWith('--output-file') || a === '-o')
  if (c === 'npm') return rest.length === 2 && rest[0] === 'run' && (rest[1] === 'build' || rest[1] === 'lint')
  if (!ALTIJD_LEZEN.has(c) && c !== 'git' && c !== 'node') return false
  if (c === 'git') {
    const a = [...rest]
    while (a[0] === '-C') a.splice(0, 2)
    return GIT_LEZEN.has(a[0]) && !a.includes('--output') && !a.some(x => x.startsWith('--output=') || x === '--ext-diff')
  }
  if (c === 'node') {
    if (rest[0] === '--check') return rest.length === 2
    return /^(?:\/Users\/[\w.-]+\/workapp\/)?scripts\/pa-db\.mjs$/.test(rest[0] || '') && PA_DB_LEZEN.has(rest[1])
  }
  if (c === 'find') return !rest.some(a => /^-(exec|execdir|ok|okdir|delete|fprint|fprintf|fls)/.test(a))
  if (c === 'sort') return !rest.some(a => a === '-o' || a.startsWith('--output'))
  if (c === 'date') return !rest.some(a => a === '-s' || a === '--set')
  if (c === 'sed') return rest.every(a => a === '-n' || /^\d+(,\d+|,\$)?p$/.test(tekst(a)) || (!a.startsWith('-') && !/^Q\d+Q$/.test(a)))
  if (c === 'awk') return rest.every(a => { const t = tekst(a); return a === t || !/system|getline|\||>|print\s*>|close\(/.test(t) })
  return true
}

function leest(tekst, ctx, diepte = 0) {
  if (diepte > 2) return false
  for (const seg of onderdelen(tekst)) {
    const schoon = zonderOmleiding(seg, ctx.hulp)
    if (schoon === null || !segmentLeest(schoon, ctx)) return false
  }
  return true
}

// Geeft 'lezen' of null.
export function veiligeBash(cmd) {
  const o = ontleed(cmd)
  if (!o || !o.tekst.trim()) return null
  for (const b of o.subst) if (!veiligeBash(b)) return null
  // `cat > x <<EOF` mag alleen naar een vrije map; dat dekt zonderOmleiding.
  return leest(o.tekst, o) ? 'lezen' : null
}

// De familie als alles wat niet leest tot één familie hoort en er niets gevaarlijks in staat.
// Een tijdelijk script mag programma's starten als het er alleen deze zijn: lezen uit
// de database en beeld bewerken. Elke andere of niet te lezen aanroep geeft weer een
// losse kaart. Geldt alleen na één keer Toestaan binnen dezelfde opdracht.
const STARTEN = /\b(execFileSync|spawnSync|execFile|spawn|execSync|exec)\s*\(\s*([^)\n]{0,120})/g
const VEILIG_STARTEN = /^['"](ffmpeg|ffprobe|sips)['"]\s*,|^['"]node['"]\s*,\s*\[\s*['"](?:[\w./-]*\/)?scripts\/pa-db\.mjs['"]\s*,\s*['"](lees|schema)['"]/
function startSchoon(tekst) {
  const zonderImport = tekst.replace(/\bimport\s*\{[^}]*\}\s*from\s*['"](node:)?child_process['"]/g, '').replace(/\brequire\(\s*['"](node:)?child_process['"]\s*\)/g, '')
  const aanroepen = [...zonderImport.matchAll(STARTEN)]
  return aanroepen.every(m => (m[1] === 'execFileSync' || m[1] === 'spawnSync' || m[1] === 'execFile') && VEILIG_STARTEN.test(m[2]))
    && !/\bchild_process\b|\bsubprocess\b|\bos\.system\b/.test(zonderImport)
}
const zonderVeiligStarten = (s) => (startSchoon(s) ? s.replace(/\b(child_process|execFileSync|spawnSync|execFile|spawn|execSync)\b/g, 'start') : s)

export function familieVan(cmd) {
  if (GEVAARLIJK.test(zonderVeiligStarten(String(cmd || '')))) return null
  const o = ontleed(cmd)
  if (!o) return null
  for (const b of o.subst) if (!veiligeBash(b)) return null
  let familie = null
  for (const seg of onderdelen(o.tekst)) {
    const schoon = zonderOmleiding(seg, o.hulp)
    if (schoon === null) return null
    if (segmentLeest(schoon, o)) continue
    const w = woorden(schoon)
    while (w.length && (LUS_WOORDEN.has(w[0]) || /^\w+=\S*$/.test(w[0]))) w.shift()
    const c = w[0]
    let f = null
    if (c === 'python3' || c === 'python') f = 'python'
    else if (c === 'node' && (w[1] === '-e' || w[1] === '-p' || /^(\/tmp|\/private\/tmp|~\/Gino)\//.test(w[1] || ''))) f = 'node'
    else if (c === 'yt-dlp') f = 'yt-dlp'
    else if (c === 'curl') f = 'curl'
    else if (c === 'ffmpeg') f = 'ffmpeg'
    if (!f || (familie && familie !== f)) return null
    familie = f
  }
  return familie
}

// Wat een script of download naar buiten kan brengen of buiten de werkmappen kan
// aanpassen. Staat dit erin, dan blijft het een kaart.
const VERSTUURT_OF_SCHRIJFT = /\b(urllib|requests|httpx|aiohttp|socket|smtplib|ftplib|http\.client|shutil|fetch|axios|XMLHttpRequest|node:https?|require\(\s*['"]https?['"]|createClient|supabase)\b|\bopen\([^)\n]*,\s*['"][^'"]*[wax+]|\bos\.(rename|replace|mkdir|makedirs)\b|\bfs\.(write|append|rename|copy|mkdir|cp)\w*/
// Chrome-login mag (5 nov, op zijn verzoek), maar alleen richting YouTube; zie vrijeFamilie.
const YT_DLP_RISICO = /--exec\b|--cookies(?!-from-browser)\b|--config-locations?\b|--plugin-dirs\b|--netrc\b|--username\b|--password\b|--batch-file\b|(?:^|\s)-[au]\s/
// Met curl mag alleen een vaste pagina opgehaald worden: geen login, geen eigen headers,
// geen bestand schrijven en geen variabele in het adres (daarmee kan data naar buiten).
const CURL_ADRES_RISICO = /\$|`/
const CURL_RISICO = /--(header|cookie|cookie-jar|user|oauth2-bearer|config|output|remote-name|proxy|url-query|json)\b|(?:^|\s)-[a-zA-Z]*[HbcuKoOxJ][a-zA-Z]*\s/

const EXTRA_LEZEN = new Set(['diff', 'comm', 'paste', 'column', 'tac', 'rev', 'fold', 'base64', 'strings', 'lsof', 'id', 'whoami', 'hostname', 'type', 'read', 'xxd', 'md5', 'shasum', 'plutil', 'export', '[['])
const SED_SCHRIJFT = /\/[gipI0-9]*[we]\b|(^|;)\s*\d*[we]\s/

// Een script mag alleen zonder kaart als we de inhoud hebben nagelezen, plus wat het zelf
// laadt. `lees(pad)` geeft de tekst of null. Zo omzeilt een los script de blokkades niet.
function scriptSchoon(pad, opdracht, lees, diepte = 0) {
  if (!pad || /[$`*]/.test(pad) || pad.includes('..') || diepte > 2) return false
  // In dezelfde opdracht geschreven: die tekst is al als geheel nagekeken.
  if (diepte === 0 && opdracht.includes(`> ${pad}`) && /<<-?\s*['"]?\w+/.test(opdracht)) return true
  const inhoud = lees?.(pad)
  if (typeof inhoud !== 'string') return false
  if (hardeBlokkade('Bash', { command: inhoud }) || GEVAARLIJK.test(inhoud) || VERSTUURT_OF_SCHRIJFT.test(inhoud) || /\bimport\s*\(/.test(inhoud)) return false
  for (const m of inhoud.matchAll(/(?:from\s+|require\(\s*|^\s*import\s+)['"](\.[^'"]+)['"]/gm)) {
    if (!scriptSchoon(path.posix.join(path.posix.dirname(pad), m[1]), opdracht, lees, diepte + 1)) return false
  }
  return true
}

function vrijSegment(schoon, o, opdracht, lees) {
  if (segmentLeest(schoon, o)) return true
  const w = woorden(schoon)
  while (w.length && (LUS_WOORDEN.has(w[0]) || /^\w+=\S*$/.test(w[0]))) w.shift()
  const [c, ...rest] = w
  const tekst = (x) => { const q = x.match(/^Q(\d+)Q$/); return q ? o.hulp[Number(q[1])] : x }
  const voluit = rest.map(tekst).join(' ')
  if (EXTRA_LEZEN.has(c)) return true
  if (c === 'sed') return !rest.some(a => /^(-i|--in-place)/.test(a)) && !rest.some(a => /^Q\d+Q$/.test(a) && SED_SCHRIJFT.test(tekst(a)))
  if (c === 'python' || c === 'python3') {
    const a = rest.filter(x => x !== '-I')
    if (a[0] === '-c' || a[0] === '-' || a[0]?.startsWith('<')) return true
    return scriptSchoon(tekst(a[0] || ''), opdracht, lees)
  }
  if (c === 'node') {
    if (rest[0] === '-e' || rest[0] === '-p') return true
    return scriptSchoon(tekst(rest[0] || ''), opdracht, lees)
  }
  if (c === 'yt-dlp') {
    if (YT_DLP_RISICO.test(voluit)) return false
    const adressen = voluit.match(/https?:\/\/[^\s"']+/g) || []
    return !/--cookies-from-browser\b/.test(voluit) || adressen.every(a => /^https?:\/\/([\w-]+\.)?(youtube\.com|youtu\.be)(\/|$)/.test(a))
  }
  // Curl: de "-o /dev/null"-check van een statuscode blijft toegestaan.
  if (c === 'curl') return !CURL_ADRES_RISICO.test(voluit) && !CURL_RISICO.test(` ${voluit.replace(/-o\s+\/dev\/null/g, '')}`)
  // Zonder -y overschrijft ffmpeg niets dat er al staat.
  if (c === 'ffmpeg') return !rest.includes('-y')
  return false
}

// 'vrij' als de hele opdracht zonder kaart mag; anders null en dus de gewone kaart.
export function vrijeBash(cmd, lees = null) {
  const s = String(cmd || '')
  if (GEVAARLIJK.test(s) || VERSTUURT_OF_SCHRIJFT.test(s)) return null
  const o = ontleed(s)
  if (!o || !o.tekst.trim()) return null
  for (const b of o.subst) if (!vrijeBash(b, lees)) return null
  for (const seg of onderdelen(o.tekst)) {
    const schoon = zonderOmleiding(seg, o.hulp)
    if (schoon === null || !vrijSegment(schoon, o, s, lees)) return null
  }
  return 'vrij'
}

// Alleen lezen, en alleen koppelingen die Kersten dagelijks gebruikt. Gmail en Zoom
// lezen mag sinds 5 nov op zijn verzoek; execute_sql niet, want dat kan schrijven.
const ZOOM_LEZEN = /^mcp__claude_ai_Zoom_for_Claude__(ask|search|search_meetings|search_describe_capabilities|capabilities_describe|capabilities_discover|capabilities_invoke_read|recordings_list|get_\w+|my_notes_get_note_content|hub_get_file_content)$/
const LEES_KOPPELING = /^mcp__claude_ai_(Metricool_Social_Media_Management|Google_Drive|Google_Calendar|Calendly|Supabase|Gmail)__(?:[\w-]*-)?(get|list|search|read|suggest)(?=[_A-Z-]|$)/
const NOOIT_LEESTOOL = /key|secret|token|download/i
export function leesTool(tool) {
  const naam = String(tool || '')
  if (naam === 'WebSearch' || naam === 'WebFetch') return true
  return (LEES_KOPPELING.test(naam) || ZOOM_LEZEN.test(naam)) && !NOOIT_LEESTOOL.test(naam)
}

export const FAMILIE_NAAM = {
  python: 'Python-scripts', node: 'losse Node-scripts', 'yt-dlp': 'YouTube ophalen', curl: 'webpagina’s ophalen', ffmpeg: 'video bewerken',
}

const MOET_VEILIG = [
  'ls -la "$HOME/Movies/MY ARC bibliotheek/youtube-shorts" 2>&1 | head -20',
  'sw_vers -productVersion',
  'git -C /Users/k/workapp log -5 --format="%h %ad %s" --date=format:%H:%M -- a.jsx',
  `cd /Users/k/workapp; node scripts/pa-db.mjs lees "select woord, count(*) n from lead_magnets group by 1 order by 1" 2>&1 | head -40`,
  `cd ~/Gino; wc -l yt-*; head -5 x.txt; echo ---; head -c 1800 y`,
  `until [ "$(wc -l < /Users/k/Gino/a.jsonl)" -ge 111 ]; do sleep 5; done; wc -l /Users/k/Gino/a.jsonl`,
  `cat > /tmp/ytl/x.py <<'EOF'\nimport os\nos.system('rm -rf /')\nEOF\nls /tmp/ytl`,
  'mkdir -p /tmp/ytl; cd /tmp/ytl; ls',
  "sed -n 1,60p scripts/a.mjs",
]
const MOET_VRAGEN = [
  'rm x', 'ls; rm x', 'ls && curl http://x', 'cat x | sh', 'ls $(rm x)', 'ls `rm x`', 'echo "$(rm x)"', 'echo hoi > src/a.js', 'echo hoi >> ~/.zshrc',
  'echo hoi > /tmp/../etc/x', 'tee /tmp/x', 'find . -delete', 'find . -exec rm {} ;', 'sed -i s/a/b/ x', "sed 'w x' y", "awk 'BEGIN{system(\"rm x\")}'",
  "awk '{print > \"x\"}' y", 'sort -o x y', 'git push', 'git checkout .', 'git -C x commit -m a', 'node scripts/pa-db.mjs app-lijst x', 'node scripts/pa-sql.mjs a.sql',
  'node scripts/x.mjs', 'npm run release', 'xargs rm', 'ls | xargs rm', 'mv a b', 'cp a b', 'python3 x.py', 'node -e "1"', 'curl http://x', 'date -s 1', 'mkdir /etc/x',
  'mkdir -p src/a', 'ls <(rm x)', 'bash x.sh', 'cat <<EOF', 'ls "onafgemaakt',
]
const FAMILIE = [
  ["cd ~/Gino; python3 -I - <<'E'\nimport json\nprint(1)\nE", 'python'],
  ['node -e "console.log(1)"', 'node'],
  ['yt-dlp --flat-playlist --print "%(id)s" "https://x"', 'yt-dlp'],
  ['curl -s -o /dev/null -w "%{http_code}" "https://x"', 'curl'],
  ["cat > /tmp/a.mjs <<'EOF'\nimport { execFileSync } from 'node:child_process'\nexecFileSync('node', ['scripts/pa-db.mjs', 'lees', q])\nexecFileSync('ffmpeg', ['-i', a])\nEOF\nnode /tmp/a.mjs", 'node'],
]
const GEEN_FAMILIE = [
  "cat > /tmp/a.mjs <<'EOF'\nimport { execSync } from 'node:child_process'\nexecSync('curl http://x')\nEOF\nnode /tmp/a.mjs",
  "cat > /tmp/a.mjs <<'EOF'\nimport { execFileSync } from 'node:child_process'\nexecFileSync('node', ['scripts/pa-db.mjs', 'zet', q])\nEOF\nnode /tmp/a.mjs",
  "cat > /tmp/a.mjs <<'EOF'\nimport { execFileSync } from 'node:child_process'\nexecFileSync(prog, [q])\nEOF\nnode /tmp/a.mjs",
  "cat > /tmp/a.mjs <<'EOF'\nconst c = require('child_process')\nc.exec('rm x')\nEOF\nnode /tmp/a.mjs",
  'curl -X POST http://x', 'curl -d a http://x', 'curl --data a http://x', "python3 - <<'E'\nimport os\nos.remove('x')\nE", 'node -e "x.from(1).insert(2)"',
  `python3 -c "import subprocess"`, 'python3 x.py; curl http://x', 'rm x; python3 y.py', 'npm run release', 'node scripts/x.mjs', 'python3 x.py > src/a.py',
]

const MOET_VRIJ = [
  'npx eslint scripts/a.mjs && echo eslint-ok; node --check scripts/a.mjs && echo syntax-ok; TZ=Europe/Amsterdam date',
  'npm run build', 'npm run lint',
  `node /Users/k/workapp/scripts/pa-db.mjs onthoud '{"soort":"correctie","tekst":"klein beginnen"}'`,
]
const STUB = {
  'scripts/goed.mjs': "import a from './hulp.mjs'\nconsole.log(a)", 'scripts/hulp.mjs': 'export default 1',
  'scripts/slecht.mjs': "x.from('a').insert(1)", 'scripts/laadt.mjs': "import a from './slecht.mjs'", 'scripts/mail.mjs': 'send-push',
  'scripts/stiekem.mjs': "await import('./slecht.mjs')",
}
const stubLees = (p) => STUB[p] ?? null
const VRIJE_FAMILIE = [
  ["cd ~/Gino; python3 -I - <<'E'\nimport json\nprint(1)\nE", 'python'],
  ['node -e "console.log(1)"', 'node'],
  ['yt-dlp --flat-playlist --print "%(id)s" "https://x"', 'yt-dlp'],
  ['yt-dlp --cookies-from-browser chrome --flat-playlist "https://www.youtube.com/playlist?list=UU"', 'yt-dlp'],
  ['curl -s -o /dev/null -w "%{http_code}" "https://x"', 'curl'],
  ['curl -s "https://x" | grep -o y', 'curl'],
  ['ffmpeg -i a.mp4 /tmp/b.mp4', 'ffmpeg'],
  ['node scripts/goed.mjs --x 1', 'script'],
  ['cd ~/Gino; python3 -I - <<E\nprint(1)\nE\nnode -e "console.log(2)"; curl -s https://x | head -3', 'gemengd'],
  ["cat > /tmp/v.mjs <<'EOF'\nconsole.log(1)\nEOF\nnode /tmp/v.mjs a.json", 'hier geschreven'],
  ["cat a b | sed -E 's/x/y/'; sed -n 1,60p c", 'sed'],
  ['D=/tmp/a; A=$D/b; node scripts/goed.mjs --bestand $A', 'variabele'],
  ['node scripts/pa-db.mjs schema c 2>&1 | head -60; ls a | wc -l; cat a | node -e "console.log(1)"', 'pijp'],
]
const BLIJFT_KAART = [
  'npx eslint --fix a.js', 'npx eslint a.js -o b', 'npx vite build', 'npm run release', 'npm install x', 'node --check a.js; rm a.js',
  'node scripts/pa-sql.mjs a.sql', 'node scripts/pa-db.mjs app-lijst x', 'node /tmp/scripts/pa-db.mjs lees x',
]
const GEEN_VRIJE_FAMILIE = [
  'python3 /tmp/x.py', 'cd ~/Gino; python3 -I x.py', 'node /tmp/x.mjs', 'node scripts/slecht.mjs', 'node scripts/laadt.mjs', 'node scripts/mail.mjs',
  'node scripts/stiekem.mjs', 'node scripts/onbekend.mjs', 'npm run release', 'npm install x', 'git commit -m a', 'mv a b', 'cp a b', 'launchctl list', 'gh pr list',
  "sed -i 's/a/b/' x", "sed 's/a/b/w x' y", 'echo a > src/b.js', 'node -e "1" > ~/.zshrc', 'vercel --prod', 'rm x', "python3 - <<'E'\nimport urllib.request\nE", "python3 - <<'E'\nopen('x','w').write('y')\nE", 'node -e "fetch(1)"', 'node -e "fs.writeFileSync(1)"',
  'yt-dlp --exec "rm x" https://x', 'yt-dlp --cookies-from-browser chrome https://x', 'yt-dlp --cookies c.txt https://www.youtube.com/a', 'yt-dlp --cookies-from-browser chrome https://youtube.com.evil.nl/a',
  'curl -H "Authorization: x" https://x', 'curl -b a https://x', 'curl -u a:b https://x', 'curl -o /tmp/a https://x', 'curl -sO https://x',
  'curl "https://x/?a=$(cat b)"', 'curl https://x/$HOME', 'curl -X POST https://x', 'ffmpeg -y -i a b',
]
const LEES_JA = [
  'WebSearch', 'WebFetch', 'mcp__claude_ai_Metricool_Social_Media_Management__getScheduledPosts', 'mcp__claude_ai_Google_Drive__search_files',
  'mcp__claude_ai_Google_Calendar__list_events', 'mcp__claude_ai_Calendly__meetings-list_events', 'mcp__claude_ai_Supabase__list_tables',
  'mcp__claude_ai_Gmail__get_thread', 'mcp__claude_ai_Gmail__search_threads', 'mcp__claude_ai_Gmail__list_drafts',
  'mcp__claude_ai_Zoom_for_Claude__search', 'mcp__claude_ai_Zoom_for_Claude__get_meeting_assets', 'mcp__claude_ai_Zoom_for_Claude__my_notes_get_note_content', 'mcp__claude_ai_Zoom_for_Claude__recordings_list',
]
const LEES_NEE = [
  'mcp__claude_ai_Supabase__execute_sql', 'mcp__claude_ai_Supabase__apply_migration', 'mcp__claude_ai_Supabase__get_publishable_keys',
  'mcp__claude_ai_Metricool_Social_Media_Management__createScheduledPost', 'mcp__claude_ai_Metricool_Social_Media_Management__updateScheduledPost',
  'mcp__claude_ai_Google_Drive__create_file', 'mcp__claude_ai_Google_Drive__download_file_content', 'mcp__claude_ai_Google_Calendar__create_event',
  'mcp__claude_ai_Calendly__meetings-cancel_event', 'mcp__claude_ai_Gmail__send_message', 'mcp__claude_ai_Gmail__create_draft', 'mcp__claude_ai_Gmail__label_thread', 'mcp__claude_ai_Gmail__trash_thread',
  'mcp__claude_ai_Zoom_for_Claude__meeting_create', 'mcp__claude_ai_Zoom_for_Claude__capabilities_invoke_write', 'mcp__claude_ai_Stripe__list_customers', 'Bash', 'Edit',
]

export function veiligZelftest() {
  const fouten = []
  for (const c of MOET_VRIJ) if (veiligeBash(c) !== 'lezen') fouten.push(`moet zonder kaart: ${c}`)
  for (const c of BLIJFT_KAART) if (veiligeBash(c)) fouten.push(`moet een kaart blijven: ${c}`)
  for (const [c, f] of VRIJE_FAMILIE) if (!vrijeBash(c, stubLees)) fouten.push(`moet vrij zijn (${f}): ${c}`)
  for (const c of GEEN_VRIJE_FAMILIE) if (vrijeBash(c, stubLees)) fouten.push(`moet een kaart blijven: ${c}`)
  for (const t of LEES_JA) if (!leesTool(t)) fouten.push(`lees-tool: ${t}`)
  for (const t of LEES_NEE) if (leesTool(t)) fouten.push(`geen lees-tool: ${t}`)
  for (const c of MOET_VEILIG) if (veiligeBash(c) !== 'lezen') fouten.push(`moet veilig zijn: ${c}`)
  for (const c of MOET_VRAGEN) if (veiligeBash(c)) fouten.push(`mag niet zonder vraag: ${c}`)
  for (const [c, f] of FAMILIE) if (familieVan(c) !== f) fouten.push(`familie ${f}: ${c}`)
  for (const c of GEEN_FAMILIE) if (familieVan(c)) fouten.push(`geen familie: ${c}`)
  // Harde blokkades: valse meldingen weg, echte blijven.
  const blok = (c) => hardeBlokkade('Bash', { command: c })?.soort || null
  for (const c of ['echo "t:${PA_ACCESS_TOKEN:+ja}"', 'cd /tmp/x && rm -f a.txt', `node scripts/pa-db.mjs lees "select lead, mail from x"`]) if (blok(c)) fouten.push(`valse blokkade: ${c}`)
  for (const [c, s] of [['echo $PA_ACCESS_TOKEN', 'geheim'], ['echo ${PA_ACCESS_TOKEN}', 'geheim'], ['echo ${TOKEN:+$TOKEN}', 'geheim'], ['rm -f a.txt', 'verwijderen'], ['cd /tmp/x && cd ~/workapp && rm a.txt', 'verwijderen'], ['cd /tmp/x && rm ../a', 'verwijderen'], ['cd /tmp/x && rm -rf /Users/x/y', 'verwijderen'], ['stuur mail naar klanten', 'melding'], [`node scripts/pa-db.mjs lees "select stuur_push(id) from clients"`, 'melding'], ['git push', 'git']]) if (blok(c) !== s) fouten.push(`moet blokkeren (${s}): ${c}`)
  return fouten
}
