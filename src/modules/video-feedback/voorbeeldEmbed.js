// src/modules/video-feedback/voorbeeldEmbed.js
//
// Een geplakte videolink van een externe creator omzetten naar iets wat we
// kunnen tonen. YouTube via de app-veilige embed (zie youtubeHelpers),
// Instagram en TikTok via hun embed-pagina, een los videobestand als <video>.
// Alles wat we niet herkennen: geen embed (veel sites weigeren een iframe),
// dan tonen we een knop om de link te openen.
import { extractYouTubeId, appSafeEmbedUrl } from '../videos/utils/youtubeHelpers'

export function schoneUrl(tekst) {
  let t = String(tekst || '').trim()
  if (!t) return null
  // Geplakte insluitcode (Zoom geeft <div><a href="...">): haal de link eruit.
  if (t.includes('<')) {
    const m = t.match(/(?:href|src)=["']([^"']+)["']/i) || t.match(/https?:\/\/[^\s"'<>]+/i)
    if (!m) return null
    t = (m[1] || m[0]).replace(/&amp;/g, '&')
  }
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

export function embedVan(url) {
  if (!url) return null
  const yt = extractYouTubeId(url)
  if (yt) return { soort: 'iframe', src: appSafeEmbedUrl(`https://www.youtube.com/embed/${yt}?rel=0&playsinline=1&modestbranding=1`) }
  const ig = url.match(/instagram\.com\/(?:[^/]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i)
  if (ig) return { soort: 'iframe', src: `https://www.instagram.com/${ig[1] === 'reels' ? 'reel' : ig[1]}/${ig[2]}/embed` }
  const tt = url.match(/tiktok\.com\/.*\/video\/(\d+)/i)
  if (tt) return { soort: 'iframe', src: `https://www.tiktok.com/embed/v2/${tt[1]}` }
  // Zoom Clips: de deelpagina weigert een iframe, de embed-pagina niet.
  // Zoom-opnames (/rec/share) hebben dat niet en blijven een knop.
  const zoom = url.match(/^(https:\/\/[\w-]+\.zoom\.us|https:\/\/zoom\.us)\/clips\/(?:share|embed)\/([\w-]+)/i)
  if (zoom) return { soort: 'iframe', src: `${zoom[1]}/clips/embed/${zoom[2]}` }
  if (/\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url)) return { soort: 'video', src: url }
  return { soort: 'link', src: url }
}
