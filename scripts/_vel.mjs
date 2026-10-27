import fs from 'node:fs'
import puppeteer from 'puppeteer'
const d = JSON.parse(fs.readFileSync('/private/tmp/claude-501/-Users-kerstenscheffer-workapp/65c7b999-841f-40ab-919e-82ecf1d9c69f/scratchpad/kandidaten.json','utf8'))
const termen = Object.keys(d)
const PER = 16
const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setViewport({ width: 1500, height: 800 })
for (let v = 0; v * PER < termen.length; v++) {
  const rows = termen.slice(v*PER, (v+1)*PER).map((t, i) => {
    const n = v*PER + i
    const imgs = d[t].fotos.slice(0, 8).map((f, j) => '<div class=c><img src="'+f.thumb.replace('w=240&h=180','w=160&h=120')+'"><b>'+j+'</b></div>').join('')
    return '<div class=r><div class=l>'+n+'. '+t+'<br><small>'+d[t].namen[0]+'</small></div>'+imgs+'</div>'
  }).join('')
  await page.setContent('<style>body{margin:0;background:#fff;font:13px sans-serif}.r{display:flex;align-items:center;border-bottom:1px solid #ccc}.l{width:210px;padding:4px}.c{position:relative;margin:2px}.c img{width:150px;height:112px;display:block}.c b{position:absolute;top:2px;left:4px;background:#000;color:#fff;padding:0 4px;font-size:14px}</style>'+rows, { waitUntil: 'networkidle0', timeout: 120000 })
  await page.screenshot({ path: '/private/tmp/claude-501/-Users-kerstenscheffer-workapp/65c7b999-841f-40ab-919e-82ecf1d9c69f/scratchpad/vel'+v+'.png', fullPage: true })
  await new Promise(r => setTimeout(r, 1500))
}
await browser.close()
console.log('ok')
