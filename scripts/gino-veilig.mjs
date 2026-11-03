// scripts/gino-veilig.mjs (3 nov 2026)
//
// Minder klikken zonder de echte vragen kwijt te raken. In één dag vroeg Gino 65 keer
// toestemming, Kersten keurde alles goed: vooral lezen en tellen. Dit draait NA
// hardeBlokkade; wat daar geblokkeerd is, komt hier nooit.
//
//   veiligeBash(cmd)  alleen lezen, of schrijven in ~/Gino of /tmp → geen kaart
//   familieVan(cmd)   python, node -e, yt-dlp, curl, ffmpeg: één kaart per opdracht
//
// Twijfel = null = gewoon een kaart. Niet herkend is nooit veilig.
// Puur: geen database, geen netwerk. Testen: node scripts/gino-toestemming-test.mjs
// Deze code-opdrachten mogen dit bestand niet aanpassen (deny-regel in de PA).

const ALTIJD_LEZEN = new Set([
  'ls', 'cat', 'head', 'tail', 'wc', 'grep', 'egrep', 'rg', 'cut', 'tr', 'uniq', 'pwd', 'which', 'stat', 'du', 'df',
  'echo', 'printf', 'true', 'false', 'test', '[', ':', 'file', 'basename', 'dirname', 'ffprobe', 'sw_vers', 'uname',
  'ps', 'pgrep', 'mdfind', 'jq', 'pdftotext', 'pdfinfo', 'nl', 'seq', 'sleep', 'cd', 'date', 'sort', 'find', 'sed', 'awk',
])
const GIT_LEZEN = new Set(['status', 'log', 'diff', 'show', 'rev-parse', 'check-ignore', 'ls-files', 'blame'])
const PA_DB_LEZEN = new Set(['lees', 'schema', 'projecten', 'project', 'experimenten', 'herinneringen', 'geheugen', 'tijd'])
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
  if (!ALTIJD_LEZEN.has(c) && c !== 'git' && c !== 'node') return false
  if (c === 'git') {
    const a = [...rest]
    while (a[0] === '-C') a.splice(0, 2)
    return GIT_LEZEN.has(a[0]) && !a.includes('--output') && !a.some(x => x.startsWith('--output=') || x === '--ext-diff')
  }
  if (c === 'node') return rest[0] === 'scripts/pa-db.mjs' && PA_DB_LEZEN.has(rest[1])
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
export function familieVan(cmd) {
  if (GEVAARLIJK.test(String(cmd || ''))) return null
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
]
const GEEN_FAMILIE = [
  'curl -X POST http://x', 'curl -d a http://x', 'curl --data a http://x', "python3 - <<'E'\nimport os\nos.remove('x')\nE", 'node -e "x.from(1).insert(2)"',
  `python3 -c "import subprocess"`, 'python3 x.py; curl http://x', 'rm x; python3 y.py', 'npm run release', 'node scripts/x.mjs', 'python3 x.py > src/a.py',
]

export function veiligZelftest() {
  const fouten = []
  for (const c of MOET_VEILIG) if (veiligeBash(c) !== 'lezen') fouten.push(`moet veilig zijn: ${c}`)
  for (const c of MOET_VRAGEN) if (veiligeBash(c)) fouten.push(`mag niet zonder vraag: ${c}`)
  for (const [c, f] of FAMILIE) if (familieVan(c) !== f) fouten.push(`familie ${f}: ${c}`)
  for (const c of GEEN_FAMILIE) if (familieVan(c)) fouten.push(`geen familie: ${c}`)
  return fouten
}
