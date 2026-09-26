// src/modules/coach-command-center/components/insight/DoelModal.jsx
//
// Het weekdoel van de lopende fase instellen: wat je wil zien, en binnen welke
// marge je dat goed vindt gaan.
//
// Dit kon nergens. De velden bestonden alleen in het formulier voor een nieuwe
// fase, dus om een grens te zetten moest je de lopende fase afbreken — en dus
// stond het bij iedereen leeg en kleurde alles groen. Deze modal bewerkt de
// fase die er al is.
//
// Één scherm voor de drie getallen die bij elkaar horen: het doel zelf, en de
// onder- en bovengrens waarbinnen het tempo goed is. Je ziet meteen wat de band
// ervan maakt, zodat je niet hoeft op te slaan om te weten wat er gaat gelden.

import { useState, useEffect } from 'react'
import { X, Flag } from 'lucide-react'
import { maakConfig, bereikTekst, kcalPerWeektempo } from '../../../weight-tracker/utils/coachingBand'
import { DOELEN } from '../../../weight-tracker/utils/fase'

const LIJN = 'rgba(255,255,255,0.1)'

const datumNL = (d) => d
  ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  : ''

export default function DoelModal({ client, db, fase, isMobile, onKlaar, onSluit, onNieuweFase }) {
  const [perWeek, setPerWeek] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    setPerWeek(fase?.week_doel_kg != null ? String(Number(fase.week_doel_kg)) : '')
    setMin(fase?.tempo_min_kg != null ? String(Math.abs(Number(fase.tempo_min_kg))) : '')
    setMax(fase?.tempo_max_kg != null ? String(Math.abs(Number(fase.tempo_max_kg))) : '')
    setFout(null)
  }, [fase])

  // Wat er gaat gelden met wat er nú in de velden staat. Zonder dit vul je iets
  // in en weet je pas na opslaan wat 'te snel' wordt.
  const voorbeeldConfig = maakConfig(client, {
    doel: fase?.doel,
    week_doel_kg: perWeek === '' ? fase?.week_doel_kg : perWeek,
    start_gewicht: fase?.start_gewicht,
    tempo_min_kg: min === '' ? null : min,
    tempo_max_kg: max === '' ? null : max,
  })
  const voorbeeld = bereikTekst(voorbeeldConfig)
  const kcal = perWeek !== '' ? kcalPerWeektempo(Number(perWeek)) : null

  const bewaar = async () => {
    if (!fase?.id) return
    const nMin = min === '' ? null : Math.abs(Number(min))
    const nMax = max === '' ? null : Math.abs(Number(max))
    if (nMin != null && nMax != null && nMin > nMax) {
      setFout('De ondergrens is hoger dan de bovengrens.')
      return
    }
    const nWeek = perWeek === '' ? null : Number(perWeek)
    if (nWeek != null && !Number.isFinite(nWeek)) { setFout('Het weekdoel is geen getal.'); return }

    setBezig(true); setFout(null)
    const { error } = await db.supabase
      .from('client_phases')
      .update({ week_doel_kg: nWeek, tempo_min_kg: nMin, tempo_max_kg: nMax })
      .eq('id', fase.id)
    if (error) { setBezig(false); setFout(error.message); return }

    // De klantrij houdt hetzelfde getal bij; die wordt op andere plekken
    // gelezen, dus die moet mee.
    await db.supabase.from('clients').update({ weekly_weight_goal: nWeek }).eq('id', client.id)
    setBezig(false)
    onKlaar?.()
    onSluit?.()
  }

  const veld = {
    width: '100%', minHeight: 44, padding: '0 0.75rem',
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`, borderRadius: 10,
    color: '#fff', fontSize: '1rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none',
  }
  const label = {
    fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block',
  }

  return (
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 10050,
        background: 'rgba(0,0,0,0.8)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto',
          background: '#0a0a0a', border: `1px solid ${LIJN}`, borderRadius: 16,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: isMobile ? '0.9rem 1rem' : '1rem 1.25rem',
          borderBottom: `1px solid ${LIJN}`,
        }}>
          <Flag size={15} color="#fff" strokeWidth={2.6} />
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Doel per week
          </span>
          <button onClick={onSluit} aria-label="Sluiten" style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}>
            <X size={17} strokeWidth={2.6} />
          </button>
        </div>

        {!fase ? (
          <div style={{ padding: '1.5rem 1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 14 }}>
              {client.first_name} heeft nog geen fase. Het weekdoel hoort bij een fase, dus begin daar.
            </div>
            <button onClick={() => { onSluit?.(); onNieuweFase?.() }} style={{
              minHeight: 44, padding: '0 1.2rem', borderRadius: 10, border: 'none',
              background: '#fff', color: '#0a0a0a', fontSize: '0.9rem', fontWeight: 900,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>
              Fase starten
            </button>
          </div>
        ) : (
          <div style={{ padding: isMobile ? '1rem' : '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
              {DOELEN[fase.doel]?.label || fase.doel} sinds {datumNL(fase.started_on)}
              {fase.start_gewicht ? ` · start ${Number(fase.start_gewicht)} kg` : ''}
            </div>

            <div>
              <label style={label}>Doel per week</label>
              <input
                type="number" step="0.05" inputMode="decimal"
                value={perWeek}
                onChange={e => setPerWeek(e.target.value)}
                placeholder="bv. -0.5"
                style={veld}
              />
              <div style={{ marginTop: 6, fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45 }}>
                Met een min ervoor val je af, zonder kom je aan. Dit is de lijn in de grafiek.
                {kcal ? ` Komt neer op ongeveer ${kcal > 0 ? '+' : ''}${kcal} kcal per dag.` : ''}
              </div>
            </div>

            <div>
              <label style={label}>Goed tempo — van … tot</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number" step="0.05" min="0" inputMode="decimal"
                  value={min}
                  onChange={e => setMin(e.target.value)}
                  placeholder="minstens"
                  style={{ ...veld, flex: 1 }}
                />
                <input
                  type="number" step="0.05" min="0" inputMode="decimal"
                  value={max}
                  onChange={e => setMax(e.target.value)}
                  placeholder="hoogstens"
                  style={{ ...veld, flex: 1 }}
                />
              </div>
              <div style={{ marginTop: 6, fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45 }}>
                Zonder min-teken, allebei positief. Binnen dit bereik kleurt het weektempo groen.
                Laat je ze leeg, dan rekent de app het zelf uit vanaf het weekdoel.
              </div>
            </div>

            {voorbeeld && (
              <div style={{
                padding: '0.7rem 0.85rem', borderRadius: 10,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Wordt groen bij
                </div>
                <div style={{ marginTop: 3, fontSize: '1.1rem', fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em' }}>
                  {voorbeeld} <span style={{ fontSize: '0.6em', opacity: 0.7 }}>kg per week</span>
                </div>
                <div style={{ marginTop: 3, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                  {voorbeeldConfig.handmatig ? 'zelf ingesteld' : 'afgeleid van het weekdoel'}
                </div>
              </div>
            )}

            {fout && (
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>{fout}</div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onSluit} style={{
                flex: 1, minHeight: 44, borderRadius: 10, background: 'transparent',
                border: `1px solid ${LIJN}`, color: 'rgba(255,255,255,0.6)',
                fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
              }}>
                Annuleren
              </button>
              <button onClick={bewaar} disabled={bezig} style={{
                flex: 2, minHeight: 44, borderRadius: 10, border: 'none',
                background: bezig ? 'rgba(255,255,255,0.1)' : '#fff',
                color: bezig ? 'rgba(255,255,255,0.4)' : '#0a0a0a',
                fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit',
                cursor: bezig ? 'wait' : 'pointer',
              }}>
                {bezig ? 'Opslaan…' : 'Bewaren'}
              </button>
            </div>

            <button onClick={() => { onSluit?.(); onNieuweFase?.() }} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
              fontFamily: 'inherit', textAlign: 'left',
            }}>
              Of begin een nieuwe fase →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
