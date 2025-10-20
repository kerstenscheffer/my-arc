// src/modules/spots/SpotsManager.jsx
import { useState, useEffect } from 'react'
import { Plus, Minus, Users, Lock, Unlock, Package } from 'lucide-react'

export default function SpotsManager({ db, compact = false }) {
  const [activeTab, setActiveTab] = useState('client') // 'client', 'main_offer', or 'affiliate'
  const [clientSpots, setClientSpots] = useState(null)
  const [mainOfferSpots, setMainOfferSpots] = useState(null)
  const [affiliateSpots, setAffiliateSpots] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [maxValue, setMaxValue] = useState('')
  const isMobile = window.innerWidth <= 768
  
  // Current spots based on active tab
  const spots = activeTab === 'affiliate' 
    ? affiliateSpots 
    : activeTab === 'main_offer' 
    ? mainOfferSpots 
    : clientSpots
  
  useEffect(() => {
    loadAllSpots()
    
    // Subscribe to real-time updates
    const spotsService = db.getSpotsService()
    
    // Client spots subscription
    const clientSub = spotsService.subscribeToSpots((newData) => {
      setClientSpots(newData)
    })
    
    // Main offer spots subscription
    const mainOfferSub = spotsService.subscribeToMainOfferSpots((newData) => {
      setMainOfferSpots(newData)
    })
    
    // Affiliate spots subscription
    const affiliateSub = spotsService.subscribeToAffiliateSpots((newData) => {
      setAffiliateSpots(newData)
    })
    
    return () => {
      clientSub.unsubscribe()
      mainOfferSub.unsubscribe()
      affiliateSub.unsubscribe()
    }
  }, [db])
  
  // Update maxValue when spots change or tab switches
  useEffect(() => {
    if (spots) {
      setMaxValue(spots.max_spots)
    }
  }, [spots])
  
  const loadAllSpots = async () => {
    setLoading(true)
    const spotsService = db.getSpotsService()
    
    // Load all three types
    const [clientData, mainOfferData, affiliateData] = await Promise.all([
      spotsService.getCurrentSpots(),
      spotsService.getMainOfferSpots(),
      spotsService.getAffiliateSpots()
    ])
    
    setClientSpots(clientData)
    setMainOfferSpots(mainOfferData)
    setAffiliateSpots(affiliateData)
    setMaxValue(clientData?.max_spots || 10)
    setLoading(false)
  }
  
  const handleIncrement = async () => {
    if (updating) return
    setUpdating(true)
    const spotsService = db.getSpotsService()
    const updated = await spotsService.updateSpots('increment', activeTab)
    if (updated) {
      if (activeTab === 'affiliate') {
        setAffiliateSpots(updated)
      } else if (activeTab === 'main_offer') {
        setMainOfferSpots(updated)
      } else {
        setClientSpots(updated)
      }
    }
    setUpdating(false)
  }
  
  const handleDecrement = async () => {
    if (updating) return
    setUpdating(true)
    const spotsService = db.getSpotsService()
    const updated = await spotsService.updateSpots('decrement', activeTab)
    if (updated) {
      if (activeTab === 'affiliate') {
        setAffiliateSpots(updated)
      } else if (activeTab === 'main_offer') {
        setMainOfferSpots(updated)
      } else {
        setClientSpots(updated)
      }
    }
    setUpdating(false)
  }
  
  const handleSetMax = async () => {
    const newMax = parseInt(maxValue)
    if (isNaN(newMax) || newMax < 1) return
    
    setUpdating(true)
    const spotsService = db.getSpotsService()
    const updated = await spotsService.setMaxSpots(newMax, activeTab)
    if (updated) {
      if (activeTab === 'affiliate') {
        setAffiliateSpots(updated)
      } else if (activeTab === 'main_offer') {
        setMainOfferSpots(updated)
      } else {
        setClientSpots(updated)
      }
    }
    setUpdating(false)
  }
  
  const toggleActive = async () => {
    setUpdating(true)
    const spotsService = db.getSpotsService()
    const updated = await spotsService.toggleActive(activeTab)
    if (updated) {
      if (activeTab === 'affiliate') {
        setAffiliateSpots(updated)
      } else if (activeTab === 'main_offer') {
        setMainOfferSpots(updated)
      } else {
        setClientSpots(updated)
      }
    }
    setUpdating(false)
  }
  
  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        background: 'rgba(17, 17, 17, 0.8)',
        borderRadius: isMobile ? '16px' : '20px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#10b981' }}>Loading spots...</div>
      </div>
    )
  }
  
  const percentage = spots ? (spots.current_spots / spots.max_spots) * 100 : 0
  const isFull = spots?.current_spots >= spots?.max_spots
  
  // Compact version for inline rendering
  if (compact) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '0.25rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px'
        }}>
          <button
            onClick={() => setActiveTab('client')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: activeTab === 'client' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              border: activeTab === 'client' ? '1px solid #10b981' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === 'client' ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <Users size={14} />
            Clients
          </button>
          
          <button
            onClick={() => setActiveTab('main_offer')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: activeTab === 'main_offer' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
              border: activeTab === 'main_offer' ? '1px solid #f97316' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === 'main_offer' ? '#f97316' : 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <Package size={14} />
            Main
          </button>
          
          <button
            onClick={() => setActiveTab('affiliate')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: activeTab === 'affiliate' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              border: activeTab === 'affiliate' ? '1px solid #a855f7' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === 'affiliate' ? '#a855f7' : 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <Users size={14} />
            Affiliate
          </button>
        </div>
        
        {/* Compact Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            color: '#10b981',
            margin: 0
          }}>
            {activeTab === 'main_offer' ? 'Main Offer' : 'Client'} Spots
          </h3>
          
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: isFull ? '#ef4444' : '#10b981'
          }}>
            {spots?.current_spots || 0}/{spots?.max_spots || 10}
          </div>
        </div>
        
        {/* Max Spots Editor - Compact */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '0.5rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Max:
          </span>
          <input
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            style={{
              width: '60px',
              padding: '0.25rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              textAlign: 'center'
            }}
          />
          <button
            onClick={handleSetMax}
            disabled={parseInt(maxValue) === spots?.max_spots}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              borderRadius: '6px',
              color: '#10b981',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '600',
              cursor: parseInt(maxValue) === spots?.max_spots ? 'not-allowed' : 'pointer',
              opacity: parseInt(maxValue) === spots?.max_spots ? 0.5 : 1
            }}
          >
            Update
          </button>
        </div>
        
        {/* Compact Progress Bar */}
        <div style={{
          height: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: isFull 
              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            transition: 'width 0.5s ease'
          }} />
        </div>
        
        {/* Compact Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleDecrement}
            disabled={spots?.current_spots === 0 || updating}
            style={{
              padding: isMobile ? '0.625rem' : '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: spots?.current_spots === 0 ? 'not-allowed' : 'pointer',
              opacity: spots?.current_spots === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              minHeight: '44px'
            }}
          >
            <Minus size={16} />
            Verwijder
          </button>
          
          <button
            onClick={handleIncrement}
            disabled={isFull || updating}
            style={{
              padding: isMobile ? '0.625rem' : '0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              color: '#10b981',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: isFull ? 'not-allowed' : 'pointer',
              opacity: isFull ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              minHeight: '44px'
            }}
          >
            <Plus size={16} />
            Voeg toe
          </button>
        </div>
        
        {/* Status text */}
        <div style={{
          marginTop: '0.75rem',
          textAlign: 'center',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: isFull ? '#ef4444' : 'rgba(255, 255, 255, 0.7)'
        }}>
          {isFull ? 'VOLLEDIG VOLGEBOEKT' : `${spots?.max_spots - spots?.current_spots} plekken beschikbaar`}
        </div>
      </div>
    )
  }
  
  // Full version
  return (
    <div style={{
      padding: isMobile ? '1.5rem' : '2rem',
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: isMobile ? '20px' : '24px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '2rem',
        padding: '0.375rem',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => setActiveTab('client')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem' : '1rem',
            background: activeTab === 'client' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.15) 100%)'
              : 'transparent',
            border: activeTab === 'client' ? '2px solid #10b981' : '2px solid transparent',
            borderRadius: '10px',
            color: activeTab === 'client' ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={isMobile ? 16 : 18} />
          Client Spots
        </button>
        
        <button
          onClick={() => setActiveTab('main_offer')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem' : '1rem',
            background: activeTab === 'main_offer' 
              ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(249, 115, 22, 0.15) 100%)'
              : 'transparent',
            border: activeTab === 'main_offer' ? '2px solid #f97316' : '2px solid transparent',
            borderRadius: '10px',
            color: activeTab === 'main_offer' ? '#f97316' : 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Package size={isMobile ? 16 : 18} />
          Main Offer
        </button>
        
        <button
          onClick={() => setActiveTab('affiliate')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem' : '1rem',
            background: activeTab === 'affiliate' 
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0.15) 100%)'
              : 'transparent',
            border: activeTab === 'affiliate' ? '2px solid #a855f7' : '2px solid transparent',
            borderRadius: '10px',
            color: activeTab === 'affiliate' ? '#a855f7' : 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={isMobile ? 16 : 18} />
          Affiliate
        </button>
      </div>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {activeTab === 'main_offer' ? (
            <Package size={isMobile ? 24 : 28} color="#f97316" />
          ) : (
            <Users size={isMobile ? 24 : 28} color="#10b981" />
          )}
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            background: activeTab === 'affiliate'
              ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
              : activeTab === 'main_offer' 
              ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0
          }}>
            {activeTab === 'main_offer' ? 'Main Offer' : 'Client'} Spots Manager
          </h2>
        </div>
        
        <button
          onClick={toggleActive}
          style={{
            padding: isMobile ? '0.5rem' : '0.625rem',
            background: spots?.is_active 
              ? 'rgba(16, 185, 129, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${spots?.is_active ? '#10b981' : '#ef4444'}`,
            borderRadius: '10px',
            color: spots?.is_active ? '#10b981' : '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation'
          }}
        >
          {spots?.is_active ? <Unlock size={16} /> : <Lock size={16} />}
          {spots?.is_active ? 'Active' : 'Inactive'}
        </button>
      </div>
      
      {/* Current Status */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div style={{
          fontSize: isMobile ? '3rem' : '4rem',
          fontWeight: '800',
          textAlign: 'center',
          color: isFull ? '#ef4444' : activeTab === 'affiliate' ? '#a855f7' : activeTab === 'main_offer' ? '#f97316' : '#10b981',
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem'
        }}>
          {spots?.current_spots || 0}/{spots?.max_spots || 10}
        </div>
        
        <div style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          {isFull ? '🔴 VOLLEDIG VOLGEBOEKT' : `${spots?.max_spots - spots?.current_spots} plekken beschikbaar`}
        </div>
        
        {/* Progress Bar */}
        <div style={{
          height: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: isFull 
              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
              : activeTab === 'affiliate'
              ? 'linear-gradient(90deg, #a855f7 0%, #9333ea 100%)'
              : activeTab === 'main_offer'
              ? 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)'
              : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            transition: 'width 0.5s ease',
            boxShadow: isFull
              ? '0 0 20px rgba(239, 68, 68, 0.5)'
              : activeTab === 'affiliate'
              ? '0 0 20px rgba(168, 85, 247, 0.5)'
              : activeTab === 'main_offer'
              ? '0 0 20px rgba(249, 115, 22, 0.5)'
              : '0 0 20px rgba(16, 185, 129, 0.5)'
          }} />
        </div>
      </div>
      
      {/* Max Spots Editor - Always Visible */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <span style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600'
          }}>
            Maximum aantal plekken instellen:
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: `1px solid ${activeTab === 'affiliate' ? 'rgba(168, 85, 247, 0.3)' : activeTab === 'main_offer' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
          }}>
            <label style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              minWidth: 'fit-content'
            }}>
              Max:
            </label>
            <input
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              min="1"
              max="100"
              style={{
                flex: 1,
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${activeTab === 'affiliate' ? 'rgba(168, 85, 247, 0.2)' : activeTab === 'main_offer' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '700',
                textAlign: 'center',
                minWidth: '60px'
              }}
            />
          </div>
          
          <button
            onClick={handleSetMax}
            disabled={parseInt(maxValue) === spots?.max_spots || !maxValue || parseInt(maxValue) < 1}
            style={{
              padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
              background: activeTab === 'affiliate'
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)'
                : activeTab === 'main_offer'
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
              border: `1px solid ${activeTab === 'affiliate' ? '#a855f7' : activeTab === 'main_offer' ? '#f97316' : '#10b981'}`,
              borderRadius: '10px',
              color: activeTab === 'affiliate' ? '#a855f7' : activeTab === 'main_offer' ? '#f97316' : '#10b981',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '600',
              cursor: parseInt(maxValue) === spots?.max_spots || !maxValue ? 'not-allowed' : 'pointer',
              opacity: parseInt(maxValue) === spots?.max_spots || !maxValue ? 0.5 : 1,
              transition: 'all 0.3s ease',
              minHeight: '44px'
            }}
          >
            Update
          </button>
        </div>
        
        {/* Helper text */}
        <div style={{
          marginTop: '0.75rem',
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          Huidige: {spots?.max_spots || 0} plekken • Bezet: {spots?.current_spots || 0} • Beschikbaar: {(spots?.max_spots || 0) - (spots?.current_spots || 0)}
        </div>
        
        {/* Warning if reducing below current */}
        {parseInt(maxValue) < spots?.current_spots && maxValue && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: '#ef4444'
          }}>
            ⚠️ Let op: Er zijn al {spots?.current_spots} plekken bezet!
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <button
          onClick={handleDecrement}
          disabled={spots?.current_spots === 0 || updating || !spots?.is_active}
          style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: isMobile ? '12px' : '16px',
            color: '#ef4444',
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '600',
            cursor: spots?.current_spots === 0 || !spots?.is_active ? 'not-allowed' : 'pointer',
            opacity: spots?.current_spots === 0 || !spots?.is_active ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '48px'
          }}
          onTouchStart={(e) => {
            if (isMobile && spots?.current_spots > 0 && spots?.is_active) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <Minus size={isMobile ? 20 : 24} />
          Verwijder {activeTab === 'main_offer' ? 'Offer' : 'Client'}
        </button>
        
        <button
          onClick={handleIncrement}
          disabled={isFull || updating || !spots?.is_active}
          style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: isMobile ? '12px' : '16px',
            color: '#10b981',
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '600',
            cursor: isFull || !spots?.is_active ? 'not-allowed' : 'pointer',
            opacity: isFull || !spots?.is_active ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '48px'
          }}
          onTouchStart={(e) => {
            if (isMobile && !isFull && spots?.is_active) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <Plus size={isMobile ? 20 : 24} />
          Voeg {activeTab === 'main_offer' ? 'Offer' : 'Client'} Toe
        </button>
      </div>
      
      {/* Last Updated */}
      {spots?.last_updated && (
        <div style={{
          textAlign: 'center',
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          Laatst bijgewerkt: {new Date(spots.last_updated).toLocaleString('nl-NL')}
        </div>
      )}
    </div>
  )
}
