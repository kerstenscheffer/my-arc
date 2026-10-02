// scripts/og-image.mjs — maakt public/og-image.jpg (1200×630) voor link-previews
// (WhatsApp, iMessage, LinkedIn). Draai opnieuw als het logo of de tekst verandert:
//   node scripts/og-image.mjs
import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { existsSync } from 'fs'
// Het app-icoon (logo gecentreerd op zwart) — op de zwarte achtergrond valt
// het vierkant weg en blijft alleen het logo over. Valt terug op het witte
// header-logo als het icoon ontbreekt.
const bron = existsSync('public/icons/icon-512x512.png') ? 'public/icons/icon-512x512.png' : 'public/ma-logo-header.png'
const logo = 'data:image/png;base64,' + readFileSync(bron).toString('base64')
const html = `<html><body style="margin:0;width:1200px;height:630px;background:#0a0a0a;position:relative;font-family:-apple-system,Helvetica,Arial,sans-serif;overflow:hidden">
  <img src="${logo}" style="position:absolute;left:60px;top:75px;width:480px;height:480px;object-fit:contain;border-radius:96px">
  <div style="position:absolute;left:560px;top:0;height:630px;display:flex;flex-direction:column;justify-content:center;color:#fff">
    <div style="font-size:96px;font-weight:900;letter-spacing:-0.04em;line-height:1">MY ARC</div>
    <div style="font-size:32px;font-weight:700;color:rgba(255,255,255,0.7);margin-top:18px;letter-spacing:-0.01em;max-width:580px;line-height:1.25">Online coaching: training, voeding en persoonlijke begeleiding.</div>
    <div style="font-size:24px;font-weight:800;color:rgba(255,255,255,0.4);margin-top:30px;letter-spacing:0.1em">MYARCFITNESS.COM</div>
  </div>
</body></html>`
const b = await puppeteer.launch({ headless: true })
const p = await b.newPage()
await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => Promise.all([...document.images].map(i => i.decode())))
await p.screenshot({ path: 'public/og-image.jpg', type: 'jpeg', quality: 90 })
await b.close()
console.log('og-image.jpg geschreven')
