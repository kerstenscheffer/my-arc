// src/modules/shopping/tabs/components/ShoppingMotivationSlider.jsx
import React, { useState, useEffect } from 'react'
import { ShoppingCart, TrendingUp, Zap } from 'lucide-react'

const SHOPPING_QUOTES = [
  {
    text: "Koop bulk in en maak het makkelijk voor jezelf",
    icon: ShoppingCart
  },
  {
    text: "Verhoog je slagingskans met 80% wanneer je genoeg gezond eten in huis hebt",
    icon: TrendingUp
  },
  {
    text: "De meeste plannen falen niet omdat je geen motivatie hebt, maar omdat je het jezelf veel te moeilijk maakt",
    icon: Zap
  },
  {
    text: "Voorbereiding is het verschil tussen succes en falen",
    icon: TrendingUp
  },
  {
    text: "Je koelkast is je beste vriend of je grootste vijand",
    icon: ShoppingCart
  }
]

export default function ShoppingMotivationSlider({ isMobile }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SHOPPING_QUOTES.length)
        setIsAnimating(false)
      }, 300)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const current = SHOPPING_QUOTES[currentIndex]
  const Icon = current.icon

  return (
    <div style={{
      marginBottom: isMobile ? '1rem' : '1.25rem',
      padding: isMobile ? '1rem' : '1.25rem',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: isMobile ? '14px' : '16px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: isMobile ? '90px' : '100px',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.875rem' : '1rem',
      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
        opacity: 0.6
      }} />

      {/* Shine overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Icon container */}
      <div style={{
        width: isMobile ? '48px' : '56px',
        height: isMobile ? '48px' : '56px',
        borderRadius: '12px',
        background: 'rgba(16, 185, 129, 0.2)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? 'scale(0.9)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <Icon 
          size={isMobile ? 24 : 28} 
          color="#10b981" 
          strokeWidth={2.5}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.6))' }}
        />
      </div>

      {/* Quote text */}
      <div style={{
        flex: 1,
        position: 'relative',
        zIndex: 1,
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? 'translateY(10px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          fontWeight: '700',
          color: '#fff',
          lineHeight: 1.5,
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          {current.text}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{
        display: 'flex',
        gap: '0.375rem',
        position: 'absolute',
        bottom: isMobile ? '0.625rem' : '0.75rem',
        right: isMobile ? '0.625rem' : '0.75rem',
        zIndex: 2
      }}>
        {SHOPPING_QUOTES.map((_, index) => (
          <div
            key={index}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: index === currentIndex 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'rgba(255, 255, 255, 0.2)',
              boxShadow: index === currentIndex 
                ? '0 0 8px rgba(16, 185, 129, 0.6)' 
                : 'none',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  )
}
