// src/modules/meal-plan/components/AIAlternativesModal.jsx
// 🎯 v2.0 - Clean swap modal with smart suggestions & compare
// Props IDENTIEK: { isOpen, onClose, currentMeal, onSelectMeal, db, service }
import React, { useState, useEffect } from 'react'
import MealCard from './day-schedule/MealCard'
import { X, Search, Check, ArrowUp, ArrowDown, Minus } from 'lucide-react'

export default function AIAlternativesModal({
  isOpen,
  onClose,
  currentMeal,
  onSelectMeal,
  db,
  service,
  client
}) {
  const isMobile = window.innerWidth <= 768
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('smart')
  const [alternatives, setAlternatives] = useState([])
  const [favorites, setFavorites] = useState([])
  const [allMeals, setAllMeals] = useState([])
  const [customMeals, setCustomMeals] = useState([])
  const [coachOptions, setCoachOptions] = useState([]) // door coach gecureerde swaps voor dit slot
  const [loading, setLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)

  // Slot van de huidige maaltijd → naar de 4 curatie-slots (snack1/2/3 → snack).
  const slotKey = (() => {
    const v = String(currentMeal?.slot || currentMeal?.timeSlot || currentMeal?.timing?.[0] || '').toLowerCase()
    if (v.includes('breakfast') || v.includes('ontbijt')) return 'breakfast'
    if (v.includes('lunch')) return 'lunch'
    if (v.includes('dinner') || v.includes('diner')) return 'dinner'
    return 'snack'
  })()

  const filters = [
    // "Aangeraden door coach" alleen tonen als er gecureerde opties zijn voor
    // dit slot, en "Mijn maaltijden" alleen als de klant er zelf heeft.
    ...(coachOptions.length > 0 ? [{ id: 'coach', label: 'Aangeraden door coach' }] : []),
    ...(customMeals.length > 0 ? [{ id: 'mine', label: 'Mijn maaltijden' }] : []),
    { id: 'smart', label: 'Beste match' },
    { id: 'similar-cal', label: 'Zelfde kcal' },
    { id: 'same-protein', label: 'Zelfde eiwit' },
    { id: 'less-cal', label: 'Minder kcal' },
  ]

  useEffect(() => {
    if (isOpen && currentMeal) {
      loadAlternatives()
    }
    return () => {
      setSelectedMeal(null)
      setSearchTerm('')
      setActiveFilter('smart')
    }
  }, [isOpen, currentMeal])

  const loadAlternatives = async () => {
    setLoading(true)
    try {
      const smartAlts = await service.getSmartAlternatives(
        currentMeal,
        currentMeal.slot || currentMeal.timeSlot
      )
      
      let favs = []
      try {
        const clientId = await db.getCurrentUser().then(u => u.id)
        favs = await service.getAIFavorites(clientId)
      } catch (e) { /* no favs */ }
      
      // Pool voor de handmatige filters (Zelfde kcal / Meer eiwit / Minder
      // kcal / Alles). Twee dingen aangepast:
      //
      // - needs_review eruit, om dezelfde reden als in getSmartAlternatives:
      //   bij die maaltijden loopt de opgegeven kcal uit de pas met hun
      //   ingrediënten, en juist deze filters beloven een kcal-vergelijking.
      // - De .limit(200) is weg. Die kapte 482 maaltijden af zonder ORDER BY,
      //   dus "Zelfde kcal" sorteerde een willekeurige greep op kcal en zei
      //   daar "beste match" bij.
      const { data: meals } = await db.supabase
        .from('ai_meals')
        .select('*')
        .gt('calories', 0)
        .or('needs_review.is.null,needs_review.eq.false')

      // Door de coach gecureerde swaps voor dit slot.
      // Via get_effective_swap_options i.p.v. rechtstreeks client_swap_options:
      // die RPC past de laag eronder toe — heeft de coach niets voor DEZE klant
      // ingesteld, dan gelden zijn standaard-swaps (coach_swap_defaults). Zo
      // hoeft de fallback niet apart in deze modal, de PDF-export én de
      // coach-modal geïmplementeerd te staan.
      let curated = []
      try {
        const clientId = client?.id || currentMeal?.client_id || null
        let ids = []
        if (clientId) {
          const { data } = await db.supabase
            .rpc('get_effective_swap_options', { p_client_id: clientId })
          ids = data?.[slotKey]?.meal_ids || []
        }
        if (ids.length > 0) {
          const { data: curatedMeals } = await db.supabase.from('ai_meals').select('*').in('id', ids)
          // Behoud de volgorde waarin de coach ze koos.
          curated = ids.map(id => (curatedMeals || []).find(m => m.id === id)).filter(Boolean)
        }
      } catch (e) { /* geen curatie → gewoon de normale pool */ }

      // Eigen maaltijden van de klant (ai_custom_meals), zodat je ook daarnaar
      // kunt wisselen. getMealById ondersteunt al custom-meal-IDs.
      let custom = []
      try {
        const clientId = client?.id
        if (clientId) {
          const { data: customData } = await db.supabase
            .from('ai_custom_meals')
            .select('id, name, calories, protein, carbs, fat, image_url, section')
            .eq('client_id', clientId)
            .eq('is_active', true)
          custom = (customData || []).map(m => ({ ...m, _isCustom: true }))
        }
      } catch {}

      setAlternatives(smartAlts || [])
      setFavorites(favs || [])
      setAllMeals(meals || [])
      setCustomMeals(custom)
      setCoachOptions(curated)
      // Heeft de coach opties ingesteld? Toon die als eerste.
      if (curated.length > 0) setActiveFilter('coach')
    } catch (error) {
      console.error('Failed to load alternatives:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredMeals = () => {
    let meals = []
    const currentCal = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein || 0

    switch (activeFilter) {
      case 'coach':
        meals = coachOptions.filter(m => m.id !== currentMeal?.id)
        break
      case 'smart':
        meals = alternatives
        break
      case 'similar-cal':
        meals = [...allMeals]
          .filter(m => m.id !== currentMeal?.id && m.calories > 0)
          .sort((a, b) => Math.abs(a.calories - currentCal) - Math.abs(b.calories - currentCal))
          .slice(0, 30)
        break
      case 'same-protein':
        // Dichtst bij het eiwit van deze maaltijd; dat is waar je een
        // maaltijd meestal voor inruilt.
        meals = [...allMeals]
          .filter(m => m.id !== currentMeal?.id && m.protein > 0)
          .sort((a, b) => Math.abs(a.protein - currentProt) - Math.abs(b.protein - currentProt))
          .slice(0, 30)
        break
      case 'mine':
        meals = customMeals.filter(m => m.id !== currentMeal?.id)
        break
      case 'less-cal':
        meals = [...allMeals]
          .filter(m => m.id !== currentMeal?.id && m.calories > 0 && m.calories < currentCal)
          .sort((a, b) => b.calories - a.calories)
          .slice(0, 30)
        break
      case 'favorites':
        meals = favorites
          .map(fav => allMeals.find(m => m.id === fav.meal_id))
          .filter(Boolean)
        break
      case 'all':
        meals = allMeals.filter(m => m.id !== currentMeal?.id)
        break
      default:
        meals = alternatives
    }

    if (searchTerm) {
      // Doorzoek bij een actieve zoekopdracht de volledige pool (ai_meals +
      // eigen maaltijden), ongeacht het actieve filter. Zo kom je nooit vast
      // te zitten achter een filter als je een specifieke maaltijdnaam intypt.
      const term = searchTerm.toLowerCase()
      const fullPool = [...allMeals, ...customMeals].filter(m => m.id !== currentMeal?.id)
      return fullPool.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.name_en?.toLowerCase().includes(term)
      )
    }

    return meals
  }

  const getDiff = (newVal, oldVal) => {
    const diff = Math.round((newVal || 0) - (oldVal || 0))
    if (diff > 0) return { text: `+${diff}`, color: '#FFD700', Icon: ArrowUp }
    if (diff < 0) return { text: `${diff}`, color: '#ef4444', Icon: ArrowDown }
    return { text: '0', color: 'rgba(255,255,255,0.3)', Icon: Minus }
  }

  const filteredMeals = getFilteredMeals()

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10500,
        animation: 'altFadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '600px',
          width: '100%',
          margin: '0 auto',
          background: '#0a0a0a',
          overflow: 'hidden'
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          {/* Titel + sluiten */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 10, marginBottom: '0.7rem',
          }}>
            <div style={{
              fontSize: isMobile ? '1.15rem' : '1.3rem',
              fontWeight: 900, color: '#fff', letterSpacing: '-0.025em',
            }}>
              Wissel maaltijd
            </div>
            <button
              onClick={onClose}
              aria-label="Sluit"
              style={{
                width: '36px', height: '36px', flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* De maaltijd die je gaat wisselen als kaart, niet als losse naam:
              dezelfde kaart als in de dagplanning, zonder knoppen. */}
          <div style={{ margin: isMobile ? '0 -1rem 0.7rem' : '0 -1.5rem 0.8rem' }}>
            <MealCard
              meal={{
                name: currentMeal?.name || currentMeal?.meal_name,
                image_url: currentMeal?.image_url,
                slot: currentMeal?.slot,
                timing: currentMeal?.timing,
                calories: currentMeal?.calories, protein: currentMeal?.protein,
                carbs: currentMeal?.carbs, fat: currentMeal?.fat,
              }}
              isMobile={isMobile}
              acties={[]}
            />
          </div>

          <div style={{
            fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em', marginBottom: '0.5rem',
          }}>
            Wissel voor:
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.2)'
              }}
            />
            <input
              type="text"
              placeholder="Zoek maaltijd..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                outline: 'none',
                minHeight: '40px',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
            />
          </div>

          {/* Filter chips — horizontal scroll */}
          <div style={{
            display: 'flex',
            gap: '0.3rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: '0.25rem'
          }}>
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '0.35rem 0.625rem',
                  background: activeFilter === f.id ? '#fff' : 'transparent',
                  border: activeFilter === f.id
                    ? '1px solid #fff'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  color: activeFilter === f.id ? '#0a0a0a' : 'rgba(255, 255, 255, 0.55)',
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: activeFilter === f.id ? '900' : '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease',
                  minHeight: '30px'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Meal List ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                width: '32px', height: '32px',
                border: '2px solid rgba(255, 255, 255, 0.06)',
                borderTopColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                animation: 'altSpin 0.8s linear infinite'
              }} />
            </div>
          ) : filteredMeals.length > 0 ? (
            filteredMeals.map((meal, idx) => (
              <SuggestieKaart
                key={meal.id || idx}
                meal={meal}
                currentMeal={currentMeal}
                isSelected={selectedMeal?.id === meal.id}
                onSelect={() => setSelectedMeal(selectedMeal?.id === meal.id ? null : meal)}
                isMobile={isMobile}
              />
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'rgba(255, 255, 255, 0.25)'
            }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Geen resultaten
              </div>
              <div style={{ fontSize: '0.7rem' }}>
                Probeer een ander filter of zoekterm
              </div>
            </div>
          )}
        </div>

        {/* ── Footer — compare & confirm ── */}
        {selectedMeal && (
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            flexShrink: 0
          }}>
            {/* Compare bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: isMobile ? '1rem' : '1.5rem',
              padding: '0.5rem 1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              {[
                { label: 'kcal', diff: getDiff(selectedMeal.calories, currentMeal?.calories) },
                { label: 'eiwit', diff: getDiff(selectedMeal.protein, currentMeal?.protein) },
                { label: 'koolh', diff: getDiff(selectedMeal.carbs, currentMeal?.carbs) },
                { label: 'vet', diff: getDiff(selectedMeal.fat, currentMeal?.fat) }
              ].map(item => {
                const DiffIcon = item.diff.Icon
                return (
                  <div key={item.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}>
                    <DiffIcon size={10} color={item.diff.color} />
                    <span style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      fontWeight: '800',
                      color: item.diff.color
                    }}>
                      {item.diff.text}
                    </span>
                    <span style={{
                      fontSize: isMobile ? '0.5rem' : '0.55rem',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.2)',
                      textTransform: 'uppercase'
                    }}>
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  background: 'transparent',
                  borderTop: 'none',
                  borderBottom: 'none',
                  borderLeft: 'none',
                  borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: 0,
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Annuleren
              </button>
              <button
                onClick={() => onSelectMeal(selectedMeal.id)}
                style={{
                  flex: 2,
                  background: 'rgba(255, 215, 0, 0.12)',
                  border: 'none',
                  borderRadius: 0,
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  color: '#FFD700',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Check size={15} strokeWidth={2.5} />
                Wissel hiermee
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes altFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes altSpin {
          to { transform: rotate(360deg); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

// ── Single meal row in the list ──
// Een suggestie in het wisselvenster: dezelfde kaart als in de dagplanning,
// zodat je niet naar twee soorten maaltijdregels zit te kijken. Op de foto
// staat het verschil in kcal met de huidige maaltijd — dat is waar je bij
// het wisselen naar zoekt — of "Eigen" bij een zelfgemaakte maaltijd.
function SuggestieKaart({ meal, currentMeal, isSelected, onSelect, isMobile }) {
  const verschil = Math.round((meal.calories || 0) - (currentMeal?.calories || 0))
  const kcalLabel = verschil === 0
    ? 'Zelfde kcal'
    : `${verschil > 0 ? '+' : ''}${verschil} kcal`

  return (
    <MealCard
      meal={{
        name: meal.name,
        image_url: meal.image_url,
        slot: meal.slot || currentMeal?.slot,
        calories: meal.calories, protein: meal.protein,
        carbs: meal.carbs, fat: meal.fat,
      }}
      momentLabel={meal._isCustom ? 'Eigen maaltijd' : kcalLabel}
      tijdLabel={meal._isCustom ? kcalLabel : null}
      isMobile={isMobile}
      geselecteerd={isSelected}
      onCheck={onSelect}
      acties={[{
        icon: <Check size={isMobile ? 11 : 12} strokeWidth={2.6} />,
        label: isSelected ? 'Gekozen' : 'Kies',
        onClick: onSelect,
        checked: isSelected,
      }]}
    />
  )
}
