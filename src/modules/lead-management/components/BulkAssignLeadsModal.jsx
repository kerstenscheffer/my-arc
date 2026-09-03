// src/modules/lead-management/components/BulkAssignLeadsModal.jsx
// Bulk-attribute oude call_leads aan een outreach_campaign via datum-matching.
//
// Strategie:
//   1. Pak alle leads zonder outreach_campaign_id voor deze coach.
//   2. Pak alle campagnes met hun send_date range (min..max).
//   3. Groepeer leads onder de campagne(s) waarbij created_at binnen de
//      send-date range valt. Een lead kan in meerdere groepen vallen — we
//      laten de gebruiker per groep beslissen.
//   4. Leads zonder overlap belanden in "Handmatig" voor manuele toekenning.
//
// UI: per groep een card met checkboxes en een grote "Allemaal koppelen" knop.

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import {
  X, Link2, Check, Calendar, Send, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default function BulkAssignLeadsModal({ coachId, isMobile, onClose, onDone }) {
  const modalHost = useModalHost()
  const [campaigns, setCampaigns] = useState([])
  const [sendsByCampaign, setSendsByCampaign] = useState({}) // { campaign_id: { min, max } }
  const [leads, setLeads] = useState([])                    // unattributed
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [selection, setSelection] = useState({})            // { lead_id: true }
  const [manualCampaign, setManualCampaign] = useState('')
  const [feedback, setFeedback] = useState(null)            // { msg, kind: 'success'|'error' }

  useEffect(() => {
    if (!coachId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [campRes, sendRes, leadRes] = await Promise.all([
          supabase.from('outreach_campaigns')
            .select('id, name, variant_tag, status')
            .eq('coach_id', coachId)
            .order('created_at', { ascending: false }),
          supabase.from('outreach_sends')
            .select('campaign_id, send_date')
            .eq('coach_id', coachId),
          supabase.from('call_leads')
            .select('id, first_name, last_name, lead_source, created_at')
            .eq('coach_id', coachId)
            .is('deleted_at', null)
            .is('outreach_campaign_id', null)
            .order('created_at', { ascending: false }),
        ])
        if (cancelled) return

        const camps = campRes.data || []
        const ranges = {}
        ;(sendRes.data || []).forEach(s => {
          const r = ranges[s.campaign_id]
          if (!r) ranges[s.campaign_id] = { min: s.send_date, max: s.send_date }
          else {
            if (s.send_date < r.min) r.min = s.send_date
            if (s.send_date > r.max) r.max = s.send_date
          }
        })

        setCampaigns(camps)
        setSendsByCampaign(ranges)
        setLeads(leadRes.data || [])
      } catch (err) {
        console.error('Load bulk-assign data failed:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [coachId])

  // ── Grouping logic ───────────────────────────────────────────────────────
  // For each campaign that has send_date range, find leads whose created_at
  // falls inside that window (with 1-day grace on each side). Leads can
  // appear under multiple campaigns if ranges overlap — that's intentional:
  // user picks which one fits.
  const groups = useMemo(() => {
    const out = []
    const matched = new Set()
    campaigns.forEach(c => {
      const range = sendsByCampaign[c.id]
      if (!range) return
      const min = new Date(range.min + 'T00:00:00')
      // 1 dag grace na laatste verzending — replies komen vaak een dag later.
      const max = new Date(range.max + 'T23:59:59')
      max.setDate(max.getDate() + 1)
      const inRange = leads.filter(l => {
        if (!l.created_at) return false
        const t = new Date(l.created_at).getTime()
        return t >= min.getTime() && t <= max.getTime()
      })
      if (inRange.length === 0) return
      inRange.forEach(l => matched.add(l.id))
      out.push({
        campaign: c,
        range,
        leads: inRange,
      })
    })
    const unmatched = leads.filter(l => !matched.has(l.id))
    return { suggested: out, unmatched }
  }, [campaigns, sendsByCampaign, leads])

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleLead = (id) => setSelection(prev => ({ ...prev, [id]: !prev[id] }))
  const selectAllInGroup = (groupLeads) => {
    setSelection(prev => {
      const next = { ...prev }
      groupLeads.forEach(l => { next[l.id] = true })
      return next
    })
  }
  const clearSelectionForLeads = (leadIds) => {
    setSelection(prev => {
      const next = { ...prev }
      leadIds.forEach(id => { delete next[id] })
      return next
    })
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  const assignLeadsToCampaign = async (leadIds, campaignId) => {
    if (!leadIds.length || !campaignId) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('call_leads')
        .update({ outreach_campaign_id: campaignId, last_touched: new Date().toISOString() })
        .in('id', leadIds)
      if (error) throw error
      // Remove from local list + clear selection.
      setLeads(prev => prev.filter(l => !leadIds.includes(l.id)))
      clearSelectionForLeads(leadIds)
      setFeedback({ msg: `${leadIds.length} ${leadIds.length === 1 ? 'lead' : 'leads'} gekoppeld!`, kind: 'success' })
      setTimeout(() => setFeedback(null), 2500)
    } catch (err) {
      console.error('Bulk assign failed:', err)
      setFeedback({ msg: 'Koppelen mislukt — probeer opnieuw', kind: 'error' })
      setTimeout(() => setFeedback(null), 3000)
    } finally {
      setBusy(false)
    }
  }

  const assignAllInGroup = async (group) => {
    const ids = group.leads.map(l => l.id)
    await assignLeadsToCampaign(ids, group.campaign.id)
  }
  const assignSelectedInGroup = async (group) => {
    const ids = group.leads.filter(l => selection[l.id]).map(l => l.id)
    if (!ids.length) {
      // Default: if niets aangevinkt → behandel als "alle"
      return assignAllInGroup(group)
    }
    await assignLeadsToCampaign(ids, group.campaign.id)
  }
  const assignManual = async () => {
    if (!manualCampaign) {
      alert('Kies eerst een bericht')
      return
    }
    const ids = groups.unmatched.filter(l => selection[l.id]).map(l => l.id)
    if (!ids.length) { alert('Selecteer eerst leads'); return }
    await assignLeadsToCampaign(ids, manualCampaign)
  }

  const handleClose = () => {
    if (onDone) onDone()
    onClose()
  }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '2rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '760px',
        maxHeight: isMobile ? '94vh' : '92vh',
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '14px 14px 0 0' : '14px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* HEADER */}
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1.125rem 1.25rem',
          paddingTop: `calc(env(safe-area-inset-top, 0) + ${isMobile ? '0.875rem' : '1.125rem'})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.7rem',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Link2 size={18} color="#10b981" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.01em' }}>
              Oude leads toekennen
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem', fontWeight: '600' }}>
              Koppel leads aan het bericht dat ze binnenbracht.
            </div>
          </div>
          <button onClick={handleClose} style={iconBtnStyle} aria-label="Sluiten"><X size={16} /></button>
        </div>

        {/* COUNTER STRIP */}
        {!loading && (
          <div style={{
            padding: '0.55rem 1rem',
            background: leads.length === 0 ? 'rgba(16,185,129,0.06)' : 'rgba(255,215,0,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.78rem', fontWeight: '700',
          }}>
            {leads.length === 0 ? (
              <>
                <Check size={13} color="#10b981" />
                <span style={{ color: '#10b981' }}>Klaar — alle leads zijn gekoppeld!</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} color="#FFD700" />
                <span style={{ color: '#FFD700' }}>{leads.length}</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '500' }}>
                  {leads.length === 1 ? 'lead nog zonder bericht-koppeling' : 'leads nog zonder bericht-koppeling'}
                </span>
              </>
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {feedback && (
          <div style={{
            padding: '0.5rem 1rem',
            background: feedback.kind === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            color: feedback.kind === 'success' ? '#10b981' : '#ef4444',
            fontSize: '0.75rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}>
            <Check size={12} /> {feedback.msg}
          </div>
        )}

        {/* BODY */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.875rem',
        }}>
          {loading && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>Laden…</div>}

          {/* SUGGESTED GROUPS */}
          {!loading && groups.suggested.length > 0 && (
            <>
              <SectionTitle>Slim voorstel — op basis van datum</SectionTitle>
              {groups.suggested.map(group => (
                <SuggestionCard
                  key={group.campaign.id}
                  group={group}
                  expanded={expandedGroup === group.campaign.id}
                  onToggleExpand={() => setExpandedGroup(prev => prev === group.campaign.id ? null : group.campaign.id)}
                  selection={selection}
                  onToggleLead={toggleLead}
                  onSelectAll={() => selectAllInGroup(group.leads)}
                  onAssignAll={() => assignAllInGroup(group)}
                  onAssignSelected={() => assignSelectedInGroup(group)}
                  busy={busy}
                />
              ))}
            </>
          )}

          {/* UNMATCHED — manual fallback */}
          {!loading && groups.unmatched.length > 0 && (
            <>
              <SectionTitle>Vallen buiten alle periodes — handmatig koppelen</SectionTitle>
              <ManualPanel
                leads={groups.unmatched}
                campaigns={campaigns}
                manualCampaign={manualCampaign}
                setManualCampaign={setManualCampaign}
                selection={selection}
                onToggleLead={toggleLead}
                onSelectAll={() => selectAllInGroup(groups.unmatched)}
                onAssign={assignManual}
                busy={busy}
              />
            </>
          )}

          {/* DONE STATE */}
          {!loading && leads.length === 0 && (
            <div style={{
              padding: '1.5rem 1rem', textAlign: 'center',
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '10px',
              color: '#10b981', fontSize: '0.85rem', fontWeight: '700',
            }}>
              <Check size={24} style={{ marginBottom: '0.5rem' }} />
              <div>Alle leads zijn nu gekoppeld aan een bericht.</div>
              <button
                onClick={handleClose}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 1rem',
                  background: '#10b981', border: 'none', borderRadius: '7px',
                  color: '#000', fontSize: '0.78rem', fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                Klaar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    modalHost
  )
}

// ────────────────────────────────────────────────────────────────────────────
function SuggestionCard({ group, expanded, onToggleExpand, selection, onToggleLead, onSelectAll, onAssignAll, onAssignSelected, busy }) {
  const { campaign, range, leads } = group
  const selectedCount = leads.filter(l => selection[l.id]).length
  const allSelected = selectedCount === leads.length && leads.length > 0

  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)',
      border: '1px solid rgba(225,48,108,0.22)',
      borderRadius: '10px',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* HEADER */}
      <div style={{
        padding: '0.7rem 0.8rem',
        display: 'flex', alignItems: 'center', gap: '0.55rem',
        background: 'rgba(225,48,108,0.05)',
      }}>
        <Send size={14} color="#E1306C" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.01em' }}>
              {campaign.name}
            </span>
            {campaign.variant_tag && (
              <span style={{
                padding: '1px 5px', borderRadius: '3px',
                background: 'rgba(225,48,108,0.2)', color: '#E1306C',
                fontSize: '0.5rem', fontWeight: '900', textTransform: 'uppercase',
              }}>{campaign.variant_tag}</span>
            )}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={9} />
            {formatDate(range.min)} – {formatDate(range.max)}
          </div>
        </div>
        <span style={{
          padding: '0.3rem 0.6rem',
          background: 'rgba(225,48,108,0.18)', border: '1px solid rgba(225,48,108,0.35)',
          borderRadius: '999px', color: '#E1306C',
          fontSize: '0.78rem', fontWeight: '900',
          flexShrink: 0,
        }}>
          {leads.length}
        </span>
      </div>

      {/* PRIMARY ACTION */}
      <div style={{ padding: '0.6rem 0.8rem', display: 'flex', gap: '0.4rem' }}>
        <button
          onClick={onAssignAll}
          disabled={busy}
          style={{
            flex: 1,
            padding: '0.55rem 0.7rem',
            background: '#E1306C', border: 'none', borderRadius: '8px',
            color: '#fff', fontSize: '0.82rem', fontWeight: '900',
            cursor: busy ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            minHeight: '40px',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Link2 size={14} strokeWidth={2.8} />
          Alle {leads.length} koppelen
        </button>
        <button
          onClick={onToggleExpand}
          style={{
            padding: '0.55rem 0.7rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.7rem', fontWeight: '700',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            minHeight: '40px',
          }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Sluit' : 'Bekijk'}
        </button>
      </div>

      {/* EXPANDED LEAD LIST */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '0.45rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <button
              onClick={onSelectAll}
              style={{
                padding: '0.25rem 0.5rem',
                background: allSelected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                border: '1px solid', borderColor: allSelected ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)',
                borderRadius: '5px',
                color: allSelected ? '#10b981' : 'rgba(255,255,255,0.55)',
                fontSize: '0.62rem', fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              Selecteer alle
            </button>
            {selectedCount > 0 && (
              <button
                onClick={onAssignSelected}
                disabled={busy}
                style={{
                  padding: '0.25rem 0.55rem',
                  background: '#10b981', border: 'none', borderRadius: '5px',
                  color: '#000', fontSize: '0.62rem', fontWeight: '900',
                  cursor: busy ? 'wait' : 'pointer',
                }}
              >
                Koppel {selectedCount} aangevinkte
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>
              Of vink leads uit die hier niet bij horen
            </span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {leads.map(l => (
              <LeadRow key={l.id} lead={l} selected={!!selection[l.id]} onToggle={() => onToggleLead(l.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ManualPanel({ leads, campaigns, manualCampaign, setManualCampaign, selection, onToggleLead, onSelectAll, onAssign, busy }) {
  const selectedCount = leads.filter(l => selection[l.id]).length

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '10px',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0.7rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: 1.5 }}>
          Deze {leads.length} leads zijn aangemaakt buiten elke campagne-periode.
          Kies hieronder welk bericht ze opleverde, vink ze aan en koppel.
        </div>
        <select
          value={manualCampaign}
          onChange={(e) => setManualCampaign(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.6rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: '#fff', fontSize: '0.82rem', fontWeight: '600',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">— Kies een bericht —</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}{c.variant_tag ? ` · ${c.variant_tag}` : ''}{c.status === 'archived' ? ' (gearchiveerd)' : ''}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={onSelectAll}
            style={{
              padding: '0.4rem 0.7rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px', color: 'rgba(255,255,255,0.65)',
              fontSize: '0.7rem', fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            Selecteer alle
          </button>
          <button
            onClick={onAssign}
            disabled={busy || !manualCampaign || selectedCount === 0}
            style={{
              flex: 1,
              padding: '0.4rem 0.7rem',
              background: (busy || !manualCampaign || selectedCount === 0) ? 'rgba(16,185,129,0.15)' : '#10b981',
              border: 'none', borderRadius: '6px',
              color: (busy || !manualCampaign || selectedCount === 0) ? 'rgba(16,185,129,0.45)' : '#000',
              fontSize: '0.78rem', fontWeight: '900',
              cursor: (busy || !manualCampaign || selectedCount === 0) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}
          >
            <Link2 size={12} strokeWidth={2.8} />
            Koppel {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'}
          </button>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', maxHeight: '320px', overflowY: 'auto' }}>
        {leads.map(l => (
          <LeadRow key={l.id} lead={l} selected={!!selection[l.id]} onToggle={() => onToggleLead(l.id)} />
        ))}
      </div>
    </div>
  )
}

function LeadRow({ lead, selected, onToggle }) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Naamloze lead'
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.45rem 0.8rem',
        background: selected ? 'rgba(16,185,129,0.07)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        color: '#fff',
        cursor: 'pointer', textAlign: 'left',
        minHeight: '36px',
      }}
    >
      <div style={{
        width: '16px', height: '16px', borderRadius: '4px',
        border: `1.5px solid ${selected ? '#10b981' : 'rgba(255,255,255,0.25)'}`,
        background: selected ? '#10b981' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {selected && <Check size={10} color="#000" strokeWidth={3} />}
      </div>
      <span style={{ flex: 1, minWidth: 0, fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </span>
      {lead.lead_source && (
        <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
          {lead.lead_source}
        </span>
      )}
      <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', flexShrink: 0 }}>
        {formatDate(lead.created_at)}
      </span>
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '0.6rem', fontWeight: '900',
      color: 'rgba(255,255,255,0.5)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      paddingLeft: '0.15rem',
    }}>
      {children}
    </div>
  )
}

const iconBtnStyle = {
  width: '34px', height: '34px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '7px',
  color: 'rgba(255,255,255,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
}
