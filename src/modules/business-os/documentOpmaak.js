// src/modules/business-os/documentOpmaak.js
//
// Bewerken in de opgemaakte weergave van een Business OS-document (24 nov 2026).
// Geen React en geen afhankelijkheden: gewone DOM. Het scherm eromheen staat in
// DocumentBewerker.jsx, de leesweergave in GinoDocument.jsx (Weergave).
//
// Opslag blijft dezelfde markdown als altijd. De regels hieronder (KOPREGEL e.d.)
// zijn de enige bron voor wat een kop, punt, pijl, lijn of tabel is; de
// leesweergave gebruikt ze ook, zodat lezen en bewerken nooit uit elkaar lopen.
//
// Hoe het verlies-vrij blijft:
// - Eén regel markdown = één blok in beeld. Het begin van de regel ('## ', '- ',
//   '  3. ', '→ ') staat letterlijk in data-pre en komt bij opslaan terug.
// - Lege regels staan niet in beeld maar hangen als 'voor' aan het blok erna
//   (extra), de lege regels aan het eind aan het vlak zelf ('na').
// - Elk blok onthoudt zijn oorspronkelijke regel (ruw) en hoe hij er net na het
//   tekenen uit kwam (canon). Is hij bij opslaan nog gelijk aan canon, dan gaat
//   de oorspronkelijke regel terug: wat je niet aanraakt verandert niet.
// - Tabellen zijn niet in beeld te bewerken: tik erop en het blok opent als
//   ruwe tekst.
// - Klopt openen → opslaan niet teken voor teken, dan is ok false en opent het
//   scherm het document in de oude ruwe vorm.

// ── Regels van de markdown-vorm (ook gebruikt door de leesweergave) ──
export const KOPREGEL = /^(#{1,4})\s+(.*)$/
export const TABELREGEL = /^\s*\|/
export const SCHEIDINGSRIJ = /^\s*\|?\s*:?-{2,}/
export const LIJNREGEL = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/
export const PIJLREGEL = /^(\s*)(?:→|->)\s?(.*)$/
export const PUNTREGEL = /^(\s*)[-•*]\s(.*)$/
export const PUNT_KAAL = /^(\s*)[-•]()$/
export const NUMMERREGEL = /^(\s*)(\d+)\.\s+(.*)$/
// **vet**, [tekst](url), `code`, *schuin*. Alleen vet mag andere opmaak bevatten.
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*([^*\s][^*]*?)\*/
export const inlineRe = () => new RegExp(INLINE.source, 'g')
export const cellen = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

// Wat je typt aan het begin van een gewone regel en wat er dan een kop, punt of pijl van maakt.
const AUTO = /^(?:#{1,4}\s|\s*[-•*]\s|\s*\d+\.\s|\s*(?:→|->)\s)/

// blok → { voor, ruw, canon, regels (tabel), virtueel }; vlak → { na }
const extra = new WeakMap()

const isLijst = (t) => t === 'li' || t === 'ol' || t === 'pijl'
const bewerkbaar = (b) => !!b && !!b.dataset && b.dataset.t !== 'hr' && b.dataset.t !== 'ruw'
const inspringVan = (pre) => (pre || '').match(/^\s*/)[0]
const diepte = (pre) => Math.floor(inspringVan(pre).replace(/\t/g, '  ').length / 2)

// Eén regel (geen tabel, niet leeg) → soort, letterlijk begin en de tekst erachter.
export function ontleedRegel(r) {
  const kop = r.match(KOPREGEL)
  if (kop) return { t: `h${kop[1].length}`, pre: r.slice(0, r.length - kop[2].length), tekst: kop[2] }
  if (LIJNREGEL.test(r)) return { t: 'hr', pre: r, tekst: '' }
  const pijl = r.match(PIJLREGEL)
  if (pijl) return { t: 'pijl', pre: r.slice(0, r.length - pijl[2].length), tekst: pijl[2] }
  const punt = r.match(PUNTREGEL) || r.match(PUNT_KAAL)
  if (punt) return { t: 'li', pre: r.slice(0, r.length - punt[2].length), tekst: punt[2] }
  const num = r.match(NUMMERREGEL)
  if (num) return { t: 'ol', pre: r.slice(0, r.length - num[3].length), tekst: num[3] }
  const m = r.match(/^(\s*)([\s\S]*)$/)
  return { t: 'p', pre: m[1], tekst: m[2] }
}

// Hele tekst → blokken (met de lege regels ervoor) en de lege regels aan het eind.
export function ontleed(md) {
  const regels = String(md ?? '').split('\n')
  const blokken = []
  let voor = []
  for (let i = 0; i < regels.length; i++) {
    const r = regels[i]
    if (TABELREGEL.test(r)) {
      const blok = []
      while (i < regels.length && TABELREGEL.test(regels[i])) blok.push(regels[i++])
      i--
      blokken.push({ t: 'ruw', regels: blok, voor })
      voor = []
      continue
    }
    if (!r.trim()) { voor.push(r); continue }
    blokken.push({ ...ontleedRegel(r), ruwe: r, voor })
    voor = []
  }
  return { blokken, na: voor }
}

// ── Opmaak binnen een regel ──
function inlineNaarDom(doc, tekst) {
  const frag = doc.createDocumentFragment()
  const re = inlineRe()
  let laatst = 0
  let m
  while ((m = re.exec(tekst))) {
    if (m.index > laatst) frag.append(tekst.slice(laatst, m.index))
    let el
    if (m[1] != null) { el = doc.createElement('strong'); el.append(inlineNaarDom(doc, m[1])) }
    else if (m[2] != null) { el = doc.createElement('span'); el.dataset.href = m[3]; el.textContent = m[2] }
    else if (m[4] != null) { el = doc.createElement('code'); el.textContent = m[4] }
    else { el = doc.createElement('em'); el.textContent = m[5] }
    frag.append(el)
    laatst = re.lastIndex
  }
  if (laatst < tekst.length) frag.append(tekst.slice(laatst))
  return frag
}

// Tekens die een element in markdown om zijn inhoud zet.
function merk(el) {
  const n = el.nodeName
  if (n === 'STRONG' || n === 'B') return ['**', '**']
  if (n === 'EM' || n === 'I') return ['*', '*']
  if (n === 'CODE') return ['`', '`']
  if (el.dataset && el.dataset.href != null) return ['[', `](${el.dataset.href})`]
  return ['', '']
}

// Inhoud van een blok (of element) terug naar markdown. Lege elementen verdwijnen.
function inlineMd(el) {
  let s = ''
  for (const k of el.childNodes) {
    if (k.nodeType === 3) s += k.nodeValue
    else if (k.nodeType === 1 && k.nodeName !== 'BR') {
      const binnen = inlineMd(k)
      if (!binnen) continue
      const [a, z] = merk(k)
      s += a + binnen + z
    }
  }
  return s
}

// Plek in de DOM → plek in de markdown van het blok.
function mdPositie(b, node, off) {
  let pos = 0
  let uit = null
  const loop = (el) => {
    const kids = el.childNodes
    for (let i = 0; i <= kids.length; i++) {
      if (el === node && i === off) { uit = pos; return true }
      if (i === kids.length) break
      const k = kids[i]
      if (k.nodeType === 3) {
        if (k === node) { uit = pos + Math.min(off, k.nodeValue.length); return true }
        pos += k.nodeValue.length
      } else if (k.nodeType === 1) {
        if (k.nodeName === 'BR') { if (k === node) { uit = pos; return true } continue }
        const binnen = inlineMd(k)
        if (!binnen) { if (k === node || k.contains(node)) { uit = pos; return true } continue }
        const [a, z] = merk(k)
        pos += a.length
        if (loop(k)) return true
        pos += z.length
      }
    }
    return false
  }
  loop(b)
  return uit == null ? pos : uit
}

// Plek in de markdown van het blok → plek in de DOM. Derde waarde: de plek ligt
// direct ná een sluitteken (dus buiten het vet/schuin dat net eindigde).
function domPositie(b, doel) {
  let pos = 0
  let uit = null
  let buiten = false
  const loop = (el) => {
    const kids = el.childNodes
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i]
      if (k.nodeType === 3) {
        const l = k.nodeValue.length
        if (doel <= pos + l) { uit = [k, doel - pos]; return true }
        pos += l
      } else if (k.nodeType === 1 && k.nodeName !== 'BR') {
        const binnen = inlineMd(k)
        if (!binnen) continue
        const [a, z] = merk(k)
        if (doel < pos + a.length) { uit = [el, i]; return true }
        pos += a.length
        if (loop(k)) return true
        if (doel === pos && z) { uit = [k, k.childNodes.length]; return true }
        pos += z.length
        // Op of in het sluitteken: de plek ligt buiten het element.
        if (doel <= pos) { uit = [el, i + 1]; buiten = !!a; return true }
      }
    }
    return false
  }
  if (!loop(b)) uit = [b, b.childNodes.length]
  return [uit[0], uit[1], buiten]
}

// ── Stukken tekst met hun opmaak (voor vet/schuin aan en uit) ──
function runsVan(b) {
  const uit = []
  const loop = (el, a) => {
    for (const k of el.childNodes) {
      if (k.nodeType === 3) { if (k.nodeValue) uit.push({ ...a, t: k.nodeValue }) }
      else if (k.nodeType === 1 && k.nodeName !== 'BR') {
        const n = k.nodeName
        const erbij = n === 'STRONG' || n === 'B' ? { b: 1 } : n === 'EM' || n === 'I' ? { i: 1 } : n === 'CODE' ? { c: 1 }
          : k.dataset && k.dataset.href != null ? { h: k.dataset.href } : null
        loop(k, erbij ? { ...a, ...erbij } : a)
      }
    }
  }
  loop(b, {})
  return uit
}
const zelfdeOpmaak = (x, y) => !x.b === !y.b && !x.i === !y.i && !x.c === !y.c && (x.h ?? null) === (y.h ?? null)

// Spaties aan de rand van vet of schuin horen erbuiten: '**een **twee' wordt '**een** twee'.
function spatiesNaarBuiten(runs) {
  const los = (x) => !x.c && x.h == null
  const zonder = (x, sleutel, t) => { const n = { ...x, t }; delete n[sleutel]; return n }
  const r = []
  for (const x of runs) {
    if (!x.t) continue
    if (!x.i || !los(x)) { r.push({ ...x }); continue }
    const m = x.t.match(/^(\s*)([\s\S]*?)(\s*)$/)
    if (m[1]) r.push(zonder(x, 'i', m[1]))
    if (m[2]) r.push({ ...x, t: m[2] })
    if (m[3]) r.push(zonder(x, 'i', m[3]))
  }
  const uit = []
  for (let i = 0; i < r.length; i++) {
    if (!r[i].b) { uit.push(r[i]); continue }
    let j = i
    while (j + 1 < r.length && r[j + 1].b) j++
    const groep = r.slice(i, j + 1)
    const voor = []
    const na = []
    while (groep.length) {
      const x = groep[0]
      const m = los(x) && !x.i ? x.t.match(/^\s+/) : null
      if (!m) break
      voor.push(zonder(x, 'b', m[0]))
      x.t = x.t.slice(m[0].length)
      if (x.t) break
      groep.shift()
    }
    while (groep.length) {
      const x = groep[groep.length - 1]
      const m = los(x) && !x.i ? x.t.match(/\s+$/) : null
      if (!m) break
      na.unshift(zonder(x, 'b', m[0]))
      x.t = x.t.slice(0, -m[0].length)
      if (x.t) break
      groep.pop()
    }
    uit.push(...voor, ...groep, ...na)
    i = j
  }
  return uit
}

function runsNaarMd(lijst) {
  const runs = spatiesNaarBuiten(lijst)
  const r = []
  for (const x of runs) {
    if (!x.t) continue
    const v = r[r.length - 1]
    if (v && zelfdeOpmaak(v, x)) v.t += x.t
    else r.push({ ...x })
  }
  const kern = (x) => (x.c ? `\`${x.t}\`` : x.h != null ? `[${x.t}](${x.h})` : x.t)
  const stuk = (x) => (x.i ? `*${kern(x)}*` : kern(x))
  let uit = ''
  for (let i = 0; i < r.length; i++) {
    if (!r[i].b) { uit += stuk(r[i]); continue }
    let s = ''
    while (i < r.length && r[i].b) s += stuk(r[i++])
    i--
    uit += `**${s}**`
  }
  return uit
}

// Knipt de stukken op van en tot, zodat [van, tot) uit hele stukken bestaat.
function knipRuns(runs, van, tot) {
  const uit = []
  let pos = 0
  for (const x of runs) {
    const eind = pos + x.t.length
    const sneden = [van, tot].filter(s => s > pos && s < eind).map(s => s - pos)
    let vorige = 0
    for (const s of [...new Set(sneden)].sort((p, q) => p - q)) { uit.push({ ...x, t: x.t.slice(vorige, s) }); vorige = s }
    uit.push({ ...x, t: x.t.slice(vorige) })
    pos = eind
  }
  return uit
}
function zetOpmaak(runs, van, tot, sleutel, aan) {
  let pos = 0
  return knipRuns(runs, van, tot).map(x => {
    const binnen = pos >= van && pos + x.t.length <= tot
    pos += x.t.length
    if (!binnen) return x
    const n = { ...x }
    if (aan) n[sleutel] = 1
    else delete n[sleutel]
    return n
  })
}
function heeftOveral(runs, van, tot, sleutel) {
  let pos = 0
  for (const x of runs) {
    const eind = pos + x.t.length
    if (eind > van && pos < tot && !x[sleutel]) return false
    pos = eind
  }
  return true
}
function deelRuns(runs, van, tot) {
  let pos = 0
  return knipRuns(runs, van, tot).filter(x => { const binnen = pos >= van && pos + x.t.length <= tot; pos += x.t.length; return binnen })
}

// ── Blokken tekenen ──
function tekenTabel(doc, el) {
  const rijen = String(extra.get(el)?.regels ?? '').split('\n').filter(r => !SCHEIDINGSRIJ.test(r)).map(cellen)
  el.textContent = ''
  const tabel = doc.createElement('table')
  const [kop, ...rest] = rijen
  if (kop) {
    const tr = tabel.createTHead().insertRow()
    for (const c of kop) { const th = doc.createElement('th'); th.append(inlineNaarDom(doc, c)); tr.append(th) }
  }
  const lijf = tabel.createTBody()
  for (const r of rest) {
    const tr = lijf.insertRow()
    for (const c of r) tr.insertCell().append(inlineNaarDom(doc, c))
  }
  el.append(tabel)
  el.title = 'Tik om de tabel als tekst te bewerken'
}

// Wat er voor dit blok in de markdown hoort te staan (zonder de vangnet-vergelijking).
function regelVan(el) {
  const t = el.dataset.t
  if (t === 'ruw') return extra.get(el)?.regels ?? ''
  let pre = el.dataset.pre || ''
  if (t === 'hr') return pre || '---'
  const tekst = inlineMd(el)
  // '-' zonder spatie is alleen een punt zolang er niets achter staat.
  if (t === 'li' && tekst && !/\s$/.test(pre)) pre += ' '
  return pre + tekst
}
function blokTekst(el, zonderRuw) {
  const nu = regelVan(el)
  const x = extra.get(el)
  return !zonderRuw && x && x.ruw != null && x.canon === nu ? x.ruw : nu
}

// Het hele vlak terug naar markdown.
export function naarMarkdown(root, zonderRuw = false) {
  const uit = []
  for (const el of root.children) {
    const x = extra.get(el)
    if (x?.virtueel) {
      // Schrijfregel onder een tabel of lijn: telt pas mee als er iets in staat.
      if (!el.textContent) continue
      x.virtueel = false
    }
    if (x?.voor?.length) uit.push(...x.voor)
    uit.push(blokTekst(el, zonderRuw))
  }
  uit.push(...(extra.get(root)?.na || []))
  return uit.join('\n')
}

export const BEWERK_CSS = `
.bd-vlak { display: flex; flex-direction: column; gap: 4px; min-height: 100%; outline: none; caret-color: #fff; cursor: text; -webkit-user-select: text; user-select: text; }
.bd-vlak > div { position: relative; color: rgba(255,255,255,0.78); font-size: 0.88rem; line-height: 1.45; overflow-wrap: anywhere; white-space: pre-wrap; min-height: 1.45em; }
.bd-vlak > [data-t="h1"] { color: #fff; font-size: 1.15rem; font-weight: 900; letter-spacing: -0.02em; line-height: inherit; min-height: 1.2em; margin-top: 18px; margin-bottom: 2px; }
.bd-vlak > [data-t="h2"], .bd-vlak > [data-t="h3"] { color: #fff; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; line-height: inherit; min-height: 1.2em; }
.bd-vlak > [data-t="h2"] { margin-top: 14px; margin-bottom: 2px; }
.bd-vlak > [data-t="h1"]:first-child, .bd-vlak > [data-t="h2"]:first-child { margin-top: 0; }
.bd-vlak > [data-t="h3"] { font-size: 0.8rem; margin-top: 20px; margin-bottom: -4px; padding: 10px 0 6px 20px; border-top: 1px solid rgba(255,255,255,0.06); }
.bd-vlak > [data-t="h3"]::before { content: ''; position: absolute; left: 0; top: 10px; width: 14px; height: 1.2em; height: 1lh; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") center / 14px 14px no-repeat; }
.bd-vlak > [data-t="h4"] { color: #fff; font-size: 0.9rem; font-weight: 800; line-height: inherit; min-height: 1.2em; margin-top: 12px; margin-bottom: 2px; }
.bd-vlak > [data-t="hr"] { height: 1px; min-height: 0; background: rgba(255,255,255,0.14); margin: 10px 0; }
.bd-vlak > [data-teken] { padding-left: calc(var(--bd-w, 0.6em) + 8px); }
.bd-vlak > [data-teken]::before { content: attr(data-teken); position: absolute; left: 0; top: 0; color: rgba(255,255,255,0.35); font-weight: 400; white-space: pre; }
.bd-vlak > [data-t="pijl"]::before { color: #fff; font-weight: 800; }
.bd-vlak strong, .bd-vlak b { color: #fff; font-weight: 800; }
.bd-vlak code { font-size: 0.82em; background: rgba(255,255,255,0.07); border-radius: 4px; padding: 1px 4px; }
.bd-vlak [data-href] { color: #fff; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.25); text-underline-offset: 2px; }
.bd-vlak [data-href^="http://"], .bd-vlak [data-href^="https://"] { text-decoration-color: currentColor; }
.bd-vlak > [data-t="ruw"] { white-space: normal; overflow-x: auto; margin: 4px 0; cursor: pointer; border-radius: 8px; -webkit-user-select: none; user-select: none; }
.bd-vlak > [data-t="ruw"]:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.22); }
.bd-vlak > [data-t="ruw"] table { border-collapse: collapse; width: 100%; font-size: 0.8rem; }
.bd-vlak > [data-t="ruw"] th { text-align: left; padding: 6px 8px; color: #fff; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.12); }
.bd-vlak > [data-t="ruw"] td { padding: 6px 8px; color: rgba(255,255,255,0.78); vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.05); }
.bd-vlak textarea.bd-ruwvak { display: block; width: 100%; box-sizing: border-box; resize: vertical; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.28); border-radius: 10px; outline: none; color: #fff; font-family: inherit; font-size: 0.84rem; line-height: 1.5; padding: 10px 12px; white-space: pre; overflow: auto; -webkit-user-select: text; user-select: text; cursor: text; }
`

// root = het contentEditable-vlak. Geeft { ok, ... } terug; bij ok false is er niets aangeraakt
// dat bewaard kan worden en hoort het scherm de ruwe vorm te tonen.
export function maakBewerker(root, opties = {}) {
  const { md: startMd = '', scroller = null, onWijzig = null, onBlur = null } = opties
  const doc = root.ownerDocument
  let huidig = String(startMd ?? '')
  // Opmaak die pas geldt voor het volgende teken (⌘B zonder selectie, of net na het sluiten van **vet**).
  let wacht = null
  let samenstellen = false
  let laatsteBereik = null
  const terug = []
  const vooruit = []
  let stapTijd = 0
  let stapBegin = 0
  let stapSoort = ''

  const br = () => doc.createElement('br')

  // Breedte van het teken voor een punt, zodat de tekst op dezelfde plek begint als bij lezen.
  const breedtes = new Map()
  let meter = null
  const meet = (teken, dik) => {
    const sleutel = (dik ? 'd' : 'n') + teken
    if (breedtes.has(sleutel)) return breedtes.get(sleutel)
    const ouder = root.parentNode
    if (!ouder || !root.isConnected) return null
    if (!meter) {
      meter = doc.createElement('span')
      meter.setAttribute('aria-hidden', 'true')
      meter.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;white-space:pre;font-size:0.88rem;left:-9999px;top:0'
      ouder.append(meter)
    }
    meter.style.fontWeight = dik ? '800' : '400'
    meter.textContent = teken
    const w = Math.round(meter.getBoundingClientRect().width * 100) / 100
    if (!w) return null
    breedtes.set(sleutel, w)
    return w
  }

  function zetSoort(el, t, pre) {
    el.dataset.t = t
    el.dataset.pre = pre
    if (isLijst(t)) {
      const teken = t === 'pijl' ? '→' : t === 'ol' ? `${(pre.match(/\d+/) || ['1'])[0]}.` : inspringVan(pre).length >= 2 ? '◦' : '•'
      el.dataset.teken = teken
      el.style.marginLeft = diepte(pre) ? `${diepte(pre) * 18}px` : ''
      const w = meet(teken, t === 'pijl')
      if (w) el.style.setProperty('--bd-w', `${w}px`)
      else el.style.removeProperty('--bd-w')
    } else {
      delete el.dataset.teken
      el.style.marginLeft = ''
      el.style.removeProperty('--bd-w')
    }
  }

  function vulInline(el, md) {
    el.textContent = ''
    if (md) el.append(inlineNaarDom(doc, md))
    if (!el.firstChild) el.append(br())
  }

  function leegBlok(t, pre) {
    const el = doc.createElement('div')
    zetSoort(el, t, pre)
    el.append(br())
    extra.set(el, { voor: [] })
    return el
  }

  function maak(p) {
    const el = doc.createElement('div')
    if (p.t === 'ruw') {
      const tekst = p.regels.join('\n')
      el.dataset.t = 'ruw'
      el.contentEditable = 'false'
      extra.set(el, { voor: p.voor || [], regels: tekst })
      tekenTabel(doc, el)
      return el
    }
    zetSoort(el, p.t, p.pre)
    if (p.t === 'hr') {
      el.contentEditable = 'false'
      extra.set(el, { voor: p.voor || [], ruw: p.ruwe ?? p.pre, canon: p.pre })
      return el
    }
    vulInline(el, p.tekst)
    extra.set(el, { voor: p.voor || [], ruw: p.ruwe ?? null, canon: regelVan(el) })
    return el
  }

  function laad(md) {
    const { blokken, na } = ontleed(md)
    const frag = doc.createDocumentFragment()
    for (const p of blokken) frag.append(maak(p))
    root.textContent = ''
    root.append(frag)
    let rest = na
    if (!blokken.length) {
      // Leeg document: de eerste lege regel is de regel waarin je typt.
      root.append(maak({ ...ontleedRegel(na[0] ?? ''), ruwe: na[0] ?? '', voor: [] }))
      rest = na.slice(1)
    }
    extra.set(root, { na: rest })
    wacht = null
    borg()
  }

  // Er is altijd een blok, en onder een tabel of lijn aan het eind staat een regel om in te typen.
  function borg() {
    if (!root.firstElementChild) {
      root.append(leegBlok('p', ''))
      extra.set(root, { na: [] })
    }
    const laatste = root.lastElementChild
    if (!bewerkbaar(laatste)) {
      const p = leegBlok('p', '')
      extra.get(p).virtueel = true
      root.append(p)
    }
  }

  // ── Plekken en selectie ──
  const inVak = (node) => {
    const el = node && (node.nodeType === 1 ? node : node.parentElement)
    return !!(el && el.closest && el.closest('textarea'))
  }
  const blokVan = (node) => {
    let b = node
    while (b && b.parentNode !== root) b = b.parentNode
    return b && b.nodeType === 1 ? b : null
  }
  function plek(node, off, isEind) {
    if (node === root) {
      const kids = root.children
      if (!kids.length) return null
      if (isEind) {
        const b = off > 0 ? kids[Math.min(off, kids.length) - 1] : kids[0]
        return { b, node: b, off: off > 0 ? b.childNodes.length : 0, heel: true }
      }
      const b = off < kids.length ? kids[off] : kids[kids.length - 1]
      return { b, node: b, off: off < kids.length ? 0 : b.childNodes.length, heel: true }
    }
    const b = blokVan(node)
    return b ? { b, node, off, heel: false } : null
  }
  function grenzen() {
    const s = doc.getSelection()
    if (!s) return null
    const binnen = (x) => !!x && root.contains(x.startContainer) && root.contains(x.endContainer)
    let r = s.rangeCount ? s.getRangeAt(0) : null
    if (!binnen(r)) {
      if (!binnen(laatsteBereik)) return null
      r = laatsteBereik.cloneRange()
      s.removeAllRanges()
      s.addRange(r)
    }
    if (inVak(r.startContainer)) return null
    const start = plek(r.startContainer, r.startOffset, false)
    const eind = r.collapsed ? start : plek(r.endContainer, r.endOffset, true)
    if (!start || !eind) return null
    return { dicht: r.collapsed, start, eind }
  }
  // Aantal tekens tekst in het blok vóór deze plek.
  function tekstVoor(b, node, off) {
    if (!bewerkbaar(b)) return 0
    const r = doc.createRange()
    try { r.setStart(b, 0); r.setEnd(node, off) } catch { return 0 }
    return r.toString().length
  }
  // naar 'voor' = eind van het stuk tekst ervoor, 'na' = begin van het stuk erna.
  function domVanTekst(b, n, naar = 'voor') {
    const w = doc.createTreeWalker(b, 4)
    let pos = 0
    let k
    let laatste = null
    while ((k = w.nextNode())) {
      const l = k.nodeValue.length
      if (n < pos + l || (n === pos + l && naar === 'voor')) return [k, Math.max(0, n - pos)]
      pos += l
      laatste = k
    }
    return laatste ? [laatste, laatste.nodeValue.length] : [b, 0]
  }
  const zetCaret = (k, o) => { const s = doc.getSelection(); if (s) s.collapse(k, o) }
  const zetSel = (ak, ao, fk, fo) => { const s = doc.getSelection(); if (s) s.setBaseAndExtent(ak, ao, fk, fo) }
  const caretIn = (b, pos, naar = 'voor') => { const [k, o] = domVanTekst(b, pos, naar); zetCaret(k, o) }
  const inBeeld = (b) => { try { b.scrollIntoView({ block: 'nearest' }) } catch { /* leeg */ } }
  const tussen = (a, z) => {
    const uit = []
    for (let b = a; b; b = b.nextElementSibling) { uit.push(b); if (b === z) break }
    return uit
  }
  const opmaakBij = (node, b) => {
    const a = {}
    for (let el = node && (node.nodeType === 1 ? node : node.parentElement); el && el !== b; el = el.parentElement) {
      const n = el.nodeName
      if (n === 'STRONG' || n === 'B') a.b = 1
      else if (n === 'EM' || n === 'I') a.i = 1
      else if (n === 'CODE') a.c = 1
      else if (el.dataset && el.dataset.href != null) a.h = el.dataset.href
    }
    return a
  }

  // ── Opruimen van een blok na een ingreep ──
  function schoon(b) {
    let weer = true
    while (weer) {
      weer = false
      for (const el of b.querySelectorAll('*')) {
        if (el.nodeName === 'BR' || el.textContent) continue
        el.remove()
        weer = true
      }
    }
    for (const x of [...b.querySelectorAll('br')]) x.remove()
    b.normalize()
    for (const el of [...b.querySelectorAll('strong, b, em, i, code')]) {
      const v = el.previousSibling
      if (el.isConnected && v && v.nodeType === 1 && v.nodeName === el.nodeName) {
        while (el.firstChild) v.append(el.firstChild)
        el.remove()
      }
    }
    b.normalize()
    if (!b.firstChild) b.append(br())
  }

  // ── Geschiedenis (eigen, omdat de browser de zijne kwijtraakt zodra wij de DOM aanpassen) ──
  function leesSel() {
    const g = grenzen()
    if (!g) return null
    const idx = (b) => Array.prototype.indexOf.call(root.children, b)
    return {
      a: [idx(g.start.b), tekstVoor(g.start.b, g.start.node, g.start.off)],
      f: [idx(g.eind.b), tekstVoor(g.eind.b, g.eind.node, g.eind.off)],
    }
  }
  function zetSelUit(x) {
    if (!x) return
    const kids = root.children
    const p = ([i, o], naar) => {
      const b = kids[Math.max(0, Math.min(i, kids.length - 1))]
      return bewerkbaar(b) ? domVanTekst(b, o, naar) : [root, Math.max(0, i)]
    }
    const gelijk = x.a[0] === x.f[0] && x.a[1] === x.f[1]
    const [ak, ao] = p(x.a, gelijk ? 'voor' : 'na')
    const [fk, fo] = gelijk ? [ak, ao] : p(x.f, 'voor')
    try { zetSel(ak, ao, fk, fo) } catch { /* leeg */ }
  }
  // Aanroepen vóór een wijziging. Achter elkaar typen is één stap.
  function stap(soort = 'op') {
    const nu = Date.now()
    if (soort === 'typ' && stapSoort === 'typ' && nu - stapTijd < 1200 && nu - stapBegin < 8000) { stapTijd = nu; return }
    terug.push({ md: huidig, sel: leesSel() })
    if (terug.length > 100) terug.shift()
    vooruit.length = 0
    stapTijd = nu
    stapBegin = nu
    stapSoort = soort
  }
  function ongedaan() {
    if (!terug.length) return
    vooruit.push({ md: huidig, sel: leesSel() })
    const s = terug.pop()
    laad(s.md)
    zetSelUit(s.sel)
    stapSoort = ''
    meld()
  }
  function opnieuw() {
    if (!vooruit.length) return
    terug.push({ md: huidig, sel: leesSel() })
    const s = vooruit.pop()
    laad(s.md)
    zetSelUit(s.sel)
    stapSoort = ''
    meld()
  }

  function meld() {
    const md = naarMarkdown(root)
    if (md === huidig) return
    huidig = md
    if (onWijzig) onWijzig(md)
  }
  const klaarOp = () => { borg(); meld() }

  // ── Ingrepen ──
  function hernummer(blok) {
    const d = diepte(blok.dataset.pre)
    let n = Number((blok.dataset.pre.match(/\d+/) || ['1'])[0])
    for (let v = blok.nextElementSibling; v; v = v.nextElementSibling) {
      const t = v.dataset.t
      if (isLijst(t) && diepte(v.dataset.pre) > d) continue
      if (t !== 'ol' || diepte(v.dataset.pre) !== d) break
      if (Number((v.dataset.pre.match(/\d+/) || ['0'])[0]) !== n) break
      n += 1
      zetSoort(v, 'ol', v.dataset.pre.replace(/\d+/, String(n)))
    }
  }
  // Begin voor een nieuw punt in dezelfde lijst.
  const volgendePre = (b, plus) => {
    const pre = b.dataset.pre || ''
    if (b.dataset.t === 'ol') return pre.replace(/\d+/, (n) => String(Number(n) + plus))
    return /\s$/.test(pre) ? pre : `${pre} `
  }

  // Haalt de selectie weg en zet de cursor op de naad.
  function wis(g) {
    const P = (x) => ({ b: x.b, pos: tekstVoor(x.b, x.node, x.off), vast: !bewerkbaar(x.b), heel: x.heel })
    const a = P(g.start)
    let z = P(g.eind)
    // Alles geselecteerd: er blijft een leeg document over.
    if (a.b !== z.b && a.b === root.firstElementChild && a.pos === 0 && z.b === root.lastElementChild && (z.vast || z.pos === z.b.textContent.length)) {
      root.textContent = ''
      borg()
      zetCaret(root.firstElementChild, 0)
      return
    }
    // Selectie die eindigt vóór het eerste teken van een volgend blok (drie keer tikken): dat blok blijft heel.
    if (a.b !== z.b && !z.vast && z.pos === 0) {
      const v = z.b.previousElementSibling
      z = { b: v, pos: bewerkbaar(v) ? v.textContent.length : 0, vast: !bewerkbaar(v), heel: true }
    }
    // Een tabel gaat alleen weg als hij helemaal binnen de selectie valt.
    const magWeg = (x) => x.b.dataset.t === 'hr' || x.heel
    const knip = (b, van, tot) => {
      if (tot <= van) return
      const [sk, so] = domVanTekst(b, van, 'na')
      const [ek, eo] = domVanTekst(b, tot, 'voor')
      const r = doc.createRange()
      r.setStart(sk, so)
      r.setEnd(ek, eo)
      r.deleteContents()
    }
    if (a.b === z.b) {
      if (a.vast) {
        if (!magWeg(a) && !magWeg(z)) return
        const buur = a.b.nextElementSibling || a.b.previousElementSibling
        a.b.remove()
        borg()
        const doel = buur && buur.isConnected && bewerkbaar(buur) ? buur : root.lastElementChild
        caretIn(doel, 0, 'na')
        return
      }
      knip(a.b, a.pos, z.pos)
      schoon(a.b)
      caretIn(a.b, a.pos)
      controleerBlok(a.b)
      return
    }
    for (const b of tussen(a.b, z.b).slice(1, -1)) b.remove()
    let kop = a.b
    let staart = z.b
    if (a.vast) { if (magWeg(a)) { a.b.remove(); kop = null } }
    else knip(a.b, a.pos, a.b.textContent.length)
    if (z.vast) { if (magWeg(z)) { z.b.remove(); staart = null } }
    else knip(z.b, 0, z.pos)
    const kopOk = kop && bewerkbaar(kop)
    const staartOk = staart && bewerkbaar(staart)
    if (kopOk && staartOk && kop.nextElementSibling === staart) {
      for (const x of [...kop.querySelectorAll('br')]) x.remove()
      while (staart.firstChild) kop.append(staart.firstChild)
      staart.remove()
      schoon(kop)
      caretIn(kop, a.pos)
      controleerBlok(kop)
      return
    }
    if (kopOk) schoon(kop)
    if (staartOk) schoon(staart)
    borg()
    if (kopOk) caretIn(kop, a.pos)
    else if (staartOk) caretIn(staart, 0, 'na')
    else {
      const doel = [...root.children].find(bewerkbaar)
      if (doel) caretIn(doel, 0, 'na')
    }
    if (kopOk) controleerBlok(kop)
    if (staartOk) controleerBlok(staart)
  }

  function enter(zacht) {
    const g = grenzen()
    if (!g || !bewerkbaar(g.start.b)) return
    const b = g.start.b
    const t = b.dataset.t
    const lijst = isLijst(t)
    const plat = b.textContent
    // Enter op een leeg punt stopt de lijst.
    if (lijst && !zacht && !plat.trim()) {
      zetSoort(b, 'p', '')
      vulInline(b, '')
      zetCaret(b, 0)
      return
    }
    // '---' en Enter wordt een lijn.
    if (t === 'p' && LIJNREGEL.test(regelVan(b))) {
      const lijn = maak({ t: 'hr', pre: regelVan(b), voor: extra.get(b)?.voor || [] })
      const p = leegBlok('p', '')
      b.replaceWith(lijn)
      lijn.after(p)
      zetCaret(p, 0)
      inBeeld(p)
      return
    }
    const pos = tekstVoor(b, g.start.node, g.start.off)
    if (pos === 0 && plat.length > 0) {
      // Cursor vooraan: er komt een lege regel boven, het blok zelf blijft wat het is.
      const nieuw = lijst && !zacht ? leegBlok(t, volgendePre(b, 0)) : leegBlok('p', '')
      b.before(nieuw)
      if (t === 'ol' && !zacht) hernummer(nieuw)
      caretIn(b, 0, 'na')
      inBeeld(b)
      return
    }
    const [k, o] = domVanTekst(b, pos, 'voor')
    const r = doc.createRange()
    r.setStart(k, o)
    r.setEnd(b, b.childNodes.length)
    const staart = r.extractContents()
    const nieuw = lijst && !zacht ? leegBlok(t, volgendePre(b, 1)) : leegBlok('p', '')
    nieuw.textContent = ''
    nieuw.append(staart)
    b.after(nieuw)
    schoon(b)
    schoon(nieuw)
    if (nieuw.dataset.t === 'ol') hernummer(nieuw)
    caretIn(nieuw, 0, 'na')
    controleerBlok(b)
    controleerBlok(nieuw)
    inBeeld(nieuw)
  }

  // Backspace vooraan in een blok.
  function wisTerug(b) {
    if (b.dataset.t !== 'p') {
      zetSoort(b, 'p', '')
      caretIn(b, 0, 'na')
      controleerBlok(b)
      return
    }
    const v = b.previousElementSibling
    if (!v) return
    if (v.dataset.t === 'hr') { v.remove(); return }
    if (v.dataset.t === 'ruw') return
    const pos = v.textContent.length
    for (const x of [...v.querySelectorAll('br')]) x.remove()
    while (b.firstChild) v.append(b.firstChild)
    b.remove()
    schoon(v)
    caretIn(v, pos)
    controleerBlok(v)
  }
  // Delete achteraan in een blok.
  function wisVooruit(b) {
    const n = b.nextElementSibling
    if (!n) return
    if (n.dataset.t === 'hr') { n.remove(); return }
    if (n.dataset.t === 'ruw') return
    const pos = b.textContent.length
    for (const x of [...b.querySelectorAll('br')]) x.remove()
    while (n.firstChild) b.append(n.firstChild)
    n.remove()
    schoon(b)
    caretIn(b, pos)
    controleerBlok(b)
  }

  // Tekst invoegen op de cursor (zonder opmaak te veranderen).
  function typ(data) {
    const g = grenzen()
    if (!g || !bewerkbaar(g.start.b)) return null
    const b = g.start.b
    const pos = tekstVoor(b, g.start.node, g.start.off)
    const [k, o] = domVanTekst(b, pos, 'voor')
    if (k.nodeType === 3) {
      k.insertData(o, data)
      zetCaret(k, o + data.length)
    } else {
      const tn = doc.createTextNode(data)
      b.textContent = ''
      b.append(tn)
      zetCaret(tn, data.length)
    }
    return b
  }

  // Eén teken met de opmaak uit 'wacht' (⌘B zonder selectie, of net buiten een vet stuk).
  function typMetOpmaak(data) {
    const w = wacht
    wacht = null
    const g = grenzen()
    if (!g || !g.dicht || !bewerkbaar(g.start.b)) return false
    const b = g.start.b
    const pos = tekstVoor(b, g.start.node, g.start.off)
    const a = w.kaal ? {} : opmaakBij(g.start.node, b)
    for (const s of ['b', 'i']) {
      if (w[s] == null) continue
      if (w[s]) a[s] = 1
      else delete a[s]
    }
    const runs = knipRuns(runsVan(b), pos, pos)
    const nieuw = []
    let p = 0
    let gezet = false
    for (const x of runs) {
      if (!gezet && p >= pos) { nieuw.push({ ...a, t: data }); gezet = true }
      nieuw.push(x)
      p += x.t.length
    }
    if (!gezet) nieuw.push({ ...a, t: data })
    const md = runsNaarMd(nieuw)
    const plat = b.textContent
    if (inlineNaarDom(doc, md).textContent !== plat.slice(0, pos) + data + plat.slice(pos)) return false
    stap('typ')
    vulInline(b, md)
    caretIn(b, pos + data.length)
    return true
  }

  // Schuine tekst mag niet met een spatie beginnen; die spatie hoort ervoor.
  function spatiesUitSchuin(b) {
    for (const el of b.querySelectorAll('em, i')) {
      const t = el.firstChild
      if (!t || t.nodeType !== 3) continue
      const m = t.nodeValue.match(/^\s+/)
      if (!m) continue
      if (m[0].length < t.nodeValue.length) t.splitText(m[0].length)
      el.before(t)
    }
  }

  // Na typen: maakt van '- ', '# ', '1. ' of '→ ' aan het begin het juiste blok en van **vet** echt vet.
  function controleerBlok(b) {
    if (!b || !b.isConnected || !bewerkbaar(b)) return
    const cursor = () => {
      const g = grenzen()
      return g && g.dicht && g.start.b === b ? g.start : null
    }
    if (b.dataset.t === 'p') {
      const oudPre = b.dataset.pre || ''
      const regel = oudPre + inlineMd(b)
      if (AUTO.test(regel)) {
        const p = ontleedRegel(regel)
        if (p.t !== 'p' && p.t !== 'hr') {
          const c = cursor()
          const mdPos = c ? mdPositie(b, c.node, c.off) : null
          zetSoort(b, p.t, p.pre)
          vulInline(b, p.tekst)
          if (p.t === 'ol') hernummer(b)
          if (c) { const [k, o] = domPositie(b, Math.max(0, mdPos - (p.pre.length - oudPre.length))); zetCaret(k, o) }
        }
      }
    }
    spatiesUitSchuin(b)
    // Staat er iets anders in beeld dan wat de markdown van dit blok zou tekenen, dan tekenen we het blok opnieuw.
    const md = inlineMd(b)
    const vers = inlineNaarDom(doc, md)
    const proef = doc.createElement('div')
    proef.append(vers.cloneNode(true))
    if (proef.innerHTML !== b.innerHTML.replace(/<br>/g, '')) {
      const c = cursor()
      const mdPos = c ? mdPositie(b, c.node, c.off) : null
      b.textContent = ''
      b.append(vers)
      if (!b.firstChild) b.append(br())
      if (c) {
        const [k, o, buiten] = domPositie(b, mdPos)
        zetCaret(k, o)
        if (buiten) { const s = doc.getSelection(); wacht = { kaal: true, node: s.anchorNode, off: s.anchorOffset } }
      }
    }
  }

  function plak(ruwe) {
    let g = grenzen()
    if (!g) return
    if (!g.dicht) { wis(g); g = grenzen(); if (!g) return }
    const b = g.start.b
    if (!bewerkbaar(b)) return
    const regels = String(ruwe).replace(/\r\n?/g, '\n').split('\n')
    if (regels.length === 1) {
      if (!regels[0]) return
      controleerBlok(typ(regels[0]))
      return
    }
    const pos = tekstVoor(b, g.start.node, g.start.off)
    const [k, o] = domVanTekst(b, pos, 'voor')
    const r = doc.createRange()
    r.setStart(k, o)
    r.setEnd(b, b.childNodes.length)
    const houder = doc.createElement('div')
    houder.append(r.extractContents())
    schoon(houder)
    const staart = inlineMd(houder)
    const staartPlat = houder.textContent.length
    schoon(b)
    const alle = [regelVan(b) + regels[0], ...regels.slice(1, -1), regels[regels.length - 1] + staart]
    const { blokken, na } = ontleed(alle.join('\n'))
    const nieuw = blokken.map(maak)
    // De geplakte tekst eindigt op een lege regel: daar staat de cursor.
    if (na.length) nieuw.push(maak({ ...ontleedRegel(na[na.length - 1]), voor: na.slice(0, -1) }))
    extra.get(nieuw[0]).voor = [...(extra.get(b)?.voor || []), ...extra.get(nieuw[0]).voor]
    const laatste = nieuw[nieuw.length - 1]
    b.replaceWith(...nieuw)
    borg()
    if (bewerkbaar(laatste)) caretIn(laatste, Math.max(0, laatste.textContent.length - staartPlat))
    else {
      let doel = laatste.nextElementSibling
      while (doel && !bewerkbaar(doel)) doel = doel.nextElementSibling
      if (doel) caretIn(doel, 0, 'na')
    }
    if (laatste && laatste.isConnected) inBeeld(laatste)
  }

  // Markdown van wat geselecteerd is (voor kopiëren en knippen).
  function mdVanSelectie(g) {
    const lijst = tussen(g.start.b, g.eind.b)
    const uit = []
    lijst.forEach((b, i) => {
      if (i > 0) { const v = extra.get(b)?.voor; if (v?.length) uit.push(...v) }
      if (!bewerkbaar(b)) { uit.push(blokTekst(b)); return }
      const lengte = b.textContent.length
      const van = i === 0 ? tekstVoor(b, g.start.node, g.start.off) : 0
      const tot = i === lijst.length - 1 ? tekstVoor(b, g.eind.node, g.eind.off) : lengte
      if (lijst.length > 1 && van === 0 && tot === lengte) uit.push(blokTekst(b))
      else uit.push((lijst.length > 1 && van === 0 ? b.dataset.pre || '' : '') + runsNaarMd(deelRuns(runsVan(b), van, tot)))
    })
    return uit.join('\n')
  }

  // Vet of schuin aan/uit op de selectie; zonder selectie geldt het voor wat je daarna typt.
  function wisselInline(sleutel) {
    const g = grenzen()
    if (!g) return
    if (g.dicht) {
      if (!bewerkbaar(g.start.b)) return
      const nu = wacht && wacht[sleutel] != null ? !!wacht[sleutel] : !!opmaakBij(g.start.node, g.start.b)[sleutel]
      const s = doc.getSelection()
      wacht = { ...(wacht || {}), kaal: false, [sleutel]: !nu, node: s.anchorNode, off: s.anchorOffset }
      return
    }
    const delen = []
    for (const b of tussen(g.start.b, g.eind.b)) {
      if (!bewerkbaar(b)) continue
      const plat = b.textContent
      let van = b === g.start.b ? tekstVoor(b, g.start.node, g.start.off) : 0
      let tot = b === g.eind.b ? tekstVoor(b, g.eind.node, g.eind.off) : plat.length
      while (van < tot && /\s/.test(plat[van])) van++
      while (tot > van && /\s/.test(plat[tot - 1])) tot--
      if (tot > van) delen.push({ b, van, tot, plat, runs: runsVan(b) })
    }
    if (!delen.length) return
    const alle = delen.every(d => heeftOveral(d.runs, d.van, d.tot, sleutel))
    stap()
    for (const d of delen) {
      const md = runsNaarMd(zetOpmaak(d.runs, d.van, d.tot, sleutel, !alle))
      // Wat de opslagvorm niet kan (bijvoorbeeld vet binnen schuin) laten we zoals het was.
      if (inlineNaarDom(doc, md).textContent !== d.plat) continue
      vulInline(d.b, md)
    }
    const eerste = delen[0]
    const laatste = delen[delen.length - 1]
    const [ak, ao] = domVanTekst(eerste.b, eerste.van, 'na')
    const [fk, fo] = domVanTekst(laatste.b, laatste.tot, 'voor')
    zetSel(ak, ao, fk, fo)
    meld()
  }

  // Regel(s) wordt kop, opsomming, genummerd of pijl; nog een keer = weer gewone tekst.
  function pasBlok(soort) {
    const g = grenzen()
    if (!g) return
    const doel = { h1: 'h1', h2: 'h2', h3: 'h3', lijst: 'li', nummer: 'ol', pijl: 'pijl' }[soort]
    const alle = tussen(g.start.b, g.eind.b).filter(bewerkbaar)
    if (!alle.length) return
    const metTekst = alle.filter(b => b.textContent.trim())
    const lijst = alle.length > 1 && metTekst.length ? metTekst : alle
    const weg = lijst.every(b => b.dataset.t === doel)
    stap()
    let n = 0
    if (doel === 'ol' && !weg) {
      // Sluit aan op een genummerd punt direct erboven.
      const v = lijst[0].previousElementSibling
      if (v && v.dataset.t === 'ol' && !lijst.includes(v)) n = Number((v.dataset.pre.match(/\d+/) || ['0'])[0])
    }
    for (const b of lijst) {
      if (weg) { zetSoort(b, 'p', ''); controleerBlok(b); continue }
      const inspring = isLijst(b.dataset.t) && isLijst(doel) ? inspringVan(b.dataset.pre) : ''
      const pre = doel === 'li' ? `${inspring}- ` : doel === 'pijl' ? `${inspring}→ ` : doel === 'ol' ? `${inspring}${++n}. ` : `${'#'.repeat(Number(doel[1]))} `
      zetSoort(b, doel, pre)
    }
    meld()
  }

  // Tab / Shift+Tab: punten in- of uitspringen.
  function spring(uit) {
    const g = grenzen()
    if (!g) return
    const lijst = tussen(g.start.b, g.eind.b).filter(b => isLijst(b.dataset.t))
    if (!lijst.length) return
    stap()
    for (const b of lijst) {
      const pre = b.dataset.pre || ''
      zetSoort(b, b.dataset.t, uit ? pre.replace(/^ {1,2}|^\t/, '') : `  ${pre}`)
    }
    meld()
  }

  function voegLijnIn() {
    const g = grenzen()
    if (!g) return
    const b = g.eind.b
    stap()
    const lijn = maak({ t: 'hr', pre: '---', voor: [] })
    if (bewerkbaar(b) && b.dataset.t === 'p' && !b.textContent) {
      b.before(lijn)
      zetCaret(b, 0)
    } else {
      b.after(lijn)
      let n = lijn.nextElementSibling
      if (!n || !bewerkbaar(n)) { n = leegBlok('p', ''); lijn.after(n) }
      caretIn(n, 0, 'na')
      inBeeld(n)
    }
    klaarOp()
  }

  function pas(soort) {
    if (soort === 'b' || soort === 'i') wisselInline(soort)
    else if (soort === 'lijn') voegLijnIn()
    else if (soort === 'in' || soort === 'uit') spring(soort === 'uit')
    else if (soort === 'terug') ongedaan()
    else if (soort === 'vooruit') opnieuw()
    else pasBlok(soort)
  }

  // ── Tabel: tik = ruwe tekst van dat blok ──
  function openRuw(el) {
    if (el.querySelector('textarea')) return
    stap()
    const x = extra.get(el)
    const ta = doc.createElement('textarea')
    ta.className = 'bd-ruwvak'
    ta.value = x.regels
    ta.spellcheck = false
    ta.rows = Math.min(18, x.regels.split('\n').length + 1)
    el.textContent = ''
    el.title = ''
    el.append(ta)
    ta.addEventListener('input', () => { x.regels = ta.value; meld() })
    ta.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); ta.blur() } })
    ta.addEventListener('blur', () => sluitRuw(el))
    ta.focus({ preventScroll: true })
  }
  function sluitRuw(el) {
    if (!el.isConnected) return
    const x = extra.get(el)
    const tekst = x.regels
    if (!tekst.trim()) {
      el.remove()
      klaarOp()
      return
    }
    const { blokken, na } = ontleed(tekst)
    if (blokken.length === 1 && blokken[0].t === 'ruw' && !blokken[0].voor.length && !na.length) {
      tekenTabel(doc, el)
      meld()
      return
    }
    // Er staat nu ook iets anders dan een tabel: gewoon opnieuw indelen.
    const nieuw = blokken.map(maak)
    extra.get(nieuw[0]).voor = [...(x.voor || []), ...extra.get(nieuw[0]).voor]
    if (na.length) {
      const volgend = el.nextElementSibling
      const vx = volgend && extra.get(volgend)
      if (vx && !vx.virtueel) vx.voor = [...na, ...(vx.voor || [])]
      else { const r = extra.get(root); r.na = [...na, ...(r.na || [])] }
    }
    el.replaceWith(...nieuw)
    klaarOp()
  }

  // ── Vangnet: de browser deed toch zelf iets met de indeling ──
  function normaliseer() {
    let fout = false
    for (const k of root.childNodes) {
      if (k.nodeType !== 1 || !k.dataset.t) { fout = true; break }
      if (bewerkbaar(k) && k.firstElementChild && k.querySelector('div, p, br')) {
        if (k.querySelector('div, p')) { fout = true; break }
        // Een regeleinde midden in een blok.
        if (k.textContent && [...k.querySelectorAll('br')].some(x => x.nextSibling || x.parentNode !== k)) { fout = true; break }
      }
    }
    if (!fout) return
    const s = doc.getSelection()
    const anker = s && s.rangeCount ? [s.anchorNode, s.anchorOffset] : null
    for (const k of [...root.childNodes]) {
      if (k.nodeType === 3) {
        const p = leegBlok('p', '')
        p.textContent = ''
        k.before(p)
        p.append(k)
      } else if (k.nodeType !== 1) k.remove()
      else if (k.nodeName === 'BR') k.replaceWith(leegBlok('p', ''))
      else if (!k.dataset.t) {
        const p = leegBlok('p', '')
        p.textContent = ''
        while (k.firstChild) p.append(k.firstChild)
        k.replaceWith(p)
        if (!p.firstChild) p.append(br())
      }
    }
    for (const b of [...root.children]) {
      if (!bewerkbaar(b)) continue
      let n
      while ((n = b.querySelector('div, p'))) {
        const r = doc.createRange()
        r.setStartAfter(n)
        r.setEnd(b, b.childNodes.length)
        const rest = leegBlok('p', '')
        rest.textContent = ''
        rest.append(r.extractContents())
        let los = n
        if (!n.dataset || !n.dataset.t) {
          los = leegBlok('p', '')
          los.textContent = ''
          while (n.firstChild) los.append(n.firstChild)
        }
        n.remove()
        b.after(los)
        if (rest.textContent) los.after(rest)
        if (!los.firstChild) los.append(br())
      }
      let x
      while (b.textContent && (x = [...b.querySelectorAll('br')].find(y => y.nextSibling || y.parentNode !== b))) {
        const r = doc.createRange()
        r.setStartAfter(x)
        r.setEnd(b, b.childNodes.length)
        const rest = leegBlok('p', '')
        rest.textContent = ''
        rest.append(r.extractContents())
        x.remove()
        b.after(rest)
        if (!rest.firstChild) rest.append(br())
      }
      if (!b.firstChild) b.append(br())
    }
    if (anker && anker[0] && anker[0].isConnected && root.contains(anker[0])) {
      try { zetCaret(anker[0], Math.min(anker[1], anker[0].nodeType === 3 ? anker[0].nodeValue.length : anker[0].childNodes.length)) } catch { /* leeg */ }
    }
  }

  // ── Gebeurtenissen ──
  function opBeforeInput(e) {
    if (inVak(e.target)) return
    const type = e.inputType || ''
    if (type === 'historyUndo') { e.preventDefault(); ongedaan(); return }
    if (type === 'historyRedo') { e.preventDefault(); opnieuw(); return }
    if (type === 'formatBold' || type === 'formatItalic') { e.preventDefault(); pas(type === 'formatBold' ? 'b' : 'i'); return }
    if (type.startsWith('format')) { e.preventDefault(); return }
    // Opmaak via het menu van de browser of het toetsenbord: zelfde weg als de balk.
    const viaMenu = { insertOrderedList: 'nummer', insertUnorderedList: 'lijst', insertHorizontalRule: 'lijn' }[type]
    if (viaMenu) { e.preventDefault(); pas(viaMenu); return }
    if (type === 'insertLink') { e.preventDefault(); return }
    const g = grenzen()
    if (!g) return
    if (type === 'insertFromPaste' || type === 'insertFromDrop' || type === 'insertFromPasteAsQuotation') {
      e.preventDefault()
      const t = e.dataTransfer && e.dataTransfer.getData('text/plain')
      if (t) { stap(); plak(t); klaarOp() }
      return
    }
    if (type === 'insertParagraph' || type === 'insertLineBreak') {
      e.preventDefault()
      stap()
      if (!g.dicht) wis(g)
      enter(type === 'insertLineBreak')
      klaarOp()
      return
    }
    if (type.startsWith('delete')) {
      if (!g.dicht) { e.preventDefault(); stap(); wis(g); klaarOp(); return }
      const b = g.start.b
      if (!bewerkbaar(b)) { e.preventDefault(); return }
      const pos = tekstVoor(b, g.start.node, g.start.off)
      if (type.endsWith('Backward') && pos === 0) { e.preventDefault(); stap(); wisTerug(b); klaarOp(); return }
      if (type.endsWith('Forward') && pos === b.textContent.length) { e.preventDefault(); stap(); wisVooruit(b); klaarOp(); return }
      stap('typ')
      return
    }
    if (type === 'insertReplacementText') { stap('typ'); return }
    if (type.startsWith('insert')) {
      if (!g.dicht) {
        stap()
        wis(g)
        if (type === 'insertText' && e.cancelable && e.data != null) {
          e.preventDefault()
          controleerBlok(typ(e.data))
        }
        klaarOp()
        return
      }
      if (type === 'insertText' && wacht && e.cancelable && e.data && !samenstellen && typMetOpmaak(e.data)) {
        e.preventDefault()
        klaarOp()
        return
      }
      stap('typ')
    }
  }

  function opInput(e) {
    if (inVak(e.target)) return
    normaliseer()
    if (!samenstellen && !e.isComposing) {
      const g = grenzen()
      if (g && g.dicht) controleerBlok(g.start.b)
    }
    klaarOp()
  }

  function opKeydown(e) {
    if (inVak(e.target)) return
    const mod = e.metaKey || e.ctrlKey
    const k = (e.key || '').toLowerCase()
    if (mod && !e.altKey && (k === 'b' || k === 'i')) { e.preventDefault(); pas(k); return }
    if (mod && !e.altKey && k === 'z') { e.preventDefault(); if (e.shiftKey) opnieuw(); else ongedaan(); return }
    if (mod && !e.altKey && k === 'y') { e.preventDefault(); opnieuw(); return }
    if (e.key === 'Tab' && !mod && !e.altKey) { e.preventDefault(); spring(e.shiftKey) }
  }

  function opPaste(e) {
    if (inVak(e.target)) return
    e.preventDefault()
    const t = e.clipboardData ? e.clipboardData.getData('text/plain') : ''
    if (!t) return
    stap()
    plak(t)
    klaarOp()
  }
  function opCopy(e) {
    if (inVak(e.target)) return
    const g = grenzen()
    if (!g || g.dicht || !e.clipboardData) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', mdVanSelectie(g))
    if (e.type === 'cut') { stap(); wis(g); klaarOp() }
  }
  const opSleep = (e) => { if (!inVak(e.target)) e.preventDefault() }
  function opKlik(e) {
    const el = e.target.closest ? e.target.closest('[data-t="ruw"]') : null
    if (el && root.contains(el) && !e.target.closest('textarea')) openRuw(el)
  }
  function opFocusUit(e) {
    if (e.relatedTarget && root.contains(e.relatedTarget)) return
    if (onBlur) onBlur()
  }
  function opSelectie() {
    const s = doc.getSelection()
    if (!s || !s.rangeCount) return
    const r = s.getRangeAt(0)
    if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return
    if (inVak(r.startContainer)) return
    laatsteBereik = r.cloneRange()
    if (wacht && (s.anchorNode !== wacht.node || s.anchorOffset !== wacht.off || !r.collapsed)) wacht = null
  }
  const opStartSamen = () => { samenstellen = true }
  function opEindSamen() {
    samenstellen = false
    normaliseer()
    const g = grenzen()
    if (g && g.dicht) controleerBlok(g.start.b)
    klaarOp()
  }

  // ── Regelnummers (zelfde telling als de leesweergave) ──
  const aantalRegels = (b) => {
    const x = extra.get(b)
    if (x?.virtueel && !b.textContent) return 0
    return (x?.voor?.length || 0) + (b.dataset.t === 'ruw' ? String(x?.regels ?? '').split('\n').length : 1)
  }
  function blokBijRegel(i) {
    let n = 0
    for (const b of root.children) {
      n += aantalRegels(b)
      if (i < n) return b
    }
    return root.lastElementChild
  }
  function regelVanBlok(doel) {
    let n = 0
    for (const b of root.children) {
      if (b === doel) return n + (extra.get(b)?.voor?.length || 0)
      n += aantalRegels(b)
    }
    return n
  }

  // Zet het vlak op dezelfde plek als waar je in de leesweergave was en de cursor waar je tikte.
  function begin({ regel = null, top = null, x = null, y = null, einde = false, selecteer = false, focus = true } = {}) {
    const bewerkbare = [...root.children].filter(bewerkbaar)
    let b = regel != null ? blokBijRegel(regel) : null
    if (einde || !b) b = einde || focus ? bewerkbare[bewerkbare.length - 1] || null : null
    if (b && einde) inBeeld(b)
    else if (b && top != null && scroller) scroller.scrollTop += b.getBoundingClientRect().top - top
    if (!focus || !b) return
    root.focus({ preventScroll: true })
    if (!bewerkbaar(b)) return
    if (selecteer && b.textContent) {
      const [ak, ao] = domVanTekst(b, 0, 'na')
      const [fk, fo] = domVanTekst(b, b.textContent.length, 'voor')
      zetSel(ak, ao, fk, fo)
      return
    }
    if (x != null && y != null) {
      let k = null
      let o = 0
      if (doc.caretPositionFromPoint) { const p = doc.caretPositionFromPoint(x, y); if (p) { k = p.offsetNode; o = p.offset } }
      else if (doc.caretRangeFromPoint) { const r = doc.caretRangeFromPoint(x, y); if (r) { k = r.startContainer; o = r.startOffset } }
      if (k && b.contains(k)) { zetCaret(k, o); return }
    }
    caretIn(b, b.textContent.length)
  }

  // Bovenste blok dat nu in beeld is, om na sluiten op dezelfde plek verder te lezen.
  function bovenste() {
    const grens = scroller ? scroller.getBoundingClientRect().top : 0
    for (const b of root.children) {
      const r = b.getBoundingClientRect()
      if (r.bottom > grens + 1) return { regel: regelVanBlok(b), top: r.top }
    }
    return null
  }

  // '+ Onderdeel': nieuw kopje onderaan, klaar om te overschrijven.
  function voegOnderdeelToe() {
    stap()
    laad(`${huidig.replace(/\s*$/, '')}\n\n## Nieuw onderdeel\n`)
    meld()
    const koppen = root.querySelectorAll(':scope > [data-t="h2"]')
    const b = koppen[koppen.length - 1]
    if (!b) return
    root.focus({ preventScroll: true })
    const [ak, ao] = domVanTekst(b, 0, 'na')
    const [fk, fo] = domVanTekst(b, b.textContent.length, 'voor')
    zetSel(ak, ao, fk, fo)
    inBeeld(b)
  }

  function focusEind() {
    const bewerkbare = [...root.children].filter(bewerkbaar)
    const b = bewerkbare[bewerkbare.length - 1]
    if (!b) return
    root.focus({ preventScroll: true })
    caretIn(b, b.textContent.length)
  }

  // ── Start ──
  laad(huidig)
  // Openen en direct opslaan moet teken voor teken hetzelfde geven; anders opent het scherm de ruwe vorm.
  const ok = naarMarkdown(root) === huidig

  const luister = [
    [root, 'beforeinput', opBeforeInput], [root, 'input', opInput], [root, 'keydown', opKeydown],
    [root, 'paste', opPaste], [root, 'copy', opCopy], [root, 'cut', opCopy],
    [root, 'dragstart', opSleep], [root, 'drop', opSleep], [root, 'click', opKlik], [root, 'focusout', opFocusUit],
    [root, 'compositionstart', opStartSamen], [root, 'compositionend', opEindSamen],
    [doc, 'selectionchange', opSelectie],
  ]
  if (ok) for (const [el, soort, f] of luister) el.addEventListener(soort, f)

  return {
    ok,
    pas,
    begin,
    bovenste,
    voegOnderdeelToe,
    focusEind,
    markdown: () => { meld(); return huidig },
    // Alleen voor de test: opslaan zonder het vangnet van de oorspronkelijke regels.
    markdownZonderVangnet: () => naarMarkdown(root, true),
    sluit: () => {
      for (const [el, soort, f] of luister) el.removeEventListener(soort, f)
      if (meter) meter.remove()
      root.textContent = ''
    },
  }
}
