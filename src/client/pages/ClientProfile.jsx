// src/client/pages/ClientProfile.jsx
import { useState, useEffect } from 'react'
import { User, MapPin, Settings, Globe, Shield, LogOut, Edit, Save, X, Target, ChevronRight, Trash2, Weight } from 'lucide-react'
import DatabaseService from '../../services/DatabaseService'
import { Venster, VensterKop, VensterVoet, Kopje, Knop } from '../../components/arc-ui'
const db = DatabaseService

// MY ARC modal-stijl: zwart met wit accent. Het goud dat hier overal in de
// randen zat is eruit; kleur betekent nu iets (rood = verwijderen).
const VLAK = 'rgba(255,255,255,0.04)'
const LIJN = 'rgba(255,255,255,0.08)'
const LABEL = {
  display: 'block', fontSize: '0.52rem', fontWeight: 800,
  letterSpacing: '0.09em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)', marginBottom: 6,
}
const VELD = {
  width: '100%', padding: '0.6rem 0.7rem', borderRadius: 10,
  background: VLAK, border: `1px solid ${LIJN}`,
  color: '#fff', fontSize: '0.85rem', fontWeight: 700,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

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

  // Account + alle gegevens echt weggooien.
  //
  // Dit zette eerder clients.deleted_at. Die kolom bestaat niet, dus de update
  // faalde altijd op een onbekende kolom en de klant kreeg "Fout bij
  // verwijderen" — de knop heeft nooit iets gedaan. Er stond ook nergens code
  // die op zo'n vlag filterde, dus zelfs als de kolom er was geweest kon je
  // daarna gewoon weer inloggen.
  //
  // Nu via de RPC verwijder_mijn_account(): die ruimt de klantrij op (de rest
  // cascadeert) en verwijdert daarna de inlog uit auth.users. Dat laatste kan
  // niet vanuit de app, en zonder dat blijft inloggen werken terwijl de klant
  // denkt dat hij weg is. Google Play eist echte verwijdering.
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'VERWIJDER') return
    setDeleting(true)
    try {
      const { error } = await db.supabase.rpc('verwijder_mijn_account')
      if (error) throw error
      await db.signOut()
      window.location.href = '/'
    } catch (error) {
      alert('Fout bij verwijderen: ' + (error.message || error))
      setDeleting(false)
    }
  }

  const selectField = (label, value, key, options) => (
    <div>
      <label style={LABEL}>{label}</label>
      <select
        value={value}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        disabled={!isEditing}
        style={{
          ...VELD,
          background: isEditing ? VLAK : 'transparent',
          color: value ? '#fff' : 'rgba(255,255,255,0.35)',
          cursor: isEditing ? 'pointer' : 'default',
          appearance: isEditing ? 'auto' : 'none', WebkitAppearance: isEditing ? 'auto' : 'none',
        }}
      >
        <option value="">Niet ingesteld</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const readonlyField = (label, displayValue, note) => (
    <div>
      <label style={LABEL}>{label}</label>
      <div style={{
        ...VELD, background: 'transparent',
        color: displayValue ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
      }}>
        {displayValue || '—'}
      </div>
      {note && <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{note}</div>}
    </div>
  )

  const field = (label, value, key, type = 'text', disabled = false) => (
    <div>
      <label style={LABEL}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        disabled={!isEditing || disabled}
        style={{
          ...VELD,
          background: isEditing && !disabled ? VLAK : 'transparent',
          color: disabled ? 'rgba(255,255,255,0.35)' : '#fff',
        }}
      />
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '0.75rem' : '1rem', paddingBottom: isMobile ? '100px' : '2rem' }}>

      {/* Kop: naam groot, daaronder één regel met wie je bent. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? '0.8rem' : '1rem',
        padding: isMobile ? '0.9rem' : '1.1rem',
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${LIJN}`,
        borderRadius: 14,
        marginBottom: '0.85rem',
      }}>
        <div style={{
          width: isMobile ? 52 : 60, height: isMobile ? 52 : 60, flexShrink: 0,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${LIJN}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            {client?.first_name?.[0]}{client?.last_name?.[0]}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.025em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {client?.first_name} {client?.last_name}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 3,
            fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
          }}>
            MY ARC
            {client?.location && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <MapPin size={11} />
                {client.location}
              </>
            )}
          </div>
        </div>

        {!isEditing ? (
          <Knop soort="stil" onClick={() => setIsEditing(true)}>
            <Edit size={14} />
            Bewerk
          </Knop>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <Knop soort="primair" onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? 'Bezig…' : 'Opslaan'}
            </Knop>
            <Knop soort="stil" breedte={44} titel="Annuleer" onClick={() => setIsEditing(false)}>
              <X size={15} />
            </Knop>
          </div>
        )}
      </div>

      {/* Drie secties als schuifknop met een wit blokje. */}
      <div style={{
        position: 'relative', display: 'flex',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 999, padding: 3, marginBottom: '0.85rem',
      }}>
        <div style={{
          position: 'absolute', top: 3, bottom: 3,
          left: `calc(${(sections.findIndex(x => x.id === activeSection) * 100) / sections.length}% + 3px)`,
          width: `calc(${100 / sections.length}% - 6px)`,
          background: '#fff', borderRadius: 999,
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        {sections.map(sec => {
          const Icon = sec.icon
          const aan = activeSection === sec.id
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                position: 'relative', zIndex: 1,
                flex: 1, minHeight: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'transparent', border: 'none', borderRadius: 999,
                color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: aan ? 900 : 800,
                cursor: 'pointer', fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'color 0.15s ease',
              }}
            >
              <Icon size={13} strokeWidth={2.6} />
              {sec.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${LIJN}`,
        borderRadius: 14,
        padding: isMobile ? '1rem' : '1.15rem',
        marginBottom: '0.85rem',
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
            <div style={{ height: 1, background: LIJN, margin: '0.25rem 0' }} />
            <div style={{ marginBottom: '-0.35rem' }}><Kopje Icon={Weight} tekst="Gewicht" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {field('Huidig gewicht (kg)', formData.current_weight, 'current_weight', 'number')}
              {readonlyField('Streefgewicht (kg)', client?.goal_weight || client?.target_weight || '', 'Ingesteld door je coach')}
            </div>
          </div>
        )}

        {/* Coach */}
        {activeSection === 'coach' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: '0.85rem',
              background: VLAK, border: `1px solid ${LIJN}`, borderRadius: 12,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                backgroundImage: 'url(/coach-compliment.jpg)',
                backgroundSize: 'cover', backgroundPosition: 'center 30%',
                border: `1px solid ${LIJN}`,
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Kersten Scheffer</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Jouw coach</div>
              </div>
            </div>

            <div>
              <Kopje Icon={Target} tekst="Jouw programma" />
              {[
                ['Status', 'Actief'],
                ['Startdatum', new Date(client?.created_at || Date.now()).toLocaleDateString('nl-NL')],
                ['Doel', client?.goal || 'Nog niet ingesteld'],
              ].map(([label, value], i) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '0.65rem 0',
                  borderTop: i === 0 ? `1px solid ${LIJN}` : 'none',
                  borderBottom: `1px solid ${LIJN}`,
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instellingen — rijen met een lijn ertussen, geen losse kaders. */}
        {activeSection === 'instellingen' && (
          <div>
            {[
              {
                Icon: Shield, label: 'Wachtwoord wijzigen',
                onClick: async () => {
                  await db.supabase.auth.resetPasswordForEmail(client.email, {
                    redirectTo: 'https://myarcfitness.com/reset-password',
                  })
                  alert('Reset link verstuurd naar ' + client.email)
                },
              },
              {
                Icon: Globe, label: 'Privacybeleid',
                onClick: () => window.open('https://myarcfitness.com/privacy', '_blank'),
              },
              {
                Icon: Trash2, label: 'Account verwijderen', gevaar: true,
                onClick: () => setShowDeleteModal(true),
              },
            ].map((r, i, arr) => (
              <button
                key={r.label}
                onClick={r.onClick}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0.85rem 0', minHeight: 48,
                  background: 'transparent', border: 'none',
                  borderTop: i === 0 ? 'none' : `1px solid ${LIJN}`,
                  color: r.gevaar ? '#fca5a5' : 'rgba(255,255,255,0.8)',
                  fontSize: '0.85rem', fontWeight: 800, textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <r.Icon size={16} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>{r.label}</span>
                <ChevronRight size={15} color={r.gevaar ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.25)'} />
                {i === arr.length - 1 && null}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GEEN portal-switch aan de client-kant. Die knop heeft hier gestaan en
          gaf elke klant een route naar de coach-hub (zie PortalSwitchButton).
          Wisselen tussen coach en client hoort alleen thuis in CoachHub. */}

      {/* Uitloggen */}
      <button onClick={handleLogout} style={{
        width: '100%', minHeight: 44, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        background: VLAK, border: `1px solid ${LIJN}`,
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.8rem', fontWeight: 800,
        cursor: 'pointer', fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <LogOut size={15} />
        Uitloggen
      </button>

      {/* Account verwijderen — zelfde venster als de rest van de app. */}
      {showDeleteModal && (
        <Venster isMobile={isMobile} onClose={() => { setShowDeleteModal(false); setDeleteConfirm('') }} maxWidth={420} zIndex={9999}>
          <VensterKop
            isMobile={isMobile}
            titel="Account verwijderen"
            sub="Dit kan niet ongedaan worden gemaakt"
            onClose={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
          />

          <div style={{ padding: isMobile ? '1rem' : '1.15rem' }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
              Je account, je plannen en al je voortgang worden direct en permanent
              verwijderd. Je kunt daarna niet meer inloggen.
            </p>

            <div style={{ marginTop: '1rem' }}>
              <Kopje Icon={Trash2} tekst="Typ VERWIJDER om te bevestigen" />
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="VERWIJDER"
                style={{
                  ...VELD,
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              />
            </div>
          </div>

          <VensterVoet isMobile={isMobile}>
            <Knop soort="stil" flex={1} onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}>
              Annuleer
            </Knop>
            <Knop
              soort="gevaar"
              flex={1}
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'VERWIJDER' || deleting}
            >
              {deleting ? 'Bezig…' : 'Verwijder'}
            </Knop>
          </VensterVoet>
        </Venster>
      )}
    </div>
  )
}
