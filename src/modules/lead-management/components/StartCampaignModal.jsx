// src/modules/lead-management/components/StartCampaignModal.jsx
// Kies welke outreach-campagne je start. Daarna verschijnt op elke lead-card
// een campagne-DM-knop die het campagne-bericht kopieert + het profiel opent.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Megaphone, Send, Check } from 'lucide-react'

export default function StartCampaignModal({ leadService, coachId, isMobile = false, onSelect, onClose }) {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const data = await leadService.getCampaigns(coachId)
        if (alive) setCampaigns((data || []).filter(c => c.status !== 'archived'))
      } catch (e) { console.error('Campagnes laden mislukt:', e); if (alive) setCampaigns([]) }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [leadService, coachId])

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 540, maxHeight: isMobile ? '90vh' : '82vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(168,85,247,0.28)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}
      >
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.8rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
          <Megaphone size={17} color="#a855f7" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>Start een campagne</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', marginTop: 1 }}>Kies welke je uitvoert — dan krijgt elke lead-card een DM-knop.</div>
          </div>
          <button onClick={onClose} title="Sluiten" style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Nog geen campagnes. Maak er eerst een aan in de Analytics-tab (met een bericht-tekst).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {campaigns.map(c => {
                const noMsg = !c.message_text
                return (
                  <button
                    key={c.id}
                    onClick={() => !noMsg && onSelect(c)}
                    disabled={noMsg}
                    title={noMsg ? 'Deze campagne heeft geen bericht-tekst' : `Start ${c.name}`}
                    style={{
                      textAlign: 'left', width: '100%', padding: '0.75rem 0.85rem', borderRadius: 11,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      cursor: noMsg ? 'not-allowed' : 'pointer', opacity: noMsg ? 0.5 : 1, fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: c.message_text ? '0.5rem' : 0 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name || 'Naamloze campagne'}{c.variant_tag ? ` · ${c.variant_tag}` : ''}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                          {c.platform || 'instagram'}{c.purpose ? ` · ${c.purpose}` : ''}
                        </div>
                      </div>
                      {!noMsg && <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.28rem 0.6rem', borderRadius: 8, fontSize: '0.62rem', fontWeight: 800, background: 'rgba(168,85,247,0.14)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7' }}><Send size={11} /> Start</span>}
                    </div>
                    {c.message_text && (
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.5rem 0.6rem' }}>
                        {c.message_text}
                      </div>
                    )}
                    {noMsg && <div style={{ fontSize: '0.62rem', color: 'rgba(239,68,68,0.7)', fontWeight: 700 }}>Geen bericht-tekst — voeg er een toe in de Analytics-tab.</div>}
                  </button>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: '0.85rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Check size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            Gebruik <b style={{ color: 'rgba(255,255,255,0.55)' }}>[naam]</b> in je bericht — dat wordt automatisch de voornaam van de lead.
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
