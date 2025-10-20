import React, { useState } from 'react';
import { 
  Eye, 
  Copy, 
  QrCode, 
  Settings, 
  ExternalLink, 
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Edit3,
  BarChart3
} from 'lucide-react';

export default function FunnelCard({ 
  funnel, 
  isMobile, 
  onPreview, 
  onCopy, 
  onQRCode, 
  onEdit, 
  onDelete, 
  onStatusChange 
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'draft': return '#f59e0b';
      case 'paused': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Actief';
      case 'draft': return 'Concept';
      case 'paused': return 'Gepauzeerd';
      default: return 'Onbekend';
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000) {
      return `€${(amount / 1000).toFixed(1)}K`;
    }
    return `€${amount}`;
  };

  const formatNumber = (num) => {
    return num.toLocaleString('nl-NL');
  };

  const handleStatusToggle = () => {
    const newStatus = funnel.status === 'active' ? 'paused' : 'active';
    onStatusChange(funnel.id, newStatus);
  };

  const handleCopyUrl = () => {
    const fullUrl = `https://${funnel.url}`;
    navigator.clipboard.writeText(fullUrl);
    onCopy(fullUrl);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.9) 0%, rgba(17, 17, 17, 0.7) 100%)',
        backdropFilter: 'blur(20px)',
        border: isHovered 
          ? `1px solid ${getStatusColor(funnel.status)}40`
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        transform: isHovered && !isMobile ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered && !isMobile 
          ? `0 15px 35px rgba(0, 0, 0, 0.3), 0 0 0 1px ${getStatusColor(funnel.status)}20`
          : '0 4px 15px rgba(0, 0, 0, 0.2)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Indicator & Menu */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        <div style={{
          background: getStatusColor(funnel.status),
          color: '#fff',
          padding: '0.4rem 0.8rem',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#fff',
            animation: funnel.status === 'active' ? 'pulse 2s infinite' : 'none'
          }} />
          {getStatusText(funnel.status)}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '32px',
              minWidth: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            <MoreVertical size={16} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'rgba(17, 17, 17, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.5rem',
              minWidth: '160px',
              zIndex: 10,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}>
              <button
                onClick={() => {
                  onEdit(funnel.id);
                  setIsMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Edit3 size={14} />
                Bewerken
              </button>
              
              <button
                onClick={() => {
                  handleStatusToggle();
                  setIsMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {funnel.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                {funnel.status === 'active' ? 'Pauzeren' : 'Activeren'}
              </button>
              
              <button
                onClick={() => {
                  if (confirm('Weet je zeker dat je deze funnel wilt verwijderen?')) {
                    onDelete(funnel.id);
                  }
                  setIsMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Trash2 size={14} />
                Verwijderen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Funnel Info */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '700',
          color: '#fff',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.3'
        }}>
          {funnel.name}
        </h3>
        <div style={{
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'monospace',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0.5rem',
          borderRadius: '6px',
          wordBreak: 'break-all',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {funnel.url}
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          padding: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'rgba(255, 255, 255, 0.6)', 
            marginBottom: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Views
          </div>
          <div style={{ 
            fontSize: isMobile ? '1.1rem' : '1.25rem', 
            fontWeight: '700', 
            color: '#10b981' 
          }}>
            {formatNumber(funnel.views || 0)}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px',
          padding: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'rgba(255, 255, 255, 0.6)', 
            marginBottom: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Conversies
          </div>
          <div style={{ 
            fontSize: isMobile ? '1.1rem' : '1.25rem', 
            fontWeight: '700', 
            color: '#3b82f6' 
          }}>
            {funnel.conversions || 0}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: '8px',
          padding: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'rgba(255, 255, 255, 0.6)', 
            marginBottom: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Revenue
          </div>
          <div style={{ 
            fontSize: isMobile ? '1.1rem' : '1.25rem', 
            fontWeight: '700', 
            color: '#a855f7' 
          }}>
            {formatCurrency(funnel.revenue || 0)}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '8px',
          padding: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'rgba(255, 255, 255, 0.6)', 
            marginBottom: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Conv. Rate
          </div>
          <div style={{ 
            fontSize: isMobile ? '1.1rem' : '1.25rem', 
            fontWeight: '700', 
            color: '#f59e0b' 
          }}>
            {funnel.conversionRate || 0}%
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <button
          onClick={() => onPreview(funnel)}
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: isMobile ? '0.75rem 0.5rem' : '0.75rem',
            color: '#10b981',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Eye size={16} />
          {!isMobile && 'Preview'}
        </button>

        <button
          onClick={handleCopyUrl}
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: isMobile ? '0.75rem 0.5rem' : '0.75rem',
            color: '#3b82f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Copy size={16} />
          {!isMobile && 'Copy'}
        </button>

        <button
          onClick={() => onQRCode(funnel)}
          style={{
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            padding: isMobile ? '0.75rem 0.5rem' : '0.75rem',
            color: '#f59e0b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <QrCode size={16} />
          {!isMobile && 'QR'}
        </button>

        <button
          onClick={() => window.open(`https://${funnel.url}`, '_blank')}
          style={{
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            padding: isMobile ? '0.75rem 0.5rem' : '0.75rem',
            color: '#a855f7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ExternalLink size={16} />
          {!isMobile && 'Open'}
        </button>
      </div>

      {/* Last Updated */}
      <div style={{
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <BarChart3 size={12} />
        Laatst bijgewerkt: {funnel.lastUpdated}
      </div>

      {/* Click outside to close menu */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
