// src/pages/checkout-components/GoldenCheckoutForm.jsx
import { useState } from 'react'

export default function GoldenCheckoutForm({ actualPrice, onSubmit, loading, isMobile }) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      alert('Vul alle verplichte velden in')
      return
    }
    onSubmit(formData)
  }

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      {/* Form header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          color: '#D4AF37'
        }}>
          Start Je Transformatie
        </h2>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(212, 175, 55, 0.5)'
        }}>
          Vul je gegevens in om te beginnen
        </p>
      </div>

      {/* Form fields */}
      <div style={{ 
        display: 'grid', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {/* Name fields */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: '1rem' 
        }}>
          <div>
            <label style={{
              fontSize: '0.85rem',
              color: 'rgba(212, 175, 55, 0.6)',
              marginBottom: '0.5rem',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Voornaam *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(212, 175, 55, 0.02)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                color: '#D4AF37',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(212, 175, 55, 0.4)'
                e.target.style.background = 'rgba(212, 175, 55, 0.04)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(212, 175, 55, 0.15)'
                e.target.style.background = 'rgba(212, 175, 55, 0.02)'
              }}
            />
          </div>
          
          <div>
            <label style={{
              fontSize: '0.85rem',
              color: 'rgba(212, 175, 55, 0.6)',
              marginBottom: '0.5rem',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Achternaam *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(212, 175, 55, 0.02)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                color: '#D4AF37',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(212, 175, 55, 0.4)'
                e.target.style.background = 'rgba(212, 175, 55, 0.04)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(212, 175, 55, 0.15)'
                e.target.style.background = 'rgba(212, 175, 55, 0.02)'
              }}
            />
          </div>
        </div>

        {/* Email field */}
        <div>
          <label style={{
            fontSize: '0.85rem',
            color: 'rgba(212, 175, 55, 0.6)',
            marginBottom: '0.5rem',
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(212, 175, 55, 0.02)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              color: '#D4AF37',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.4)'
              e.target.style.background = 'rgba(212, 175, 55, 0.04)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.15)'
              e.target.style.background = 'rgba(212, 175, 55, 0.02)'
            }}
          />
        </div>

        {/* Phone field */}
        <div>
          <label style={{
            fontSize: '0.85rem',
            color: 'rgba(212, 175, 55, 0.6)',
            marginBottom: '0.5rem',
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Telefoon (optioneel)
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(212, 175, 55, 0.02)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              color: '#D4AF37',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.4)'
              e.target.style.background = 'rgba(212, 175, 55, 0.04)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.15)'
              e.target.style.background = 'rgba(212, 175, 55, 0.02)'
            }}
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          background: loading 
            ? 'rgba(212, 175, 55, 0.5)' 
            : 'linear-gradient(135deg, #D4AF37 0%, #B8983C 100%)',
          color: loading ? 'rgba(0, 0, 0, 0.5)' : '#000',
          border: 'none',
          padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '50px',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(212, 175, 55, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      >
        {loading ? 'Wordt verwerkt...' : `Start Nu Voor €${actualPrice}`}
      </button>

      {/* Security badges */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: isMobile ? '1rem' : '2rem',
        marginTop: '1.5rem',
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        color: 'rgba(212, 175, 55, 0.3)'
      }}>
        <span>✓ SSL Beveiligd</span>
        <span>✓ Stripe Checkout</span>
        <span>✓ Direct Starten</span>
      </div>
    </div>
  )
}
