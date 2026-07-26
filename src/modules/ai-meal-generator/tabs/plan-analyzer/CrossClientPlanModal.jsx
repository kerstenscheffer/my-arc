// src/modules/ai-meal-generator/tabs/plan-analyzer/CrossClientPlanModal.jsx
// Kopieer een bestaand plan van EEN ANDERE klant naar de huidige klant.
// Twee stappen: kies een klant → kies één van diens plannen. Geeft de
// week_structure + naam terug via onCopy; de analyzer maakt er een nieuw
// client_meal_plans-plan van (via dezelfde hydrate-logica als een plan-load).
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ArrowLeft, User, FileText, Search } from 'lucide-react'

export default function CrossClientPlanModal({ db, coachId, currentClientId, onCopy, onClose, isMobile }) {
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)   // gekozen bron-klant
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoadingClients(true)
      try {
        let query = db.supabase.from('clients').select('id, first_name, last_name')
        if (coachId) query = query.eq('coach_id', coachId)
        const { data } = await query.order('first_name', { ascending: true })
        if (alive) setClients((data || []).filter(c => c.id !== currentClientId))
      } catch (e) { console.warn('CrossClient: clients laden mislukt', e); if (alive) setClients([]) }
      finally { if (alive) setLoadingClients(false) }
    })()
    return () => { alive = false }
  }, [db, coachId, currentClientId])

  const openClient = async (c) => {
    setPicked(c)
    setLoadingPlans(true)
    try {
      const { data } = await db.supabase
        .from('client_meal_plans')
        .select('id, template_name, week_structure, daily_calories, daily_protein, created_at')
        .eq('client_id', c.id)
        .order('created_at', { ascending: false })
        .limit(25)
      // Alleen plannen met een echte week-structuur zijn kopieerbaar.
      setPlans((data || []).filter(p => p.week_structure && Object.keys(p.week_structure).length > 0))
    } catch (e) { console.warn('CrossClient: plannen laden mislukt', e); setPlans([]) }
    finally { setLoadingPlans(false) }
  }

  const nameOf = (c) => `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Naamloos'
  const filtered = clients.filter(c => nameOf(c).toLowerCase().includes(q.trim().toLowerCase()))

  const row = (onClick, key, icon, title, sub) => (
    <button key={key} onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation' }}>
      <span style={{ flexShrink: 0, color: '#FFD700', display: 'flex' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>{sub}</div>}
      </div>
      <ChevronRight size={14} color="rgba(255,255,255,0.15)" />
    </button>
  )

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2147483550, padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#0d0d0d', border: '1px solid rgba(255,215,0,0.25)', borderRadius: isMobile ? '14px 14px 0 0' : 14, width: '100%', maxWidth: 460, maxHeight: isMobile ? '85vh' : '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          {picked ? (
            <button onClick={() => { setPicked(null); setPlans([]) }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 2, display: 'flex' }}><ArrowLeft size={18} /></button>
          ) : (
            <FileText size={16} color="#FFD700" />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{picked ? nameOf(picked) : 'Plan van andere klant'}</div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>{picked ? 'Kies een plan om te kopiëren' : 'Kies eerst een klant'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {!picked && (
            <>
              <div style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.4rem 0.6rem' }}>
                  <Search size={13} color="rgba(255,255,255,0.3)" />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Zoek klant…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem', fontFamily: 'inherit' }} />
                </div>
              </div>
              {loadingClients ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>Klanten laden…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>Geen klanten gevonden.</div>
              ) : filtered.map(c => row(() => openClient(c), c.id, <User size={16} />, nameOf(c)))}
            </>
          )}
          {picked && (
            loadingPlans ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>Plannen laden…</div>
            ) : plans.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>Deze klant heeft nog geen kopieerbaar plan.</div>
            ) : plans.map(p => row(
              () => { onCopy(p.week_structure, p.template_name); onClose() },
              p.id,
              <FileText size={16} />,
              p.template_name || 'Plan',
              `${p.daily_calories || '—'} kcal · ${new Date(p.created_at).toLocaleDateString('nl-NL')}`
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
