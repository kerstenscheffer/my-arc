import { useState, useEffect, useRef } from 'react'

// BackgroundMotion.jsx - Floating elements system
export function BackgroundMotion({ isMobile }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100 
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 1,
      overflow: 'hidden'
    }}>
      
      {/* Floating Orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '5%',
        width: isMobile ? '200px' : '400px',
        height: isMobile ? '200px' : '400px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'floatSlow 25s ease-in-out infinite',
        transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`,
        transition: 'transform 0.3s ease'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        width: isMobile ? '150px' : '300px',
        height: isMobile ? '150px' : '300px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.015) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'floatSlow 30s ease-in-out infinite reverse',
        transform: `translate(${mousePos.x * -0.015}px, ${mousePos.y * -0.015}px)`,
        transition: 'transform 0.3s ease'
      }} />

      {/* Geometric Shapes */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '15%',
        width: '2px',
        height: '60px',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
        animation: 'drift 20s linear infinite',
        transform: `translateX(${mousePos.x * 0.01}px)`,
        transition: 'transform 0.2s ease'
      }} />

      <div style={{
        position: 'absolute',
        top: '60%',
        right: '20%',
        width: '1px',
        height: '40px',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
        animation: 'drift 15s linear infinite reverse',
        transform: `translateX(${mousePos.x * -0.008}px)`,
        transition: 'transform 0.2s ease'
      }} />

      <div style={{
        position: 'absolute',
        top: '80%',
        left: '70%',
        width: '1px',
        height: '30px',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
        animation: 'drift 25s linear infinite',
        transform: `translateX(${mousePos.x * 0.005}px)`,
        transition: 'transform 0.2s ease'
      }} />

      {/* Noise Texture Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.015'/%3E%3C/svg%3E")`,
        opacity: 0.3,
        animation: 'noiseShift 60s linear infinite'
      }} />

      {/* CSS for animations */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            opacity: 0.5;
          }
          50% { 
            transform: translateY(-30px) scale(1.05);
            opacity: 0.8;
          }
        }
        
        @keyframes drift {
          0% { transform: translateY(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        
        @keyframes noiseShift {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(-5px) translateY(-5px); }
          50% { transform: translateX(5px) translateY(5px); }
          75% { transform: translateX(-3px) translateY(3px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
      `}</style>
    </div>
  )
}

// ScrollReveal.jsx - Section reveal system
export function ScrollReveal({ children, delay = 0, threshold = 0.2 }) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
            setIsVisible(true)
            setHasAnimated(true)
          }, delay)
        }
      },
      { 
        threshold,
        rootMargin: '0px 0px -100px 0px' // Start animation before fully in view
      }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [delay, threshold, hasAnimated])

  return (
    <div
      ref={elementRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? 'translateY(0px) scale(1)' 
          : 'translateY(40px) scale(0.98)',
        transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        filter: isVisible ? 'blur(0px)' : 'blur(2px)'
      }}
    >
      {children}
    </div>
  )
}

// InteractionBlock.jsx - Hover and touch feedback
export function InteractionBlock({ 
  children, 
  className = '',
  intensity = 'subtle', // 'subtle', 'medium', 'strong'
  disabled = false
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState([])

  const intensityMap = {
    subtle: {
      scale: 1.008,
      glow: '0 0 20px rgba(255, 255, 255, 0.03)',
      background: 'rgba(255, 255, 255, 0.005)'
    },
    medium: {
      scale: 1.015,
      glow: '0 0 30px rgba(255, 255, 255, 0.06)',
      background: 'rgba(255, 255, 255, 0.01)'
    },
    strong: {
      scale: 1.02,
      glow: '0 0 40px rgba(255, 255, 255, 0.1)',
      background: 'rgba(255, 255, 255, 0.02)'
    }
  }

  const settings = intensityMap[intensity]

  const handleClick = (e) => {
    if (disabled) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    }
    
    setRipples(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
  }

  if (disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        position: 'relative',
        transform: isHovered ? `scale(${settings.scale})` : 'scale(1)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isHovered ? settings.background : 'transparent',
        boxShadow: isHovered ? settings.glow : 'none',
        overflow: 'hidden',
        borderRadius: '0px' // Keep clean edges
      }}
    >
      {children}
      
      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            transform: 'scale(0)',
            animation: 'ripple 0.6s ease-out',
            pointerEvents: 'none'
          }}
        />
      ))}
      
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// TextReveal.jsx - Staggered text animation
export function TextReveal({ 
  children, 
  delay = 0, 
  staggerDelay = 50,
  splitType = 'words' // 'words' or 'chars'
}) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.3 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [delay])

  const text = typeof children === 'string' ? children : ''
  const splitText = splitType === 'words' 
    ? text.split(' ') 
    : text.split('')

  return (
    <div ref={elementRef} style={{ overflow: 'hidden' }}>
      {splitText.map((item, index) => (
        <span
          key={index}
          style={{
            display: 'inline-block',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0px)' : 'translateY(20px)',
            transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1)`,
            transitionDelay: `${index * staggerDelay}ms`,
            marginRight: splitType === 'words' ? '0.25em' : '0'
          }}
        >
          {item}
        </span>
      ))}
    </div>
  )
}
