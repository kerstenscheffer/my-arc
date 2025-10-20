// src/modules/ai-meal-generator/tabs/meal-selector/SearchBar.jsx
import { Search, X } from 'lucide-react'

export default function SearchBar({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Zoeken...",
  activeColor = '#10b981',
  isMobile 
}) {
  const handleClear = () => {
    setSearchTerm('')
  }
  
  return (
    <div style={{ 
      position: 'relative',
      width: '100%'
    }}>
      {/* Search Icon */}
      <Search 
        size={18} 
        style={{
          position: 'absolute',
          left: isMobile ? '0.75rem' : '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: searchTerm ? activeColor : 'rgba(255,255,255,0.3)',
          transition: 'color 0.3s ease',
          pointerEvents: 'none'
        }} 
      />
      
      {/* Input Field */}
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: isMobile ? '0.75rem 2.5rem' : '0.875rem 3rem',
          paddingRight: searchTerm ? (isMobile ? '2.5rem' : '3rem') : (isMobile ? '0.75rem' : '1rem'),
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: `1px solid ${searchTerm ? `${activeColor}40` : 'rgba(255,255,255,0.1)'}`,
          borderRadius: isMobile ? '10px' : '12px',
          color: '#fff',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '400',
          outline: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '44px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onFocus={(e) => {
          e.target.style.border = `1px solid ${activeColor}60`
          e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
          e.target.style.boxShadow = `0 0 0 3px ${activeColor}15`
        }}
        onBlur={(e) => {
          e.target.style.border = `1px solid ${searchTerm ? `${activeColor}40` : 'rgba(255,255,255,0.1)'}`
          e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          e.target.style.boxShadow = 'none'
        }}
      />
      
      {/* Clear Button */}
      {searchTerm && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: isMobile ? '0.75rem' : '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '0.25rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: 'none',
            borderRadius: '50%',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            minHeight: '24px',
            minWidth: '24px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }
          }}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
      
      {/* Active indicator bar */}
      {searchTerm && (
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50%',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)`,
          borderRadius: '1px',
          animation: 'pulseWidth 2s ease infinite'
        }} />
      )}
      
      {/* CSS for animation */}
      <style>{`
        @keyframes pulseWidth {
          0%, 100% { width: 30%; opacity: 0.5; }
          50% { width: 60%; opacity: 1; }
        }
        
        input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        
        input::-webkit-search-decoration,
        input::-webkit-search-cancel-button,
        input::-webkit-search-results-button,
        input::-webkit-search-results-decoration {
          display: none;
        }
      `}</style>
    </div>
  )
}
