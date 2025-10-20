import { useState } from 'react'
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '0' : '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: isMobile ? '100%' : '800px',
        width: '100%',
        maxHeight: isMobile ? '100vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: isMobile ? 'slideUp 0.3s ease' : 'scaleIn 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {localLead.first_name} {localLead.last_name}
            </h2>
            <p style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {localLead.email}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
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
              minWidth: '44px',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: isMobile ? '1rem' : '1.25rem',
          paddingBottom: '0',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                background: activeTab === tab.id
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: activeTab === tab.id
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: activeTab === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: activeTab === tab.id ? '600' : '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              <tab.icon size={isMobile ? 16 : 18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
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
