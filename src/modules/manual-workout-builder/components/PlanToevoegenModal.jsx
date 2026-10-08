// src/modules/manual-workout-builder/components/PlanToevoegenModal.jsx
//
// Een extra plan aan een klant geven, vanuit de kopbalk van de Workout
// Builder (de +). Twee wegen: een template van de coach als kopie bij de
// klant zetten (niet actief; wisselen doe je daarna met de wisselknop), of
// een nieuw leeg plan bouwen dat bij opslaan als extra plan wordt bewaard.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Calendar, Check } from 'lucide-react'

export default function PlanToevoegenModal({ client, templates = [], db, isMobile = false, onClose, onNieuw, onToegevoegd }) {
  const [zoek, setZoek] = useState('')
  const [bezigId, setBezigId] = useState(null)
  const [klaarIds, setKlaarIds] = useState([])

  const lijst = templates
    .filter(t => !t.is_archived)
    .filter(t => !zoek || (t.name || '').toLowerCase().includes(zoek.toLowerCase()))
    .sort((a, b) => (a.days_per_week || 0) - (b.days_per_week || 0) || (a.name || '').localeCompare(b.name || ''))

  const voegToe = async (tpl) => {
    if (bezigId) return
    setBezigId(tpl.id)
    try {
      const r = await db.assignTemplateToClient(tpl.id, client.id, false)
      if (!r?.success) throw new Error(r?.error || 'Toevoegen mislukt')
      setKlaarIds(ids => [...ids, tpl.id])
      onToegevoegd && onToegevoegd(r.schema)
    } catch (e) { console.error(e); alert('Toevoegen mislukt: ' + (e?.message || '')) }
    finally { setBezigId(null) }
  }

  const naam = client?.first_name || 'de klant'

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: isMobile ? '90vh' : '85vh', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: isMobile ? '18px 18px 0 0' : 18, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Plan toevoegen</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Extra plan voor {naam}. Het huidige plan blijft actief; wisselen doe je daarna.</div>
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} strokeWidth={2.6} /></button>
        </div>

        <div style={{ padding: '0.85rem 1.1rem 0' }}>
          <button onClick={() => { onNieuw && onNieuw(); onClose() }} style={{ width: '100%', minHeight: 48, borderRadius: 12, background: '#fff', color: '#000', border: 'none', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, touchAction: 'manipulation' }}>
            <Plus size={16} strokeWidth={3} /> Nieuw plan bouwen
          </button>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '1rem 0 0.5rem' }}>Of een template kopiëren</div>
          <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek template…" style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.8rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }} />
        </div>

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.6rem 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lijst.length === 0 && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', padding: '0.5rem 0' }}>Geen templates gevonden.</div>}
          {lijst.map(t => {
            const klaar = klaarIds.includes(t.id)
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.75rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name || 'Template'}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={11} /> {t.days_per_week || Object.keys(t.week_structure || {}).length} dagen{t.primary_goal ? ` · ${String(t.primary_goal).replace(/_/g, ' ')}` : ''}
                  </div>
                </div>
                <button onClick={() => voegToe(t)} disabled={!!bezigId || klaar} style={{ flexShrink: 0, minHeight: 36, padding: '0 0.8rem', borderRadius: 9, border: `1px solid ${klaar ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.2)'}`, background: klaar ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', color: klaar ? '#10b981' : '#fff', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: klaar ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, touchAction: 'manipulation' }}>
                  {klaar ? <><Check size={13} strokeWidth={3} /> Toegevoegd</> : bezigId === t.id ? '…' : 'Toevoegen'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
