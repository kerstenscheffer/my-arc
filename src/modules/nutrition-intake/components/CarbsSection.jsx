// FILE: src/modules/nutrition-intake/components/CarbsSection.jsx
// CarbsSection.jsx - LOCKED DEFAULT + unlock option
import React, { useState, useEffect } from 'react'
import { intakeTheme, responsive, getCardStyle } from '../styles/intake-theme'

const STANDARD_CARB_SOURCES = [
  { id: 'rijst', name: 'Witte rijst', reason: 'Makkelijk verteerbaar, ideaal pre/post workout' },
  { id: 'havermout', name: 'Havermout', reason: 'Slow release, satiërend, vezels' },
  { id: 'aardappel', name: 'Zoete aardappel', reason: 'Rijk aan vezels, micronutriënten' },
  { id: 'basmati', name: 'Basmati rijst', reason: 'Lage GI, constante energie' },
  { id: 'pasta', name: 'Volkoren pasta', reason: 'Satiërend, vezelrijk' }
]

export default function CarbsSection({ value, onChange, onComplete, isMobile }) {
  const [wantsToCustomize, setWantsToCustomize] = useState(false)
  const [removals, setRemovals] = useState([])
  const [additions, setAdditions] = useState('')
  const [notes, setNotes] = useState('')
  
  useEffect(() => {
    if (value) {
      setRemovals(value.removals || [])
      setAdditions(value.additions?.join(', ') || '')
      setNotes(value.notes || '')
      setWantsToCustomize(value.removals?.length > 0 || value.additions?.length > 0 || value.notes)
    }
  }, [value])
  
  const handleAcceptStandard = () => {
    onChange({ standard_list: STANDARD_CARB_SOURCES.map(s => s.name), removals: [], additions: [], notes: null })
    onComplete(true)
  }
  
  const handleWantToCustomize = () => setWantsToCustomize(true)
  
  const handleToggleRemoval = (sourceId) => {
    const updated = removals.includes(sourceId) ? removals.filter(id => id !== sourceId) : [...removals, sourceId]
    setRemovals(updated)
    updateValue(updated, additions, notes)
  }
  
  const handleAdditionsChange = (text) => { setAdditions(text); updateValue(removals, text, notes) }
  const handleNotesChange = (text) => { setNotes(text); updateValue(removals, additions, text) }
  
  const updateValue = (currentRemovals, currentAdditions, currentNotes) => {
    const additionsArray = currentAdditions.split(',').map(i => i.trim()).filter(i => i.length > 0)
    onChange({ standard_list: STANDARD_CARB_SOURCES.map(s => s.name), removals: currentRemovals, additions: additionsArray, notes: currentNotes || null })
    onComplete(true)
  }
  
  return (
    <div style={getSectionContainerStyle(isMobile)}>
      <div style={getSectionHeaderStyle(isMobile)}>
        <h2 style={getSectionTitleStyle(isMobile)}>3. Koolhydraten</h2>
        <p style={getSectionDescriptionStyle(isMobile)}>Deze koolhydraten zijn gekozen voor constante energie en optimale prestaties.</p>
      </div>
      
      {!wantsToCustomize ? (
        <div style={getLockedCardStyle(isMobile)}>
          <div style={getLockedHeaderStyle(isMobile)}>
            <div style={getLockedIconStyle()}>✅</div>
            <div style={getLockedTitleStyle(isMobile)}>STANDAARD KOOLHYDRATEN</div>
          </div>
          
          <div style={getStandardListStyle(isMobile)}>
            {STANDARD_CARB_SOURCES.map(source => (
              <div key={source.id} style={getStandardItemStyle(isMobile)}>
                <div style={getStandardNameStyle()}>• {source.name}</div>
                <div style={getStandardReasonStyle()}>{source.reason}</div>
              </div>
            ))}
          </div>
          
          <div style={getInfoBoxStyle(isMobile)}>💡 Deze bronnen zorgen voor stabiele energie door de dag</div>
          
          <div style={getButtonGroupStyle(isMobile)}>
            <button onClick={handleAcceptStandard} style={getPrimaryButtonStyle(isMobile)}>✓ Dit is prima</button>
            <button onClick={handleWantToCustomize} style={getSecondaryButtonStyle(isMobile)}>Aanpassen</button>
          </div>
        </div>
      ) : (
        <>
          <div style={getCustomCardStyle(isMobile)}>
            <div style={getCardTitleStyle(isMobile)}>Wat wil je VERWIJDEREN?</div>
            <div style={getRemovalListStyle(isMobile)}>
              {STANDARD_CARB_SOURCES.map(source => (
                <label key={source.id} style={getCheckboxLabelStyle(isMobile)}>
                  <input type="checkbox" checked={removals.includes(source.id)} onChange={() => handleToggleRemoval(source.id)} style={getCheckboxStyle()} />
                  <span>{source.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div style={getCustomCardStyle(isMobile)}>
            <div style={getCardTitleStyle(isMobile)}>Wat wil je TOEVOEGEN?</div>
            <textarea value={additions} onChange={(e) => handleAdditionsChange(e.target.value)} placeholder="Bijv: Quinoa, Bruine rijst, Couscous" style={getTextareaStyle(isMobile)} rows={2} />
            <div style={getHintStyle()}>Scheid items met komma's</div>
          </div>
          
          <div style={getCustomCardStyle(isMobile)}>
            <div style={getCardTitleStyle(isMobile)}>Specifieke opmerkingen</div>
            <textarea value={notes} onChange={(e) => handleNotesChange(e.target.value)} placeholder="Bijv: Gluten-intolerant, liever geen pasta..." style={getTextareaStyle(isMobile)} rows={3} />
          </div>
        </>
      )}
      
      {value && (removals.length > 0 || additions.split(',').filter(a => a.trim()).length > 0) && (
        <div style={getSummaryBoxStyle()}>
          {removals.length > 0 && <div>❌ {removals.length} verwijderd</div>}
          {additions.split(',').filter(a => a.trim()).length > 0 && <div>➕ {additions.split(',').filter(a => a.trim()).length} toegevoegd</div>}
        </div>
      )}
    </div>
  )
}

function getSectionContainerStyle(isMobile) { return { padding: responsive(isMobile, '2rem 1rem', '3rem 2rem'), maxWidth: '900px', margin: '0 auto' }}
function getSectionHeaderStyle(isMobile) { return { marginBottom: responsive(isMobile, '1.5rem', '2rem') }}
function getSectionTitleStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.h2, intakeTheme.fontSize.desktop.h2), fontWeight: intakeTheme.fontWeight.bold, color: intakeTheme.colors.white, margin: 0, marginBottom: '0.5rem' }}
function getSectionDescriptionStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.body, intakeTheme.fontSize.desktop.body), color: intakeTheme.colors.lightGray, lineHeight: 1.6, margin: 0 }}
function getLockedCardStyle(isMobile) { return { background: intakeTheme.gradients.darkCard, border: `2px solid ${intakeTheme.colors.gold}`, borderRadius: intakeTheme.border.radius.large, padding: responsive(isMobile, '1.5rem', '2rem'), boxShadow: intakeTheme.shadows.goldStrong }}
function getLockedHeaderStyle(isMobile) { return { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${intakeTheme.border.color}` }}
function getLockedIconStyle() { return { fontSize: '2rem' }}
function getLockedTitleStyle(isMobile) { return { fontSize: responsive(isMobile, intakeTheme.fontSize.mobile.h4, intakeTheme.fontSize.desktop.h4), fontWeight: intakeTheme.fontWeight.bold, color: intakeTheme.colors.gold, letterSpacing: '0.05em' }}
function getStandardListStyle(isMobile) { return { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}
function getStandardItemStyle(isMobile) { return { padding: '1rem', background: intakeTheme.colors.mediumGray, borderRadius: intakeTheme.border.radius.small, border: `1px solid ${intakeTheme.border.color}` }}
function getStandardNameStyle() { return { fontSize: intakeTheme.fontSize.mobile.body, fontWeight: intakeTheme.fontWeight.semibold, color: intakeTheme.colors.white, marginBottom: '0.25rem' }}
function getStandardReasonStyle() { return { fontSize: intakeTheme.fontSize.mobile.small, color: intakeTheme.colors.lightGray }}
function getInfoBoxStyle(isMobile) { return { padding: '1rem', background: 'rgba(201, 165, 90, 0.1)', border: `1px solid ${intakeTheme.colors.darkGold}`, borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.gold, fontSize: intakeTheme.fontSize.mobile.small, marginBottom: '1.5rem', textAlign: 'center' }}
function getButtonGroupStyle(isMobile) { return { display: 'flex', flexDirection: responsive(isMobile, 'column', 'row'), gap: '1rem' }}
function getPrimaryButtonStyle(isMobile) { return { flex: 1, padding: responsive(isMobile, '1rem', '1.25rem'), fontSize: intakeTheme.fontSize.mobile.body, fontWeight: intakeTheme.fontWeight.bold, color: intakeTheme.colors.black, background: intakeTheme.gradients.primary, border: 'none', borderRadius: intakeTheme.border.radius.medium, cursor: 'pointer', boxShadow: intakeTheme.shadows.gold, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
function getSecondaryButtonStyle(isMobile) { return { flex: 1, padding: responsive(isMobile, '1rem', '1.25rem'), fontSize: intakeTheme.fontSize.mobile.body, fontWeight: intakeTheme.fontWeight.semibold, color: intakeTheme.colors.gold, background: 'transparent', border: `1px solid ${intakeTheme.colors.gold}`, borderRadius: intakeTheme.border.radius.medium, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
function getCustomCardStyle(isMobile) { return { background: intakeTheme.gradients.darkCard, border: `1px solid ${intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.medium, padding: responsive(isMobile, '1rem', '1.5rem'), marginBottom: '1rem' }}
function getCardTitleStyle(isMobile) { return { fontSize: intakeTheme.fontSize.mobile.h4, fontWeight: intakeTheme.fontWeight.semibold, color: intakeTheme.colors.gold, marginBottom: '1rem' }}
function getRemovalListStyle(isMobile) { return { display: 'grid', gridTemplateColumns: responsive(isMobile, '1fr', 'repeat(2, 1fr)'), gap: '0.75rem' }}
function getCheckboxLabelStyle(isMobile) { return { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: intakeTheme.colors.mediumGray, borderRadius: intakeTheme.border.radius.small, cursor: 'pointer', fontSize: intakeTheme.fontSize.mobile.body, color: intakeTheme.colors.white }}
function getCheckboxStyle() { return { width: '20px', height: '20px', cursor: 'pointer' }}
function getTextareaStyle(isMobile) { return { width: '100%', padding: '1rem', background: intakeTheme.colors.black, border: `1px solid ${intakeTheme.border.color}`, borderRadius: intakeTheme.border.radius.small, color: intakeTheme.colors.white, fontSize: intakeTheme.fontSize.mobile.body, fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', outline: 'none' }}
function getHintStyle() { return { fontSize: intakeTheme.fontSize.mobile.tiny, color: intakeTheme.colors.lightGray, marginTop: '0.5rem', fontStyle: 'italic' }}
function getSummaryBoxStyle() { return { marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: `1px solid ${intakeTheme.colors.green}`, borderRadius: intakeTheme.border.radius.medium, color: intakeTheme.colors.green, fontSize: intakeTheme.fontSize.mobile.small, fontWeight: intakeTheme.fontWeight.semibold, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
