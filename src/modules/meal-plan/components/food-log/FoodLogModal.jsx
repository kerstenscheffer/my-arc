// src/modules/meal-plan/components/food-log/FoodLogModal.jsx
// 🎯 v3.1 — Edit flow race fix: useEffect deps gefixt + diagnostic log
import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from '../../../../client/paginaPortal'
import { X, ArrowLeft, AlertCircle, Heart } from 'lucide-react'
import FoodLogHeader from './FoodLogHeader'
import SearchTab from './SearchTab'
import QuickAddTab from './QuickAddTab'
import MyMealsTab from './MyMealsTab'
import ScanTab from './ScanTab'
import FotoTab from './FotoTab'
import GelogdAnimatie from './GelogdAnimatie'
import { meldSucces } from '../../../app-review/reviewMoment'
import AmountPicker from './AmountPicker'
import SmartLoggingService from './SmartLoggingService'
import IngredientFeedbackModal from './IngredientFeedbackModal'
import { enrichIngredientImage } from './enrichImageFromOFF'
import AIAlternativesModal from '../AIAlternativesModal'
import AIMealPlanService from '../../AIMealPlanService'

export default function FoodLogModal({
  isOpen, onClose, client, db,
  targets, consumedToday, onMealLogged,
  defaultMealMoment,
  editMeal,
  // ISO timestamp to stamp on consumed_at. Pass when logging meals for a
  // non-today date (e.g. backfilling yesterday). Null/omitted = use now.
  consumedAt = null,
  // Op welk tabblad het venster opent. 'meals' = Mijn maaltijden, gebruikt
  // door de knop "Maaltijd aanmaken" in het wisselvenster.
  startTab = 'search',
}) {
  const isMobile = window.innerWidth <= 768
  // Twee dingen sturen het scherm: de schuifknop (zoeken of scannen) en de
  // vier knoppen eronder (favorieten / producten / mijn maaltijden / coach).
  const [weergave, setWeergave] = useState('zoeken')
  const [filter, setFilter] = useState(startTab === 'meals' ? 'maaltijden' : 'producten')
  const [selectedItem, setSelectedItem] = useState(null)
  const [loggingService, setLoggingService] = useState(null)
  const [successData, setSuccessData] = useState(null)
  const [addIngredientCallback, setAddIngredientCallback] = useState(null)
  const [buildingMeal, setBuildingMeal] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  // Coach maaltijden: dezelfde lijst als het wisselvenster, ingebouwd.
  const [mealService] = useState(() => (db ? new AIMealPlanService(db) : null))
  // Waarmee het wisselvenster vergelijkt. Bij loggen is er niets om te
  // wisselen; alleen het moment telt, zodat de lijst op het juiste moment
  // opent (gekozen moment, anders het uur van de dag).
  const coachStartMaaltijd = useMemo(() => {
    const u = new Date().getHours()
    const nuMoment = u < 10 ? 'breakfast' : u < 14 ? 'lunch' : u < 17 ? 'snack' : u < 21 ? 'dinner' : 'snack'
    const slot = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'].includes(defaultMealMoment)
      ? defaultMealMoment : nuMoment
    return { id: null, name: '', slot, calories: 0, protein: 0, carbs: 0, fat: 0 }
  }, [defaultMealMoment])

  useEffect(() => {
    if (db?.supabase && !loggingService) {
      setLoggingService(new SmartLoggingService(db.supabase))
    }
  }, [db])

  // ✅ Reset on close — maar NIET selectedItem als editMeal nog actief is
  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null)
      setWeergave('zoeken')
      setFilter(startTab === 'meals' ? 'maaltijden' : 'producten')
      setSuccessData(null)
      setAddIngredientCallback(null)
      setBuildingMeal(null)
    }
  }, [isOpen, startTab])

  // Openen op het meegegeven onderdeel ('meals' = Mijn maaltijden).
  useEffect(() => {
    if (!isOpen) return
    setWeergave('zoeken')
    setFilter(startTab === 'meals' ? 'maaltijden' : 'producten')
  }, [isOpen, startTab])

  // ✅ FIX v3.1: editMeal flow — race fixed door op editMeal.id te listenen
  // Vorige versie luisterde alleen op [isOpen, editMeal] referentie wat issues gaf
  useEffect(() => {
    console.log('🔍 [FOODLOGMODAL] editMeal effect fired:', {
      isOpen,
      hasEditMeal: !!editMeal,
      editMealId: editMeal?.id,
      editMealAmount: editMeal?.amount,
      editMealPerUnit: editMeal?.per_unit,
      editMealCalories: editMeal?.calories,
      editMealName: editMeal?.meal_name
    })

    if (isOpen && editMeal && editMeal.id) {
      const hasAmount = editMeal.amount !== null && editMeal.amount !== undefined
      // Strict per_unit detection — legacy null falls back to portion-mode
      // so the stored totals are treated as "1 portion" instead of "per-100g".
      // This matches RecentTab.handleSelect for consistency.
      const isPer100g = editMeal.per_unit === 'gram'

      const newSelectedItem = {
        id: editMeal.meal_id || editMeal.id,
        name: editMeal.meal_name || editMeal.name,
        calories: editMeal.calories || 0,
        protein: parseFloat(editMeal.protein) || 0,
        carbs: parseFloat(editMeal.carbs) || 0,
        fat: parseFloat(editMeal.fat) || 0,
        image_url: editMeal.image_url,
        ingredients: editMeal.ingredients || [],
        type: 'recent',
        source: 'edit',
        per100g: isPer100g,
        _editId: editMeal.id,
        _savedAmount: hasAmount ? parseFloat(editMeal.amount) : null,
        _savedPerUnit: editMeal.per_unit || null
      }

      console.log('🔍 [FOODLOGMODAL] setSelectedItem with:', {
        name: newSelectedItem.name,
        per100g: newSelectedItem.per100g,
        _savedAmount: newSelectedItem._savedAmount,
        _savedPerUnit: newSelectedItem._savedPerUnit,
        _editId: newSelectedItem._editId
      })

      setSelectedItem(newSelectedItem)
    }
  }, [isOpen, editMeal?.id, editMeal?.amount, editMeal?.per_unit])

  const handleSelectItem = (item) => {
    setSelectedItem(item)
  }

  const handleLog = async (logData) => {
    if (addIngredientCallback) {
      const newIngredient = {
        id: logData.sourceId || logData.id,
        name: logData.name, brand: logData.brand || null,
        amount: logData.amount || 100, unit: 'g',
        calories: logData.calories || 0, protein: logData.protein || 0,
        carbs: logData.carbs || 0, fat: logData.fat || 0
      }
      setBuildingMeal(prev => prev ? {
        ...prev,
        ingredients_list: [...(prev.ingredients_list || []), newIngredient]
      } : prev)
      setAddIngredientCallback(null)
      setSelectedItem(null)
      setFilter('maaltijden')
      return
    }

    if (!loggingService || !client?.id) return

    try {
      if (selectedItem?._editId) {
        await db.supabase
          .from('consumed_meals')
          .delete()
          .eq('id', selectedItem._editId)
      }

      // Fire-and-forget: als dit een ingredient is zonder image maar mét
      // barcode, ophalen via Open Food Facts en cachen. Volgende keer dat
      // dit item in search/recent verschijnt staat de foto er al — sneller
      // herkennen = sneller loggen.
      if (logData.sourceId && logData.type !== 'meal' && !logData.image_url && logData.barcode) {
        enrichIngredientImage(db, logData.sourceId).catch(() => {})
      }

      const result = await loggingService.logMeal(client.id, {
        name: logData.name,
        sourceId: logData.sourceId || null,
        type: logData.type || 'custom',
        ingredients: logData.ingredients || [],
        calories: Math.round(logData.calories),
        protein: Math.round(logData.protein),
        carbs: Math.round(logData.carbs),
        fat: Math.round(logData.fat),
        source: logData.source || 'manual_log',
        notes: logData.notes || null,
        image_url: logData.image_url || null,
        barcode: logData.barcode || null,
        brand: logData.brand || null,
        per100g: logData.per100g || false,
        amount: logData.amount || 100,
        per_unit: logData.per_unit || null,
        defaultPortion: logData.defaultPortion || 100,
        meal_type: logData.meal_type || 'snack'
      }, consumedAt)

      if (onMealLogged) {
        if (selectedItem?._editId) {
          const oldCal = selectedItem.calories || 0
          const oldPro = selectedItem.protein || 0
          const oldCarbs = selectedItem.carbs || 0
          const oldFat = selectedItem.fat || 0
          onMealLogged({
            ...result,
            calories: Math.round(logData.calories) - Math.round(oldCal),
            protein: Math.round(logData.protein) - Math.round(oldPro),
            carbs: Math.round(logData.carbs) - Math.round(oldCarbs),
            fat: Math.round(logData.fat) - Math.round(oldFat),
            _isEdit: true
          })
        } else {
          onMealLogged({
            ...result,
            calories: Math.round(logData.calories),
            protein: Math.round(logData.protein),
            carbs: Math.round(logData.carbs),
            fat: Math.round(logData.fat)
          })
        }
      }

      setSuccessData({
        name: logData.name,
        calories: Math.round(logData.calories),
        meal_type: logData.meal_type || 'snack',
        isEdit: !!selectedItem?._editId
      })

      meldSucces('gelogd')
      setTimeout(() => {
        setSuccessData(null)
        setSelectedItem(null)
        onClose()
      }, 1500)

    } catch (err) {
      console.error('❌ Log failed:', err)
      alert('Opslaan mislukt. Probeer opnieuw.')
    }
  }

  if (!isOpen) return null

  const MOMENT_LABELS = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Snack', copy: 'Gekopieerd' }

  const modal = (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a0a',
      zIndex: 10000, display: 'flex', flexDirection: 'column',
      animation: 'flmFadeIn 0.2s ease'
    }}>

      {successData && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 10002, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'flmFadeIn 0.2s ease'
        }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <GelogdAnimatie grootte={isMobile ? 104 : 120} />
          </div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.7rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.3rem', animation: 'flmFadeIn 0.3s ease 0.35s both' }}>
            {successData.isEdit ? 'Bijgewerkt!' : 'Gelogd!'}
          </div>
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.55)', textAlign: 'center', maxWidth: '260px', animation: 'flmFadeIn 0.3s ease 0.45s both' }}>
            {successData.name}
          </div>
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: '#fff', fontWeight: 900, marginTop: '0.5rem', animation: 'flmFadeIn 0.3s ease 0.55s both' }}>
            +{successData.calories} kcal → {MOMENT_LABELS[successData.meal_type] || 'Gelogd'}
          </div>
        </div>
      )}

      {selectedItem && !successData ? (
        <>
          <button
            onClick={() => setSelectedItem(null)}
            style={{
              position: 'absolute', top: isMobile ? '0.75rem' : '1rem',
              left: isMobile ? '0.75rem' : '1rem',
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10001,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            title="Klopt iets niet?"
            style={{
              position: 'absolute', top: isMobile ? '0.75rem' : '1rem',
              right: isMobile ? '0.75rem' : '1rem',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0 0.7rem', height: '36px', borderRadius: '10px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              fontSize: '0.72rem', fontWeight: 800,
              cursor: 'pointer', zIndex: 10001,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <AlertCircle size={13} /> Klopt niet?
          </button>
          <AmountPicker
            item={selectedItem}
            onLog={handleLog}
            isMobile={isMobile}
            defaultMealMoment={defaultMealMoment}
            db={db}
            client={client}
            loggingService={loggingService}
          />
        </>
      ) : !successData ? (
        <>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: isMobile ? '0.75rem' : '1rem',
              right: isMobile ? '0.75rem' : '1rem',
              width: '36px', height: '36px', padding: 0,
              background: 'none', border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10001,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={22} strokeWidth={2.4} />
          </button>

          <FoodLogHeader
            weergave={weergave}
            onWeergave={setWeergave}
            isMobile={isMobile}
          />

          {weergave === 'zoeken' && (
            <FilterKnoppen filter={filter} zet={setFilter} isMobile={isMobile} />
          )}

          {/* Coach maaltijden heeft een eigen vaste kop (zoeken + keuzes) en
              een eigen scrollende lijst; dan scrolt deze laag zelf niet. */}
          <div style={{
            flex: 1, minHeight: 0, WebkitOverflowScrolling: 'touch',
            overflowY: weergave === 'zoeken' && filter === 'coach' ? 'hidden' : 'auto',
            display: 'flex', flexDirection: 'column',
          }}>
            {weergave === 'scannen' ? (
              <ScanTab
                db={db}
                onSelect={(item) => {
                  setWeergave('zoeken')
                  handleSelectItem(item)
                }}
                onBack={() => setWeergave('zoeken')}
                onClose={onClose}
                isMobile={isMobile}
              />
            ) : weergave === 'foto' ? (
              <FotoTab db={db} client={client} onLog={handleLog} isMobile={isMobile} defaultMealMoment={defaultMealMoment} />
            ) : weergave === 'snel' ? (
              <QuickAddTab onLog={handleLog} isMobile={isMobile} db={db} />
            ) : filter === 'coach' ? (
              <AIAlternativesModal
                embedded
                isOpen
                currentMeal={coachStartMaaltijd}
                db={db}
                service={mealService}
                client={client}
                onClose={() => {}}
                onSelectMeal={() => {}}
                onKiesMaaltijd={(m) => handleSelectItem({
                  id: m.id, name: m.name,
                  calories: Math.round(m.calories || 0), protein: Math.round(m.protein || 0),
                  carbs: Math.round(m.carbs || 0), fat: Math.round(m.fat || 0),
                  image_url: m.image_url,
                  type: m._isCustom ? 'custom_meal' : 'meal',
                  source: m._isCustom ? 'custom' : 'myarc',
                  sourceLabel: 'Coach', per100g: false,
                  ingredients: Array.isArray(m.ingredients_list) ? m.ingredients_list : [],
                })}
              />
            ) : filter === 'maaltijden' ? (
              <MyMealsTab
                client={client} db={db} onLog={handleLog} isMobile={isMobile}
                buildingMeal={buildingMeal} setBuildingMeal={setBuildingMeal}
                onRequestAddIngredient={() => {
                  setAddIngredientCallback(true)
                  setFilter('producten')
                }}
              />
            ) : (
              <SearchTab
                db={db}
                onSelect={handleSelectItem}
                isMobile={isMobile}
                client={client}
                onQuickLog={handleLog}
                defaultMealMoment={defaultMealMoment}
                bron={filter === 'favorieten' ? 'favorieten' : 'alles'}
              />
            )}
          </div>

        </>
      ) : null}

      <style>{`
        @keyframes flmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes flmPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <IngredientFeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        item={selectedItem}
        client={client}
        db={db}
      />
    </div>
  )

  return createPortal(modal, document.body)
}

// Waar je zoekt: favorieten (hartje), producten, je eigen maaltijden of de
// maaltijden van je coach. Geen vakken meer: alleen tekst, de gekozen keuze
// een wit pilletje (27 okt 2026, naar voorbeeld van een andere log-app).
function FilterKnoppen({ filter, zet, isMobile }) {
  const knoppen = [
    { id: 'producten', label: 'Producten' },
    { id: 'maaltijden', label: 'Mijn maaltijden' },
    // Wat de coach voor je klaarzet: dezelfde lijst als bij wisselen. Heette
    // 'Coach'; 'Recepten' zegt wat je er vindt (kant-en-klare maaltijden).
    { id: 'coach', label: 'Recepten' },
  ]
  const favAan = filter === 'favorieten'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
      padding: isMobile ? '0 0.75rem 0.55rem' : '0 1rem 0.65rem',
      overflowX: 'auto', scrollbarWidth: 'none',
    }}>
      <button onClick={() => zet('favorieten')} title="Favorieten" aria-label="Favorieten" style={{
        flexShrink: 0, width: 38, height: 34, padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
        opacity: favAan ? 1 : 0.55,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <Heart size={20} strokeWidth={2.4} fill={favAan ? '#fff' : 'none'} />
      </button>
      {knoppen.map(k => {
        const aan = filter === k.id
        return (
          <button
            key={k.id}
            onClick={() => zet(k.id)}
            style={{
              flexShrink: 0, height: 34, padding: '0 0.9rem',
              background: aan ? '#fff' : 'transparent', border: 'none', borderRadius: 999,
              color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
              fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 900,
              fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {k.label}
          </button>
        )
      })}
    </div>
  )
}
