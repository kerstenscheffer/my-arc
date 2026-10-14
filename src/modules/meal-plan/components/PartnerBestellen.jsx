// src/modules/meal-plan/components/PartnerBestellen.jsx
//
// Kant-en-klare maaltijden van partners (nu: PrepMyMeal). Ze staan gewoon in
// ai_meals, met partner, partner_url (met Kerstens ref-code) en partner_prijs.
// Hier: het label op de kaart en het bestel-blok in de info-schermen.
import React from 'react'
import { ShoppingBag, ExternalLink } from 'lucide-react'

import { partnerVan } from '../utils/partner'

// Klein label boven de naam op een maaltijdkaart.
export function PartnerLabel({ meal }) {
  const p = partnerVan(meal)
  if (!p) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.62rem', fontWeight: 900, color: '#fff',
      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: 999, padding: '1px 7px', whiteSpace: 'nowrap',
    }}>
      <ShoppingBag size={10} strokeWidth={2.8} />
      {p.naam}
      {p.prijsKorting
        ? <> · <span style={{ textDecoration: 'line-through', opacity: 0.55, fontWeight: 700 }}>{p.prijs}</span> <span style={{ color: '#10b981' }}>{p.prijsKorting}</span></>
        : (p.prijs ? ` · ${p.prijs}` : '')}
    </span>
  )
}

// Blok in het info-scherm: wat het is en een knop naar de webshop.
export default function PartnerBestellen({ meal, isMobile, style }) {
  const p = partnerVan(meal)
  if (!p) return null
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '0.8rem 0.9rem', borderRadius: 14,
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 900, color: '#fff' }}>
          Kant-en-klaar van {p.naam}
        </div>
        {p.prijs && (
          <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
            {p.prijsKorting ? (
              <>
                <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginRight: 6 }}>{p.prijs}</span>
                <span style={{ color: '#10b981' }}>{p.prijsKorting}</span>
              </>
            ) : p.prijs}
            {p.porties === 2 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}> / 2 porties</span>}
          </div>
        )}
      </div>
      {p.korting && (
        <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#10b981', whiteSpace: 'nowrap' }}>
          {p.korting.procent}% korting · {p.korting.code}
        </div>
      )}
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
        Vers bereid en ingevroren, in 7-8 minuten warm.{p.porties === 2 ? ' De macro’s hier zijn per portie.' : ''}
      </div>
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          minHeight: 44, borderRadius: 12, background: '#fff', color: '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          fontSize: '0.86rem', fontWeight: 900, textDecoration: 'none',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        Bestellen bij {p.naam} <ExternalLink size={14} strokeWidth={2.8} />
      </a>
    </div>
  )
}
