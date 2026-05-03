// src/funnel/90days/components/FoodList.jsx

import { useState } from 'react'
import { GOLD, pp, goldGloss } from '../colors'

const G = ({ children }) => (
  <span style={{ ...goldGloss, fontWeight: 800 }}>{children}</span>
)

const HIGH_VOLUME = [
  { name: 'Komkommer', portion: '300g', kcal: 45, note: 'Snack, salade' },
  { name: 'Watermeloen', portion: '300g', kcal: 90, note: 'Zoet, vullend' },
  { name: 'Courgette', portion: '300g', kcal: 51, note: 'Pasta vervanger' },
  { name: 'Bloemkoolrijst', portion: '300g', kcal: 75, note: 'Rijst vervanger' },
  { name: 'Aardbeien', portion: '250g', kcal: 80, note: 'Snack, toetje' },
  { name: 'Tomaat', portion: '250g', kcal: 45, note: 'Salade, saus' },
  { name: 'Wortelen', portion: '200g', kcal: 82, note: 'Snack, rauw' },
  { name: 'Popcorn (naturel)', portion: '30g', kcal: 110, note: 'Snack, veel volume' },
  { name: 'IJsbergsla', portion: '200g', kcal: 28, note: 'Basis voor salades' },
  { name: 'Champignons', portion: '200g', kcal: 44, note: 'Vleesvervanger' },
]

const HIGH_PROTEIN = [
  { name: 'Kipfilet', portion: '150g', kcal: 165, protein: 31, note: 'Basis eiwit' },
  { name: 'Griekse yoghurt 0%', portion: '200g', kcal: 110, protein: 20, note: 'Snack, ontbijt' },
  { name: 'Eieren', portion: '3 stuks', kcal: 210, protein: 18, note: 'Veelzijdig' },
  { name: 'Tonijn (blik, water)', portion: '140g', kcal: 130, protein: 30, note: 'Snelle maaltijd' },
  { name: 'Cottage cheese', portion: '200g', kcal: 160, protein: 24, note: 'Snack, toetje' },
  { name: 'Garnalen', portion: '150g', kcal: 105, protein: 24, note: 'Laag in vet' },
  { name: 'Magere kwark', portion: '250g', kcal: 140, protein: 28, note: 'Ontbijt, shake' },
  { name: 'Kalkoenfilet', portion: '150g', kcal: 155, protein: 30, note: 'Alternatief voor kip' },
  { name: 'Whey protein', portion: '30g scoop', kcal: 120, protein: 24, note: 'Post-workout' },
  { name: 'Skyr', portion: '200g', kcal: 120, protein: 22, note: 'IJslands, dikker dan yoghurt' },
]

export default function FoodList({ isMobile }) {
  const [activeTab, setActiveTab] = useState('volume')

  const items = activeTab === 'volume' ? HIGH_VOLUME : HIGH_PROTEIN

  return (
    <section style={{
      maxWidth: '720px', margin: '0 auto',
      padding: isMobile ? '1.5rem 1rem 2rem' : '2rem 2rem 2.5rem',
      borderTop: '1px solid rgba(255,186,9,0.08)',
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '1rem' : '1.25rem' }}>
        <h2 style={{
          fontFamily: pp,
          fontSize: isMobile ? '1.05rem' : '1.25rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.25,
          marginBottom: '0.25rem',
        }}>
          Wat moet je <G>eten</G>?
        </h2>
        <p style={{
          fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: 400, color: 'rgba(255,255,255,0.25)',
        }}>
          De slimste keuzes voor vetverlies
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: '0.35rem',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '10px', padding: '3px',
      }}>
        <button onClick={() => setActiveTab('volume')} style={{
          flex: 1, padding: isMobile ? '0.55rem' : '0.65rem',
          background: activeTab === 'volume' ? 'rgba(255,186,9,0.1)' : 'transparent',
          border: activeTab === 'volume' ? '1px solid rgba(255,186,9,0.2)' : '1px solid transparent',
          borderRadius: '8px',
          fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: activeTab === 'volume' ? 700 : 500,
          color: activeTab === 'volume' ? GOLD : 'rgba(255,255,255,0.3)',
          cursor: 'pointer', textAlign: 'center',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.2s ease',
        }}>
          Veel eten, weinig kcal
        </button>
        <button onClick={() => setActiveTab('protein')} style={{
          flex: 1, padding: isMobile ? '0.55rem' : '0.65rem',
          background: activeTab === 'protein' ? 'rgba(255,186,9,0.1)' : 'transparent',
          border: activeTab === 'protein' ? '1px solid rgba(255,186,9,0.2)' : '1px solid transparent',
          borderRadius: '8px',
          fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: activeTab === 'protein' ? 700 : 500,
          color: activeTab === 'protein' ? GOLD : 'rgba(255,255,255,0.3)',
          cursor: 'pointer', textAlign: 'center',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.2s ease',
        }}>
          Hoog in eiwit
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'protein' ? '1.5fr 0.8fr 0.6fr 0.6fr' : '1.5fr 0.8fr 0.6fr',
          gap: '0.25rem', padding: '0.4rem 0',
          borderBottom: '1px solid rgba(255,186,9,0.12)',
        }}>
          <div style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product</div>
          <div style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Portie</div>
          <div style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Kcal</div>
          {activeTab === 'protein' && (
            <div style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Eiwit</div>
          )}
        </div>

        {/* Rows */}
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: activeTab === 'protein' ? '1.5fr 0.8fr 0.6fr 0.6fr' : '1.5fr 0.8fr 0.6fr',
            gap: '0.25rem', padding: '0.45rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}>
            <div>
              <div style={{
                fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: 600, color: '#fff',
              }}>{item.name}</div>
              <div style={{
                fontFamily: pp, fontSize: '0.5rem', fontWeight: 400,
                color: 'rgba(255,255,255,0.15)',
              }}>{item.note}</div>
            </div>
            <div style={{
              fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: 500, color: 'rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center',
            }}>{item.portion}</div>
            <div style={{
              fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: 700, color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            }}>{item.kcal}</div>
            {activeTab === 'protein' && (
              <div style={{
                fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: 800, color: GOLD,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              }}>{item.protein}g</div>
            )}
          </div>
        ))}
      </div>

      {/* Tip */}
      <div style={{
        marginTop: isMobile ? '1rem' : '1.25rem',
        fontFamily: pp, fontSize: isMobile ? '0.62rem' : '0.68rem',
        fontWeight: 400, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5,
        textAlign: 'center',
      }}>
        {activeTab === 'volume'
          ? 'Combineer deze met eiwitrijke producten voor een vullende maaltijd met weinig calorieën'
          : 'Verdeel je eiwit over 3-4 maaltijden per dag voor het beste resultaat'
        }
      </div>
    </section>
  )
}
