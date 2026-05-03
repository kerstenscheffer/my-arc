// src/modules/output-planning/components/week-planning/content-block/constants.js
// Shared constants and helpers for ContentBlock components
// UPDATED: Added sales phase icons and sales piece support in getTitle

import { 
  FileText, 
  Video, 
  Scissors, 
  Send,
  // NIEUW: Sales icons
  ClipboardList,
  MessageSquare,
  Phone,
  Star
} from 'lucide-react'

// Phase icon mapping
export const PHASE_ICONS = {
  // Content phases
  script: FileText,
  shoot: Video,
  edit: Scissors,
  post: Send,
  // NIEUW: Sales phases
  prep: ClipboardList,
  followup: MessageSquare,
  call: Phone,
  aftersale: Star
}

// Format time helper
export const formatTime = (timeString) => {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  return `${hours}:${minutes}`
}

// Get display title
// UPDATED: Now supports both content pieces and sales pieces
export const getTitle = (item, piece) => {
  // Check for sales piece
  if (item?.sales_piece_id && piece) {
    return piece.title || piece.prospect_name || 'Sales Call'
  }
  
  // Check for content piece
  if (item?.content_piece_id && piece) {
    return piece.title || 'Untitled'
  }
  
  // Fallback to item properties
  return item?.title || item?.label || 'Untitled'
}

// Check if item has script
export const hasScript = (contentPiece) => {
  return !!(contentPiece?.source_content_id)
}

// Check if item is linked to content piece
export const hasContentPiece = (item) => {
  return !!item?.content_piece_id
}

// NIEUW: Check if item is linked to sales piece
export const hasSalesPiece = (item) => {
  return !!item?.sales_piece_id
}
