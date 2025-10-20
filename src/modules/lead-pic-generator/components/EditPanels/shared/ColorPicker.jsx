// src/modules/lead-pic-generator/components/EditPanels/shared/ColorPicker.jsx
import React from 'react'
import { Palette } from 'lucide-react'

const PRESET_COLORS = [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Deep Orange
]

export default function ColorPicker({ 
  value = '#10b981', 
  onChange, 
  label,
  isMobile 
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {label && (
        <label style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Palette size={14} />
          {label}
        </label>
      )}
      
      <div style={{ 
        display: 'flex', 
        gap: isMobile ? '6px' : '8px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            onClick={() => onChange(color)}
            style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '50%',
              background: color,
              border: value === color 
                ? '3px solid #fff' 
                : '2px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: value === color ? 'scale(1.15)' : 'scale(1)',
              boxShadow: value === color 
                ? `0 0 20px ${color}50` 
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (value !== color) {
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (value !== color) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          />
        ))}
        
        <div style={{
          position: 'relative',
          marginLeft: '8px'
        }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              background: 'transparent',
              overflow: 'hidden'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.4)',
            whiteSpace: 'nowrap'
          }}>
            Custom
          </div>
        </div>
      </div>
      
      <div style={{
        marginTop: '8px',
        padding: '8px',
        background: value,
        borderRadius: '8px',
        color: '#fff',
        fontSize: '12px',
        textAlign: 'center',
        fontWeight: '600',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
      }}>
        {value.toUpperCase()}
      </div>
    </div>
  )
}
