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
import { X, Check, Plus, ChevronDown } from 'lucide-react'

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

// Tekst → keuzes (vaste opties) en notities (eigen tekst), beide als chip.
const lees = (tekst) => {
  const delen = String(tekst || '').split(SCHEIDING).map(x => x.trim()).filter(Boolean)
  return { keuzes: delen.filter(d => LABELS.includes(d)), notities: delen.filter(d => !LABELS.includes(d)) }
}
const schoon = (t) => String(t || '').replace(/ · /g, ', ').trim()
const schrijf = (keuzes, notities, lopend = '') =>
  [...LABELS.filter(o => keuzes.includes(o)), ...notities.map(schoon), schoon(lopend)].filter(Boolean).join(SCHEIDING)

export default function NachtOpmerking({ waarde, onChange }) {
  // Wat nog in de balk staat (niet afgevinkt) telt ook mee bij opslaan; daarom
  // staat de bovenliggende waarde altijd op keuzes + notities + lopende tekst.
  const [tekst, setTekst] = useState('')
  const basis = lees(waarde)
  const keuzes = basis.keuzes
  const notities = tekst.trim() ? basis.notities.filter((n, i, l) => !(i === l.length - 1 && n === schoon(tekst))) : basis.notities
  const [open, setOpen] = useState(false)
  const invoer = useRef(null)

  const lijst = useMemo(() => {
    const zw = woordjes(tekst).filter(w => w.length >= 2)
    const rijen = OPTIES.map(([label], i) => ({ label, i, s: zw.length ? score(zw, i) : 0 }))
    if (!zw.length) return rijen
    return rijen.filter(r => r.s > 0).sort((a, b) => b.s - a.s || a.i - b.i)
  }, [tekst])

  const zetTekst = (v) => { setTekst(v); onChange(schrijf(keuzes, notities, v)) }
  // Check in de balk (of Enter): de getypte tekst wordt een notitie-chip.
  const bewaarNotitie = () => {
    const t = schoon(tekst)
    if (!t) return
    setTekst('')
    onChange(schrijf(keuzes, notities.includes(t) ? notities : [...notities, t]))
  }
  const kies = (label) => {
    let nieuw
    if (keuzes.includes(label)) nieuw = keuzes.filter(k => k !== label)
    else if (label === GOED) nieuw = [GOED] // goed geslapen sluit de rest uit
    else nieuw = [...keuzes.filter(k => k !== GOED), label]
    // De getypte tekst was een zoekopdracht: die is nu een keuze geworden.
    setTekst('')
    onChange(schrijf(nieuw, notities))
  }
  const haalWeg = (label) => onChange(schrijf(keuzes.filter(k => k !== label), notities.filter(n => n !== label), tekst))

  const chip = (k, notitie) => (
    <button key={k} type="button" onClick={() => haalWeg(k)} aria-label={`${k} weghalen`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 28, padding: 0,
      background: 'none', border: 'none', color: notitie ? 'rgba(255,255,255,0.85)' : '#fff', textAlign: 'left',
      fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation',
    }}>
      {notitie ? `“${k}”` : k} <X size={13} strokeWidth={3} color={notitie ? 'rgba(255,255,255,0.6)' : PAARS} style={{ flexShrink: 0 }} />
    </button>
  )

  const randKleur = open ? 'rgba(192,132,252,0.55)' : 'rgba(255,255,255,0.12)'

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>Wat speelde er vannacht?</div>

      {(keuzes.length > 0 || notities.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 14, rowGap: 2, marginBottom: 6 }}>
          {keuzes.map(k => chip(k, false))}
          {notities.map(n => chip(n, true))}
        </div>
      )}

      {/* Balk en lijst als één geheel: open = de lijst hangt direct onder de balk. */}
      <div style={{ border: `1px solid ${randKleur}`, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 48, padding: '0 0.4rem 0 0.85rem' }}>
          <input
            ref={invoer}
            value={tekst}
            onChange={e => { zetTekst(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={keuzes.length || notities.length ? 'Nog iets? Kies of typ' : 'Kies of typ, bv. wakker, stress, koffie'}
            enterKeyHint="done"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); bewaarNotitie() } }}
            style={{
              flex: 1, minWidth: 0, height: 46, background: 'none', border: 'none', outline: 'none', padding: 0,
              color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700,
            }}
          />
          {tekst.trim() ? (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={bewaarNotitie} aria-label="Notitie bewaren" style={{
              width: 34, height: 34, flexShrink: 0, padding: 0, borderRadius: '50%', background: PAARS, border: 'none', color: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation',
            }}><Check size={18} strokeWidth={3.2} /></button>
          ) : (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { if (open) { setOpen(false); invoer.current?.blur() } else invoer.current?.focus() }}
              aria-label={open ? 'Lijst sluiten' : 'Lijst openen'} style={{
                width: 34, height: 34, flexShrink: 0, padding: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}><ChevronDown size={19} strokeWidth={2.8} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} /></button>
          )}
        </div>

        {open && (
          <div style={{ borderTop: `1px solid ${randKleur}`, maxHeight: 300, overflowY: 'auto', background: '#121212' }}>
            {lijst.map((r, n) => {
              const aan = keuzes.includes(r.label)
              return (
                <button key={r.label} type="button" onMouseDown={e => e.preventDefault()} onClick={() => kies(r.label)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '0.7rem 0.85rem', background: aan ? 'rgba(168,85,247,0.14)' : 'transparent', border: 'none',
                  borderTop: n ? '1px solid rgba(255,255,255,0.06)' : 'none', color: aan ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontFamily: 'inherit', fontSize: '0.86rem', fontWeight: aan ? 900 : 700, textAlign: 'left', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  {r.label}
                  {aan
                    ? <Check size={16} strokeWidth={3} color={PAARS} />
                    : <Plus size={16} strokeWidth={2.8} color="rgba(255,255,255,0.4)" />}
                </button>
              )
            })}
            {tekst.trim() && (
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={bewaarNotitie} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '0.7rem 0.85rem', background: 'transparent', border: 'none',
                borderTop: lijst.length ? '1px solid rgba(255,255,255,0.06)' : 'none',
                fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: 'left', cursor: 'pointer',
              }}>
                <span>Als notitie: <span style={{ color: PAARS, fontWeight: 900 }}>“{tekst.trim()}”</span></span>
                <Check size={16} strokeWidth={3} color={PAARS} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
