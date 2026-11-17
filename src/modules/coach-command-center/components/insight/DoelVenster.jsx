// src/modules/coach-command-center/components/insight/DoelVenster.jsx
//
// Klik op de naam van de klant in Coach Inzicht (17 nov 2026, Kersten): waar
// deed hij het voor? Het doel uit de intake, waarom dat voor hem telt (zijn
// eigen woorden eerst) en de lichamen die hij aanklikte: waar hij nu staat en
// waar hij naartoe wil. Alleen lezen; aanpassen doe je bij Gegevens.
//
// De klantenlijst laadt de intake-kolommen niet mee (laadsnelheid), dus dit
// venster haalt ze zelf op als het opent.

import { useEffect, useState } from 'react'
import { Target, X } from 'lucide-react'
import { intakeLichaamFotos } from '../../utils/intakeLichaam'
import { PRIVE } from '../../utils/privacyModus'

const KOLOMMEN = 'id, primary_goal, current_weight, target_weight, goal_timeline, goal_urgency, motivation, motivation_verbatim, lichaam_omschrijving, fitness_doel_tags, coaching_goal_tags, current_body_fat, current_body_fat_2, target_body_fat, muscle_goal_type'
const DOEL = { fat_loss: 'Vetverlies', muscle_gain: 'Spieropbouw', recomp: 'Recompositie', general_fitness: 'Algemene fitness' }
const TIJD = { 3: '3 maanden', 6: '6 maanden', 12: '12 maanden', no_rush: 'Geen haast' }

const tekst = (v) => (v == null ? '' : String(v).trim())
// Tags staan als array, als json-tekst of als komma-lijst in de klantrij.
const lijst = (v) => {
  if (Array.isArray(v)) return v.map(tekst).filter(Boolean)
  const s = tekst(v)
  if (!s) return []
  if (s.startsWith('[')) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map(tekst).filter(Boolean) } catch { /* gewone tekst */ } }
  return s.split(',').map(x => x.trim()).filter(Boolean)
}
const kg = (v) => (Number(v) > 0 ? `${String(Math.round(Number(v) * 10) / 10).replace('.', ',')} kg` : null)

const kop = { fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 5px' }

export default function DoelVenster({ client, db, onSluit }) {
  const [rij, setRij] = useState(null)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return undefined
    let weg = false
    db.supabase.from('clients').select(KOLOMMEN).eq('id', client.id).single()
      .then(({ data, error }) => {
        if (weg) return
        if (error) setFout(error.message || 'Laden mislukt')
        else setRij(data)
      }, (e) => { if (!weg) setFout(e?.message || 'Laden mislukt') })
    return () => { weg = true }
  }, [client?.id, db])

  const c = rij || {}
  const { nu, doel } = rij ? intakeLichaamFotos(c) : { nu: [], doel: [] }
  const eigenWoorden = tekst(c.motivation_verbatim)
  const motivatie = tekst(c.motivation)
  const gewenst = tekst(c.lichaam_omschrijving)
  const tags = [...lijst(c.fitness_doel_tags), ...lijst(c.coaching_goal_tags)]
  const doelRegel = [
    DOEL[c.primary_goal] || tekst(c.primary_goal),
    kg(c.current_weight) && kg(c.target_weight) ? `${kg(c.current_weight)} → ${kg(c.target_weight)}` : kg(c.target_weight) ? `naar ${kg(c.target_weight)}` : null,
    TIJD[c.goal_timeline] || null,
  ].filter(Boolean)
  const leeg = rij && !doelRegel.length && !eigenWoorden && !motivatie && !gewenst && !tags.length && !nu.length && !doel.length

  const groep = (titel, fotos) => fotos.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ ...kop, margin: 0 }}>{titel}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {fotos.map(f => (
          <div key={f.img} style={{ textAlign: 'center' }}>
            <img src={f.img} alt={f.label} style={{ width: 104, height: 138, objectFit: 'cover', borderRadius: 12, display: 'block', background: '#151515' }} />
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fff', marginTop: 4, maxWidth: 104, lineHeight: 1.2 }}>{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onSluit() }}
      style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-label="Doel van de klant" style={{ width: '100%', maxWidth: 520, maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 0.7rem 0.4rem 1rem' }}>
          <Target size={15} color="#fff" strokeWidth={2.4} />
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
            Waar doet <span className={PRIVE}>{client?.first_name || 'de klant'}</span> het voor
          </span>
          <button onClick={onSluit} aria-label="Sluiten" style={{ width: 30, height: 30, padding: 0, borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.5rem 1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fout && <div role="alert" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>{fout}</div>}
          {!rij && !fout && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Laden…</div>}
          {leeg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>In de intake staat nog niets over het doel.</div>}

          {(nu.length > 0 || doel.length > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              {groep(nu.length > 1 ? 'Nu · tussenin' : 'Nu', nu)}
              {nu.length > 0 && doel.length > 0 && <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)' }}>→</span>}
              {groep('Wil naar', doel)}
            </div>
          )}

          {doelRegel.length > 0 && (
            <div>
              <div style={kop}>Doel</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{doelRegel.join(' · ')}</div>
            </div>
          )}

          {(eigenWoorden || motivatie || Number(c.goal_urgency) > 0) && (
            <div>
              <div style={{ ...kop, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span>Waarom dit belangrijk is</span>
                {Number(c.goal_urgency) > 0 && <span style={{ marginLeft: 'auto', color: '#fff', letterSpacing: 0 }}>{c.goal_urgency}/10 belangrijk</span>}
              </div>
              {eigenWoorden && (
                <div className={PRIVE} style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', lineHeight: 1.45, borderLeft: '3px solid #10b981', paddingLeft: 10, whiteSpace: 'pre-wrap' }}>{eigenWoorden}</div>
              )}
              {motivatie && motivatie !== eigenWoorden && (
                <div className={PRIVE} style={{ fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, marginTop: eigenWoorden ? 8 : 0, whiteSpace: 'pre-wrap' }}>{motivatie}</div>
              )}
            </div>
          )}

          {gewenst && (
            <div>
              <div style={kop}>Zijn ideale lichaam</div>
              <div className={PRIVE} style={{ fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{gewenst}</div>
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <div style={kop}>Wat hij eruit wil halen</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map((t, i) => (
                  <span key={`${t}-${i}`} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
