const { createCanvas } = require('canvas')
const fs = require('fs')

const SIZE = 1024
const canvas = createCanvas(SIZE, SIZE)
const ctx = canvas.getContext('2d')
const cx = SIZE / 2, cy = SIZE / 2
const radius = 380, strokeWidth = 88

ctx.fillStyle = '#0a0a0a'
roundRect(ctx, 0, 0, SIZE, SIZE, 210)
ctx.fill()

ctx.beginPath()
ctx.arc(cx, cy, radius, 0, Math.PI * 2)
ctx.strokeStyle = 'rgba(255, 215, 0, 0.07)'
ctx.lineWidth = strokeWidth
ctx.stroke()

const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
grad.addColorStop(0, '#fff5a0')
grad.addColorStop(0.5, '#FFD700')
grad.addColorStop(1, '#FFA500')

ctx.beginPath()
ctx.arc(cx, cy, radius, -Math.PI / 2, Math.PI, false)
ctx.strokeStyle = grad
ctx.lineWidth = strokeWidth
ctx.lineCap = 'round'
ctx.stroke()

ctx.beginPath()
ctx.arc(cx - radius, cy, 22, 0, Math.PI * 2)
ctx.fillStyle = '#fff5a0'
ctx.fill()

const tGrad = ctx.createLinearGradient(cx - 200, cy - 60, cx + 200, cy + 60)
tGrad.addColorStop(0, '#fff5a0')
tGrad.addColorStop(0.5, '#FFD700')
tGrad.addColorStop(1, '#cc8800')

ctx.fillStyle = tGrad
ctx.font = '900 100px Arial'
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText('MY ARC', cx, cy + 10)

const buffer = canvas.toBuffer('image/png')
fs.writeFileSync('myarc-icon-1024.png', buffer)
console.log('✅ Icon saved: myarc-icon-1024.png')

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
