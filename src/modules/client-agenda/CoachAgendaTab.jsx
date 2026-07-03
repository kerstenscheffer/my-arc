// CoachHub wrapper voor de client-agenda. Toont een dropdown om een
// klant te kiezen en daaronder de ClientAgendaView voor die klant.

import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import ClientAgendaView from './ClientAgendaView'

export default function CoachAgendaTab({ db, clients = [], selectedClient, onClientSelect, isMobile }) {
  const [internalClient, setInternalClient] = useState(selectedClient || null)

  useEffect(() => {
    if (selectedClient && selectedClient.id !== internalClient?.id) {
      setInternalClient(selectedClient)
    }
  }, [selectedClient])

  // Default eerste klant pakken zodra de lijst binnenkomt
  useEffect(() => {
    if (!internalClient && clients.length > 0) {
      setInternalClient(clients[0])
      onClientSelect?.(clients[0])
    }
  }, [clients, internalClient, onClientSelect])

  const handleChange = (e) => {
    const c = clients.find(x => x.id === e.target.value)
    if (c) {
      setInternalClient(c)
      onClientSelect?.(c)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: '#0a0a0a',
    }}>
      {/* Client picker */}
      <div style={{
        padding: isMobile ? '0.6rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        flexShrink: 0,
      }}>
        <User size={isMobile ? 14 : 16} color="rgba(255,255,255,0.4)" />
        <span style={{
          fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)',
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Client
        </span>
        <select
          value={internalClient?.id || ''}
          onChange={handleChange}
          style={{
            flex: 1, maxWidth: 360,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            color: '#fff',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.6rem',
            fontWeight: 600,
            outline: 'none',
          }}
        >
          {clients.length === 0 && <option value="">Geen klanten</option>}
          {clients.map(c => {
            const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email
            return <option key={c.id} value={c.id} style={{ background: '#111' }}>{name}</option>
          })}
        </select>
      </div>

      {/* Agenda view */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {internalClient
          ? <ClientAgendaView client={internalClient} db={db} isMobile={isMobile} />
          : (
            <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              Selecteer een client om hun agenda te zien.
            </div>
          )
        }
      </div>
    </div>
  )
}
