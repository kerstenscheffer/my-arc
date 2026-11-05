// src/modules/business-os/NieuweMannen.jsx
//
// Het blok Nieuwe mannen (5 nov 2026): deze week tegen vorige week en staafjes van
// 8 weken, met het doel van 700 als lijn. Staat boven de keten en in het paneel De keten.
// Telling en rekenregels: nieuweMannenData.js.
//
// Eén staaf: bekend (vol groen) met de schatting erbovenop (lichter groen). Lopende week
// met stippelrand en het label "loopt". Tikken of erover bewegen toont man, vrouw en leeg
// op een vaste regel, zodat dit op een telefoon net zo werkt en er niets verspringt.

import { useState } from 'react'
import { DOEL_NIEUWE_MANNEN } from './nieuweMannenData'

const GROEN = '#10b981'
const GROEN_LICHT = 'rgba(16,185,129,0.38)'
const ZACHT = 'rgba(255,255,255,0.6)'
const NUM = { fontVariantNumeric: 'tabular-nums' }
const CIJFER_H = 14 // cijfer boven de staaf
const DATUM_H = 17 // datum onder de staaf, met de ruimte erboven

const kortDatum = (dag) => new Date(`${dag}T12:00:00Z`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '')
const getal = (n) => Number(n).toLocaleString('nl-NL')

function WeekCijfer({ titel, week, smal }) {
  // Smal: titel en cijfers op één regel, anders blijft er op een telefoon weinig over voor de tabel.
  const groot = { ...NUM, fontSize: smal ? 18 : 26, fontWeight: 900, color: '#fff', lineHeight: 1.1 }
  const klein = { fontSize: 12, fontWeight: 800, color: ZACHT, marginLeft: 4 }
  return (
    <div style={smal ? { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 } : { minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: ZACHT, whiteSpace: 'nowrap' }}>{titel}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: smal ? 0 : 2 }}>
        <span style={{ whiteSpace: 'nowrap' }}><span style={groot}>{getal(week.bekend)}</span><span style={klein}>bekend</span></span>
        <span style={{ whiteSpace: 'nowrap' }}><span style={groot}>≈{getal(week.geschat)}</span><span style={klein}>geschat</span></span>
      </div>
    </div>
  )
}

function Staafjes({ weken, gekozen, onKies, hoogte }) {
  const schaal = Math.max(DOEL_NIEUWE_MANNEN, ...weken.map(w => w.geschat))
  const px = (n) => (n > 0 ? Math.max(2, Math.round((n / schaal) * hoogte)) : 0)
  const doelVanOnder = (DOEL_NIEUWE_MANNEN / schaal) * hoogte
  return (
    <div style={{ position: 'relative', height: CIJFER_H + hoogte + DATUM_H, display: 'flex', alignItems: 'flex-end', gap: 4, minWidth: 0 }} onMouseLeave={() => onKies(null, 'hover')}>
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: DATUM_H + doelVanOnder, borderTop: '1.5px dashed rgba(255,255,255,0.55)', pointerEvents: 'none', zIndex: 1 }}>
        <span style={{ ...NUM, position: 'absolute', right: 0, bottom: 1, fontSize: 11, fontWeight: 800, color: '#fff' }}>doel {DOEL_NIEUWE_MANNEN}</span>
      </div>
      {weken.map((w) => {
        const aan = gekozen === w.maandag
        const hBekend = px(w.bekend)
        const hTotaal = Math.max(px(w.geschat), hBekend)
        return (
          <button
            key={w.maandag}
            type="button"
            aria-pressed={aan}
            aria-label={`Week van ${kortDatum(w.maandag)}${w.loopt ? ', loopt nog' : ''}: ${w.bekend} bekend, ongeveer ${w.geschat} geschat, man ${w.man}, vrouw ${w.vrouw}, leeg ${w.leeg}`}
            onClick={() => onKies(w.maandag, 'klik')}
            onMouseEnter={() => onKies(w.maandag, 'hover')}
            style={{
              flex: '1 1 0', minWidth: 0, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
            }}
          >
            <span style={{ ...NUM, position: 'relative', zIndex: 2, fontSize: 11, fontWeight: 900, lineHeight: `${CIJFER_H}px`, whiteSpace: 'nowrap' }}>≈{getal(w.geschat)}</span>
            <span style={{
              width: '100%', maxWidth: 34, height: hTotaal, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: hTotaal > hBekend ? 2 : 0,
              borderRadius: '4px 4px 0 0', overflow: 'hidden', outline: w.loopt ? '1.5px dashed #fff' : 'none', outlineOffset: 1,
            }}>
              <span style={{ flex: 1, minHeight: 0, background: GROEN_LICHT }} />
              <span style={{ height: hBekend, flexShrink: 0, background: GROEN }} />
            </span>
            <span style={{
              ...NUM, height: DATUM_H - 2, marginTop: 2, fontSize: 11, fontWeight: w.loopt || aan ? 900 : 700, lineHeight: `${DATUM_H - 2}px`, whiteSpace: 'nowrap',
              color: w.loopt || aan ? '#fff' : ZACHT,
            }}>{w.loopt ? 'loopt' : kortDatum(w.maandag)}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function NieuweMannen({ weken, fout, smal }) {
  // Klik zet een week vast; bewegen toont tijdelijk een andere. Zonder keuze: de lopende week.
  const [vast, setVast] = useState(null)
  const [zweef, setZweef] = useState(null)
  const kies = (dag, hoe) => {
    if (hoe === 'hover') setZweef(dag)
    else setVast(dag)
  }

  if (fout) return <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Nieuwe mannen laadt niet: {fout}</div>
  if (!weken) return <div style={{ fontSize: 13, fontWeight: 700, color: ZACHT, minHeight: 24 }}>Nieuwe mannen laden…</div>

  const nu = weken[weken.length - 1]
  const vorige = weken[weken.length - 2]
  const toon = weken.find(w => w.maandag === (zweef || vast)) || nu

  return (
    <div style={{ display: 'flex', flexDirection: smal ? 'column' : 'row', alignItems: smal ? 'stretch' : 'flex-end', gap: smal ? 10 : 28 }}>
      <div style={{ flexShrink: 0, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
          Nieuwe mannen <span style={{ ...NUM, fontSize: 12, fontWeight: 800, color: ZACHT, marginLeft: 6 }}>doel {DOEL_NIEUWE_MANNEN} per week</span>
        </div>
        <div style={{ display: 'flex', flexDirection: smal ? 'column' : 'row', flexWrap: 'wrap', gap: smal ? 4 : '8px 28px' }}>
          <WeekCijfer titel={smal ? 'Deze week · loopt' : 'Deze week (loopt nog)'} week={nu} smal={smal} />
          <WeekCijfer titel={smal ? `Vorige · ${kortDatum(vorige.maandag)}` : `Vorige week (${kortDatum(vorige.maandag)})`} week={vorige} smal={smal} />
        </div>
      </div>
      <div style={{ flex: smal ? 'none' : '1 1 340px', minWidth: 0, maxWidth: smal ? 'none' : 460 }}>
        <Staafjes weken={weken} gekozen={toon.maandag} onKies={kies} hoogte={smal ? 64 : 76} />
        <div style={{ ...NUM, display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 6, fontSize: 12, fontWeight: 800, color: '#fff' }}>
          <span>{toon.loopt ? 'Deze week' : `Week van ${kortDatum(toon.maandag)}`}: man {getal(toon.man)} · vrouw {getal(toon.vrouw)} · leeg {getal(toon.leeg)}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: ZACHT }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: GROEN }} />bekend</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: GROEN_LICHT }} />geschat</span>
          </span>
        </div>
      </div>
    </div>
  )
}
