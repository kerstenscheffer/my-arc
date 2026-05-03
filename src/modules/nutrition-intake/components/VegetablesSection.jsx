// VegetablesSection.jsx
// Groenten Section - Simpele likes/dislikes lijst

import React, { useState, useEffect } from 'react'
import { intakeTheme, responsive, getCardStyle } from '../styles/intake-theme'

const COMMON_VEGETABLES = [
  'Broccoli', 'Spinazie', 'Paprika', 'Komkommer', 'Tomaat',
  'Sla', 'Wortel', 'Courgette', 'Bloemkool', 'Ui'
]

export default function VegetablesSection({ 
  value, 
  onChange, 
  onComplete,
  isMobile 
}) {
  const [likes, setLikes] = useState([])
  const [dislikes, setDislikes] = useState('')
  const [other, setOther] = useState('')
  
  useEffect(() => {
    if (value) {
      setLikes(value.likes || [])
      setDislikes(value.dislikes?.join(', ') || '')
      setOther(value.other || '')
    }
  }, [value])
  
  const handleToggleLike = (veggie) => {
    let updatedLikes
    if (likes.includes(veggie)) {
      updatedLikes = likes.filter(v => v !== veggie)
    } else {
      updatedLikes = [...likes, veggie]
    }
    setLikes(updatedLikes)
    updateValue(updatedLikes, dislikes, other)
  }
  
  const handleDislikesChange = (text) => {
    setDislikes(text)
    updateValue(likes, text, other)
  }
  
  const handleOtherChange = (text) => {
    setOther(text)
    updateValue(likes, dislikes, text)
  }
  
  const updateValue = (currentLikes, currentDislikes, currentOther) => {
    const dislikesArray = currentDislikes
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
    
    const preferences = {
      likes: currentLikes,
      dislikes: dislikesArray,
      other: currentOther || null
    }
    
    onChange(preferences)
    onComplete(currentLikes.length > 0)
  }
  
  return (
    <div style={getSectionContainerStyle(isMobile)}>
      <div style={getSectionHeaderStyle(isMobile)}>
        <h2 style={getSectionTitleStyle(isMobile)}>
          5. Groenten
        </h2>
        <p style={getSectionDescriptionStyle(isMobile)}>
          Welke groenten eet je graag? Select alles wat je lekker vindt.
        </p>
      </div>
      
      <div style={getCardStyle(isMobile)}>
        <div style={getCardHeaderStyle(isMobile)}>
          <div style={getCardTitleStyle(isMobile)}>
            ✅ Ik eet graag
          </div>
          <div style={getCountBadgeStyle()}>
            {likes.length} geselecteerd
          </div>
        </div>
        
        <div style={getVeggieGridStyle(isMobile)}>
          {COMMON_VEGETABLES.map((veggie) => {
            const isSelected = likes.includes(veggie)
            return (
              <button
                key={veggie}
                onClick={() => handleToggleLike(veggie)}
                style={getVeggieButtonStyle(isMobile, isSelected)}
              >
                <span style={getVeggieCheckStyle(isSelected)}>
                  {isSelected && '✓'}
                </span>
                {veggie}
              </button>
            )
          })}
        </div>
      </div>
      
      <div style={getCardStyle(isMobile)}>
        <div style={getCardTitleStyle(isMobile)}>
          ❌ Groenten die ik NIET wil
        </div>
        <textarea
          value={dislikes}
          onChange={(e) => handleDislikesChange(e.target.value)}
          placeholder="Bijv: Geen broccoli, Geen ui"
          style={getTextareaStyle(isMobile)}
          rows={2}
        />
      </div>
      
      <div style={getCardStyle(isMobile)}>
        <div style={getCardTitleStyle(isMobile)}>
          ➕ Andere groenten die ik graag eet
        </div>
        <textarea
          value={other}
          onChange={(e) => handleOtherChange(e.target.value)}
          placeholder="Bijv: Andijvie, Prei, Aubergine"
          style={getTextareaStyle(isMobile)}
          rows={2}
        />
      </div>
      
      {value && likes.length > 0 && (
        <div style={getSummaryBoxStyle()}>
          <div style={getSummaryTextStyle()}>
            ✓ {likes.length} groente{likes.length > 1 ? 'n' : ''} geselecteerd
          </div>
        </div>
      )}
    </div>
  )
}

// Styles
function getSectionContainerStyle(isMobile) { return { padding: responsive(isMobile, '2rem 1rem', '3rem 2rem'), maxWidth: '900px', margin: '0 auto' }}
function getSectionHeaderStyle(isMobile) { return { marginBottom: responsive(isMobile, '1.5rem', '2rem') }}
function getSectionTitleStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.h2, intakeTheme.fontSize.desktop.h2), fontWeight: intakeTheme.fontWeight.bold, color: intakeTheme.colors.white, margin: 0, marginBottom: '0.5rem' }}
function getSectionDescriptionStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.body, intakeTheme.fontSize.desktop.body), color: intakeTheme.colors.lightGray, lineHeight: 1.6, margin: 0 }}
function getCardHeaderStyle(isMobile) { return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: responsive(isMobile, '1rem', '1.5rem'), paddingBottom: '1rem', borderBottom: `1px solid ${intakeTheme.border.color}` }}
function getCardTitleStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.h4, intakeTheme.fontSize.desktop.h4), fontWeight: intakeTheme.fontWeight.semibold, color: intakeTheme.colors.gold, marginBottom: '1rem' }}
function getCountBadgeStyle() { return { padding: '0.25rem 0.75rem', background: intakeTheme.colors.gold, color: intakeTheme.colors.black, fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.bold, borderRadius: intakeTheme.border.radius.full }}
function getVeggieGridStyle(isMobile) { return { display: 'grid', gridTemplateColumns: responsive(isMobile, 'repeat(2, 1fr)', 'repeat(3, 1fr)'), gap: responsive(isMobile, '0.75rem', '1rem') }}
function getVeggieButtonStyle(isMobile, isSelected) { return { padding: responsive(isMobile, '0.75rem', '1rem'), background: isSelected ? intakeTheme.colors.gold : intakeTheme.colors.mediumGray, border: `1px solid ${isSelected ? intakeTheme.colors.gold : intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.small, color: isSelected ? intakeTheme.colors.black : intakeTheme.colors.white, fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.semibold, cursor: 'pointer', transition: intakeTheme.transitions.normal, display: 'flex', alignItems: 'center', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
function getVeggieCheckStyle(isSelected) { return { width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${isSelected ? intakeTheme.colors.black : intakeTheme.colors.gold}`, background: isSelected ? intakeTheme.colors.black : 'transparent', color: intakeTheme.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}
function getTextareaStyle(isMobile) { return { width: '100%', padding: responsive(isMobile, '0.75rem', '1rem'), background: intakeTheme.colors.black, border: `1px solid ${intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.white, fontSize: intakeTheme.fontSize.mobile.body, fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', outline: 'none', transition: intakeTheme.transitions.normal }}
function getSummaryBoxStyle() { return { marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: `1px solid ${intakeTheme.colors.green}`, borderRadius: intakeTheme.border.radius.medium, textAlign: 'center' }}
function getSummaryTextStyle() { return { fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.semibold, color: intakeTheme.colors.green }}

console.log('✅ VegetablesSection component loaded')
