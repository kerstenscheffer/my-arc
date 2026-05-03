import { useState, useEffect } from 'react'
import { X, User, MessageSquare, Activity, Zap } from 'lucide-react'
import InfoTab from './modal-tabs/InfoTab'
import NotesTab from './modal-tabs/NotesTab'
import ActivityTab from './modal-tabs/ActivityTab'
import ActionsTab from './modal-tabs/ActionsTab'

export default function LeadDetailsModal({
  lead,
  isOpen,
  onClose,
  onUpdate,
  leadService,
  coachId,
  isMobile
}) {
  const [activeTab, setActiveTab] = useState('info')
  const [localLead, setLocalLead] = useState(lead)

  // Sync localLead when lead prop changes
  useEffect(() => {
    if (lead) setLocalLead(lead)
  }, [lead])

  // CRITICAL: Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  if (!isOpen || !lead) return null

  const tabs = [
    { id: 'info', label: 'Info', icon: User },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'actions', label: 'Actions', icon: Zap }
  ]

  const handleLeadUpdate = async (updates) => {
    try {
      const updated = await leadService.updateLead(lead.id, updates)
      setLocalLead(updated)
      if (onUpdate) onUpdate(updated)
    } catch (error) {
      console.error('❌ Update failed:', error)
    }
  }

  const handleOverlayTouchMove = (e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault()
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '1rem',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
        touchAction: 'none'
      }}
      onTouchMove={handleOverlayTouchMove}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: isMobile ? '0' : '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: isMobile ? '100%' : '800px',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: isMobile ? 'slideUp 0.3s ease' : 'scaleIn 0.3s ease',
          overflow: 'hidden',
          touchAction: 'pan-y'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
          flexShrink: 0
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.35rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.2rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {localLead.first_name} {localLead.last_name}
            </h2>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {localLead.email}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
              marginLeft: '0.75rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs - Fixed */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.375rem' : '0.5rem',
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          overflowX: 'auto',
          flexShrink: 0,
          WebkitOverflowScrolling: 'touch'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: isMobile ? '0.6rem 0.875rem' : '0.75rem 1rem',
                background: activeTab === tab.id
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: activeTab === tab.id
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: activeTab === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: activeTab === tab.id ? '600' : '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                }
              }}
            >
              <tab.icon size={isMobile ? 15 : 16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content - Scrollable */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '0.875rem' : '1.25rem',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            overscrollBehavior: 'contain'
          }}
        >
          {activeTab === 'info' && (
            <InfoTab
              lead={localLead}
              onUpdate={handleLeadUpdate}
              isMobile={isMobile}
            />
          )}

          {activeTab === 'notes' && (
            <NotesTab
              lead={localLead}
              leadService={leadService}
              coachId={coachId}
              isMobile={isMobile}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTab
              lead={localLead}
              leadService={leadService}
              isMobile={isMobile}
            />
          )}

          {activeTab === 'actions' && (
            <ActionsTab
              lead={localLead}
              onUpdate={handleLeadUpdate}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { 
            transform: scale(0.95);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
