import { useState, useEffect } from 'react'
import { ChevronDown, User, Phone, Mail, Calendar, MapPin, Settings, Bell, Globe, Shield, LogOut, Edit, Save, X, Camera, Target, Activity } from 'lucide-react'
import DatabaseService from '../../services/DatabaseService'
const db = DatabaseService

// Roze kleurenschema zoals in origineel
const profileColors = {
  primary: '#ec4899',
  primaryDark: '#db2777',
  primaryLight: '#f9a8d4',
  gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  backgroundGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)',
  borderColor: 'rgba(236, 72, 153, 0.1)',
  borderActive: 'rgba(236, 72, 153, 0.2)',
  boxShadow: '0 10px 25px rgba(236, 72, 153, 0.25)',
  glow: '0 0 60px rgba(236, 72, 153, 0.1)'
}

// Icon URLs - betere placeholder
const iconUrls = {
  profile: "https://ui-avatars.com/api/?name=User&background=ec4899&color=fff&size=200",
  coach: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909596/settings_images/6fdbdf-1af6-0d32-752b-12f22af8a2ac_IMG_3254.jpeg"
}

export default function ClientProfile({ client, user }) {
  const [activeSection, setActiveSection] = useState('persoonlijk')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileImage, setProfileImage] = useState(client?.profile_image || `https://ui-avatars.com/api/?name=${client?.first_name}+${client?.last_name}&background=ec4899&color=fff&size=200`)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    age: '',
    height: '',
    location: 'Amsterdam, Nederland',
    // Settings
    notification_email: true,
    notification_push: false,
    language: 'nl'
  })

  // Load client data when component mounts or client changes
  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        age: client.age || '',
        height: client.height || '',
        location: client.location || 'Amsterdam, Nederland',  // Direct van kolom
        notification_email: true,
        notification_push: false,
        language: 'nl'
      })
      
      // Zet profiel foto als die bestaat
      if (client.profile_image) {
        setProfileImage(client.profile_image)
      } else {
        // Gebruik initialen als placeholder
        setProfileImage(`https://ui-avatars.com/api/?name=${client.first_name}+${client.last_name}&background=ec4899&color=fff&size=200`)
      }
    }
  }, [client])

  const isMobile = window.innerWidth <= 768

  const sections = [
    { id: 'persoonlijk', label: 'Persoonlijk', icon: User },
    { id: 'coach', label: 'Coach Info', icon: Target },
    { id: 'instellingen', label: 'Instellingen', icon: Settings }
  ]

  const currentSection = sections.find(s => s.id === activeSection)
  const CurrentIcon = currentSection.icon

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update met dedicated kolommen (location, profile_image)
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : null,
        height: formData.height ? parseInt(formData.height) : null,
        location: formData.location,  // Direct als kolom
        profile_image: profileImage,   // Direct als kolom
        updated_at: new Date().toISOString()
      }

      console.log('Saving data:', updateData)

      // Update via DatabaseService
      const { data, error } = await db.supabase
        .from('clients')
        .update(updateData)
        .eq('id', client.id)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      console.log('Save successful:', data)

      // Success feedback
      const successDiv = document.createElement('div')
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${profileColors.gradient};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
      `
      successDiv.textContent = '✅ Profiel succesvol bijgewerkt!'
      document.body.appendChild(successDiv)
      
      setTimeout(() => {
        successDiv.remove()
      }, 3000)

      setIsEditing(false)
      
      // Reload page to show new data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Fout bij opslaan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogout = async () => {
    try {
      await db.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="myarc-animate-in" style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      {/* Profile Header - ROZE GRADIENT */}
      <div style={{
        background: profileColors.gradient,
        borderRadius: isMobile ? '20px' : '24px',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: profileColors.boxShadow
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top row with profile and edit button */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            {/* Profile section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Profile Image with Upload */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: isMobile ? '70px' : '80px',
                  height: isMobile ? '70px' : '80px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid rgba(255,255,255,0.5)',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'cover'
                    }} 
                  />
                </div>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      id="profile-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="profile-upload"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#fff',
                        border: '2px solid ' + profileColors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Camera size={14} color={profileColors.primary} />
                    </label>
                  </>
                )}
              </div>

              {/* Name and info */}
              <div>
                <h1 style={{ 
                  color: '#fff', 
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  marginBottom: '0.25rem',
                  fontWeight: 'bold'
                }}>
                  {formData.first_name} {formData.last_name}
                </h1>
                <p style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  MY ARC Member
                </p>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.25rem'
                }}>
                  <MapPin size={14} />
                  {formData.location}
                </p>
              </div>
            </div>

            {/* Edit button */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '600'
                }}
              >
                <Edit size={16} />
                Bewerk
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    color: profileColors.primary,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Opslaan...' : <Save size={16} />}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Menu voor Secties */}
      <div style={{
        marginBottom: '1.5rem',
        position: 'relative'
      }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${profileColors.borderColor}`,
            borderRadius: '12px',
            color: profileColors.primary,
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.3s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CurrentIcon size={20} />
            {currentSection.label}
          </div>
          <ChevronDown 
            size={20} 
            style={{
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.3s'
            }}
          />
        </button>

        {/* Dropdown Options */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: '#1a1a1a',
            border: `1px solid ${profileColors.borderActive}`,
            borderRadius: '12px',
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id)
                    setDropdownOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: activeSection === section.id ? profileColors.backgroundGradient : 'transparent',
                    border: 'none',
                    borderLeft: activeSection === section.id ? `3px solid ${profileColors.primary}` : '3px solid transparent',
                    color: activeSection === section.id ? profileColors.primary : '#888',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = profileColors.backgroundGradient
                      e.currentTarget.style.color = profileColors.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#888'
                    }
                  }}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: '2rem',
        border: `1px solid ${profileColors.borderColor}`
      }}>
        {/* Section Header */}
        <h3 style={{ 
          color: profileColors.primary, 
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CurrentIcon size={20} />
          {currentSection.label === 'Persoonlijk' && 'Persoonlijke Informatie'}
          {currentSection.label === 'Coach Info' && 'Jouw Coach & Programma'}
          {currentSection.label === 'Instellingen' && 'Instellingen'}
        </h3>

        {/* Persoonlijke Informatie Section */}
        {activeSection === 'persoonlijk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Naam */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Voornaam
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isEditing ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: `1px solid ${isEditing ? profileColors.borderActive : profileColors.borderColor}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Achternaam
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isEditing ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: `1px solid ${isEditing ? profileColors.borderActive : profileColors.borderColor}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: `1px solid ${profileColors.borderColor}`,
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} />
                Telefoon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!isEditing}
                placeholder="+31 6 12345678"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isEditing ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: `1px solid ${isEditing ? profileColors.borderActive : profileColors.borderColor}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Location Field - NIEUW */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} />
                Locatie
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                disabled={!isEditing}
                placeholder="Amsterdam, Nederland"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isEditing ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: `1px solid ${isEditing ? profileColors.borderActive : profileColors.borderColor}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Physical Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Leeftijd
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  disabled={!isEditing}
                  placeholder="25"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isEditing ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: `1px solid ${isEditing ? profileColors.borderActive : profileColors.borderColor}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Lengte (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  disabled={!isEditing}
                  placeholder="180"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isEditing ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: `1px solid ${isEditing ? profileColors.borderActive : profileColors.borderColor}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Coach Info Section */}
        {activeSection === 'coach' && (
          <div>
            {/* Coach Profile */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: `1px solid ${profileColors.borderColor}`
            }}>
              <img 
                src={iconUrls.coach} 
                alt="Coach" 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: `2px solid ${profileColors.primary}`
                }}
              />
              <div>
                <h4 style={{ color: profileColors.primary, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  Kersten Scheffer
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  Jouw Personal Coach
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                  📧 coach@myarc.nl
                </p>
              </div>
            </div>

            {/* MY ARC Mission */}
            <div style={{
              padding: '1.25rem',
              background: profileColors.backgroundGradient,
              borderRadius: '12px',
              border: `1px solid ${profileColors.borderActive}`
            }}>
              <h4 style={{ 
                color: profileColors.primary, 
                fontSize: '1rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Target size={18} />
                Over MY ARC
              </h4>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '0.9rem', 
                lineHeight: '1.6',
                marginBottom: '0.75rem'
              }}>
                Ik heb MY ARC opgericht om mensen te helpen een gezonder leven te leiden, 
                en daarbij ook een betere kwaliteit van leven te ervaren. Een leven met meer 
                energie, meer geluk, meer kansen en meer vrijheid.
              </p>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '0.9rem', 
                lineHeight: '1.6',
                marginBottom: '0.75rem'
              }}>
                De bedoeling van MY ARC is niet mensen binnen x weken naar x doel te brengen 
                (hoewel dat wel het systeem is haha), MY ARC is er om de koers van iemands 
                leven voorgoed te keren.
              </p>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '0.9rem', 
                lineHeight: '1.6'
              }}>
                We laten zien wat er mogelijk is, we laten mensen het beste uit hunzelf halen, 
                we creëren een gevoel van voldoening en zelfrespect doormiddel van doelen. 
                <strong style={{ color: profileColors.primary }}> MY ARC is hier om jou te helpen.</strong>
              </p>
            </div>

            {/* Current Program Info */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: `1px solid ${profileColors.borderColor}`
            }}>
              <h4 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Jouw Programma
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Status:</span>
                  <span style={{ color: profileColors.primary }}>Actief</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Start datum:</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {new Date(client?.created_at || Date.now()).toLocaleDateString('nl-NL')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Doel:</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{client?.goal || 'Nog niet ingesteld'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instellingen Section */}
        {activeSection === 'instellingen' && (
          <div>
            {/* Notifications */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '1rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Bell size={16} />
                Notificaties
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: `1px solid ${profileColors.borderColor}`,
                  cursor: 'pointer'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Email notificaties</span>
                  <input
                    type="checkbox"
                    checked={formData.notification_email}
                    onChange={(e) => setFormData({...formData, notification_email: e.target.checked})}
                    style={{ width: '20px', height: '20px', accentColor: profileColors.primary }}
                  />
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: `1px solid ${profileColors.borderColor}`,
                  cursor: 'pointer'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Push notificaties</span>
                  <input
                    type="checkbox"
                    checked={formData.notification_push}
                    onChange={(e) => setFormData({...formData, notification_push: e.target.checked})}
                    style={{ width: '20px', height: '20px', accentColor: profileColors.primary }}
                  />
                </label>
              </div>
            </div>

            {/* Language */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '1rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Globe size={16} />
                Taal
              </h4>
              <select
                value={formData.language}
                onChange={(e) => setFormData({...formData, language: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${profileColors.borderColor}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="nl" style={{ background: '#1a1a1a' }}>Nederlands</option>
                <option value="en" style={{ background: '#1a1a1a' }}>English</option>
              </select>
            </div>

            {/* Security */}
            <div>
              <h4 style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '1rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Shield size={16} />
                Beveiliging
              </h4>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${profileColors.borderColor}`,
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Wachtwoord wijzigen</span>
                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)'
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(153, 27, 27, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <LogOut size={18} />
        Uitloggen
      </button>

      {/* Animation for success message */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
