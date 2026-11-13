// src/modules/workout/bouwfase/FaseReflectieBlad.jsx
//
// Einde bouwfase: de klant kijkt terug in een paar stappen (13 nov 2026,
// Kersten: één lange lijst werd een reeks slides). Eerst zijn resultaten per
// oefening, dan vier cijfers, dan wat werkte, waar de focus heen moet, welke
// oefeningen erbij of eraf mogen, en een slotwoord. Alles komt in
// training_fases.reflectie; de coach bouwt daarmee de volgende fase.
//
// `cijfer`, `herstel`, `goed` en `beter` houden hun oude naam: het coachscherm
// en oudere reflecties gebruiken die.

import { useEffect, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, Check, ChevronLeft } from 'lucide-react'
import HorizontaleSlider from '../../../client/components/HorizontaleSlider'
import { faseProgressie, bewaarReflectie } from './bouwfaseData'

const veld = {
  width: '100%', minHeight: 76, padding: '0.65rem 0.75rem', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12,
  color: '#fff', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none', resize: 'none',
}
const vraag = { fontSize: '0.92rem', fontWeight: 900, color: '#fff', margin: '0 0 8px' }
const setAlsTekst = (s) => `${s.weight}×${s.reps}`
const CIJFERS = Array.from({ length: 10 }, (_, k) => k + 1)
// De schuif begint op een streepje (nog niets gekozen), daarna 1 tot 10.
const LEEG = '–'
const SCHUIF = [LEEG, ...CIJFERS]

// De vier cijfers van de eerste vragenslide: [sleutel in reflectie, vraag].
const SCORES = [
  ['cijfer', 'Hoe voelde deze bouwfase?'],
  ['herstel', 'Hoe goed voelde je herstel deze bouwfase?'],
  ['performance', 'Hoe goed vond je je performance tijdens trainingen?'],
  ['zwaarte', 'Hoe zwaar voelde deze bouwfase?'],
]
// Het woord bij een cijfer, boven de schuif. Zwaarte heeft zijn eigen woorden:
// daar is hoog niet "goed" maar "zwaar".
const WOORD_GOED = ['Slecht', 'Slecht', 'Matig', 'Matig', 'Oké', 'Oké', 'Goed', 'Goed', 'Top', 'Top']
const WOORD_ZWAAR = ['Heel licht', 'Heel licht', 'Licht', 'Licht', 'Gemiddeld', 'Gemiddeld', 'Zwaar', 'Zwaar', 'Heel zwaar', 'Heel zwaar']
const KLEUR_GOED = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#fff', '#fff', '#10b981', '#10b981', '#10b981', '#10b981']
const woordVoor = (sleutel, n) => (sleutel === 'zwaarte' ? WOORD_ZWAAR : WOORD_GOED)[n - 1] || ''
const kleurVoor = (sleutel, n) => (sleutel === 'zwaarte' ? '#fff' : KLEUR_GOED[n - 1] || '#fff')

const FOCUS = [
  ['zelfde', 'Ja, hetzelfde als nu'],
  ['anders', 'Ja, namelijk:'],
  ['geen', 'Niet specifiek'],
]

function Tekstvraag({ kop, waarde, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={vraag}>{kop}</div>
      <textarea value={waarde} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} style={veld} />
    </div>
  )
}

export default function FaseReflectieBlad({ open, onClose, db, fase, onOpgeslagen }) {
  const [lijst, setLijst] = useState(null)
  const [stap, setStap] = useState(0)
  // Leeg tot de klant kiest: met een vooringevuld cijfer klik je er zo doorheen.
  const [scores, setScores] = useState({ cijfer: null, herstel: null, performance: null, zwaarte: null })
  const [tekst, setTekst] = useState({ goed: '', beter: '', focusTekst: '', erbij: '', weg: '', slotwoord: '' })
  const [focus, setFocus] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const zet = (k) => (v) => setTekst(t => ({ ...t, [k]: v }))

  useEffect(() => {
    if (!open || !fase) return undefined
    let weg = false
    setLijst(null); setFout(null); setStap(0)
    faseProgressie(db.supabase, fase).then(l => { if (!weg) setLijst(l) }, () => { if (!weg) setLijst([]) })
    return () => { weg = true }
  }, [open, fase, db])

  if (!open || !fase) return null

  const bewaar = async () => {
    if (bezig) return
    setBezig(true); setFout(null)
    try {
      const t = (s) => s.trim() || null
      const reflectie = {
        ...scores,
        goed: t(tekst.goed), beter: t(tekst.beter),
        focus: focus || null, focus_tekst: focus === 'anders' ? t(tekst.focusTekst) : null,
        oefeningen_erbij: t(tekst.erbij), oefeningen_weg: t(tekst.weg),
        slotwoord: t(tekst.slotwoord),
        ingevuld_op: new Date().toISOString(),
      }
      await bewaarReflectie(db.supabase, fase.id, reflectie)
      onOpgeslagen?.(reflectie)
      onClose?.()
    } catch (e) {
      setFout(/fase niet gevonden/i.test(e.message || '')
        ? 'Opslaan lukte niet: deze bouwfase hoort niet bij het account waarmee je bent ingelogd.'
        : (e.message || 'Opslaan mislukt'))
    }
    setBezig(false)
  }

  // Samenvatting van de progressie (eerste tegen laatste training per oefening).
  const stats = lijst?.length ? {
    aantal: lijst.length,
    vooruit: lijst.filter(o => o.verschil > 0).length,
    gemiddeld: Math.round(lijst.reduce((t, o) => t + o.verschil, 0) / lijst.length),
    beste: lijst[0], // de lijst staat op grootste vooruitgang eerst
  } : null

  // De slides. De resultaten alleen als er iets te vergelijken valt.
  const slides = [
    ...(lijst?.length > 0 ? [{
      titel: 'Je bouwfase in cijfers',
      inhoud: (
        <div>
          {lijst.map(o => (
            <div key={o.naam} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>{o.naam}</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{setAlsTekst(o.eerste)} → {setAlsTekst(o.laatste)}</span>
              </span>
              <span style={{ flexShrink: 0, fontSize: '0.88rem', fontWeight: 900, color: o.verschil > 0 ? '#10b981' : o.verschil < 0 ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>{o.verschil > 0 ? '+' : ''}{o.verschil}%</span>
            </div>
          ))}
        </div>
      ),
    }] : []),
    {
      titel: 'Wat vond je van deze bouwfase?',
      // De schuif, met het woord er direct boven en weinig lucht ertussen. Hij
      // begint op een streepje: pas als de klant schuift of tikt telt het.
      klaar: SCORES.every(([sleutel]) => scores[sleutel] != null),
      inhoud: SCORES.map(([sleutel, kop]) => (
        <div key={sleutel} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.25 }}>{kop}</div>
          <div style={{ textAlign: 'center', fontSize: '0.76rem', fontWeight: 900, marginTop: 2, color: scores[sleutel] ? kleurVoor(sleutel, scores[sleutel]) : 'rgba(255,255,255,0.35)' }}>
            {scores[sleutel] ? woordVoor(sleutel, scores[sleutel]) : 'Schuif om te kiezen'}
          </div>
          <HorizontaleSlider waarden={SCHUIF} waarde={scores[sleutel] ?? LEEG} itemBreedte={58} hoogte={50} groot="1.8rem"
            onChange={v => setScores(sc => ({ ...sc, [sleutel]: v === LEEG ? null : v }))} />
        </div>
      )),
    },
    {
      titel: 'Wat vond je fijn, en wat minder?',
      inhoud: (<>
        <Tekstvraag kop="Wat vond je fijn deze fase?" waarde={tekst.goed} onChange={zet('goed')} placeholder="Bijvoorbeeld een oefening, de indeling of het tempo" />
        <Tekstvraag kop="Wat vond je minder fijn deze fase?" waarde={tekst.beter} onChange={zet('beter')} placeholder="Wat liep stroef of wil je anders" />
      </>),
    },
    {
      titel: 'Focus voor de volgende fase',
      inhoud: (<>
        <div style={vraag}>Heb je spiergroepen waar je volgende fase de focus op wilt leggen?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FOCUS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFocus(id)} aria-pressed={focus === id} style={{
              minHeight: 48, padding: '0 0.9rem', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 900, textAlign: 'left', cursor: 'pointer',
              background: focus === id ? '#fff' : 'transparent', color: focus === id ? '#0a0a0a' : '#fff',
              border: `1px solid ${focus === id ? '#fff' : 'rgba(255,255,255,0.18)'}`, touchAction: 'manipulation',
            }}>{label}</button>
          ))}
        </div>
        {focus === 'anders' && (
          <textarea autoFocus value={tekst.focusTekst} onChange={e => zet('focusTekst')(e.target.value)} rows={2} placeholder="Welke spiergroepen?" style={{ ...veld, marginTop: 10 }} />
        )}
      </>),
    },
    {
      titel: 'Oefeningen',
      inhoud: (<>
        <Tekstvraag kop="Heb je oefeningen die je niet hebt gehad, maar die je wel graag in je plan terugziet?" waarde={tekst.erbij} onChange={zet('erbij')} placeholder="Laat leeg als je er geen hebt" />
        <Tekstvraag kop="Heb je oefeningen van afgelopen fase die je weg wilt laten?" waarde={tekst.weg} onChange={zet('weg')} placeholder="Laat leeg als je er geen hebt" />
      </>),
    },
    {
      titel: 'Slotwoord',
      inhoud: (<>
        {/* Je progressie in drie cijfers, als geheugensteun bij het terugkijken. */}
        {stats && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              [`${stats.gemiddeld > 0 ? '+' : ''}${stats.gemiddeld}%`, 'gemiddeld sterker', stats.gemiddeld > 0 ? '#10b981' : stats.gemiddeld < 0 ? '#ef4444' : '#fff'],
              [`${stats.vooruit} van ${stats.aantal}`, 'oefeningen vooruit', '#fff'],
              [`${stats.beste.verschil > 0 ? '+' : ''}${stats.beste.verschil}%`, stats.beste.naam, stats.beste.verschil > 0 ? '#10b981' : '#fff'],
            ].map(([cijfer, onder, kleur]) => (
              <div key={onder} style={{ flex: 1, minWidth: 0, padding: '0.55rem 0.4rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: kleur, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{cijfer}</div>
                <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{onder}</div>
              </div>
            ))}
          </div>
        )}
        <Tekstvraag kop="Beschrijf afgelopen fase in één of meer zinnen." waarde={tekst.slotwoord} onChange={zet('slotwoord')} placeholder="Hoe kijk je erop terug?" />
      </>),
    },
  ]
  const nu = Math.min(stap, slides.length - 1)
  const laatste = nu === slides.length - 1
  // Een slide met `klaar: false` houdt Volgende dicht tot alles gekozen is.
  const kanNietVerder = slides[nu].klaar === false

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483100, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '92dvh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, padding: '1rem 1rem 0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {nu > 0 && (
              <button onClick={() => setStap(nu - 1)} aria-label="Vorige" style={{ width: 36, height: 36, marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronLeft size={20} strokeWidth={2.8} /></button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>Bouwfase check-in · {nu + 1} van {slides.length}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{slides[nu].titel}</div>
            </div>
            <button onClick={onClose} aria-label="Sluiten" style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} strokeWidth={2.6} /></button>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {slides.map((_, i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= nu ? '#fff' : 'rgba(255,255,255,0.14)' }} />)}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.4rem 1rem 0.6rem' }}>
          {slides[nu].inhoud}
          {fout && <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ef4444', marginTop: 6 }}>{fout}</div>}
        </div>

        <div style={{ flexShrink: 0, padding: '0.6rem 1rem 1rem' }}>
          <button onClick={laatste ? bewaar : () => setStap(nu + 1)} disabled={bezig || kanNietVerder} style={{ width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: kanNietVerder ? 'default' : 'pointer', opacity: bezig || kanNietVerder ? 0.35 : 1 }}>
            {laatste ? <><Check size={16} strokeWidth={3} /> {bezig ? 'Opslaan…' : 'Opslaan'}</> : (kanNietVerder ? 'Kies eerst alle vier' : 'Volgende')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
