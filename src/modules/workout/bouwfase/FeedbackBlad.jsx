// src/modules/workout/bouwfase/FeedbackBlad.jsx
//
// Feedbackvenster van de bouwfase, in de stijl van het slaapblad:
//   soort 'oefening' → stap 1: hoe goed voelde hij (1-10); stap 2: uitvoering, en
//                      na een keuze opent de toelichting
//   soort 'herstel'  → "Hoe goed is je borst hersteld?" met smileys
//   soort 'workout'  → overzicht van vandaag + cijfer 1-10 + toelichting
// Alleen zichtbaar als de coach bouwfase-tracking aanzette (useBouwfase).

import { useEffect, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, Check, Smile, Meh, Frown } from 'lucide-react'
import HorizontaleSlider from '../../../client/components/HorizontaleSlider'
import { GEVOEL, HERSTEL, bewaarFeedback, spierWoord } from './bouwfaseData'

const kleurScore = (n) => (n >= 7 ? '#10b981' : n >= 5 ? '#f59e0b' : '#ef4444')
const scoreWoord = (n) => (n <= 3 ? 'slecht' : n <= 5 ? 'matig' : n <= 7 ? 'goed' : n <= 9 ? 'heel goed' : 'top')
const SMILEY = { nee: Smile, beetje: Meh, ja: Frown }

const veld = {
  width: '100%', minHeight: 60, padding: '0.6rem 0.75rem', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12,
  color: '#fff', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none', resize: 'none',
}
const primair = (bezig) => ({
  width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a',
  fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: bezig ? 'default' : 'pointer',
  opacity: bezig ? 0.6 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
const chip = (aan) => ({
  flex: 1, minHeight: 44, borderRadius: 12, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer',
  background: aan ? '#fff' : 'rgba(255,255,255,0.06)', color: aan ? '#0a0a0a' : '#fff',
  border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

export default function FeedbackBlad({ open, soort, onClose, client, db, fase, oefening, spiergroep, oefeningen = [], bestaand = null, onOpgeslagen }) {
  const [score, setScore] = useState(7)
  const [gevoel, setGevoel] = useState('goed')
  const [opmerking, setOpmerking] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [stap, setStap] = useState(1) // alleen bij een oefening: 1 = gevoel, 2 = uitvoering
  const [gekozen, setGekozen] = useState(false) // uitvoering gekozen → toelichting open

  useEffect(() => {
    if (!open) return
    setScore(bestaand?.score ?? 7)
    setGevoel(bestaand?.gevoel ?? 'goed')
    setOpmerking(bestaand?.opmerking ?? '')
    setFout(null)
    setStap(1)
    setGekozen(!!bestaand)
  }, [open, bestaand])

  if (!open || !client?.id) return null

  const bewaar = async (extra = {}) => {
    if (bezig) return
    setBezig(true); setFout(null)
    try {
      const rij = await bewaarFeedback(db.supabase, {
        client_id: client.id, soort, fase_id: fase?.id || null,
        oefening: soort === 'oefening' ? oefening : null,
        // Oefening-rijen krijgen hun spiergroep mee: dan ziet de coach herstel en gevoel per spiergroep.
        spiergroep: soort === 'workout' ? null : (spiergroep || null),
        score: soort === 'herstel' ? null : score,
        gevoel: soort === 'workout' ? null : gevoel,
        opmerking: opmerking.trim() || null,
        ...extra,
      })
      onOpgeslagen?.(rij)
      onClose?.()
    } catch (e) {
      console.error('Feedback opslaan mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
    } finally { setBezig(false) }
  }

  const titel = soort === 'oefening' ? oefening : soort === 'herstel' ? 'Herstel' : 'Je training'
  const sub = soort === 'oefening' ? `Oefening klaar · stap ${stap} van 2` : soort === 'herstel' ? 'Voor je begint' : 'Training afronden'

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 2147483100, background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, maxHeight: '92dvh', overflowY: 'auto',
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
        padding: '1.1rem 1rem 1.2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 40 }} />
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sub}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titel}</div>
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{
            width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
          }}><X size={18} strokeWidth={2.8} /></button>
        </div>

        {soort === 'herstel' && (
          <>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 16 }}>
              Hoe goed {['chest', 'back', 'abs', 'shoulders'].includes(spiergroep) ? 'is' : 'zijn'} je {spierWoord(spiergroep)} hersteld?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {HERSTEL.map(h => {
                const Smiley = SMILEY[h.id]
                return (
                  <button key={h.id} disabled={bezig} onClick={() => bewaar({ gevoel: h.id })} style={{ ...chip(false), minHeight: 92, color: h.kleur, borderColor: `${h.kleur}66`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Smiley size={32} strokeWidth={2.2} />
                    {h.label}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {soort !== 'herstel' && (
          <>
            {soort === 'workout' && oefeningen.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {oefeningen.map(o => (
                  <div key={o.naam} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#10b981', fontWeight: 900 }}>→</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 900, color: '#fff' }}>{o.naam}</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                        {(o.sets || []).map(s => `${s.weight ?? 0}×${s.reps ?? 0}`).join(' · ') || 'niet gelogd'}
                        {o.gevoel && o.gevoel !== 'goed' ? ` · ${GEVOEL.find(g => g.id === o.gevoel)?.label.toLowerCase()}` : ''}
                      </span>
                    </span>
                    {o.score != null && <span style={{ flexShrink: 0, fontSize: '0.85rem', fontWeight: 900, color: kleurScore(o.score) }}>{o.score}</span>}
                  </div>
                ))}
              </div>
            )}
            {(soort === 'workout' || stap === 1) && (
              <>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 14 }}>
                  {soort === 'oefening' ? 'Hoe goed voelde deze oefening?' : 'Hoe goed voelde de training vandaag?'}
                </div>
                <HorizontaleSlider waarden={Array.from({ length: 10 }, (_, k) => k + 1)} waarde={score} onChange={setScore} itemBreedte={64} />
                <div style={{ textAlign: 'center', fontSize: '0.74rem', fontWeight: 900, color: kleurScore(score), marginTop: 2 }}>{scoreWoord(score)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', margin: '4px 0 14px' }}>
                  <span>1 = slecht</span><span>10 = top</span>
                </div>
              </>
            )}
            {soort === 'oefening' && stap === 1 && (
              <button onClick={() => setStap(2)} style={primair(false)}>Volgende</button>
            )}
            {soort === 'oefening' && stap === 2 && (
              <>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 14 }}>Hoe goed ging de uitvoering?</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {GEVOEL.map(g => <button key={g.id} onClick={() => { setGevoel(g.id); setGekozen(true) }} style={chip(gekozen && gevoel === g.id)}>{g.label}</button>)}
                </div>
              </>
            )}
            {(soort === 'workout' || (stap === 2 && gekozen)) && (
              <>
                <textarea value={opmerking} onChange={e => setOpmerking(e.target.value)} rows={2}
                  placeholder={soort === 'oefening' ? 'Toelichting (mag leeg)' : 'Wil je dat cijfer toelichten? (mag leeg)'}
                  style={{ ...veld, marginBottom: 14 }} />
                {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: 10 }}>{fout}</div>}
                <button onClick={() => bewaar()} disabled={bezig} style={primair(bezig)}>
                  <Check size={16} strokeWidth={3} /> {bezig ? 'Opslaan…' : bestaand ? 'Bijwerken' : 'Opslaan'}
                </button>
              </>
            )}
          </>
        )}
        {fout && soort === 'herstel' && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginTop: 10 }}>{fout}</div>}
        <button onClick={onClose} style={{ ...primair(false), background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', minHeight: 40, marginTop: 4 }}>
          Overslaan
        </button>
      </div>
    </div>,
    document.body,
  )
}
