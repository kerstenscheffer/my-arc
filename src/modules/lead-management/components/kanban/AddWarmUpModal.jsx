// src/modules/lead-management/components/AddWarmUpModal.jsx
// UPDATED: Met Campaign Selector
// Modal voor toevoegen van nieuwe warm-up leads

import { useState, useEffect } from 'react'
import { X, Instagram, Plus, AtSign, Target, ChevronDown } from 'lucide-react'

export default function AddWarmUpModal({ 
  isMobile, 
  onClose, 
  onSubmit, 
  campaigns = [],           // Available campaigns
  activeCampaign = null,    // Currently active campaign (auto-select)
  onLoadCampaigns           // Callback to load campaigns if not provided
}) {
  const [formData, setFormData] = useState({
    instagramHandle: '',
    source: '',
    notes: '',
    campaignId: activeCampaign?.id || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false)

  // Auto-select active campaign when it changes
  useEffect(() => {
    if (activeCampaign?.id && !formData.campaignId) {
      setFormData(prev => ({ ...prev, campaignId: activeCampaign.id }))
    }
  }, [activeCampaign])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.instagramHandle.trim()) {
      alert('Vul een Instagram handle in')
      return
    }

    setIsSubmitting(true)
    try {
      const cleanHandle = formData.instagramHandle.replace('@', '').trim()
      await onSubmit({
        ...formData,
        instagramHandle: cleanHandle,
        campaignId: formData.campaignId || null
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCampaign = campaigns.find(c => c.id === formData.campaignId)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(225, 48, 108, 0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(225, 48, 108, 0.1)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.15) 0%, rgba(193, 53, 132, 0.1) 100%)',
          borderBottom: '1px solid rgba(225, 48, 108, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #E1306C 0%, #C13584 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(225, 48, 108, 0.4)'
            }}>
              <Instagram size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                Nieuwe Warm-Up Lead
              </h3>
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                margin: 0
              }}>
                Voeg een Instagram prospect toe
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
          
          {/* Campaign Selector - NEW */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem'
            }}>
              Campaign (optioneel)
            </label>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '2.5rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: formData.campaignId 
                    ? '1px solid rgba(16, 185, 129, 0.5)' 
                    : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  color: selectedCampaign ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {selectedCampaign ? (
                  <>
                    <Target size={16} color="#10b981" />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedCampaign.name}
                    </span>
                    {selectedCampaign.status === 'active' && (
                      <span style={{
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '4px',
                        fontSize: '0.6rem',
                        color: '#10b981',
                        fontWeight: '600'
                      }}>
                        ACTIEF
                      </span>
                    )}
                  </>
                ) : (
                  'Geen campaign (losse lead)'
                )}
                <ChevronDown 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    right: '0.75rem',
                    transform: showCampaignDropdown ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease',
                    color: 'rgba(255,255,255,0.5)'
                  }} 
                />
              </button>

              {/* Dropdown */}
              {showCampaignDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'rgba(17, 17, 17, 0.98)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  zIndex: 100,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  {/* No campaign option */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, campaignId: '' }))
                      setShowCampaignDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: !formData.campaignId ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Geen campaign (losse lead)
                  </button>

                  {/* Campaign options */}
                  {campaigns.length === 0 ? (
                    <div style={{
                      padding: '1rem',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.85rem',
                      textAlign: 'center'
                    }}>
                      Geen campaigns beschikbaar
                    </div>
                  ) : (
                    campaigns.map(campaign => (
                      <button
                        key={campaign.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, campaignId: campaign.id }))
                          setShowCampaignDropdown(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: formData.campaignId === campaign.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontSize: '0.9rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.campaignId !== campaign.id) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.campaignId !== campaign.id) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <Target size={14} color={campaign.status === 'active' ? '#10b981' : '#6b7280'} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {campaign.name}
                        </span>
                        {campaign.status === 'active' && (
                          <span style={{
                            padding: '0.1rem 0.3rem',
                            background: 'rgba(16, 185, 129, 0.2)',
                            borderRadius: '3px',
                            fontSize: '0.55rem',
                            color: '#10b981',
                            fontWeight: '700'
                          }}>
                            ACTIEF
                          </span>
                        )}
                        {campaign.source_account && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.4)'
                          }}>
                            {campaign.source_account}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Active campaign indicator */}
            {activeCampaign && formData.campaignId === activeCampaign.id && (
              <p style={{
                fontSize: '0.7rem',
                color: '#10b981',
                margin: '0.5rem 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 2s infinite'
                }} />
                Lead wordt toegevoegd aan actieve campaign
              </p>
            )}
          </div>

          {/* Instagram Handle */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem'
            }}>
              Instagram Handle *
            </label>
            <div style={{ position: 'relative' }}>
              <AtSign 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#E1306C'
                }}
              />
              <input
                type="text"
                value={formData.instagramHandle}
                onChange={(e) => setFormData(prev => ({ ...prev, instagramHandle: e.target.value }))}
                placeholder="username"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(225, 48, 108, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#E1306C'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(225, 48, 108, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(225, 48, 108, 0.3)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* Source - Auto-fill from campaign */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem'
            }}>
              Bron (optioneel)
            </label>
            <input
              type="text"
              value={formData.source || (selectedCampaign?.source_account ? `via ${selectedCampaign.source_account}` : '')}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              placeholder={selectedCampaign?.source_account || 'bijv. via @fitcoach123'}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem'
            }}>
              Notities (optioneel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Extra info over deze lead..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem',
                resize: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.instagramHandle.trim()}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: isSubmitting || !formData.instagramHandle.trim()
                ? 'rgba(225, 48, 108, 0.3)'
                : 'linear-gradient(135deg, #E1306C 0%, #C13584 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: isSubmitting || !formData.instagramHandle.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              minHeight: '48px',
              boxShadow: isSubmitting || !formData.instagramHandle.trim()
                ? 'none'
                : '0 4px 12px rgba(225, 48, 108, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && formData.instagramHandle.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(225, 48, 108, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && formData.instagramHandle.trim()) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(225, 48, 108, 0.3)'
              }
            }}
          >
            <Plus size={18} />
            {isSubmitting ? 'Toevoegen...' : 'Lead Toevoegen'}
          </button>
        </form>

        {/* Quick Tips */}
        <div style={{
          padding: '1rem',
          background: 'rgba(0,0,0,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            lineHeight: '1.5'
          }}>
            💡 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Tip:</strong> Selecteer een campaign om te tracken welke influencer de beste leads oplevert
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
