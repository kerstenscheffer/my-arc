// src/modules/videos/utils/youtubeHelpers.js
// YouTube URL parsing — supports watch, youtu.be, embed, AND shorts
// Fixes the bug where /shorts/ URLs returned null videoId

/**
 * Extract YouTube video ID from any URL format.
 * Supports: watch?v=, youtu.be/, embed/, shorts/, mobile (m.youtube.com)
 */
export const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null

  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
    /m\.youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

/**
 * Build YouTube thumbnail URL.
 * Quality: default, mqdefault, hqdefault, sddefault, maxresdefault
 */
export const getYouTubeThumbnail = (videoId, quality = 'hqdefault') => {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Get thumbnail directly from any YouTube URL.
 */
export const getThumbnailFromUrl = (url, quality = 'hqdefault') => {
  const id = extractYouTubeId(url)
  return id ? getYouTubeThumbnail(id, quality) : null
}

/**
 * Build YouTube embed URL with our preferred params.
 */
export const getYouTubeEmbedUrl = (videoId, options = {}) => {
  if (!videoId) return null
  const params = new URLSearchParams({
    autoplay: options.autoplay !== false ? '1' : '0',
    mute: options.mute ? '1' : '0',
    controls: options.controls !== false ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

/**
 * Format duration seconds → "M:SS"
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
