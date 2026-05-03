// src/modules/supplements/SupplementPlanPanel.jsx
// ✅ v3.0 - Clean fullscreen, neutral styling, 2 tabs (Morning/Evening)
// ✅ Inspired by AIMealInfoModal design

import React, { useState, useEffect } from 'react'
import DatabaseService from '../../services/DatabaseService'
import { 
  X, Pill, Sun, Moon, Info, ShoppingCart, 
  Sparkles, AlertCircle, Clock, Package
} from 'lucide-react'

export default function SupplementPlanPanel({ 
  clientId,
  clientWeight,
  trainingFreq,
  isOpen,
  onClose 
}) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [supplementPlan, setSupplementPlan] = useState(null)
  const [selectedSupplement, setSelectedSupplement] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [activeTab, setActiveTab] = useState('morning')
  
  useEffect(() => {
    if (isOpen && clientId) {
      loadSupplementPlan()
    }
  }, [isOpen, clientId])
  
  const loadSupplementPlan = async () => {
    setLoading(true)
    
    try {
      let plan = await DatabaseService.getSupplementPlan(clientId)
      
      if (!plan) {
        console.log('📋 No active plan found, generating template...')
        const supplements = await DatabaseService.generateSupplementPlanFromTemplate(
          clientWeight,
          trainingFreq,
          'bulk'
        )
        
        plan = {
          supplements: supplements,
          status: 'template',
          client_weight: clientWeight,
          training_frequency: trainingFreq
        }
      }
      
      setSupplementPlan(plan)
      console.log('✅ Supplement plan loaded:', plan)
      
    } catch (error) {
      console.error('❌ Failed to load supplement plan:', error)
      setSupplementPlan(null)
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  const morningSupps = supplementPlan?.supplements?.filter(
    s => s.timing?.time_of_day === 'morning'
  ) || []
  
  const eveningSupps = supplementPlan?.supplements?.filter(
    s => s.timing?.time_of_day === 'evening' || s.timing?.time_of_day === 'before_bed'
  ) || []
  
  const totalCost = supplementPlan?.supplements?.reduce(
    (sum, s) => sum + (s.cost_per_month || 0), 0
  ) || 0
  
  const handleSupplementClick = (supplement) => {
    setSelectedSupplement(supplement)
    setShowInfoModal(true)
  }
  
  const tabs = [
    { id: 'morning', label: 'Ochtend', icon: Sun },
    { id: 'evening', label: 'Avond', icon: Moon }
  ]
  
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10500,
        animation: 'suppFadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '600px',
          width: '100%',
          margin: '0 auto',
          background: '#0a0a0a',
          overflow: 'hidden'
        }}
      >
        {/* ── Hero Section ── */}
        <div style={{
          position: 'relative',
          height: isMobile ? '180px' : '220px',
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          {/* Background Image */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&h=400&fit=crop&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
          
          {/* Dark gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.3) 100%)'
          }} />

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '0.75rem' : '1rem',
              right: isMobile ? '0.75rem' : '1rem',
              width: '36px',
              height: '36px',
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
            }}
          >
            <X size={18} />
          </button>

          {/* Title + Stats */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: isMobile ? '0 1rem 0.75rem' : '0 1.5rem 1rem'
          }}>
            <div style={{
              fontSize: isMobile ? '1.15rem' : '1.35rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Pill size={24} />
              Supplement Plan
            </div>
            
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.875rem' : '1.25rem'
            }}>
              {[
                { val: `€${totalCost.toFixed(0)}`, label: 'per maand' },
                { val: supplementPlan?.supplements?.length || 0, label: 'supplementen' },
                { val: morningSupps.length + eveningSupps.length > 0 ? '2x' : '0x', label: 'per dag' }
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                  <span style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '800',
                    color: '#fff'
                  }}>
                    {m.val}
                  </span>
                  <span style={{
                    fontSize: '0.5rem',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase'
                  }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          {tabs.map(tab => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.6rem 0' : '0.7rem 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #9333ea' : '2px solid transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.35)',
                  fontSize: isMobile ? '0.65rem' : '0.72rem',
                  fontWeight: activeTab === tab.id ? '800' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <TabIcon size={13} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid rgba(255,255,255,0.06)',
                borderTopColor: 'rgba(255,255,255,0.3)',
                borderRadius: '50%',
                animation: 'suppSpin 0.8s linear infinite'
              }} />
            </div>
          ) : (
            <>
              {activeTab === 'morning' && (
                <SupplementList
                  supplements={morningSupps}
                  timeLabel="OCHTEND (07:00)"
                  icon={Sun}
                  iconColor="#f59e0b"
                  onSupplementClick={handleSupplementClick}
                  isMobile={isMobile}
                />
              )}
              
              {activeTab === 'evening' && (
                <SupplementList
                  supplements={eveningSupps}
                  timeLabel="AVOND (21:00)"
                  icon={Moon}
                  iconColor="#818cf8"
                  onSupplementClick={handleSupplementClick}
                  isMobile={isMobile}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* SUPPLEMENT INFO MODAL */}
      {showInfoModal && selectedSupplement && (
        <SupplementInfoModal
          supplement={selectedSupplement}
          onClose={() => {
            setShowInfoModal(false)
            setSelectedSupplement(null)
          }}
          isMobile={isMobile}
        />
      )}

      <style>{`
        @keyframes suppFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes suppSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ── SUPPLEMENT LIST COMPONENT ──
function SupplementList({ supplements, timeLabel, icon: Icon, iconColor, onSupplementClick, isMobile }) {
  if (supplements.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        color: 'rgba(255,255,255,0.2)'
      }}>
        <Pill size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <div style={{ fontSize: '0.85rem' }}>
          Geen supplementen voor {timeLabel.toLowerCase()}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem' }}>
      {/* Time Header */}
      <div style={{
        fontSize: isMobile ? '0.55rem' : '0.6rem',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Icon size={14} style={{ color: iconColor }} />
        {timeLabel}
      </div>

      {/* Supplements */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {supplements.map((supp, idx) => (
          <button
            key={idx}
            onClick={() => onSupplementClick(supp)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '0.75rem 0' : '0.875rem 0',
              background: 'transparent',
              border: 'none',
              borderBottom: idx < supplements.length - 1 
                ? '1px solid rgba(255,255,255,0.03)' 
                : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flex: 1,
              minWidth: 0
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.15rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {supp.name}
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  color: 'rgba(255,255,255,0.25)'
                }}>
                  {supp.dosage?.amount} {supp.dosage?.unit} · €{supp.cost_per_month}/maand
                </div>
              </div>
            </div>

            <Info size={16} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* Timing Notes */}
      {supplements[0]?.timing?.notes && (
        <div style={{
          marginTop: '1rem',
          padding: '0.625rem 0.75rem',
          background: 'rgba(147, 51, 234, 0.06)',
          border: '1px solid rgba(147, 51, 234, 0.12)',
          borderRadius: '8px',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <Sparkles size={14} style={{ color: '#a855f7', flexShrink: 0, marginTop: '0.1rem' }} />
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(168, 85, 247, 0.9)',
            lineHeight: 1.4
          }}>
            {supplements[0].timing.notes}
          </span>
        </div>
      )}
    </div>
  )
}

// ── SUPPLEMENT INFO MODAL (FULLSCREEN) ──
function SupplementInfoModal({ supplement, onClose, isMobile }) {
  const [activeTab, setActiveTab] = useState('info')

  const tabs = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'benefits', label: 'Voordelen', icon: Sparkles },
    { id: 'usage', label: 'Gebruik', icon: Clock },
    { id: 'buy', label: 'Koop', icon: ShoppingCart }
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10501,
        animation: 'suppFadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '600px',
          width: '100%',
          margin: '0 auto',
          background: '#0a0a0a',
          overflow: 'hidden'
        }}
      >
        {/* Hero */}
        <div style={{
          position: 'relative',
          height: isMobile ? '140px' : '160px',
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          {/* Background Image based on supplement type */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: supplement.priority_level === 'essential'
              ? 'url(https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=300&fit=crop&q=80)'
              : supplement.priority_level === 'recommended'
              ? 'url(https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&h=300&fit=crop&q=80)'
              : 'url(https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&h=300&fit=crop&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
          
          <div style={{
            position: 'absolute',
            inset: 0,
            background: supplement.priority_level === 'essential'
              ? 'linear-gradient(to top, #0a0a0a 0%, rgba(220, 38, 38, 0.4) 50%, rgba(220, 38, 38, 0.3) 80%)'
              : supplement.priority_level === 'recommended'
              ? 'linear-gradient(to top, #0a0a0a 0%, rgba(147, 51, 234, 0.4) 50%, rgba(147, 51, 234, 0.3) 80%)'
              : 'linear-gradient(to top, #0a0a0a 0%, rgba(75, 85, 99, 0.4) 50%, rgba(75, 85, 99, 0.3) 80%)'
          }} />

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '0.75rem' : '1rem',
              right: isMobile ? '0.75rem' : '1rem',
              width: '36px',
              height: '36px',
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={18} />
          </button>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: isMobile ? '0 1rem 0.75rem' : '0 1.5rem 1rem'
          }}>
            <div style={{
              fontSize: isMobile ? '1.15rem' : '1.35rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.02em',
              marginBottom: '0.25rem'
            }}>
              {supplement.name}
            </div>
            <div style={{
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              fontWeight: '700',
              letterSpacing: '0.05em'
            }}>
              {supplement.priority_level === 'essential' ? '🔴 Essential' :
               supplement.priority_level === 'recommended' ? '🟣 Recommended' :
               '⚪ Optional'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          {tabs.map(tab => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.6rem 0' : '0.7rem 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #9333ea' : '2px solid transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.35)',
                  fontSize: isMobile ? '0.65rem' : '0.72rem',
                  fontWeight: activeTab === tab.id ? '800' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <TabIcon size={13} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem'
        }}>
          {activeTab === 'info' && <InfoTab supplement={supplement} isMobile={isMobile} />}
          {activeTab === 'benefits' && <BenefitsTab supplement={supplement} isMobile={isMobile} />}
          {activeTab === 'usage' && <UsageTab supplement={supplement} isMobile={isMobile} />}
          {activeTab === 'buy' && <BuyTab supplement={supplement} isMobile={isMobile} />}
        </div>
      </div>
    </div>
  )
}

// ── INFO TAB ──
function InfoTab({ supplement, isMobile }) {
  return (
    <div>
      {/* Dosage */}
      <div style={{
        padding: '1rem',
        background: 'rgba(147, 51, 234, 0.06)',
        border: '1px solid rgba(147, 51, 234, 0.12)',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          fontSize: '0.5rem',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem'
        }}>
          Aanbevolen dosering
        </div>
        <div style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '800',
          color: '#fff',
          letterSpacing: '-0.02em'
        }}>
          {supplement.dosage?.amount} {supplement.dosage?.unit}
        </div>
        {supplement.dosage?.note && (
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(168, 85, 247, 0.8)',
            marginTop: '0.5rem',
            lineHeight: 1.4
          }}>
            {supplement.dosage.note}
          </div>
        )}
      </div>

      {/* Cost */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        <span style={{
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          Kosten per maand
        </span>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: '700',
          color: '#fff'
        }}>
          €{supplement.cost_per_month}
        </span>
      </div>
    </div>
  )
}

// ── BENEFITS TAB ──
function BenefitsTab({ supplement, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {supplement.benefits?.map((benefit, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            gap: '0.625rem',
            padding: '0.625rem 0',
            borderBottom: idx < supplement.benefits.length - 1 
              ? '1px solid rgba(255,255,255,0.03)' 
              : 'none'
          }}
        >
          <Sparkles size={14} style={{ color: '#9333ea', flexShrink: 0, marginTop: '0.15rem' }} />
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.5,
            margin: 0
          }}>
            {benefit}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── USAGE TAB ──
function UsageTab({ supplement, isMobile }) {
  return (
    <div>
      <p style={{
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.6,
        margin: 0,
        marginBottom: '1.5rem'
      }}>
        {supplement.instructions}
      </p>

      {supplement.timing?.notes && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(147, 51, 234, 0.06)',
          border: '1px solid rgba(147, 51, 234, 0.12)',
          borderRadius: '8px',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <AlertCircle size={14} style={{ color: '#a855f7', flexShrink: 0, marginTop: '0.1rem' }} />
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(168, 85, 247, 0.9)',
            lineHeight: 1.4
          }}>
            {supplement.timing.notes}
          </span>
        </div>
      )}
    </div>
  )
}

// ── BUY TAB ──
function BuyTab({ supplement, isMobile }) {
  if (!supplement.products || supplement.products.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem 0',
        color: 'rgba(255,255,255,0.2)',
        fontSize: '0.85rem'
      }}>
        Geen aankoop links beschikbaar
      </div>
    )
  }

  const hasZumub = supplement.products.some(p => 
    p.store?.toLowerCase().includes('zumub')
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Zumub Discount Banner */}
      {hasZumub && (
        <div style={{
          padding: '0.875rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={14} style={{ color: '#10b981' }} />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Zumub Kortingscode
            </span>
          </div>
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.5,
            marginBottom: '0.5rem'
          }}>
            Gebruik code <span style={{
              fontWeight: '800',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>KERSTEN</span> voor extra korting bij Zumub
          </div>
        </div>
      )}

      {/* Product Links */}
      {supplement.products.map((product, idx) => {
        const isZumub = product.store?.toLowerCase().includes('zumub')
        
        return (
          <a
            key={idx}
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: isZumub 
                ? '1px solid rgba(16, 185, 129, 0.2)' 
                : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = isZumub ? '#10b981' : '#9333ea'
              e.currentTarget.style.background = isZumub 
                ? 'rgba(16, 185, 129, 0.05)' 
                : 'rgba(147, 51, 234, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isZumub 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
            }}
          >
            {isZumub && (
              <div style={{
                position: 'absolute',
                top: '-0.5rem',
                left: '0.75rem',
                padding: '0.15rem 0.5rem',
                background: '#10b981',
                borderRadius: '4px',
                fontSize: '0.6rem',
                fontWeight: '800',
                color: '#000',
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}>
                Code: KERSTEN
              </div>
            )}
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.25rem'
              }}>
                {product.store}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {product.product_name}
              </div>
            </div>

            <div style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '800',
              color: isZumub ? '#10b981' : '#9333ea',
              flexShrink: 0,
              marginLeft: '1rem'
            }}>
              €{product.price.toFixed(2)}
            </div>
          </a>
        )
      })}

      {/* Coach Recommendation */}
      <div style={{
        marginTop: '1rem',
        padding: '0.875rem',
        background: 'rgba(147, 51, 234, 0.06)',
        border: '1px solid rgba(147, 51, 234, 0.12)',
        borderRadius: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.625rem'
        }}>
          <Info size={14} style={{ 
            color: '#a855f7', 
            flexShrink: 0, 
            marginTop: '0.15rem' 
          }} />
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(168, 85, 247, 0.9)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#a855f7' }}>Tip van Kersten:</strong> Ik haal mijn supplementen bij Zumub met code <span style={{
              fontWeight: '700',
              fontFamily: 'monospace'
            }}>KERSTEN</span>, maar op veel plekken zijn prima supplementen te krijgen. Bij twijfel kun je altijd via WhatsApp contact met me opnemen!
          </div>
        </div>
      </div>
    </div>
  )
}
