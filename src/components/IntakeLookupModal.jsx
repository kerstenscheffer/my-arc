// src/components/IntakeLookupModal.jsx
//
// Intake van een willekeurige klant opzoeken, vanaf elke pagina in CoachHub.
//
// De intake was alleen te bereiken via de klantkaart in Coach Command → inzicht
// → Intake. Wie in de Plan Analyzer of de workout builder zat, moest die hele
// route lopen en z'n werk verlaten. Deze modal hangt aan de zijbalk en toont
// dezelfde IntakeSummaryModal, met een klantkiezer ervoor.
//
// Bewust geen eigen weergave van de intake-antwoorden: dan zouden er twee
// plekken zijn die hetzelfde tonen en uit elkaar gaan lopen.
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../coach/ModalHost'
import { Search, X, User, ClipboardCheck } from 'lucide-react'
import IntakeSummaryModal from '../coach/tabs/client-info/IntakeSummaryModal'

export default function IntakeLookupModal({ db, isMobile, onClose, clients: clientsProp, onNavigate }) {
  const modalHost = useModalHost()
  const [clients, setClients] = useState(clientsProp || [])
  const [laden, setLaden] = useState(!clientsProp)
  const [zoek, setZoek] = useState('')
  const [gekozen, setGekozen] = useState(null)

  useEffect(() => {
    if (clientsProp?.length) { setClients(clientsProp); setLaden(false); return }
    let afgebroken = false
    ;(async () => {
      try {
        const { data } = await db.supabase
          .from('clients')
          .select('id, first_name, last_name, email, status')
          .is('deleted_at', null)
          .order('first_name')
        if (!afgebroken) setClients(data || [])
      } catch (e) {
        console.error('Klanten laden mislukt:', e?.message)
      } finally {
        if (!afgebroken) setLaden(false)
      }
    })()
    return () => { afgebroken = true }
  }, [db, clientsProp])

  // De lijst haalt bewust een smalle selectie op — je toont alleen naam en
  // e-mail. Maar de intake-weergave leest álle velden van het doorgegeven
  // object, dus met die smalle rij bleef zo goed als het hele overzicht leeg.
  // Bij het kiezen halen we daarom eerst de volledige rij op.
  const kiesKlant = async (c) => {
    setGekozen(c)   // meteen openen, niet wachten op het netwerk
    try {
      const { data } = await db.supabase
        .from('clients').select('*').eq('id', c.id).maybeSingle()
      if (data) setGekozen(data)
    } catch (e) {
      console.warn('Volledige klantgegevens laden mislukt:', e?.message)
    }
  }

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    const lijst = clients.filter(c => (c.status || 'active') !== 'deleted')
    if (!q) return lijst
    return lijst.filter(c =>
      `${c.first_name || ''} ${c.last_name || ''} ${c.email || ''}`.toLowerCase().includes(q))
  }, [clients, zoek])

  // Klant gekozen → de bestaande intake-weergave overnemen. Sluiten daarvan
  // brengt je terug naar de lijst, niet helemaal naar buiten: je bent meestal
  // meerdere klanten aan het nakijken.
  if (gekozen) {
    return (
      <IntakeSummaryModal
        db={db}
        client={gekozen}
        isMobile={isMobile}
        onClose={() => setGekozen(null)}
        // Springen naar een tabblad sluit ook deze kiezer — anders blijf je
        // met een modal over de pagina heen kijken waar je net heen ging.
        onNavigate={onNavigate ? (naar, c) => { onNavigate(naar, c); onClose?.() } : undefined}
      />
    )
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10600,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '2rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: isMobile ? '100%' : 460,
          maxHeight: isMobile ? '88vh' : '78vh',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: isMobile ? '16px 16px 0 0' : 16,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <ClipboardCheck size={17} color="#fff" />
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Intake bekijken
          </span>
          <button onClick={onClose} style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}><X size={17} /></button>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '0.7rem 1rem',
          padding: '0 0.6rem', height: 38, borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Search size={14} color="rgba(255,255,255,0.45)" />
          <input
            autoFocus={!isMobile}
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            placeholder="Zoek klant"
            style={{
              flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit',
            }}
          />
          {zoek && (
            <button onClick={() => setZoek('')} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
          {laden ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>
              Laden…
            </div>
          ) : gefilterd.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>
              Geen klanten gevonden
            </div>
          ) : gefilterd.map(c => {
            const inactief = (c.status || 'active') !== 'active'
            return (
              <button
                key={c.id}
                onClick={() => kiesKlant(c)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0.7rem 1rem',
                  background: 'none', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <User size={15} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
                <span style={{
                  flex: 1, minWidth: 0,
                  fontSize: '0.9rem', fontWeight: 800, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Naamloos'}
                </span>
                {inactief && (
                  <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                    inactief
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    modalHost
  )
}
