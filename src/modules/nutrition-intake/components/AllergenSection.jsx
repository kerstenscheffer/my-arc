// src/modules/nutrition-intake/components/AllergenSection.jsx
// v2 — Fix: no auto-advance on every click
// onChange = advance only on explicit confirm
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'
import { Wheat, Milk, Egg, Fish, Shell, Nut, Bean, Cherry } from 'lucide-react'

const ALLERGENS = [
  { id: 'lactose', label: 'Lactose / Zuivel', icon: Milk, blocks: ['zuivel'] },
  { id: 'gluten', label: 'Gluten', icon: Wheat, blocks: ['gluten'] },
  { id: 'noten', label: 'Noten', icon: Nut, blocks: ['noten'] },
  { id: 'pinda', label: 'Pinda', icon: Nut, blocks: ['pinda'] },
  { id: 'soja', label: 'Soja', icon: Bean, blocks: ['soja'] },
  { id: 'vis', label: 'Vis', icon: Fish, blocks: ['vis'] },
  { id: 'schaaldieren', label: 'Schaaldieren', icon: Shell, blocks: ['schaaldieren'] },
  { id: 'ei', label: 'Ei', icon: Egg, blocks: ['ei'] },
  { id: 'steenvruchten', label: 'Steenvruchten', icon: Cherry, blocks: ['steenvruchten'] }
]

const DIET_OPTIONS = [
  { id: 'geen', label: 'Geen restricties', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=150&fit=crop&q=80' },
  { id: 'vegetarisch', label: 'Vegetarisch', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=150&fit=crop&q=80' },
  { id: 'veganistisch', label: 'Veganistisch', image: 'https://images.unsplash.com/photo-1540914124281-342587941389?w=300&h=150&fit=crop&q=80' },
  { id: 'halal', label: 'Halal', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=150&fit=crop&q=80' },
  { id: 'pescotarisch', label: 'Pescotarisch', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&h=150&fit=crop&q=80' }
]

export function getAllBlockedIngredients(allergenData) {
  if (!allergenData) return { blockedIngredients: [], blockedCategories: [] }
  const blockedIngredients = []
  const blockedCategories = []
  const selected = allergenData.selected_allergens || []
  selected.forEach(id => { const a = ALLERGENS.find(x => x.id === id); if (a) blockedCategories.push(...a.blocks) })
  if (selected.includes('lactose')) blockedIngredients.push('kwark','whey','yoghurt','yogurt','skyr','kaas','melk','room','boter','cottage','mozzarella','cheddar','gouda','ricotta','protein pudding','frozen yogurt')
  if (selected.includes('ei')) blockedIngredients.push('eieren','ei','omelet','scrambled')
  if (selected.includes('noten')) blockedIngredients.push('amandel','walnoot','cashew','hazelnoot','noten')
  if (selected.includes('pinda')) blockedIngredients.push('pinda','pindakaas')
  if (selected.includes('soja')) blockedIngredients.push('soja','tofu','tempeh','edamame')
  if (selected.includes('vis')) blockedIngredients.push('zalm','tonijn','kabeljauw','vis','haring','makreel','sardine','garnaal','garnalen')
  if (selected.includes('schaaldieren')) blockedIngredients.push('garnaal','garnalen','kreeft','krab','mosselen')
  if (selected.includes('steenvruchten')) blockedIngredients.push('perzik','nectarine','pruim','kers','abrikoos','mango')
  if (selected.includes('gluten')) blockedIngredients.push('brood','pasta','tarwe','couscous','crackers','wraps','havermout','pannenkoek')
  const diet = allergenData.diet_preference || 'geen'
  if (diet === 'vegetarisch') { blockedCategories.push('varkensvlees','rund','vis'); blockedIngredients.push('kip','kipfilet','kalkoen','gehakt','shoarma','pulled chicken','rund','biefstuk','zalm','tonijn','vis') }
  if (diet === 'veganistisch') { blockedCategories.push('varkensvlees','rund','vis','zuivel','ei'); blockedIngredients.push('kip','kipfilet','kalkoen','gehakt','shoarma','pulled chicken','rund','biefstuk','zalm','tonijn','vis','eieren','ei','kwark','whey','kaas','melk','yoghurt','skyr','cottage') }
  if (diet === 'halal') { blockedCategories.push('varkensvlees'); blockedIngredients.push('varken','spek','bacon','ham') }
  if (diet === 'pescotarisch') { blockedCategories.push('varkensvlees','rund'); blockedIngredients.push('kip','kipfilet','kalkoen','gehakt','shoarma','pulled chicken','rund','biefstuk','varken','spek','bacon','ham') }
  if (allergenData.custom_allergens) { allergenData.custom_allergens.split(',').map(s => s.trim()).filter(Boolean).forEach(c => blockedIngredients.push(c)) }
  return { blockedIngredients: [...new Set(blockedIngredients)], blockedCategories: [...new Set(blockedCategories)] }
}

export default function AllergenSection({ value, onChange, onComplete, isMobile }) {
  const [selectedAllergens, setSelectedAllergens] = useState([])
  const [dietPreference, setDietPreference] = useState('geen')
  const [customAllergens, setCustomAllergens] = useState('')

  useEffect(() => {
    if (value) {
      setSelectedAllergens(value.selected_allergens || [])
      setDietPreference(value.diet_preference || 'geen')
      setCustomAllergens(value.custom_allergens || '')
    }
  }, [value])

  const toggleAllergen = (id) => {
    setSelectedAllergens(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handleConfirm = () => {
    onChange({ selected_allergens: selectedAllergens, diet_preference: dietPreference, custom_allergens: customAllergens || null })
  }

  return (
    <div>
      {/* Dieetvoorkeur */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
        <div style={{ fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Volg je een specifiek dieet?</div>
        <div style={{ display: 'grid', gridTemplateColumns: r(isMobile, 'repeat(2, 1fr)', 'repeat(3, 1fr)'), gap: r(isMobile, '0.4rem', '0.5rem') }}>
          {DIET_OPTIONS.map(opt => {
            const sel = dietPreference === opt.id
            return (
              <button key={opt.id} onClick={() => setDietPreference(opt.id)} style={{
                padding: 0, overflow: 'hidden',
                background: sel ? 'rgba(255,215,0,0.06)' : '#0a0a0a',
                border: `1px solid ${sel ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: isMobile ? '10px' : '12px',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease', transform: 'translateZ(0)'
              }}>
                <div style={{ width: '100%', height: isMobile ? '50px' : '60px', backgroundImage: `url(${opt.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: sel ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)' : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)' }} />
                  {sel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #FFD700, #FFA500)' }} />}
                </div>
                <div style={{ padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.6rem' }}>
                  <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: sel ? 800 : 700, color: sel ? '#FFD700' : '#fff' }}>{opt.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Allergenen */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
        <div style={{ fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: 800, color: '#fff', marginBottom: '0.15rem' }}>Heb je allergieën of intoleranties?</div>
        <div style={{ fontSize: r(isMobile, '0.5rem', '0.52rem'), color: t.colors.textMuted, marginBottom: '0.5rem' }}>Selecteer alles wat van toepassing is</div>
        <div style={{ display: 'grid', gridTemplateColumns: r(isMobile, 'repeat(2, 1fr)', 'repeat(3, 1fr)'), gap: r(isMobile, '0.3rem', '0.4rem') }}>
          {ALLERGENS.map(allergen => {
            const sel = selectedAllergens.includes(allergen.id)
            const Icon = allergen.icon
            return (
              <button key={allergen.id} onClick={() => toggleAllergen(allergen.id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: r(isMobile, '0.5rem 0.6rem', '0.55rem 0.7rem'),
                background: sel ? 'rgba(239, 68, 68, 0.08)' : t.colors.inputBg,
                border: `1px solid ${sel ? 'rgba(239, 68, 68, 0.3)' : t.colors.borderVisible}`,
                borderRadius: '8px', color: sel ? '#ef4444' : t.colors.textSecondary,
                fontSize: r(isMobile, '0.7rem', '0.74rem'), fontWeight: sel ? 800 : 600,
                cursor: 'pointer', minHeight: '40px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease', textAlign: 'left', fontFamily: 'inherit'
              }}>
                <Icon size={14} color={sel ? '#ef4444' : 'rgba(255,255,255,0.3)'} />
                <span style={{ flex: 1 }}>{allergen.label}</span>
                {sel && <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, flexShrink: 0 }}>{'\u2715'}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
        <div style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Andere allergieën?</div>
        <input type="text" value={customAllergens} onChange={e => setCustomAllergens(e.target.value)} placeholder="Bijv: sesam, selderij, mosterd"
          style={{ width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'), background: t.colors.inputBg, border: `1px solid ${customAllergens ? 'rgba(255,215,0,0.25)' : t.colors.borderVisible}`, borderRadius: '8px', color: customAllergens ? '#FFD700' : t.colors.white, fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: customAllergens ? 800 : 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#FFD700' }}
          onBlur={e => { e.target.style.borderColor = customAllergens ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Summary */}
      {(selectedAllergens.length > 0 || dietPreference !== 'geen') && (
        <div style={{ padding: r(isMobile, '0.4rem 1rem', '0.5rem 1.25rem'), display: 'flex', flexWrap: 'wrap', gap: '0.3rem', borderBottom: `1px solid ${t.colors.border}` }}>
          {dietPreference !== 'geen' && <span style={{ padding: '0.15rem 0.5rem', background: t.colors.goldBgStrong, borderRadius: '3px', fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.gold }}>{DIET_OPTIONS.find(d => d.id === dietPreference)?.label}</span>}
          {selectedAllergens.map(id => <span key={id} style={{ padding: '0.15rem 0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: '3px', fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: '#ef4444' }}>{ALLERGENS.find(x => x.id === id)?.label}</span>)}
        </div>
      )}

      {/* Confirm — explicit */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem') }}>
        <button onClick={handleConfirm} style={{
          width: '100%', padding: r(isMobile, '0.65rem', '0.7rem'),
          background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: '8px', color: '#FFD700',
          fontSize: r(isMobile, '0.72rem', '0.76rem'), fontWeight: 800,
          cursor: 'pointer', minHeight: '40px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}>
          {selectedAllergens.length === 0 && dietPreference === 'geen' ? 'GEEN RESTRICTIES — DOOR' : 'OPSLAAN EN DOOR'}
        </button>
      </div>
    </div>
  )
}
