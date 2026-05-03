// src/modules/meal-plan/components/day-schedule/CurrentTimeIndicator.jsx
// 🎯 Red line showing current time - Updates every minute
// ✨ FIXED: Full width line, time badge on RIGHT, more transparent

import React, { useState, useEffect } from 'react'

export default function CurrentTimeIndicator({ mobile = false }) {
  const [position, setPosition] = useState(0)
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    const updatePosition = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      
      // Only show if current time is within timeline range (6:00 - 22:00)
      if (hours >= 6 && hours <= 22) {
        // Calculate position in pixels
        // Each hour section = ~60px (header + content)
        const pixelsPerHour = 60
        const pos = ((hours - 6) * pixelsPerHour) + (minutes * (pixelsPerHour / 60))
        setPosition(pos)
        setVisible(true)
      } else {
        setVisible(false)
      }
    }
    
    updatePosition()
    const interval = setInterval(updatePosition, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [mobile])
  
  if (!visible) return null
  
  return (
    <div style={{
      position: 'absolute',
      top: `${position}px`,
      left: 0, // FULL WIDTH - starts from left edge
      right: 0,
      height: '2px',
      background: 'rgba(239, 68, 68, 0.6)', // More transparent (was solid)
      zIndex: 20,
      pointerEvents: 'none',
      boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)' // Softer glow
    }}>
      {/* Red dot indicator - LEFT side */}
      <div style={{
        position: 'absolute',
        left: '-5px',
        top: '-4px',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#ef4444',
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)', // Softer
        border: '2px solid #fff',
        opacity: 0.8 // Slightly transparent
      }} />
      
      {/* Time label - RIGHT side */}
      <div style={{
        position: 'absolute',
        right: '10px', // RIGHT side instead of left
        top: '-10px',
        padding: '0.125rem 0.375rem',
        background: 'rgba(239, 68, 68, 0.9)', // Slightly transparent
        borderRadius: '4px',
        fontSize: '0.65rem',
        fontWeight: '700',
        color: '#fff',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)' // Softer shadow
      }}>
        Nu • {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
