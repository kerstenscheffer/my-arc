// src/pages/PaymentSuccess.jsx
import { useState, useEffect } from 'react';
import { CheckCircle, Mail, MessageCircle, ArrowRight, Copy, Check } from 'lucide-react';

function PaymentSuccess() {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const isMobile = window.innerWidth <= 768;
  
  // Get session ID from URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  
  useEffect(() => {
    // Simulate loading session data
    setTimeout(() => {
      setLoading(false);
      // In productie: fetch session data van je API
      setSessionData({
        customerName: 'John Doe',
        amount: 299,
        plan: 'Standard'
      });
    }, 1500);
  }, [sessionId]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@myarc.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#fff'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div>Betaling verwerken...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        animation: 'slideUp 0.5s ease'
      }}>
        {/* Success Card */}
        <div style={{
          background: 'rgba(17, 17, 17, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: isMobile ? '2rem' : '3rem',
          border: '2px solid #10b981',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'scaleIn 0.5s ease 0.3s both'
          }}>
            <CheckCircle size={40} color="#fff" />
          </div>

          {/* Success Message */}
          <h1 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            animation: 'fadeIn 0.5s ease 0.4s both'
          }}>
            Betaling Succesvol!
          </h1>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem',
            lineHeight: '1.6',
            animation: 'fadeIn 0.5s ease 0.5s both'
          }}>
            Welkom bij MY ARC! Je transformatie begint nu. 
            Check je email voor je login gegevens.
          </p>

          {/* Order Details */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            animation: 'fadeIn 0.5s ease 0.6s both'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Plan:</span>
              <span style={{ color: '#fff', fontWeight: '600' }}>
                {sessionData?.plan || 'Standard'} Package
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Bedrag:</span>
              <span style={{ color: '#fff', fontWeight: '600' }}>
                €{sessionData?.amount || '299'}
              </span>
            </div>
            {sessionId && (
              <div style={{
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)',
                wordBreak: 'break-all'
              }}>
                Transactie: {sessionId.substring(0, 30)}...
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div style={{
            textAlign: 'left',
            animation: 'fadeIn 0.5s ease 0.7s both'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '1rem'
            }}>
              Wat gebeurt er nu?
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Mail size={20} color="#10b981" style={{ marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#fff' }}>1. Check je email</strong>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem'
                  }}>
                    Login gegevens komen binnen 5 minuten
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <MessageCircle size={20} color="#10b981" style={{ marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#fff' }}>2. WhatsApp contact</strong>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem'
                  }}>
                    Je coach neemt binnen 24 uur contact op
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <ArrowRight size={20} color="#10b981" style={{ marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#fff' }}>3. Start je journey</strong>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem'
                  }}>
                    Log in en begin met je eerste workout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexDirection: isMobile ? 'column' : 'row',
          animation: 'fadeIn 0.5s ease 0.8s both'
        }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)';
            }}
          >
            Naar Dashboard
          </button>

          <button
            onClick={handleCopyEmail}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            {copied ? (
              <>
                <Check size={18} />
                Gekopieerd!
              </>
            ) : (
              <>
                <Copy size={18} />
                support@myarc.com
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '0.875rem',
          animation: 'fadeIn 0.5s ease 0.9s both'
        }}>
          Hulp nodig? Email support@myarc.com of WhatsApp +31 6 12345678
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;
