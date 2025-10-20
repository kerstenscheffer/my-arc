// src/components/login/BackgroundSlideshow.jsx
import { useState, useEffect } from 'react'

// Gratis Unsplash fitness foto's - Direct werkend!
// Optie 1: Gebruik deze gratis stock foto's
const SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop', // Gym overview
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1920&h=1080&fit=crop', // Weights
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&h=1080&fit=crop', // Woman training
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1920&h=1080&fit=crop', // Man deadlift
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&h=1080&fit=crop'  // Barbell
]

// Optie 2: Upload eigen foto's naar Supabase Storage en gebruik deze URLs:
// const SLIDE_IMAGES = [
//   'https://[jouw-project].supabase.co/storage/v1/object/public/images/fitness1.jpg',
//   'https://[jouw-project].supabase.co/storage/v1/object/public/images/fitness2.jpg',
//   // etc...
// ]

export default function BackgroundSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState(new Set())
  
  // Preload images voor smooth transitions
  useEffect(() => {
    const preloadImages = async () => {
      const promises = SLIDE_IMAGES.map((src, index) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.src = src
          img.onload = () => {
            setLoadedImages(prev => new Set([...prev, index]))
            resolve()
          }
          img.onerror = () => {
            console.warn(`Failed to load image: ${src}`)
            resolve() // Continue even if one fails
          }
        })
      })
      
      // Wait for at least first image
      await Promise.race(promises)
      setImagesLoaded(true)
      
      // Load rest in background
      Promise.all(promises)
    }
    
    preloadImages()
  }, [])
  
  useEffect(() => {
    if (!imagesLoaded) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        // Skip to next loaded image
        let next = (prev + 1) % SLIDE_IMAGES.length
        let attempts = 0
        while (!loadedImages.has(next) && attempts < SLIDE_IMAGES.length) {
          next = (next + 1) % SLIDE_IMAGES.length
          attempts++
        }
        return next
      })
    }, 7000) // 7 seconds per slide
    
    return () => clearInterval(interval)
  }, [imagesLoaded, loadedImages])
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      overflow: 'hidden'
    }}>
      {/* Premium gradient fallback - altijd zichtbaar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)
        `
      }} />
      
      {/* Image layers - alleen tonen als geladen */}
      {imagesLoaded && SLIDE_IMAGES.map((src, index) => (
        loadedImages.has(index) && (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: index === currentIndex ? 0.35 : 0, // Subtiele opacity
              transition: 'opacity 2.5s ease-in-out',
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transform: index === currentIndex ? 'scale(1.05)' : 'scale(1)',
              animation: index === currentIndex ? 'kenBurns 10s ease-out' : 'none',
              willChange: index === currentIndex ? 'transform' : 'auto'
            }}
          />
        )
      ))}
      
      {/* Dark overlay voor betere leesbaarheid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          linear-gradient(
            180deg,
            rgba(10, 10, 10, 0.85) 0%,
            rgba(10, 10, 10, 0.65) 50%,
            rgba(10, 10, 10, 0.9) 100%
          )
        `,
        zIndex: 1
      }} />
      
      {/* Extra vignette effect voor premium look */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(0, 0, 0, 0.4) 100%
          )
        `,
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      
      {/* Loading indicator (alleen eerste keer) */}
      {!imagesLoaded && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3
        }}>
          <div style={{
            width: '40px',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '50%',
              height: '100%',
              background: 'rgba(16, 185, 129, 0.5)',
              animation: 'slideLoad 1.5s ease-in-out infinite'
            }} />
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes kenBurns {
          0% { 
            transform: scale(1.05) translateY(0);
          }
          100% { 
            transform: scale(1.12) translateY(-20px);
          }
        }
        
        @keyframes slideLoad {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
