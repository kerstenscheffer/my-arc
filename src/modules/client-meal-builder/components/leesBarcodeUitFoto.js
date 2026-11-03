// src/modules/client-meal-builder/components/leesBarcodeUitFoto.js
//
// Barcode lezen uit een foto. Vangnet voor toestellen waar de live camera in de
// app niet opent (Richard, Oppo, 3 nov 2026): een foto loopt via de camera-app
// van de telefoon en heeft dat probleem niet. Geeft de code terug, of null.
import {
  BarcodeFormat, DecodeHintType, MultiFormatReader,
  RGBLuminanceSource, HybridBinarizer, BinaryBitmap,
} from '@zxing/library'

export function leesGrijs(grijs, w, h) {
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
  ])
  hints.set(DecodeHintType.TRY_HARDER, true)
  const lezer = new MultiFormatReader()
  lezer.setHints(hints)
  try {
    return lezer.decodeWithState(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(grijs, w, h)))).getText()
  } catch {
    return null
  }
}

const laadFoto = (bestand) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(bestand)
  const img = new Image()
  img.onload = () => resolve({ img, klaar: () => URL.revokeObjectURL(url) })
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Foto niet te openen')) }
  img.src = url
})

// De foto op een canvas: verkleind tot maxZijde, eventueel een kwartslag gedraaid.
const tekenFoto = (img, maxZijde, gedraaid) => {
  const schaal = Math.min(1, maxZijde / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * schaal)
  const h = Math.round(img.naturalHeight * schaal)
  const doek = document.createElement('canvas')
  doek.width = gedraaid ? h : w
  doek.height = gedraaid ? w : h
  const ctx = doek.getContext('2d', { willReadFrequently: true })
  if (gedraaid) { ctx.translate(h, 0); ctx.rotate(Math.PI / 2) }
  ctx.drawImage(img, 0, 0, w, h)
  return { doek, ctx }
}

export async function leesBarcodeUitFoto(bestand) {
  const { img, klaar } = await laadFoto(bestand)
  try {
    // De ingebouwde lezer van de telefoon is het sterkst; ZXing als die er niet is.
    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
        const code = (await detector.detect(tekenFoto(img, 2400, false).doek))?.[0]?.rawValue
        if (code) return code
      } catch { /* niet bruikbaar: door naar ZXing */ }
    }
    // Eerst verkleind (snel, en minder ruis), dan groter voor een kleine barcode.
    for (const maxZijde of [1400, 2400]) {
      for (const gedraaid of [false, true]) {
        const { doek, ctx } = tekenFoto(img, maxZijde, gedraaid)
        const { width: w, height: h } = doek
        const beeld = ctx.getImageData(0, 0, w, h).data
        const grijs = new Uint8ClampedArray(w * h)
        for (let i = 0, j = 0; i < grijs.length; i++, j += 4) {
          grijs[i] = (beeld[j] + 2 * beeld[j + 1] + beeld[j + 2]) / 4
        }
        const code = leesGrijs(grijs, w, h)
        if (code) return code
        // Scherm even de kans geven: dit rekenwerk houdt de pagina vast.
        await new Promise(r => setTimeout(r, 0))
      }
    }
    return null
  } finally {
    klaar()
  }
}
