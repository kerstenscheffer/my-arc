import React from 'react'
import { UtensilsCrossed } from 'lucide-react'

export function getMealImageUrl(meal) {
  const url = meal?.image_url
  return url && url.trim() !== '' ? url : null
}

export function MealImagePlaceholder({ width, height, style = {} }) {
  return (
    <div style={{
      width, height,
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...style,
    }}>
      <UtensilsCrossed size={20} style={{ color: '#FFD700', opacity: 0.35 }} />
    </div>
  )
}
