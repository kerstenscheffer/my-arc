// src/modules/shopping/tabs/components/CompactShoppingCategory.jsx - V5 FULL WIDTH
import React from 'react'
import { CheckCircle2, Circle, Edit3, Check } from 'lucide-react'
import ShoppingItem from './ShoppingItem'
import EditableShoppingItem from './EditableShoppingItem'
import { CATEGORY_CONFIG } from '../../constants/shoppingConstants'

const CATEGORY_IMAGES = {
  protein: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=200&fit=crop&crop=center',
  carbs: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=200&fit=crop&crop=center',
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=200&fit=crop&crop=center',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&h=200&fit=crop&crop=center',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&h=200&fit=crop&crop=center',
  fats: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&h=200&fit=crop&crop=center',
  sauces: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&h=200&fit=crop&crop=center',
  other: null
}

export default function CompactShoppingCategory({ 
  category, 
  items, 
  checkedItems, 
  editedAmounts,
  deletedItems,
  editMode,
  onCheckItem, 
  onCheckAll,
  onAmountChange,
  onDeleteItem,
  onToggleEditMode,
  service,
  isMobile,
  delay = 0
}) {
  if (!items || items.length === 0) return null
  
  const visibleItems = items.filter(item => !deletedItems?.includes(item.id))
  if (visibleItems.length === 0) return null
  
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
  const allChecked = visibleItems.every(item => checkedItems[item?.id])
  const someChecked = visibleItems.some(item => checkedItems[item?.id]) && !allChecked
  const checkedCount = visibleItems.filter(item => checkedItems[item?.id]).length
  
  const totalCost = visibleItems.reduce((sum, item) => {
    const amount = editedAmounts[item.id] !== undefined 
      ? editedAmounts[item.id] 
      : (item.displayAmount || item.totalAmount)
    const originalAmount = item.displayAmount || item.totalAmount
    const costPerUnit = (item.estimatedCost || 0) / originalAmount
    return sum + (amount * costPerUnit)
  }, 0)

  const heroImage = CATEGORY_IMAGES[category]

  return (
    <div style={{
      marginTop: '0.5rem',
      background: '#0a0a0a',
      border: 'none',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '0',
      overflow: 'hidden',
      transform: 'translateZ(0)'
    }}>
      {/* HERO IMAGE + CATEGORY OVERLAY */}
      {heroImage ? (
        <div style={{
          position: 'relative',
          height: isMobile ? '72px' : '88px',
          overflow: 'hidden'
        }}>
          <img
            src={heroImage}
            alt={config.label}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '100%',
            background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.1) 0%, rgba(10, 10, 10, 0.4) 40%, rgba(10, 10, 10, 0.85) 75%, #0a0a0a 100%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: isMobile ? '0 0.75rem 0.5rem' : '0 1rem 0.625rem',
            display: 'flex',
            alignItems: 'flex-end',
            gap: isMobile ? '0.375rem' : '0.5rem'
          }}>
            <div style={{
              width: '3px', height: '20px', borderRadius: '2px',
              background: config.color, opacity: 0.8, flexShrink: 0, marginBottom: '2px'
            }} />

            <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', flexShrink: 0 }}>
              {config.emoji}
            </span>
            <span style={{
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '700',
              flex: 1,
              minWidth: 0,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)'
            }}>
              {config.label}
            </span>

            <span style={{
              fontSize: isMobile ? '0.5rem' : '0.55rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600'
            }}>
              {checkedCount}/{visibleItems.length}
            </span>

            <span style={{
              fontSize: isMobile ? '0.55rem' : '0.6rem',
              color: config.color,
              fontWeight: '800'
            }}>
              €{totalCost.toFixed(0)}
            </span>

            <button
              onClick={() => onToggleEditMode(category)}
              style={{
                width: '26px', height: '26px', borderRadius: '4px',
                background: editMode ? `${config.color}25` : 'rgba(0, 0, 0, 0.4)',
                border: editMode ? `1px solid ${config.color}50` : '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease', flexShrink: 0, outline: 'none',
                color: editMode ? config.color : 'rgba(255, 255, 255, 0.5)'
              }}
            >
              {editMode ? <Check size={12} strokeWidth={2.5} /> : <Edit3 size={12} strokeWidth={2} />}
            </button>

            <div
              onClick={onCheckAll}
              style={{
                width: '26px', height: '26px', borderRadius: '4px',
                background: allChecked ? `${config.color}25` : 'rgba(0, 0, 0, 0.4)',
                border: allChecked ? `1px solid ${config.color}50` : '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease', flexShrink: 0
              }}
            >
              {allChecked ? (
                <CheckCircle2 size={12} color={config.color} strokeWidth={2.5} />
              ) : someChecked ? (
                <Circle size={12} color={config.color} strokeWidth={2.5} fill={config.color} fillOpacity={0.3} />
              ) : (
                <Circle size={12} color="rgba(255, 255, 255, 0.4)" strokeWidth={2} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: isMobile ? '0.375rem' : '0.5rem',
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <div style={{ width: '3px', height: '24px', borderRadius: '2px', background: config.color, opacity: 0.6, flexShrink: 0 }} />
          <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', flexShrink: 0 }}>{config.emoji}</span>
          <span style={{ color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '700', flex: 1, minWidth: 0 }}>{config.label}</span>
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255, 255, 255, 0.25)', fontWeight: '600' }}>{checkedCount}/{visibleItems.length}</span>
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: config.color, fontWeight: '800' }}>€{totalCost.toFixed(0)}</span>
          <button onClick={() => onToggleEditMode(category)} style={{
            width: '28px', height: '28px', borderRadius: '4px',
            background: editMode ? `${config.color}18` : 'transparent',
            border: editMode ? `1px solid ${config.color}40` : '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s ease', flexShrink: 0, outline: 'none',
            color: editMode ? config.color : 'rgba(255, 255, 255, 0.3)'
          }}>
            {editMode ? <Check size={13} strokeWidth={2.5} /> : <Edit3 size={13} strokeWidth={2} />}
          </button>
          <div onClick={onCheckAll} style={{
            width: '28px', height: '28px', borderRadius: '4px',
            background: allChecked ? `${config.color}18` : 'transparent',
            border: allChecked ? `1px solid ${config.color}40` : '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s ease', flexShrink: 0
          }}>
            {allChecked ? <CheckCircle2 size={13} color={config.color} strokeWidth={2.5} />
              : someChecked ? <Circle size={13} color={config.color} strokeWidth={2.5} fill={config.color} fillOpacity={0.3} />
              : <Circle size={13} color="rgba(255, 255, 255, 0.2)" strokeWidth={2} />}
          </div>
        </div>
      )}

      {/* ITEMS */}
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          style={{
            padding: isMobile ? '0 0.75rem' : '0 1rem',
            borderBottom: index < visibleItems.length - 1 
              ? '1px solid rgba(255, 255, 255, 0.03)' 
              : 'none'
          }}
        >
          {editMode ? (
            <EditableShoppingItem
              item={item}
              checked={checkedItems[item.id]}
              editedAmount={editedAmounts[item.id]}
              onCheck={() => onCheckItem(item.id)}
              onAmountChange={onAmountChange}
              onDelete={onDeleteItem}
              color={config.color}
              gradient={config.gradient}
              isMobile={isMobile}
            />
          ) : (
            <ShoppingItem
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
              isMobile={isMobile}
            />
          )}
        </div>
      ))}
    </div>
  )
}
