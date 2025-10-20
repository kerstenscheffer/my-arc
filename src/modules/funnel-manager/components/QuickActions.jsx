import React from 'react';
import { 
  Monitor, 
  Share2, 
  Smartphone, 
  Edit3, 
  Download,
  BarChart3,
  Zap,
  Globe
} from 'lucide-react';

export default function QuickActions({ 
  isMobile, 
  onAnalyticsDashboard,
  onBulkShare,
  onMobilePreview,
  onTemplateEditor,
  onExportData,
  onPerformanceCheck
}) {
  const quickActions = [
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      icon: Monitor,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.2)',
      action: onAnalyticsDashboard,
      description: 'Gedetailleerde funnel analytics'
    },
    {
      id: 'bulk-share',
      label: 'Bulk Share Links',
      icon: Share2,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      action: onBulkShare,
      description: 'Alle funnel links tegelijk delen'
    },
    {
      id: 'mobile-preview',
      label: 'Mobile Preview',
      icon: Smartphone,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
      action: onMobilePreview,
      description: 'Bekijk funnels op mobiel'
    },
    {
      id: 'template-editor',
      label: 'Template Editor',
      icon: Edit3,
      color: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.1)',
      borderColor: 'rgba(168, 85, 247, 0.2)',
      action: onTemplateEditor,
      description: 'Bewerk funnel templates'
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: Download,
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
      borderColor: 'rgba(6, 182, 212, 0.2)',
      action: onExportData,
      description: 'Download analytics data'
    },
    {
      id: 'performance',
      label: 'Performance Check',
      icon: Zap,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.2)',
      action: onPerformanceCheck,
      description: 'Controleer funnel snelheid'
    }
  ];

  // Show fewer actions on mobile
  const displayActions = isMobile ? quickActions.slice(0, 4) : quickActions;

  return (
    <div style={{
      marginTop: '2rem',
      padding: isMobile ? '1.25rem' : '1.5rem',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(17, 17, 17, 0.3) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h4 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '700',
              color: '#10b981',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <BarChart3 size={isMobile ? 18 : 20} />
              Quick Actions
            </h4>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: '0.25rem 0 0 0'
            }}>
              Snelle toegang tot belangrijke funnel tools
            </p>
          </div>

          {isMobile && (
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}
              onClick={() => alert('Alle acties tonen...')}
            >
              <Globe size={14} />
              Meer
            </button>
          )}
        </div>

        {/* Actions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {displayActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              style={{
                background: `linear-gradient(135deg, ${action.bgColor} 0%, transparent 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${action.borderColor}`,
                borderRadius: '12px',
                padding: isMobile ? '1rem 0.75rem' : '1.25rem 1rem',
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                gap: isMobile ? '0.5rem' : '0.75rem',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                touchAction: 'manipulation',
                minHeight: '44px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: isMobile ? 'center' : 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.background = `linear-gradient(135deg, ${action.bgColor}40 0%, ${action.bgColor}20 100%)`;
                  e.currentTarget.style.borderColor = `${action.color}60`;
                  e.currentTarget.style.boxShadow = `0 10px 25px ${action.color}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = `linear-gradient(135deg, ${action.bgColor} 0%, transparent 100%)`;
                  e.currentTarget.style.borderColor = action.borderColor;
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.background = `linear-gradient(135deg, ${action.bgColor}60 0%, ${action.bgColor}30 100%)`;
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  setTimeout(() => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = `linear-gradient(135deg, ${action.bgColor} 0%, transparent 100%)`;
                  }, 150);
                }
              }}
            >
              {/* Icon container with color accent */}
              <div style={{
                width: isMobile ? '32px' : '40px',
                height: isMobile ? '32px' : '40px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${action.color}20 0%, ${action.color}10 100%)`,
                border: `1px solid ${action.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <action.icon 
                  size={isMobile ? 16 : 18} 
                  color={action.color}
                />
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMobile ? 'center' : 'flex-start',
                gap: '0.25rem'
              }}>
                <span style={{
                  fontWeight: '600',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  lineHeight: '1.2'
                }}>
                  {action.label}
                </span>
                
                {!isMobile && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: '1.3'
                  }}>
                    {action.description}
                  </span>
                )}
              </div>

              {/* Hover effect indicator */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${action.color}20, transparent)`,
                transition: 'left 0.6s ease',
                pointerEvents: 'none'
              }} />
            </button>
          ))}
        </div>

        {/* Bottom stats or tips */}
        {!isMobile && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              💡 <strong>Pro Tip:</strong> Gebruik Analytics Dashboard voor gedetailleerde conversie insights
            </div>
            
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 2s infinite'
              }} />
              Alle systemen operationeel
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
