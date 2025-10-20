import React from 'react'

export default function MasterEditFields({ 
  content, 
  onChange, 
  isMobile 
}) {
  return (
    <div style={{ 
      width: '100%',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>
        Master Checklist Editor
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.6)' }}>
        Coming soon - Edit master checklist sections
      </p>
    </div>
  )
}
