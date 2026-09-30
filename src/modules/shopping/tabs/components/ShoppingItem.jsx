// src/modules/shopping/tabs/components/ShoppingItem.jsx
//
// Eén regel in de boodschappenlijst, in dezelfde taal als de maaltijdkaarten op
// de Meal-pagina: foto links, dikke witte naam, hoeveelheid en prijs eronder in
// gedempt wit, een rond vinkje rechts. Geen kader, geen categoriekleur — de
// hairline tussen de regels is de enige scheiding.
//
// De foto komt uit foodImageFallback: eerst een eigen foto uit /food op basis
// van de naam, anders een gecureerde foto per categorie. Zo staat er nooit een
// leeg vakje, ook niet bij een eigen ingrediënt dat de klant net heeft getypt.

import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'

const TRUNCATE_LENGTH = 34

export default function ShoppingItem({ item, checked, onCheck, isMobile }) {
  const [expanded, setExpanded] = useState(false)
  if (!item) return null

  const name = item.name || ''
  const isTooLong = name.length > TRUNCATE_LENGTH
  const displayName = isTooLong && !expanded
    ? name.slice(0, TRUNCATE_LENGTH).trimEnd() + '…'
    : name

  const foto = foodImageFallback(name, null, 120)
  const hoeveelheid = `${Math.round(item.displayAmount || item.totalAmount || 0)}${item.unit || ''}`
  const prijs = `€${(item.estimatedCost || 0).toFixed(2)}`
  const maat = isMobile ? 46 : 52

  return (
    <div
      onClick={onCheck}
      style={{
        display: 'flex', alignItems: 'center',
        gap: isMobile ? 12 : 14,
        padding: isMobile ? '0.6rem 0' : '0.7rem 0',
        minHeight: maat + 16,
        cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        opacity: checked ? 0.4 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Foto */}
      <div style={{
        width: maat, height: maat, borderRadius: 12, flexShrink: 0,
        backgroundImage: `url(${foto})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: '#1a1a1a',
        filter: checked ? 'grayscale(1)' : 'none',
      }} />

      {/* Naam + regel eronder */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={(e) => { if (isTooLong) { e.stopPropagation(); setExpanded(v => !v) } }}
          style={{
            color: '#fff',
            fontSize: isMobile ? '0.92rem' : '0.98rem',
            fontWeight: 900, letterSpacing: '-0.015em', lineHeight: 1.25,
            textDecoration: checked ? 'line-through' : 'none',
            wordBreak: 'break-word',
          }}
        >
          {displayName}
        </div>
        <div style={{
          marginTop: 3,
          color: 'rgba(255,255,255,0.5)',
          fontSize: isMobile ? '0.74rem' : '0.78rem',
          fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        }}>
          {hoeveelheid} · {prijs}
        </div>
      </div>

      {/* Vinkje — rond en wit, zoals afronden op de maaltijdkaart. */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: checked ? '#fff' : 'transparent',
        border: `1.5px solid ${checked ? '#fff' : 'rgba(255,255,255,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}>
        {checked && <Check size={15} color="#0a0a0a" strokeWidth={3.2} />}
      </div>
    </div>
  )
}
