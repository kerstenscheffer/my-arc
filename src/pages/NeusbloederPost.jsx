import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { 
  Youtube, 
  Instagram, 
  Music, 
  Linkedin, 
  Globe, 
  Mail, 
  MessageCircle, 
  Phone, 
  MapPin,
  Download,
  Palette,
  Sparkles,
  Utensils,
  Trophy,
  Lock,
  Dumbbell,
  MoreHorizontal,
  RotateCcw,
  Crown,
  Target
} from 'lucide-react';

export default function NeusbloederPost() {
  const [selectedIcon, setSelectedIcon] = useState('myarc-logo');
  const [currentIconData, setCurrentIconData] = useState({
    name: 'myarc-logo',
    component: null,
    color: '#10b981'
  });

  const iconOptions = [
    { name: 'youtube', component: Youtube, color: '#ff0000', label: 'YouTube' },
    { name: 'instagram', component: Instagram, color: '#e4405f', label: 'Instagram' },
    { name: 'tiktok', component: Music, color: '#000000', label: 'TikTok' },
    { name: 'linkedin', component: Linkedin, color: '#0077b5', label: 'LinkedIn' },
    { name: 'website', component: Globe, color: '#10b981', label: 'Website' },
    { name: 'email', component: Mail, color: '#ea4335', label: 'Email' },
    { name: 'whatsapp', component: MessageCircle, color: '#25d366', label: 'WhatsApp' },
    { name: 'phone', component: Phone, color: '#6366f1', label: 'Telefoon' },
    { name: 'location', component: MapPin, color: '#ef4444', label: 'Locatie' },
    { name: 'voeding', component: Utensils, color: '#f59e0b', label: 'Voeding' },
    { name: 'trofee', component: Trophy, color: '#fbbf24', label: 'Trofee' },
    { name: 'slot', component: Lock, color: '#8b5cf6', label: 'Slot' },
    { name: 'workout', component: Dumbbell, color: '#ef4444', label: 'Workout' },
    { name: 'meer', component: MoreHorizontal, color: '#6b7280', label: 'Meer' },
    { name: 'myarc-logo', component: null, color: '#10b981', label: 'MY ARC Logo' },
    { name: 'myarc-arc', component: RotateCcw, color: '#10b981', label: 'MY ARC Arc' },
    { name: 'myarc-crown', component: Crown, color: '#fbbf24', label: 'MY ARC Crown' },
    { name: 'myarc-target', component: Target, color: '#3b82f6', label: 'MY ARC Target' }
  ];

  const downloadHighlight = () => {
    const element = document.getElementById('highlight-circle');
    
    if (!element) {
      console.error('Highlight element not found');
      return;
    }

    const originalStyle = element.style.cssText;
    element.style.transform = 'scale(1)';
    element.style.transition = 'none';
    
    html2canvas(element, {
      scale: 4,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 250,
      height: 250
    }).then(canvas => {
      element.style.cssText = originalStyle;
      
      const link = document.createElement('a');
      link.download = `instagram-highlight-${selectedIcon}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(error => {
      console.error('Error generating image:', error);
      alert('Er ging iets mis met het downloaden. Probeer het opnieuw.');
    });
  };

  const selectIcon = (iconData) => {
    setSelectedIcon(iconData.name);
    setCurrentIconData(iconData);
  };

  const renderIcon = () => {
    if (currentIconData.name === 'myarc-logo') {
      return (
        <text
          x="115"
          y="135"
          textAnchor="middle"
          fontSize="44"
          fontWeight="900"
          fill="url(#iconGradient)"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="1px"
        >
          MY ARC
        </text>
      );
    }
    
    const IconComponent = currentIconData.component;
    return (
      <IconComponent 
        x="115"
        y="115"
        size={80}
        style={{
          stroke: 'url(#iconGradient)',
          fill: 'none',
          strokeWidth: 2.5,
          transform: 'translate(-40px, -40px)'
        }}
      />
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <Palette size={28} color="#10b981" />
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Instagram Highlight Generator
          </h1>
          <Sparkles size={28} color="#3b82f6" />
        </div>
        
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.6)',
          margin: 0,
          lineHeight: '1.4'
        }}>
          Maak professionele highlight circles met jouw kleuren
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 400px) 1fr',
        gap: '4rem',
        maxWidth: '1000px',
        width: '100%',
        alignItems: 'start'
      }}>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            Kies een icoon
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem'
          }}>
            {iconOptions.map((icon) => (
              <button
                key={icon.name}
                onClick={() => selectIcon(icon)}
                style={{
                  background: selectedIcon === icon.name 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: selectedIcon === icon.name
                    ? '2px solid rgba(16, 185, 129, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '80px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedIcon !== icon.name) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedIcon !== icon.name) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {icon.name === 'myarc-logo' ? (
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: selectedIcon === icon.name ? '#10b981' : 'rgba(255, 255, 255, 0.6)'
                  }}>
                    MY ARC
                  </div>
                ) : (
                  icon.component && <icon.component 
                    size={24} 
                    color={selectedIcon === icon.name ? '#10b981' : 'rgba(255, 255, 255, 0.6)'} 
                  />
                )}
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: selectedIcon === icon.name ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center'
                }}>
                  {icon.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={downloadHighlight}
            style={{
              width: '100%',
              marginTop: '2rem',
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.15)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.15)';
            }}
          >
            <Download size={20} />
            Download PNG
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              Preview
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0
            }}>
              Zo gaat je highlight eruit zien
            </p>
          </div>

          <div
            id="highlight-circle"
            style={{
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 16px 50px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.3)';
            }}
          >
            <div style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <svg width="210" height="210" viewBox="0 0 210 210" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.9)" />
                    <stop offset="100%" stopColor="rgba(59, 130, 246, 0.9)" />
                  </linearGradient>
                </defs>
                {renderIcon()}
              </svg>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1rem 2rem',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: '0 0 0.25rem 0'
            }}>
              Geselecteerd:
            </p>
            <p style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#10b981',
              margin: 0
            }}>
              {currentIconData.label}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '4rem',
        textAlign: 'center',
        maxWidth: '600px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <h4 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem'
        }}>
          Hoe te gebruiken:
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          textAlign: 'left'
        }}>
          <div>
            <span style={{
              color: '#10b981',
              fontWeight: '600',
              marginRight: '0.5rem'
            }}>
              1.
            </span>
            <span style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem'
            }}>
              Kies een icoon uit de selectie
            </span>
          </div>
          <div>
            <span style={{
              color: '#10b981',
              fontWeight: '600',
              marginRight: '0.5rem'
            }}>
              2.
            </span>
            <span style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem'
            }}>
              Klik op "Download PNG"
            </span>
          </div>
          <div>
            <span style={{
              color: '#10b981',
              fontWeight: '600',
              marginRight: '0.5rem'
            }}>
              3.
            </span>
            <span style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem'
            }}>
              Upload naar Instagram highlights
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          
          .icon-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .instructions-grid {
            grid-template-columns: 1fr !important;
          }
          
          h1 {
            font-size: 2rem !important;
          }
          
          .highlight-circle {
            width: 200px !important;
            height: 200px !important;
          }
          
          .inner-circle {
            width: 170px !important;
            height: 170px !important;
          }
        }
      `}</style>
    </div>
  );
}
