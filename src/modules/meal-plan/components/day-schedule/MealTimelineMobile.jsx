// src/modules/meal-plan/components/day-schedule/MealTimelineMobile.jsx
// 🎯 v5.0 - Unified timeline with plan toggle + per-moment sections
// Plan toggle: show/hide plan meals as reference
// Plan afvinken → auto-log to consumed_meals
// Logged meals: edit/delete
// "Voedingsmiddel toevoegen" per section
import React, { useState } from 'react'
import { createPortal } from '../../../../client/paginaPortal'
import MealCard from './MealCard'
import { Trash2, Edit3, Info, Check, Plus, Sunrise, Salad, Apple, UtensilsCrossed, Zap, Pill, ChevronDown } from 'lucide-react'
import { supplementFoto } from '../../../supplements/utils/supplementFoto'
import { useProductFotos } from '../../../supplements/utils/productFoto'

// Icoon per vast moment voor een lege plek in de tijdlijn.
const LEEG_ICOON = { breakfast: Sunrise, lunch: Salad, snack1: Apple, dinner: UtensilsCrossed, pre_workout: Zap }

// Label van het moment waarop iets gelogd is, voor op de foto van de kaart.
const MOMENT_LABEL = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner',
  snack: 'Tussendoortje', snack1: 'Snack 1', snack2: 'Snack 2', snack3: 'Snack 3',
}

// De indeling in Ontbijt / Lunch / Diner / Tussendoortjes is vervallen: de
// lijst staat nu op kloktijd. Daarmee zijn ook de mappers weg die een slot
// naar zo'n vak vertaalden — alles wat geen ontbijt, lunch of diner heette
// belandde daarin, en dat zette een kwark van 09:30 onder het avondeten.

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function MealTimelineMobile({
  meals = [],
  checkedMeals = {},
  onMealCheck,
  onOpenInfo,
  onOpenAlternatives,
  onVerwijderMeal = null,
  isToday,
  consumedMeals = [],
  onOpenFoodLog,
  onDeleteConsumedMeal,
  onEditConsumedMeal,
  onPlanMealLog, // NEW: callback when plan meal is checked → auto-log
  supplementenPerMoment = {},
  supplementLogs,
  onSupplementCheck,
  onSupplementInfo,
  // Vaste momenten die vandaag ontbreken: [{ slot, label, min }]. Een lege
  // plek met "+ toevoegen" (opent het wisselscherm als toevoegen).
  legeMomenten = [],
  onVoegToe = null,
  // Zelf een supplement toevoegen ({ naam, hoeveelheid, tijd, dagen }) en
  // een eigen supplement weer weghalen.
  onSupplementToevoegen = null,
  onSupplementVerwijderen = null,
  // Moment (soort + tijd) van een planmaaltijd aanpassen.
  onMomentWijzigen = null,
}) {
  const [showPlan, setShowPlan] = useState(true)
  const productFotos = useProductFotos()

  // Eén lijst op kloktijd, geen groepen per moment.
  //
  // Hiervoor stond alles in vier vakken: Ontbijt, Lunch, Diner en
  // Tussendoortjes. Alles wat niet een van de eerste drie was viel in dat
  // laatste vak, onderaan de pagina — een kwark om 09:30 stond daardoor
  // ónder het avondeten, en een pre-workout maaltijd om 06:20 helemaal
  // onderaan. Op een dagoverzicht wil je zien wat er ná elkaar komt.
  //
  // Alles wat een tijd heeft doet mee: plan-maaltijden, wat de klant zelf
  // logde, en supplementen.
  const minutenVan = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v * 60)
    const m = /^\s*(\d{1,2}):(\d{2})/.exec(String(v || ''))
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null
  }
  const tijdVanGelogd = (m) => {
    if (!m?.consumed_at) return null
    const d = new Date(m.consumed_at)
    return isNaN(d) ? null : d.getHours() * 60 + d.getMinutes()
  }

  const items = []
  meals.forEach((meal, i) => items.push({
    soort: 'plan', sleutel: `plan-${meal.slot}-${i}`, data: meal,
    // plannedTime is de bron: die is voor de pre-workout maaltijd al
    // omgerekend naar de trainingstijd. timing is de terugval.
    min: minutenVan(meal.plannedTime) ?? minutenVan(meal.timing) ?? 12 * 60,
  }))
  // Welke maaltijden staan er vandaag in het plan? Daar vergelijken we de
  // gelogde rijen mee.
  const planIds = new Set(meals.map(m => m.meal_id || m.id).filter(Boolean))
  ;(consumedMeals || []).forEach(meal => {
    // Een afgevinkte plan-maaltijd staat al als kaart in de lijst; hem hier
    // nog eens tonen zou hetzelfde eten twee keer laten zien.
    //
    // Maar alleen als hij er nog ín staat. Wissel je van dag nadat je iets
    // hebt afgevinkt, dan hoort wat je at gewoon zichtbaar te blijven —
    // anders verdwijnt het van het scherm terwijl het wel meetelt in je
    // dagtotalen.
    const staatInPlan = meal.meal_id ? planIds.has(meal.meal_id) : true
    if (showPlan && meal.source === 'plan_check' && staatInPlan) return
    items.push({
      soort: 'gelogd', sleutel: `logged-${meal.id}`, data: meal,
      min: tijdVanGelogd(meal) ?? 12 * 60,
    })
  })
  // Supplementen niet meer tussen de maaltijden (dat maakte de pagina druk,
  // 27 okt 2026) maar in één inklapbaar blok onderaan, op tijd.
  const supplementen = Object.values(supplementenPerMoment || {}).flat()
    .map(sp => ({ sp, min: Number.isFinite(sp.sorteerMin) ? sp.sorteerMin : 12 * 60 }))
    .sort((a, b) => a.min - b.min)
  const genomen = supplementen.filter(x => supplementLogs?.has?.(x.sp.id)).length
  const [suppOpen, setSuppOpenRuw] = useState(() => { try { return localStorage.getItem('myarc_supp_open') === '1' } catch { return false } })
  const setSuppOpen = (v) => { setSuppOpenRuw(v); try { localStorage.setItem('myarc_supp_open', v ? '1' : '0') } catch { /* geen opslag */ } }
  // Formulier voor een eigen supplement.
  const [nieuwSupp, setNieuwSupp] = useState(null) // { naam, hoeveelheid, tijd, dagen }
  const [suppBezig, setSuppBezig] = useState(false)
  const bewaarNieuwSupp = async () => {
    if (!nieuwSupp?.naam?.trim() || !onSupplementToevoegen) return
    setSuppBezig(true)
    try { await onSupplementToevoegen(nieuwSupp); setNieuwSupp(null); setSuppOpen(true) }
    catch (e) { console.error('Supplement toevoegen mislukt:', e); alert('Toevoegen mislukt.') }
    finally { setSuppBezig(false) }
  }

  if (onVoegToe) (legeMomenten || []).forEach(p => items.push({
    soort: 'leeg', sleutel: `leeg-${p.slot}`, data: p, min: p.min,
  }))

  // Bij een gelijke tijd eerst het plan, dan het supplement, dan wat er
  // gelogd is — zo staat de bedoeling boven de uitvoering.
  const RANG = { plan: 0, leeg: 0, supplement: 1, gelogd: 2 }
  items.sort((a, b) => (a.min - b.min) || (RANG[a.soort] - RANG[b.soort]))

  const klok = (min) =>
    `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

  // Handle plan meal check → auto-log to consumed_meals.
  // CRITICAL: when NEW-logging, only fire `onPlanMealLog` (it handles both
  // the consumed_meals insert + macro update + visual check). Firing
  // `onMealCheck` in addition causes a duplicate macro increment on the
  // DailyTotalsBar. `onMealCheck` only runs on the UNCHECK path.
  const handlePlanCheck = (meal) => {
    if (!checkedMeals[meal.slot] && onPlanMealLog) {
      onPlanMealLog(meal)
      return
    }
    if (onMealCheck) onMealCheck(meal)
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* "Plan verbergen / Plan tonen" toggle weggehaald — was ruis
          tussen dag-navigatie en eerste maaltijd. Plan staat altijd aan. */}

      {/* ── Alles op tijd, van vroeg naar laat ── */}
      {items.map(item => {
        if (item.soort === 'plan') {
          const meal = item.data
          return (
            <MealCard
              key={item.sleutel}
              meal={meal}
              isChecked={checkedMeals[meal.slot]}
              onCheck={() => handlePlanCheck(meal)}
              onInfo={() => onOpenInfo(meal)}
              onAlternatives={() => onOpenAlternatives(meal)}
              onVerwijder={onVerwijderMeal ? () => onVerwijderMeal(meal) : null}
              onMoment={onMomentWijzigen ? (pos) => onMomentWijzigen(meal, pos) : null}
              isMobile={true}
              isLast={false}
            />
          )
        }

        if (item.soort === 'gelogd') {
          // Zelfde kaart als een plan-maaltijd, alleen met andere knoppen:
          // wat je zelf logt hoef je niet af te vinken of te wisselen.
          const g = item.data
          return (
            <MealCard
              key={item.sleutel}
              meal={{
                name: g.meal_name || g.name || g.product_name || 'Gelogd',
                image_url: g.image_url,
                slot: g.meal_type,
                calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat,
              }}
              momentLabel={g.brand || MOMENT_LABEL[g.meal_type] || 'Gelogd'}
              tijdLabel={klok(item.min)}
              gegeten
              isMobile={true}
              acties={[
                { icon: <Edit3 size={11} />, label: 'Bewerken', onClick: () => onEditConsumedMeal?.(g) },
                { icon: <Trash2 size={11} />, label: 'Verwijderen', onClick: () => onDeleteConsumedMeal?.(g.id), kleur: 'rgba(239,68,68,0.85)' },
              ]}
            />
          )
        }

        // Lege plek: dit vaste moment staat niet (meer) in het plan. Een
        // grijze maaltijdkaart met het icoon van het moment op de fotoplek.
        if (item.soort === 'leeg') {
          const p = item.data
          const Icoon = LEEG_ICOON[p.slot] || LEEG_ICOON.snack1
          return (
            <button key={item.sleutel} onClick={() => onVoegToe?.(p)} style={{
              margin: '0 0.9rem 0.55rem', minHeight: 56, borderRadius: 12, padding: 0, overflow: 'hidden',
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'stretch', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{
                width: 60, flexShrink: 0, background: 'rgba(255,255,255,0.05)', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)',
              }}>
                <Icoon size={20} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0.8rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{p.label}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{klok(p.min)} · nog niets gepland</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.9rem', color: '#fff' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={15} strokeWidth={3} />
                </span>
              </div>
            </button>
          )
        }

        // Supplement — dezelfde kaart als een maaltijd, de dosering grijs
        // achter de naam (op dezelfde regel) en de tijd op de foto.
        const sp = item.data
        const afgevinkt = !!supplementLogs?.has?.(sp.id)
        return (
          <MealCard
            key={item.sleutel}
            meal={{ name: sp.naam, image_url: productFotos[sp.id] || supplementFoto(sp, 240) }}
            productFoto={!!productFotos[sp.id]}
            momentLabel="Supplement"
            tijdLabel={Number.isFinite(item.min) ? klok(item.min) : null}
            naNaam={sp.dosering || null}
            isChecked={afgevinkt}
            isMobile={true}
            onCheck={() => onSupplementCheck?.(sp)}
            acties={[
              { icon: <Info size={11} />, label: 'Info', onClick: () => onSupplementInfo?.(sp) },
              {
                icon: <Check size={11} strokeWidth={2.6} />,
                label: afgevinkt ? 'Genomen' : 'Afronden',
                onClick: () => onSupplementCheck?.(sp),
                checked: afgevinkt,
              },
            ]}
          />
        )
      })}

      {/* Supplementen: één blok onderaan, standaard dicht, met voortgang. */}
      {(supplementen.length > 0 || onSupplementToevoegen) && (
        <div style={{ margin: '0.4rem 0.9rem 0.6rem', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <button onClick={() => setSuppOpen(!suppOpen)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 0.9rem',
            background: 'none', border: 'none', color: '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <Pill size={17} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 900 }}>Supplementen</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 900, color: genomen === supplementen.length ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {genomen === supplementen.length && <Check size={14} strokeWidth={3} />}
              {genomen}/{supplementen.length}
            </span>
            <ChevronDown size={16} strokeWidth={2.8} style={{ transition: 'transform 0.15s ease', transform: suppOpen ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
          </button>
          {suppOpen && supplementen.map(({ sp, min }) => {
            const af = !!supplementLogs?.has?.(sp.id)
            return (
              <div key={sp.id} onClick={() => onSupplementInfo?.(sp)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.9rem',
                borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
              }}>
                <img src={productFotos[sp.id] || supplementFoto(sp, 120)} alt="" style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)',
                  objectFit: productFotos[sp.id] ? 'contain' : 'cover', opacity: af ? 0.5 : 1,
                }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: af ? 'rgba(255,255,255,0.45)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: af ? 'line-through' : 'none' }}>
                    {sp.naam}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {klok(min)}{sp.dosering ? ` · ${sp.dosering}` : ''}
                  </span>
                </span>
                {sp.eigen && onSupplementVerwijderen && (
                  <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`${sp.naam} weghalen?`)) onSupplementVerwijderen(sp) }} aria-label="Weghalen" style={{
                    flexShrink: 0, width: 28, height: 28, padding: 0, background: 'none', border: 'none', color: '#fff', opacity: 0.55,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}><Trash2 size={15} strokeWidth={2.4} /></button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onSupplementInfo?.(sp) }} aria-label="Info" style={{
                  flexShrink: 0, width: 28, height: 28, padding: 0, background: 'none', border: 'none', color: '#fff', opacity: 0.55,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}><Info size={16} strokeWidth={2.4} /></button>
                <button onClick={(e) => { e.stopPropagation(); onSupplementCheck?.(sp) }} aria-label={af ? 'Genomen' : 'Afvinken'} style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: '50%', padding: 0,
                  background: af ? '#fff' : 'transparent', border: `1.5px solid ${af ? '#fff' : 'rgba(255,255,255,0.35)'}`,
                  color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>{af && <Check size={14} strokeWidth={3} />}</button>
              </div>
            )
          })}
          {suppOpen && onSupplementToevoegen && (
            <button onClick={() => setNieuwSupp({ naam: '', hoeveelheid: '', tijd: '08:00', dagen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] })} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.7rem',
              background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#fff',
              fontSize: '0.84rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <Plus size={16} strokeWidth={3} /> Supplement toevoegen
            </button>
          )}
        </div>
      )}

      {/* Eigen supplement toevoegen: pop-up van onder. */}
      {nieuwSupp && createPortal(
        <div onClick={() => !suppBezig && setNieuwSupp(null)} style={{
          position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 560, margin: '0 auto', background: '#0a0a0a',
            borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 22, borderTopRightRadius: 22,
            padding: '0 1rem calc(1rem + env(safe-area-inset-bottom, 0px))',
          }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '8px auto 0.9rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: '1rem' }}>Supplement toevoegen</div>
            {[
              { k: 'naam', plaats: 'Naam (bv. Vitamine D)', type: 'text' },
              { k: 'hoeveelheid', plaats: 'Hoeveelheid (bv. 2 capsules)', type: 'text' },
            ].map(v => (
              <input key={v.k} type={v.type} value={nieuwSupp[v.k]} placeholder={v.plaats}
                onChange={e => setNieuwSupp(prev => ({ ...prev, [v.k]: e.target.value }))}
                style={{
                  width: '100%', boxSizing: 'border-box', marginBottom: 8, height: 44, padding: '0 0.85rem',
                  background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#fff',
                  fontSize: '0.92rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
                }} />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0.4rem 0 0.8rem' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tijd</span>
              <input type="time" value={nieuwSupp.tijd} onChange={e => setNieuwSupp(prev => ({ ...prev, tijd: e.target.value }))} style={{
                height: 40, padding: '0 0.7rem', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
                color: '#fff', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: '1rem' }}>
              {[['monday', 'Ma'], ['tuesday', 'Di'], ['wednesday', 'Wo'], ['thursday', 'Do'], ['friday', 'Vr'], ['saturday', 'Za'], ['sunday', 'Zo']].map(([k, l]) => {
                const aan = nieuwSupp.dagen.includes(k)
                return (
                  <button key={k} onClick={() => setNieuwSupp(prev => ({ ...prev, dagen: aan ? prev.dagen.filter(x => x !== k) : [...prev.dagen, k] }))} style={{
                    padding: '0.5rem 0', borderRadius: 10, fontFamily: 'inherit', cursor: 'pointer',
                    background: aan ? '#fff' : 'rgba(255,255,255,0.04)', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                    color: aan ? '#000' : 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontWeight: 900,
                  }}>{l}</button>
                )
              })}
            </div>
            <button onClick={bewaarNieuwSupp} disabled={suppBezig || !nieuwSupp.naam.trim() || !nieuwSupp.dagen.length} style={{
              width: '100%', minHeight: 48, borderRadius: 12, border: 'none',
              background: (!nieuwSupp.naam.trim() || !nieuwSupp.dagen.length) ? 'rgba(255,255,255,0.15)' : '#fff',
              color: (!nieuwSupp.naam.trim() || !nieuwSupp.dagen.length) ? 'rgba(255,255,255,0.5)' : '#0a0a0a',
              fontSize: '0.92rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            }}>{suppBezig ? 'Opslaan…' : 'Toevoegen'}</button>
          </div>
        </div>,
        document.body
      )}

      {/* Wijde gele "Voedingsmiddel toevoegen" knop weggehaald —
          de floating FAB rechtsonder is de enige log-actie op de pagina. */}
    </div>
  )
}
