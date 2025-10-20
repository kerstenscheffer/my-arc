import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';

export default function CreateFunnelModal({ isOpen, onClose, onCreate, isMobile }) {
  const [funnelName, setFunnelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // FIXED: Updated base URL
  const baseURL = 'workapp-5w5himg7l-myarc.vercel.app';

  const handleCreate = async () => {
    if (!funnelName.trim()) {
      setError('Funnel naam is verplicht');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      
      const funnelData = {
        name: funnelName.trim(),
        html_content: `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${funnelName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container { 
            max-width: 800px; 
            padding: 2rem; 
            text-align: center; 
            background: rgba(0,0,0,0.2);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { 
            font-size: 3rem; 
            margin-bottom: 1rem; 
            font-weight: 800;
        }
        p { 
            font-size: 1.5rem; 
            margin-bottom: 2rem; 
            opacity: 0.9;
        }
        .btn { 
            background: #10b981; 
            color: white; 
            padding: 1rem 2rem; 
            border: none; 
            border-radius: 10px; 
            font-size: 1.2rem; 
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn:hover { 
            background: #059669; 
            transform: translateY(-2px);
        }
        @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            p { font-size: 1.2rem; }
            .container { padding: 1.5rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${funnelName}</h1>
        <p>Welkom bij onze exclusieve funnel pagina</p>
        <button class="btn" onclick="trackConversion()">
            Start Nu
        </button>
    </div>
    
    <script>
        function trackConversion() {
            // Track conversion event
            if (window.trackConversion) {
                window.trackConversion();
            }
            alert('Bedankt voor je interesse! We nemen contact met je op.');
        }
    </script>
</body>
</html>`
      };

      await onCreate(funnelData);
      setFunnelName('');
      onClose();
    } catch (err) {
      setError('Fout bij aanmaken funnel: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate();
    }
  };

  // Generate preview slug
  const generatePreviewSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
        borderRadius: '20px',
        padding: isMobile ? '2rem' : '2.5rem',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isCreating}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            minHeight: '40px',
            minWidth: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!isCreating) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Plus size={28} color="#fff" />
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Nieuwe Funnel Maken
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Voer een naam in voor je nieuwe funnel
          </p>
        </div>

        {/* Form */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Funnel Naam
          </label>
          
          <input
            type="text"
            value={funnelName}
            onChange={(e) => {
              setFunnelName(e.target.value);
              setError(''); // Clear error on input
            }}
            onKeyPress={handleKeyPress}
            placeholder="bijv. 8-Week Transformatie Challenge"
            disabled={isCreating}
            autoFocus
            style={{
              width: '100%',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: error ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '500',
              outline: 'none',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation'
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.border = '2px solid #10b981';
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.1)';
              }
            }}
          />
          
          {error && (
            <div style={{
              color: '#ef4444',
              fontSize: '0.85rem',
              marginTop: '0.5rem',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Preview Info - FIXED URL */}
        {funnelName.trim() && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.5rem'
            }}>
              URL Preview:
            </div>
            <div style={{
              color: '#10b981',
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              fontWeight: '600',
              wordBreak: 'break-all'
            }}>
              {baseURL}/funnel/{generatePreviewSlug(funnelName)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={onClose}
            disabled={isCreating}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              opacity: isCreating ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isCreating) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleCreate}
            disabled={isCreating || !funnelName.trim()}
            style={{
              flex: 1,
              padding: '1rem',
              background: (!funnelName.trim() || isCreating) 
                ? 'rgba(16, 185, 129, 0.3)' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: (!funnelName.trim() || isCreating) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              if (funnelName.trim() && !isCreating) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isCreating ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Maken...
              </>
            ) : (
              <>
                <Plus size={18} />
                Funnel Maken
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
