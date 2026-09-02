// src/modules/ai-meal-generator/tabs/plan-analyzer/SupplementAssignPanel.jsx
//
// Supplementen toewijzen per dag, vanuit de Plan Analyzer.
//
// Een supplementenplan gold tot nu toe voor de hele week. Dat klopt voor
// vitamine D, maar niet voor creatine op trainingsdagen of een shake alleen
// na de gym. Daarom krijgt elk supplement een `days`-lijst in de bestaande
// jsonb — geen migratie nodig, en een supplement zonder dat veld geldt nog
// steeds elke dag, zodat bestaande plannen ongewijzigd blijven werken.
//
// Wat hier NIET kan: supplementen toevoegen of hun dosering wijzigen. Dat
// blijft de Supplementen-tab. Dit paneel doet één ding.

import { useEffect, useState } from 'react'
import { Pill, X, Check, Loader, Dumbbell } from 'lucide-react'
import {
  laadSupplementen, doseringTekst, momentVanSupplement, minutenNaarKlok,
  DAG_SLEUTELS, DAG_KORT, dagenVanSupplement,
} from '../../../supplements/utils/supplementSchedule'

export default function SupplementAssignPanel({ db, clientId, trainingDays, isMobile, onClose, onSaved }) {
  const m = isMobile
  const [supplementen, setSupplementen] = useState(null)
  const [planId, setPlanId] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [bewaard, setBewaard] = useState(false)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    if (!clientId) { setSupplementen([]); return }
    let afgebroken = false
    ;(async () => {
      const { data } = await db.supabase
        .from('supplement_plans')
        .select('id, supplements')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
      if (afgebroken) return
      setPlanId(data?.[0]?.id || null)
      setSupplementen(await laadSupplementen(db.supabase, clientId))
    })()
    return () => { afgebroken = true }
  }, [db, clientId])

  const wisselDag = (index, dag) => {
    setBewaard(false)
    setSupplementen(vorige => vorige.map((s, i) => {
      if (i !== index) return s
      const huidig = dagenVanSupplement(s)
      const nieuw = huidig.includes(dag) ? huidig.filter(d => d !== dag) : [...huidig, dag]
      // Sorteren op weekvolgorde, anders staat de opgeslagen lijst in
      // kliknvolgorde en leest de data rommelig terug.
      return { ...s, days: DAG_SLEUTELS.filter(d => nieuw.includes(d)) }
    }))
  }

  const zetAlles = (index, dagen) => {
    setBewaard(false)
    setSupplementen(vorige => vorige.map((s, i) => i === index ? { ...s, days: dagen } : s))
  }

  const opslaan = async () => {
    if (!planId) { setFout('Geen actief supplementenplan voor deze klant'); return }
    setBezig(true); setFout(null)
    try {
      const { error } = await db.supabase
        .from('supplement_plans')
        .update({ supplements: supplementen, updated_at: new Date().toISOString() })
        .eq('id', planId)
      if (error) throw error
      setBewaard(true)
      onSaved?.()
    } catch (e) {
      console.error('Supplementen opslaan mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
    } finally { setBezig(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0.6rem 0.8rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
      }}>
        <Pill size={15} color="#fff" />
        <span style={{ flex: 1, fontSize: m ? '0.85rem' : '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Supplementen
        </span>
        <button onClick={onClose} style={{
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 7, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
        }}><X size={15} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {supplementen === null ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 700 }}>
            Laden…
          </div>
        ) : !clientId ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 700 }}>
            Selecteer eerst een klant.
          </div>
        ) : supplementen.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.5 }}>
            Geen actief supplementenplan.<br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Maak er een in de Supplementen-tab.</span>
          </div>
        ) : supplementen.map((s, i) => {
          const dagen = dagenVanSupplement(s)
          const minuten = momentVanSupplement(s)
          const dosering = doseringTekst(s)
          const alleDagen = dagen.length === 7
          return (
            <div key={i} style={{
              padding: m ? '0.6rem 0.7rem' : '0.65rem 0.85rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                {s.emoji && <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{s.emoji}</span>}
                <span style={{
                  flex: 1, minWidth: 0, fontSize: m ? '0.82rem' : '0.88rem', fontWeight: 800, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {s.name}
                </span>
                <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                  {[minuten != null ? minutenNaarKlok(minuten) : 'flexibel', dosering].filter(Boolean).join(' · ')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 3 }}>
                {DAG_SLEUTELS.map(dag => {
                  const aan = dagen.includes(dag)
                  const traint = trainingDays?.includes(dag)
                  return (
                    <button
                      key={dag}
                      onClick={() => wisselDag(i, dag)}
                      title={traint ? 'Trainingsdag' : undefined}
                      style={{
                        flex: 1, minWidth: 0, padding: '0.35rem 0',
                        background: aan ? '#fff' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 6,
                        color: aan ? '#000' : 'rgba(255,255,255,0.4)',
                        fontSize: '0.68rem', fontWeight: 900, fontFamily: 'inherit',
                        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                      }}
                    >
                      {DAG_KORT[dag]}
                      {/* Stipje op trainingsdagen — je stelt creatine of een
                          shake meestal juist dáárop in. */}
                      {traint && (
                        <span style={{
                          position: 'absolute', top: 2, right: 3,
                          width: 3, height: 3, borderRadius: '50%',
                          background: aan ? '#000' : '#3b82f6', opacity: aan ? 0.35 : 1,
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                <button onClick={() => zetAlles(i, [...DAG_SLEUTELS])} disabled={alleDagen} style={snelKnop(alleDagen)}>
                  Elke dag
                </button>
                {trainingDays?.length > 0 && (
                  <button onClick={() => zetAlles(i, DAG_SLEUTELS.filter(d => trainingDays.includes(d)))} style={snelKnop(false)}>
                    <Dumbbell size={9} style={{ verticalAlign: -1 }} /> Alleen trainingsdagen
                  </button>
                )}
                <button onClick={() => zetAlles(i, [])} disabled={dagen.length === 0} style={snelKnop(dagen.length === 0)}>
                  Geen
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {supplementen?.length > 0 && (
        <div style={{ padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          {fout && (
            <div style={{ marginBottom: 6, fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>{fout}</div>
          )}
          <button
            onClick={opslaan}
            disabled={bezig}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '0.7rem', borderRadius: 9,
              background: bewaard ? 'rgba(16,185,129,0.12)' : '#fff',
              border: bewaard ? '1px solid rgba(16,185,129,0.4)' : '1px solid #fff',
              color: bewaard ? '#10b981' : '#000',
              fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
              cursor: bezig ? 'default' : 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {bezig ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : bewaard ? <Check size={14} /> : null}
            {bezig ? 'Opslaan…' : bewaard ? 'Opgeslagen' : 'Opslaan'}
          </button>
        </div>
      )}
    </div>
  )
}

const snelKnop = (uit) => ({
  background: 'none', border: 'none', padding: 0,
  color: uit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
  fontSize: '0.68rem', fontWeight: 800, fontFamily: 'inherit',
  cursor: uit ? 'default' : 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
