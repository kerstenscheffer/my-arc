// src/modules/results/ResultsHub.jsx
import React, { useState, useEffect, useMemo } from 'react'
import ResultsService from './ResultsService'
import WinsTab from './components/WinsTab'
import ExportTab from './components/ExportTab'
import CardGeneratorTab from './components/CardGeneratorTab'

const isMobile = window.innerWidth <= 768
const GOLD = '#FFD700'
const TABS = ['card generator', 'export', 'wins & reviews']

const GOAL_LABELS = {
  weight_loss: { label: 'Vet verlies',  color: '#10b981' },
  fat_loss:    { label: 'Vet verlies',  color: '#10b981' },
  muscle_gain: { label: 'Spieropbouw', color: GOLD },
  recomp:      { label: 'Recomp',      color: '#a78bfa' },
  strength:    { label: 'Kracht',      color: '#f97316' },
}

export default function ResultsHub({ db }) {
  const [tab, setTab]                       = useState('card generator')
  const [allClients, setAllClients]         = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [sidebarFilter, setSidebarFilter]     = useState('actief')
  const [data, setData]                     = useState(null)
  const [loading, setLoading]               = useState(false)
  const service                             = useMemo(() => new ResultsService(db.supabase), [db])

  // Laad alle clients (actief + inactief) — zelfde als CoachCommandCenter
  useEffect(() => {
    db.getAllClients().then(data => setAllClients(data || [])).catch(console.error)
  }, [db])
  const filteredSidebarClients              = useMemo(() =>
    allClients.filter(c => sidebarFilter === 'actief' ? c.status === 'active' : c.status === 'inactive'),
    [allClients, sidebarFilter]
  )

  // Auto-select first client
  useEffect(() => {
    if (allClients.length && !selectedClient) setSelectedClient(allClients.filter(c => c.status === 'active')[0] || allClients[0])
  }, [allClients])

  // Load data when client changes
  useEffect(() => {
    if (selectedClient) loadClientData(selectedClient)
  }, [selectedClient?.id])

  async function loadClientData(client) {
    setLoading(true)
    setData(null)
    try {
      const [weights, photos, prsByExercise] = await Promise.all([
        service.getWeightHistory(client.id),
        service.getProgressPhotos(client.id),
        service.getExercisePRs(client.id),
      ])
      setData({ weights, photos, prsByExercise })
    } catch (e) {
      console.error('ResultsHub loadClientData:', e)
    }
    setLoading(false)
  }

  const gConf = GOAL_LABELS[selectedClient?.primary_goal] || GOAL_LABELS.weight_loss

  return (
    <div style={{ background: '#0a0a0a', borderRadius: isMobile ? '10px' : '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : 'calc(100vh - 160px)', overflow: 'hidden' }}>

      {/* ── Linker sidebar ── */}
      <div style={{ flex: '0 0 160px', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', height: '100%' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Results Hub</span>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          {['actief', 'inactief'].map(f => (
            <button key={f} onClick={() => setSidebarFilter(f)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', fontSize: '9px', fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.06em', color: sidebarFilter === f ? GOLD : 'rgba(255,255,255,0.25)', borderBottom: sidebarFilter === f ? `2px solid ${GOLD}` : '2px solid transparent', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {filteredSidebarClients.map(c => {
            const g = GOAL_LABELS[c.primary_goal] || GOAL_LABELS.weight_loss
            const isSelected = selectedClient?.id === c.id
            return (
              <div key={c.id} onClick={() => setSelectedClient(c)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', background: isSelected ? 'rgba(255,215,0,0.05)' : 'transparent', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? GOLD : 'rgba(255,255,255,0.55)' }}>{c.first_name} {c.last_name?.[0]}.</span>
                  {c.status === 'inactive' && <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>OUT</span>}
                </div>
                <div style={{ fontSize: '9px', color: g.color, opacity: 0.7, marginTop: '1px' }}>{g.label}</div>
              </div>
            )
          })}
          {filteredSidebarClients.length === 0 && (
            <div style={{ padding: '16px 12px', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>Geen {sidebarFilter} clients</div>
          )}
        </div>
      </div>

      {/* ── Rechter content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Tabs + client header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', gap: '4px' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '10px', fontWeight: 700, textTransform: 'capitalize',
                color: tab === t ? GOLD : 'rgba(255,255,255,0.3)',
                borderBottom: tab === t ? `2px solid ${GOLD}` : '2px solid transparent',
                padding: '10px 8px', flexShrink: 0,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>{t}</button>
            ))}
          </div>
          {selectedClient && (
            <div style={{ padding: '5px 14px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{selectedClient.first_name} {selectedClient.last_name}</span>
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: gConf.color, background: gConf.color + '18', padding: '2px 7px', borderRadius: '4px' }}>{gConf.label}</span>
              {selectedClient.status === 'inactive' && <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '4px' }}>Inactief</span>}
              {loading && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>Laden...</span>}
            </div>
          )}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: tab === 'card generator' ? 'auto' : tab === 'export' ? 'auto' : 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {tab === 'wins & reviews' && <div style={{ flex: 1, overflowY: 'auto' }}><WinsTab client={selectedClient} service={service} /></div>}
          {tab === 'export' && <ExportTab client={selectedClient} data={data} />}
          {tab === 'card generator' && <CardGeneratorTab client={selectedClient} data={data} db={db} />}
        </div>
      </div>
    </div>
  )
}
