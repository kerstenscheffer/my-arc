import { useState, useEffect } from 'react'
import { Mail, MessageCircle, Instagram, Youtube, Music, ExternalLink, ChevronDown } from 'lucide-react'

export default function InfoPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const imageUrl = "https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Black_White_Red_Simple_Modern_Elegant_Video_How_To_YouTube_Thumbnail_6.png?v=1760211909"

  // Link images from Shopify CDN
  const linkImages = {
    login: 'https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Black_White_Red_Simple_Modern_Elegant_Video_How_To_YouTube_Thumbnail_1000_x_1000_px_3.png?v=1760552371',
    program: 'https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Black_White_Red_Simple_Modern_Elegant_Video_How_To_YouTube_Thumbnail_1000_x_1000_px_2.png?v=1760551684',
    subscription: 'https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Black_White_Red_Simple_Modern_Elegant_Video_How_To_YouTube_Thumbnail_1000_x_1000_px_4.png?v=1760552683',
    homepage: 'https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Scherm_afbeelding_2025-10-15_om_20.10.58.png?v=1760551867'
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/myarcfitness/', color: '#FFD700' },
    { icon: Music, label: 'TikTok', href: 'https://www.tiktok.com/@myarc.fit', color: '#D4AF37' },
    { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@kerstenscheffer210', color: '#FFD700' },
    { icon: MessageCircle, label: 'WhatsApp', href: 'https://wa.me/31631388756', color: '#D4AF37' },
    { icon: Mail, label: 'Email', href: 'mailto:Kersten@myarcfitness.com', color: '#FFD700' }
  ]

  const pageLinks = [
    { image: linkImages.login, label: 'Login App', description: 'Toegang tot jouw dashboard', href: '/client-login' },
    { image: linkImages.program, label: '8-Weken Gratis?', description: 'Win je geld terug Challenge', href: '/funnel' },
    { image: linkImages.subscription, label: 'Jouw Arc Subscriptie', description: 'Continue groei & begeleiding', href: '/your-arc' },
    { image: linkImages.homepage, label: 'Homepage', description: 'Ontdek MY ARC', href: '/fitworden' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Golden gradient orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: isMobile ? '350px' : '550px',
        height: isMobile ? '350px' : '550px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, rgba(0, 0, 0, 0.9) 50%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 25s ease-in-out infinite',
        pointerEvents: 'none',
        willChange: 'transform'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-10%',
        width: isMobile ? '400px' : '600px',
        height: isMobile ? '400px' : '600px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.9) 50%, transparent 70%)',
        filter: 'blur(90px)',
        animation: 'float 30s ease-in-out infinite reverse',
        pointerEvents: 'none',
        willChange: 'transform'
      }} />

      {/* Dynamic Hero Banner - MET ZWARTE RUIMTE BOVEN */}
      <div style={{
        width: '100%',
        position: 'relative',
        paddingTop: '20px', // ZWARTE RUIMTE BOVEN FOTO
        marginBottom: isMobile ? '2rem' : '3rem'
      }}>
        {/* Background Image */}
        <img
          src={imageUrl}
          alt="MY ARC"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
        />
        
        {/* Golden Fade Gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          top: '60%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0.85) 75%, #000000 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
      </div>

      {/* Content Container */}
      <div style={{
        maxWidth: '700px',
        width: '100%',
        margin: '0 auto',
        padding: isMobile ? '0 1rem 4rem' : '0 2rem 5rem',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* CTA met Pijl Naar Beneden */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            color: '#FFD700',
            fontWeight: '700',
            marginBottom: '0.75rem',
            letterSpacing: '-0.01em',
            filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))'
          }}>
            Neem een kijkje
          </h2>
          
          {/* Animated Arrow */}
          <div style={{
            display: 'inline-block',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            <ChevronDown 
              size={isMobile ? 32 : 40} 
              color="#D4AF37"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))'
              }}
            />
          </div>
        </div>

        {/* Page Links - MET IMAGE PLACEHOLDERS */}
        <div style={{
          marginBottom: isMobile ? '3.5rem' : '4.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '1.25rem' : '1.5rem'
        }}>
          {pageLinks.map((link, index) => {
            return (
              <a
                key={index}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '1rem' : '1.25rem',
                  padding: isMobile ? '1.5rem' : '1.75rem',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.03) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 215, 0, 0.08)',
                  transform: 'translateZ(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(212, 175, 55, 0.06) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)'
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = '0 20px 50px rgba(255, 215, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.03) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)'
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 215, 0, 0.08)'
                }}
                onTouchStart={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
                }}
                onTouchEnd={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-20%',
                  width: '40%',
                  height: '200%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.08), transparent)',
                  transform: 'rotate(35deg)',
                  animation: 'glide 5s ease-in-out infinite',
                  pointerEvents: 'none',
                  willChange: 'transform'
                }} />
                
                {/* IMAGE PLACEHOLDER - Vervang src met jouw eigen URL */}
                <div style={{
                  width: isMobile ? '54px' : '60px',
                  height: isMobile ? '54px' : '60px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(212, 175, 55, 0.04) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1), inset 0 1px 0 rgba(255, 215, 0, 0.1)',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={link.image}
                    alt={link.label}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))'
                    }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: isMobile ? '1.05rem' : '1.15rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '0.25rem',
                    letterSpacing: '-0.01em',
                    filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.2))'
                  }}>
                    {link.label}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '400'
                  }}>
                    {link.description}
                  </div>
                </div>
                
                <ExternalLink size={isMobile ? 18 : 20} color="rgba(212, 175, 55, 0.5)" />
              </a>
            )
          })}
        </div>

        {/* Social Links */}
        <div style={{
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '800',
            color: '#D4AF37',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: isMobile ? '1.25rem' : '1.5rem',
            textAlign: 'center',
            filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.3))'
          }}>
            Connect Met MY ARC
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {socialLinks.map((social, index) => {
              const Icon = social.icon
              return (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: isMobile ? '1.125rem 0.5rem' : '1.25rem 0.75rem',
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(255, 215, 0, 0.02) 100%)',
                    border: `1px solid ${social.color}20`,
                    borderRadius: '14px',
                    textDecoration: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                    transform: 'translateZ(0)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${social.color}12`
                    e.currentTarget.style.borderColor = `${social.color}50`
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = `0 8px 25px ${social.color}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(255, 215, 0, 0.02) 100%)'
                    e.currentTarget.style.borderColor = `${social.color}20`
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)'
                  }}
                  onTouchStart={(e) => {
                    if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
                  }}
                  onTouchEnd={(e) => {
                    if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <div style={{
                    width: isMobile ? '42px' : '46px',
                    height: isMobile ? '42px' : '46px',
                    borderRadius: '50%',
                    background: `${social.color}15`,
                    border: `1px solid ${social.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 15px ${social.color}15, inset 0 1px 0 ${social.color}10`
                  }}>
                    <Icon 
                      size={isMobile ? 19 : 21} 
                      color={social.color}
                      style={{
                        filter: `drop-shadow(0 0 8px ${social.color}40)`
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {social.label}
                  </span>
                </a>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '2rem 0 0' : '2.5rem 0 0',
          borderTop: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(212, 175, 55, 0.5)',
            margin: 0,
            fontWeight: '400'
          }}>
            © 2024 MY ARC. Alle rechten voorbehouden.
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        
        @keyframes glide {
          0% { left: -20%; }
          100% { left: 120%; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
