// src/modules/videos/video-tab-components/VideoSearchFilters.jsx
// v2.0 — Custom categorie filter + page filter + search, brand styling
import React from 'react'
import {
  Search, X, FolderOpen,
  Home, Dumbbell, Utensils, ShoppingCart, Camera, Phone, User, Globe
} from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'

const GOLD = '#FFD700'

// Page keys matchen ClientDashboard
const PAGES = [
  { value: 'all',          label: 'Alle pagina\'s', icon: Globe },
  { value: 'home',         label: 'Home',           icon: Home },
  { value: 'workout',      label: 'Workout',        icon: Dumbbell },
  { value: 'meal',         label: 'Meal',           icon: Utensils },
  { value: 'boodschappen', label: 'Boodschappen',   icon: ShoppingCart },
  { value: 'tracking',     label: 'Tracking',       icon: Camera },
  { value: 'calls',        label: 'Calls',          icon: Phone },
  { value: 'profile',      label: 'Profile',        icon: User }
]

export default function VideoSearchFilters({
  // Search
  searchQuery,
  setSearchQuery,
  // Custom categories
  customCategories = [],
  selectedCategoryId = 'all',
  setSelectedCategoryId = () => {},
  // Page filter
  selectedPage = 'all',
  setSelectedPage = () => {},
  // Legacy (kept for compat with old CoachVideoTab; ignored in new flow)
  selectedCategory,
  setSelectedCategory,
  categories
}) {
  const isMobile = useIsMobile()

  const labelStyle = {
    fontSize: '0.4rem',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem'
  }

  const pillStyle = (isActive, accentColor = GOLD) => ({
    padding: '0.35rem 0.7rem',
    background: isActive ? accentColor : 'transparent',
    border: isActive
      ? `1px solid ${accentColor}`
      : '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    color: isActive ? '#000' : 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.62rem',
    fontWeight: '800',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    minHeight: '30px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    transition: 'all 0.15s ease'
  })

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '1rem',
      transform: 'translateZ(0)'
    }}>
      {/* ── ROW 1: SEARCH ── */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        position: 'relative'
      }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: isMobile ? '1.25rem' : '1.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.25)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder="Zoek videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.625rem 0.5rem 2.25rem',
            background: '#000',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '600',
            outline: 'none',
            minHeight: '36px'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: isMobile ? '1rem' : '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '22px',
              height: '22px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── ROW 2: CATEGORIE FILTER ── */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={labelStyle}>
          <FolderOpen size={9} />
          Categorie
        </div>
        <div
          className="vsf-pills"
          style={{
            display: 'flex',
            gap: '0.3rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}
        >
          {/* Alle */}
          <button
            onClick={() => setSelectedCategoryId('all')}
            style={pillStyle(selectedCategoryId === 'all')}
          >
            Alle
          </button>

          {/* Custom categories */}
          {customCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              style={pillStyle(selectedCategoryId === cat.id, cat.color || GOLD)}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: selectedCategoryId === cat.id ? '#000' : (cat.color || GOLD)
              }} />
              {cat.name}
            </button>
          ))}

          {/* Zonder categorie */}
          <button
            onClick={() => setSelectedCategoryId('uncategorized')}
            style={pillStyle(selectedCategoryId === 'uncategorized', 'rgba(255,255,255,0.4)')}
          >
            Zonder categorie
          </button>
        </div>

        {customCategories.length === 0 && (
          <div style={{
            marginTop: '0.4rem',
            fontSize: '0.6rem',
            color: 'rgba(255, 255, 255, 0.3)',
            fontStyle: 'italic'
          }}>
            Tip: maak categorieën aan via de "Categorieën" knop bovenaan
          </div>
        )}
      </div>

      {/* ── ROW 3: PAGE FILTER ── */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem'
      }}>
        <div style={labelStyle}>
          <Globe size={9} />
          Standaard op pagina
        </div>
        <div
          className="vsf-pills"
          style={{
            display: 'flex',
            gap: '0.3rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}
        >
          {PAGES.map(page => {
            const Icon = page.icon
            const isActive = selectedPage === page.value
            return (
              <button
                key={page.value}
                onClick={() => setSelectedPage(page.value)}
                style={pillStyle(isActive)}
              >
                <Icon size={11} />
                {page.label}
              </button>
            )
          })}
        </div>
      </div>

      <style>{`.vsf-pills::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
