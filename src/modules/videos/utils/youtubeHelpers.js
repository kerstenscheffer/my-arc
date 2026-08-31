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
 * Bepaal het type videobron van een URL.
 *  - youtube    → embedbaar in een iframe (youtubeId)
 *  - zoom-embed → Zoom Clip, embedbaar
 *  - zoom       → andere zoom-link, NIET embedbaar → extern openen
 *  - instagram  → Reel/post. Instagram blokkeert iframes én levert sinds 2020
 *                 geen publieke omslag meer (geen og:image voor uitgelogde
 *                 bezoekers, oEmbed vereist een goedgekeurde Facebook-app).
 *                 Dus: extern openen, omslag handmatig uploaden.
 *  - tiktok     → zelfde verhaal als Instagram
 *  - external   → onbekende http-link → extern openen
 *  - none       → geen url
 */
export const getVideoSource = (url) => {
  const youtubeId = extractYouTubeId(url)
  if (youtubeId) return { kind: 'youtube', youtubeId, url }
  const zoomEmbed = getZoomEmbedUrl(url)
  if (zoomEmbed) return { kind: 'zoom-embed', embedUrl: zoomEmbed, url }
  if (url && /zoom\.us/i.test(url)) return { kind: 'zoom', url }  // andere zoom-link (bv. rec) → extern
  const igEmbed = getInstagramEmbedUrl(url)
  if (igEmbed) return { kind: 'instagram-embed', embedUrl: igEmbed, url }
  if (url && /instagram\.com/i.test(url)) return { kind: 'instagram', url }
  if (url && /tiktok\.com/i.test(url)) return { kind: 'tiktok', url }
  if (url) return { kind: 'external', url }
  return { kind: 'none', url: null }
}

/**
 * Instagram Reel/post → embedbare URL.
 *
 * De gewone reel-pagina zit achter een loginmuur, maar /embed/ is een aparte
 * pagina die Instagram juist beschikbaar stelt om in te sluiten: die stuurt
 * geen x-frame-options en zet geen frame-ancestors in de CSP. Getest 31-08-2026.
 *
 * Werkt alleen voor berichten van een OPENBAAR account; bij een privéaccount
 * toont de embed een lege kaart. Daarom blijft de externe-link-terugval bestaan.
 *
 * Het pad-type (reel/p/tv) blijft behouden — Instagram accepteert per type.
 */
export const getInstagramEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const m = url.match(/instagram\.com\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i)
  if (!m) return null
  const type = m[1].toLowerCase() === 'reels' ? 'reel' : m[1].toLowerCase()
  return `https://www.instagram.com/${type}/${m[2]}/embed/`
}

/**
 * Naam + kleur per bron, voor labels op kaarten en in de speler.
 * `omslagZelf` = deze bron levert geen automatische thumbnail, dus de coach
 * moet er zelf een uploaden (het uploadveld staat al in de video-modal).
 */
export const BRON_META = {
  youtube:      { label: 'YouTube',   kleur: '#ff0000', omslagZelf: false },
  'zoom-embed': { label: 'Zoom',      kleur: '#2d8cff', omslagZelf: true },
  zoom:         { label: 'Zoom',      kleur: '#2d8cff', omslagZelf: true },
  // De embed brengt z'n eigen omslag mee, dus daar hoeft niets geüpload.
  'instagram-embed': { label: 'Instagram', kleur: '#e1306c', omslagZelf: false },
  instagram:    { label: 'Instagram', kleur: '#e1306c', omslagZelf: true },
  tiktok:       { label: 'TikTok',    kleur: '#25f4ee', omslagZelf: true },
  external:     { label: 'Link',      kleur: 'rgba(255,255,255,0.5)', omslagZelf: true },
}

export const getBronMeta = (url) => BRON_META[getVideoSource(url).kind] || null

/**
 * Zoom Clip → embedbare iframe-URL. Zet een /clips/share/<id> om naar
 * /clips/embed/<id> (die heeft géén x-frame-options, dus wél embedbaar).
 * Accepteert ook een al-embed URL. Andere zoom-links → null.
 */
export const getZoomEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const m = url.match(/(https?:\/\/[^/]*zoom\.us)\/clips\/(?:share|embed)\/([A-Za-z0-9_-]+)/i)
  return m ? `${m[1]}/clips/embed/${m[2]}` : null
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
