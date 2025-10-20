// src/coach/tabs/client-info/components/AddClientModal.jsx
import { useState } from 'react'
import { X, User, Mail, Phone, Lock, Copy, Check } from 'lucide-react'

export default function AddClientModal({ db, onClose, onSuccess, isMobile }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: generatePassword(),
    sendEmail: true
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Generate secure random password
  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setSaving(true)
    try {
      console.log('Creating client account...')
      
      // First create the auth user in Supabase
      const { data: authData, error: authError } = await db.supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'client'
          }
        }
      })
      
      if (authError) throw authError
      
      // Get current coach user
      const currentUser = await db.getCurrentUser()
      if (!currentUser) throw new Error('Coach not authenticated')
      
      // Create client record
      const { data: clientData, error: clientError } = await db.supabase
        .from('clients')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          auth_user_id: authData.user?.id,
          trainer_id: currentUser.id,
          coach_id: currentUser.id,
          status: 'active',
          created_at: new Date().toISOString(),
          // Set some default values
          location: 'Amsterdam, Nederland',
          water_intake_target: 3.0,
          activity_level: 'moderate'
        })
        .select()
        .single()
      
      if (clientError) throw clientError
      
      console.log('✅ Client created successfully:', clientData)
      
      // Show success message with credentials
      const message = `
✅ Client account created successfully!

Login credentials:
Email: ${formData.email}
Password: ${formData.password}

${formData.sendEmail ? 'The client will receive an email with these credentials.' : 'Please share these credentials with the client securely.'}
      `
      
      alert(message)
      
      // Refresh and close
      if (onSuccess) {
        await onSuccess(clientData)
      }
      onClose()
      
    } catch (error) {
      console.error('Error creating client:', error)
      
      // Check for specific errors
      if (error.message?.includes('already registered')) {
        setErrors({ email: 'This email is already registered' })
      } else {
        alert('❌ Error creating client: ' + error.message)
      }
    } finally {
      setSaving(false)
    }
  }
  
  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const regeneratePassword = () => {
    setFormData({ ...formData, password: generatePassword() })
    setCopied(false)
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      zIndex: 1000
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: isMobile ? '1.5rem' : '2rem',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            Add New Client
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Form */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Name fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500'
              }}>
                <User size={14} />
                First Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${errors.firstName ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  outline: 'none',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              />
              {errors.firstName && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  {errors.firstName}
                </span>
              )}
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500'
              }}>
                Last Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${errors.lastName ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  outline: 'none',
                  minHeight: '44px'
                }}
              />
              {errors.lastName && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  {errors.lastName}
                </span>
              )}
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500'
            }}>
              <Mail size={14} />
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              placeholder="john.doe@example.com"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: `1px solid ${errors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                minHeight: '44px'
              }}
            />
            {errors.email && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>
          
          {/* Phone */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500'
            }}>
              <Phone size={14} />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+31 6 12345678"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                minHeight: '44px'
              }}
            />
          </div>
          
          {/* Password */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500'
            }}>
              <Lock size={14} />
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${errors.password ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  minHeight: '44px'
                }}
              />
              <button
                onClick={copyPassword}
                style={{
                  padding: '0 1rem',
                  background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  border: `1px solid ${copied ? '#10b981' : 'rgba(59, 130, 246, 0.3)'}`,
                  borderRadius: '8px',
                  color: copied ? '#10b981' : '#3b82f6',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={regeneratePassword}
                style={{
                  padding: '0 0.75rem',
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '8px',
                  color: '#f97316',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                🔄
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>
          
          {/* Send email checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.1)'
          }}>
            <input
              type="checkbox"
              checked={formData.sendEmail}
              onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }}
            />
            <label style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer'
            }}>
              Send login credentials to client via email
            </label>
          </div>
          
          {/* Info box */}
          <div style={{
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.5'
          }}>
            ℹ️ The client will receive an email with their login credentials. They can use these to access their personal dashboard and track their progress.
          </div>
          
          {/* Submit buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem'
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 1,
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: saving 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating...
                </>
              ) : (
                <>
                  <User size={18} />
                  Create Client
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
