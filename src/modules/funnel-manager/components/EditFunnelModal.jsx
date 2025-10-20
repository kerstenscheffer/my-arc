import React, { useState, useEffect } from 'react';
import { X, Save, Code, Eye, Loader2, Copy } from 'lucide-react';

export default function EditFunnelModal({ 
  isOpen, 
  onClose, 
  onSave, 
  funnel, 
  isMobile 
}) {
  const [htmlContent, setHtmlContent] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && funnel) {
      setHtmlContent(funnel.html_content || '');
      setError('');
      setShowPreview(false);
    }
  }, [isOpen, funnel]);

  const handleSave = async () => {
    if (!htmlContent.trim()) {
      setError('HTML content is verplicht');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await onSave(funnel.id, { html_content: htmlContent });
      onClose();
    } catch (err) {
      setError('Fout bij opslaan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyFunnelUrl = () => {
    const url = `https://${funnel.url}`;
    navigator.clipboard.writeText(url);
    alert('Funnel URL gekopieerd!');
  };

  const insertTemplate = () => {
    const template = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${funnel.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto;
            padding: 2rem; 
        }
        .hero { 
            text-align: center; 
            padding: 4rem 2rem;
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            margin-bottom: 3rem;
        }
        h1 { 
            font-size: 3.5rem; 
            margin-bottom: 1rem; 
            font-weight: 900;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .subtitle { 
            font-size: 1.8rem; 
            margin-bottom: 2rem; 
            opacity: 0.9;
        }
        .cta-button { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white; 
            padding: 1.5rem 3rem; 
            border: none; 
            border-radius: 50px; 
            font-size: 1.3rem; 
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }
        .cta-button:hover { 
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .feature h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #10b981;
        }
        @media (max-width: 768px) {
            h1 { font-size: 2.5rem; }
            .subtitle { font-size: 1.3rem; }
            .hero { padding: 2rem 1rem; }
            .container { padding: 1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>${funnel.name}</h1>
            <p class="subtitle">Transform je leven in slechts 8 weken</p>
            <button class="cta-button" onclick="handleConversion()">
                Start Jouw Transformatie - €497
            </button>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>🔥 Persoonlijke Begeleiding</h3>
                <p>1-op-1 coaching van gecertificeerde trainers</p>
            </div>
            <div class="feature">
                <h3>💪 Workout Plans</h3>
                <p>Aangepaste workouts voor jouw niveau</p>
            </div>
            <div class="feature">
                <h3>🥗 Voeding Gids</h3>
                <p>Complete meal planning en recepten</p>
            </div>
        </div>
    </div>
    
    <script>
        function handleConversion() {
            // Track conversion
            fetch('/api/track-conversion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnel_id: '${funnel.id}' })
            });
            
            alert('Bedankt voor je interesse! We nemen contact op.');
        }
    </script>
</body>
</html>`;
    setHtmlContent(template);
  };

  if (!isOpen || !funnel) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0.5rem' : '1rem'
    }}>
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '16px' : '20px',
        width: '100%',
        height: isMobile ? '95vh' : '90vh',
        maxWidth: isMobile ? 'none' : '1200px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              Bewerk Funnel
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}>
              {funnel.name}
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={copyFunnelUrl}
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: isMobile ? '0.5rem' : '0.75rem',
                color: '#3b82f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                touchAction: 'manipulation',
                minHeight: '40px'
              }}
            >
              <Copy size={16} />
              {!isMobile && 'URL'}
            </button>

            <button
              onClick={insertTemplate}
              style={{
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: isMobile ? '0.5rem' : '0.75rem',
                color: '#a855f7',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                touchAction: 'manipulation',
                minHeight: '40px'
              }}
            >
              <Code size={16} />
              {!isMobile && 'Template'}
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                background: showPreview 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: isMobile ? '0.5rem' : '0.75rem',
                color: '#10b981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                touchAction: 'manipulation',
                minHeight: '40px'
              }}
            >
              <Eye size={16} />
              {!isMobile && (showPreview ? 'Code' : 'Preview')}
            </button>

            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                minHeight: '40px',
                minWidth: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {showPreview ? (
            <iframe
              srcDoc={htmlContent}
              style={{
                flex: 1,
                border: 'none',
                background: '#fff'
              }}
              title="Funnel Preview"
            />
          ) : (
            <textarea
              value={htmlContent}
              onChange={(e) => {
                setHtmlContent(e.target.value);
                setError('');
              }}
              placeholder="Plak hier je HTML code..."
              style={{
                flex: 1,
                background: '#1a1a1a',
                border: 'none',
                color: '#fff',
                padding: isMobile ? '1rem' : '1.5rem',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontFamily: 'Monaco, "Lucida Console", monospace',
                lineHeight: '1.5',
                resize: 'none',
                outline: 'none',
                touchAction: 'manipulation'
              }}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '1rem',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              opacity: isSaving ? 0.5 : 1
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || !htmlContent.trim()}
            style={{
              flex: 1,
              padding: '1rem',
              background: (!htmlContent.trim() || isSaving) 
                ? 'rgba(16, 185, 129, 0.3)' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: (!htmlContent.trim() || isSaving) ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '48px'
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Opslaan...
              </>
            ) : (
              <>
                <Save size={18} />
                Funnel Opslaan
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
