// FILE: src/modules/nutrition-intake/components/IntakeViewModal.jsx
// Modal to view client nutrition preferences in AI Meal Generator
// Version 2.0 - Full data display + Copy to clipboard functionality

import React, { useState, useEffect } from 'react'
import { X, Clock, Utensils, Apple, Leaf, Pill, Home, Copy, Check } from 'lucide-react'

// Standard lists for reference
const STANDARD_LISTS = {
  protein: ['Kipfilet', 'Eieren', 'Magere kwark', 'Zalm', 'Magere rundvlees', 'Whey protein'],
  carbs: ['Witte rijst', 'Havermout', 'Zoete aardappel', 'Basmati rijst', 'Volkoren pasta'],
  fats: ['Olijfolie extra vierge', 'Rauwe noten (amandelen/walnoten)', 'Avocado', 'Pindakaas (suikervrij)'],
  supplements: ['Creatine Monohydraat', 'Omega-3 Fish Oil', 'Magnesium', 'Whey Protein']
}

export default function IntakeViewModal({ db, clientId, onClose, isMobile }) {
  const [preferences, setPreferences] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    loadData()
  }, [clientId])
  
  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load preferences
      const prefs = await db.getClientNutritionPreferences(clientId)
      if (!prefs) {
        setError('Geen voedingsvoorkeuren gevonden voor deze client.')
        setLoading(false)
        return
      }
      
      // Load client data for name and macros
      const { data: client, error: clientError } = await db.supabase
        .from('clients')
        .select('first_name, last_name, target_calories, target_protein, target_carbs, target_fat')
        .eq('id', clientId)
        .single()
      
      if (clientError) throw clientError
      
      setPreferences(prefs)
      setClientData(client)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Kon gegevens niet laden.')
      setLoading(false)
    }
  }
  
  // Generate copy text
  const generateCopyText = () => {
    if (!preferences || !clientData) return ''
    
    const { 
      meal_schedule, 
      protein_preferences, 
      carb_preferences, 
      fat_preferences, 
      vegetable_preferences, 
      supplement_preferences, 
      practical_info 
    } = preferences
    
    const clientName = `${clientData.first_name} ${clientData.last_name}`
    const macros = `${clientData.target_calories || 0} kcal | ${clientData.target_protein || 0}g eiwit | ${clientData.target_carbs || 0}g carbs | ${clientData.target_fat || 0}g vet`
    const date = new Date().toLocaleDateString('nl-NL')
    
    let text = `===========================================
VOEDINGSVOORKEUREN INTAKE
===========================================

CLIENT: ${clientName}
MACRO TARGETS: ${macros}
DATUM: ${date}

`
    
    // Meal Schedule
    if (meal_schedule) {
      text += `-------------------------------------------
MAALTIJD SCHEMA
-------------------------------------------
Aantal maaltijden: ${meal_schedule.num_meals} per dag
${meal_schedule.custom_adjustments ? `Status: ${meal_schedule.custom_adjustments}` : 'Status: Standaard geaccepteerd'}
Schema:
`
      meal_schedule.times?.forEach((time, i) => {
        const label = meal_schedule.labels?.[i] || `Maaltijd ${i + 1}`
        const cals = meal_schedule.caloriesPerMeal?.[i] || 0
        text += `  • ${label} - ${time} (${cals} kcal)\n`
      })
      text += '\n'
    }
    
    // Protein
    if (protein_preferences) {
      text += `-------------------------------------------
EIWITBRONNEN
-------------------------------------------
`
      const accepted = STANDARD_LISTS.protein.filter(item => 
        !protein_preferences.removals?.includes(item.toLowerCase().replace(/\s/g, ''))
      )
      if (accepted.length > 0) {
        text += `✅ Geaccepteerd: ${accepted.join(', ')}\n`
      }
      if (protein_preferences.removals?.length > 0) {
        text += `❌ Verwijderd: ${protein_preferences.removals.join(', ')}\n`
      }
      if (protein_preferences.additions?.length > 0) {
        text += `➕ Toegevoegd: ${protein_preferences.additions.join(', ')}\n`
      }
      if (protein_preferences.notes) {
        text += `📝 Opmerking: ${protein_preferences.notes}\n`
      }
      text += '\n'
    }
    
    // Carbs
    if (carb_preferences) {
      text += `-------------------------------------------
KOOLHYDRATEN
-------------------------------------------
`
      const accepted = STANDARD_LISTS.carbs.filter(item => 
        !carb_preferences.removals?.includes(item.toLowerCase().replace(/\s/g, ''))
      )
      if (accepted.length > 0) {
        text += `✅ Geaccepteerd: ${accepted.join(', ')}\n`
      }
      if (carb_preferences.removals?.length > 0) {
        text += `❌ Verwijderd: ${carb_preferences.removals.join(', ')}\n`
      }
      if (carb_preferences.additions?.length > 0) {
        text += `➕ Toegevoegd: ${carb_preferences.additions.join(', ')}\n`
      }
      if (carb_preferences.notes) {
        text += `📝 Opmerking: ${carb_preferences.notes}\n`
      }
      text += '\n'
    }
    
    // Fats
    if (fat_preferences) {
      text += `-------------------------------------------
VETTEN
-------------------------------------------
`
      const accepted = STANDARD_LISTS.fats.filter(item => 
        !fat_preferences.removals?.includes(item.toLowerCase().replace(/\s/g, ''))
      )
      if (accepted.length > 0) {
        text += `✅ Geaccepteerd: ${accepted.join(', ')}\n`
      }
      if (fat_preferences.removals?.length > 0) {
        text += `❌ Verwijderd: ${fat_preferences.removals.join(', ')}\n`
      }
      if (fat_preferences.additions?.length > 0) {
        text += `➕ Toegevoegd: ${fat_preferences.additions.join(', ')}\n`
      }
      if (fat_preferences.notes) {
        text += `📝 Opmerking: ${fat_preferences.notes}\n`
      }
      text += '\n'
    }
    
    // Vegetables
    if (vegetable_preferences) {
      text += `-------------------------------------------
GROENTEN
-------------------------------------------
`
      if (vegetable_preferences.likes?.length > 0) {
        text += `✅ Geselecteerd (${vegetable_preferences.likes.length}): ${vegetable_preferences.likes.join(', ')}\n`
      }
      if (vegetable_preferences.dislikes?.length > 0) {
        text += `❌ Dislikes: ${vegetable_preferences.dislikes.join(', ')}\n`
      }
      if (vegetable_preferences.other) {
        text += `➕ Overige: ${vegetable_preferences.other}\n`
      }
      text += '\n'
    }
    
    // Supplements
    if (supplement_preferences) {
      text += `-------------------------------------------
SUPPLEMENTEN
-------------------------------------------
`
      const accepted = STANDARD_LISTS.supplements.filter(item => 
        !supplement_preferences.removals?.includes(item.toLowerCase().replace(/\s/g, ''))
      )
      if (accepted.length > 0) {
        text += `✅ Geaccepteerd: ${accepted.join(', ')}\n`
      }
      if (supplement_preferences.removals?.length > 0) {
        text += `❌ Niet nemen: ${supplement_preferences.removals.join(', ')}\n`
      }
      if (supplement_preferences.notes) {
        text += `📝 Reden: ${supplement_preferences.notes}\n`
      }
      text += '\n'
    }
    
    // Practical
    if (practical_info) {
      text += `-------------------------------------------
PRAKTISCHE INFORMATIE
-------------------------------------------
`
      if (practical_info.breakfast_location) {
        text += `Ontbijt: ${practical_info.breakfast_location}\n`
      }
      if (practical_info.lunch_location) {
        text += `Lunch: ${practical_info.lunch_location}\n`
      }
      if (practical_info.dinner_location) {
        text += `Diner: ${practical_info.dinner_location}\n`
      }
      if (practical_info.cooking_preference) {
        const cookPref = practical_info.cooking_preference === 'graag' ? 'Graag' : 
                        practical_info.cooking_preference === 'neutraal' ? 'Neutraal' : 'Niet graag'
        text += `Koken: ${cookPref}\n`
      }
      if (practical_info.variety_preference) {
        const variety = practical_info.variety_preference === 'varied' ? 'Gevarieerd' : 'Repetitief (zelfde wekelijks)'
        text += `Variatie: ${variety}\n`
      }
      if (practical_info.allergies) {
        text += `\nAllergieën/Restricties:\n${practical_info.allergies}\n`
      }
      if (practical_info.notes) {
        text += `\nExtra opmerkingen:\n${practical_info.notes}\n`
      }
    }
    
    text += '\n===========================================\n'
    
    return text
  }
  
  // Handle copy
  const handleCopy = async () => {
    const text = generateCopyText()
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Kopiëren mislukt. Probeer het opnieuw.')
    }
  }
  
  // Get accepted items (items not in removals list)
  const getAcceptedItems = (standardList, removals) => {
    if (!removals || removals.length === 0) return standardList
    return standardList.filter(item => {
      const itemKey = item.toLowerCase().replace(/\s/g, '')
      return !removals.includes(itemKey) && !removals.includes(item)
    })
  }
  
  if (loading) {
    return (
      <div style={getOverlayStyle()}>
        <div style={getModalStyle(isMobile)}>
          <div style={getLoadingStyle()}>
            <div style={getSpinnerStyle()}></div>
            <p>Voorkeuren laden...</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (error || !preferences) {
    return (
      <div style={getOverlayStyle()}>
        <div style={getModalStyle(isMobile)}>
          <div style={getHeaderStyle(isMobile)}>
            <h2 style={getTitleStyle(isMobile)}>Voedingsvoorkeuren</h2>
            <button onClick={onClose} style={getCloseButtonStyle()}>
              <X size={24} />
            </button>
          </div>
          
          <div style={getErrorStyle()}>
            <p>{error || 'Client heeft nog geen voedingsvoorkeuren ingevuld.'}</p>
            <button onClick={onClose} style={getPrimaryButtonStyle(isMobile)}>
              Sluiten
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  const { 
    meal_schedule, 
    protein_preferences, 
    carb_preferences, 
    fat_preferences, 
    vegetable_preferences, 
    supplement_preferences, 
    practical_info 
  } = preferences
  
  const clientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : 'Client'
  
  return (
    <div style={getOverlayStyle()} onClick={onClose}>
      <div style={getModalStyle(isMobile)} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={getHeaderStyle(isMobile)}>
          <div>
            <h2 style={getTitleStyle(isMobile)}>Voedingsvoorkeuren</h2>
            {clientData && (
              <div style={getSubtitleStyle()}>
                {clientName} • {clientData.target_calories || 0} kcal | {clientData.target_protein || 0}g P | {clientData.target_carbs || 0}g C | {clientData.target_fat || 0}g F
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={handleCopy} style={getCopyButtonStyle(copied)}>
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {!isMobile && <span>{copied ? 'Gekopieerd!' : 'Kopieer'}</span>}
            </button>
            <button onClick={onClose} style={getCloseButtonStyle()}>
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={getContentStyle(isMobile)}>
          
          {/* Meal Schedule */}
          {meal_schedule && (
            <div style={getSectionStyle()}>
              <div style={getSectionHeaderStyle()}>
                <Clock size={20} color="#C9A55A" />
                <h3 style={getSectionTitleStyle()}>Maaltijd Schema</h3>
              </div>
              
              <div style={getSectionContentStyle()}>
                <div style={getInfoRowStyle()}>
                  <strong>{meal_schedule.num_meals} maaltijden per dag</strong>
                  {meal_schedule.custom_adjustments && (
                    <span style={getBadgeStyle('blue')}>{meal_schedule.custom_adjustments}</span>
                  )}
                </div>
                
                <div style={getMealTimesGridStyle(isMobile)}>
                  {meal_schedule.times?.map((time, index) => (
                    <div key={index} style={getMealTimeCardStyle()}>
                      <div style={getMealLabelStyle()}>{meal_schedule.labels?.[index] || `Maaltijd ${index + 1}`}</div>
                      <div style={getMealTimeStyle()}>{time}</div>
                      <div style={getMealCaloriesStyle()}>{meal_schedule.caloriesPerMeal?.[index] || 0} kcal</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Protein */}
          {protein_preferences && (
            <div style={getSectionStyle()}>
              <div style={getSectionHeaderStyle()}>
                <Utensils size={20} color="#C9A55A" />
                <h3 style={getSectionTitleStyle()}>Eiwitbronnen</h3>
              </div>
              
              <div style={getSectionContentStyle()}>
                {/* Accepted */}
                {(() => {
                  const accepted = getAcceptedItems(STANDARD_LISTS.protein, protein_preferences.removals)
                  return accepted.length > 0 && (
                    <div style={getPreferenceBlockStyle()}>
                      <div style={getPreferenceLabelStyle('green')}>✅ Geaccepteerd:</div>
                      <div style={getPreferenceListStyle()}>
                        {accepted.map((item, i) => (
                          <span key={i} style={getPreferenceItemStyle('green')}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                
                {/* Removed */}
                {protein_preferences.removals?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('red')}>❌ Verwijderd:</div>
                    <div style={getPreferenceListStyle()}>
                      {protein_preferences.removals.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('red')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Added */}
                {protein_preferences.additions?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('blue')}>➕ Toegevoegd:</div>
                    <div style={getPreferenceListStyle()}>
                      {protein_preferences.additions.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('blue')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                {protein_preferences.notes && (
                  <div style={getNotesStyle()}>
                    <strong>Opmerkingen:</strong> {protein_preferences.notes}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Carbs */}
          {carb_preferences && (
            <div style={getSectionStyle()}>
              <div style={getSectionHeaderStyle()}>
                <Apple size={20} color="#C9A55A" />
                <h3 style={getSectionTitleStyle()}>Koolhydraten</h3>
              </div>
              
              <div style={getSectionContentStyle()}>
                {(() => {
                  const accepted = getAcceptedItems(STANDARD_LISTS.carbs, carb_preferences.removals)
                  return accepted.length > 0 && (
                    <div style={getPreferenceBlockStyle()}>
                      <div style={getPreferenceLabelStyle('green')}>✅ Geaccepteerd:</div>
                      <div style={getPreferenceListStyle()}>
                        {accepted.map((item, i) => (
                          <span key={i} style={getPreferenceItemStyle('green')}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                
                {carb_preferences.removals?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('red')}>❌ Verwijderd:</div>
                    <div style={getPreferenceListStyle()}>
                      {carb_preferences.removals.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('red')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {carb_preferences.additions?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('blue')}>➕ Toegevoegd:</div>
                    <div style={getPreferenceListStyle()}>
                      {carb_preferences.additions.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('blue')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {carb_preferences.notes && (
                  <div style={getNotesStyle()}>
                    <strong>Opmerkingen:</strong> {carb_preferences.notes}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Fats */}
          {fat_preferences && (
            <div style={getSectionStyle()}>
              <div style={getSectionHeaderStyle()}>
                <Leaf size={20} color="#C9A55A" />
                <h3 style={getSectionTitleStyle()}>Vetten</h3>
              </div>
              
              <div style={getSectionContentStyle()}>
                {(() => {
                  const accepted = getAcceptedItems(STANDARD_LISTS.fats, fat_preferences.removals)
                  return accepted.length > 0 && (
                    <div style={getPreferenceBlockStyle()}>
                      <div style={getPreferenceLabelStyle('green')}>✅ Geaccepteerd:</div>
                      <div style={getPreferenceListStyle()}>
                        {accepted.map((item, i) => (
                          <span key={i} style={getPreferenceItemStyle('green')}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                
                {fat_preferences.removals?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('red')}>❌ Verwijderd:</div>
                    <div style={getPreferenceListStyle()}>
                      {fat_preferences.removals.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('red')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {fat_preferences.additions?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('blue')}>➕ Toegevoegd:</div>
                    <div style={getPreferenceListStyle()}>
                      {fat_preferences.additions.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('blue')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {fat_preferences.notes && (
                  <div style={getNotesStyle()}>
                    <strong>Opmerkingen:</strong> {fat_preferences.notes}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Vegetables */}
          {vegetable_preferences && (
            <div style={getSectionStyle()}>
              <div style={getSectionHeaderStyle()}>
                <Leaf size={20} color="#10b981" />
                <h3 style={getSectionTitleStyle()}>Groenten</h3>
              </div>
              
              <div style={getSectionContentStyle()}>
                {vegetable_preferences.likes?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('green')}>✅ Geselecteerd ({vegetable_preferences.likes.length}):</div>
                    <div style={getPreferenceListStyle()}>
                      {vegetable_preferences.likes.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('green')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {vegetable_preferences.dislikes?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('red')}>❌ Dislikes:</div>
                    <div style={getPreferenceListStyle()}>
                      {vegetable_preferences.dislikes.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('red')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {vegetable_preferences.other && (
                  <div style={getNotesStyle()}>
                    <strong>Overige:</strong> {vegetable_preferences.other}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Supplements */}
          {supplement_preferences && (
            <div style={getSectionStyle()}>
              <div style={getSectionHeaderStyle()}>
                <Pill size={20} color="#a855f7" />
                <h3 style={getSectionTitleStyle()}>Supplementen</h3>
              </div>
              
              <div style={getSectionContentStyle()}>
                {(() => {
                  const accepted = getAcceptedItems(STANDARD_LISTS.supplements, supplement_preferences.removals)
                  return accepted.length > 0 && (
                    <div style={getPreferenceBlockStyle()}>
                      <div style={getPreferenceLabelStyle('green')}>✅ Geaccepteerd:</div>
                      <div style={getPreferenceListStyle()}>
                        {accepted.map((item, i) => (
                          <span key={i} style={getPreferenceItemStyle('green')}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                
                {supplement_preferences.removals?.length > 0 && (
                  <div style={getPreferenceBlockStyle()}>
                    <div style={getPreferenceLabelStyle('red')}>❌ Niet nemen:</div>
                    <div style={getPreferenceListStyle()}>
                      {supplement_preferences.removals.map((item, i) => (
                        <span key={i} style={getPreferenceItemStyle('red')}>{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {supplement_preferences.notes && (
                  <div style={getNotesStyle()}>
                    <strong>Reden:</strong> {supplement_preferences.notes}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Practical Info */}
          {practical_info && (
            <div style={getSectionStyle()}>
              <div style={getSectionHeaderStyle()}>
                <Home size={20} color="#3b82f6" />
                <h3 style={getSectionTitleStyle()}>Praktische Informatie</h3>
              </div>
              
              <div style={getSectionContentStyle()}>
                <div style={getPracticalGridStyle(isMobile)}>
                  {practical_info.breakfast_location && (
                    <div style={getPracticalItemStyle()}>
                      <div style={getPracticalLabelStyle()}>Ontbijt:</div>
                      <div>{practical_info.breakfast_location}</div>
                    </div>
                  )}
                  
                  {practical_info.lunch_location && (
                    <div style={getPracticalItemStyle()}>
                      <div style={getPracticalLabelStyle()}>Lunch:</div>
                      <div>{practical_info.lunch_location}</div>
                    </div>
                  )}
                  
                  {practical_info.dinner_location && (
                    <div style={getPracticalItemStyle()}>
                      <div style={getPracticalLabelStyle()}>Diner:</div>
                      <div>{practical_info.dinner_location}</div>
                    </div>
                  )}
                  
                  {practical_info.cooking_preference && (
                    <div style={getPracticalItemStyle()}>
                      <div style={getPracticalLabelStyle()}>Koken:</div>
                      <div>{practical_info.cooking_preference === 'graag' ? '✓ Graag' : practical_info.cooking_preference === 'neutraal' ? 'Neutraal' : 'Niet graag'}</div>
                    </div>
                  )}
                  
                  {practical_info.variety_preference && (
                    <div style={getPracticalItemStyle()}>
                      <div style={getPracticalLabelStyle()}>Variatie:</div>
                      <div>{practical_info.variety_preference === 'varied' ? 'Gevarieerd' : 'Repetitief'}</div>
                    </div>
                  )}
                </div>
                
                {practical_info.allergies && (
                  <div style={getNotesStyle()}>
                    <strong>Allergieën:</strong> {practical_info.allergies}
                  </div>
                )}
                
                {practical_info.notes && (
                  <div style={getNotesStyle()}>
                    <strong>Extra opmerkingen:</strong> {practical_info.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={getFooterStyle(isMobile)}>
          <button onClick={onClose} style={getSecondaryButtonStyle(isMobile)}>
            Sluiten
          </button>
          <button onClick={handleCopy} style={getPrimaryButtonStyle(isMobile, copied)}>
            {copied ? (
              <>
                <Check size={20} />
                Gekopieerd!
              </>
            ) : (
              <>
                <Copy size={20} />
                Kopieer Alles
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STYLES
// ============================================================================

function getOverlayStyle() {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem'
  }
}

function getModalStyle(isMobile) {
  return {
    background: 'linear-gradient(135deg, #111 0%, #000 100%)',
    border: '1px solid #C9A55A',
    borderRadius: '16px',
    maxWidth: isMobile ? '100%' : '900px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(201, 165, 90, 0.3)'
  }
}

function getHeaderStyle(isMobile) {
  return {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: isMobile ? '1rem' : '1.5rem',
    borderBottom: '1px solid rgba(201, 165, 90, 0.3)',
    gap: '1rem'
  }
}

function getTitleStyle(isMobile) {
  return {
    fontSize: isMobile ? '1.25rem' : '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #C9A55A 0%, #FFA500 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    marginBottom: '0.25rem'
  }
}

function getSubtitleStyle() {
  return {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: '0.25rem'
  }
}

function getCopyButtonStyle(copied) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: copied ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
    border: `1px solid ${copied ? '#10b981' : '#C9A55A'}`,
    borderRadius: '8px',
    color: copied ? '#fff' : '#C9A55A',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  }
}

function getCloseButtonStyle() {
  return {
    background: 'transparent',
    border: 'none',
    color: '#C9A55A',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }
}

function getContentStyle(isMobile) {
  return {
    flex: 1,
    overflowY: 'auto',
    padding: isMobile ? '1rem' : '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  }
}

function getSectionStyle() {
  return {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.25rem'
  }
}

function getSectionHeaderStyle() {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  }
}

function getSectionTitleStyle() {
  return {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0
  }
}

function getSectionContentStyle() {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  }
}

function getInfoRowStyle() {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#fff',
    fontSize: '0.95rem',
    flexWrap: 'wrap',
    gap: '0.5rem'
  }
}

function getBadgeStyle(color) {
  const colors = {
    blue: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#60a5fa' },
    green: { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#34d399' },
    red: { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', text: '#f87171' }
  }
  
  const c = colors[color] || colors.blue
  
  return {
    padding: '0.25rem 0.75rem',
    background: c.bg,
    border: `1px solid ${c.border}`,
    borderRadius: '12px',
    color: c.text,
    fontSize: '0.8rem',
    fontWeight: '600'
  }
}

function getMealTimesGridStyle(isMobile) {
  return {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: '0.75rem'
  }
}

function getMealTimeCardStyle() {
  return {
    padding: '0.75rem',
    background: 'rgba(201, 165, 90, 0.1)',
    border: '1px solid rgba(201, 165, 90, 0.3)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
}

function getMealLabelStyle() {
  return {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#fff'
  }
}

function getMealTimeStyle() {
  return {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#C9A55A'
  }
}

function getMealCaloriesStyle() {
  return {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.6)'
  }
}

function getPreferenceBlockStyle() {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  }
}

function getPreferenceLabelStyle(color) {
  const colors = {
    green: '#10b981',
    red: '#ef4444',
    blue: '#3b82f6'
  }
  
  return {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: colors[color] || '#fff'
  }
}

function getPreferenceListStyle() {
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  }
}

function getPreferenceItemStyle(color) {
  const colors = {
    green: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#34d399' },
    red: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#f87171' },
    blue: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#60a5fa' }
  }
  
  const c = colors[color] || colors.green
  
  return {
    padding: '0.375rem 0.75rem',
    background: c.bg,
    border: `1px solid ${c.border}`,
    borderRadius: '6px',
    color: c.text,
    fontSize: '0.85rem',
    fontWeight: '500'
  }
}

function getNotesStyle() {
  return {
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 1.5
  }
}

function getPracticalGridStyle(isMobile) {
  return {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: '0.75rem'
  }
}

function getPracticalItemStyle() {
  return {
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    fontSize: '0.9rem'
  }
}

function getPracticalLabelStyle() {
  return {
    fontWeight: '600',
    color: '#C9A55A',
    marginBottom: '0.25rem'
  }
}

function getFooterStyle(isMobile) {
  return {
    padding: isMobile ? '1rem' : '1.5rem',
    borderTop: '1px solid rgba(201, 165, 90, 0.3)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem'
  }
}

function getPrimaryButtonStyle(isMobile, copied) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
    background: copied 
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : 'linear-gradient(135deg, #C9A55A 0%, #FFA500 100%)',
    border: 'none',
    borderRadius: '10px',
    color: copied ? '#fff' : '#000',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: copied 
      ? '0 4px 12px rgba(16, 185, 129, 0.3)'
      : '0 4px 12px rgba(201, 165, 90, 0.3)'
  }
}

function getSecondaryButtonStyle(isMobile) {
  return {
    padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
}

function getLoadingStyle() {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '1rem',
    color: '#C9A55A'
  }
}

function getSpinnerStyle() {
  return {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(201, 165, 90, 0.2)',
    borderTop: '4px solid #C9A55A',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
}

function getErrorStyle() {
  return {
    padding: '2rem',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'center'
  }
}

console.log('✅ IntakeViewModal v2.0 loaded - Full display + Copy functionality')
