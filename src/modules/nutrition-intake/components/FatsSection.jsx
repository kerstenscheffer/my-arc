// FatsSection.jsx
// Vetten Section - Standaard lijst met optie tot verwijderen/toevoegen

import React, { useState, useEffect } from 'react'
import { intakeTheme, responsive, getCardStyle } from '../styles/intake-theme'

const STANDARD_FAT_SOURCES = [
  { id: 'olijfolie', name: 'Olijfolie extra vierge', reason: 'Hart-gezond, ontstekingsremmend' },
  { id: 'noten', name: 'Rauwe noten (amandelen/walnoten)', reason: 'Omega-3, magnesium, vezels' },
  { id: 'avocado', name: 'Avocado', reason: 'Gezonde vetten, kalium, vezels' },
  { id: 'pindakaas', name: 'Pindakaas (suikervrij)', reason: 'Calorie-dense, convenient' }
]

export default function FatsSection({ 
  value, 
  onChange, 
  onComplete,
  isMobile 
}) {
  const [removals, setRemovals] = useState([])
  const [additions, setAdditions] = useState('')
  const [notes, setNotes] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  
  useEffect(() => {
    if (value) {
      setRemovals(value.removals || [])
      setAdditions(value.additions?.join(', ') || '')
      setNotes(value.notes || '')
    }
  }, [value])
  
  const handleToggleRemoval = (sourceId) => {
    let updatedRemovals
    
    if (removals.includes(sourceId)) {
      updatedRemovals = removals.filter(id => id !== sourceId)
    } else {
      updatedRemovals = [...removals, sourceId]
    }
    
    setRemovals(updatedRemovals)
    updateValue(updatedRemovals, additions, notes)
  }
  
  const handleAdditionsChange = (text) => {
    setAdditions(text)
    updateValue(removals, text, notes)
  }
  
  const handleNotesChange = (text) => {
    setNotes(text)
    updateValue(removals, additions, text)
  }
  
  const updateValue = (currentRemovals, currentAdditions, currentNotes) => {
    const additionsArray = currentAdditions
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
    
    const preferences = {
      standard_list: STANDARD_FAT_SOURCES.map(s => s.name),
      removals: currentRemovals,
      additions: additionsArray,
      notes: currentNotes || null
    }
    
    onChange(preferences)
    onComplete(true)
  }
  
  const activeCount = STANDARD_FAT_SOURCES.length - removals.length
  const additionsCount = additions.split(',').filter(a => a.trim()).length
  
  return (
    <div style={getSectionContainerStyle(isMobile)}>
      <div style={getSectionHeaderStyle(isMobile)}>
        <h2 style={getSectionTitleStyle(isMobile)}>
          4. Vetten
        </h2>
        <p style={getSectionDescriptionStyle(isMobile)}>
          Deze vetten zijn essentieel voor hormonale gezondheid en herstel.
        </p>
      </div>
      
      <div style={getCardStyle(isMobile)}>
        <div style={getCardHeaderStyle(isMobile)}>
          <div style={getCardTitleStyle(isMobile)}>
            ✅ Standaard Vetten
          </div>
          <div style={getCountBadgeStyle()}>
            {activeCount} / {STANDARD_FAT_SOURCES.length}
          </div>
        </div>
        
        <div style={getSourcesGridStyle(isMobile)}>
          {STANDARD_FAT_SOURCES.map((source) => {
            const isRemoved = removals.includes(source.id)
            
            return (
              <div
                key={source.id}
                style={getSourceItemStyle(isMobile, isRemoved)}
                onClick={() => handleToggleRemoval(source.id)}
              >
                <div style={getSourceCheckboxStyle(isRemoved)}>
                  {!isRemoved && '✓'}
                </div>
                
                <div style={getSourceContentStyle()}>
                  <div style={getSourceNameStyle(isRemoved)}>
                    {source.name}
                  </div>
                  <div style={getSourceReasonStyle(isRemoved)}>
                    {source.reason}
                  </div>
                </div>
                
                {isRemoved && (
                  <div style={getRemovedBadgeStyle()}>
                    Uitgesloten
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <div style={getInfoBoxStyle(isMobile)}>
          💡 Klik op een vetbron om deze uit te sluiten
        </div>
      </div>
      
      <div style={getCardStyle(isMobile)}>
        <div style={getCardHeaderStyle(isMobile)}>
          <div style={getCardTitleStyle(isMobile)}>
            ➕ Eigen Toevoegingen
          </div>
          {additionsCount > 0 && (
            <div style={getCountBadgeStyle(true)}>
              +{additionsCount}
            </div>
          )}
        </div>
        
        {!showCustomInput ? (
          <button
            onClick={() => setShowCustomInput(true)}
            style={getAddButtonStyle(isMobile)}
          >
            + Vetbron toevoegen
          </button>
        ) : (
          <div style={getCustomInputContainerStyle()}>
            <textarea
              value={additions}
              onChange={(e) => handleAdditionsChange(e.target.value)}
              placeholder="Bijv: Lijnzaadolie, Cashewnoten, Kokosolie"
              style={getTextareaStyle(isMobile)}
              rows={2}
            />
            <div style={getHintTextStyle()}>
              Scheid meerdere items met komma's
            </div>
          </div>
        )}
      </div>
      
      {(removals.length > 0 || additions.length > 0) && (
        <div style={getCardStyle(isMobile)}>
          <div style={getCardTitleStyle(isMobile)}>
            📝 Toelichting (optioneel)
          </div>
          
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Leg kort uit waarom je bepaalde keuzes hebt gemaakt..."
            style={getTextareaStyle(isMobile)}
            rows={3}
          />
        </div>
      )}
      
      {value && (
        <div style={getSummaryBoxStyle(isMobile)}>
          {removals.length === 0 && additionsCount === 0 ? (
            <div style={getSummaryTextStyle()}>
              ✓ Je gebruikt alle standaard vetten
            </div>
          ) : (
            <>
              {removals.length > 0 && (
                <div style={getSummaryTextStyle()}>
                  ❌ {removals.length} vetbron{removals.length > 1 ? 'nen' : ''} uitgesloten
                </div>
              )}
              {additionsCount > 0 && (
                <div style={getSummaryTextStyle()}>
                  ➕ {additionsCount} vetbron{additionsCount > 1 ? 'nen' : ''} toegevoegd
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Styles identical to previous sections
function getSectionContainerStyle(isMobile) { return { padding: responsive(isMobile, '2rem 1rem', '3rem 2rem'), maxWidth: '900px', margin: '0 auto' }}
function getSectionHeaderStyle(isMobile) { return { marginBottom: responsive(isMobile, '1.5rem', '2rem') }}
function getSectionTitleStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.h2, intakeTheme.fontSize.desktop.h2), fontWeight: intakeTheme.fontWeight.bold, color: intakeTheme.colors.white, margin: 0, marginBottom: '0.5rem' }}
function getSectionDescriptionStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.body, intakeTheme.fontSize.desktop.body), color: intakeTheme.colors.lightGray, lineHeight: 1.6, margin: 0 }}
function getCardHeaderStyle(isMobile) { return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: responsive(isMobile, '1rem', '1.5rem'), paddingBottom: '1rem', borderBottom: `1px solid ${intakeTheme.border.color}` }}
function getCardTitleStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.h4, intakeTheme.fontSize.desktop.h4), fontWeight: intakeTheme.fontWeight.semibold, color: intakeTheme.colors.gold }}
function getCountBadgeStyle(isAddition = false) { return { padding: '0.25rem 0.75rem', background: isAddition ? intakeTheme.colors.green : intakeTheme.colors.gold, color: intakeTheme.colors.black, fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.bold, borderRadius: intakeTheme.border.radius.full }}
function getSourcesGridStyle(isMobile) { return { display: 'flex', flexDirection: 'column', gap: responsive(isMobile, '0.75rem', '1rem') }}
function getSourceItemStyle(isMobile, isRemoved) { return { display: 'flex', alignItems: 'center', gap: responsive(isMobile, '0.75rem', '1rem'), padding: responsive(isMobile, '1rem', '1.25rem'), background: isRemoved ? intakeTheme.colors.black : intakeTheme.colors.mediumGray, border: `1px solid ${isRemoved ? '#ef4444' : intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.medium, cursor: 'pointer', transition: intakeTheme.transitions.normal, opacity: isRemoved ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
function getSourceCheckboxStyle(isRemoved) { return { width: '24px', height: '24px', borderRadius: intakeTheme.border.radius.small, border: `2px solid ${isRemoved ? '#ef4444' : intakeTheme.colors.gold}`, background: isRemoved ? 'transparent' : intakeTheme.colors.gold, color: intakeTheme.colors.black, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: intakeTheme.fontWeight.bold, flexShrink: 0, transition: intakeTheme.transitions.normal }}
function getSourceContentStyle() { return { flex: 1, minWidth: 0 }}
function getSourceNameStyle(isRemoved) { return { fontSize: intakeTheme.fontSize.mobile.body, fontWeight: intakeTheme.fontWeight.semibold, color: isRemoved ? intakeTheme.colors.lightGray : intakeTheme.colors.white, marginBottom: '0.25rem', textDecoration: isRemoved ? 'line-through' : 'none' }}
function getSourceReasonStyle(isRemoved) { return { fontSize: intakeTheme.fontSize.mobile.small, color: intakeTheme.colors.lightGray, lineHeight: 1.4 }}
function getRemovedBadgeStyle() { return { padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', fontSize: intakeTheme.fontSize.mobile.tiny, fontWeight: intakeTheme.fontWeight.semibold, borderRadius: intakeTheme.border.radius.small, whiteSpace: 'nowrap' }}
function getInfoBoxStyle(isMobile) { return { marginTop: responsive(isMobile, '1rem', '1.5rem'), padding: '0.75rem 1rem', background: `rgba(201, 165, 90, 0.1)`, border: `1px solid ${intakeTheme.colors.darkGold}`, borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.gold, fontSize: intakeTheme.fontSize.mobile.small, textAlign: 'center' }}
function getAddButtonStyle(isMobile) { return { width: '100%', padding: responsive(isMobile, '1rem', '1.25rem'), background: intakeTheme.colors.darkGray, border: `1px dashed ${intakeTheme.colors.gold}`, borderRadius: intakeTheme.border.radius.medium, color: intakeTheme.colors.gold, fontSize: intakeTheme.fontSize.mobile.body, fontWeight: intakeTheme.fontWeight.semibold, cursor: 'pointer', transition: intakeTheme.transitions.normal, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
function getCustomInputContainerStyle() { return { display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
function getTextareaStyle(isMobile) { return { width: '100%', padding: responsive(isMobile, '0.75rem', '1rem'), background: intakeTheme.colors.black, border: `1px solid ${intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.white, fontSize: intakeTheme.fontSize.mobile.body, fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', outline: 'none', transition: intakeTheme.transitions.normal }}
function getHintTextStyle() { return { fontSize: intakeTheme.fontSize.mobile.tiny, color: intakeTheme.colors.lightGray, fontStyle: 'italic' }}
function getSummaryBoxStyle(isMobile) { return { marginTop: responsive(isMobile, '1.5rem', '2rem'), padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: `1px solid ${intakeTheme.colors.green}`, borderRadius: intakeTheme.border.radius.medium, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
function getSummaryTextStyle() { return { fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.semibold, color: intakeTheme.colors.green }}

console.log('✅ FatsSection component loaded')
