// src/modules/workout/components/CardioLogBlad.jsx
//
// Geplande cardio loggen als een setje, midden in het scherm, één vraag per
// stap: hoe lang, hoe zwaar, klopt dit. Intensiteit bepaalt de kcal
// (MET × factor × 3,5 × kg / 200 per minuut); zei je horloge iets anders,
// dan wint het horloge en bewaren we dat als bron.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, ChevronLeft, Watch } from 'lucide-react'

// Zelfde MET-tabel als het weekbudget van de coach (Compendium 2011).
const MET = { wandelen: 4.3, fietsen: 6.8, zwemmen: 6.0, hardlopen: 8.3, roeien: 7.0, crosstrainer: 5.0, stairmaster: 9.0, hiit: 8.0, padel: 6.0, hyrox: 9.0, crossfit: 8.0 }
const metVan = (soort) => {
  const n = String(soort || '').toLowerCase()
  const k = Object.keys(MET).find(k => n.includes(k)) || (n.includes('run') ? 'hardlopen' : n.includes('cycl') || n.includes('bike') ? 'fietsen' : null)
  return k ? MET[k] : 6.0
}
// Hoe zwaar: factor op de MET. Rustig praten = rustig; hijgen = pittig.
const INTENSITEIT = [
  { id: 'rustig',    label: 'Rustig',    uitleg: 'je kunt praten',          factor: 0.85 },
  { id: 'gemiddeld', label: 'Gemiddeld', uitleg: 'korte zinnen',            factor: 1.0 },
  { id: 'pittig',    label: 'Pittig',    uitleg: 'hijgen, paar woorden',    factor: 1.2 },
  { id: 'vol_gas',   label: 'Vol gas',   uitleg: 'niet praten, alles geven', factor: 1.4 },
]
const METAFSTAND = /wandel|hardl|fiets|roei|zwem|run|cycl|walk/i
// 'Hoe lang heb je …?' — per sport de juiste vorm, anders neutraal.
const VERVOEGING = [['wandel','gewandeld'],['hardl','hardgelopen'],['run','hardgelopen'],['fiets','gefietst'],['cycl','gefietst'],['zwem','gezwommen'],['roei','geroeid'],['padel','gepadeld'],['stap','gelopen']]
const werkwoord = (soort) => { const n = String(soort || '').toLowerCase(); const t = VERVOEGING.find(([k]) => n.includes(k)); return t ? t[1] : 'getraind' }
const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

export default function CardioLogBlad({ open, soort, minutenGepland, gewicht = 80, onLog, onClose, isMobile }) {
  const [stap, setStap] = useState(1)
  const [minuten, setMinuten] = useState(30)
  const [intensiteit, setIntensiteit] = useState('gemiddeld')
  const [afstand, setAfstand] = useState('')
  const [horloge, setHorloge] = useState('')
  const [bezig, setBezig] = useState(false)
  useEffect(() => {
    if (!open) return
    setStap(1); setMinuten(Number(minutenGepland) || 30); setIntensiteit('gemiddeld'); setAfstand(''); setHorloge(''); setBezig(false)
  }, [open, minutenGepland, soort])
  if (!open) return null

  const f = INTENSITEIT.find(i => i.id === intensiteit) || INTENSITEIT[1]
  const schatting = Math.round(metVan(soort) * f.factor * 3.5 * gewicht / 200 * minuten)
  const horlogeKcal = parseInt(String(horloge).replace(/\D/g, ''), 10)
  const kcal = Number.isFinite(horlogeKcal) && horlogeKcal > 0 ? horlogeKcal : schatting
  const bron = Number.isFinite(horlogeKcal) && horlogeKcal > 0 ? 'horloge' : 'schatting'

  const groot = { fontSize: isMobile ? '2.6rem' : '3rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }
  const knop = {
    width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
    fontFamily: 'inherit', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1, cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const primair = {
    width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a',
    fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.01em', fontFamily: 'inherit', cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const veld = {
    width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '0 0.9rem', borderRadius: 12,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
    fontSize: '1rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none',
  }

  const loggen = async () => {
    if (bezig) return
    setBezig(true)
    try {
      await onLog({
        cardio_type: soort, duration_minutes: minuten,
        distance_km: afstand ? parseFloat(String(afstand).replace(',', '.')) : null,
        intensity: intensiteit, calories: kcal, calories_source: bron,
      })
    } finally { setBezig(false) }
  }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: isMobile ? '1.1rem 1rem 1.2rem' : '1.3rem 1.3rem 1.4rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        {/* Kop: stap terug, sport, sluiten */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {stap > 1 ? (
            <button onClick={() => setStap(s => s - 1)} aria-label="Vorige stap" style={{ ...knop, width: 40, height: 40, borderRadius: 12, fontSize: '1rem' }}><ChevronLeft size={18} strokeWidth={2.8} /></button>
          ) : <div style={{ width: 40 }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cardio loggen · stap {stap} van 3</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{soort}</div>
          </div>
          <button onClick={onClose} aria-label="Sluit" style={{ ...knop, width: 40, height: 40, borderRadius: 12, fontSize: '1rem' }}><X size={18} strokeWidth={2.6} /></button>
        </div>

        {stap === 1 && (
          <>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 14 }}>Hoe lang heb je {werkwoord(soort)}?</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 18 }}>
              <button onClick={() => setMinuten(m => Math.max(5, m - 5))} aria-label="5 minuten minder" style={knop}>−</button>
              <div style={{ textAlign: 'center', minWidth: 110 }}>
                <div style={groot}>{minuten}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>minuten{minutenGepland ? ` · gepland ${minutenGepland}` : ''}</div>
              </div>
              <button onClick={() => setMinuten(m => m + 5)} aria-label="5 minuten meer" style={knop}>+</button>
            </div>
            {METAFSTAND.test(soort || '') && (
              <div style={{ marginBottom: 16 }}>
                <input inputMode="decimal" value={afstand} onChange={e => setAfstand(e.target.value)} placeholder="Afstand in km (mag leeg)" style={veld} />
              </div>
            )}
            <button onClick={() => setStap(2)} style={primair}>Volgende</button>
          </>
        )}

        {stap === 2 && (
          <>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 12 }}>Hoe zwaar was het?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {INTENSITEIT.map(i => {
                const aan = i.id === intensiteit
                return (
                  <button key={i.id} onClick={() => { setIntensiteit(i.id); if (navigator.vibrate) navigator.vibrate(10) }} style={{
                    minHeight: 56, padding: '0 0.8rem', borderRadius: 12, textAlign: 'left',
                    background: aan ? '#fff' : 'rgba(255,255,255,0.04)', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                    color: aan ? '#0a0a0a' : '#fff', fontFamily: 'inherit', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, letterSpacing: '-0.015em' }}>{i.label}</div>
                    <div style={{ fontSize: '0.64rem', fontWeight: 700, opacity: 0.6 }}>{i.uitleg}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Schatting</div>
              <div style={{ ...groot, fontSize: isMobile ? '2rem' : '2.3rem' }}>{nl(schatting)}<span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', letterSpacing: 0 }}> kcal</span></div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{minuten} min · {f.label.toLowerCase()} · bij {Math.round(gewicht)} kg</div>
            </div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Watch size={16} color="rgba(255,255,255,0.45)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input inputMode="numeric" value={horloge} onChange={e => setHorloge(e.target.value)} placeholder="Kcal volgens je horloge (mag leeg)" style={{ ...veld, paddingLeft: 38 }} />
            </div>
            <button onClick={() => setStap(3)} style={primair}>Volgende</button>
          </>
        )}

        {stap === 3 && (
          <>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 14 }}>Klopt dit?</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'minuten', waarde: minuten },
                { label: f.label.toLowerCase(), waarde: `×${f.factor}` },
                { label: bron === 'horloge' ? 'kcal · horloge' : 'kcal · schatting', waarde: nl(kcal) },
              ].map(x => (
                <div key={x.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.6rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{x.waarde}</div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.label}</div>
                </div>
              ))}
            </div>
            {afstand && <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 10 }}>{afstand} km</div>}
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 16, lineHeight: 1.4 }}>
              {bron === 'horloge' ? 'Het getal van je horloge wordt bewaard; de schatting was ' + nl(schatting) + '.' : 'Een schatting op basis van sport, zwaarte en gewicht. Heb je een horloge, vul die kcal in bij de vorige stap.'}
            </div>
            <button onClick={loggen} disabled={bezig} style={primair}><Check size={16} strokeWidth={3} /> {bezig ? 'Bezig…' : 'Loggen'}</button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
