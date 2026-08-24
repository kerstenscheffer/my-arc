// src/client/pages/ClientProfile.jsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { User, MapPin, Settings, Globe, Shield, LogOut, Edit, Save, X, Target, ChevronRight, Trash2, AlertTriangle, Weight } from 'lucide-react'
import DatabaseService from '../../services/DatabaseService'
const db = DatabaseService

const GOLD = '#FFD700'
const GOLD_DIM = 'rgba(255,215,0,0.12)'
const GOLD_BORDER = 'rgba(255,215,0,0.15)'
const GOLD_BORDER_ACTIVE = 'rgba(255,215,0,0.3)'

export default function ClientProfile({ client, user, onClientUpdate }) {
  const isMobile = window.innerWidth <= 768
  const [activeSection, setActiveSection] = useState('persoonlijk')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    first_name: client?.first_name || '',
    last_name: client?.last_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    age: client?.age || '',
    height: client?.height || '',
    location: client?.location || '',
    gender: client?.gender || '',
    date_of_birth: client?.date_of_birth || '',
    current_weight: client?.current_weight || '',
  })

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        age: client.age || '',
        height: client.height || '',
        location: client.location || '',
        gender: client.gender || '',
        date_of_birth: client.date_of_birth || '',
        current_weight: client.current_weight || '',
      })
    }
  }, [client])

  const sections = [
    { id: 'persoonlijk', label: 'Persoonlijk', icon: User },
    { id: 'coach', label: 'Coach', icon: Target },
    { id: 'instellingen', label: 'Instellingen', icon: Settings }
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      console.log('💾 Saving client:', client.id, formData)
      const { data, error } = await db.supabase.from('clients').update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : null,
        height: formData.height ? parseInt(formData.height) : null,
        location: formData.location,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        current_weight: formData.current_weight ? parseFloat(formData.current_weight) : null,
        updated_at: new Date().toISOString()
      }).eq('id', client.id).select().single()
      console.log('✅ Result:', data)
      console.log('❌ Error:', error)
      if (error) throw error
      if (data && onClientUpdate) onClientUpdate(data)
      setIsEditing(false)
    } catch (error) {
      alert('Fout bij opslaan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await db.signOut()
    window.location.href = '/'
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'VERWIJDER') return
    setDeleting(true)
    try {
      await db.supabase.from('clients').update({
        deleted_at: new Date().toISOString()
      }).eq('id', client.id)
      await db.signOut()
      window.location.href = '/'
    } catch (error) {
      alert('Fout bij verwijderen: ' + error.message)
      setDeleting(false)
    }
  }

  const selectField = (label, value, key, options) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => setFormData({...formData, [key]: e.target.value})}
        disabled={!isEditing}
        style={{ width: '100%', padding: '0.7rem 0.875rem', background: isEditing ? 'rgba(255,255,255,0.04)' : 'transparent', border: `1px solid ${isEditing ? GOLD_BORDER_ACTIVE : GOLD_BORDER}`, borderRadius: '6px', color: value ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.875rem', fontWeight: '500', outline: 'none', boxSizing: 'border-box', appearance: isEditing ? 'auto' : 'none', WebkitAppearance: isEditing ? 'auto' : 'none' }}
      >
        <option value="">— niet ingesteld —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const readonlyField = (label, displayValue, note) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{label}</label>
      <div style={{ padding: '0.7rem 0.875rem', border: `1px solid ${GOLD_BORDER}`, borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', color: displayValue ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
        {displayValue || '—'}
      </div>
      {note && <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.25rem' }}>{note}</div>}
    </div>
  )

  const field = (label, value, key, type = 'text', disabled = false) => (
    <div>
      <label style={{
        display: 'block',
        fontSize: '0.7rem',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '0.4rem'
      }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setFormData({...formData, [key]: e.target.value})}
        disabled={!isEditing || disabled}
        style={{
          width: '100%',
          padding: '0.7rem 0.875rem',
          background: isEditing && !disabled ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: `1px solid ${isEditing && !disabled ? GOLD_BORDER_ACTIVE : GOLD_BORDER}`,
          borderRadius: '6px',
          color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
          fontSize: '0.875rem',
          fontWeight: '500',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '0.75rem' : '1rem', paddingBottom: isMobile ? '100px' : '2rem' }}>

      {/* Header card */}
      <div style={{
        background: '#111',
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: '10px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'relative'
      }}>
        {/* Avatar */}
        <div style={{
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          borderRadius: '50%',
          background: GOLD_DIM,
          border: `2px solid ${GOLD_BORDER_ACTIVE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <span style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '800', color: GOLD }}>
            {client?.first_name?.[0]}{client?.last_name?.[0]}
          </span>
        </div>

        {/* Name + info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
            {client?.first_name} {client?.last_name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500', marginTop: '0.1rem' }}>
            MY ARC Member
          </div>
          {client?.location && (
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={11} />
              {client.location}
            </div>
          )}
        </div>

        {/* Edit button */}
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} style={{
            padding: '0.5rem 0.875rem',
            background: GOLD_DIM,
            border: `1px solid ${GOLD_BORDER_ACTIVE}`,
            borderRadius: '6px',
            color: GOLD,
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}>
            <Edit size={14} />
            Bewerk
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '0.5rem 0.875rem',
              background: GOLD,
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              fontSize: '0.8rem',
              fontWeight: '800',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}>
              {saving ? '...' : <Save size={14} />}
            </button>
            <button onClick={() => setIsEditing(false)} style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: '#111',
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: '8px',
        padding: '3px',
        marginBottom: '1rem',
        gap: '2px'
      }}>
        {sections.map(s => {
          const Icon = s.icon
          const active = activeSection === s.id
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              flex: 1,
              padding: '0.5rem',
              background: active ? GOLD_DIM : 'transparent',
              border: active ? `1px solid ${GOLD_BORDER_ACTIVE}` : '1px solid transparent',
              borderRadius: '6px',
              color: active ? GOLD : 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              transition: 'all 0.15s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <Icon size={14} />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{
        background: '#111',
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: '10px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: '1rem'
      }}>

        {/* Persoonlijk */}
        {activeSection === 'persoonlijk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {field('Voornaam', formData.first_name, 'first_name')}
              {field('Achternaam', formData.last_name, 'last_name')}
            </div>
            {field('Email', formData.email, 'email', 'email', true)}
            {field('Telefoon', formData.phone, 'phone', 'tel')}
            {field('Locatie', formData.location, 'location')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {field('Leeftijd', formData.age, 'age', 'number')}
              {field('Lengte (cm)', formData.height, 'height', 'number')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {selectField('Geslacht', formData.gender, 'gender', [
                { value: 'man', label: 'Man' },
                { value: 'vrouw', label: 'Vrouw' },
                { value: 'anders', label: 'Anders / niet ingevuld' },
              ])}
              {field('Geboortedatum', formData.date_of_birth, 'date_of_birth', 'date')}
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.25rem 0' }} />
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Weight size={12} /> Gewicht
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {field('Huidig gewicht (kg)', formData.current_weight, 'current_weight', 'number')}
              {readonlyField('Streefgewicht (kg)', client?.goal_weight || client?.target_weight || '', 'Ingesteld door je coach')}
            </div>
          </div>
        )}

        {/* Coach */}
        {activeSection === 'coach' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER_ACTIVE}`,
              borderRadius: '8px'
            }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '50%',
                background: 'rgba(255,215,0,0.2)',
                border: `2px solid ${GOLD_BORDER_ACTIVE}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: GOLD }}>KS</span>
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: GOLD }}>Kersten Scheffer</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>Jouw Personal Coach</div>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Jouw Programma</div>
              {[
                ['Status', 'Actief', GOLD],
                ['Start datum', new Date(client?.created_at || Date.now()).toLocaleDateString('nl-NL'), 'rgba(255,255,255,0.7)'],
                ['Doel', client?.goal || 'Nog niet ingesteld', 'rgba(255,255,255,0.7)']
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>{label}</span>
                  <span style={{ fontSize: '0.8rem', color, fontWeight: '700' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instellingen */}
        {activeSection === 'instellingen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

            {/* Wachtwoord */}
            <button onClick={async () => {
              await db.supabase.auth.resetPasswordForEmail(client.email, {
                redirectTo: 'https://myarcfitness.com/reset-password'
              })
              alert('Reset link verstuurd naar ' + client.email)
            }} style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'transparent',
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Shield size={16} color={GOLD} />
                Wachtwoord wijzigen
              </div>
              <ChevronRight size={16} color='rgba(255,255,255,0.3)' />
            </button>

            {/* Privacy Policy */}
            <button onClick={() => window.open('https://myarcfitness.com/privacy', '_blank')} style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'transparent',
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Globe size={16} color={GOLD} />
                Privacybeleid
              </div>
              <ChevronRight size={16} color='rgba(255,255,255,0.3)' />
            </button>

            {/* Delete account */}
            <button onClick={() => setShowDeleteModal(true)} style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Trash2 size={16} />
                Account verwijderen
              </div>
              <ChevronRight size={16} color='rgba(239,68,68,0.4)' />
            </button>
          </div>
        )}
      </div>

      {/* GEEN portal-switch aan de client-kant. Die knop heeft hier gestaan en
          gaf elke klant een route naar de coach-hub (zie PortalSwitchButton).
          Wisselen tussen coach en client hoort alleen thuis in CoachHub. */}

      {/* Logout */}
      <button onClick={handleLogout} style={{
        width: '100%',
        padding: '0.875rem',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}>
        <LogOut size={16} />
        Uitloggen
      </button>

      {/* Delete Modal */}
      {showDeleteModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#111',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '400px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={20} color='#ef4444' />
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>Account verwijderen</div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Je account en alle data worden binnen 30 dagen permanent verwijderd. Dit kan niet ongedaan worden gemaakt.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>
              Typ <strong style={{ color: '#ef4444' }}>VERWIJDER</strong> om te bevestigen:
            </p>
            <input
              type='text'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='VERWIJDER'
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }} style={{
                flex: 1, padding: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: '700', fontSize: '0.875rem',
                cursor: 'pointer'
              }}>Annuleer</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'VERWIJDER' || deleting} style={{
                flex: 1, padding: '0.75rem',
                background: deleteConfirm === 'VERWIJDER' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${deleteConfirm === 'VERWIJDER' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '6px',
                color: deleteConfirm === 'VERWIJDER' ? '#ef4444' : 'rgba(255,255,255,0.2)',
                fontWeight: '700', fontSize: '0.875rem',
                cursor: deleteConfirm === 'VERWIJDER' ? 'pointer' : 'not-allowed'
              }}>
                {deleting ? 'Bezig...' : 'Verwijder'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
