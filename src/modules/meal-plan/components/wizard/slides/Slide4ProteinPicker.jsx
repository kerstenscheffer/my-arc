// src/modules/meal-plan/components/wizard/slides/Slide4ProteinPicker.jsx
// Slide 4: Eiwit Bronnen Picker (3 selecties)

import { useState, useEffect } from 'react'
import CoachBubble from '../shared/CoachBubble'
import IngredientGrid from '../pickers/IngredientGrid'
import { COACH_PICKS } from '../utils/wizardData'

export default function Slide4ProteinPicker({ 
  db,
  selectedProteins = [],
  onProteinsSelect
}) {
  const isMobile = window.innerWidth <= 768
  const [allProteins, setAllProteins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Load protein ingredients from database
  useEffect(() => {
    loadProteins()
  }, [])
  
  const loadProteins = async () => {
    try {
      setLoading(true)
      
      // Get all ingredients with category = 'protein'
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('*')
        .eq('category', 'protein')
        .order('protein_per_100g', { ascending: false })
      
      if (error) throw error
      
      setAllProteins(data || [])
    } catch (err) {
      console.error('❌ Load proteins failed:', err)
      setError('Kon eiwitbronnen niet laden')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{
      width: '100%',
      padding: isMobile ? '1rem 0' : '1.5rem 0'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div style={{
          fontSize: isMobile ? '2.5rem' : '3rem',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          🥩
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.02em'
        }}>
          Eiwit Bronnen
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontWeight: '500'
        }}>
          Kies 3 eiwitbronnen die je dagelijks wilt eten
        </p>
      </div>
      
      {/* Coach Message */}
      <CoachBubble 
        message="Genoeg eiwitten eten is essentieel voor spiergroei én behoud. Door 3 vaste bronnen te kiezen die je dagelijks zou kunnen eten, maak je het jezelf super makkelijk om je eiwit target te halen. Ik gebruik zelf kipfilet, whey protein en eieren - maar kies wat JIJ lekker vindt!"
        variant="warning"
      />
      
      {/* Why Protein Info */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem',
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        borderRadius: isMobile ? '14px' : '16px'
      }}>
        <h3 style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '700',
          color: '#f97316',
          margin: '0 0 0.75rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>💪</span>
          Waarom 3 vaste eiwitbronnen?
        </h3>
        <ul style={{
          margin: 0,
          paddingLeft: isMobile ? '1.25rem' : '1.5rem',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.7'
        }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Consistentie:</strong> Je weet altijd wat je moet kopen
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Eenvoud:</strong> Geen dagelijkse beslissingen nodig
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Macro's halen:</strong> Makkelijker om je eiwit target te bereiken
          </li>
          <li>
            <strong>Meal prep:</strong> Je kunt in bulk koken en bewaren
          </li>
        </ul>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div style={{
          padding: isMobile ? '3rem 1rem' : '4rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: isMobile ? '48px' : '60px',
            height: isMobile ? '48px' : '60px',
            border: '3px solid rgba(249, 115, 22, 0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}>
            Laden van eiwitbronnen...
          </p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div style={{
          padding: isMobile ? '2rem 1rem' : '3rem 2rem',
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: isMobile ? '14px' : '16px'
        }}>
          <div style={{
            fontSize: isMobile ? '2.5rem' : '3rem',
            marginBottom: '1rem'
          }}>
            ⚠️
          </div>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: '#ef4444',
            margin: '0 0 0.5rem 0'
          }}>
            Er ging iets mis
          </h3>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: '0 0 1rem 0'
          }}>
            {error}
          </p>
          <button
            onClick={loadProteins}
            style={{
              padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: isMobile ? '10px' : '12px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              
              // Touch optimization
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            Opnieuw proberen
          </button>
        </div>
      )}
      
      {/* Ingredient Grid */}
      {!loading && !error && allProteins.length > 0 && (
        <IngredientGrid
          ingredients={allProteins}
          selected={selectedProteins}
          onSelect={onProteinsSelect}
          maxSelect={3}
          coachPicks={COACH_PICKS.proteins}
          category="protein"
        />
      )}
      
      {/* Empty State */}
      {!loading && !error && allProteins.length === 0 && (
        <div style={{
          padding: isMobile ? '3rem 1rem' : '4rem 2rem',
          textAlign: 'center',
          background: 'rgba(17, 17, 17, 0.4)',
          borderRadius: isMobile ? '14px' : '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: isMobile ? '3rem' : '4rem',
            marginBottom: '1rem'
          }}>
            🍖
          </div>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: '#fff',
            margin: '0 0 0.5rem 0'
          }}>
            Geen eiwitbronnen gevonden
          </h3>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0
          }}>
            Er zijn momenteel geen eiwitbronnen beschikbaar
          </p>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
