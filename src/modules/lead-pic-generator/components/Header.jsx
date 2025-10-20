// src/modules/lead-pic-generator/components/Header.jsx
import React from 'react'

export default function Header({ isMobile }) {
  return (
    <div style={{
      textAlign: 'center',
      marginBottom: isMobile ? '1.5rem' : '2rem'
    }}>
      <h1 style={{
        fontSize: isMobile ? '1.8rem' : '2.5rem',
        fontWeight: '900',
        margin: 0,
        marginBottom: '0.5rem',
        letterSpacing: '-0.02em',
        background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        MY ARC Lead Pic Generator
      </h1>
      <p style={{
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: isMobile ? '0.9rem' : '1rem'
      }}>
        Maak scroll-stopping Instagram carousels
      </p>
    </div>
  )
}
