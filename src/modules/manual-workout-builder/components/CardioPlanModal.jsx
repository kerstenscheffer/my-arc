// src/modules/manual-workout-builder/components/CardioPlanModal.jsx
//
// Cardio per klant, los van het krachtschema. Zat eerder als item ín een
// trainingsdag; dan bestaat cardio alleen op dagen dat er ook getraind wordt,
// terwijl je juist vaak wandelen of fietsen op de rustdagen wil. Deze regels
// horen bij de klant, niet bij het schema, en worden hier meteen opgeslagen.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Heart } from 'lucide-react'
import CardioService from '../../workout/services/CardioService'

const SOORTEN = ['Wandelen', 'Hardlopen', 'Fietsen', 'Zwemmen', 'Roeien', 'Crosstrainer', 'HIIT', 'Stairmaster']

const leegItem = (clientId, volgorde) => ({
  client_id: clientId, cardio_type: '', times_per_week: 3,
  duration_minutes: '', distance_km: '', steps: '', intensity: '', notes: '',
  sort_order: volgorde,
})

export default function CardioPlanModal({ client, db, isMobile, onClose }) {
  const m = isMobile
  const [items, setItems] = useState([])
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [nieuw, setNieuw] = useState(null)

  useEffect(() => { laad() }, [client?.id])

  const laad = async () => {
    setLaden(true)
    const plan = await CardioService.getPlan(client?.id, db)
    setItems(plan)
    setLaden(false)
  }

  const bewaar = async (item) => {
    if (!item.cardio_type?.trim()) return
    setBezig(true)
    const bewaard = await CardioService.savePlanItem({ ...item, client_id: client.id }, db)
    setBezig(false)
    if (!bewaard) { alert('Opslaan mislukt.'); return }
    setNieuw(null)
    await laad()
  }

  const weg = async (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    const gelukt = await CardioService.deactivatePlanItem(id, db)
    if (!gelukt) await laad()
  }

  const isWandelen = (soort) => String(soort || '').trim().toLowerCase() === 'wandelen'

  const regel = (item, opslaan, annuleer) => (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10, padding: m ? '0.7rem' : '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {SOORTEN.map(s => {
          const aan = item.cardio_type === s
          return (
            <button key={s} onClick={() => opslaan({ ...item, cardio_type: s })}
              style={{
                padding: '0.3rem 0.6rem', borderRadius: 7,
                background: aan ? '#fff' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.65)',
                fontSize: '0.72rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
              }}>{s}</button>
          )
        })}
      </div>
      <input value={item.cardio_type} onChange={e => opslaan({ ...item, cardio_type: e.target.value })}
        placeholder="Soort cardio" style={veld} />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Getal label="× per week" waarde={item.times_per_week}
          zet={v => opslaan({ ...item, times_per_week: v })} plaats="3" />
        <Getal label="Duur (min)" waarde={item.duration_minutes}
          zet={v => opslaan({ ...item, duration_minutes: v })} plaats="30" />
        <Getal label="Afstand (km)" waarde={item.distance_km}
          zet={v => opslaan({ ...item, distance_km: v })} plaats="5" />
        {isWandelen(item.cardio_type) && (
          <Getal label="Stappen" waarde={item.steps}
            zet={v => opslaan({ ...item, steps: v })} plaats="10000" />
        )}
      </div>

      <input value={item.notes || ''} onChange={e => opslaan({ ...item, notes: e.target.value })}
        placeholder="Notitie voor de klant (optioneel)" style={veld} />

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {annuleer && (
          <button onClick={annuleer} style={{ ...knop, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
            Annuleren
          </button>
        )}
        <button onClick={() => bewaar(item)} disabled={bezig || !item.cardio_type?.trim()}
          style={{ ...knop, opacity: (bezig || !item.cardio_type?.trim()) ? 0.4 : 1 }}>
          {bezig ? 'Opslaan…' : 'Opslaan'}
        </button>
      </div>
    </div>
  )

  return createPortal(
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#0a0a0a', width: '100%', maxWidth: 560, maxHeight: '88vh',
        borderRadius: m ? '16px 16px 0 0' : 14, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Heart size={16} color="#f87171" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>Cardio</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {`${client?.first_name || ''} ${client?.last_name || ''}`.trim() || 'Klant'}
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Sluit" style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {laden ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div>
          ) : (
            <>
              {items.length === 0 && !nieuw && (
                <div style={{ padding: '1.25rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 700 }}>
                  Nog geen cardio ingesteld. Dit staat los van het schema en verschijnt bij de klant op de workout-pagina.
                </div>
              )}

              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <BestaandeRegel item={item} render={regel} />
                  </div>
                  <button onClick={() => weg(item.id)} aria-label="Verwijder"
                    style={{ width: 38, flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 9, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {nieuw
                ? regel(nieuw, setNieuw, () => setNieuw(null))
                : (
                  <button onClick={() => setNieuw(leegItem(client.id, items.length))}
                    style={{ ...knop, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.6rem' }}>
                    <Plus size={15} strokeWidth={2.8} /> Cardio toevoegen
                  </button>
                )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Een bestaande regel houdt zijn eigen concept-staat bij, zodat typen in het
// ene item de andere niet opnieuw laat renderen.
function BestaandeRegel({ item, render }) {
  const [concept, setConcept] = useState(item)
  useEffect(() => { setConcept(item) }, [item.id, item.updated_at])
  return render(concept, setConcept, null)
}

function Getal({ label, waarde, zet, plaats }) {
  return (
    <div style={{ flex: '1 1 110px', minWidth: 100 }}>
      <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
      <input type="number" inputMode="numeric" value={waarde ?? ''} placeholder={plaats}
        onChange={e => zet(e.target.value)} style={veld} />
    </div>
  )
}

const veld = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.5rem 0.65rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: '#fff', fontSize: '0.82rem', fontWeight: 700,
  fontFamily: 'inherit', outline: 'none',
}

const knop = {
  padding: '0.45rem 0.9rem', borderRadius: 8, border: 'none',
  background: '#fff', color: '#0a0a0a',
  fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
