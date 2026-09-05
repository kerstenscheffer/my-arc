// src/modules/lead-management/components/IntakeTab.jsx
// Intake Submissions tab — embedded in LeadManagement gold-black theme
import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Phone, Mail, Calendar, MessageCircle,
  Search, RefreshCw, CheckCircle, XCircle, X, Send,
  StickyNote, ChevronRight, Clock, Zap, AlertTriangle,
  DollarSign, Target, Heart
} from 'lucide-react'
import IntakeService from '../../../intake/IntakeService'
import { geledenLang } from '../../../utils/tijd'

// GOLD-BLACK THEME (matches parent)
const GOLD = {
  primary: '#D4AF37',
  light: '#FFD700',
  dark: '#B8860B',
  glow: 'rgba(212, 175, 55, 0.3)',
  border: 'rgba(212, 175, 55, 0.3)',
  borderStrong: 'rgba(212, 175, 55, 0.5)',
  bg: 'rgba(212, 175, 55, 0.08)',
  bgStrong: 'rgba(212, 175, 55, 0.15)',
  text: '#FFD700',
  textMuted: 'rgba(212, 175, 55, 0.7)'
}

const STATUSES = [
  { key: 'new', label: 'Nieuw', color: '#3b82f6', icon: UserPlus, emoji: '🔵' },
  { key: 'contacted', label: 'Gecontacteerd', color: '#f59e0b', icon: Phone, emoji: '📞' },
  { key: 'scheduled', label: 'Ingepland', color: '#8b5cf6', icon: Calendar, emoji: '📅' },
  { key: 'converted', label: 'Geconverteerd', color: '#10b981', icon: CheckCircle, emoji: '✅' },
  { key: 'lost', label: 'Verloren', color: '#ef4444', icon: XCircle, emoji: '❌' }
]

const getStatus = (key) => STATUSES.find(s => s.key === key) || STATUSES[0]

export default function IntakeTab({ isMobile }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadLeads = useCallback(async () => {
    try {
      const data = await IntakeService.getSubmissions()
      setLeads(data)
    } catch (err) {
      console.error('Failed to load intake leads:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  const refresh = () => { setRefreshing(true); loadLeads() }

  const filtered = leads.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        l.contact_name?.toLowerCase().includes(q) ||
        l.contact_email?.toLowerCase().includes(q) ||
        l.contact_phone?.includes(q) ||
        l.goal?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const stats = STATUSES.map(s => ({
    ...s,
    count: leads.filter(l => l.status === s.key).length
  }))

  const updateStatus = async (id, newStatus) => {
    try {
      await IntakeService.updateStatus(id, newStatus)
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
      if (selectedLead?.id === id) setSelectedLead(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  const deleteLead = async (id) => {
    if (!window.confirm('Weet je zeker dat je deze intake wilt verwijderen?')) return
    try {
      await IntakeService.deleteSubmission(id)
      setLeads(prev => prev.filter(l => l.id !== id))
      if (selectedLead?.id === id) setSelectedLead(null)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${GOLD.bg}`,
          borderTopColor: GOLD.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div>
      {/* ══════ STAT CARDS ══════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: '1.25rem'
      }}>
        {stats.map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
            style={{
              padding: isMobile ? '0.75rem 0.5rem' : '0.85rem',
              background: filter === s.key
                ? `${s.color}15`
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === s.key ? s.color + '40' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <div style={{
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '900',
              color: s.color
            }}>
              {s.count}
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.72rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '0.15rem'
            }}>
              {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* ══════ SEARCH + REFRESH ══════ */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1rem',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: '12px'
        }}>
          <Search size={16} color={GOLD.textMuted} />
          <input
            type="text"
            placeholder="Zoek op naam, email, telefoon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          {(search || filter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                touchAction: 'manipulation'
              }}
            >
              <X size={14} color="rgba(255,255,255,0.4)" />
            </button>
          )}
        </div>

        <button
          onClick={refresh}
          style={{
            padding: '0.65rem 0.85rem',
            background: GOLD.bg,
            border: `1px solid ${GOLD.border}`,
            borderRadius: '12px',
            color: GOLD.primary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={14} style={{
            animation: refreshing ? 'spin 1s linear infinite' : 'none'
          }} />
          {!isMobile && 'Ververs'}
        </button>
      </div>

      {/* ══════ ACTIVE FILTER BADGE ══════ */}
      {filter !== 'all' && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          background: `${getStatus(filter).color}15`,
          border: `1px solid ${getStatus(filter).color}30`,
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: getStatus(filter).color
        }}>
          {getStatus(filter).emoji} {getStatus(filter).label}
          <button
            onClick={() => setFilter('all')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.25rem', touchAction: 'manipulation' }}
          >
            <X size={12} color={getStatus(filter).color} />
          </button>
        </div>
      )}

      {/* ══════ LEAD LIST ══════ */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <Users size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>
            {search ? 'Geen resultaten gevonden' : 'Nog geen intake submissions'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(lead => {
            const st = getStatus(lead.status)
            const Icon = st.icon
            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                style={{
                  padding: isMobile ? '0.9rem' : '1rem 1.25rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  borderLeft: `3px solid ${st.color}`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = `rgba(255,255,255,0.1)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: `${st.color}12`,
                      border: `1.5px solid ${st.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={15} color={st.color} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        fontWeight: '700',
                        color: '#fff'
                      }}>
                        {lead.contact_name}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <Clock size={10} />
                        {geledenLang(lead.created_at)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="rgba(255,255,255,0.15)" />
                </div>

                {/* Quick tags */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                  marginTop: '0.4rem',
                  paddingLeft: isMobile ? '0' : '2.85rem'
                }}>
                  {lead.goal && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.5rem',
                      background: GOLD.bg,
                      border: `1px solid ${GOLD.border}`,
                      borderRadius: '6px',
                      color: GOLD.primary
                    }}>
                      <Target size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                      {lead.goal}
                    </span>
                  )}
                  {lead.budget && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.5rem',
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '6px',
                      color: '#f59e0b'
                    }}>
                      <DollarSign size={9} style={{ marginRight: '2px', verticalAlign: 'middle' }} />
                      {lead.budget}
                    </span>
                  )}
                  {lead.commitment?.includes('Ja') && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.5rem',
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '6px',
                      color: '#10b981'
                    }}>
                      🔥 Ready
                    </span>
                  )}
                  {lead.urgency && lead.urgency.includes('Direct') && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.5rem',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '6px',
                      color: '#ef4444'
                    }}>
                      <Zap size={9} style={{ marginRight: '2px', verticalAlign: 'middle' }} />
                      Urgent
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════ DETAIL MODAL ══════ */}
      {selectedLead && (
        <IntakeDetailModal
          lead={selectedLead}
          isMobile={isMobile}
          onClose={() => setSelectedLead(null)}
          onStatusChange={updateStatus}
          onDelete={deleteLead}
          onRefresh={loadLeads}
        />
      )}
    </div>
  )
}


// ══════════════════════════════════════
// INTAKE DETAIL MODAL — Gold-Black theme
// ══════════════════════════════════════
function IntakeDetailModal({ lead, isMobile, onClose, onStatusChange, onDelete, onRefresh }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [saving, setSaving] = useState(false)
  const st = getStatus(lead.status)

  const saveNotes = async () => {
    setSaving(true)
    try {
      await IntakeService.updateStatus(lead.id, lead.status, notes)
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Save notes failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const phoneClean = lead.contact_phone?.replace(/^0/, '').replace(/\s/g, '')
  const whatsappLink = `https://wa.me/31${phoneClean}`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '0' : '2rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: isMobile ? '92vh' : '85vh',
          background: '#0a0a0a',
          borderRadius: isMobile ? '20px 20px 0 0' : '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${GOLD.border}`,
          boxShadow: `0 0 40px ${GOLD.glow}`
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem',
          borderBottom: `1px solid ${GOLD.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: GOLD.bg
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: `${st.color}15`,
              border: `2px solid ${st.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: '900',
              color: st.color
            }}>
              {lead.contact_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 style={{
                fontSize: '1.1rem',
                fontWeight: '800',
                margin: 0,
                color: '#fff'
              }}>
                {lead.contact_name}
              </h2>
              <div style={{
                fontSize: '0.7rem',
                color: GOLD.textMuted,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Clock size={10} />
                {geledenLang(lead.created_at)}
                <span style={{ margin: '0 0.25rem', opacity: 0.4 }}>•</span>
                <span style={{ color: st.color }}>{st.label}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${GOLD.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <X size={16} color={GOLD.textMuted} />
          </button>
        </div>

        {/* Content — Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem'
        }}>
          {/* Quick Actions */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '0.7rem',
                background: 'rgba(37,211,102,0.08)',
                border: '1px solid rgba(37,211,102,0.25)',
                borderRadius: '10px',
                color: '#25D366',
                fontSize: '0.78rem',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                touchAction: 'manipulation',
                minHeight: '44px',
                transition: 'all 0.2s ease'
              }}
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
            {lead.contact_phone && (
              <a
                href={`tel:+31${phoneClean}`}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: '10px',
                  color: '#3b82f6',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              >
                <Phone size={15} /> Bellen
              </a>
            )}
            {lead.contact_email && (
              <a
                href={`mailto:${lead.contact_email}`}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: '10px',
                  color: '#8b5cf6',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              >
                <Mail size={15} /> Email
              </a>
            )}
          </div>

          {/* Status Pipeline */}
          <SectionHeader icon={Zap} label="STATUS" />
          <div style={{
            display: 'flex',
            gap: '0.35rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem'
          }}>
            {STATUSES.map(s => (
              <button
                key={s.key}
                onClick={() => onStatusChange(lead.id, s.key)}
                style={{
                  padding: '0.5rem 0.8rem',
                  background: lead.status === s.key ? `${s.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${lead.status === s.key ? s.color + '50' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: lead.status === s.key ? s.color : 'rgba(255,255,255,0.4)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.2s ease',
                  minHeight: '38px'
                }}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>

          {/* Contact Info */}
          <SectionHeader icon={Users} label="CONTACT" />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            marginBottom: '1.5rem'
          }}>
            {lead.contact_phone && (
              <InfoRow icon={Phone} label="Telefoon" value={`+31 ${lead.contact_phone}`} />
            )}
            {lead.contact_email && (
              <InfoRow icon={Mail} label="Email" value={lead.contact_email} />
            )}
          </div>

          {/* Intake Answers */}
          <SectionHeader icon={Target} label="INTAKE ANTWOORDEN" />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            marginBottom: '1.5rem'
          }}>
            {lead.goal && <InfoRow label="Doel" value={lead.goal} color={GOLD.primary} />}
            {lead.age_range && <InfoRow label="Leeftijd" value={lead.age_range} />}
            {lead.goal_description && <InfoRow label="Doel beschrijving" value={lead.goal_description} long />}
            {lead.obstacle && <InfoRow label="Obstakel" value={lead.obstacle} long />}
            {lead.urgency && <InfoRow label="Urgentie" value={lead.urgency} color={lead.urgency.includes('Direct') ? '#ef4444' : undefined} />}
            {lead.budget && <InfoRow label="Budget" value={lead.budget} color="#f59e0b" />}
            {lead.commitment && (
              <InfoRow
                label="Commitment"
                value={lead.commitment}
                color={lead.commitment?.includes('Ja') ? '#10b981' : '#ef4444'}
              />
            )}
          </div>

          {/* Notes */}
          <SectionHeader icon={StickyNote} label="NOTITIES" />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Voeg notities toe over deze lead..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.5,
              transition: 'border-color 0.2s ease'
            }}
            onFocus={e => e.target.style.borderColor = GOLD.primary}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.75rem'
          }}>
            <button
              onClick={saveNotes}
              disabled={saving}
              style={{
                padding: '0.55rem 1rem',
                background: GOLD.bg,
                border: `1px solid ${GOLD.border}`,
                borderRadius: '8px',
                color: GOLD.primary,
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                touchAction: 'manipulation',
                minHeight: '40px',
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={13} /> {saving ? 'Opslaan...' : 'Notities opslaan'}
            </button>

            <button
              onClick={() => onDelete(lead.id)}
              style={{
                padding: '0.55rem 1rem',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                touchAction: 'manipulation',
                minHeight: '40px',
                marginLeft: 'auto',
                transition: 'all 0.2s ease'
              }}
            >
              <XCircle size={13} /> Verwijder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// ══════ HELPER COMPONENTS ══════
function SectionHeader({ icon: Icon, label }) {
  return (
    <div style={{
      fontSize: '0.68rem',
      fontWeight: '700',
      color: GOLD.textMuted,
      letterSpacing: '0.1em',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      textTransform: 'uppercase'
    }}>
      {Icon && <Icon size={12} color={GOLD.textMuted} />}
      {label}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, color, long }) {
  return (
    <div style={{
      padding: '0.6rem 0.85rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '10px',
      display: long ? 'block' : 'flex',
      alignItems: long ? undefined : 'center',
      justifyContent: long ? undefined : 'space-between',
      gap: '0.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        marginBottom: long ? '0.35rem' : 0
      }}>
        {Icon && <Icon size={12} color="rgba(255,255,255,0.2)" />}
        <span style={{
          fontSize: '0.7rem',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.35)'
        }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: long ? '0.8rem' : '0.82rem',
        fontWeight: '600',
        color: color || 'rgba(255,255,255,0.7)',
        lineHeight: 1.45
      }}>
        {value}
      </span>
    </div>
  )
}
