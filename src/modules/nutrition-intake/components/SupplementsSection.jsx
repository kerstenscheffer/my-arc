// SupplementsSection.jsx
// Supplementen Section - Standaard lijst met optie tot verwijderen

import React, { useState, useEffect } from 'react'
import { intakeTheme, responsive, getCardStyle } from '../styles/intake-theme'

const STANDARD_SUPPLEMENTS = [
  { 
    id: 'creatine', 
    name: 'Creatine Monohydraat', 
    dosage: '5g per dag',
    reason: 'Bewezen effectief voor kracht en spiergroei',
    timing: 'Timing maakt niet uit, consistent nemen'
  },
  { 
    id: 'omega3', 
    name: 'Omega-3 Fish Oil', 
    dosage: '2-3g EPA+DHA per dag',
    reason: 'Voor herstel, ontstekingsremming en hormonale gezondheid',
    timing: 'Bij een maaltijd met vet voor betere opname'
  },
  { 
    id: 'magnesium', 
    name: 'Magnesium', 
    dosage: '400mg voor slaap',
    reason: 'Voor slaapkwaliteit en spier recovery',
    timing: 'Voor het slapen gaan'
  },
  { 
    id: 'whey', 
    name: 'Whey Protein', 
    dosage: '1-2 scoops per dag (optioneel)',
    reason: 'Alleen als je moeite hebt om eiwit binnen te krijgen',
    timing: 'Post-workout of als snack'
  }
]

export default function SupplementsSection({ 
  value, 
  onChange, 
  onComplete,
  isMobile 
}) {
  const [removals, setRemovals] = useState([])
  const [notes, setNotes] = useState('')
  
  useEffect(() => {
    if (value) {
      setRemovals(value.removals || [])
      setNotes(value.notes || '')
    }
  }, [value])
  
  const handleToggleRemoval = (supplementId) => {
    let updatedRemovals
    
    if (removals.includes(supplementId)) {
      updatedRemovals = removals.filter(id => id !== supplementId)
    } else {
      updatedRemovals = [...removals, supplementId]
    }
    
    setRemovals(updatedRemovals)
    updateValue(updatedRemovals, notes)
  }
  
  const handleNotesChange = (text) => {
    setNotes(text)
    updateValue(removals, text)
  }
  
  const updateValue = (currentRemovals, currentNotes) => {
    const preferences = {
      standard_list: STANDARD_SUPPLEMENTS.map(s => s.name),
      removals: currentRemovals,
      notes: currentNotes || null
    }
    
    onChange(preferences)
    onComplete(true)
  }
  
  const activeCount = STANDARD_SUPPLEMENTS.length - removals.length
  
  return (
    <div style={getSectionContainerStyle(isMobile)}>
      <div style={getSectionHeaderStyle(isMobile)}>
        <h2 style={getSectionTitleStyle(isMobile)}>
          6. Supplementen
        </h2>
        <p style={getSectionDescriptionStyle(isMobile)}>
          Deze supplementen zijn evidence-based en onderdeel van het 5-8KG Droog Project protocol.
        </p>
      </div>
      
      <div style={getCardStyle(isMobile)}>
        <div style={getCardHeaderStyle(isMobile)}>
          <div style={getCardTitleStyle(isMobile)}>
            💊 Standaard Supplementen
          </div>
          <div style={getCountBadgeStyle()}>
            {activeCount} / {STANDARD_SUPPLEMENTS.length}
          </div>
        </div>
        
        <div style={getSupplementsGridStyle(isMobile)}>
          {STANDARD_SUPPLEMENTS.map((supplement) => {
            const isRemoved = removals.includes(supplement.id)
            
            return (
              <div
                key={supplement.id}
                style={getSupplementCardStyle(isMobile, isRemoved)}
              >
                <div style={getSupplementHeaderStyle()}>
                  <div 
                    style={getSupplementCheckboxStyle(isRemoved)}
                    onClick={() => handleToggleRemoval(supplement.id)}
                  >
                    {!isRemoved && '✓'}
                  </div>
                  
                  <div style={getSupplementHeaderContentStyle()}>
                    <div style={getSupplementNameStyle(isRemoved)}>
                      {supplement.name}
                    </div>
                    <div style={getSupplementDosageStyle(isRemoved)}>
                      {supplement.dosage}
                    </div>
                  </div>
                  
                  {isRemoved && (
                    <div style={getRemovedBadgeStyle()}>
                      Niet nemen
                    </div>
                  )}
                </div>
                
                <div style={getSupplementDetailsStyle(isRemoved)}>
                  <div style={getSupplementDetailItemStyle()}>
                    <span style={getSupplementDetailLabelStyle()}>Waarom:</span>
                    <span style={getSupplementDetailValueStyle()}>{supplement.reason}</span>
                  </div>
                  <div style={getSupplementDetailItemStyle()}>
                    <span style={getSupplementDetailLabelStyle()}>Timing:</span>
                    <span style={getSupplementDetailValueStyle()}>{supplement.timing}</span>
                  </div>
                </div>
                
                {!isRemoved && (
                  <button
                    onClick={() => handleToggleRemoval(supplement.id)}
                    style={getRemoveButtonStyle(isMobile)}
                  >
                    Dit wil ik niet nemen
                  </button>
                )}
                
                {isRemoved && (
                  <button
                    onClick={() => handleToggleRemoval(supplement.id)}
                    style={getAddBackButtonStyle(isMobile)}
                  >
                    ↺ Toch wel nemen
                  </button>
                )}
              </div>
            )
          })}
        </div>
        
        <div style={getInfoBoxStyle(isMobile)}>
          💡 <strong>Let op:</strong> Creatine, Omega-3 en Magnesium zijn de basis. Whey is alleen nodig als je eiwit tekort komt.
        </div>
      </div>
      
      {removals.length > 0 && (
        <div style={getCardStyle(isMobile)}>
          <div style={getCardTitleStyle(isMobile)}>
            📝 Waarom wil je dit niet nemen?
          </div>
          
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Bijv: Ik eet veel vette vis dus geen fish oil nodig"
            style={getTextareaStyle(isMobile)}
            rows={3}
          />
        </div>
      )}
      
      {value && (
        <div style={getSummaryBoxStyle(isMobile)}>
          {removals.length === 0 ? (
            <div style={getSummaryTextStyle()}>
              ✓ Je neemt alle aanbevolen supplementen
            </div>
          ) : (
            <div style={getSummaryTextStyle()}>
              ⚠️ Je sluit {removals.length} supplement{removals.length > 1 ? 'en' : ''} uit
            </div>
          )}
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
function getSupplementsGridStyle(isMobile) { return { display: 'flex', flexDirection: 'column', gap: responsive(isMobile, '1rem', '1.5rem') }}
function getSupplementCardStyle(isMobile, isRemoved) { return { background: isRemoved ? intakeTheme.colors.black : intakeTheme.colors.mediumGray, border: `1px solid ${isRemoved ? '#ef4444' : intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.medium, padding: responsive(isMobile, '1rem', '1.25rem'), opacity: isRemoved ? 0.6 : 1, transition: intakeTheme.transitions.normal }}
function getSupplementHeaderStyle() { return { display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}
function getSupplementCheckboxStyle(isRemoved) { return { width: '28px', height: '28px', borderRadius: intakeTheme.border.radius.small, border: `2px solid ${isRemoved ? '#ef4444' : intakeTheme.colors.gold}`, background: isRemoved ? 'transparent' : intakeTheme.colors.gold, color: intakeTheme.colors.black, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: intakeTheme.fontWeight.bold, flexShrink: 0, cursor: 'pointer', transition: intakeTheme.transitions.normal, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
function getSupplementHeaderContentStyle() { return { flex: 1, minWidth: 0 }}
function getSupplementNameStyle(isRemoved) { return { fontSize: intakeTheme.fontSize.mobile.bodyLarge, fontWeight: intakeTheme.fontWeight.bold, color: isRemoved ? intakeTheme.colors.lightGray : intakeTheme.colors.white, marginBottom: '0.25rem', textDecoration: isRemoved ? 'line-through' : 'none' }}
function getSupplementDosageStyle(isRemoved) { return { fontSize: intakeTheme.fontSize.mobile.small, color: intakeTheme.colors.gold, fontWeight: intakeTheme.fontWeight.semibold }}
function getRemovedBadgeStyle() { return { padding: '0.25rem 0.75rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', fontSize: intakeTheme.fontSize.mobile.tiny, fontWeight: intakeTheme.fontWeight.semibold, borderRadius: intakeTheme.border.radius.small, whiteSpace: 'nowrap' }}
function getSupplementDetailsStyle(isRemoved) { return { display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '44px', marginBottom: '1rem' }}
function getSupplementDetailItemStyle() { return { display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
function getSupplementDetailLabelStyle() { return { fontSize: intakeTheme.fontSize.mobile.tiny, color: intakeTheme.colors.gold, fontWeight: intakeTheme.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: '0.05em' }}
function getSupplementDetailValueStyle() { return { fontSize: intakeTheme.fontSize.mobile.small, color: intakeTheme.colors.lightGray, lineHeight: 1.4 }}
function getRemoveButtonStyle(isMobile) { return { width: '100%', padding: responsive(isMobile, '0.75rem', '1rem'), background: 'transparent', border: `1px solid ${intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.lightGray, fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.semibold, cursor: 'pointer', transition: intakeTheme.transitions.normal, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
function getAddBackButtonStyle(isMobile) { return { width: '100%', padding: responsive(isMobile, '0.75rem', '1rem'), background: intakeTheme.colors.gold, border: 'none', borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.black, fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.bold, cursor: 'pointer', transition: intakeTheme.transitions.normal, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
function getInfoBoxStyle(isMobile) { return { marginTop: responsive(isMobile, '1rem', '1.5rem'), padding: '1rem', background: `rgba(201, 165, 90, 0.1)`, border: `1px solid ${intakeTheme.colors.darkGold}`, borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.lightGray, fontSize: intakeTheme.fontSize.mobile.small, lineHeight: 1.6 }}
function getTextareaStyle(isMobile) { return { width: '100%', padding: responsive(isMobile, '0.75rem', '1rem'), background: intakeTheme.colors.black, border: `1px solid ${intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.white, fontSize: intakeTheme.fontSize.mobile.body, fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', outline: 'none', transition: intakeTheme.transitions.normal }}
function getSummaryBoxStyle(isMobile) { return { marginTop: responsive(isMobile, '1.5rem', '2rem'), padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: `1px solid ${intakeTheme.colors.green}`, borderRadius: intakeTheme.border.radius.medium, textAlign: 'center' }}
function getSummaryTextStyle() { return { fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.semibold, color: intakeTheme.colors.green }}

console.log('✅ SupplementsSection component loaded')
