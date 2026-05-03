// FILE: src/modules/ai-meal-generator/tabs/ClientSelector.jsx
// TAB 1: Client Selection & Macro Targets - GOLDEN THEME + TEMPLATE + INTAKE
// Version 4.1 - Fresh DB fetch on client select (fixes stale macro bug)

import { useState, useEffect } from 'react'
import { User, Activity, Target, Calculator, Info, Zap, Sparkles } from 'lucide-react'
import MacroCalculatorModal from '../components/MacroCalculatorModal'
import TemplateSelector from '../../meal-templates/TemplateSelector'
import IntakeViewModal from '../../nutrition-intake/components/IntakeViewModal'

export default function ClientSelector({
  db,
  clients = [],
  selectedClient,
  setSelectedClient,
  dailyTargets,
  setDailyTargets,
  mealsPerDay,
  setMealsPerDay,
  onTemplateApplied,
  updateClientProfile,
  isMobile
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showMacroModal, setShowMacroModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showIntakeModal, setShowIntakeModal] = useState(false)
  
  // GOLDEN THEME
  const goldenTheme = {
    primary: '#FFD700',
    primaryDark: '#D4AF37',
    primaryLight: '#FFA500',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    gradientReverse: 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
    border: 'rgba(255, 215, 0, 0.3)',
    borderActive: 'rgba(255, 215, 0, 0.5)',
    glow: 'rgba(255, 215, 0, 0.2)',
    glowStrong: 'rgba(255, 215, 0, 0.3)',
    background: 'rgba(255, 215, 0, 0.1)',
    backgroundSubtle: 'rgba(255, 215, 0, 0.05)'
  }
  
  // Filter clients based on search
  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })
  
  // Handle macro calculator save
  const handleMacroSave = (calculatedMacros) => {
    setDailyTargets({
      calories: calculatedMacros.calories,
      protein: calculatedMacros.protein,
      carbs: calculatedMacros.carbs,
      fat: calculatedMacros.fat
    })
    setShowMacroModal(false)
  }
  
  // Handle template apply
  const handleTemplateApply = (templateResult) => {
    console.log('✅ Template applied in ClientSelector:', templateResult.templateUsed?.name)
    setShowTemplateModal(false)
    if (onTemplateApplied) {
      onTemplateApplied(templateResult)
    }
  }
  
  // ── LOAD FRESH MACROS FROM DB ON CLIENT SELECT ──
  // De client prop kan verouderd zijn (bijv. na EvaluationModal save)
  // Altijd verse data ophalen uit Supabase
  useEffect(() => {
    if (!selectedClient?.id) return

    const loadFreshMacros = async () => {
      try {
        const { data, error } = await db.supabase
          .from('clients')
          .select('target_calories, target_protein, target_carbs, target_fat')
          .eq('id', selectedClient.id)
          .single()

        if (error || !data) throw error

        setDailyTargets({
          calories: data.target_calories || 2500,
          protein: data.target_protein || 180,
          carbs: data.target_carbs || 280,
          fat: data.target_fat || 70
        })
      } catch (e) {
        // Fallback op client object als DB fetch faalt
        console.warn('Macro fetch failed, using client prop:', e)
        setDailyTargets({
          calories: selectedClient.target_calories || 2500,
          protein: selectedClient.target_protein || 180,
          carbs: selectedClient.target_carbs || 280,
          fat: selectedClient.target_fat || 70
        })
      }
    }

    loadFreshMacros()
  }, [selectedClient?.id])
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header with Golden Sparkle */}
      <div style={{
        position: 'relative',
        padding: isMobile ? '1rem' : '1.25rem',
        background: `linear-gradient(135deg, ${goldenTheme.backgroundSubtle} 0%, transparent 100%)`,
        borderRadius: '12px',
        border: `1px solid ${goldenTheme.border}`,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '12px',
            background: goldenTheme.background,
            border: `1px solid ${goldenTheme.borderActive}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${goldenTheme.glow}`
          }}>
            <Sparkles size={isMobile ? 20 : 24} color={goldenTheme.primary} />
          </div>
          
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              background: goldenTheme.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.25rem',
              letterSpacing: '-0.01em'
            }}>
              Selecteer Client & Stel Targets In
            </h2>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Kies een client en bepaal de dagelijkse macro targets
            </p>
          </div>
        </div>
      </div>
      
      {/* Client Search & Selection */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
        gap: isMobile ? '1rem' : '1.5rem'
      }}>
        {/* Client List */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: `1px solid ${goldenTheme.border}`,
          padding: isMobile ? '1rem' : '1.25rem',
          boxShadow: `0 4px 16px ${goldenTheme.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: goldenTheme.gradient,
            opacity: 0.6
          }} />
          
          <input
            type="text"
            placeholder="🔍 Zoek client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${goldenTheme.border}`,
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              marginBottom: '1rem',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = `1px solid ${goldenTheme.borderActive}`
              e.currentTarget.style.boxShadow = `0 0 12px ${goldenTheme.glow}`
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = `1px solid ${goldenTheme.border}`
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: isMobile ? '200px' : '300px',
            overflowY: 'auto'
          }}>
            {filteredClients.map(client => {
              const isSelected = selectedClient?.id === client.id
              
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    padding: '0.75rem',
                    background: isSelected ? goldenTheme.gradient : 'rgba(255,255,255,0.05)',
                    border: isSelected ? `1px solid ${goldenTheme.primary}` : '1px solid transparent',
                    borderRadius: '8px',
                    color: isSelected ? '#000' : '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    fontWeight: isSelected ? '700' : '400',
                    boxShadow: isSelected ? `0 4px 12px ${goldenTheme.glow}` : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = goldenTheme.backgroundSubtle
                      e.currentTarget.style.border = `1px solid ${goldenTheme.border}`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.border = '1px solid transparent'
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <User size={18} color={isSelected ? '#000' : goldenTheme.primary} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: isMobile ? '0.9rem' : '0.95rem' }}>
                        {client.first_name} {client.last_name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        color: isSelected ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
                        marginTop: '0.25rem'
                      }}>
                        {client.primary_goal || 'Geen doel'}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Selected Client Details */}
        {selectedClient ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: `1px solid ${goldenTheme.border}`,
            padding: isMobile ? '1rem' : '1.25rem',
            boxShadow: `0 4px 16px ${goldenTheme.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: goldenTheme.gradient,
              opacity: 0.6
            }} />
            
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.06) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            
            {/* Client Info */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: `1px solid ${goldenTheme.border}`
            }}>
              <div>
                <h3 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: '700',
                  background: goldenTheme.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.25rem'
                }}>
                  {selectedClient.first_name} {selectedClient.last_name}
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  <span>{selectedClient.age || 30}jr</span>
                  <span>{selectedClient.current_weight || 75}kg</span>
                  <span>{selectedClient.height || 180}cm</span>
                  <span>{selectedClient.gender === 'female' ? '♀️' : '♂️'}</span>
                </div>
              </div>
              
              {/* Action Buttons - Calculator + Template + Intake */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                {/* CALCULATOR BUTTON */}
                <button
                  onClick={() => setShowMacroModal(true)}
                  style={{
                    padding: isMobile ? '0.625rem' : '0.75rem',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    minWidth: isMobile ? '100%' : 'auto',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  <Calculator size={isMobile ? 16 : 18} />
                  {!isMobile && 'Calculator'}
                </button>
                
                {/* TEMPLATE BUTTON */}
                <button
                  onClick={() => setShowTemplateModal(true)}
                  style={{
                    padding: isMobile ? '0.625rem' : '0.75rem',
                    background: goldenTheme.gradient,
                    border: 'none',
                    borderRadius: '10px',
                    color: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    boxShadow: `0 4px 12px ${goldenTheme.glow}`,
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    minWidth: isMobile ? '100%' : 'auto',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 20px ${goldenTheme.glowStrong}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${goldenTheme.glow}`
                  }}
                >
                  <Zap size={isMobile ? 16 : 18} />
                  {!isMobile && 'Template'}
                </button>
                
                {/* INTAKE BUTTON */}
                <button
                  onClick={() => setShowIntakeModal(true)}
                  style={{
                    padding: isMobile ? '0.625rem' : '0.75rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    minWidth: isMobile ? '100%' : 'auto',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <User size={isMobile ? 16 : 18} />
                  {!isMobile && 'Intake'}
                </button>
              </div>
            </div>
            
            {/* Macro Targets */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              {/* Calories */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: goldenTheme.primary,
                  marginBottom: '0.5rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  Calorieën per dag
                </label>
                <input
                  type="number"
                  value={dailyTargets.calories}
                  onChange={(e) => setDailyTargets({ ...dailyTargets, calories: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${goldenTheme.border}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid ${goldenTheme.borderActive}`
                    e.currentTarget.style.boxShadow = `0 0 12px ${goldenTheme.glow}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1px solid ${goldenTheme.border}`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              
              {/* Protein */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: goldenTheme.primary,
                  marginBottom: '0.5rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  Eiwitten (gram)
                </label>
                <input
                  type="number"
                  value={dailyTargets.protein}
                  onChange={(e) => setDailyTargets({ ...dailyTargets, protein: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${goldenTheme.border}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid ${goldenTheme.borderActive}`
                    e.currentTarget.style.boxShadow = `0 0 12px ${goldenTheme.glow}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1px solid ${goldenTheme.border}`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              
              {/* Carbs */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: goldenTheme.primary,
                  marginBottom: '0.5rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  Koolhydraten (gram)
                </label>
                <input
                  type="number"
                  value={dailyTargets.carbs}
                  onChange={(e) => setDailyTargets({ ...dailyTargets, carbs: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${goldenTheme.border}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid ${goldenTheme.borderActive}`
                    e.currentTarget.style.boxShadow = `0 0 12px ${goldenTheme.glow}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1px solid ${goldenTheme.border}`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              
              {/* Fat */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: goldenTheme.primary,
                  marginBottom: '0.5rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  Vetten (gram)
                </label>
                <input
                  type="number"
                  value={dailyTargets.fat}
                  onChange={(e) => setDailyTargets({ ...dailyTargets, fat: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${goldenTheme.border}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid ${goldenTheme.borderActive}`
                    e.currentTarget.style.boxShadow = `0 0 12px ${goldenTheme.glow}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1px solid ${goldenTheme.border}`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>
            
            {/* Meals per Day */}
            <div style={{ marginTop: '1.5rem', position: 'relative', zIndex: 2 }}>
              <label style={{
                fontSize: '0.9rem',
                color: goldenTheme.primary,
                marginBottom: '0.75rem',
                display: 'block',
                fontWeight: '700'
              }}>
                Maaltijden per dag
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem'
              }}>
                {[3, 4, 5, 6].map(num => {
                  const isSelected = mealsPerDay === num
                  return (
                    <button
                      key={num}
                      onClick={() => setMealsPerDay(num)}
                      style={{
                        padding: '0.75rem',
                        background: isSelected ? goldenTheme.gradient : 'rgba(255,255,255,0.05)',
                        border: isSelected ? `1px solid ${goldenTheme.primary}` : `1px solid ${goldenTheme.border}`,
                        borderRadius: '8px',
                        color: isSelected ? '#000' : '#fff',
                        fontWeight: isSelected ? '700' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        fontSize: '1rem',
                        boxShadow: isSelected ? `0 4px 12px ${goldenTheme.glow}` : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = goldenTheme.backgroundSubtle
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }}
                    >
                      {num}
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Save Profile Button */}
            {updateClientProfile && (
              <button
                onClick={updateClientProfile}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                Targets Opslaan in Profiel
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: `1px solid ${goldenTheme.border}`,
            boxShadow: `0 4px 16px ${goldenTheme.glow}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.06) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            
            <Target size={48} style={{ color: goldenTheme.primary, marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center'
            }}>
              Selecteer een client om de macro targets in te stellen
            </p>
          </div>
        )}
      </div>
      
      {/* Info Box */}
      <div style={{
        padding: '1rem',
        background: goldenTheme.backgroundSubtle,
        borderRadius: '12px',
        border: `1px solid ${goldenTheme.border}`,
        boxShadow: `0 4px 12px ${goldenTheme.glow}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          gap: '0.75rem'
        }}>
          <Info size={20} style={{ color: goldenTheme.primary, flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            <strong style={{ color: goldenTheme.primary }}>Tip:</strong> De AI gebruikt deze targets om maaltijden te selecteren die perfect passen bij de doelen van {selectedClient?.first_name || 'de client'}.
            Gebruik de <strong style={{ color: goldenTheme.primary }}>Template</strong> voor instant setup, <strong>Calculator</strong> voor wetenschappelijke precisie, of <strong style={{ color: '#10b981' }}>Intake</strong> om voedingsvoorkeuren te bekijken.
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showMacroModal && selectedClient && (
        <MacroCalculatorModal
          client={selectedClient}
          onClose={() => setShowMacroModal(false)}
          onSave={handleMacroSave}
          isMobile={isMobile}
        />
      )}
      
      {showTemplateModal && selectedClient && (
        <TemplateSelector
          db={db}
          selectedClient={selectedClient}
          dailyTargets={dailyTargets}
          mealsPerDay={mealsPerDay}
          onApply={handleTemplateApply}
          onClose={() => setShowTemplateModal(false)}
          isMobile={isMobile}
        />
      )}
      
      {showIntakeModal && selectedClient && (
        <IntakeViewModal
          db={db}
          clientId={selectedClient.id}
          onClose={() => setShowIntakeModal(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
