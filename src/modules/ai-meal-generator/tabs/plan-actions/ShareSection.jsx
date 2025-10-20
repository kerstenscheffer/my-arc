// src/modules/ai-meal-generator/tabs/plan-actions/ShareSection.jsx
// Handles sharing plan via email/WhatsApp

import { Mail, MessageSquare, Send } from 'lucide-react'

export default function ShareSection({
  selectedClient,
  emailAddress,
  setEmailAddress,
  shareMessage,
  setShareMessage,
  isMobile
}) {
  // Send email (placeholder - needs backend)
  const handleSendEmail = () => {
    console.log('Email functie nog niet geïmplementeerd')
    alert('Email versturen komt binnenkort!')
  }
  
  // Share via WhatsApp
  const handleWhatsApp = () => {
    const message = shareMessage || `Hey ${selectedClient?.first_name}! Je nieuwe weekplan is klaar. Je kunt het bekijken in de MY ARC app.`
    const phoneNumber = selectedClient?.phone || ''
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }
  
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: isMobile ? '1rem' : '1.25rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '1rem' : '1.1rem',
        fontWeight: '600',
        color: '#f59e0b',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Send size={18} />
        Deel met Client
      </h3>
      
      {/* Email Input */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.6)',
          display: 'block',
          marginBottom: '0.5rem'
        }}>
          Email Adres
        </label>
        <input
          type="email"
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
          placeholder={selectedClient?.email || 'client@email.com'}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem'
          }}
        />
      </div>
      
      {/* Message Input */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.6)',
          display: 'block',
          marginBottom: '0.5rem'
        }}>
          Persoonlijk Bericht (optioneel)
        </label>
        <textarea
          value={shareMessage}
          onChange={(e) => setShareMessage(e.target.value)}
          placeholder="Hey! Hier is je nieuwe weekplan. Laat me weten als je vragen hebt!"
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem',
            resize: 'vertical',
            minHeight: '80px'
          }}
        />
      </div>
      
      {/* Share Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '0.75rem'
      }}>
        <button
          onClick={handleSendEmail}
          style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            color: '#f59e0b',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Mail size={18} />
          Verstuur Email
        </button>
        
        <button
          onClick={handleWhatsApp}
          style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <MessageSquare size={18} />
          WhatsApp
        </button>
      </div>
      
      {/* Info */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(245, 158, 11, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.6)'
      }}>
        <strong>💡 Tip:</strong> Zodra het plan is opgeslagen, kan {selectedClient?.first_name} het direct zien 
        in de client app onder "Meal Plan".
      </div>
    </div>
  )
}
