// src/modules/shopping/tabs/components/ShoppingCategoryCard.jsx - OPTIMIZED
import React from 'react'
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react'
import ShoppingItem from './ShoppingItem'

export default function ShoppingCategoryCard({ 
  category, 
  config, 
  items, 
  checkedItems, 
  expanded, 
  onToggle, 
  onCheckItem, 
  onCheckAll, 
  isMobile,
  delay,
  animate
}) {
  if (!items || items.length === 0) return null

  const allChecked = items.every(item => checkedItems[item?.id])
  const someChecked = items.some(item => checkedItems[item?.id]) && !allChecked
  const checkedCount = items.filter(item => checkedItems[item?.id]).length
  const totalCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)

  return (
    <div
      style={{
        marginBottom: isMobile ? '0.5rem' : '0.625rem',
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: `${delay}s`
      }}
    >
      {/* 🔥 COMPACT: Category Header - smaller padding */}
      <div
        onClick={onToggle}
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: `2px solid ${config.color}33`,
          borderRadius: isMobile ? '12px' : '14px',
          padding: isMobile ? '0.75rem' : '0.875rem',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          boxShadow: `0 4px 16px ${config.color}33, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = `0 8px 24px ${config.color}4D, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `0 4px 16px ${config.color}33, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
          }
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: config.gradient,
          opacity: 0.6,
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.75rem'
        }}>
          {/* 🔥 COMPACT: Smaller icon bubble */}
          <div style={{
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            borderRadius: '8px',
            background: `${config.color}26`,
            border: `1px solid ${config.color}4D`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            flexShrink: 0,
            boxShadow: `0 4px 12px ${config.color}33`
          }}>
            {config.emoji}
          </div>

          {/* Category info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginBottom: '0.125rem'
            }}>
              <span style={{
                color: 'white',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
              }}>
                {config.label}
              </span>
              <span style={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {items.length}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.625rem',
              flexWrap: 'wrap'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600'
              }}>
                {checkedCount}/{items.length}
              </span>
              <span style={{
                color: config.color,
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700'
              }}>
                €{totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* 🔥 COMPACT: Smaller check button */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              onCheckAll()
            }}
            style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '7px',
              background: allChecked 
                ? config.gradient 
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${allChecked ? config.color : 'rgba(255, 255, 255, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: allChecked ? `0 0 12px ${config.color}66` : 'none',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {allChecked ? (
              <CheckCircle2 size={isMobile ? 14 : 16} color="white" strokeWidth={2.5} />
            ) : someChecked ? (
              <Circle size={isMobile ? 14 : 16} color={config.color} strokeWidth={2.5} fill={config.color} fillOpacity={0.5} />
            ) : (
              <Circle size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.3)" strokeWidth={2} />
            )}
          </div>

          {/* Expand chevron */}
          <ChevronDown
            size={isMobile ? 18 : 20}
            color="rgba(255, 255, 255, 0.5)"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0
            }}
          />
        </div>
      </div>

      {/* 🔥 COMPACT: Items list - tighter spacing */}
      {expanded && (
        <div style={{
          marginTop: isMobile ? '0.375rem' : '0.5rem',
          background: 'linear-gradient(135deg, rgba(11, 11, 11, 0.8) 0%, rgba(11, 11, 11, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.375rem' : '0.5rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
        }}>
          {items.map((item, index) => (
            <ShoppingItem
              key={item.id}
              item={item}
              checked={checkedItems[item.id]}
              onCheck={() => onCheckItem(item.id)}
              color={config.color}
              gradient={config.gradient}
              isMobile={isMobile}
              delay={index * 0.02}
            />
          ))}
        </div>
      )}
    </div>
  )
}
