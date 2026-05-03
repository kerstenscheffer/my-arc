// src/modules/lead-management/components/kanban/LeadDetailModal.jsx
// VERSION 2.0 - Sales Call blok toegevoegd onder Qualification
// Slaat op in call_leads.sales_call_notes JSONB via onEdit

import { useState, useEffect, useRef } from 'react'
import { 
  X, Mail, Phone, FileText, MessageCircle, Plus, Minus, 
  Clock, CheckCircle, Circle, Edit2, Trash2, ArrowLeftCircle,
  Target, AlertCircle, Zap, Heart, Flame, Save, PhoneCall
} from 'lucide-react'

// Qualification Field Config
const QUAL_FIELDS = [
  { 
    key: 'goal', 
    label: 'DOEL', 
    placeholder: 'Wat is zijn doel? (bv. "80kg, breder worden")',
    icon: Target,
    color: '#10b981'
  },
  { 
    key: 'pain', 
    label: 'PIJN', 
    placeholder: 'Waar loopt hij vast? (bv. "Eet te weinig, geen progressie")',
    icon: AlertCircle,
    color: '#ef4444'
  },
  { 
    key: 'urgency', 
    label: 'URGENTIE', 
    placeholder: 'Deadline/tijdsdruk? (bv. "Defensie keuring 22 jan")',
    icon: Zap,
    color: '#f59e0b'
  },
  { 
    key: 'open', 
    label: 'OPEN', 
    placeholder: 'Staat hij open voor hulp? (bv. "Wil plan, vraagt om hulp")',
    icon: Heart,
    color: '#8b5cf6'
  }
]

// Sales Call velden
const SALES_FIELDS = [
  {
    key: 'waarom_nu',
    label: 'WAAROM NU',
    placeholder: 'Wat is er veranderd? Waarom nu de stap zetten?',
    color: '#FFD700'
  },
  {
    key: 'weerstand',
    label: 'WEERSTAND',
    placeholder: 'Wat wil hij absoluut niet? Waar maakt hij bezwaar?',
    color: '#ef4444'
  },
  {
    key: 'bereidheid',
    label: 'BEREIDHEID',
    placeholder: 'Wat is hij wél bereid te doen?',
    color: '#10b981'
  },
  {
    key: 'belofte',
    label: 'MIJN BELOFTE',
    placeholder: 'Wat heb ik hem beloofd?',
    color: '#3b82f6'
  },
  {
    key: 'rode_vlaggen',
    label: 'RODE VLAGGEN',
    placeholder: 'Wat baart me zorgen? Waarom zou dit kunnen mislukken?',
    color: '#f97316'
  }
]

export default function LeadDetailModal({ 
  lead, 
  sectionColor = '#D4AF37',
  isMobile,
  onClose,
  onEdit,
  onDelete,
  onSnooze
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    lead_source: lead?.lead_source || '',
    notes: lead?.notes || ''
  })

  // Qualification state
  const [qualData, setQualData] = useState({
    goal: lead?.qual_goal || '',
    goal_checked: lead?.qual_goal_checked || false,
    pain: lead?.qual_pain || '',
    pain_checked: lead?.qual_pain_checked || false,
    urgency: lead?.qual_urgency || '',
    urgency_checked: lead?.qual_urgency_checked || false,
    open: lead?.qual_open || '',
    open_checked: lead?.qual_open_checked || false
  })

  // Sales call state
  const existingSalesNotes = lead?.sales_call_notes || {}
  const [salesData, setSalesData] = useState({
    waarom_nu:    existingSalesNotes.waarom_nu    || '',
    weerstand:    existingSalesNotes.weerstand    || '',
    bereidheid:   existingSalesNotes.bereidheid   || '',
    belofte:      existingSalesNotes.belofte      || '',
    rode_vlaggen: existingSalesNotes.rode_vlaggen || '',
    kwalificatie: existingSalesNotes.kwalificatie ?? null, // true/false/null
  })
  const [savingSales, setSavingSales] = useState(false)
  const [salesSaved, setSalesSaved] = useState(false)
  const salesSaveRef = useRef(null)

  const [replyCount, setReplyCount] = useState(lead?.reply_count || 0)
  const [updatingReply, setUpdatingReply] = useState(false)
  const [contactedToday, setContactedToday] = useState(false)
  const [updatingContacted, setUpdatingContacted] = useState(false)
  const [savingField, setSavingField] = useState(null)
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    if (lead?.contacted_today_date) {
      const today = new Date().toISOString().split('T')[0]
      const contactedDate = lead.contacted_today_date.split('T')[0]
      setContactedToday(contactedDate === today)
    }
  }, [lead?.contacted_today_date])

  // Calculate qualification score
  const qualScore = [
    qualData.goal_checked,
    qualData.pain_checked,
    qualData.urgency_checked,
    qualData.open_checked
  ].filter(Boolean).length
  const isCallReady = qualScore >= 3

  // Sales call volledigheid
  const salesFilledCount = SALES_FIELDS.filter(f => salesData[f.key]?.trim()).length
  const salesCallDone = salesData.kwalificatie !== null

  // Previous section info
  const hasPreviousSection = lead?.previous_section_id && lead?.previous_section_title
  const previousSectionColor = lead?.previous_section_color || '#6b7280'

  const getDaysSinceStale = () => {
    if (!lead?.moved_to_stale_at) return null
    const movedDate = new Date(lead.moved_to_stale_at)
    const now = new Date()
    return Math.floor((now - movedDate) / (1000 * 60 * 60 * 24))
  }
  const daysSinceStale = getDaysSinceStale()

  // ── HANDLERS ──

  const handleContactedTodayToggle = async () => {
    if (updatingContacted) return
    setUpdatingContacted(true)
    const newValue = !contactedToday
    setContactedToday(newValue)
    try {
      await onEdit({ contacted_today_date: newValue ? new Date().toISOString() : null })
    } catch (error) {
      setContactedToday(!newValue)
    } finally {
      setUpdatingContacted(false)
    }
  }

  const handleReplyChange = async (delta) => {
    if (updatingReply) return
    if (delta < 0 && replyCount <= 0) return
    setUpdatingReply(true)
    const newCount = Math.max(0, replyCount + delta)
    setReplyCount(newCount)
    try {
      await onEdit({ reply_count: newCount })
    } catch (error) {
      setReplyCount(replyCount)
    } finally {
      setUpdatingReply(false)
    }
  }

  const handleQualCheckToggle = async (field) => {
    const checkKey = `${field}_checked`
    const newValue = !qualData[checkKey]
    setQualData(prev => ({ ...prev, [checkKey]: newValue }))
    setSavingField(field)
    try {
      await onEdit({ [`qual_${field}_checked`]: newValue })
    } catch (error) {
      setQualData(prev => ({ ...prev, [checkKey]: !newValue }))
    } finally {
      setSavingField(null)
    }
  }

  const handleQualTextChange = (field, value) => {
    setQualData(prev => ({ ...prev, [field]: value }))
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      setSavingField(field)
      try {
        await onEdit({ [`qual_${field}`]: value })
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setSavingField(null)
      }
    }, 800)
  }

  // Sales call auto-save
  const handleSalesChange = (field, value) => {
    const updated = { ...salesData, [field]: value }
    setSalesData(updated)
    if (salesSaveRef.current) clearTimeout(salesSaveRef.current)
    salesSaveRef.current = setTimeout(async () => {
      setSavingSales(true)
      try {
        await onEdit({ sales_call_notes: updated })
        setSalesSaved(true)
        setTimeout(() => setSalesSaved(false), 1500)
      } catch (e) {
        console.error('❌ Sales call save failed:', e)
      } finally {
        setSavingSales(false)
      }
    }, 800)
  }

  const handleKwalificatie = async (value) => {
    const updated = { ...salesData, kwalificatie: value }
    setSalesData(updated)
    setSavingSales(true)
    try {
      await onEdit({ sales_call_notes: updated })
      setSalesSaved(true)
      setTimeout(() => setSalesSaved(false), 1500)
    } catch (e) {
      console.error('❌ Kwalificatie save failed:', e)
    } finally {
      setSavingSales(false)
    }
  }

  const handleSaveBasicInfo = async () => {
    try {
      await onEdit(editData)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Lead verwijderen?')) {
      await onDelete()
      onClose()
    }
  }

  const handleSnooze = async () => {
    if (onSnooze) {
      await onSnooze(lead.id)
      onClose()
    }
  }

  if (!lead) return null

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        zIndex: 10000
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '600px',
          maxHeight: isMobile ? '95vh' : '90vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: isMobile ? '16px' : '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.2)'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0,0,0,0) 100%)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              {isCallReady && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '20px'
                }}>
                  <Flame size={14} color="#FFD700" />
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    CALL READY
                  </span>
                </div>
              )}
              {salesCallDone && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  background: salesData.kwalificatie
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${salesData.kwalificatie ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  borderRadius: '20px'
                }}>
                  <PhoneCall size={12} color={salesData.kwalificatie ? '#10b981' : '#ef4444'} />
                  <span style={{
                    fontSize: '0.7rem', fontWeight: '800',
                    color: salesData.kwalificatie ? '#10b981' : '#ef4444',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {salesData.kwalificatie ? 'GEKWALIFICEERD' : 'NIET GESCHIKT'}
                  </span>
                </div>
              )}
            </div>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '700', color: '#fff', margin: 0, marginBottom: '0.5rem' }}>
              {lead.first_name} {lead.last_name}
            </h2>
            {lead.lead_source && (
              <span style={{
                display: 'inline-flex', padding: '0.25rem 0.6rem',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '6px', color: '#D4AF37',
                fontSize: '0.75rem', fontWeight: '600'
              }}>
                {lead.lead_source}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setIsEditing(!isEditing)} style={{
              width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isEditing ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isEditing ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '10px',
              color: isEditing ? '#D4AF37' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>
              <Edit2 size={18} />
            </button>
            <button onClick={onClose} style={{
              width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>

          {/* PREVIOUS SECTION INFO */}
          {hasPreviousSection && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${previousSectionColor}15 0%, ${previousSectionColor}08 100%)`,
              border: `1px solid ${previousSectionColor}40`,
              borderRadius: '10px', borderLeft: `3px solid ${previousSectionColor}`
            }}>
              <ArrowLeftCircle size={18} color={previousSectionColor} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Komt uit</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: previousSectionColor }}>{lead.previous_section_title}</div>
              </div>
              {daysSinceStale !== null && (
                <div style={{
                  padding: '0.25rem 0.5rem',
                  background: daysSinceStale >= 3 ? 'rgba(239,68,68,0.2)' : daysSinceStale >= 2 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${daysSinceStale >= 3 ? 'rgba(239,68,68,0.4)' : daysSinceStale >= 2 ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                  color: daysSinceStale >= 3 ? '#ef4444' : daysSinceStale >= 2 ? '#fbbf24' : 'rgba(255,255,255,0.6)'
                }}>
                  {daysSinceStale}d stil
                </div>
              )}
            </div>
          )}

          {/* CONTACT INFO */}
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input type="text" placeholder="Voornaam" value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Achternaam" value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} style={inputStyle} />
              </div>
              <input type="text" placeholder="Bron" value={editData.lead_source} onChange={(e) => setEditData({ ...editData, lead_source: e.target.value })} style={inputStyle} />
              <input type="email" placeholder="Email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} style={inputStyle} />
              <input type="tel" placeholder="Telefoon" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} style={inputStyle} />
              <textarea placeholder="Notities" value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSaveBasicInfo} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                  <Save size={16} /> Opslaan
                </button>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Annuleer
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lead.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <Mail size={14} color="rgba(255,255,255,0.5)" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <Phone size={14} color="rgba(255,255,255,0.5)" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.notes && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', gap: '0.5rem' }}>
                  <FileText size={14} color="rgba(255,255,255,0.4)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>{lead.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* QUALIFICATION SECTION */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(0,0,0,0) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '12px', overflow: 'hidden'
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={16} color="#D4AF37" />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Qualification
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.25rem 0.6rem',
                background: isCallReady ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isCallReady ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '20px'
              }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: i < qualScore ? '#D4AF37' : 'rgba(255,255,255,0.2)',
                    boxShadow: i < qualScore ? '0 0 6px #D4AF37' : 'none'
                  }} />
                ))}
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isCallReady ? '#D4AF37' : 'rgba(255,255,255,0.5)', marginLeft: '0.25rem' }}>
                  {qualScore}/4
                </span>
              </div>
            </div>

            <div style={{ padding: '0.5rem' }}>
              {QUAL_FIELDS.map(field => {
                const isChecked = qualData[`${field.key}_checked`]
                const textValue = qualData[field.key]
                const Icon = field.icon
                const isSaving = savingField === field.key

                return (
                  <div key={field.key} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '0.75rem',
                    background: isChecked ? `${field.color}10` : 'transparent',
                    borderRadius: '8px', marginBottom: '0.5rem'
                  }}>
                    <button onClick={() => handleQualCheckToggle(field.key)} style={{
                      width: '36px', height: '36px', minWidth: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isChecked ? `${field.color}20` : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isChecked ? field.color : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: '8px', cursor: 'pointer', touchAction: 'manipulation'
                    }}>
                      {isChecked ? <CheckCircle size={18} color={field.color} /> : <Circle size={18} color="rgba(255,255,255,0.3)" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <Icon size={12} color={isChecked ? field.color : 'rgba(255,255,255,0.4)'} />
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: isChecked ? field.color : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {field.label}
                        </span>
                        {isSaving && <span style={{ fontSize: '0.6rem', color: '#D4AF37', marginLeft: 'auto' }}>Saving...</span>}
                      </div>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={textValue}
                        onChange={(e) => handleQualTextChange(field.key, e.target.value)}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isChecked ? `${field.color}40` : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── SALES CALL BLOK ── */}
          <div style={{
            background: 'rgba(255,215,0,0.03)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: '12px', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255,215,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PhoneCall size={16} color="#FFD700" />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sales Call
                </span>
                {salesFilledCount > 0 && (
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,215,0,0.4)', fontWeight: '600' }}>
                    {salesFilledCount}/{SALES_FIELDS.length} ingevuld
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.65rem', color: savingSales ? '#FFD700' : salesSaved ? '#10b981' : 'rgba(255,255,255,0.2)', fontWeight: '600', transition: 'color 0.2s' }}>
                {savingSales ? 'Opslaan...' : salesSaved ? '✓ Opgeslagen' : 'Auto-save'}
              </div>
            </div>

            {/* Velden */}
            <div style={{ padding: '0.75rem' }}>
              {SALES_FIELDS.map(field => (
                <div key={field.key} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: field.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem', opacity: 0.8 }}>
                    {field.label}
                  </div>
                  <textarea
                    value={salesData[field.key] || ''}
                    onChange={e => handleSalesChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      background: salesData[field.key] ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${salesData[field.key] ? `${field.color}30` : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      color: salesData[field.key] ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.5,
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => { e.target.style.borderColor = `${field.color}50` }}
                    onBlur={e => { e.target.style.borderColor = salesData[field.key] ? `${field.color}30` : 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              ))}

              {/* Kwalificatie — go/no-go */}
              <div style={{ borderTop: '1px solid rgba(255,215,0,0.1)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                  KWALIFICATIE
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleKwalificatie(true)}
                    style={{
                      flex: 1, padding: '0.65rem',
                      background: salesData.kwalificatie === true ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${salesData.kwalificatie === true ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: salesData.kwalificatie === true ? '#10b981' : 'rgba(255,255,255,0.4)',
                      fontSize: '0.8rem', fontWeight: '700',
                      cursor: 'pointer', fontFamily: 'inherit',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease', minHeight: '40px'
                    }}
                  >
                    ✓ Goede fit
                  </button>
                  <button
                    onClick={() => handleKwalificatie(false)}
                    style={{
                      flex: 1, padding: '0.65rem',
                      background: salesData.kwalificatie === false ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${salesData.kwalificatie === false ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: salesData.kwalificatie === false ? '#ef4444' : 'rgba(255,255,255,0.4)',
                      fontSize: '0.8rem', fontWeight: '700',
                      cursor: 'pointer', fontFamily: 'inherit',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease', minHeight: '40px'
                    }}
                  >
                    ✕ Niet geschikt
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* REPLY COUNTER */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={16} color={replyCount > 0 ? '#D4AF37' : 'rgba(255,255,255,0.4)'} />
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Reacties</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: replyCount > 0 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${replyCount > 0 ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px', padding: '0.25rem'
            }}>
              <button onClick={() => handleReplyChange(-1)} disabled={replyCount <= 0 || updatingReply} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: replyCount > 0 ? '#D4AF37' : 'rgba(255,255,255,0.3)', cursor: replyCount > 0 ? 'pointer' : 'not-allowed', borderRadius: '6px' }}>
                <Minus size={14} />
              </button>
              <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '1rem', fontWeight: '700', color: replyCount > 0 ? '#D4AF37' : 'rgba(255,255,255,0.4)' }}>
                {replyCount}
              </span>
              <button onClick={() => handleReplyChange(1)} disabled={updatingReply} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#D4AF37', cursor: 'pointer', borderRadius: '6px' }}>
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
          flexShrink: 0
        }}>
          <button onClick={handleContactedTodayToggle} disabled={updatingContacted} style={{
            flex: 1, minWidth: '140px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: contactedToday ? 'rgba(107, 114, 128, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${contactedToday ? 'rgba(107, 114, 128, 0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '10px',
            color: contactedToday ? '#9ca3af' : 'rgba(255,255,255,0.7)',
            fontSize: '0.85rem', fontWeight: '600',
            cursor: updatingContacted ? 'wait' : 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '48px'
          }}>
            {contactedToday ? <CheckCircle size={18} /> : <Circle size={18} />}
            Vandaag Gehad
          </button>

          {onSnooze && (
            <button onClick={handleSnooze} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '10px', color: '#fbbf24',
              fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '48px'
            }}>
              <Clock size={18} />
              Later
            </button>
          )}

          <button onClick={handleDelete} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px', color: '#ef4444',
            fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '48px'
          }}>
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none'
}
