// src/modules/lead-management/components/kanban/SalesCallModal.jsx
// Sales Call Modal — rapport invullen + client aanmaken
// Opent wanneer lead in "Sales Call" sectie zit

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, PhoneCall, Target, AlertCircle, Zap, Heart, Flag,
  CheckCircle, XCircle, UserPlus, Copy, ExternalLink, Loader
} from 'lucide-react'

const C = {
  gold: '#FFD700',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
  orange: '#f97316',
  text: '#fff',
  text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)',
  text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)',
  borderSub: 'rgba(255,255,255,0.04)',
  bg: '#0a0a0a',
}

const SALES_FIELDS = [
  {
    key: 'doel',
    label: 'DOEL',
    placeholder: 'Wat wil hij bereiken? Concreet en in zijn eigen woorden.',
    icon: Target,
    color: C.green,
    prefillFrom: 'qual_goal'
  },
  {
    key: 'waarom_nu',
    label: 'WAAROM NU',
    placeholder: 'Wat is er veranderd? Waarom nu de stap zetten?',
    icon: Zap,
    color: C.gold,
    prefillFrom: null
  },
  {
    key: 'eerder_geprobeerd',
    label: 'EERDER GEPROBEERD',
    placeholder: 'Wat heeft hij al geprobeerd? Waarom stopte hij?',
    icon: AlertCircle,
    color: C.amber,
    prefillFrom: null
  },
  {
    key: 'weerstand',
    label: 'WEERSTAND',
    placeholder: 'Wat wil hij absoluut niet? Waar maakt hij bezwaar?',
    icon: XCircle,
    color: C.red,
    prefillFrom: null
  },
  {
    key: 'bereidheid',
    label: 'BEREIDHEID',
    placeholder: 'Wat is hij wél bereid te doen? Wat is zijn minimum?',
    icon: Heart,
    color: C.blue,
    prefillFrom: null
  },
  {
    key: 'belofte',
    label: 'MIJN BELOFTE',
    placeholder: 'Wat heb ik hem beloofd? Wat ga ik leveren?',
    icon: CheckCircle,
    color: '#a855f7',
    prefillFrom: null
  },
  {
    key: 'rode_vlaggen',
    label: 'RODE VLAGGEN',
    placeholder: 'Wat baart me zorgen? Waarom zou dit kunnen mislukken?',
    icon: Flag,
    color: C.orange,
    prefillFrom: null
  },
]

export default function SalesCallModal({ lead, db, coachId, isMobile, onClose, onLeadUpdate }) {
  const existingNotes = lead?.sales_call_notes || {}

  const [salesData, setSalesData] = useState({
    doel:              existingNotes.doel              || lead?.qual_goal || '',
    waarom_nu:         existingNotes.waarom_nu         || '',
    eerder_geprobeerd: existingNotes.eerder_geprobeerd || '',
    weerstand:         existingNotes.weerstand         || '',
    bereidheid:        existingNotes.bereidheid        || '',
    belofte:           existingNotes.belofte           || '',
    rode_vlaggen:      existingNotes.rode_vlaggen      || '',
    kwalificatie:      existingNotes.kwalificatie      ?? null,
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientCreated, setClientCreated] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const saveRef = useRef(null)

  // Inline contact velden — bewerkbaar in de modal
  const [contactData, setContactData] = useState({
    first_name: lead?.first_name || '',
    last_name:  lead?.last_name  || '',
    email:      lead?.email      || '',
    phone:      lead?.phone      || '',
  })

  const effectiveEmail     = contactData.email.trim()      || ''
  const effectiveFirstName = contactData.first_name.trim() || ''

  const handleContactChange = (field, value) => {
    setContactData(prev => ({ ...prev, [field]: value }))
    if (saveRef.current) clearTimeout(saveRef.current)
    saveRef.current = setTimeout(async () => {
      try {
        await db.supabase
          .from('call_leads')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('id', lead.id)
        console.log(`✅ Contact veld opgeslagen: ${field} = ${value}`)
      } catch (e) { console.error('❌ Contact save failed:', e) }
    }, 800)
  }

  // Auto-save rapport velden
  const handleChange = (field, value) => {
    const updated = { ...salesData, [field]: value }
    setSalesData(updated)
    if (saveRef.current) clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => autoSave(updated), 800)
  }

  const autoSave = async (data) => {
    if (!db || !lead?.id) return
    setSaving(true)
    console.log('💾 Auto-save sales_call_notes:', data)
    try {
      const { error } = await db.supabase
        .from('call_leads')
        .update({ sales_call_notes: data, updated_at: new Date().toISOString() })
        .eq('id', lead.id)
      if (error) throw error
      console.log('✅ Sales call notes opgeslagen')
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error('❌ Sales call auto-save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleKwalificatie = async (value) => {
    const updated = { ...salesData, kwalificatie: value }
    setSalesData(updated)
    await autoSave(updated)
  }

  // Client aanmaken
  const handleCreateClient = async () => {
    console.log('🟡 handleCreateClient aangeroepen')
    console.log('   effectiveEmail:', effectiveEmail)
    console.log('   effectiveFirstName:', effectiveFirstName)
    console.log('   canCreateClient:', canCreateClient)
    console.log('   creatingClient:', creatingClient)
    console.log('   db:', !!db)

    if (!effectiveEmail || !effectiveFirstName || !db || creatingClient) {
      console.warn('❌ Guard geblokkeerd — ontbrekende data of al bezig')
      return
    }
    setCreatingClient(true)
    setError(null)
    try {
      console.log('💾 Sales call notes opslaan...')
      await autoSave(salesData)

      console.log('👤 Client aanmaken met:', { email: effectiveEmail, first_name: effectiveFirstName })
      const result = await db.createClient({
        email:      effectiveEmail,
        first_name: effectiveFirstName,
        last_name:  contactData.last_name  || lead?.last_name  || '',
        phone:      contactData.phone      || lead?.phone      || '',
        primary_goal: salesData.doel || lead.qual_goal || null,
        motivation: salesData.doel || null,
        biggest_obstacle: salesData.weerstand || lead.qual_pain || null,
        coaching_expectations: salesData.belofte || null,
        previous_coaching: salesData.eerder_geprobeerd || null,
        sales_call_notes: salesData,
      }, coachId)

      console.log('✅ createClient result:', result)

      if (result.success) {
        console.log('🔄 Lead markeren als geconverteerd...')
        await db.supabase
          .from('call_leads')
          .update({
            status: 'converted',
            conversion_date: new Date().toISOString().split('T')[0],
            sales_call_notes: salesData,
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id)

        console.log('🎉 Client succesvol aangemaakt!')
        setClientCreated(result)
        if (onLeadUpdate) onLeadUpdate()
      } else {
        console.warn('⚠️ createClient returned success: false', result)
      }
    } catch (e) {
      console.error('❌ Create client failed:', e)
      setError(e.message || 'Er ging iets mis. Probeer opnieuw.')
    } finally {
      setCreatingClient(false)
    }
  }

  const filledCount = SALES_FIELDS.filter(f => salesData[f.key]?.trim()).length
  const canCreateClient = !!effectiveEmail && !!effectiveFirstName && salesData.kwalificatie === true
  const missingFields = salesData.kwalificatie === true ? [
    !effectiveEmail     && 'Email is verplicht',
    !effectiveFirstName && 'Voornaam is verplicht',
  ].filter(Boolean) : []

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '0' : '1.5rem',
        zIndex: 10000
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '560px',
          height: isMobile ? '100dvh' : 'auto',
          maxHeight: isMobile ? '100dvh' : '92vh',
          background: C.bg,
          border: `1px solid rgba(255,215,0,0.2)`,
          borderRadius: isMobile ? '0' : '16px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PhoneCall size={16} color={C.gold} />
            <div>
              <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.gold, lineHeight: 1 }}>
                Sales Call
              </div>
              <div style={{ fontSize: '0.5rem', color: C.text25, marginTop: '0.1rem' }}>
                {lead.first_name} {lead.last_name}
                {lead.email && ` · ${lead.email}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.45rem', color: saving ? C.gold : saved ? C.green : C.text15, fontWeight: 600, transition: 'color 0.2s' }}>
              {saving ? 'Opslaan...' : saved ? '✓ Opgeslagen' : `${filledCount}/${SALES_FIELDS.length} ingevuld`}
            </span>
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: '8px', color: C.text50, cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* SUCCESS STATE */}
          {clientCreated && (
            <div style={{ padding: isMobile ? '1.5rem 1rem' : '2rem 1.25rem', textAlign: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <CheckCircle size={24} color={C.green} />
              </div>
              <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: C.green, marginBottom: '0.4rem' }}>
                Client aangemaakt!
              </div>
              <div style={{ fontSize: '0.65rem', color: C.text50, marginBottom: '1.5rem', lineHeight: 1.5 }}>
                {lead.first_name} is nu een actieve client in het systeem.
              </div>

              {/* Login credentials */}
              {clientCreated.loginCredentials && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  borderRadius: '10px', overflow: 'hidden',
                  marginBottom: '1.25rem', textAlign: 'left'
                }}>
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
                    <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>INLOGGEGEVENS</span>
                  </div>
                  {[
                    { label: 'EMAIL', value: clientCreated.loginCredentials.email },
                    { label: 'WACHTWOORD', value: clientCreated.loginCredentials.password },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem', borderBottom: `1px solid ${C.borderSub}`
                    }}>
                      <span style={{ fontSize: '0.45rem', color: C.text25, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.gold, fontFamily: 'monospace' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    const creds = clientCreated.loginCredentials
                    navigator.clipboard.writeText(`Email: ${creds.email}\nWachtwoord: ${creds.password}`)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  style={{
                    width: '100%', padding: '0.65rem',
                    background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)',
                    borderRadius: '8px', color: C.gold,
                    fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <Copy size={14} />
                  {copied ? 'Gekopieerd!' : 'Kopieer inloggegevens'}
                </button>
                <button
                  onClick={() => { window.location.hash = '#clients' }}
                  style={{
                    width: '100%', padding: '0.65rem',
                    background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                    border: 'none', borderRadius: '8px', color: '#000',
                    fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <ExternalLink size={14} />
                  Ga naar clients
                </button>
              </div>
            </div>
          )}

          {/* CONTACT VELDEN */}
          {!clientCreated && (
            <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0.625rem 0.75rem' }}>
              <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                CONTACTGEGEVENS
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <input
                  type="text"
                  placeholder="Voornaam *"
                  value={contactData.first_name}
                  onChange={e => handleContactChange('first_name', e.target.value)}
                  style={{
                    flex: 1, padding: '0.45rem 0.6rem',
                    background: contactData.first_name ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${contactData.first_name ? 'rgba(255,215,0,0.25)' : C.border}`,
                    borderRadius: '6px', color: contactData.first_name ? C.text : C.text25,
                    fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none',
                    minHeight: '36px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Achternaam"
                  value={contactData.last_name}
                  onChange={e => handleContactChange('last_name', e.target.value)}
                  style={{
                    flex: 1, padding: '0.45rem 0.6rem',
                    background: contactData.last_name ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${contactData.last_name ? 'rgba(255,215,0,0.15)' : C.border}`,
                    borderRadius: '6px', color: contactData.last_name ? C.text : C.text25,
                    fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none',
                    minHeight: '36px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="email"
                  placeholder="Email *"
                  value={contactData.email}
                  onChange={e => handleContactChange('email', e.target.value)}
                  style={{
                    flex: 1, padding: '0.45rem 0.6rem',
                    background: contactData.email ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${contactData.email ? 'rgba(255,215,0,0.25)' : C.border}`,
                    borderRadius: '6px', color: contactData.email ? C.text : C.text25,
                    fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none',
                    minHeight: '36px'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Telefoon"
                  value={contactData.phone}
                  onChange={e => handleContactChange('phone', e.target.value)}
                  style={{
                    flex: 1, padding: '0.45rem 0.6rem',
                    background: contactData.phone ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${contactData.phone ? 'rgba(255,215,0,0.15)' : C.border}`,
                    borderRadius: '6px', color: contactData.phone ? C.text : C.text25,
                    fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none',
                    minHeight: '36px'
                  }}
                />
              </div>
            </div>
          )}

          {/* NORMAL STATE */}
          {!clientCreated && (
            <>
              {/* Sales call rapport velden */}
              {SALES_FIELDS.map(field => {
                const Icon = field.icon
                const value = salesData[field.key]
                return (
                  <div key={field.key} style={{ borderBottom: `1px solid ${C.borderSub}` }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 0.75rem 0.15rem',
                    }}>
                      <Icon size={11} color={field.color} />
                      <span style={{ fontSize: '0.4rem', fontWeight: 700, color: field.color, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8 }}>
                        {field.label}
                      </span>
                    </div>
                    <textarea
                      value={value || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.3rem 0.75rem 0.6rem',
                        background: 'transparent',
                        border: 'none',
                        color: value ? C.text : C.text25,
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: value ? 600 : 400,
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'none',
                        lineHeight: 1.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )
              })}

              {/* Kwalificatie */}
              <div style={{ padding: '0.75rem', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  KWALIFICATIE
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleKwalificatie(true)}
                    style={{
                      flex: 1, padding: '0.65rem',
                      background: salesData.kwalificatie === true ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${salesData.kwalificatie === true ? 'rgba(16,185,129,0.35)' : C.border}`,
                      borderRadius: '8px',
                      color: salesData.kwalificatie === true ? C.green : C.text25,
                      fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease', minHeight: '44px'
                    }}
                  >
                    ✓ Goede fit
                  </button>
                  <button
                    onClick={() => handleKwalificatie(false)}
                    style={{
                      flex: 1, padding: '0.65rem',
                      background: salesData.kwalificatie === false ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${salesData.kwalificatie === false ? 'rgba(239,68,68,0.35)' : C.border}`,
                      borderRadius: '8px',
                      color: salesData.kwalificatie === false ? C.red : C.text25,
                      fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease', minHeight: '44px'
                    }}
                  >
                    ✕ Niet geschikt
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderBottom: `1px solid rgba(239,68,68,0.2)` }}>
                  <span style={{ fontSize: '0.6rem', color: C.red, fontWeight: 600 }}>{error}</span>
                </div>
              )}

              {/* Client aanmaken */}
              <div style={{ padding: '0.75rem' }}>
                {salesData.kwalificatie === true ? (
                  <>
                    {/* Ontbrekende velden melding */}
                    {missingFields.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        {missingFields.map((msg, i) => (
                          <div key={i} style={{ fontSize: '0.55rem', color: C.amber, fontWeight: 600, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ color: C.red }}>✕</span> {msg}
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={handleCreateClient}
                      disabled={creatingClient || !canCreateClient}
                      style={{
                        width: '100%', padding: isMobile ? '0.85rem' : '0.9rem',
                        background: (creatingClient || !canCreateClient) ? 'rgba(255,215,0,0.2)' : 'linear-gradient(90deg, #FFD700, #FFA500)',
                        border: 'none', borderRadius: '10px',
                        color: (creatingClient || !canCreateClient) ? 'rgba(0,0,0,0.4)' : '#000',
                        fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 800,
                        cursor: (creatingClient || !canCreateClient) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.2s ease', minHeight: '48px'
                      }}
                    >
                      {creatingClient ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Aanmaken...</> : <><UserPlus size={16} /> Client aanmaken</>}
                    </button>
                  </>
                ) : (
                  <div style={{
                    padding: '0.65rem 0.75rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${C.border}`,
                    borderRadius: '10px', textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.6rem', color: C.text25, fontWeight: 600 }}>
                      {salesData.kwalificatie === false
                        ? 'Lead is niet geschikt — geen client aanmaken'
                        : 'Markeer als "Goede fit" om een client aan te maken'}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ height: '1rem' }} />
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>,
    document.body
  )
}
