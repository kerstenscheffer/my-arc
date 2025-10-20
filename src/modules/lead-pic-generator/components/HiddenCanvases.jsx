// src/modules/lead-pic-generator/components/HiddenCanvases.jsx
import React from 'react'

export default function HiddenCanvases({ 
  getCurrentTemplate, 
  getCurrentBodyTemplate, 
  getCurrentRewardSlide 
}) {
  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div id="download-slide-0">
        {getCurrentTemplate()}
      </div>
      <div id="download-slide-1">
        {getCurrentBodyTemplate()}
      </div>
      <div id="download-slide-2">
        {getCurrentRewardSlide()}
      </div>
    </div>
  )
}
