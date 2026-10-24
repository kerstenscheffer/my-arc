// src/modules/meal-plan/components/IngredientDetail.jsx
//
// Eén ingrediënt uit de maaltijd-info, op dezelfde plek als de maaltijd zelf:
// tik je op een ingrediënt, dan schuift dit ervoor; de pijl zet je terug.
// Toont alleen wat er in ai_ingredients staat — lege velden vallen weg, zodat
// een kaal product geen rij streepjes wordt.

import React from 'react'
import { ArrowLeft, X, AlertCircle, Snowflake, Refrigerator, Package, ChefHat } from 'lucide-react'
import { toHumanAmount } from '../../ai-meal-generator/utils/unitConverter'
import { foodImageFallback } from '../foodImageFallback'

const LIJN = '1px solid rgba(255,255,255,0.12)'
const ZACHT = 'rgba(255,255,255,0.04)'

const NUTRISCORE_KLEUR = { a: '#038141', b: '#85bb2f', c: '#fecb02', d: '#ee8100', e: '#e63e11' }
const BEWAREN = { fridge: 'Koelkast', freezer: 'Vriezer', pantry: 'Voorraadkast', room: 'Kamertemperatuur' }
const ALLERGEEN = { lactose: 'Lactose', gluten: 'Gluten', nuts: 'Noten', peanuts: 'Pinda', soy: 'Soja', eggs: 'Ei', egg: 'Ei', fish: 'Vis', shellfish: 'Schaaldieren', sesame: 'Sesam', milk: 'Melk', celery: 'Selderij', mustard: 'Mosterd' }

const getal = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v))) ? null : Number(v)
const rond = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d

export default function IngredientDetail({ ing, onTerug, onClose, isMobile }) {
  const f = (ing.amount || 0) / 100
  const portie = [
    { val: (ing.calories_per_100g || 0) * f, label: 'kcal', d: 0 },
    { val: (ing.protein_per_100g || 0) * f, label: 'eiwit' },
    { val: (ing.carbs_per_100g || 0) * f, label: 'koolh' },
    { val: (ing.fat_per_100g || 0) * f, label: 'vet' },
  ]

  // Natrium staat in gram; op het etiket staat zout (natrium × 2,5).
  const natrium = getal(ing.sodium_per_100g)
  const per100 = [
    { label: 'Energie', val: getal(ing.calories_per_100g), eenheid: 'kcal', d: 0 },
    { label: 'Eiwit', val: getal(ing.protein_per_100g), eenheid: 'g' },
    { label: 'Koolhydraten', val: getal(ing.carbs_per_100g), eenheid: 'g' },
    { label: 'waarvan suikers', val: getal(ing.sugar_per_100g), eenheid: 'g', sub: true },
    { label: 'Vet', val: getal(ing.fat_per_100g), eenheid: 'g' },
    { label: 'waarvan verzadigd', val: getal(ing.saturated_fat_per_100g), eenheid: 'g', sub: true },
    { label: 'Vezels', val: getal(ing.fiber_per_100g), eenheid: 'g' },
    { label: 'Zout', val: natrium === null ? null : natrium * 2.5, eenheid: 'g', d: 2 },
  ].filter(r => r.val !== null)

  const allergenen = (Array.isArray(ing.allergens) ? ing.allergens : []).filter(Boolean)
  const vitamines = ing.vitamins_minerals && typeof ing.vitamins_minerals === 'object'
    ? Object.entries(ing.vitamins_minerals).filter(([, v]) => v !== null && v !== '' && v !== 0)
    : []
  const bewaren = [
    ing.storage_type && { icon: ing.storage_type === 'freezer' ? Snowflake : Refrigerator, tekst: BEWAREN[ing.storage_type] || ing.storage_type },
    getal(ing.shelf_life_days) && { icon: Package, tekst: `${ing.shelf_life_days} dagen houdbaar` },
    ing.freezable === true && { icon: Snowflake, tekst: 'Kan in de vriezer' },
  ].filter(Boolean)
  const ns = typeof ing.nutriscore === 'string' ? ing.nutriscore.toLowerCase() : null

  const pad = isMobile ? '0.9rem 1rem' : '1rem 1.5rem'
  const kopje = { fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }
  const knop = (kant) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: isMobile ? '0 0.9rem' : '0 1.2rem',
    background: 'transparent', border: 'none',
    [kant === 'links' ? 'borderRight' : 'borderLeft']: LIJN,
    color: '#fff', fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 900,
    letterSpacing: '-0.015em', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  return (
    <>
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'stretch',
        height: isMobile ? 40 : 48,
        paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
        boxSizing: 'content-box', background: '#0a0a0a', borderBottom: LIJN,
      }}>
        <button onClick={onTerug} style={knop('links')}>
          <ArrowLeft size={16} strokeWidth={2.8} /> Terug
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} aria-label="Sluiten" title="Sluiten" style={{ ...knop('rechts'), padding: 0, width: isMobile ? 48 : 56 }}>
          <X size={18} strokeWidth={2.8} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Hero */}
        <div style={{ position: 'relative', height: isMobile ? '180px' : '220px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ing.image_url || foodImageFallback(ing.name, null, 800)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0) 30%, rgba(10,10,10,0.8) 70%, #0a0a0a 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '0 1rem 0.75rem' : '0 1.5rem 1rem' }}>
            {ing.brand && (
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{ing.brand}</div>
            )}
            <div style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.4rem', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {ing.display || ing.name}
            </div>
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>{toHumanAmount(ing.name, ing.amount)}</span>
              {portie.map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>{rond(m.val, m.d ?? 0)}</span>
                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per 100 gram, zoals op het etiket */}
        {per100.length > 0 && (
          <div style={{ padding: pad, borderBottom: `1px solid ${ZACHT}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ ...kopje, marginBottom: 0 }}>Per 100 gram</div>
              {ns && NUTRISCORE_KLEUR[ns] && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nutri-Score</span>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: NUTRISCORE_KLEUR[ns], color: '#fff', fontWeight: 900, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>{ns}</span>
                </div>
              )}
            </div>
            {per100.map((r, i) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderTop: i ? `1px solid ${ZACHT}` : 'none' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: r.sub ? 600 : 700, color: r.sub ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.8)', paddingLeft: r.sub ? '0.75rem' : 0 }}>{r.label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>{rond(r.val, r.d ?? 1)} {r.eenheid}</span>
              </div>
            ))}
          </div>
        )}

        {bewaren.length > 0 && (
          <div style={{ padding: pad, borderBottom: `1px solid ${ZACHT}` }}>
            <div style={kopje}>Bewaren</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {bewaren.map(b => {
                const Icon = b.icon
                return (
                  <span key={b.tekst} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.65rem', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    <Icon size={13} strokeWidth={2.4} /> {b.tekst}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {ing.prep_instructions && (
          <div style={{ padding: pad, borderBottom: `1px solid ${ZACHT}` }}>
            <div style={kopje}>Bereiden</div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
              <ChefHat size={15} style={{ flexShrink: 0, marginTop: 2 }} /> {ing.prep_instructions}
            </div>
          </div>
        )}

        {vitamines.length > 0 && (
          <div style={{ padding: pad, borderBottom: `1px solid ${ZACHT}` }}>
            <div style={kopje}>Vitamines & mineralen</div>
            {vitamines.map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: i ? `1px solid ${ZACHT}` : 'none' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {allergenen.length > 0 && (
          <div style={{ margin: isMobile ? '1rem' : '1rem 1.5rem 1.5rem', padding: '0.625rem 0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(239,68,68,0.8)' }}>{allergenen.map(a => ALLERGEEN[String(a).toLowerCase()] || a).join(', ')}</span>
          </div>
        )}
      </div>
    </>
  )
}
