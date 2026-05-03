// src/components/BackgroundSlideshow.jsx - MY ARC Photo Slideshow
import { useState, useEffect } from 'react'

// Complete MY ARC Photo Library - 50+ images
const SLIDESHOW_IMAGES = [
  // Kersten Transformatie & Gym
  'https://i.ibb.co/hFZjQvtk/IMG-4592.jpg', // Kersten skinny
  'https://i.ibb.co/kgTxvbH4/IMG-4591.jpg', // Kersten gespierd
  'https://i.ibb.co/gF6d9P9j/3-principes.png', // Kersten Skinny en gespierd
  'https://i.ibb.co/n812CRwh/3-principes-5.png', // Kersten in gym
  
  // Fitness & Sport
  'https://i.ibb.co/84c7FCYx/18.png', // Hardlopen
  'https://i.ibb.co/Y4Cx9tYL/17.png', // Hardloper
  'https://i.ibb.co/353dRLbj/16.png', // Basketballer
  'https://i.ibb.co/39wVW0NC/7.png', // Gespierde man
  'https://i.ibb.co/dJWbrYvc/4.png', // Bodybuilder
  
  // Gezonde Maaltijden
  'https://i.ibb.co/4gYjtpbY/12.png', // Maaltijden
  'https://i.ibb.co/KzNkDpvk/11.png', // Eten uit de oven
  'https://i.ibb.co/zHsdJS5y/10.png', // Groenten snijden
  'https://i.ibb.co/jvmybhpK/9.png', // Groenten koken
  'https://i.ibb.co/Lh0Ph1vV/8.png', // Groenten klaar
  'https://i.ibb.co/PvDhbSjV/3.png', // Maaltijden
  'https://i.ibb.co/YBXKM0Zz/1.png', // Meal prep bakjes gevuld
  'https://i.ibb.co/FLrFV8Vq/2.png', // Bord vol eten
  
  // Fastfood Brands (Voor contrast/educatie)
  'https://i.ibb.co/nqKdMNgb/Scherm-afbeelding-2025-12-02-om-14-19-08.png', // McDonald's gebouw
  'https://i.ibb.co/F4d0w6rf/Scherm-afbeelding-2025-12-02-om-14-19-33.png', // McDonald's menu
  'https://i.ibb.co/NgY195RY/Scherm-afbeelding-2025-12-02-om-14-19-50.png', // McDonald's verboden
  'https://i.ibb.co/XrLKpWTZ/Scherm-afbeelding-2025-12-02-om-14-20-05.png', // Burger King menu
  'https://i.ibb.co/JR8fFGVT/Scherm-afbeelding-2025-12-02-om-14-22-01.png', // KFC bucket
  'https://i.ibb.co/5g0dtgdg/Scherm-afbeelding-2025-12-02-om-14-24-18.png', // Domino's pizza
  
  // Sushi & Restaurant
  'https://i.ibb.co/HT3JPxXj/Scherm-afbeelding-2025-12-02-om-14-20-56.png', // Sushi kleurrijk
  'https://i.ibb.co/Vc9LT3tN/Scherm-afbeelding-2025-12-02-om-14-21-05.png', // Sushi met saus
  'https://i.ibb.co/VYDp2rTT/Scherm-afbeelding-2025-12-02-om-14-23-37.png', // Subway broodje
  
  // Takeaway
  'https://i.ibb.co/99Kf0Pzc/Scherm-afbeelding-2025-12-02-om-14-24-45.png', // Chinees afhaal
  'https://i.ibb.co/5gK9bjqv/Scherm-afbeelding-2025-12-02-om-14-25-05.png', // Bami goreng
  'https://i.ibb.co/cz5BnPG/Scherm-afbeelding-2025-12-02-om-14-25-19.png', // Pasta's
  'https://i.ibb.co/mFgtMjcJ/Scherm-afbeelding-2025-12-02-om-14-25-24.png', // Pasta bord
  
  // Grieks Eten
  'https://i.ibb.co/CsJv4kVV/Scherm-afbeelding-2025-12-02-om-14-25-40.png', // Grieks eten
  'https://i.ibb.co/TCTGK7G/Scherm-afbeelding-2025-12-02-om-14-25-47.png', // Griekse gehaktballen
  'https://i.ibb.co/TBm4gGxh/Scherm-afbeelding-2025-12-02-om-14-25-51.png', // Grieks 6 foto's
  
  // Snackbar
  'https://i.ibb.co/4Z1WP4NC/Scherm-afbeelding-2025-12-02-om-14-26-06.png', // Snackbar vitrine
  'https://i.ibb.co/Mkpdsc3Z/Scherm-afbeelding-2025-12-02-om-14-26-12.png', // Snackbar vitrine 2
  'https://i.ibb.co/27KTbbMb/Scherm-afbeelding-2025-12-02-om-14-26-25.png', // Snackbar binnen
  
  // Tracking & Weegschaal
  'https://i.ibb.co/tp62hjnP/Scherm-afbeelding-2025-12-02-om-14-27-07.png', // Calorie tracking app
  'https://i.ibb.co/Q78bbgFQ/Scherm-afbeelding-2025-12-02-om-14-27-25.png', // Weegschaal met appel
  
  // Contrast: Voor/Na & Reality
  'https://i.ibb.co/hRKZnHZr/Scherm-afbeelding-2025-12-02-om-14-22-39.png', // Dikke/dunne contrast
  'https://i.ibb.co/qLy52ZcL/15.png', // Moe persoon
  'https://i.ibb.co/Qv20Qknv/14.png', // Moe persoon 2
  'https://i.ibb.co/0pNqDG8H/13.png', // Wakker in bed
  
  // Extra variatie
  'https://i.ibb.co/1J9X4dvV/IMG-4595.jpg', // Kersten moe met mondkapje
  'https://i.ibb.co/yBq7Zp6t/IMG-4594.jpg' // Playstation controller
]

export default function BackgroundSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      
      // Prepare next image
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length)
        setNextIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length)
      }, 500) // Half transition time
      
      // Reset transition state
      setTimeout(() => {
        setIsTransitioning(false)
      }, 1000) // Full transition time
      
    }, 7000) // 7 seconds per image (sync with QuoteSlider)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <>
      {/* Background Layer 1 - Current Image */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          backgroundImage: `url(${SLIDESHOW_IMAGES[currentIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 1s ease-in-out',
          filter: 'brightness(0.7)' // Slightly darker for readability
        }}
      />
      
      {/* Background Layer 2 - Next Image (Pre-loading) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          backgroundImage: `url(${SLIDESHOW_IMAGES[nextIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.7)'
        }}
      />
      
      {/* Dark Overlay for Login Readability */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />
      
      {/* Subtle Golden Vignette */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />
      
      {/* Golden Glow Effect (Subtle) */}
      <div
        style={{
          position: 'fixed',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.03) 0%, transparent 50%)',
          zIndex: 4,
          pointerEvents: 'none',
          opacity: 0.6
        }}
      />
      
      {/* Progress Indicator - Optional (Subtle) */}
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          zIndex: 20,
          pointerEvents: 'none'
        }}
      >
        {SLIDESHOW_IMAGES.slice(0, 10).map((_, index) => (
          <div
            key={index}
            style={{
              width: index === (currentIndex % 10) ? '20px' : '6px',
              height: '3px',
              background: index === (currentIndex % 10)
                ? 'rgba(255, 215, 0, 0.6)'
                : 'rgba(255, 255, 255, 0.15)',
              borderRadius: '2px',
              transition: 'all 0.3s ease',
              boxShadow: index === (currentIndex % 10) 
                ? '0 0 8px rgba(255, 215, 0, 0.4)' 
                : 'none'
            }}
          />
        ))}
      </div>
    </>
  )
}
