// src/modules/lead-management/components/OutreachMetricsModal.jsx
// Per-campagne funnel-metrics + side-by-side vergelijking. Rolls up:
//   - SUM(outreach_sends.count)         → total sent
//   - COUNT(call_leads WHERE campaign)  → replies (= leads aangemaakt)
//   - lead_movements per lead           → reached_call / sales_call / sale
// Funnel-stages worden gedetecteerd via section-titel regex zodat ze blijven
// werken als de coach z'n sections hernoemt.

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import {
  X, BarChart3, Send, MessageCircle, PhoneCall, Trophy, ArrowUpDown,
  Flame, TrendingUp,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const FUNNEL = [
  { key: 'reached_call',  label: 'Voorgesteld', color: '#ef4444', icon: PhoneCall,    re: /call.*voorgesteld|voorgesteld.*call/i },
  { key: 'reached_sales', label: 'Sales call',  color: '#fff694', icon: MessageCircle, re: /sales\s*call/i },
  { key: 'reached_sale',  label: 'Sale',        color: '#c7a600', icon: Trophy,       re: /^\s*sale(?:\s|$|🏆)|^\s*deal\b/i },
]

export default function OutreachMetricsModal({ coachId, isMobile, onClose }) {
  const modalHost = useModalHost()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [sendsByCampaign, setSendsByCampaign] = useState({})
  const [leadsByCampaign, setLeadsByCampaign] = useState({})
  const [movesByLead, setMovesByLead] = useState({})
  const [includeArchived, setIncludeArchived] = useState(true)
  const [sortKey, setSortKey] = useState('replies') // replies | sent | sale | reply_rate | sale_rate

  // ── Load everything we need in parallel ──────────────────────────────────
  useEffect(() => {
    if (!coachId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [campRes, sendRes, leadRes] = await Promise.all([
          supabase.from('outreach_campaigns')
            .select('id, name, variant_tag, message_text, status, campaign_date, created_at')
            .eq('coach_id', coachId)
            .order('created_at', { ascending: false }),
          supabase.from('outreach_sends')
            .select('campaign_id, count')
            .eq('coach_id', coachId),
          supabase.from('call_leads')
            .select('id, outreach_campaign_id, first_name, last_name, created_at')
            .eq('coach_id', coachId)
            .is('deleted_at', null)
            .not('outreach_campaign_id', 'is', null),
        ])
        if (cancelled) return

        const camps = campRes.data || []
        const sentMap = {}
        ;(sendRes.data || []).forEach(s => {
          sentMap[s.campaign_id] = (sentMap[s.campaign_id] || 0) + (s.count || 0)
        })
        const leadsMap = {}
        ;(leadRes.data || []).forEach(l => {
          if (!leadsMap[l.outreach_campaign_id]) leadsMap[l.outreach_campaign_id] = []
          leadsMap[l.outreach_campaign_id].push(l)
        })

        // Movements for all attributed leads — one batch query.
        const leadIds = (leadRes.data || []).map(l => l.id)
        let movesByLeadLocal = {}
        if (leadIds.length > 0) {
          // Supabase IN-filter has a practical size cap; batch in 200s.
          for (let i = 0; i < leadIds.length; i += 200) {
            const batch = leadIds.slice(i, i + 200)
            const { data: m } = await supabase
              .from('lead_movements')
              .select('lead_id, to_section_title, moved_at')
              .in('lead_id', batch)
            ;(m || []).forEach(mv => {
              if (!movesByLeadLocal[mv.lead_id]) movesByLeadLocal[mv.lead_id] = []
              movesByLeadLocal[mv.lead_id].push(mv)
            })
            if (cancelled) return
          }
        }

        setCampaigns(camps)
        setSendsByCampaign(sentMap)
        setLeadsByCampaign(leadsMap)
        setMovesByLead(movesByLeadLocal)
      } catch (err) {
        console.error('Load metrics failed:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [coachId])

  // ── Per-campaign rollups ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    return campaigns.map(c => {
      const sent = sendsByCampaign[c.id] || 0
      const cLeads = leadsByCampaign[c.id] || []
      const replies = cLeads.length

      const stageCounts = { reached_call: 0, reached_sales: 0, reached_sale: 0 }
      cLeads.forEach(lead => {
        const titles = (movesByLead[lead.id] || []).map(m => m.to_section_title || '')
        FUNNEL.forEach(f => {
          if (titles.some(t => f.re.test(t))) stageCounts[f.key]++
        })
      })

      return {
        campaign: c,
        sent,
        replies,
        replyRate: sent > 0 ? (replies / sent * 100) : 0,
        ...stageCounts,
        callRate:    replies > 0 ? (stageCounts.reached_call  / replies * 100) : 0,
        salesRate:   replies > 0 ? (stageCounts.reached_sales / replies * 100) : 0,
        saleRate:    replies > 0 ? (stageCounts.reached_sale  / replies * 100) : 0,
        replyToSale: sent > 0    ? (stageCounts.reached_sale  / sent    * 100) : 0,
      }
    })
  }, [campaigns, sendsByCampaign, leadsByCampaign, movesByLead])

  const filtered = stats.filter(s => includeArchived || s.campaign.status !== 'archived')
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'sent':       return b.sent - a.sent
      case 'sale':       return b.reached_sale - a.reached_sale
      case 'reply_rate': return b.replyRate - a.replyRate
      case 'sale_rate':  return b.replyToSale - a.replyToSale
      default:           return b.replies - a.replies
    }
  })

  // Aggregate totals across all visible campaigns.
  const totals = sorted.reduce((acc, s) => {
    acc.sent     += s.sent
    acc.replies  += s.replies
    acc.calls    += s.reached_call
    acc.sales    += s.reached_sales
    acc.deals    += s.reached_sale
    return acc
  }, { sent: 0, replies: 0, calls: 0, sales: 0, deals: 0 })

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '2rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '900px',
        maxHeight: isMobile ? '94vh' : '90vh',
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '14px 14px 0 0' : '14px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* HEADER */}
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          paddingTop: `calc(env(safe-area-inset-top, 0) + ${isMobile ? '0.875rem' : '1rem'})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '9px',
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BarChart3 size={16} color="#10b981" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.01em' }}>
              Outreach metrics
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem', fontWeight: '600' }}>
              Welk bericht doet het beste?
            </div>
          </div>
          <button onClick={onClose} style={iconBtnStyle} aria-label="Sluiten"><X size={16} /></button>
        </div>

        {/* CONTROLS + TOTALS */}
        {!loading && sorted.length > 0 && (
          <div style={{
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
              <TotalChip label="Verstuurd" value={totals.sent}     color="#E1306C"><Send size={9} /></TotalChip>
              <TotalChip label="Reageerden" value={totals.replies}   color="#3b82f6"><MessageCircle size={9} /></TotalChip>
              <TotalChip label="Voorgesteld"value={totals.calls}     color="#ef4444"><PhoneCall size={9} /></TotalChip>
              <TotalChip label="Sales call" value={totals.sales}     color="#fff694"><MessageCircle size={9} /></TotalChip>
              <TotalChip label="Sales"      value={totals.deals}     color="#c7a600"><Trophy size={9} /></TotalChip>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: '700', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
                Gearchiveerd meenemen
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                <ArrowUpDown size={10} />
                {[
                  { k: 'replies', l: 'Replies' },
                  { k: 'sent', l: 'Sent' },
                  { k: 'sale', l: 'Sales' },
                  { k: 'reply_rate', l: 'Reply%' },
                  { k: 'sale_rate', l: 'Sale%' },
                ].map(o => (
                  <button
                    key={o.k}
                    onClick={() => setSortKey(o.k)}
                    style={{
                      padding: '0.2rem 0.45rem',
                      background: sortKey === o.k ? 'rgba(16,185,129,0.15)' : 'transparent',
                      border: '1px solid', borderColor: sortKey === o.k ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)',
                      borderRadius: '4px',
                      color: sortKey === o.k ? '#10b981' : 'rgba(255,255,255,0.45)',
                      fontSize: '0.58rem', fontWeight: '800', cursor: 'pointer',
                    }}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BODY — campaign cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>Laden…</div>}

          {!loading && sorted.length === 0 && (
            <div style={{
              padding: '2rem 1rem', textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
            }}>
              Nog geen campagne-data om te tonen. Begin met DMs loggen om hier resultaten te zien.
            </div>
          )}

          {!loading && sorted.map((s, idx) => (
            <CampaignStatCard key={s.campaign.id} stat={s} rank={idx + 1} isBest={idx === 0 && sortKey !== 'sent'} />
          ))}
        </div>
      </div>
    </div>,
    modalHost
  )
}

// ────────────────────────────────────────────────────────────────────────────
function CampaignStatCard({ stat, rank, isBest }) {
  const { campaign, sent, replies, replyRate, replyToSale,
          reached_call, reached_sales, reached_sale } = stat
  const isArchived = campaign.status === 'archived'

  // Funnel-bar widths — relative to "replies" (entered funnel).
  const stages = [
    { ...FUNNEL[0], count: reached_call },
    { ...FUNNEL[1], count: reached_sales },
    { ...FUNNEL[2], count: reached_sale },
  ]

  return (
    <div style={{
      background: isArchived ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isBest ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '10px',
      padding: '0.75rem',
      opacity: isArchived ? 0.75 : 1,
      position: 'relative',
    }}>
      {isBest && replies > 0 && (
        <div style={{
          position: 'absolute', top: '-1px', right: '-1px',
          background: '#10b981', color: '#000',
          padding: '0.15rem 0.45rem',
          borderRadius: '0 9px 0 6px',
          fontSize: '0.55rem', fontWeight: '900',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
        }}>
          <Flame size={9} strokeWidth={2.8} /> Best
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '5px',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: '900', color: 'rgba(255,255,255,0.5)',
          flexShrink: 0,
        }}>
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{
              fontSize: '0.82rem', fontWeight: '800', color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {campaign.name || 'Naamloze campagne'}
            </span>
            {campaign.variant_tag && (
              <span style={{
                padding: '1px 5px', borderRadius: '3px',
                background: 'rgba(225,48,108,0.15)', color: '#E1306C',
                fontSize: '0.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {campaign.variant_tag}
              </span>
            )}
            {isArchived && (
              <span style={{
                fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                · gearchiveerd
              </span>
            )}
          </div>
          {campaign.message_text && (
            <div style={{
              marginTop: '0.15rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              fontWeight: '500',
            }}>
              {campaign.message_text}
            </div>
          )}
        </div>
      </div>

      {/* Top-line stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.7rem' }}>
        <StatTile label="Verstuurd" value={sent} color="#E1306C" />
        <StatTile label="Replies"   value={replies} sub={`${replyRate.toFixed(1)}%`} color="#3b82f6" />
        <StatTile label="Sales"     value={reached_sale} color="#c7a600" />
        <StatTile label="Sent→Sale" value={`${replyToSale.toFixed(1)}%`} color="#10b981" sub={<TrendingUp size={9} />} />
      </div>

      {/* Funnel bars */}
      {replies > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {stages.map(stage => {
            const pct = replies > 0 ? (stage.count / replies * 100) : 0
            const Icon = stage.icon
            return (
              <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  width: '90px', flexShrink: 0,
                  fontSize: '0.6rem', fontWeight: '700', color: stage.color,
                }}>
                  <Icon size={10} />
                  {stage.label}
                </div>
                <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${stage.color}aa 0%, ${stage.color} 100%)`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ width: '70px', textAlign: 'right', fontSize: '0.62rem', fontWeight: '800', color: 'rgba(255,255,255,0.7)' }}>
                  {stage.count} <span style={{ color: 'rgba(255,255,255,0.3)' }}>· {pct.toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value, sub, color }) {
  return (
    <div style={{
      padding: '0.45rem 0.5rem',
      background: 'rgba(0,0,0,0.25)',
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '5px',
    }}>
      <div style={{ fontSize: '0.5rem', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
        <span style={{ fontSize: '1rem', fontWeight: '900', color, letterSpacing: '-0.02em' }}>{value}</span>
        {sub && <span style={{ fontSize: '0.55rem', color: `${color}cc`, fontWeight: '700', display: 'inline-flex', alignItems: 'center' }}>{sub}</span>}
      </div>
    </div>
  )
}

function TotalChip({ label, value, color, children }) {
  return (
    <div style={{
      padding: '0.4rem 0.45rem',
      background: `${color}10`,
      border: `1px solid ${color}33`,
      borderRadius: '6px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color, fontSize: '0.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
        {children}
        {label}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: '900', color, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  )
}

const iconBtnStyle = {
  width: '32px', height: '32px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
}
