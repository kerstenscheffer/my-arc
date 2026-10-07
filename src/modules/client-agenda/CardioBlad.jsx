// src/modules/client-agenda/CardioBlad.jsx
//
// Cardio toevoegen of aanpassen, als blad dat van onderen openschuift. Zelfde
// vorm als het oefening-logscherm: één ding per stap, grote cijfers, één
// witte knop. Sport als tikbare vakken, keer per week en minuten per keer met
// grote min/plus-knoppen, en live wat het kost in kcal bij dit gewicht.

import { useEffect, useState } from 'react'
import { Footprints, Bike, Waves, Timer, Wind, Activity, TrendingUp, Zap, Trash2, Check } from 'lucide-react'
import BladModal from '../workout/components/todays-workout/components/BladModal'

const ICOON = { Wandelen: Footprints, Fietsen: Bike, Zwemmen: Waves, Hardlopen: Timer, Roeien: Wind, Crosstrainer: Activity, Stairmaster: TrendingUp, HIIT: Zap }
const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

function Teller({ label, waarde, eenheid, stap, min = 0, onChange }) {
  const knop = {
    width: 52, height: 52, flexShrink: 0, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', fontFamily: 'inherit', fontSize: '1.3rem', fontWeight: 900, lineHeight: 1,
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => onChange(Math.max(min, waarde - stap))} aria-label={`${label} minder`} style={knop}>−</button>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{waarde}</div>
          <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{eenheid}</div>
        </div>
        <button onClick={() => onChange(waarde + stap)} aria-label={`${label} meer`} style={knop}>+</button>
      </div>
    </div>
  )
}

const DAGEN = [
  { id: 'monday', label: 'Ma' }, { id: 'tuesday', label: 'Di' }, { id: 'wednesday', label: 'Wo' },
  { id: 'thursday', label: 'Do' }, { id: 'friday', label: 'Vr' }, { id: 'saturday', label: 'Za' }, { id: 'sunday', label: 'Zo' },
]

export default function CardioBlad({
  open, regel, soorten, gewicht, kcalPerMinuut, onOpslaan, onVerwijder, onClose, huidig = [], onBewerk = null,
  // Weektempo nu en met dit cardio erbij: { nu, straks } als tekst. Zo zie je
  // bij het invullen wat het doet.
  tempoVoor = null,
  // Dagen + tijd gekozen: meteen in het plan en op die dagen in de agenda.
  onInplannen = null,
}) {
  const [soort, setSoort] = useState('Wandelen')
  const [keer, setKeer] = useState(3)
  const [minuten, setMinuten] = useState(30)
  const [dagen, setDagen] = useState([])
  const [tijd, setTijd] = useState('18:00')
  const [bezig, setBezig] = useState(false)
  useEffect(() => {
    if (!open) return
    setSoort(regel?.soort || 'Wandelen')
    setKeer(Number(regel?.keer) || 3)
    setMinuten(Number(regel?.minuten) || 30)
    setDagen([]); setTijd('18:00'); setBezig(false)
  }, [open, regel])

  const gekozen = soorten.find(x => x.id === soort) || soorten[0]
  const perMin = kcalPerMinuut(gekozen.met, gewicht)
  const perKeer = Math.round(perMin * minuten)
  // Met dagen gekozen telt het aantal dagen; anders de teller.
  const effKeer = dagen.length > 0 ? dagen.length : keer
  const perWeek = perKeer * effKeer
  // Bij bewerken van een bestaande regel is het verschil t.o.v. wat er al stond.
  const basisWeek = regel ? Math.round(kcalPerMinuut((soorten.find(x => x.id === regel.soort) || gekozen).met, gewicht) * (Number(regel.minuten) || 0) * (Number(regel.keer) || 0)) : 0
  const tempo = tempoVoor ? tempoVoor(perWeek - basisWeek) : null
  const wisselDag = (id) => setDagen(d => d.includes(id) ? d.filter(x => x !== id) : [...d, id])
  const tijdMin = (() => { const m = String(tijd).match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : 18 * 60 })()

  return (
    <BladModal open={open} titel={regel ? 'Cardio aanpassen' : 'Cardio toevoegen'} onClose={onClose} zIndex={10650}>
      {/* Wat er al staat: zo zie je bij het toevoegen wat je al hebt, en
          tik je een regel aan om die aan te passen. */}
      {!regel && huidig.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Huidig cardio</div>
          {huidig.map((r, i) => {
            const x = soorten.find(y => y.id === r.soort) || soorten[0]
            const Icoon = ICOON[x.id] || Activity
            const perWeek = Math.round(kcalPerMinuut(x.met, gewicht) * (Number(r.minuten) || 0) * (Number(r.keer) || 0))
            return (
              <button key={r.id || i} onClick={() => onBewerk?.(i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
                padding: '0.3rem 0', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'left', fontFamily: 'inherit', cursor: onBewerk ? 'pointer' : 'default',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <Icoon size={16} color="#fff" strokeWidth={2.4} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{r.soort}</span>
                  <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: r.id ? '#22c55e' : 'rgba(255,255,255,0.5)' }}>{r.id ? 'in plan' : 'nieuw'} · {r.keer}× {r.minuten} min</span>
                </span>
                <span style={{ flexShrink: 0, fontSize: '0.84rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {nl(perWeek)}<span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}> kcal/wk</span>
                </span>
              </button>
            )
          })}
          <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 14 }}>Nieuw</div>
        </div>
      )}

      {/* Sport als vakken, twee per rij. */}
      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Sport</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        {soorten.map(x => {
          const Icoon = ICOON[x.id] || Activity
          const aan = x.id === soort
          return (
            <button key={x.id} onClick={() => { setSoort(x.id); if (navigator.vibrate) navigator.vibrate(10) }} style={{
              display: 'flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '0 0.8rem', borderRadius: 12, textAlign: 'left',
              background: aan ? '#fff' : 'rgba(255,255,255,0.04)', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
              color: aan ? '#0a0a0a' : '#fff', fontFamily: 'inherit', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <Icoon size={16} strokeWidth={2.4} style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 900, letterSpacing: '-0.015em' }}>{x.id}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(() => { const t = x.label.replace(`${x.id} `, '').replace(/[()]/g, '').trim(); return t && t !== x.id ? t : `${x.met} MET` })()}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        <Teller label="Keer per week" waarde={effKeer} eenheid={dagen.length > 0 ? 'dagen gekozen' : 'keer'} stap={1} min={1} onChange={(v) => { setDagen([]); setKeer(v) }} />
        <Teller label="Minuten" waarde={minuten} eenheid="per keer" stap={5} min={5} onChange={setMinuten} />
      </div>

      {/* Dagen en tijd: kies je dagen, dan gaat het meteen de agenda in. */}
      {onInplannen && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dagen en tijd</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {DAGEN.map(d => {
              const aan = dagen.includes(d.id)
              return (
                <button key={d.id} onClick={() => wisselDag(d.id)} style={{
                  flex: 1, minHeight: 40, borderRadius: 10,
                  background: aan ? '#fff' : 'rgba(255,255,255,0.04)', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                  color: aan ? '#0a0a0a' : '#fff', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>{d.label}</button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>Tijd</span>
            <input type="time" value={tijd} onChange={e => setTijd(e.target.value)} style={{
              minHeight: 40, padding: '0 0.6rem', background: 'transparent', border: 'none',
              color: '#fff', fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
            }} />
          </div>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            {dagen.length > 0
              ? `${dagen.length} dag${dagen.length === 1 ? '' : 'en'} · ${regel ? 'vervangt de cardio-blokken van deze sport in de agenda' : 'komt'} om ${tijd} in de agenda en in het cardioplan van de klant`
              : regel ? 'Geen dagen gekozen: alleen de regel wordt aangepast, de agenda blijft.' : 'Geen dagen gekozen: dan blijft het een wat-als.'}
          </div>
        </div>
      )}

      {/* Wat het kost: per keer en per week, bij dit gewicht. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'per keer', waarde: `${nl(perKeer)} kcal` },
          { label: 'per week', waarde: `${nl(perWeek)} kcal` },
          { label: 'per dag', waarde: `${nl(perWeek / 7)} kcal` },
        ].map(x => (
          <div key={x.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.55rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{x.waarde}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{x.label}</div>
          </div>
        ))}
      </div>
      {tempo && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '0.6rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>Weektempo</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>{tempo.nu}</span> → <span style={{ color: tempo.beter ? '#22c55e' : '#fff' }}>{tempo.straks}</span>
            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}> per week</span>
          </span>
        </div>
      )}
      <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
        ± {perMin} kcal per minuut bij {Math.round(gewicht)} kg, rustige intensiteit (MET {gekozen.met}).
      </div>

      <button
        disabled={bezig}
        onClick={async () => {
          const nieuw = { ...(regel || {}), soort, keer: effKeer, minuten }
          if (dagen.length > 0 && onInplannen) {
            setBezig(true)
            try { await onInplannen(nieuw, dagen, tijdMin) } finally { setBezig(false) }
            return
          }
          onOpslaan(nieuw)
        }}
        style={{
          width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a',
          fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.01em', fontFamily: 'inherit', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Check size={16} strokeWidth={3} /> {bezig ? 'Bezig…' : dagen.length > 0 ? (regel ? 'Aanpassen en inplannen' : 'Inplannen en opslaan') : regel ? 'Aanpassen' : 'Toevoegen aan wat als'}
      </button>
      {regel && onVerwijder && (
        <button
          onClick={() => onVerwijder(regel)}
          style={{
            width: '100%', minHeight: 44, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'transparent', border: 'none', color: '#ef4444',
            fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Trash2 size={14} /> Verwijderen
        </button>
      )}
    </BladModal>
  )
}
