// src/modules/lead-management/components/kanban/KanbanHeader.jsx
// VERSION 1.0 - Header component with Search, View Toggle, Actions
// Golden Theme

import { useState, useRef, useEffect } from 'react'
import { 
  Search, X, Users, Instagram, Plus, Maximize2, Clock, ArrowUp 
} from 'lucide-react'

// Golden Theme
const GOLD = {
  primary: '#D4AF37',
  light: '#FFD700',
  dark: '#B8860B',
  border: 'rgba(212, 175, 55, 0.3)',
  borderActive: 'rgba(212, 175, 55, 0.5)',
  bg: 'rgba(212, 175, 55, 0.08)'
}

export default function KanbanHeader({
  isMobile,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  searchResults = [],
  showSearchResults,
  onSearchResultClick,
  onCloseSearchResults,
  staleCheckResult,
  onDismissStaleResult,
  onNewSection,
  onFullscreen
}) {
  const searchInputRef = useRef(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
      {/* VIEW MODE TOGGLE */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        padding: '0.5rem', 
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(15, 15, 15, 0.9) 100%)', 
        borderRadius: '12px', 
        border: `1px solid ${GOLD.border}` 
      }}>
        <button 
          onClick={() => onViewModeChange('leads')} 
          style={{ 
            flex: 1, 
            padding: isMobile ? '0.75rem' : '0.875rem', 
            background: viewMode === 'leads' 
              ? `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.dark} 100%)` 
              : 'transparent', 
            border: viewMode === 'leads' ? 'none' : `1px solid ${GOLD.border}`, 
            borderRadius: '10px', 
            color: viewMode === 'leads' ? '#000' : 'rgba(255,255,255,0.7)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem', 
            fontSize: isMobile ? '0.85rem' : '0.95rem', 
            fontWeight: '600', 
            minHeight: '48px', 
            boxShadow: viewMode === 'leads' ? `0 4px 12px ${GOLD.border}` : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          <Users size={isMobile ? 16 : 18} /> Leads
        </button>
        <button 
          onClick={() => onViewModeChange('warmup')} 
          style={{ 
            flex: 1, 
            padding: isMobile ? '0.75rem' : '0.875rem', 
            background: viewMode === 'warmup' 
              ? 'linear-gradient(135deg, #E1306C 0%, #C13584 100%)' 
              : 'transparent', 
            border: viewMode === 'warmup' ? 'none' : '1px solid rgba(255,255,255,0.2)', 
            borderRadius: '10px', 
            color: viewMode === 'warmup' ? '#fff' : 'rgba(255,255,255,0.7)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem', 
            fontSize: isMobile ? '0.85rem' : '0.95rem', 
            fontWeight: '600', 
            minHeight: '48px', 
            boxShadow: viewMode === 'warmup' ? '0 4px 12px rgba(225, 48, 108, 0.3)' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          <Instagram size={isMobile ? 16 : 18} /> Warm-Up
        </button>
      </div>

      {/* STALE CHECK NOTIFICATION */}
      {staleCheckResult && staleCheckResult.moved > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '0.75rem 1rem', 
          background: `linear-gradient(135deg, ${GOLD.bg} 0%, rgba(0,0,0,0) 100%)`, 
          border: `1px solid ${GOLD.border}`, 
          borderRadius: '10px' 
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: GOLD.bg, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0 
          }}>
            <Clock size={18} color={GOLD.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: GOLD.primary, fontWeight: '600', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
              {staleCheckResult.moved} lead{staleCheckResult.moved !== 1 ? 's' : ''} automatisch verplaatst
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: isMobile ? '0.75rem' : '0.8rem' }}>
              Deze leads hadden geen activiteit.
            </div>
          </div>
          <button 
            onClick={onDismissStaleResult} 
            style={{ 
              padding: '0.4rem', 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              borderRadius: '6px', 
              color: 'rgba(255, 255, 255, 0.6)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minWidth: '32px', 
              minHeight: '32px' 
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div style={{ position: 'relative', zIndex: 100 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '0.75rem 1rem', 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: showSearchResults && searchResults.length > 0 
            ? `1px solid ${GOLD.borderActive}` 
            : `1px solid ${GOLD.border}`, 
          borderRadius: '12px', 
          transition: 'all 0.2s ease' 
        }}>
          <Search size={20} color={searchQuery ? GOLD.primary : 'rgba(255,255,255,0.5)'} />
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)} 
            placeholder="🔍 Zoek lead op naam, Instagram, email..." 
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              outline: 'none', 
              color: '#fff', 
              fontSize: isMobile ? '0.9rem' : '1rem', 
              minHeight: '28px' 
            }} 
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')} 
              style={{ 
                padding: '0.25rem', 
                background: 'rgba(255,255,255,0.1)', 
                border: 'none', 
                borderRadius: '6px', 
                color: 'rgba(255,255,255,0.7)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center' 
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            marginTop: '0.5rem', 
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)', 
            border: `1px solid ${GOLD.border}`, 
            borderRadius: '12px', 
            overflow: 'hidden', 
            zIndex: 1000, 
            boxShadow: `0 10px 40px rgba(0, 0, 0, 0.5), ${GOLD.border} 0 0 20px`, 
            maxHeight: '400px', 
            overflowY: 'auto' 
          }}>
            <div style={{ 
              padding: '0.75rem 1rem', 
              borderBottom: `1px solid ${GOLD.border}`, 
              fontSize: '0.75rem', 
              color: GOLD.primary, 
              textTransform: 'uppercase', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <Search size={14} />
              {searchResults.length} resultaten gevonden
            </div>
            {searchResults.map(lead => (
              <button 
                key={lead.id} 
                onClick={() => onSearchResultClick(lead.id, lead.sectionId)} 
                style={{ 
                  width: '100%', 
                  padding: '0.875rem 1rem', 
                  background: 'transparent', 
                  border: 'none', 
                  borderBottom: `1px solid ${GOLD.border}20`, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '1rem', 
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.background = GOLD.bg} 
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    {lead.first_name} {lead.last_name}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {lead.instagram_handle && (
                      <span style={{ fontSize: '0.75rem', color: '#E1306C' }}>
                        @{lead.instagram_handle}
                      </span>
                    )}
                    {lead.email && (
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        {lead.email}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ 
                  padding: '0.25rem 0.6rem', 
                  background: `${lead.sectionColor}25`, 
                  border: `1px solid ${lead.sectionColor}50`, 
                  borderRadius: '6px', 
                  fontSize: '0.7rem', 
                  fontWeight: '600', 
                  color: lead.sectionColor, 
                  whiteSpace: 'nowrap' 
                }}>
                  {lead.sectionTitle?.substring(0, 15)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showSearchResults && searchQuery && searchResults.length === 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            marginTop: '0.5rem', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)', 
            border: `1px solid ${GOLD.border}`, 
            borderRadius: '12px', 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.5)', 
            zIndex: 1000 
          }}>
            😕 Geen leads gevonden voor "{searchQuery}"
          </div>
        )}
      </div>

      {/* TITLE + ACTION BUTTONS */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem' 
      }}>
        <div>
          <h2 style={{ 
            fontSize: isMobile ? '1.25rem' : '1.5rem', 
            fontWeight: '700', 
            color: '#fff', 
            margin: 0,
            background: `linear-gradient(135deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Lead Board
          </h2>
          <p style={{ 
            fontSize: '0.8rem', 
            color: 'rgba(255,255,255,0.5)', 
            margin: '0.25rem 0 0 0' 
          }}>
            Sleep via ⋮⋮ om secties te herordenen
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={onFullscreen} 
            style={{ 
              padding: isMobile ? '0.6rem' : '0.75rem 1rem', 
              background: `linear-gradient(135deg, ${GOLD.bg} 0%, rgba(0,0,0,0) 100%)`, 
              border: `1px solid ${GOLD.border}`, 
              borderRadius: '10px', 
              color: GOLD.primary, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: isMobile ? '0.85rem' : '0.9rem', 
              fontWeight: '600', 
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            <Maximize2 size={isMobile ? 16 : 18} />
            {!isMobile && 'Fullscreen'}
          </button>
          <button 
            onClick={onNewSection} 
            style={{ 
              padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.25rem', 
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.dark} 100%)`, 
              border: 'none', 
              borderRadius: '10px', 
              color: '#000', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: isMobile ? '0.85rem' : '0.9rem', 
              fontWeight: '600', 
              minHeight: '44px',
              boxShadow: `0 4px 12px ${GOLD.border}`,
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={isMobile ? 16 : 18} /> Nieuwe Sectie
          </button>
        </div>
      </div>
    </div>
  )
}
