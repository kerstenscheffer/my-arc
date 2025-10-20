import useIsMobile from '../../../hooks/useIsMobile'
import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
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
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
      zIndex: 50,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: isMobile ? '24px 24px 0 0' : '20px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        padding: isMobile ? '1.25rem' : '1.75rem',
        maxWidth: isMobile ? '100%' : '480px',
        width: '100%',
        maxHeight: isMobile ? '85vh' : 'auto',
        overflowY: 'auto',
        boxShadow: '0 -10px 40px rgba(139, 92, 246, 0.1)',
        animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleIn 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '1rem' : '1.25rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '0.5rem' : '0.75rem' 
          }}>
            <div style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <Sparkles size={isMobile ? 18 : 20} color="#fff" />
            </div>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '700',
              color: '#fff',
              margin: 0
            }}>
              Bonus Call
            </h3>
          </div>
          <button
            onClick={() => setShowRequestModal(false)}
            style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease',
              minWidth: '44px',
              minHeight: '44px'
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={isMobile ? 18 : 20} color="rgba(255, 255, 255, 0.6)" />
          </button>
        </div>

        {/* Info Box - Compacter */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          borderLeft: '3px solid #8b5cf6',
          padding: isMobile ? '0.75rem' : '0.9rem',
          borderRadius: '8px',
          marginBottom: isMobile ? '1rem' : '1.25rem'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            lineHeight: '1.4',
            margin: 0
          }}>
            <strong>Wanneer aanvragen?</strong><br/>
            • Vastgelopen met specifiek probleem<br/>
            • Belangrijke beslissing<br/>
            • Extra motivatie nodig
          </p>
        </div>
        
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.25rem' }}>
          {/* Reason */}
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.4rem'
            }}>
              Waarom extra call? *
            </label>
            <textarea
              value={requestData.reason}
              onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
              rows={3}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.9rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                resize: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                minHeight: '80px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
              }}
              placeholder="Kort beschrijven..."
            />
          </div>

          {/* Date and Urgency Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
            gap: isMobile ? '0.75rem' : '1rem' 
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.4rem'
              }}>
                Voorkeursdatum
              </label>
              <input
                type="date"
                value={requestData.preferred_date}
                onChange={(e) => setRequestData({...requestData, preferred_date: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.85rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontFamily: 'inherit',
                  minHeight: '44px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.4rem'
              }}>
                Urgentie
              </label>
              <select
                value={requestData.urgency}
                onChange={(e) => setRequestData({...requestData, urgency: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.85rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  minHeight: '44px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                }}
              >
                <option value="normal" style={{ background: '#1a1a1a' }}>Normaal</option>
                <option value="high" style={{ background: '#1a1a1a' }}>Hoog</option>
                <option value="urgent" style={{ background: '#1a1a1a' }}>Urgent</option>
              </select>
            </div>
          </div>

          {/* Time preference */}
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.4rem'
            }}>
              Voorkeurstijd
            </label>
            <input
              type="text"
              value={requestData.preferred_time}
              onChange={(e) => setRequestData({...requestData, preferred_time: e.target.value})}
              placeholder="Bijv: ochtend, na 18:00"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.85rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontFamily: 'inherit',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          marginTop: isMobile ? '1.25rem' : '1.5rem'
        }}>
          <button
            onClick={() => setShowRequestModal(false)}
            style={{
              flex: 1,
              padding: isMobile ? '0.85rem' : '0.95rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '48px'
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Annuleren
          </button>
          <button
            onClick={submitCallRequest}
            disabled={!requestData.reason}
            style={{
              flex: 1,
              padding: isMobile ? '0.85rem' : '0.95rem',
              background: !requestData.reason
                ? 'rgba(139, 92, 246, 0.2)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '700',
              cursor: !requestData.reason ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              boxShadow: !requestData.reason ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '48px',
              opacity: !requestData.reason ? 0.5 : 1
            }}
            onTouchStart={(e) => {
              if (isMobile && requestData.reason) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile && requestData.reason) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            Verstuur
          </button>
        </div>

        {/* Footer text */}
        <p style={{
          marginTop: isMobile ? '0.75rem' : '1rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'center'
        }}>
          Reactie binnen 24 uur
        </p>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
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
