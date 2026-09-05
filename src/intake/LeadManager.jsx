// src/intake/LeadManager.jsx
// Standalone Lead Management Dashboard — later integreren in CoachHub
import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Phone, Mail, Calendar, MessageCircle,
  ChevronDown, ChevronRight, Search, Filter, RefreshCw,
  Clock, CheckCircle, XCircle, AlertCircle, Star, Eye,
  ArrowRight, MoreVertical, X, Send, StickyNote, Trash2
} from 'lucide-react'
import IntakeService from './IntakeService'
import { geledenLang } from '../utils/tijd'

const isMobile = window.innerWidth <= 768

// ── Status config ──
const STATUSES = [
  { key: 'new', label: 'Nieuw', color: '#3b82f6', icon: UserPlus, emoji: '🔵' },
  { key: 'contacted', label: 'Gecontacteerd', color: '#f59e0b', icon: Phone, emoji: '📞' },
  { key: 'scheduled', label: 'Ingepland', color: '#8b5cf6', icon: Calendar, emoji: '📅' },
  { key: 'converted', label: 'Geconverteerd', color: '#10b981', icon: CheckCircle, emoji: '✅' },
  { key: 'lost', label: 'Verloren', color: '#ef4444', icon: XCircle, emoji: '❌' }
]

const getStatus = (key) => STATUSES.find(s => s.key === key) || STATUSES[0]

// ── Time ago helper ──
export default function LeadManager() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // ── Load leads ──
  const loadLeads = useCallback(async () => {
    try {
      const data = await IntakeService.getSubmissions()
      setLeads(data)
    } catch (err) {
      console.error('Failed to load leads:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  const refresh = () => { setRefreshing(true); loadLeads() }

  // ── Filter & search ──
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

  // ── Stats ──
  const stats = STATUSES.map(s => ({
    ...s,
    count: leads.filter(l => l.status === s.key).length
  }))

  // ── Update lead status ──
  const updateStatus = async (id, newStatus) => {
    try {
      await IntakeService.updateStatus(id, newStatus)
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
      if (selectedLead?.id === id) setSelectedLead(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  // ── Delete lead ──
  const deleteLead = async (id) => {
    try {
      await IntakeService.deleteSubmission(id)
      setLeads(prev => prev.filter(l => l.id !== id))
      setSelectedLead(null)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <RefreshCw size={24} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#000', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: isMobile ? '1rem' : '1.5rem 2rem'
    }}>

      {/* ══════ HEADER ══════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem'
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: '900',
            margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Users size={isMobile ? 22 : 26} color="#10b981" />
            Lead Management
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} totaal
          </p>
        </div>
        <button onClick={refresh} style={{
          padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px',
          color: '#10b981', fontSize: '0.8rem', fontWeight: '600',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
          touchAction: 'manipulation'
        }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Ververs
        </button>
      </div>

      {/* ══════ STAT CARDS ══════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {stats.map(s => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? 'all' : s.key)} style={{
            padding: isMobile ? '0.65rem 0.5rem' : '0.75rem',
            background: filter === s.key ? `${s.color}15` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${filter === s.key ? s.color + '40' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
            transition: 'all 0.2s ease', touchAction: 'manipulation'
          }}>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '900', color: s.color }}>{s.count}</div>
            <div style={{ fontSize: isMobile ? '0.6rem' : '0.68rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* ══════ SEARCH BAR ══════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
        marginBottom: '1rem'
      }}>
        <Search size={16} color="rgba(255,255,255,0.3)" />
        <input
          type="text" placeholder="Zoek op naam, email, telefoon..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: '#fff', fontSize: '0.85rem', outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        {(search || filter !== 'all') && (
          <button onClick={() => { setSearch(''); setFilter('all') }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px'
          }}>
            <X size={14} color="rgba(255,255,255,0.4)" />
          </button>
        )}
      </div>

      {/* ══════ ACTIVE FILTER ══════ */}
      {filter !== 'all' && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.35rem 0.75rem', background: `${getStatus(filter).color}15`,
          border: `1px solid ${getStatus(filter).color}30`, borderRadius: '6px',
          marginBottom: '1rem', fontSize: '0.75rem', fontWeight: '600', color: getStatus(filter).color
        }}>
          {getStatus(filter).emoji} {getStatus(filter).label}
          <button onClick={() => setFilter('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.25rem' }}>
            <X size={12} color={getStatus(filter).color} />
          </button>
        </div>
      )}

      {/* ══════ LEAD LIST ══════ */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.3)' }}>
          <Users size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            {search ? 'Geen resultaten gevonden' : 'Nog geen leads'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(lead => {
            const st = getStatus(lead.status)
            const Icon = st.icon
            return (
              <div key={lead.id} onClick={() => setSelectedLead(lead)} style={{
                padding: isMobile ? '0.85rem' : '1rem 1.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', cursor: 'pointer',
                transition: 'all 0.2s ease', touchAction: 'manipulation',
                borderLeft: `3px solid ${st.color}`
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: `${st.color}15`, border: `1px solid ${st.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={14} color={st.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: '700', color: '#fff' }}>{lead.contact_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{geledenLang(lead.created_at)}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                </div>

                {/* Quick info row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {lead.goal && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: '600', padding: '0.2rem 0.5rem',
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '4px', color: '#10b981'
                    }}>{lead.goal}</span>
                  )}
                  {lead.budget && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: '600', padding: '0.2rem 0.5rem',
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '4px', color: '#f59e0b'
                    }}>{lead.budget}</span>
                  )}
                  {lead.commitment === 'Ja! Ik ben ready!' && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: '600', padding: '0.2rem 0.5rem',
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '4px', color: '#10b981'
                    }}>🔥 Ready</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════ LEAD DETAIL MODAL ══════ */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={updateStatus}
          onDelete={deleteLead}
          onRefresh={loadLeads}
        />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}


// ══════════════════════════════════════
// LEAD DETAIL MODAL
// ══════════════════════════════════════
function LeadDetailModal({ lead, onClose, onStatusChange, onDelete, onRefresh }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const st = getStatus(lead.status)

  const saveNotes = async () => {
    setSaving(true)
    try {
      await IntakeService.updateStatus(lead.id, lead.status, notes)
    } catch (err) {
      console.error('Save notes failed:', err)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(lead.id)
    } catch (err) {
      console.error('Delete failed:', err)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const whatsappLink = `https://wa.me/31${lead.contact_phone?.replace(/^0/, '').replace(/\s/g, '')}`

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', zIndex: 10000, padding: isMobile ? '0' : '2rem'
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '600px',
        maxHeight: isMobile ? '92vh' : '85vh',
        background: '#111', borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: `${st.color}15`, border: `2px solid ${st.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: '800', color: st.color
            }}>{lead.contact_name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#fff' }}>{lead.contact_name}</h2>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>{geledenLang(lead.created_at)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}><X size={16} color="rgba(255,255,255,0.5)" /></button>
        </div>

        {/* Content — Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, padding: '0.65rem', background: 'rgba(37,211,102,0.1)',
              border: '1px solid rgba(37,211,102,0.3)', borderRadius: '8px',
              color: '#25D366', fontSize: '0.75rem', fontWeight: '700',
              textDecoration: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.4rem', touchAction: 'manipulation'
            }}>
              <MessageCircle size={14} /> WhatsApp
            </a>
            {lead.contact_phone && (
              <a href={`tel:+31${lead.contact_phone.replace(/^0/, '')}`} style={{
                flex: 1, padding: '0.65rem', background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px',
                color: '#3b82f6', fontSize: '0.75rem', fontWeight: '700',
                textDecoration: 'none', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.4rem', touchAction: 'manipulation'
              }}>
                <Phone size={14} /> Bellen
              </a>
            )}
            {lead.contact_email && (
              <a href={`mailto:${lead.contact_email}`} style={{
                flex: 1, padding: '0.65rem', background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px',
                color: '#8b5cf6', fontSize: '0.75rem', fontWeight: '700',
                textDecoration: 'none', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.4rem', touchAction: 'manipulation'
              }}>
                <Mail size={14} /> Email
              </a>
            )}
          </div>

          {/* Status Pipeline */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>STATUS</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s.key} onClick={() => onStatusChange(lead.id, s.key)} style={{
                  padding: '0.45rem 0.75rem',
                  background: lead.status === s.key ? `${s.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${lead.status === s.key ? s.color : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem',
                  fontWeight: '700', color: lead.status === s.key ? s.color : 'rgba(255,255,255,0.4)',
                  touchAction: 'manipulation', transition: 'all 0.2s ease'
                }}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>CONTACT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {lead.contact_phone && <InfoRow icon={Phone} label="Telefoon" value={`+31 ${lead.contact_phone}`} />}
              {lead.contact_email && <InfoRow icon={Mail} label="Email" value={lead.contact_email} />}
            </div>
          </div>

          {/* Intake Answers */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>INTAKE ANTWOORDEN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {lead.goal && <InfoRow label="Doel" value={lead.goal} color="#10b981" />}
              {lead.age_range && <InfoRow label="Leeftijd" value={lead.age_range} />}
              {lead.goal_description && <InfoRow label="Doel beschrijving" value={lead.goal_description} long />}
              {lead.obstacle && <InfoRow label="Obstakel" value={lead.obstacle} long />}
              {lead.urgency && <InfoRow label="Urgentie" value={lead.urgency} />}
              {lead.budget && <InfoRow label="Budget" value={lead.budget} color="#f59e0b" />}
              {lead.commitment && <InfoRow label="Commitment" value={lead.commitment} color={lead.commitment?.includes('Ja') ? '#10b981' : '#ef4444'} />}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <StickyNote size={12} /> NOTITIES
            </div>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Voeg notities toe..."
              rows={3}
              style={{
                width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                color: '#fff', fontSize: '0.82rem', fontFamily: 'inherit',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                lineHeight: 1.5
              }}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button onClick={saveNotes} disabled={saving} style={{
              marginTop: '0.5rem', padding: '0.5rem 1rem',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '6px', color: '#10b981', fontSize: '0.75rem',
              fontWeight: '700', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '0.3rem', touchAction: 'manipulation'
            }}>
              <Send size={12} /> {saving ? 'Opslaan...' : 'Notities opslaan'}
            </button>
          </div>

          {/* ══════ DELETE SECTION ══════ */}
          <div style={{
            padding: '1rem', background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(239,68,68,0.5)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              GEVARENZONE
            </div>

            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{
                width: '100%', padding: '0.65rem', background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px',
                color: '#ef4444', fontSize: '0.78rem', fontWeight: '700',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.4rem', touchAction: 'manipulation',
                transition: 'all 0.2s ease', minHeight: '44px'
              }}
                onTouchStart={e => { if (isMobile) e.currentTarget.style.transform = 'scale(0.98)' }}
                onTouchEnd={e => { if (isMobile) e.currentTarget.style.transform = 'scale(1)' }}
              >
                <Trash2 size={14} /> Lead verwijderen
              </button>
            ) : (
              <div>
                <p style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: '600', margin: '0 0 0.75rem' }}>
                  Weet je zeker dat je {lead.contact_name} wilt verwijderen? Dit kan niet ongedaan worden.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleDelete} disabled={deleting} style={{
                    flex: 1, padding: '0.65rem', background: '#ef4444',
                    border: 'none', borderRadius: '8px', color: '#fff',
                    fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.4rem', touchAction: 'manipulation', minHeight: '44px',
                    opacity: deleting ? 0.6 : 1
                  }}
                    onTouchStart={e => { if (isMobile) e.currentTarget.style.transform = 'scale(0.98)' }}
                    onTouchEnd={e => { if (isMobile) e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    <Trash2 size={14} /> {deleting ? 'Verwijderen...' : 'Ja, verwijder'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={{
                    flex: 1, padding: '0.65rem', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                    color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: '700',
                    cursor: 'pointer', touchAction: 'manipulation', minHeight: '44px'
                  }}
                    onTouchStart={e => { if (isMobile) e.currentTarget.style.transform = 'scale(0.98)' }}
                    onTouchEnd={e => { if (isMobile) e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    Annuleer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Info Row component ──
function InfoRow({ icon: Icon, label, value, color, long }) {
  return (
    <div style={{
      padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
      display: long ? 'block' : 'flex',
      alignItems: long ? undefined : 'center',
      justifyContent: long ? undefined : 'space-between', gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: long ? '0.3rem' : 0 }}>
        {Icon && <Icon size={12} color="rgba(255,255,255,0.25)" />}
        <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      </div>
      <span style={{
        fontSize: long ? '0.78rem' : '0.8rem',
        fontWeight: '600',
        color: color || 'rgba(255,255,255,0.7)',
        lineHeight: 1.4
      }}>{value}</span>
    </div>
  )
}
