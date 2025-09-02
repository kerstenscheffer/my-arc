import useIsMobile from '../../../hooks/useIsMobile'
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import CallPlanningService from '../CallPlanningService';

export default function RequestModal({ setShowRequestModal, clientInfo, plans, loadCallData }) {
  const isMobile = useIsMobile();
  const [requestData, setRequestData] = useState({
    reason: '',
    preferred_date: '',
    preferred_time: '',
    urgency: 'normal'
  });

  const submitCallRequest = async () => {
    if (!requestData.reason) {
      alert('Geef een reden op voor de extra call');
      return;
    }

    try {
      const activePlan = plans.find(p => p.status === 'active');
      if (!activePlan) {
        alert('Geen actief plan gevonden');
        return;
      }

      await CallPlanningService.submitCallRequest(clientInfo.id, activePlan.id, requestData);
      
      await loadCallData();
      setShowRequestModal(false);
      setRequestData({ reason: '', preferred_date: '', preferred_time: '', urgency: 'normal' });
      
      // Success celebration
      const celebration = document.createElement('div');
      celebration.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
          z-index: 10000;
          animation: slideIn 0.3s ease, slideOut 0.3s ease 2.5s;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          ✅ Bonus call aanvraag verstuurd!
        </div>
      `;
      document.body.appendChild(celebration);
      setTimeout(() => celebration.remove(), 3000);
      
    } catch (error) {
      console.error('Error submitting call request:', error);
      alert('Er ging iets mis bij het aanvragen van de bonus call');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 50,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        backgroundColor: '#1a1a1a',
        borderRadius: isMobile ? '20px' : '24px',
        border: '2px solid rgba(139, 92, 246, 0.3)',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 60px rgba(139, 92, 246, 0.1)',
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.35rem' : '1.75rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={isMobile ? 20 : 24} style={{ color: '#8b5cf6' }} />
            <span style={{ WebkitTextFillColor: '#fff', color: '#fff' }}>
              Bonus Call Aanvragen
            </span>
          </span>
          <button
            onClick={() => setShowRequestModal(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={isMobile ? 18 : 20} color="#fff" />
          </button>
        </h3>

        {/* Info Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderLeft: '3px solid #8b5cf6',
          padding: isMobile ? '0.875rem' : '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            lineHeight: '1.5'
          }}>
            💡 <strong>Wanneer een bonus call aanvragen?</strong><br/>
            • Als je vastloopt met een specifiek probleem<br/>
            • Bij belangrijke beslissingen in je traject<br/>
            • Voor extra motivatie of accountability
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '0.5rem'
            }}>
              Waarom heb je een extra call nodig? *
            </label>
            <textarea
              value={requestData.reason}
              onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
              rows={4}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                resize: 'vertical',
                transition: 'border-color 0.3s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.currentTarget.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }}
              placeholder="Beschrijf kort waarom deze extra ondersteuning belangrijk is..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.5rem'
              }}>
                Voorkeursdatum
              </label>
              <input
                type="date"
                value={requestData.preferred_date}
                onChange={(e) => setRequestData({...requestData, preferred_date: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.currentTarget.style.outline = 'none'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.5rem'
              }}>
                Urgentie
              </label>
              <select
                value={requestData.urgency}
                onChange={(e) => setRequestData({...requestData, urgency: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.currentTarget.style.outline = 'none'}
              >
                <option value="normal" style={{ background: '#1a1a1a' }}>🟢 Normaal</option>
                <option value="high" style={{ background: '#1a1a1a' }}>🟡 Hoog</option>
                <option value="urgent" style={{ background: '#1a1a1a' }}>🔴 Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '0.5rem'
            }}>
              Voorkeurstijd (optioneel)
            </label>
            <input
              type="text"
              value={requestData.preferred_time}
              onChange={(e) => setRequestData({...requestData, preferred_time: e.target.value})}
              placeholder="Bijv: ochtend, middag, na 18:00"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.currentTarget.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setShowRequestModal(false)}
            style={{
              flex: 1,
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: isMobile ? '0.85rem' : '1rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              if (!isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Annuleren
          </button>
          <button
            onClick={submitCallRequest}
            disabled={!requestData.reason}
            style={{
              flex: 1,
              padding: isMobile ? '0.875rem' : '1rem',
              background: !requestData.reason
                ? 'rgba(139, 92, 246, 0.3)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: '700',
              cursor: !requestData.reason ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontSize: isMobile ? '0.85rem' : '1rem',
              boxShadow: !requestData.reason ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.4)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (requestData.reason && !isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
              }
            }}
          >
            {requestData.reason && (
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%)',
                animation: 'pulse 2s infinite'
              }} />
            )}
            <span style={{ position: 'relative' }}>
              Verstuur Aanvraag
            </span>
          </button>
        </div>

        {/* Extra Info */}
        <p style={{
          marginTop: '1rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center'
        }}>
          Je coach neemt binnen 24 uur contact met je op
        </p>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideOut {
          to {
            transform: translateX(120%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
