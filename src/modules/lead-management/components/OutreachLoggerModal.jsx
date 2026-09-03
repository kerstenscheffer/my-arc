// src/modules/lead-management/components/OutreachLoggerModal.jsx
// "Mijn berichten" — one-stop outreach screen. No tabs, no nested modal.
// Each card combines: what the message is, how many you sent today, and the
// full funnel result side-by-side. Optimised so even a first-time user
// understands the loop "ik stuur → dit komt eruit".

import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import {
  X, Plus, Send, Trash2, Archive, ArchiveRestore, MessageSquare,
  Trophy, CalendarDays, Pencil, Check, Link2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import BulkAssignLeadsModal from './BulkAssignLeadsModal'

const DEBOUNCE_MS = 600
const todayISO = () => new Date().toISOString().split('T')[0]

// Defensive: accept only string UUIDs. Filters out null, undefined,
// the literal strings "null"/"undefined" (which we've seen in prod due
// to an upstream localStorage round-trip), and obviously malformed values.
const isValidUuid = (v) =>
  typeof v === 'string' &&
  v.length === 36 &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

// Funnel-stage detection by section-title regex — works even when the
// coach renames their sections.
const STAGES = [
  { key: 'replies',     label: 'Reageerden',      color: '#3b82f6' }, // from call_leads count
  { key: 'reached_call', label: 'Voorgesteld',    color: '#ef4444', re: /call.*voorgesteld|voorgesteld.*call/i },
  { key: 'reached_sales',label: 'Sales call',     color: '#f59e0b', re: /sales\s*call/i },
  { key: 'reached_sale', label: 'Klant geworden', color: '#10b981', re: /^\s*sale(?:\s|$|🏆)|^\s*deal\b/i },
]

export default function OutreachLoggerModal({ coachId, isMobile, onClose }) {
  const modalHost = useModalHost()
  const [campaigns, setCampaigns] = useState([])
  const [sendsByCampaign, setSendsByCampaign] = useState({})       // total lifetime per campaign
  const [todaySends, setTodaySends] = useState({})                 // { campaign_id: today's count }
  const [leadsByCampaign, setLeadsByCampaign] = useState({})       // { campaign_id: [leads] }
  const [movesByLead, setMovesByLead] = useState({})               // { lead_id: [movements] }
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ name: '', variant_tag: '', message_text: '' })
  const [creating, setCreating] = useState(false)
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const debounceRefs = useRef({})

  const today = todayISO()

  // ── Load everything in parallel ───────────────────────────────────────────
  useEffect(() => {
    if (!coachId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [campRes, sendRes, leadRes] = await Promise.all([
          supabase.from('outreach_campaigns')
            .select('id, name, variant_tag, message_text, status, created_at')
            .eq('coach_id', coachId).order('created_at', { ascending: false }),
          supabase.from('outreach_sends')
            .select('campaign_id, send_date, count').eq('coach_id', coachId),
          supabase.from('call_leads')
            .select('id, outreach_campaign_id')
            .eq('coach_id', coachId).is('deleted_at', null)
            .not('outreach_campaign_id', 'is', null),
        ])
        if (cancelled) return
        const camps = campRes.data || []

        // Roll up lifetime sends + today sends.
        const total = {}, todayMap = {}
        ;(sendRes.data || []).forEach(s => {
          total[s.campaign_id] = (total[s.campaign_id] || 0) + (s.count || 0)
          if (s.send_date === today) todayMap[s.campaign_id] = s.count
        })

        // Leads per campaign.
        const lByC = {}
        ;(leadRes.data || []).forEach(l => {
          if (!lByC[l.outreach_campaign_id]) lByC[l.outreach_campaign_id] = []
          lByC[l.outreach_campaign_id].push(l)
        })

        // Movements for those leads (so we know who reached call/sales/sale).
        const ids = (leadRes.data || []).map(l => l.id)
        const mByL = {}
        if (ids.length > 0) {
          for (let i = 0; i < ids.length; i += 200) {
            const batch = ids.slice(i, i + 200)
            const { data: m } = await supabase
              .from('lead_movements')
              .select('lead_id, to_section_title').in('lead_id', batch)
            ;(m || []).forEach(mv => {
              if (!mByL[mv.lead_id]) mByL[mv.lead_id] = []
              mByL[mv.lead_id].push(mv.to_section_title || '')
            })
            if (cancelled) return
          }
        }

        setCampaigns(camps)
        setSendsByCampaign(total)
        setTodaySends(todayMap)
        setLeadsByCampaign(lByC)
        setMovesByLead(mByL)
      } catch (err) {
        console.error('Load outreach failed:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [coachId, today])

  useEffect(() => () => {
    Object.values(debounceRefs.current).forEach(t => t && clearTimeout(t))
  }, [])

  // ── Stats per campaign (memoized) ────────────────────────────────────────
  const stats = useMemo(() => {
    return campaigns.map(c => {
      const sent    = sendsByCampaign[c.id] || 0
      const leads   = leadsByCampaign[c.id] || []
      const replies = leads.length
      const counts = { reached_call: 0, reached_sales: 0, reached_sale: 0 }
      leads.forEach(l => {
        const titles = movesByLead[l.id] || []
        STAGES.filter(s => s.re).forEach(s => {
          if (titles.some(t => s.re.test(t))) counts[s.key]++
        })
      })
      return { campaign: c, sent, replies, ...counts }
    })
  }, [campaigns, sendsByCampaign, leadsByCampaign, movesByLead])

  const activeStats   = stats.filter(s => s.campaign.status !== 'archived')
  const archivedStats = stats.filter(s => s.campaign.status === 'archived')

  const todayTotal = Object.values(todaySends).reduce((a, c) => a + (parseInt(c, 10) || 0), 0)

  // ── Persistence helpers ──────────────────────────────────────────────────
  const persistCount = (campaignId, count) => {
    if (!isValidUuid(coachId)) {
      console.warn('[OutreachLoggerModal] persistCount aborted — invalid coachId:', coachId)
      return
    }
    if (debounceRefs.current[campaignId]) clearTimeout(debounceRefs.current[campaignId])
    debounceRefs.current[campaignId] = setTimeout(async () => {
      setSavingId(campaignId)
      try {
        const { error } = await supabase
          .from('outreach_sends')
          .upsert(
            { campaign_id: campaignId, coach_id: coachId, send_date: today, count: Math.max(0, parseInt(count, 10) || 0) },
            { onConflict: 'campaign_id,send_date' }
          )
        if (error) throw error
        // Re-sum lifetime sends locally so the funnel is up-to-date.
        setSendsByCampaign(prev => {
          // simplest: refetch the campaign's full total
          return { ...prev, [campaignId]: (prev[campaignId] || 0) }
        })
        // Trigger a small refetch of totals for this campaign only.
        const { data } = await supabase.from('outreach_sends')
          .select('count').eq('coach_id', coachId).eq('campaign_id', campaignId)
        const total = (data || []).reduce((a, r) => a + (r.count || 0), 0)
        setSendsByCampaign(prev => ({ ...prev, [campaignId]: total }))
      } catch (err) {
        console.error('Save count failed:', err)
      } finally {
        setSavingId(null)
      }
    }, DEBOUNCE_MS)
  }
  const setCount = (campaignId, v) => {
    setTodaySends(prev => ({ ...prev, [campaignId]: v }))
    persistCount(campaignId, v)
  }

  // Create / Edit / Status / Delete
  const startCreate = () => {
    setDraft({ name: '', variant_tag: '', message_text: '' })
    setEditingId('__new__')
  }
  const startEdit = (c) => {
    setDraft({ name: c.name || '', variant_tag: c.variant_tag || '', message_text: c.message_text || '' })
    setEditingId(c.id)
  }
  const cancelEdit = () => { setEditingId(null); setDraft({ name: '', variant_tag: '', message_text: '' }) }
  const saveDraft = async () => {
    if (!draft.name.trim() && !draft.message_text.trim()) return
    // Robust "is this a new campaign?" detection. We previously only checked
    // for the literal '__new__' sentinel, but if `editingId` was reset to
    // null (e.g. after a cancel race) the update branch ran with
    // `.eq('id', null)` which PostgREST sends as `id=eq.null` — Postgres
    // then tries to cast the string "null" to uuid and the request blows up
    // with "invalid input syntax for type uuid: \"null\"".
    const isNewCampaign = editingId === '__new__' || !isValidUuid(editingId)
    if (isNewCampaign && !isValidUuid(coachId)) {
      console.error('[OutreachLoggerModal] cannot create campaign — coachId is not a UUID:', coachId)
      alert('Coach niet ingelogd of sessie verlopen — herlaad de pagina en log opnieuw in.')
      return
    }
    setCreating(true)
    try {
      if (isNewCampaign) {
        const { data, error } = await supabase
          .from('outreach_campaigns')
          .insert({
            coach_id: coachId,
            name: draft.name.trim() || 'Naamloos bericht',
            variant_tag: draft.variant_tag.trim() || null,
            message_text: draft.message_text.trim() || null,
            status: 'active',
            campaign_date: today,
            platform: 'instagram',
            total_sent: 0,
          })
          .select().single()
        if (error) throw error
        setCampaigns(prev => [data, ...prev])
      } else {
        const { error } = await supabase
          .from('outreach_campaigns')
          .update({
            name: draft.name.trim() || 'Naamloos bericht',
            variant_tag: draft.variant_tag.trim() || null,
            message_text: draft.message_text.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
        if (error) throw error
        setCampaigns(prev => prev.map(c => c.id === editingId
          ? { ...c, name: draft.name.trim() || 'Naamloos bericht', variant_tag: draft.variant_tag.trim() || null, message_text: draft.message_text.trim() || null }
          : c))
      }
      cancelEdit()
    } catch (err) {
      console.error('Save campaign failed:', err)
      const msg = err?.message || err?.error_description || JSON.stringify(err)
      alert(`Opslaan mislukt — ${msg}\n\ncoachId: ${coachId || '(leeg!)'}`)
    } finally {
      setCreating(false)
    }
  }
  const setStatus = async (id, status) => {
    try {
      await supabase.from('outreach_campaigns').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    } catch (err) { console.error('Status update failed:', err) }
  }
  const deleteCampaign = async (id) => {
    if (!window.confirm('Dit bericht + alle log-data wissen?')) return
    try {
      await supabase.from('outreach_campaigns').delete().eq('id', id)
      setCampaigns(prev => prev.filter(c => c.id !== id))
    } catch (err) { console.error('Delete failed:', err); alert('Verwijderen mislukt') }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const hasNoCampaigns = !loading && campaigns.length === 0

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
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
            background: 'rgba(225,48,108,0.14)', border: '1px solid rgba(225,48,108,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Send size={18} color="#E1306C" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.01em' }}>
              Mijn berichten
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem', fontWeight: '600' }}>
              Welke berichten test je — en wat werkt het beste?
            </div>
          </div>
          <button
            onClick={() => setShowBulkAssign(true)}
            style={{
              ...iconBtnStyle,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981',
              padding: '0 0.6rem', width: 'auto',
              gap: '0.3rem',
              fontSize: '0.7rem', fontWeight: '800',
              display: 'flex', alignItems: 'center',
            }}
            title="Koppel oude leads aan een bericht"
          >
            <Link2 size={13} />
            {!isMobile && 'Oude leads'}
          </button>
          <button onClick={onClose} style={iconBtnStyle} aria-label="Sluiten"><X size={16} /></button>
        </div>

        {/* BULK ASSIGN MODAL */}
        {showBulkAssign && (
          <BulkAssignLeadsModal
            coachId={coachId}
            isMobile={isMobile}
            onClose={() => setShowBulkAssign(false)}
          />
        )}

        {/* TODAY STRIP */}
        {!loading && campaigns.length > 0 && (
          <div style={{
            padding: '0.6rem 1rem',
            background: 'rgba(225,48,108,0.06)',
            borderBottom: '1px solid rgba(225,48,108,0.18)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.78rem', color: '#fff', fontWeight: '600',
          }}>
            <CalendarDays size={13} color="#E1306C" />
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>Vandaag —</span>
            <span style={{ color: '#E1306C', fontWeight: '900', fontSize: '0.95rem' }}>
              {todayTotal} {todayTotal === 1 ? 'DM' : 'DMs'} verstuurd
            </span>
            {todayTotal === 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
                Vul hieronder in hoeveel je verstuurde
              </span>
            )}
          </div>
        )}

        {/* BODY */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.875rem',
        }}>
          {loading && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>Laden…</div>}

          {/* EMPTY STATE */}
          {hasNoCampaipns_OR_creatingDraft(hasNoCampaigns, editingId) && (
            <EmptyOrCreateForm
              draft={draft}
              setDraft={setDraft}
              isFirstEver={hasNoCampaigns && editingId !== '__new__'}
              isEditing={editingId && editingId !== '__new__'}
              creating={creating}
              onCancel={cancelEdit}
              onSave={saveDraft}
            />
          )}

          {/* ACTIVE CAMPAIGN CARDS */}
          {!loading && activeStats.map(s => (
            <CampaignBigCard
              key={s.campaign.id}
              stat={s}
              todayCount={todaySends[s.campaign.id] ?? 0}
              saving={savingId === s.campaign.id}
              onCountChange={(v) => setCount(s.campaign.id, v)}
              onEdit={() => startEdit(s.campaign)}
              onArchive={() => setStatus(s.campaign.id, 'archived')}
              onDelete={() => deleteCampaign(s.campaign.id)}
              isEditing={editingId === s.campaign.id}
              draft={draft}
              setDraft={setDraft}
              onCancelEdit={cancelEdit}
              onSaveEdit={saveDraft}
              saveBusy={creating}
            />
          ))}

          {/* ADD NEW BUTTON (when not editing/empty) */}
          {!loading && campaigns.length > 0 && !editingId && (
            <button
              onClick={startCreate}
              style={{
                padding: '0.7rem',
                background: 'rgba(255,215,0,0.06)',
                border: '1.5px dashed rgba(255,215,0,0.3)',
                borderRadius: '10px',
                color: '#FFD700',
                fontSize: '0.85rem', fontWeight: '800',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                minHeight: '42px',
              }}
            >
              <Plus size={15} strokeWidth={2.8} />
              Nieuw bericht toevoegen
            </button>
          )}

          {/* ARCHIVED (collapsible) */}
          {archivedStats.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchived(s => !s)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.7rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '0.7rem', fontWeight: '700',
                  cursor: 'pointer', minHeight: '34px',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Archive size={11} /> Oude berichten ({archivedStats.length})
                </span>
                <span>{showArchived ? '−' : '+'}</span>
              </button>
              {showArchived && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.6rem' }}>
                  {archivedStats.map(s => (
                    <CampaignBigCard
                      key={s.campaign.id}
                      stat={s}
                      todayCount={0}
                      saving={false}
                      readOnly
                      onCountChange={() => {}}
                      onRestore={() => setStatus(s.campaign.id, 'active')}
                      onDelete={() => deleteCampaign(s.campaign.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    modalHost
  )
}

// Helper: should we show the empty/create form?
function hasNoCampaipns_OR_creatingDraft(hasNoCampaigns, editingId) {
  return hasNoCampaigns || editingId === '__new__'
}

// ════════════════════════════════════════════════════════════════════════════
// EMPTY STATE / CREATE FORM (one component for both)
// ════════════════════════════════════════════════════════════════════════════
function EmptyOrCreateForm({ draft, setDraft, isFirstEver, isEditing, creating, onCancel, onSave }) {
  return (
    <div style={{
      padding: '1rem',
      background: 'rgba(255,215,0,0.04)',
      border: '1.5px solid rgba(255,215,0,0.22)',
      borderRadius: '12px',
    }}>
      {isFirstEver && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <Send size={16} color="#FFD700" />
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#FFD700', letterSpacing: '-0.01em' }}>
              Eerste bericht toevoegen
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.8rem', lineHeight: 1.5 }}>
            Welk bericht stuur je naar nieuwe mensen op Instagram? Vul het in,
            log dagelijks hoeveel je er verstuurde, en we meten welk bericht
            de meeste klanten oplevert.
          </div>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div>
          <SimpleLabel>Hoe noem je dit bericht?</SimpleLabel>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder='bv. "Korte intro" of "Bench Press uitleg"'
            style={inputStyle}
          />
        </div>
        <div>
          <SimpleLabel>Variant <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>(optioneel — voor A/B testen)</span></SimpleLabel>
          <input
            type="text"
            value={draft.variant_tag}
            onChange={(e) => setDraft(d => ({ ...d, variant_tag: e.target.value }))}
            placeholder='bv. "A" of "kort"'
            style={inputStyle}
          />
        </div>
        <div>
          <SimpleLabel>Wat is de tekst?</SimpleLabel>
          <textarea
            value={draft.message_text}
            onChange={(e) => setDraft(d => ({ ...d, message_text: e.target.value }))}
            placeholder="Plak hier het bericht dat je verstuurt…"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '110px', lineHeight: 1.45, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.7rem' }}>
        {!isFirstEver && (
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 0.85rem',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '7px', color: 'rgba(255,255,255,0.55)',
              fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer',
              minHeight: '36px',
            }}
          >
            Annuleer
          </button>
        )}
        <button
          onClick={onSave}
          disabled={creating || (!draft.name.trim() && !draft.message_text.trim())}
          style={{
            flex: isFirstEver ? 1 : 'initial',
            padding: '0.55rem 1rem',
            background: (creating || (!draft.name.trim() && !draft.message_text.trim())) ? 'rgba(255,215,0,0.15)' : '#FFD700',
            border: 'none', borderRadius: '7px',
            color: (creating || (!draft.name.trim() && !draft.message_text.trim())) ? 'rgba(255,215,0,0.4)' : '#000',
            fontSize: '0.85rem', fontWeight: '900',
            cursor: (creating || (!draft.name.trim() && !draft.message_text.trim())) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            minHeight: '38px',
          }}
        >
          <Check size={14} strokeWidth={2.8} />
          {creating ? 'Opslaan…' : isFirstEver ? 'Bewaar mijn eerste bericht' : (isEditing ? 'Wijziging opslaan' : 'Bericht toevoegen')}
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// THE BIG CARD: per campaign, combines today's logger + funnel result
// ════════════════════════════════════════════════════════════════════════════
function CampaignBigCard({
  stat, todayCount, saving, readOnly,
  onCountChange, onEdit, onArchive, onRestore, onDelete,
  isEditing, draft, setDraft, onCancelEdit, onSaveEdit, saveBusy,
}) {
  const { campaign, sent, replies, reached_call, reached_sales, reached_sale } = stat
  const isArchived = campaign.status === 'archived'

  // Funnel data — 4 rows: sent (100%), replies, voorgesteld, sales, klant.
  // Width relative to "sent" so the visual story is "of all DMs, X became Y".
  const denom = Math.max(sent, 1)
  const funnelRows = [
    { label: 'Verstuurd',       count: sent,           color: '#E1306C', pct: 100 },
    { label: 'Reageerden',      count: replies,        color: '#3b82f6', pct: (replies / denom) * 100 },
    { label: 'Voorgesteld',     count: reached_call,   color: '#ef4444', pct: (reached_call / denom) * 100 },
    { label: 'Sales call',      count: reached_sales,  color: '#f59e0b', pct: (reached_sales / denom) * 100 },
    { label: 'Klant geworden',  count: reached_sale,   color: '#10b981', pct: (reached_sale / denom) * 100 },
  ]

  // Inline edit takes over the whole card body.
  if (isEditing) {
    return (
      <div style={cardShell(isArchived)}>
        <EmptyOrCreateForm
          draft={draft}
          setDraft={setDraft}
          isFirstEver={false}
          isEditing={true}
          creating={saveBusy}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
        />
      </div>
    )
  }

  return (
    <div style={cardShell(isArchived)}>
      {/* HEADER: name + actions */}
      <div style={{
        padding: '0.7rem 0.8rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.01em' }}>
              {campaign.name || 'Naamloos bericht'}
            </span>
            {campaign.variant_tag && (
              <span style={{
                padding: '1px 6px', borderRadius: '4px',
                background: 'rgba(225,48,108,0.18)', color: '#E1306C',
                fontSize: '0.55rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{campaign.variant_tag}</span>
            )}
            {isArchived && (
              <span style={{ fontSize: '0.55rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                oud bericht
              </span>
            )}
          </div>
          {campaign.message_text && (
            <div style={{
              marginTop: '0.25rem',
              padding: '0.4rem 0.55rem',
              background: 'rgba(0,0,0,0.35)',
              borderLeft: '2px solid rgba(255,255,255,0.15)',
              borderRadius: '0 4px 4px 0',
              fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)',
              fontWeight: '500', lineHeight: 1.45,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {campaign.message_text}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          {onEdit && (
            <button onClick={onEdit} title="Bericht aanpassen" style={miniBtnStyle}><Pencil size={11} /></button>
          )}
          {onArchive && (
            <button onClick={onArchive} title="Archiveer" style={miniBtnStyle}><Archive size={11} /></button>
          )}
          {onRestore && (
            <button onClick={onRestore} title="Heractiveer" style={miniBtnStyle}><ArchiveRestore size={11} /></button>
          )}
          <button onClick={onDelete} title="Verwijderen" style={{ ...miniBtnStyle, color: 'rgba(239,68,68,0.55)' }}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* TODAY'S COUNT (large, friendly) */}
      {!readOnly && (
        <div style={{
          padding: '0.7rem 0.8rem',
          background: 'rgba(225,48,108,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>
            Hoeveel verstuurd vandaag?
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => onCountChange(Math.max(0, (parseInt(todayCount, 10) || 0) - 10))}
              style={pillBtnStyle}
            >−10</button>
            <input
              type="number" min="0" max="9999"
              value={todayCount}
              onChange={(e) => onCountChange(e.target.value)}
              style={{
                flex: 1, minWidth: 0,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(225,48,108,0.35)',
                borderRadius: '8px',
                color: '#E1306C',
                fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.02em',
                textAlign: 'center', outline: 'none',
                padding: '0.45rem 0.5rem',
              }}
            />
            <button
              onClick={() => onCountChange((parseInt(todayCount, 10) || 0) + 10)}
              style={pillBtnStyle}
            >+10</button>
          </div>
          {saving && (
            <div style={{ marginTop: '0.25rem', fontSize: '0.55rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Check size={9} /> Opgeslagen
            </div>
          )}
        </div>
      )}

      {/* FUNNEL — visual story */}
      <div style={{ padding: '0.7rem 0.8rem' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Wat komt er uit dit bericht?
        </div>
        {sent === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            Nog geen DMs verstuurd — log eerst hoeveel je er stuurde om resultaten te zien.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {funnelRows.map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{
                  width: '110px', flexShrink: 0,
                  fontSize: '0.7rem', fontWeight: '700', color: row.color,
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                }}>
                  {row.label === 'Klant geworden' && <Trophy size={11} />}
                  {row.label === 'Reageerden' && <MessageSquare size={11} />}
                  {row.label}
                </div>
                <div style={{
                  flex: 1, height: '14px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '999px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${row.pct}%`,
                    background: `linear-gradient(90deg, ${row.color}aa 0%, ${row.color} 100%)`,
                    transition: 'width 0.4s ease',
                    minWidth: row.count > 0 ? '4px' : '0',
                  }} />
                </div>
                <div style={{ width: '76px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '900', color: '#fff' }}>
                  {row.count}
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '600', fontSize: '0.6rem', marginLeft: '0.25rem' }}>
                    · {row.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function cardShell(isArchived) {
  return {
    background: isArchived ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.035)',
    border: `1px solid ${isArchived ? 'rgba(255,255,255,0.06)' : 'rgba(225,48,108,0.18)'}`,
    borderRadius: '12px',
    overflow: 'hidden',
    opacity: isArchived ? 0.75 : 1,
    // Keep each card at its natural height — the parent body has
    // overflowY:auto, so the modal should scroll, not the card shrink.
    flexShrink: 0,
  }
}

function SimpleLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.65rem', fontWeight: '800',
      color: 'rgba(255,255,255,0.55)',
      marginBottom: '0.3rem',
      letterSpacing: '-0.005em',
    }}>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '7px',
  color: '#fff',
  fontSize: '0.82rem', fontWeight: '500',
  outline: 'none', boxSizing: 'border-box',
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

const miniBtnStyle = {
  width: '26px', height: '26px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '5px',
  color: 'rgba(255,255,255,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
}

const pillBtnStyle = {
  padding: '0.45rem 0.65rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '7px',
  color: 'rgba(255,255,255,0.65)',
  fontSize: '0.72rem', fontWeight: '900',
  cursor: 'pointer',
  minHeight: '38px',
  minWidth: '46px',
}
