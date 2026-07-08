// src/modules/output-planning/components/week-planning/content-block/ContentBlock.jsx
// Main ContentBlock component - UPDATED with batch item support
// 
// Collapsed: 24px height, title visible
// Expanded: Full details, z-index 100 (above other cards)
// SUPPORTS: Regular items, Stories, AND Batch Items
// FIXED: Check status field for batch item completion

import { useState } from 'react'
import { CONTENT_COLORS, PHASES } from '../constants'
import { getItemColor, getFormatIcon, POST_FORMATS } from '../../../../content-batches/constants'
import CollapsedCard from './CollapsedCard'
import ExpandedCard from './ExpandedCard'
import { useEffect } from 'react'

export default function ContentBlock({
  item,
  contentPiece,
  isBatchItem = false,
  multiSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onToggleComplete,
  onDelete,
  onDeleteRecurringTemplate,
  onViewScript,
  onMoveToNextWeek,
  onMoveToPrevWeek,
  onUnschedule,
  onOpenCaption,
  onViewBatchItem,
  onEditBatchItem,
  isDragging = false,
  isMobile = false
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  // ============================================
  // COLOR & ICON DETECTION
  // ============================================
  
  let color
  let formatIcon = null
  let isStory = false
  
  if (isBatchItem) {
    // BATCH ITEM: Use getItemColor from batch constants
    const colorHex = getItemColor(item.post_format, item.content_type)
    
    // Convert hex color to color object format
    color = {
      primary: colorHex,
      bg: `${colorHex}15`,
      border: `${colorHex}40`
    }
    
    formatIcon = getFormatIcon(item.post_format)
    isStory = item.content_type === 'story'
  } else {
    // REGULAR ITEM: Story detection logic
    isStory = !contentPiece && (
      item?.title?.toLowerCase().includes('workout') ||
      item?.title?.toLowerCase().includes('meal') ||
      item?.title?.toLowerCase().includes('story') ||
      item?.title?.toLowerCase().includes('interactie') ||
      item?.description?.includes('story') ||
      item?.description?.includes('foto_muziek') ||
      item?.description?.includes('canva') ||
      item?.description?.includes('workout_video') ||
      item?.description?.includes('praat_video')
    )
    
    color = isStory 
      ? CONTENT_COLORS.pink
      : CONTENT_COLORS[contentPiece?.color || item?.color || 'blue']
  }
  
  const phase = PHASES[item?.phase || 'post']
  
  // FIXED: Check status field for batch items, completed field for regular items
  const isCompleted = isBatchItem 
    ? (item?.status === 'posted' || item?.status === 'completed')
    : item?.completed

  return (
    <div
      draggable={!isExpanded}
      onDragStart={(e) => {
        if (isExpanded) {
          e.preventDefault()
          return
        }
        e.dataTransfer.setData('itemId', item.id)
        e.dataTransfer.setData('phase', item.phase || 'post')
        if (item.content_piece_id) {
          e.dataTransfer.setData('contentPieceId', item.content_piece_id)
        }
        if (isBatchItem) {
          e.dataTransfer.setData('isBatchItem', 'true')
        }
        e.dataTransfer.effectAllowed = 'move'
      }}
      style={{
        position: 'relative',
        zIndex: isExpanded ? 100 : 10,
        opacity: isDragging ? 0.5 : 1,
        transition: 'z-index 0s, opacity 0.15s ease'
      }}
    >
      {isExpanded ? (
        <ExpandedCard
          item={item}
          contentPiece={contentPiece}
          isBatchItem={isBatchItem}
          multiSelectMode={multiSelectMode}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          color={color}
          phase={phase}
          isCompleted={isCompleted}
          isStory={isStory}
          formatIcon={formatIcon}
          onCollapse={() => setIsExpanded(false)}
          onToggleComplete={onToggleComplete}
          onViewScript={onViewScript}
          onMoveToNextWeek={onMoveToNextWeek}
          onMoveToPrevWeek={onMoveToPrevWeek}
          onUnschedule={onUnschedule}
          onDelete={onDelete}
          onOpenCaption={onOpenCaption}
          onDeleteRecurringTemplate={onDeleteRecurringTemplate}
          onViewBatchItem={onViewBatchItem}
          onEditBatchItem={onEditBatchItem}
          isMobile={isMobile}
        />
      ) : (
        <CollapsedCard
          item={item}
          contentPiece={contentPiece}
          isBatchItem={isBatchItem}
          multiSelectMode={multiSelectMode}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          color={color}
          phase={phase}
          isCompleted={isCompleted}
          isStory={isStory}
          formatIcon={formatIcon}
          onExpand={() => setIsExpanded(true)}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// ============================================
// COMPACT VERSION - For sidebar/lists
// ============================================

export function ContentBlockCompact({
  item,
  contentPiece,
  isBatchItem = false,
  multiSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onToggleComplete,
  onDelete,
  onDeleteRecurringTemplate,
  onViewScript,
  onMoveToNextWeek,
  onMoveToPrevWeek,
  onUnschedule,
  onOpenCaption,
  onViewBatchItem,
  onEditBatchItem,
  isMobile = false
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  // ============================================
  // COLOR & ICON DETECTION
  // ============================================
  
  let color
  let formatIcon = null
  let isStory = false
  
  if (isBatchItem) {
    const colorHex = getItemColor(item.post_format, item.content_type)
    
    // Convert hex color to color object format
    color = {
      primary: colorHex,
      bg: `${colorHex}15`,
      border: `${colorHex}40`
    }
    
    formatIcon = getFormatIcon(item.post_format)
    isStory = item.content_type === 'story'
  } else {
    isStory = !contentPiece && (
      item?.title?.toLowerCase().includes('workout') ||
      item?.title?.toLowerCase().includes('meal') ||
      item?.title?.toLowerCase().includes('story') ||
      item?.title?.toLowerCase().includes('interactie') ||
      item?.description?.includes('story') ||
      item?.description?.includes('foto_muziek') ||
      item?.description?.includes('canva') ||
      item?.description?.includes('workout_video') ||
      item?.description?.includes('praat_video')
    )
    
    color = isStory 
      ? CONTENT_COLORS.pink
      : CONTENT_COLORS[contentPiece?.color || item?.color || 'blue']
  }
  
  const phase = PHASES[item?.phase || 'post']
  
  // FIXED: Check status field for batch items, completed field for regular items
  const isCompleted = isBatchItem 
    ? (item?.status === 'posted' || item?.status === 'completed')
    : item?.completed

  return (
    <div
      draggable={!isExpanded}
      onDragStart={(e) => {
        if (isExpanded) {
          e.preventDefault()
          return
        }
        e.dataTransfer.setData('itemId', item.id)
        e.dataTransfer.setData('phase', item.phase || 'post')
        if (item.content_piece_id) {
          e.dataTransfer.setData('contentPieceId', item.content_piece_id)
        }
        if (isBatchItem) {
          e.dataTransfer.setData('isBatchItem', 'true')
        }
        e.dataTransfer.effectAllowed = 'move'
      }}
      style={{
        position: 'relative',
        zIndex: isExpanded ? 100 : 10
      }}
    >
      {isExpanded ? (
        <ExpandedCard
          item={item}
          contentPiece={contentPiece}
          isBatchItem={isBatchItem}
          multiSelectMode={multiSelectMode}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          color={color}
          phase={phase}
          isCompleted={isCompleted}
          isStory={isStory}
          formatIcon={formatIcon}
          onCollapse={() => setIsExpanded(false)}
          onToggleComplete={onToggleComplete}
          onViewScript={onViewScript}
          onMoveToNextWeek={onMoveToNextWeek}
          onMoveToPrevWeek={onMoveToPrevWeek}
          onUnschedule={onUnschedule}
          onDelete={onDelete}
          onDeleteRecurringTemplate={onDeleteRecurringTemplate}
          onOpenCaption={onOpenCaption}
          onViewBatchItem={onViewBatchItem}
          onEditBatchItem={onEditBatchItem}
          isMobile={isMobile}
        />
      ) : (
        <CollapsedCard
          item={item}
          contentPiece={contentPiece}
          isBatchItem={isBatchItem}
          multiSelectMode={multiSelectMode}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          color={color}
          phase={phase}
          isCompleted={isCompleted}
          isStory={isStory}
          formatIcon={formatIcon}
          onExpand={() => setIsExpanded(true)}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
