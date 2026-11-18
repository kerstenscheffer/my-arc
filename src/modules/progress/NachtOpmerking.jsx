// src/modules/progress/NachtOpmerking.jsx
//
// "Wat speelde er vannacht?" in het slaap-logscherm (18 nov 2026, Kersten).
// Een zoek- en notitiebalk: tik erop en je ziet de opties die vaak terugkomen,
// begin te typen en de best passende staat bovenaan ("veel" → "Vaak wakker
// geworden", ook met typefouten zoals "wakksr"). Aantikken = een chip. Wat je
// typt en niet aantikt, wordt bewaard als eigen notitie. Verplicht: minstens
// één keuze of een notitie.
//
// Zo verwoorden klanten hun nacht in vaste termen, en kunnen de tips in het
// slaapinzicht (slaapTips.js) er gericht op inspelen.
//
// Opslag blijft tekst in sleep_logs.struggles (oude apps en de coach lezen die
// gewoon): de keuzes plus de notitie, met ' · ' ertussen.

import { useMemo, useRef, useState } from 'react'
import { Search, X, Check } from 'lucide-react'

// [label, zoekwoorden]
const OPTIES = [
  ['Goed geslapen', 'goed lekker prima uitgerust top fijn'],
  ['Moeilijk in slaap gekomen', 'inslapen moeilijk lang wakker liggen niet slapen'],
  ['Vaak wakker geworden', 'veel vaak wakker doorslapen onrustig'],
  ['Te vroeg wakker', 'vroeg wakker'],
  ['Piekeren of stress', 'piekeren stress hoofd druk zorgen nadenken onrust'],
  ['Laat op mijn scherm', 'scherm telefoon netflix serie gamen tv laptop tiktok insta'],
  ['Laat cafeïne gehad', 'cafeine koffie cola energy thee preworkout'],
  ['Laat of zwaar gegeten', 'gegeten eten laat zwaar honger vol snack'],
  ['Alcohol gedronken', 'alcohol bier wijn drank borrel feest'],
  ['Wakker om te plassen', 'plassen wc toilet'],
  ['Te warm', 'warm heet zweten'],
  ['Lawaai of licht', 'lawaai geluid licht buren snurken partner'],
  ['Kinderen wakker', 'kinderen kind baby zoon dochter'],
  ['Pijn of spierpijn', 'pijn spierpijn rug blessure hoofdpijn'],
  ['Laat getraind', 'getraind training sport gym laat'],
]
const LABELS = OPTIES.map(o => o[0])
const GOED = 'Goed geslapen'
const SCHEIDING = ' · '
const PAARS = '#c084fc'

const woordjes = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(Boolean)
const DOEL = OPTIES.map(([label, extra]) => woordjes(`${label} ${extra}`))

// Hoeveel getypte woorden passen bij een optie. Begin van een woord telt
// (eerste 4 letters), zodat "wakksr" nog op "wakker" valt.
const score = (zoekWoorden, i) => zoekWoorden.reduce((n, w) => {
  const kop = w.slice(0, Math.min(4, w.length))
  return n + (DOEL[i].some(d => d.startsWith(kop)) ? 1 : 0)
}, 0)

const lees = (tekst) => {
  const delen = String(tekst || '').split(SCHEIDING).map(x => x.trim()).filter(Boolean)
  return { keuzes: delen.filter(d => LABELS.includes(d)), notitie: delen.filter(d => !LABELS.includes(d)).join(', ') }
}
const schrijf = (keuzes, notitie) =>
  [...LABELS.filter(o => keuzes.includes(o)), String(notitie || '').replace(/ · /g, ', ').trim()].filter(Boolean).join(SCHEIDING)

export default function NachtOpmerking({ waarde, onChange }) {
  const { keuzes } = lees(waarde)
  // De notitie is ook de zoektekst; lokaal, anders verdwijnt een spatie tijdens het typen.
  const [tekst, setTekst] = useState(() => lees(waarde).notitie)
  const [open, setOpen] = useState(false)
  const invoer = useRef(null)

  const lijst = useMemo(() => {
    const zw = woordjes(tekst).filter(w => w.length >= 2)
    const rijen = OPTIES.map(([label], i) => ({ label, i, s: zw.length ? score(zw, i) : 0 }))
    if (!zw.length) return rijen
    return rijen.filter(r => r.s > 0).sort((a, b) => b.s - a.s || a.i - b.i)
  }, [tekst])

  const zetTekst = (v) => { setTekst(v); onChange(schrijf(keuzes, v)) }
  const kies = (label) => {
    let nieuw
    if (keuzes.includes(label)) nieuw = keuzes.filter(k => k !== label)
    else if (label === GOED) nieuw = [GOED] // goed geslapen sluit de rest uit
    else nieuw = [...keuzes.filter(k => k !== GOED), label]
    // De getypte tekst was een zoekopdracht: die is nu een keuze geworden.
    setTekst('')
    onChange(schrijf(nieuw, ''))
  }
  const haalWeg = (label) => onChange(schrijf(keuzes.filter(k => k !== label), tekst))

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>Wat speelde er vannacht?</div>

      {keuzes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {keuzes.map(k => (
            <button key={k} type="button" onClick={() => haalWeg(k)} aria-label={`${k} weghalen`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 0.55rem 0 0.7rem', borderRadius: 999,
              background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(192,132,252,0.45)', color: '#fff',
              fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation',
            }}>
              {k} <X size={13} strokeWidth={3} color={PAARS} />
            </button>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '0 0.8rem',
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${open ? 'rgba(192,132,252,0.55)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12,
      }}>
        <Search size={16} strokeWidth={2.6} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
        <input
          ref={invoer}
          value={tekst}
          onChange={e => { zetTekst(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={keuzes.length ? 'Nog iets? Zoek of typ een notitie' : 'Zoek of typ, bv. wakker, stress, koffie'}
          enterKeyHint="done"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); invoer.current?.blur() } }}
          style={{
            flex: 1, minWidth: 0, height: 46, background: 'none', border: 'none', outline: 'none', padding: 0,
            color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700,
          }}
        />
        {tekst && (
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => zetTekst('')} aria-label="Tekst wissen" style={{
            width: 28, height: 28, padding: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={15} strokeWidth={2.8} /></button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 6, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
          {lijst.map((r, n) => {
            const aan = keuzes.includes(r.label)
            return (
              <button key={r.label} type="button" onMouseDown={e => e.preventDefault()} onClick={() => kies(r.label)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '0.65rem 0.8rem', background: aan ? 'rgba(168,85,247,0.14)' : 'transparent', border: 'none',
                borderTop: n ? '1px solid rgba(255,255,255,0.06)' : 'none', color: aan ? '#fff' : 'rgba(255,255,255,0.82)',
                fontFamily: 'inherit', fontSize: '0.86rem', fontWeight: aan ? 900 : 700, textAlign: 'left', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                {r.label}
                {aan && <Check size={16} strokeWidth={3} color={PAARS} />}
              </button>
            )
          })}
          {tekst.trim() && (
            <div style={{
              padding: '0.6rem 0.8rem', borderTop: lijst.length ? '1px solid rgba(255,255,255,0.06)' : 'none',
              fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
            }}>
              Niets passends? <span style={{ color: PAARS, fontWeight: 900 }}>“{tekst.trim()}”</span> wordt bewaard als notitie.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
