// src/modules/lead-management/components/kanban/LeadDetailModalV2.jsx
// Central tabbed lead-detail modal — replaces the scattered inline actions on
// KanbanCard with one screen that covers everything you need to do per lead.
//
// Tabs:
//   1. Info        — basis velden (naam, contact, source, temperature)
//   2. Kwalificatie— Doel / Pijn / Urgentie / Open + check-boxes
//   3. Sales-call  — Waarom nu / Weerstand / Bereidheid / Belofte / Rode vlaggen
//   4. Lead magnets — lead_magnets_shared chips + bron-info (utm/landing)
//   5. Notities   — vrije tekst (call_leads.notes)
//
// All persistence flows through the existing onEdit(updates) callback so the
// KanbanBoard state-machine stays in charge.

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Trash2, User, Target, Phone as PhoneCall, Magnet, FileText,
  Plus, AlertCircle, Zap, Heart, Flame, Check, Save,
  ExternalLink, Tag, Trash, Copy, Pencil, MessageSquare, Eraser,
} from 'lucide-react'

// Default template used when a magnet has no message_template stored. Same
// shape as the one we seeded into the DB; keeps freshly-created magnets
// useful immediately even before the user edits.
const DEFAULT_TEMPLATE = `Hey {first_name}! 🙌

Zoals beloofd hier "{magnet_name}":

{url}

Pak het even rustig door, ben benieuwd wat je ervan vindt — laat het zeker even weten!

Waar ik ook wel benieuwd naar ben: wat merk jij op dit moment dat je grootste uitdaging is om je doel te bereiken? Misschien kan ik je daar nog wat extra waarde in meegeven 💪`

const renderTemplate = (template, lead, magnet) => {
  const tpl = template || DEFAULT_TEMPLATE
  return tpl
    .replace(/\{first_name\}/g, lead?.first_name || 'maat')
    .replace(/\{last_name\}/g,  lead?.last_name  || '')
    .replace(/\{magnet_name\}/g, magnet?.name || '')
    .replace(/\{url\}/g, magnet?.url || '')
}
import { supabase } from '../../../../lib/supabase'

const TABS = [
  { id: 'info',     label: 'Info',         icon: User },
  { id: 'qual',     label: 'Kwalificatie', icon: Target },
  { id: 'sales',    label: 'Sales-call',   icon: PhoneCall },
  { id: 'magnets',  label: 'Lead magnets', icon: Magnet },
  { id: 'messages', label: 'Berichten',    icon: MessageSquare },
  { id: 'notes',    label: 'Notities',     icon: FileText },
]

const QUAL_FIELDS = [
  { key: 'goal',    label: 'Doel',     placeholder: 'Wat wil hij bereiken? (bv. "80kg, breder worden")',  icon: Target,      color: '#10b981' },
  { key: 'pain',    label: 'Pijn',     placeholder: 'Waar loopt hij vast? (bv. "Eet te weinig, geen progressie")', icon: AlertCircle, color: '#ef4444' },
  { key: 'urgency', label: 'Urgentie', placeholder: 'Deadline/tijdsdruk? (bv. "Defensie keuring 22 jan")',   icon: Zap,         color: '#f59e0b' },
  { key: 'open',    label: 'Open',     placeholder: 'Staat hij open voor hulp? (bv. "Wil plan, vraagt om hulp")', icon: Heart,    color: '#8b5cf6' },
]

const SALES_FIELDS = [
  { key: 'waarom_nu',    label: 'Waarom nu',     placeholder: 'Wat is er veranderd? Waarom nu de stap zetten?', color: '#FFD700' },
  { key: 'weerstand',    label: 'Weerstand',     placeholder: 'Wat wil hij absoluut niet? Waar maakt hij bezwaar?', color: '#ef4444' },
  { key: 'bereidheid',   label: 'Bereidheid',    placeholder: 'Wat is hij wél bereid te doen?',                  color: '#10b981' },
  { key: 'belofte',      label: 'Mijn belofte',  placeholder: 'Wat heb ik hem beloofd?',                         color: '#3b82f6' },
  { key: 'rode_vlaggen', label: 'Rode vlaggen',  placeholder: 'Wat baart me zorgen? Waarom kan dit mislukken?',  color: '#f97316' },
]

const TEMPERATURE_OPTIONS = [
  { key: 'cold', label: 'Koud',  color: '#3b82f6' },
  { key: 'warm', label: 'Warm',  color: '#f59e0b' },
  { key: 'hot',  label: 'Heet',  color: '#ef4444' },
]

const DEBOUNCE_MS = 600

export default function LeadDetailModalV2({
  lead,
  sectionColor = '#D4AF37',
  isMobile,
  onClose,
  onEdit,
  onDelete,
  initialTab = 'info',
  onMagnetAttached, // optional: called when a magnet is added (not removed)
  // Required for the per-lead message library (Berichten tab).
  db = null,
  coachId = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab)

  // Local edit state — optimistic; persists via debounced onEdit calls.
  const [info, setInfo] = useState({
    first_name:      lead?.first_name      || '',
    last_name:       lead?.last_name       || '',
    email:           lead?.email           || '',
    phone:           lead?.phone           || '',
    lead_source:     lead?.lead_source     || '',
    lead_temperature: lead?.lead_temperature || '',
    outreach_campaign_id: lead?.outreach_campaign_id || '',
    gender:          lead?.gender           || null,
  })

  const [qual, setQual] = useState({
    goal:            lead?.qual_goal            || '',
    goal_checked:    !!lead?.qual_goal_checked,
    pain:            lead?.qual_pain            || '',
    pain_checked:    !!lead?.qual_pain_checked,
    urgency:         lead?.qual_urgency         || '',
    urgency_checked: !!lead?.qual_urgency_checked,
    open:            lead?.qual_open            || '',
    open_checked:    !!lead?.qual_open_checked,
  })

  const existingSales = lead?.sales_call_notes || {}
  const [sales, setSales] = useState({
    waarom_nu:    existingSales.waarom_nu    || '',
    weerstand:    existingSales.weerstand    || '',
    bereidheid:   existingSales.bereidheid   || '',
    belofte:      existingSales.belofte      || '',
    rode_vlaggen: existingSales.rode_vlaggen || '',
    kwalificatie: existingSales.kwalificatie ?? null,
  })

  // Per-lead selection (subset of master list, stored on call_leads).
  const [selectedMagnets, setSelectedMagnets] = useState(
    Array.isArray(lead?.lead_magnets_shared) ? lead.lead_magnets_shared : []
  )
  // Master list of magnets for this coach — shared across all leads.
  const [masterMagnets, setMasterMagnets] = useState([])
  const [magnetsLoading, setMagnetsLoading] = useState(false)
  const [newMagnetName, setNewMagnetName] = useState('')
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [templateDraft, setTemplateDraft] = useState('')
  const [copyFeedbackId, setCopyFeedbackId] = useState(null)

  // Campaign list — used for the "Bron-campagne" dropdown in the Info tab
  // so old leads can be retroactively attributed.
  const [campaigns, setCampaigns] = useState([])
  useEffect(() => {
    if (!lead?.coach_id) return
    let cancelled = false
    supabase
      .from('outreach_campaigns')
      .select('id, name, variant_tag, status')
      .eq('coach_id', lead.coach_id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { console.error('Load campaigns failed:', error); setCampaigns([]) }
        else setCampaigns(data || [])
      })
    return () => { cancelled = true }
  }, [lead?.coach_id])

  const [noteText, setNoteText] = useState(lead?.notes || '')

  // Debounced save helpers.
  const debounceRefs = useRef({})
  const [savingField, setSavingField] = useState(null)

  const debounceSave = (fieldKey, run) => {
    if (debounceRefs.current[fieldKey]) clearTimeout(debounceRefs.current[fieldKey])
    debounceRefs.current[fieldKey] = setTimeout(async () => {
      setSavingField(fieldKey)
      try { await run() }
      finally { setSavingField(null) }
    }, DEBOUNCE_MS)
  }
  useEffect(() => () => {
    Object.values(debounceRefs.current).forEach(t => t && clearTimeout(t))
  }, [])

  // ESC = close. Backdrop click no longer closes (lost-notes bug); ESC
  // keeps a second, intentional exit path next to the X button.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Per-section persist helpers ────────────────────────────────────────
  const persistInfo = (patch) => {
    setInfo(prev => ({ ...prev, ...patch }))
    debounceSave('info', () => onEdit(patch))
  }
  const persistQualText = (field, value) => {
    setQual(prev => ({ ...prev, [field]: value }))
    debounceSave(`qual_${field}`, () => onEdit({ [`qual_${field}`]: value }))
  }
  const toggleQualCheck = async (field) => {
    const key = `${field}_checked`
    const next = !qual[key]
    setQual(prev => ({ ...prev, [key]: next }))
    setSavingField(`qual_${field}_check`)
    try { await onEdit({ [`qual_${field}_checked`]: next }) }
    catch { setQual(prev => ({ ...prev, [key]: !next })) }
    finally { setSavingField(null) }
  }
  const persistSales = (field, value) => {
    const updated = { ...sales, [field]: value }
    setSales(updated)
    debounceSave(`sales_${field}`, () => onEdit({ sales_call_notes: updated }))
  }
  const setSalesKwalificatie = async (value) => {
    const updated = { ...sales, kwalificatie: value }
    setSales(updated)
    setSavingField('sales_kwalificatie')
    try { await onEdit({ sales_call_notes: updated }) }
    finally { setSavingField(null) }
  }
  const persistSelectedMagnets = async (next) => {
    setSelectedMagnets(next)
    setSavingField('magnets')
    try { await onEdit({ lead_magnets_shared: next }) }
    finally { setSavingField(null) }
  }
  const persistNote = (value) => {
    setNoteText(value)
    debounceSave('notes', () => onEdit({ notes: value }))
  }

  // ── Master magnet list — loaded once when modal opens ──────────────────
  useEffect(() => {
    if (!lead?.coach_id) return
    let cancelled = false
    setMagnetsLoading(true)
    supabase
      .from('lead_magnets')
      .select('id, name, description, url, position, message_template')
      .eq('coach_id', lead.coach_id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { console.error('Load magnets failed:', error); setMasterMagnets([]) }
        else setMasterMagnets(data || [])
        setMagnetsLoading(false)
      })
    return () => { cancelled = true }
  }, [lead?.coach_id])

  // Toggle a magnet on/off for this lead. Name is the join key — stays
  // backwards-compatible with existing lead_magnets_shared TEXT[] data.
  // Fires onMagnetAttached on an ADD so the parent kanban can auto-move
  // the lead into the "Lead magnets" section if configured.
  const toggleMagnetForLead = (name) => {
    if (selectedMagnets.includes(name)) {
      persistSelectedMagnets(selectedMagnets.filter(m => m !== name))
    } else {
      persistSelectedMagnets([...selectedMagnets, name])
      if (onMagnetAttached) {
        try { onMagnetAttached(name) } catch (e) { console.error('onMagnetAttached failed:', e) }
      }
    }
  }

  // Add new magnet to the coach's master list. Auto-selects it for this lead.
  const addMasterMagnet = async () => {
    const name = newMagnetName.trim()
    if (!name || !lead?.coach_id) return
    if (masterMagnets.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      // Already in master — just toggle on for this lead.
      if (!selectedMagnets.includes(name)) await persistSelectedMagnets([...selectedMagnets, name])
      setNewMagnetName('')
      return
    }
    setSavingField('magnets')
    try {
      const { data, error } = await supabase
        .from('lead_magnets')
        .insert({ coach_id: lead.coach_id, name, position: masterMagnets.length })
        .select()
        .single()
      if (error) throw error
      setMasterMagnets(prev => [...prev, data])
      // Auto-attach to current lead.
      await onEdit({ lead_magnets_shared: [...selectedMagnets, name] })
      setSelectedMagnets(prev => [...prev, name])
      setNewMagnetName('')
    } catch (err) {
      console.error('Add magnet failed:', err)
      alert('Toevoegen mislukt — bestaat deze naam al?')
    } finally {
      setSavingField(null)
    }
  }

  // Copy rendered template to clipboard. Brief "Gekopieerd!" feedback per
  // magnet — clears after 2s.
  const copyMagnetMessage = async (magnet) => {
    const text = renderTemplate(magnet.message_template, lead, magnet)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for non-secure contexts: hidden textarea + execCommand.
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopyFeedbackId(magnet.id)
      setTimeout(() => setCopyFeedbackId(prev => prev === magnet.id ? null : prev), 1800)
    } catch (err) {
      console.error('Copy failed:', err)
      alert('Kopiëren mislukt — selecteer de tekst handmatig.')
    }
  }

  const startEditTemplate = (magnet) => {
    setEditingTemplateId(magnet.id)
    setTemplateDraft(magnet.message_template || DEFAULT_TEMPLATE)
  }
  const cancelEditTemplate = () => {
    setEditingTemplateId(null)
    setTemplateDraft('')
  }
  const saveTemplate = async () => {
    if (!editingTemplateId) return
    setSavingField('magnets')
    try {
      const { error } = await supabase
        .from('lead_magnets')
        .update({ message_template: templateDraft, updated_at: new Date().toISOString() })
        .eq('id', editingTemplateId)
      if (error) throw error
      setMasterMagnets(prev => prev.map(m =>
        m.id === editingTemplateId ? { ...m, message_template: templateDraft } : m
      ))
      setEditingTemplateId(null)
      setTemplateDraft('')
    } catch (err) {
      console.error('Save template failed:', err)
    } finally {
      setSavingField(null)
    }
  }

  // Delete from the coach's master list. Also strips it from this lead's
  // selection. Leaves *other leads'* arrays alone (they'll quietly point to
  // a no-longer-listed magnet name — harmless).
  const deleteMasterMagnet = async (magnet) => {
    if (!window.confirm(`Magnet "${magnet.name}" definitief verwijderen uit jouw lijst?`)) return
    setSavingField('magnets')
    try {
      const { error } = await supabase.from('lead_magnets').delete().eq('id', magnet.id)
      if (error) throw error
      setMasterMagnets(prev => prev.filter(m => m.id !== magnet.id))
      if (selectedMagnets.includes(magnet.name)) {
        const next = selectedMagnets.filter(n => n !== magnet.name)
        await onEdit({ lead_magnets_shared: next })
        setSelectedMagnets(next)
      }
    } catch (err) {
      console.error('Delete magnet failed:', err)
    } finally {
      setSavingField(null)
    }
  }

  // ── Scores ──────────────────────────────────────────────────────────────
  const qualScore = ['goal_checked', 'pain_checked', 'urgency_checked', 'open_checked']
    .filter(k => qual[k]).length
  const salesFilledCount = SALES_FIELDS.filter(f => sales[f.key]?.trim()).length

  // ── Render helpers ─────────────────────────────────────────────────────
  const fullName = `${info.first_name || ''} ${info.last_name || ''}`.trim() || 'Naamloze lead'

  return createPortal(
    <div
      // Intentionally NO backdrop-click-to-close — coaches kept losing
      // notes when they tapped outside the modal by accident. Closing
      // requires the explicit X button or pressing Escape.
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '2rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '720px',
        maxHeight: isMobile ? '94vh' : '90vh',
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '14px 14px 0 0' : '16px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          paddingTop: `calc(env(safe-area-inset-top, 0) + ${isMobile ? '0.875rem' : '1rem'})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: `linear-gradient(135deg, ${sectionColor}1a 0%, transparent 100%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '6px', height: '36px',
              background: sectionColor, borderRadius: '3px', flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? '1.05rem' : '1.15rem',
                fontWeight: '800', color: '#fff',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {fullName}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                marginTop: '0.15rem',
                fontSize: '0.65rem', fontWeight: '600',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {info.email && <span>{info.email}</span>}
                {info.phone && <span>· {info.phone}</span>}
                {qualScore > 0 && <span style={{ color: '#10b981' }}>· {qualScore}/4 gekwalificeerd</span>}
                {salesFilledCount > 0 && <span style={{ color: '#FFD700' }}>· {salesFilledCount}/5 sales</span>}
              </div>
            </div>
            <button onClick={onClose} aria-label="Sluiten" style={iconBtnStyle}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── TAB NAV ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: isMobile ? '0 0 auto' : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.35rem',
                  padding: isMobile ? '0.625rem 0.8rem' : '0.7rem 0.6rem',
                  background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? `2px solid ${sectionColor}` : '2px solid transparent',
                  color: active ? sectionColor : 'rgba(255,255,255,0.35)',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: active ? '800' : '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── BODY ────────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
        }}>
          {activeTab === 'info' && (
            <InfoTab info={info} persistInfo={persistInfo} savingField={savingField} campaigns={campaigns} />
          )}
          {activeTab === 'qual' && (
            <QualTab
              qual={qual}
              persistText={persistQualText}
              toggleCheck={toggleQualCheck}
              savingField={savingField}
            />
          )}
          {activeTab === 'sales' && (
            <SalesTab
              sales={sales}
              persistSales={persistSales}
              setKwalificatie={setSalesKwalificatie}
              savingField={savingField}
            />
          )}
          {activeTab === 'magnets' && (
            <MagnetsTab
              lead={lead}
              masterMagnets={masterMagnets}
              magnetsLoading={magnetsLoading}
              selectedMagnets={selectedMagnets}
              toggleMagnetForLead={toggleMagnetForLead}
              deleteMasterMagnet={deleteMasterMagnet}
              newMagnetName={newMagnetName}
              setNewMagnetName={setNewMagnetName}
              addMasterMagnet={addMasterMagnet}
              saving={savingField === 'magnets'}
              copyMagnetMessage={copyMagnetMessage}
              copyFeedbackId={copyFeedbackId}
              editingTemplateId={editingTemplateId}
              templateDraft={templateDraft}
              setTemplateDraft={setTemplateDraft}
              startEditTemplate={startEditTemplate}
              cancelEditTemplate={cancelEditTemplate}
              saveTemplate={saveTemplate}
            />
          )}
          {activeTab === 'messages' && (
            <LeadMessagesTab lead={lead} db={db} coachId={coachId} isMobile={isMobile} />
          )}
          {activeTab === 'notes' && (
            <NotesTab note={noteText} persistNote={persistNote} saving={savingField === 'notes'} />
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => { if (window.confirm('Lead verwijderen?')) onDelete?.() }}
            style={{
              ...iconBtnStyle,
              padding: '0.55rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.22)',
              color: '#fca5a5',
            }}
            aria-label="Verwijderen"
          >
            <Trash2 size={14} />
          </button>
          <div style={{
            flex: 1,
            fontSize: '0.62rem', fontWeight: '600',
            color: savingField ? '#10b981' : 'rgba(255,255,255,0.25)',
            textAlign: 'center',
            transition: 'color 0.2s ease',
          }}>
            {savingField ? <><Save size={9} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />Opgeslagen</> : 'Wijzigingen worden automatisch opgeslagen'}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1.1rem',
              background: sectionColor,
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              fontSize: '0.75rem', fontWeight: '800',
              cursor: 'pointer',
              minHeight: '36px',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}
          >
            <Check size={14} strokeWidth={2.8} />
            Sluiten
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function InfoTab({ info, persistInfo, savingField, campaigns = [] }) {
  const F = (key, value, props = {}) => (
    <div>
      <FieldLabel>{props.label || key}</FieldLabel>
      <input
        type={props.type || 'text'}
        value={value}
        onChange={(e) => persistInfo({ [key]: e.target.value })}
        placeholder={props.placeholder}
        style={inputStyle}
      />
      <SavingHint active={savingField === 'info'} />
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {F('first_name', info.first_name, { label: 'Voornaam' })}
        {F('last_name',  info.last_name,  { label: 'Achternaam' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {F('email', info.email, { label: 'Email', type: 'email' })}
        {F('phone', info.phone, { label: 'Telefoon', type: 'tel' })}
      </div>
      {F('lead_source', info.lead_source, { label: 'Bron', placeholder: 'Bv. Instagram / WhatsApp / Mond-op-mond' })}

      <div>
        <FieldLabel>Bron-campagne</FieldLabel>
        <select
          value={info.outreach_campaign_id || ''}
          onChange={(e) => persistInfo({ outreach_campaign_id: e.target.value || null })}
          style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
        >
          <option value="">— Geen campagne —</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}{c.variant_tag ? ` · ${c.variant_tag}` : ''}{c.status === 'archived' ? ' (gearchiveerd)' : ''}
            </option>
          ))}
        </select>
        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem', fontWeight: '500' }}>
          Welk bericht bracht deze lead binnen?
        </div>
      </div>

      <div>
        <FieldLabel>Temperatuur</FieldLabel>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {TEMPERATURE_OPTIONS.map(opt => {
            const active = info.lead_temperature === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => persistInfo({ lead_temperature: active ? '' : opt.key })}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.6rem',
                  background: active ? `${opt.color}22` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? opt.color + '66' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '6px',
                  color: active ? opt.color : 'rgba(255,255,255,0.55)',
                  fontSize: '0.72rem', fontWeight: active ? '800' : '600',
                  cursor: 'pointer', minHeight: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                }}
              >
                <Flame size={11} />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <FieldLabel>Geslacht</FieldLabel>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { key: 'male',   label: 'Man',   color: '#3b82f6' },
            { key: 'female', label: 'Vrouw', color: '#ec4899' },
          ].map(opt => {
            const active = info.gender === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => persistInfo({ gender: active ? null : opt.key })}
                style={{
                  flex: 1, padding: '0.5rem 0.6rem',
                  background: active ? `${opt.color}22` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? opt.color + '66' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '6px',
                  color: active ? opt.color : 'rgba(255,255,255,0.55)',
                  fontSize: '0.72rem', fontWeight: active ? '800' : '600',
                  cursor: 'pointer', minHeight: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function QualTab({ qual, persistText, toggleCheck, savingField }) {
  const score = ['goal_checked','pain_checked','urgency_checked','open_checked']
    .filter(k => qual[k]).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <ScoreBanner
        score={score}
        max={4}
        label={score >= 3 ? 'Klaar voor de call' : 'Bouw eerst meer kwalificatie'}
        color={score >= 3 ? '#10b981' : '#f59e0b'}
      />
      {QUAL_FIELDS.map(f => {
        const Icon = f.icon
        const checked = qual[`${f.key}_checked`]
        const isSavingText  = savingField === `qual_${f.key}`
        const isSavingCheck = savingField === `qual_${f.key}_check`
        return (
          <div key={f.key} style={{
            background: checked ? `${f.color}10` : 'rgba(255,255,255,0.025)',
            border: `1px solid ${checked ? f.color + '44' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '8px',
            padding: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Icon size={13} color={f.color} />
              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: f.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {f.label}
              </span>
              <button
                onClick={() => toggleCheck(f.key)}
                style={{
                  marginLeft: 'auto',
                  width: '20px', height: '20px', borderRadius: '4px',
                  border: `1.5px solid ${checked ? f.color : 'rgba(255,255,255,0.2)'}`,
                  background: checked ? f.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: isSavingCheck ? 0.5 : 1,
                }}
                aria-label={`${f.label} ${checked ? 'uitvinken' : 'aanvinken'}`}
              >
                {checked && <Check size={12} color="#000" strokeWidth={3} />}
              </button>
            </div>
            <textarea
              value={qual[f.key]}
              onChange={(e) => persistText(f.key, e.target.value)}
              placeholder={f.placeholder}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '52px' }}
            />
            <SavingHint active={isSavingText} />
          </div>
        )
      })}
    </div>
  )
}

function SalesTab({ sales, persistSales, setKwalificatie, savingField }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Kwalificatie verdict pills */}
      <div>
        <FieldLabel>Verdict</FieldLabel>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { value: true,  label: 'Gekwalificeerd', color: '#10b981' },
            { value: false, label: 'Niet nu',        color: '#ef4444' },
            { value: null,  label: 'Twijfel',         color: 'rgba(255,255,255,0.4)' },
          ].map(o => {
            const active = sales.kwalificatie === o.value
            return (
              <button
                key={String(o.value)}
                onClick={() => setKwalificatie(o.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.5rem',
                  background: active ? `${o.color}22` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? o.color + '66' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '6px',
                  color: active ? o.color : 'rgba(255,255,255,0.5)',
                  fontSize: '0.7rem', fontWeight: active ? '800' : '600',
                  cursor: 'pointer', minHeight: '34px',
                }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        <SavingHint active={savingField === 'sales_kwalificatie'} />
      </div>

      {SALES_FIELDS.map(f => (
        <div key={f.key}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '4px', height: '14px', background: f.color, borderRadius: '2px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: f.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {f.label}
            </span>
          </div>
          <textarea
            value={sales[f.key]}
            onChange={(e) => persistSales(f.key, e.target.value)}
            placeholder={f.placeholder}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '52px' }}
          />
          <SavingHint active={savingField === `sales_${f.key}`} />
        </div>
      ))}
    </div>
  )
}

function MagnetsTab({
  lead, masterMagnets, magnetsLoading, selectedMagnets,
  toggleMagnetForLead, deleteMasterMagnet,
  newMagnetName, setNewMagnetName, addMasterMagnet, saving,
  copyMagnetMessage, copyFeedbackId,
  editingTemplateId, templateDraft, setTemplateDraft,
  startEditTemplate, cancelEditTemplate, saveTemplate,
}) {
  const hasSourceInfo = lead?.utm_source || lead?.utm_medium || lead?.utm_campaign || lead?.referrer_url
  // Detect magnet names selected on the lead that no longer exist in the
  // master list (e.g. older free-text entries from before this refactor).
  const orphanSelected = selectedMagnets.filter(
    n => !masterMagnets.some(m => m.name.toLowerCase() === n.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <FieldLabel>Jouw lead magnets</FieldLabel>
        <div style={{
          fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)',
          marginTop: '-0.15rem', marginBottom: '0.6rem', lineHeight: 1.4,
        }}>
          Klik om aan/uit te zetten voor deze lead. Voeg eens toe — verschijnt bij elke lead.
        </div>

        {magnetsLoading && (
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', padding: '0.5rem 0' }}>
            Laden…
          </div>
        )}

        {!magnetsLoading && masterMagnets.length === 0 && orphanSelected.length === 0 && (
          <div style={{
            padding: '0.65rem 0.875rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.72rem', fontWeight: '500',
            marginBottom: '0.5rem',
          }}>
            Nog geen lead magnets. Voeg er een toe hieronder.
          </div>
        )}

        {/* Master list — stacked rows, each with toggle + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.6rem' }}>
          {masterMagnets.map(m => {
            const active = selectedMagnets.includes(m.name)
            const isEditing = editingTemplateId === m.id
            const justCopied = copyFeedbackId === m.id
            return (
              <div key={m.id} style={{
                background: active ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${active ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.15s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.55rem' }}>
                  {/* Toggle chip area */}
                  <div
                    onClick={() => toggleMagnetForLead(m.name)}
                    style={{
                      flex: 1, minWidth: 0,
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      cursor: 'pointer',
                      color: active ? '#FFD700' : 'rgba(255,255,255,0.65)',
                      fontSize: '0.78rem', fontWeight: '700',
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '4px',
                      border: `1.5px solid ${active ? '#FFD700' : 'rgba(255,255,255,0.2)'}`,
                      background: active ? '#FFD700' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {active && <Check size={11} color="#000" strokeWidth={3} />}
                    </div>
                    <Magnet size={11} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <button
                    onClick={() => copyMagnetMessage(m)}
                    title="Kopieer bericht"
                    aria-label={`Kopieer bericht voor ${m.name}`}
                    style={{
                      ...chipActionBtn,
                      background: justCopied ? 'rgba(16,185,129,0.18)' : 'rgba(255,215,0,0.12)',
                      borderColor: justCopied ? 'rgba(16,185,129,0.4)' : 'rgba(255,215,0,0.3)',
                      color: justCopied ? '#10b981' : '#FFD700',
                    }}
                  >
                    {justCopied ? <Check size={11} strokeWidth={2.8} /> : <Copy size={11} />}
                  </button>
                  <button
                    onClick={() => isEditing ? cancelEditTemplate() : startEditTemplate(m)}
                    title={isEditing ? 'Sluit editor' : 'Bewerk bericht-template'}
                    style={{
                      ...chipActionBtn,
                      background: isEditing ? 'rgba(255,255,255,0.08)' : 'transparent',
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {isEditing ? <X size={11} /> : <Pencil size={10} />}
                  </button>
                  <button
                    onClick={() => deleteMasterMagnet(m)}
                    title="Verwijder uit lijst"
                    aria-label={`Verwijder ${m.name} uit master-lijst`}
                    style={{
                      ...chipActionBtn,
                      background: 'transparent',
                      borderColor: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.25)',
                    }}
                  >
                    <Trash size={10} />
                  </button>
                </div>

                {/* Inline template editor */}
                {isEditing && (
                  <div style={{
                    padding: '0.6rem 0.6rem 0.65rem',
                    background: 'rgba(0,0,0,0.25)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem', fontWeight: '600' }}>
                      Placeholders: <code style={{ color: '#FFD700' }}>{'{first_name}'}</code> · <code style={{ color: '#FFD700' }}>{'{magnet_name}'}</code> · <code style={{ color: '#FFD700' }}>{'{url}'}</code>
                    </div>
                    <textarea
                      value={templateDraft}
                      onChange={(e) => setTemplateDraft(e.target.value)}
                      rows={8}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '160px', fontSize: '0.75rem', lineHeight: 1.45 }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <button
                        onClick={saveTemplate}
                        disabled={saving}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#FFD700', border: 'none', borderRadius: '5px',
                          color: '#000', fontSize: '0.7rem', fontWeight: '800',
                          cursor: 'pointer', minHeight: '30px',
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                        }}
                      >
                        <Save size={11} strokeWidth={2.5} /> Opslaan
                      </button>
                      <button
                        onClick={cancelEditTemplate}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '5px', color: 'rgba(255,255,255,0.55)',
                          fontSize: '0.7rem', fontWeight: '700',
                          cursor: 'pointer', minHeight: '30px',
                        }}
                      >
                        Annuleer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Orphan-selected: name on lead that isn't in master anymore */}
          {orphanSelected.map(name => (
            <div
              key={`orphan-${name}`}
              onClick={() => toggleMagnetForLead(name)}
              title="Niet in jouw master-lijst — klik om los te koppelen"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.35rem 0.55rem',
                background: 'rgba(245,158,11,0.08)',
                border: '1px dashed rgba(245,158,11,0.35)',
                borderRadius: '999px',
                fontSize: '0.72rem', fontWeight: '700',
                color: '#f59e0b',
                cursor: 'pointer',
              }}
            >
              <Magnet size={10} />
              <span>{name}</span>
              <X size={10} strokeWidth={2.5} style={{ marginLeft: '0.1rem' }} />
            </div>
          ))}
        </div>

        {/* Add to master */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            type="text"
            value={newMagnetName}
            onChange={(e) => setNewMagnetName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMasterMagnet() } }}
            placeholder="Nieuwe magnet — bv. '7 secrets PDF' of 'Macro calculator'"
            style={inputStyle}
          />
          <button
            onClick={addMasterMagnet}
            disabled={!newMagnetName.trim() || saving || !lead?.coach_id}
            style={{
              padding: '0 0.875rem',
              background: newMagnetName.trim() ? '#FFD700' : 'rgba(255,215,0,0.15)',
              border: 'none',
              borderRadius: '6px',
              color: newMagnetName.trim() ? '#000' : 'rgba(255,215,0,0.4)',
              fontSize: '0.75rem', fontWeight: '800',
              cursor: newMagnetName.trim() ? 'pointer' : 'not-allowed',
              minHeight: '36px',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={13} strokeWidth={2.8} /> Toevoegen
          </button>
        </div>
        <SavingHint active={saving} />
      </div>

      {/* Bron-info — read-only */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        padding: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Tag size={11} color="rgba(255,255,255,0.4)" />
          <FieldLabel inline>Binnenkwam via</FieldLabel>
        </div>
        {!hasSourceInfo && (
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            Geen tracking-data bekend voor deze lead.
          </div>
        )}
        {hasSourceInfo && (
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '0.75rem', rowGap: '0.4rem', fontSize: '0.7rem' }}>
            {lead.utm_source && (<>
              <span style={metaKey}>UTM source</span>
              <span style={metaVal}>{lead.utm_source}</span>
            </>)}
            {lead.utm_medium && (<>
              <span style={metaKey}>UTM medium</span>
              <span style={metaVal}>{lead.utm_medium}</span>
            </>)}
            {lead.utm_campaign && (<>
              <span style={metaKey}>UTM campaign</span>
              <span style={metaVal}>{lead.utm_campaign}</span>
            </>)}
            {lead.referrer_url && (<>
              <span style={metaKey}>Referrer</span>
              <a
                href={lead.referrer_url}
                target="_blank" rel="noreferrer"
                style={{ ...metaVal, color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {lead.referrer_url} <ExternalLink size={9} />
              </a>
            </>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Per-lead messages library — write/save/edit/delete/copy ──────────────
// Stores entries in the existing `lead_notes` table with note_type='message'
// so they don't collide with any other note-typed records.
function LeadMessagesTab({ lead, db, coachId, isMobile }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [savingNew, setSavingNew] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const canUse = !!(db?.supabase && coachId && lead?.id)

  const load = async () => {
    if (!canUse) return
    setLoading(true)
    try {
      const { data, error } = await db.supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', lead.id)
        .eq('note_type', 'message')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setMessages(data || [])
    } catch (e) {
      console.error('load lead messages failed:', e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [lead?.id, coachId])

  const handleSave = async () => {
    const text = draft.trim()
    if (!text || !canUse) return
    setSavingNew(true)
    try {
      const { data, error } = await db.supabase
        .from('lead_notes')
        .insert({
          lead_id: lead.id, coach_id: coachId,
          note_type: 'message',
          content: text, subject: null,
        })
        .select().single()
      if (error) throw error
      setMessages(prev => [data, ...prev])
      setDraft('')
    } catch (e) {
      alert('Opslaan mislukt — ' + (e?.message || e))
    } finally {
      setSavingNew(false)
    }
  }

  const handleClear = () => {
    if (!draft.trim()) return
    if (window.confirm('Veld leegmaken? Tekst gaat verloren.')) setDraft('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bericht verwijderen?')) return
    const prev = messages
    setMessages(p => p.filter(m => m.id !== id))
    try {
      const { error } = await db.supabase
        .from('lead_notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error('delete msg failed:', e); setMessages(prev)
    }
  }

  const handleEditSave = async () => {
    if (!editingId) return
    const text = editingText.trim()
    if (!text) return
    const prev = messages
    setMessages(p => p.map(m => m.id === editingId ? { ...m, content: text } : m))
    setEditingId(null); setEditingText('')
    try {
      const { error } = await db.supabase
        .from('lead_notes')
        .update({ content: text, updated_at: new Date().toISOString() })
        .eq('id', editingId)
      if (error) throw error
    } catch (e) {
      console.error('edit msg failed:', e); setMessages(prev)
    }
  }

  const copyToClipboard = async (text, id) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1200)
  }

  if (!canUse) {
    return (
      <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
        Berichten-tab vereist een ingelogde coach. Sluit en open de lead opnieuw.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <FieldLabel>Berichten die ik naar deze lead stuur</FieldLabel>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Schrijf hier een nieuw bericht voor deze lead — sla 'm op om 'm later te kopiëren."
        rows={isMobile ? 5 : 7}
        style={{
          ...inputStyle, resize: 'vertical', minHeight: 120,
          fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleSave}
          disabled={!draft.trim() || savingNew}
          style={{
            flex: 2, padding: '0.55rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: draft.trim() ? '#FFD700' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${draft.trim() ? '#FFD700' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 6,
            color: draft.trim() ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: '0.78rem', fontWeight: 800,
            cursor: draft.trim() && !savingNew ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation',
          }}
        >
          <Plus size={13} /> {savingNew ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          onClick={handleClear}
          disabled={!draft.trim()}
          style={{
            flex: 1, padding: '0.55rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 6,
            color: draft.trim() ? '#fca5a5' : 'rgba(255,255,255,0.25)',
            fontSize: '0.75rem', fontWeight: 700,
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <Eraser size={12} /> Clear
        </button>
      </div>

      <div style={{
        paddingTop: '0.55rem', marginTop: 2,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: '0.55rem', fontWeight: 800,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: '0.45rem',
        }}>
          Opgeslagen ({messages.length})
        </div>
        {loading && (
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0.5rem' }}>
            Laden…
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{
            fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
            textAlign: 'center', padding: '0.85rem', fontStyle: 'italic',
          }}>
            Nog geen berichten opgeslagen voor deze lead.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {messages.map(m => {
            const isCopied = copiedId === m.id
            const isEditing = editingId === m.id
            return (
              <div
                key={m.id}
                onClick={() => { if (!isEditing) copyToClipboard(m.content, m.id) }}
                style={{
                  display: 'flex', alignItems: 'stretch',
                  background: isCopied ? 'rgba(255,215,0,0.13)' : 'rgba(255,255,255,0.03)',
                  border: isCopied ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, overflow: 'hidden',
                  cursor: isEditing ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 4, background: '#FFD700', flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '0.55rem 0.7rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{
                    fontSize: '0.55rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {new Date(m.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {m.updated_at && m.updated_at !== m.created_at && (
                      <span style={{ marginLeft: 6, color: 'rgba(255,215,0,0.55)' }}>· bewerkt</span>
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={Math.max(3, Math.min(8, (editingText.match(/\n/g)?.length || 0) + 2))}
                      style={{
                        ...inputStyle, padding: '0.45rem 0.55rem',
                        fontFamily: 'inherit', resize: 'vertical',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,215,0,0.4)',
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)',
                      lineHeight: 1.4, whiteSpace: 'pre-wrap',
                    }}>
                      {m.content}
                    </div>
                  )}
                  {isEditing && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditSave() }}
                        style={{
                          padding: '4px 10px',
                          background: '#10b981', border: 'none', borderRadius: 4,
                          color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <Check size={11} /> Opslaan
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditingText('') }}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                          color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Annuleer
                      </button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div style={{
                    width: 44, display: 'flex', flexDirection: 'column',
                    borderLeft: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCopied ? '#FFD700' : 'transparent',
                    }}>
                      {isCopied ? <Check size={16} color="#000" /> : <Copy size={14} color="rgba(255,255,255,0.3)" />}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(m.id); setEditingText(m.content) }}
                      title="Bewerk" style={{
                        height: 26, background: 'transparent',
                        border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}
                      title="Verwijder" style={{
                        height: 26, background: 'transparent',
                        border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)',
                        color: 'rgba(239,68,68,0.5)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NotesTab({ note, persistNote, saving }) {
  return (
    <div>
      <FieldLabel>Algemene notities</FieldLabel>
      <textarea
        value={note}
        onChange={(e) => persistNote(e.target.value)}
        placeholder="Schrijf hier alles wat je over deze lead wilt onthouden…"
        rows={12}
        style={{ ...inputStyle, resize: 'vertical', minHeight: '220px', fontFamily: 'inherit' }}
      />
      <SavingHint active={saving} />
    </div>
  )
}

// ── Shared bits ─────────────────────────────────────────────────────────────

function FieldLabel({ children, inline }) {
  return (
    <div style={{
      fontSize: '0.55rem', fontWeight: '800',
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: inline ? 0 : '0.35rem',
    }}>{children}</div>
  )
}

function SavingHint({ active }) {
  if (!active) return null
  return (
    <div style={{
      fontSize: '0.55rem', fontWeight: '600',
      color: 'rgba(16,185,129,0.65)', marginTop: '0.25rem',
      display: 'flex', alignItems: 'center', gap: '0.2rem',
    }}>
      <Save size={9} /> Opgeslagen
    </div>
  )
}

function ScoreBanner({ score, max, label, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.6rem 0.75rem',
      background: `${color}10`,
      border: `1px solid ${color}33`,
      borderRadius: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <Target size={13} color={color} />
        <span style={{ fontSize: '0.72rem', fontWeight: '700', color }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: '0.85rem', fontWeight: '900',
        color, letterSpacing: '-0.02em',
      }}>
        {score}/{max}
      </span>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '0.78rem',
  fontWeight: '500',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  lineHeight: 1.4,
}

const iconBtnStyle = {
  width: '32px', height: '32px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

const chipActionBtn = {
  width: '26px', height: '26px',
  border: '1px solid',
  borderRadius: '5px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'all 0.15s ease',
}

const metaKey = {
  fontSize: '0.6rem', fontWeight: '700',
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}
const metaVal = {
  fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)',
  wordBreak: 'break-all',
}
