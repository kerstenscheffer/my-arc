// CoachHub wrapper voor de client-agenda. Toont een dropdown om een
// klant te kiezen en daaronder de ClientAgendaView voor die klant.

import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import ClientAgendaView from './ClientAgendaView'
import { balkVak } from './werkbalkStijl'

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
      {/* De klantkiezer stond als eigen regel boven de agenda. Hij schuift
          nu de werkbalk van de agenda in, zodat klantnaam, week, inplannen,
          selecteren en het weekbudget samen op één regel staan. */}
      {/* Agenda view */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {internalClient
          ? <ClientAgendaView
              client={internalClient} db={db} isMobile={isMobile}
              werkbalkExtra={(
                <div style={balkVak(isMobile, { padding: '0 0 0 0.5rem', color: '#fff' })}>
                  <User size={12} color="rgba(255,255,255,0.4)" />
                  <select
                    value={internalClient?.id || ''}
                    onChange={handleChange}
                    aria-label="Client"
                    style={{
                      maxWidth: isMobile ? 140 : 200,
                      height: '100%', background: 'transparent', border: 'none',
                      color: 'inherit', font: 'inherit', cursor: 'pointer',
                      outline: 'none', padding: '0 0.5rem 0 0.35rem',
                    }}
                  >
                    {clients.length === 0 && <option value="">Geen klanten</option>}
                    {clients.map(c => {
                      const naam = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email
                      return <option key={c.id} value={c.id} style={{ background: '#111' }}>{naam}</option>
                    })}
                  </select>
                </div>
              )}
            />
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
