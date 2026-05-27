// src/modules/lead-management/components/kanban/LeadSourceModal.jsx
// Opens automatically right after a new lead is created so the coach
// attributes the source while it's still top-of-mind. Two real choices:
//   • via outreach campagne (coach DM'd them via a specific campaign)
//   • via lead magnet (lead engaged with a video / lead magnet first)
// Plus a "Anders / later" escape hatch with a small nudge that skipping
// hurts the weekly metrics.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Send, FileText, AlertTriangle, ArrowRight, CheckCircle,
  ChevronDown, Plus, Check,
} from 'lucide-react'

const GOLD = '#FFD700'

export default function LeadSourceModal({
  isOpen, onClose, lead, db, coachId, onAttributed,
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  const [campaigns, setCampaigns] = useState([])
  const [magnets, setMagnets] = useState([])
  const [loading, setLoading] = useState(true)

  // 'campaign' | 'magnet' | null (no choice yet)
  const [choice, setChoice] = useState(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [selectedMagnetId, setSelectedMagnetId] = useState('')
  const [saving, setSaving] = useState(false)
  // Inline magnet-creation
  const [showAllMagnets, setShowAllMagnets] = useState(false)
  const [newMagnetMode, setNewMagnetMode] = useState(false)
  const [newMagnetName, setNewMagnetName] = useState('')
  const [creatingMagnet, setCreatingMagnet] = useState(false)

  useEffect(() => {
    if (!isOpen || !coachId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        // Fetch campaigns, magnets, and a flat list of "which magnet was
        // attributed to which lead" so we can rank magnets by how often the
        // coach has actually used them. Most-used first → less scrolling.
        const [{ data: camps }, { data: mags }, { data: usage }] = await Promise.all([
          db.supabase.from('outreach_campaigns')
            .select('id, name, variant_tag, status')
            .eq('coach_id', coachId)
            .order('status', { ascending: true }) // active first
            .order('created_at', { ascending: false }),
          db.supabase.from('lead_magnets')
            .select('id, name, position, created_at')
            .eq('coach_id', coachId),
          db.supabase.from('call_leads')
            .select('source_lead_magnet_id')
            .eq('coach_id', coachId)
            .not('source_lead_magnet_id', 'is', null)
            .is('deleted_at', null),
        ])
        if (cancelled) return

        const useCount = {}
        ;(usage || []).forEach(u => {
          if (!u.source_lead_magnet_id) return
          useCount[u.source_lead_magnet_id] = (useCount[u.source_lead_magnet_id] || 0) + 1
        })
        const rankedMagnets = (mags || []).slice().sort((a, b) => {
          const dc = (useCount[b.id] || 0) - (useCount[a.id] || 0)
          if (dc !== 0) return dc
          // Tie-break: explicit position, then newest-first.
          const dp = (a.position ?? 0) - (b.position ?? 0)
          if (dp !== 0) return dp
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        }).map(m => ({ ...m, _useCount: useCount[m.id] || 0 }))

        setCampaigns(camps || [])
        setMagnets(rankedMagnets)
        // Pre-select most recent active campaign as a courtesy.
        const firstActive = (camps || []).find(c => c.status === 'active')
        if (firstActive) setSelectedCampaignId(firstActive.id)
        if (rankedMagnets.length === 1) setSelectedMagnetId(rankedMagnets[0].id)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isOpen, coachId, db])

  // Reset when re-opened for a new lead.
  useEffect(() => {
    if (!isOpen) {
      setChoice(null)
      setSelectedMagnetId('')
    }
  }, [isOpen, lead?.id])

  if (!isOpen || !lead) return null

  const canConfirm = (
    (choice === 'campaign' && selectedCampaignId) ||
    (choice === 'magnet' && selectedMagnetId)
  )

  const persist = async () => {
    if (!lead?.id || !canConfirm || saving) return
    setSaving(true)
    try {
      const updates = {}
      if (choice === 'campaign') {
        updates.outreach_campaign_id = selectedCampaignId
        updates.source_lead_magnet_id = null
      } else if (choice === 'magnet') {
        updates.source_lead_magnet_id = selectedMagnetId
        updates.outreach_campaign_id = null
        // ALSO mirror the magnet name into lead_magnets_shared. Two reasons:
        //   1. LeadDetailModalV2 reads from lead_magnets_shared (legacy text
        //      array). Without this, the picker shows the lead has no magnet
        //      even though we set the FK — confusing for the coach.
        //   2. The kanban card banner already falls back to shared[0] for
        //      backwards-compat, so mirroring keeps everything in sync.
        const magnet = magnets.find(m => m.id === selectedMagnetId)
        if (magnet?.name) {
          const existing = Array.isArray(lead.lead_magnets_shared) ? lead.lead_magnets_shared : []
          if (!existing.includes(magnet.name)) {
            updates.lead_magnets_shared = [magnet.name, ...existing]
          }
        }
      }
      const { error } = await db.supabase
        .from('call_leads').update(updates).eq('id', lead.id)
      if (error) throw error
      onAttributed?.(lead.id, updates)
      onClose?.()
    } catch (e) {
      console.error('LeadSourceModal save failed:', e)
      alert('Toewijzen mislukt — ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  const skip = () => onClose?.()

  const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Deze lead'

  const sheet = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) skip() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(6px)', zIndex: 2147483400,
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.25rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#0a0a0a',
        border: '1px solid rgba(255,215,0,0.25)',
        borderRadius: isMobile ? '16px 16px 0 0' : 14,
        display: 'flex', flexDirection: 'column',
        maxHeight: isMobile ? '92vh' : '85vh',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          flexShrink: 0, padding: '0.85rem 1rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.55rem',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,215,0,0.15)',
            border: '1px solid rgba(255,215,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={16} color={GOLD} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 800 }}>
              Hoe is dit gesprek geopend?
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem',
              marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {leadName}
            </div>
          </div>
          <button onClick={skip} style={iconBtn} title="Sluiten">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1rem' }}>
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              Laden…
            </div>
          ) : (
            <>
              {/* Choice 1: Campaign */}
              <ChoiceCard
                active={choice === 'campaign'}
                onClick={() => setChoice('campaign')}
                icon={<Send size={15} color={GOLD} />}
                title="Ik heb deze DM zelf geopend"
                sub="Via een outreach-campagne"
              >
                {choice === 'campaign' && (
                  campaigns.length === 0 ? (
                    <div style={{
                      padding: '0.6rem', marginTop: '0.5rem',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 6,
                      color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      Nog geen campagnes — maak er één aan via "Mijn berichten".
                    </div>
                  ) : (
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">— kies campagne —</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.variant_tag ? ` · ${c.variant_tag}` : ''}{c.status !== 'active' ? ` (${c.status})` : ''}
                        </option>
                      ))}
                    </select>
                  )
                )}
              </ChoiceCard>

              {/* Choice 2: Lead magnet */}
              <ChoiceCard
                active={choice === 'magnet'}
                onClick={() => setChoice('magnet')}
                icon={<FileText size={15} color="#3b82f6" />}
                title="Lead reageerde op een video / post"
                sub="Via een lead magnet"
              >
                {choice === 'magnet' && (
                  <MagnetList
                    magnets={magnets}
                    selectedId={selectedMagnetId}
                    onSelect={setSelectedMagnetId}
                    showAll={showAllMagnets}
                    onToggleShowAll={() => setShowAllMagnets(v => !v)}
                    newMagnetMode={newMagnetMode}
                    onStartNewMagnet={() => { setNewMagnetMode(true); setNewMagnetName('') }}
                    onCancelNewMagnet={() => { setNewMagnetMode(false); setNewMagnetName('') }}
                    newMagnetName={newMagnetName}
                    onNewMagnetName={setNewMagnetName}
                    creating={creatingMagnet}
                    onCreate={async () => {
                      const name = newMagnetName.trim()
                      if (!name) return
                      setCreatingMagnet(true)
                      try {
                        const { data, error } = await db.supabase
                          .from('lead_magnets')
                          .insert({ coach_id: coachId, name, position: magnets.length })
                          .select().single()
                        if (error) throw error
                        setMagnets(prev => [...prev, data])
                        setSelectedMagnetId(data.id)
                        setShowAllMagnets(true)
                        setNewMagnetMode(false)
                        setNewMagnetName('')
                      } catch (e) {
                        alert('Magnet aanmaken mislukt — ' + (e?.message || e))
                      } finally {
                        setCreatingMagnet(false)
                      }
                    }}
                  />
                )}
              </ChoiceCard>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, padding: '0.7rem 1rem calc(0.85rem + env(safe-area-inset-bottom))',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
        }}>
          <button
            onClick={persist}
            disabled={!canConfirm || saving}
            style={{
              minHeight: 46, padding: '0 0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              background: canConfirm ? GOLD : 'rgba(255,255,255,0.06)',
              color: canConfirm ? '#000' : 'rgba(255,255,255,0.3)',
              border: 'none', borderRadius: 8,
              fontWeight: 800, fontSize: '0.88rem',
              cursor: canConfirm && !saving ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation',
            }}
          >
            {saving ? 'Bewaren…' : 'Bron toewijzen'}
            {!saving && <ArrowRight size={15} strokeWidth={2.6} />}
          </button>
          <button
            onClick={skip}
            style={{
              minHeight: 38, padding: '0 0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.45)',
              fontWeight: 600, fontSize: '0.75rem',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <AlertTriangle size={12} />
            Anders / later (geen bron-attribution)
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}

function ChoiceCard({ active, onClick, icon, title, sub, children }) {
  return (
    <div style={{
      padding: '0.7rem 0.8rem',
      marginBottom: '0.55rem',
      borderRadius: 10,
      background: active ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.025)',
      border: active ? '1px solid rgba(255,215,0,0.35)' : '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer', touchAction: 'manipulation',
      transition: 'all 0.15s ease',
    }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.25 }}>
            {title}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: 1 }}>
            {sub}
          </div>
        </div>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: active ? `2px solid ${GOLD}` : '2px solid rgba(255,255,255,0.15)',
          background: active ? GOLD : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }} />}
        </div>
      </div>
      {children}
    </div>
  )
}

// Stacked button-list of lead magnets. Shows first 5 by default with a
// "Toon meer" expand, plus a "+ Magnet toevoegen" row that opens an inline
// name input. Selecting a magnet promotes it as the lead's primary source.
function MagnetList({
  magnets, selectedId, onSelect,
  showAll, onToggleShowAll,
  newMagnetMode, onStartNewMagnet, onCancelNewMagnet,
  newMagnetName, onNewMagnetName, creating, onCreate,
}) {
  const VISIBLE = 5
  const visible = showAll ? magnets : magnets.slice(0, VISIBLE)
  const overflowCount = Math.max(0, magnets.length - VISIBLE)

  return (
    <div style={{
      marginTop: '0.55rem',
      display: 'flex', flexDirection: 'column', gap: '0.3rem',
    }}>
      {magnets.length === 0 && !newMagnetMode && (
        <div style={{
          padding: '0.55rem 0.7rem',
          background: 'rgba(255,255,255,0.025)',
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: 6,
          color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem',
        }}>
          Nog geen lead magnets. Klik op "Magnet toevoegen" om er één te maken.
        </div>
      )}

      {visible.map(m => {
        const active = selectedId === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.7rem', minHeight: 38,
              background: active ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
              border: active ? '1px solid rgba(59,130,246,0.55)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7,
              color: '#fff',
              fontSize: '0.82rem', fontWeight: active ? 800 : 600,
              cursor: 'pointer', touchAction: 'manipulation',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: active ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.18)',
              background: active ? '#3b82f6' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {active && <Check size={9} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.name}
            </span>
            {(m._useCount || 0) > 0 && (
              <span style={{
                flexShrink: 0, fontSize: '0.6rem', fontWeight: 800,
                padding: '2px 7px', borderRadius: 10,
                background: active ? 'rgba(255,255,255,0.18)' : 'rgba(59,130,246,0.18)',
                color: active ? '#fff' : '#93c5fd',
                letterSpacing: '0.02em',
              }}>
                {m._useCount}×
              </span>
            )}
          </button>
        )
      })}

      {overflowCount > 0 && (
        <button
          type="button"
          onClick={onToggleShowAll}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            padding: '0.4rem', minHeight: 32,
            background: 'transparent', border: '1px dashed rgba(255,255,255,0.12)',
            borderRadius: 6, color: 'rgba(255,255,255,0.55)',
            fontSize: '0.72rem', fontWeight: 700,
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <ChevronDown size={12} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          {showAll ? 'Toon minder' : `Toon ${overflowCount} meer`}
        </button>
      )}

      {/* Inline "new magnet" form */}
      {newMagnetMode ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.4rem 0.5rem',
          background: 'rgba(255,215,0,0.06)',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: 7,
        }}>
          <input
            autoFocus
            value={newMagnetName}
            onChange={(e) => onNewMagnetName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onCreate() }}
            placeholder="Naam van nieuwe magnet…"
            style={{
              flex: 1, minWidth: 0, minHeight: 32,
              padding: '0.35rem 0.55rem',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5,
              color: '#fff', fontSize: '0.82rem', fontWeight: 600,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={!newMagnetName.trim() || creating}
            style={{
              minHeight: 32, padding: '0 0.7rem',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: newMagnetName.trim() && !creating ? GOLD : 'rgba(255,255,255,0.06)',
              color: newMagnetName.trim() && !creating ? '#000' : 'rgba(255,255,255,0.3)',
              border: 'none', borderRadius: 5,
              fontSize: '0.72rem', fontWeight: 800,
              cursor: newMagnetName.trim() && !creating ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation',
            }}
          >
            <Plus size={11} strokeWidth={3} /> {creating ? 'Bezig…' : 'Maak aan'}
          </button>
          <button
            type="button"
            onClick={onCancelNewMagnet}
            style={{
              minHeight: 32, minWidth: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 5, color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStartNewMagnet}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            padding: '0.45rem 0.7rem', minHeight: 36,
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 7, color: GOLD,
            fontSize: '0.78rem', fontWeight: 700,
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <Plus size={13} strokeWidth={2.6} /> Magnet toevoegen
        </button>
      )}
    </div>
  )
}

const iconBtn = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: 'none',
  borderRadius: 7, color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
}

const selectStyle = {
  width: '100%', boxSizing: 'border-box',
  marginTop: '0.55rem',
  padding: '0.55rem 0.7rem', minHeight: 42,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7, color: '#fff', fontSize: '0.85rem', fontWeight: 600,
  outline: 'none',
}
