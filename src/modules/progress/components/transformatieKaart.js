// src/modules/progress/components/transformatieKaart.js
// De before/after-transformatiekaart (4:5, MA-COACHING-overlay met fade,
// maand-labels) op een canvas. Gebruikt door BeforeAfterCard (tracking-
// pagina) en PhotoCompareModal (vergelijken, coach en klant).

import { fotoWeergaveUrl } from '../fotoWeergave'

// Formaten van de kaart. 4:5 is het standaard Instagram-formaat; vierkant,
// story en liggend geven de foto's meer of minder ruimte in de breedte.
export const FORMATEN = {
  '4:5':  { W: 1080, H: 1350, label: '4:5 · Instagram' },
  '1:1':  { W: 1080, H: 1080, label: 'Vierkant' },
  '9:16': { W: 1080, H: 1920, label: 'Story' },
  '3:2':  { W: 1620, H: 1080, label: 'Liggend' },
}
export const OVERLAY_SRC = '/ma-coaching-logo.png'
// De overlay is 1080 × 1350: transparant, onderaan een fade naar zwart vanaf
// ongeveer y = 850, met het logo in het midden.
const OVERLAY_W = 1080, OVERLAY_H = 1350, FADE_VAN = 850

function monthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
    - (b.getDate() < a.getDate() ? 1 : 0)
}

// Eén keer laden per sessie: bij slepen en zoomen tekenen we tientallen
// keren per seconde opnieuw, en dan moet de foto er al zijn.
const geladen = new Map()
function loadImg(src, cors) {
  const sleutel = `${cors ? 'c' : 'n'}|${src}`
  if (geladen.has(sleutel)) return geladen.get(sleutel)
  const p = new Promise((resolve, reject) => {
    const img = new Image()
    if (cors) {
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => { const i2 = new Image(); i2.onload = () => resolve(i2); i2.onerror = reject; i2.src = src }
    } else {
      img.onload = () => resolve(img)
      img.onerror = reject
    }
    img.src = src
  })
  p.catch(() => geladen.delete(sleutel))
  geladen.set(sleutel, p)
  return p
}

// Vage achtergrond: dezelfde foto, heel klein getekend en weer opgeblazen.
// Werkt overal; ctx.filter = 'blur()' kent Safari niet.
function tekenWaas(ctx, img, dx, dy, dw, dh) {
  const klein = document.createElement('canvas')
  klein.width = 24; klein.height = Math.max(1, Math.round(24 * dh / dw))
  const k = klein.getContext('2d')
  const ir = img.width / img.height, tr = klein.width / klein.height
  let sw, sh, sx, sy
  if (ir > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw) / 2; sy = 0 }
  else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh) / 2 }
  k.drawImage(img, sx, sy, sw, sh, 0, 0, klein.width, klein.height)
  ctx.save()
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(klein, dx, dy, dw, dh)
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(dx, dy, dw, dh)
  ctx.restore()
}

// De foto in zijn vak. Standaard passend (heel in beeld, niets afgesneden),
// met de waas eromheen. `u` = uitsnede van de coach: zoom (1 = passend) en
// verschuiving x/y als deel van het vak.
function tekenFoto(ctx, img, dx, dy, dw, dh, u = {}) {
  const zoom = Math.max(1, Number(u.zoom) || 1)
  const s = Math.min(dw / img.width, dh / img.height) * zoom
  const w = img.width * s, h = img.height * s
  const cx = dx + dw / 2 + (Number(u.x) || 0) * dw
  const cy = dy + dh / 2 + (Number(u.y) || 0) * dh
  ctx.save()
  ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip()
  if (w < dw - 1 || h < dh - 1 || u.x || u.y) tekenWaas(ctx, img, dx, dy, dw, dh)
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h)
  ctx.restore()
}

// MA-COACHING onderaan, voor elk formaat. De overlay houdt zijn eigen
// verhouding (schaal op de hoogte, gecentreerd); is de kaart breder dan de
// overlay, dan vullen we links en rechts dezelfde fade zelf aan.
function tekenOverlay(ctx, overlay, W, H) {
  const k = Math.min(H / OVERLAY_H, W / OVERLAY_W)
  const ow = OVERLAY_W * k, oh = OVERLAY_H * k
  const ox = (W - ow) / 2, oy = H - oh
  if (ox > 0.5) {
    const g = ctx.createLinearGradient(0, oy + FADE_VAN * k, 0, H)
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = g
    ctx.fillRect(0, oy + FADE_VAN * k, ox + 1, H)
    ctx.fillRect(ox + ow - 1, oy + FADE_VAN * k, W - ox - ow + 1, H)
  }
  ctx.drawImage(overlay, ox, oy, ow, oh)
  return k
}

// Tekent de transformatie (links eerste, rechts laatste, MA-COACHING-overlay,
// maand-labels) op een canvas. Gedeeld met PhotoCompareModal, zodat de
// vergelijking van coach en klant er precies zo uitziet als deze kaart.
// `startDatum`: vanaf wanneer "Maand 1" telt; standaard de linker foto.
// `afgebroken`: geeft true als er intussen een nieuwere tekening is gestart;
// dan tekent deze niet meer (snel wisselen van datum).
// `formaat`: sleutel uit FORMATEN. `uitsnede`: { links: {zoom,x,y}, rechts }.
export async function tekenTransformatie(canvas, first, last, { startDatum, afgebroken, formaat = '4:5', uitsnede = {} } = {}) {
  const { W, H } = FORMATEN[formaat] || FORMATEN['4:5']
  const [imgA, imgB, overlay] = await Promise.all([
    loadImg(fotoWeergaveUrl(first.photo_url, { breedte: 1000, kwaliteit: 85 }), true),
    loadImg(fotoWeergaveUrl(last.photo_url, { breedte: 1000, kwaliteit: 85 }), true),
    loadImg(OVERLAY_SRC, false),
  ])
  if (afgebroken?.()) return false
  const ctx = canvas.getContext('2d')
  if (canvas.width !== W) canvas.width = W
  if (canvas.height !== H) canvas.height = H
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
  tekenFoto(ctx, imgA, 0, 0, W / 2, H, uitsnede.links)       // links = eerste
  tekenFoto(ctx, imgB, W / 2, 0, W / 2, H, uitsnede.rechts)  // rechts = laatste
  const k = tekenOverlay(ctx, overlay, W, H)

  const begin = new Date(startDatum || first.photo_date)
  const maand = (d) => Math.max(1, monthsBetween(begin, new Date(d)) + 1)
  ctx.save()
  ctx.font = `italic 900 ${Math.round(62 * k)}px Arial, sans-serif`
  ctx.fillStyle = '#fff'
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const y = H - (OVERLAY_H - 1161) * k   // zelfde hoogte als het logo (was H * 0.86 bij 4:5)
  ctx.fillText(`Maand ${maand(first.photo_date)}`, W * 0.24, y)
  ctx.fillText(`Maand ${maand(last.photo_date)}`, W * 0.76, y)
  ctx.restore()
  return true
}
