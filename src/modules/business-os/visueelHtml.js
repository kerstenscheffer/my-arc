// src/modules/business-os/visueelHtml.js
//
// Vrij visueel (30 okt 2026): Gino ontwerpt zelf een beeld in HTML/SVG/CSS
// (skill "Visueel uitleggen") en GinoToneel toont het in een afgesloten
// iframe naast de bol. Twee sloten tegelijk:
//
//  1. schoonHtml: DOMPurify haalt alles eruit wat ergens heen kan of code
//     draait: script, links, formulieren, meta/base/link, iframes, event-
//     attributen. Gino's HTML kan dus alleen tekenen (HTML, SVG, <style>, CSS-
//     en SVG-animaties). Nodig omdat captions en DM's van leads in zijn context
//     zitten: een verstopte instructie daarin mag nooit data kunnen wegsturen.
//  2. maakSrcdoc: het resultaat draait in <iframe sandbox="allow-scripts">
//     (eigen, lege oorsprong: geen toegang tot de app, login of opslag) met
//     een CSP die alleen inline stijl, Google Fonts, data:-plaatjes en ons
//     eigen script (lucide-iconen + hoogte doorgeven) toestaat. Geen fetch.
//
// Iconen: Gino schrijft <i data-lucide="calendar-check"></i>; lucide (zelfde
// versie als lucide-react) maakt er een SVG van.

import DOMPurify from 'dompurify'

export const LUCIDE_URL = 'https://unpkg.com/lucide@0.540.0/dist/umd/lucide.min.js'
export const MAX_HTML = 16000

const VERBODEN_TAGS = ['script', 'a', 'form', 'input', 'button', 'textarea', 'select', 'meta', 'base', 'link',
  'iframe', 'frame', 'frameset', 'object', 'embed', 'portal', 'audio', 'video', 'source', 'track', 'img', 'image', 'use', 'foreignobject']
const VERBODEN_ATTR = ['href', 'xlink:href', 'src', 'srcset', 'action', 'formaction', 'background', 'ping', 'poster']

// SVG-animaties mogen geen link-attribuut aanpassen (href → javascript:).
const geenLinkAnimatie = (node, data) => {
  if (data.attrName === 'attributename' && /href/i.test(data.attrValue)) data.keepAttr = false
}

export function schoonHtml(html, purify = DOMPurify) {
  if (typeof html !== 'string' || !html.trim()) return ''
  purify.addHook('uponSanitizeAttribute', geenLinkAnimatie)
  let uit
  try {
    uit = purify.sanitize(html.slice(0, MAX_HTML), {
    FORCE_BODY: true, // <style> vooraan blijft staan
    ADD_TAGS: ['style', 'animate', 'animatetransform', 'animatemotion'],
    ADD_ATTR: ['attributename', 'from', 'to', 'by', 'values', 'keytimes', 'keysplines', 'calcmode', 'begin', 'dur', 'repeatcount', 'additive', 'accumulate', 'path', 'rotate'],
    FORBID_TAGS: VERBODEN_TAGS,
    FORBID_ATTR: VERBODEN_ATTR,
    ALLOW_DATA_ATTR: true, // data-lucide
  })
  } finally { purify.removeHook('uponSanitizeAttribute') }
  return uit
    // url(...) in stijl alleen naar data: (CSP blokkeert de rest ook, dubbel slot)
    .replace(/url\(\s*(['"]?)(?!data:)[^)]*\)/gi, 'none')
    .replace(/@import[^;]*;?/gi, '')
}

// Huisstijl als CSS-variabelen + vaste animatieklassen, zodat Gino kort kan
// blijven en het altijd MY ARC oogt.
const BASIS_CSS = `
:root { --wit:#fff; --grijs:#9ca3af; --zacht:#6b7280; --groen:#22c55e; --oranje:#f59e0b; --rood:#ef4444; --vlak:#141414; --lijn:rgba(255,255,255,0.08); }
* { box-sizing: border-box; }
html, body { margin:0; padding:0; background:transparent; color:var(--wit); overflow:hidden;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight:600; -webkit-font-smoothing:antialiased; }
body { padding: 2px; }
svg.lucide { width:var(--icoon, 1.25em); height:var(--icoon, 1.25em); stroke-width:2.2; vertical-align:-0.2em; flex-shrink:0; }
@keyframes gt-in { from { opacity:0; transform:translateY(10px) scale(.97) } to { opacity:1; transform:none } }
@keyframes gt-zweef { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-5px) } }
@keyframes gt-puls { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(1.12); opacity:.75 } }
@keyframes gt-draai { to { transform:rotate(360deg) } }
@keyframes gt-schud { 0%,86%,100% { transform:rotate(0) } 89% { transform:rotate(-12deg) } 93% { transform:rotate(10deg) } 97% { transform:rotate(-6deg) } }
@keyframes gt-groei { from { transform:scaleY(0) } to { transform:scaleY(1) } }
@keyframes gt-breed { from { transform:scaleX(0) } to { transform:scaleX(1) } }
@keyframes gt-teken { from { stroke-dashoffset: var(--lengte, 1000) } to { stroke-dashoffset: 0 } }
.in { animation: gt-in .55s both cubic-bezier(.2,.8,.2,1); }
.zweef { animation: gt-zweef 3.2s ease-in-out infinite; display:inline-block; }
.puls { animation: gt-puls 1.8s ease-in-out infinite; display:inline-block; }
.draai { animation: gt-draai 6s linear infinite; display:inline-block; }
.schud { animation: gt-schud 2.6s ease-in-out infinite; display:inline-block; }
.groei { animation: gt-groei .9s both cubic-bezier(.2,.8,.2,1); transform-origin: bottom; transform-box: fill-box; }
.breed { animation: gt-breed .9s both cubic-bezier(.2,.8,.2,1); transform-origin: left; transform-box: fill-box; }
.teken { stroke-dasharray: var(--lengte, 1000); animation: gt-teken 1.4s both ease-out; }
${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `.d${i} { animation-delay: ${(i * 0.08).toFixed(2)}s; }`).join('\n')}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }
`

// Ons script: iconen tekenen en de hoogte aan Business OS doorgeven.
const HULP_JS = `
(function () {
  function teken() { try { if (window.lucide) lucide.createIcons(); } catch (e) {} meld(); }
  function meld() { parent.postMessage({ gt_hoogte: Math.ceil(document.documentElement.scrollHeight) }, '*'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', teken); else teken();
  window.addEventListener('load', teken);
  if (window.ResizeObserver) new ResizeObserver(meld).observe(document.body);
})();
`

export function maakSrcdoc(schoon) {
  // Nonce: alleen onze twee scripts mogen draaien, ook als er ooit iets door het filter glipt.
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src data:",
    `script-src 'nonce-${nonce}' ${LUCIDE_URL}`,
    "connect-src 'none'", "form-action 'none'", "base-uri 'none'",
  ].join('; ')
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap">
<style>${BASIS_CSS}</style>
<script nonce="${nonce}" src="${LUCIDE_URL}"></script>
</head><body>${schoon}<script nonce="${nonce}">${HULP_JS}</script></body></html>`
}
