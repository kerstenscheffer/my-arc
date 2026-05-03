// src/modules/shopping/tabs/components/ShoppingCategoryCard.jsx - V3 EDIT MODE
import React from 'react'
import { ChevronDown, CheckCircle2, Circle, Edit3, Check } from 'lucide-react'
import ShoppingItem from './ShoppingItem'
import EditableShoppingItem from './EditableShoppingItem'
import { CATEGORY_CONFIG } from '../../constants/shoppingConstants'

export default function ShoppingCategoryCard({ 
  category, 
  items, 
  checkedItems, 
  editedAmounts,
  deletedItems,
  expanded, 
  editMode,
  onToggle, 
  onCheckItem, 
  onCheckAll,
  onAmountChange,
  onDeleteItem,
  onToggleEditMode,
  service,
  isMobile,
  delay = 0,
  animate = true
}) {
  if (!items || items.length === 0) return null
  
  // Filter out deleted items
  const visibleItems = items.filter(item => !deletedItems?.includes(item.id))
  if (visibleItems.length === 0) return null
  
  // Get config from constants
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other

  const allChecked = visibleItems.every(item => checkedItems[item?.id])
  const someChecked = visibleItems.some(item => checkedItems[item?.id]) && !allChecked
  const checkedCount = visibleItems.filter(item => checkedItems[item?.id]).length
  
  // Calculate total cost with edited amounts
  const totalCost = visibleItems.reduce((sum, item) => {
    const amount = editedAmounts[item.id] !== undefined 
      ? editedAmounts[item.id] 
      : (item.displayAmount || item.totalAmount)
    const originalAmount = item.displayAmount || item.totalAmount
    const costPerUnit = (item.estimatedCost || 0) / originalAmount
    return sum + (amount * costPerUnit)
  }, 0)

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
      {/* Category Header */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: `2px solid ${config.color}33`,
          borderRadius: isMobile ? '12px' : '14px',
          padding: isMobile ? '0.75rem' : '0.875rem',
          boxShadow: `0 4px 16px ${config.color}33, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
          overflow: 'hidden'
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
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.75rem',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Icon bubble */}
          <div
            onClick={onToggle}
            style={{
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
              boxShadow: `0 4px 12px ${config.color}33`,
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {config.emoji}
          </div>

          {/* Category info */}
          <div 
            onClick={onToggle}
            style={{ 
              flex: 1, 
              minWidth: 0,
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
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
                {visibleItems.length}
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
                {checkedCount}/{visibleItems.length}
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

          {/* Edit mode toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleEditMode(category)
            }}
            style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '7px',
              background: editMode 
                ? config.gradient 
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${editMode ? config.color : 'rgba(255, 255, 255, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: editMode ? `0 0 12px ${config.color}66` : 'none',
              flexShrink: 0,
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {editMode ? (
              <Check size={isMobile ? 14 : 16} color="white" strokeWidth={2.5} />
            ) : (
              <Edit3 size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.5)" strokeWidth={2.5} />
            )}
          </button>

          {/* Check all button */}
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
              if (!isMobile) e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              if (!isMobile) e.currentTarget.style.transform = 'scale(1)'
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
            onClick={onToggle}
            size={isMobile ? 18 : 20}
            color="rgba(255, 255, 255, 0.5)"
            strokeWidth={2.5}
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          />
        </div>
      </div>

      {/* Items list */}
      {expanded && (
        <div style={{
          marginTop: isMobile ? '0.375rem' : '0.5rem',
          background: 'linear-gradient(135deg, rgba(11, 11, 11, 0.8) 0%, rgba(11, 11, 11, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.5rem' : '0.625rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          {visibleItems.map((item, index) => (
            editMode ? (
              <EditableShoppingItem
                key={item.id}
                item={item}
                checked={checkedItems[item.id]}
                editedAmount={editedAmounts[item.id]}
                onCheck={() => onCheckItem(item.id)}
                onAmountChange={onAmountChange}
                onDelete={onDeleteItem}
                color={config.color}
                gradient={config.gradient}
                isMobile={isMobile}
                delay={index * 0.02}
              />
            ) : (
              <ShoppingItem
                key={item.id}
                item={{
                  ...item,
                  displayAmount: editedAmounts[item.id] !== undefined 
                    ? editedAmounts[item.id] 
                    : item.displayAmount,
                  estimatedCost: editedAmounts[item.id] !== undefined
                    ? (editedAmounts[item.id] / (item.displayAmount || item.totalAmount)) * (item.estimatedCost || 0)
                    : item.estimatedCost
                }}
                checked={checkedItems[item.id]}
                onCheck={() => onCheckItem(item.id)}
                color={config.color}
                gradient={config.gradient}
                isMobile={isMobile}
                delay={index * 0.02}
              />
            )
          ))}
        </div>
      )}
    </div>
  )
}
