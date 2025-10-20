import React, { useState, useEffect } from 'react';
import DatabaseService from '../services/DatabaseService';

export default function FunnelViewer({ slug }) {
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFunnel();
  }, [slug]);

  const loadFunnel = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get funnel by slug
      const { data, error: funnelError } = await DatabaseService.supabase
        .from('funnels')
        .select('*')
        .eq('slug', slug)
        // Remove status filter to show draft funnels too
        .single();

      if (funnelError) {
        if (funnelError.code === 'PGRST116') {
          setError('Funnel niet gevonden');
        } else {
          throw funnelError;
        }
        return;
      }

      if (!data) {
        setError('Funnel niet gevonden');
        return;
      }

      setFunnel(data);

      // Track page view
      try {
        await DatabaseService.trackFunnelEvent(data.id, 'view', {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || 'direct'
        });
      } catch (trackError) {
        console.warn('Could not track view:', trackError);
        // Don't fail the page load if tracking fails
      }

    } catch (err) {
      console.error('Load funnel failed:', err);
      setError('Fout bij laden van funnel');
    } finally {
      setLoading(false);
    }
  };

  // Track conversion (called from funnel HTML)
  window.trackConversion = async (funnelId, metadata = {}) => {
    try {
      await DatabaseService.trackFunnelEvent(funnelId, 'conversion', {
        timestamp: new Date().toISOString(),
        ...metadata
      });
      console.log('✅ Conversion tracked');
    } catch (error) {
      console.error('❌ Conversion tracking failed:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(0,0,0,0.3)',
          padding: '3rem',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            margin: '0 auto 2rem',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Funnel laden...
          </h2>
          <p style={{
            opacity: 0.8,
            fontSize: '1rem'
          }}>
            Even geduld alsjeblieft
          </p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(0,0,0,0.3)',
          padding: '3rem',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1.5rem'
          }}>
            😕
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            Oeps!
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            {error}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              padding: '1rem 2rem',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Terug naar Home
          </button>
        </div>
      </div>
    );
  }

  if (!funnel || !funnel.html_content) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(0,0,0,0.3)',
          padding: '3rem',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1.5rem'
          }}>
            🚧
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            In Ontwikkeling
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            Deze funnel wordt nog afgemaakt
          </p>
          <p style={{
            fontSize: '1rem',
            opacity: 0.7
          }}>
            Kom binnenkort terug!
          </p>
        </div>
      </div>
    );
  }

  // Inject tracking script into HTML content
  const enhancedHtml = funnel.html_content.replace(
    '</head>',
    `
    <script>
      // Enhanced conversion tracking
      window.trackConversion = async function(metadata = {}) {
        try {
          const response = await fetch('/api/track-conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              funnel_id: '${funnel.id}',
              timestamp: new Date().toISOString(),
              ...metadata
            })
          });
          console.log('✅ Conversion tracked');
          return response.ok;
        } catch (error) {
          console.error('❌ Conversion tracking failed:', error);
          return false;
        }
      };
      
      // Track time on page
      let startTime = Date.now();
      window.addEventListener('beforeunload', function() {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        navigator.sendBeacon('/api/track-time', JSON.stringify({
          funnel_id: '${funnel.id}',
          time_spent: timeSpent
        }));
      });
    </script>
    </head>`
  );

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        background: '#fff'
      }}
      dangerouslySetInnerHTML={{ __html: enhancedHtml }}
    />
  );
}
