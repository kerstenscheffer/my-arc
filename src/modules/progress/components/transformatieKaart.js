// src/modules/progress/components/transformatieKaart.js
// De before/after-transformatiekaart (4:5, MA-COACHING-overlay met fade,
// maand-labels) op een canvas. Gebruikt door BeforeAfterCard (tracking-
// pagina) en PhotoCompareModal (vergelijken, coach en klant).

import { fotoWeergaveUrl } from '../fotoWeergave'

const W = 1080, H = 1350
export const OVERLAY_SRC = '/ma-coaching-logo.png'

function monthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
    - (b.getDate() < a.getDate() ? 1 : 0)
}

function loadImg(src, cors) {
  return new Promise((resolve, reject) => {
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
}

function drawCover(ctx, img, dx, dy, dw, dh) {
  const ir = img.width / img.height, tr = dw / dh
  let sw, sh, sx, sy
  if (ir > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw) / 2; sy = 0 }
  else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

// Tekent de transformatie (links eerste, rechts laatste, MA-COACHING-overlay,
// maand-labels) op een canvas. Gedeeld met PhotoCompareModal, zodat de
// vergelijking van coach en klant er precies zo uitziet als deze kaart.
// `startDatum`: vanaf wanneer "Maand 1" telt; standaard de linker foto.
// `afgebroken`: geeft true als er intussen een nieuwere tekening is gestart;
// dan tekent deze niet meer (snel wisselen van datum).
export async function tekenTransformatie(canvas, first, last, { startDatum, afgebroken } = {}) {
  const [imgA, imgB, overlay] = await Promise.all([
    loadImg(fotoWeergaveUrl(first.photo_url, { breedte: 1000, kwaliteit: 85 }), true),
    loadImg(fotoWeergaveUrl(last.photo_url, { breedte: 1000, kwaliteit: 85 }), true),
    loadImg(OVERLAY_SRC, false),
  ])
  if (afgebroken?.()) return false
  const ctx = canvas.getContext('2d')
  canvas.width = W; canvas.height = H
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
  drawCover(ctx, imgA, 0, 0, W / 2, H)          // links = eerste
  drawCover(ctx, imgB, W / 2, 0, W / 2, H)      // rechts = laatste
  ctx.drawImage(overlay, 0, 0, W, H)

  const begin = new Date(startDatum || first.photo_date)
  const maand = (d) => Math.max(1, monthsBetween(begin, new Date(d)) + 1)
  ctx.save()
  ctx.font = 'italic 900 62px Arial, sans-serif'
  ctx.fillStyle = '#fff'
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const y = H * 0.86
  ctx.fillText(`Maand ${maand(first.photo_date)}`, W * 0.24, y)
  ctx.fillText(`Maand ${maand(last.photo_date)}`, W * 0.76, y)
  ctx.restore()
  return true
}
