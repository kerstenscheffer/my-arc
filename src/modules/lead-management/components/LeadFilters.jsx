import { useState } from 'react'
import { Search, Filter, X, Calendar, Users, Tag, TrendingUp } from 'lucide-react'

export default function LeadFilters({ 
  filters, 
  stats,
  onFilterChange, 
  onSearch, 
  isMobile 
}) {
  const [showFilters, setShowFilters] = useState(!isMobile)
  const [searchValue, setSearchValue] = useState(filters.search || '')

  // Quick filter buttons
  const quickFilters = [
    { 
      id: 'all', 
      label: 'Alles', 
      count: stats.total_leads,
      icon: Users,
      color: '#3b82f6'
    },
    { 
      id: 'new', 
      label: 'Nieuw', 
      count: stats.new_leads,
      icon: TrendingUp,
      color: '#3b82f6'
    },
    { 
      id: 'contacted', 
      label: 'Benaderd', 
      count: stats.contacted_leads,
      icon: Tag,
      color: '#f97316'
    },
    { 
      id: 'scheduled', 
      label: 'Gepland', 
      count: stats.scheduled_leads,
      icon: Calendar,
      color: '#8b5cf6'
    },
    { 
      id: 'converted', 
      label: 'Geconverteerd', 
      count: stats.converted_leads,
      icon: Users,
      color: '#10b981'
    }
  ]

  const handleSearch = (value) => {
    setSearchValue(value)
    // Debounce search
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      onSearch(value)
    }, 300)
  }

  const handleQuickFilter = (statusId) => {
    onFilterChange({ 
      status: statusId === 'all' ? 'all' : statusId,
      search: '' // Clear search when using quick filter
    })
    setSearchValue('')
  }

  const activeFiltersCount = [
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.dateRange !== 'month',
    filters.source !== 'all',
    filters.search
  ].filter(Boolean).length

  return (
    <div style={{
      marginBottom: isMobile ? '1.5rem' : '2rem'
    }}>
      {/* Quick Filters Row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1rem',
        overflowX: isMobile ? 'auto' : 'visible',
        paddingBottom: isMobile ? '0.5rem' : '0',
        scrollbarWidth: 'thin'
      }}>
        {quickFilters.map((filter) => {
          const isActive = filters.status === filter.id || (filter.id === 'all' && filters.status === 'all')
          
          return (
            <button
              key={filter.id}
              onClick={() => handleQuickFilter(filter.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                background: isActive
                  ? `linear-gradient(135deg, ${filter.color}15 0%, ${filter.color}08 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                border: isActive
                  ? `1px solid ${filter.color}40`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: isActive ? filter.color : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isMobile) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isMobile) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile && !isActive) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <filter.icon size={isMobile ? 16 : 18} />
              <span>{filter.label}</span>
              <span style={{
                padding: '0.2rem 0.5rem',
                background: isActive 
                  ? `${filter.color}20`
                  : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                minWidth: '24px',
                textAlign: 'center'
              }}>
                {filter.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + Advanced Filters Row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* Search Bar */}
        <div style={{
          flex: 1,
          width: isMobile ? '100%' : 'auto',
          position: 'relative'
        }}>
          <Search 
            size={18} 
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.4)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Zoek op naam, email of telefoon..."
            style={{
              width: '100%',
              padding: isMobile ? '0.875rem 1rem 0.875rem 3rem' : '1rem 1.25rem 1rem 3.25rem',
              background: 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)'
              e.currentTarget.style.background = 'rgba(17, 17, 17, 0.8)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.background = 'rgba(17, 17, 17, 0.5)'
            }}
          />
          {searchValue && (
            <button
              onClick={() => handleSearch('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button (Mobile) */}
        {isMobile && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: showFilters 
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(255, 255, 255, 0.05)',
              border: showFilters
                ? '1px solid rgba(59, 130, 246, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: showFilters ? '#3b82f6' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <Filter size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span style={{
                padding: '0.2rem 0.5rem',
                background: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Advanced Filters (Collapsible on Mobile) */}
      {showFilters && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginTop: '1rem',
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(17, 17, 17, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          animation: 'slideDown 0.3s ease'
        }}>
          {/* Status Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <option value="all">Alle statussen</option>
              <option value="new">Nieuw</option>
              <option value="contacted">Benaderd</option>
              <option value="scheduled">Gepland</option>
              <option value="converted">Geconverteerd</option>
              <option value="closed">Gesloten</option>
              <option value="unqualified">Niet gekwalificeerd</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Prioriteit
            </label>
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange({ priority: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <option value="all">Alle prioriteiten</option>
              <option value="high">🔴 Hoog</option>
              <option value="medium">🟠 Gemiddeld</option>
              <option value="low">⚪ Laag</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Periode
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => onFilterChange({ dateRange: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <option value="today">Vandaag</option>
              <option value="week">Deze week</option>
              <option value="month">Deze maand</option>
              <option value="quarter">Dit kwartaal</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Bron
            </label>
            <select
              value={filters.source}
              onChange={(e) => onFilterChange({ source: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <option value="all">Alle bronnen</option>
              <option value="website">Website</option>
              <option value="referral">Verwijzing</option>
              <option value="social">Social Media</option>
              <option value="advertisement">Advertentie</option>
              <option value="other">Overig</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            Actieve filters:
          </span>
          
          {filters.status !== 'all' && (
            <button
              onClick={() => onFilterChange({ status: 'all' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#3b82f6',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
              }}
            >
              <span>Status: {filters.status}</span>
              <X size={12} />
            </button>
          )}

          {filters.priority !== 'all' && (
            <button
              onClick={() => onFilterChange({ priority: 'all' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '8px',
                color: '#f97316',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
              }}
            >
              <span>Prioriteit: {filters.priority}</span>
              <X size={12} />
            </button>
          )}

          <button
            onClick={() => onFilterChange({ 
              status: 'all', 
              priority: 'all', 
              dateRange: 'month',
              source: 'all'
            })}
            style={{
              padding: '0.4rem 0.65rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          >
            Reset alle filters
          </button>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom scrollbar for quick filters */
        div::-webkit-scrollbar {
          height: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          borderRadius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          borderRadius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        /* Select dropdown styling */
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.5)' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }

        select option {
          background: #111;
          color: #fff;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  )
}
