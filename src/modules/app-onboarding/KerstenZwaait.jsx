// src/modules/app-onboarding/KerstenZwaait.jsx
//
// Kersten die zwaait (24 nov 2026), voor het startscherm van de onboarding.
// Overgenomen uit Kerstens zwaaiproef (My Video Editor/projects/
// 2026-11-24-kersten-zwaaiproef/zwaai.js): het bronbeeld wordt in WebGL op een
// raster van driehoeken gelegd en dat raster beweegt: knipperen, arm optillen,
// zwaaien, arm weer omlaag, ademen. Achtergrond blijft doorzichtig.
//
// Speelt de beweging van 5,2 s af, wacht even en begint opnieuw.
// Geen WebGL of een fout: dan staat het stilstaande zwaaibeeld er.
// Het raster rekent in de pixels van het origineel (1024 x 1536); de textuur
// mag kleiner zijn (UV's zijn 0..1).

import { useEffect, useRef, useState } from 'react'

const BRON = '/mascottes/kersten-zwaait.webp'
const STIL = '/mascottes/kersten-zwaait-stil.webp'
const DUUR = 5.2
const PAUZE = 1.6 // seconden stil tussen twee keer zwaaien
const BREED = 540, HOOG = 612 // verhouding van het beeldvlak uit de proef

export default function KerstenZwaait({ hoogte = 300 }) {
  const canvasRef = useRef(null)
  const [stil, setStil] = useState(false)
  const breed = Math.round(hoogte * BREED / HOOG)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(breed * dpr)
    canvas.height = Math.round(hoogte * dpr)
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true })
    if (!gl) { setStil(true); return }

    let raf = 0, weg = false
    try {
      const width = 1024, height = 1536, spacing = 8
      const columns = width / spacing + 1, rows = height / spacing + 1
      const positions = new Float32Array(columns * rows * 2)
      const textureCoordinates = new Float32Array(positions.length)
      const triangles = new Uint16Array((columns - 1) * (rows - 1) * 6)
      const shoulder = { x: 686, y: 450 }
      const elbow = { x: 850, y: 498 }
      const wrist = { x: 858, y: 337 }
      const eyes = [
        { x: 442, y: 211, radius: 32, slope: -0.17 },
        { x: 530, y: 197, radius: 35, slope: -0.15 },
      ]

      const clamp = (v) => Math.min(1, Math.max(0, v))
      const mix = (a, b, w) => a + (b - a) * w
      const ease = (t) => { const u = clamp(t); return u * u * (3 - 2 * u) }
      const ramp = (a, b, v) => ease((v - a) / (b - a))
      const pulse = (t, c, h) => ease(1 - Math.abs(t - c) / h)
      const radians = (d) => d * Math.PI / 180
      const degrees = (r) => r * 180 / Math.PI

      const angularRamp = (from, to, angle) => {
        const p = clamp((angle - from) / (to - from))
        const edge = 0.18
        if (p < edge) return p * p / (2 * edge * (1 - edge))
        if (p > 1 - edge) { const r = 1 - p; return 1 - r * r / (2 * edge * (1 - edge)) }
        return (p - edge / 2) / (1 - edge)
      }
      const elbowWeight = (x, y) => {
        const dx = x - elbow.x, dy = y - elbow.y
        const radius = Math.hypot(dx, dy)
        if (radius >= 410) return 0
        const angle = degrees(Math.atan2(dy, dx))
        const inner = mix(-173, -130, ramp(20, 107, radius))
        const start = mix(inner, -123, ramp(195, 260, radius))
        const full = mix(-102, -112, ramp(55, 120, radius))
        const outer = mix(145, 117, ramp(85, 155, radius))
        return angularRamp(start, full, angle) * (1 - angularRamp(-62, outer, angle)) * (1 - ramp(374, 410, radius))
      }
      const shoulderWeight = (x, y) => {
        const dx = x - shoulder.x, dy = y - shoulder.y
        const radius = Math.hypot(dx, dy)
        const angle = degrees(Math.atan2(dy, dx))
        const distal = ramp(52, 151, radius)
        const start = mix(-155, -97, distal)
        const full = mix(-38, -73, distal)
        return angularRamp(start, full, angle) * (1 - angularRamp(21, 101, angle))
      }

      const points = []
      let tri = 0
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const x = column * spacing, y = row * spacing
          const i = row * columns + column
          textureCoordinates[i * 2] = x / width
          textureCoordinates[i * 2 + 1] = y / height
          const nearHand = ramp(650, 725, x) * (1 - ramp(290, 360, y))
          const armInfluence = ramp(632, 656, x) * (1 - ramp(646, 700, y))
          points.push({ x, y, nearHand, armInfluence })
          if (row < rows - 1 && column < columns - 1) {
            triangles.set([i, i + 1, i + columns, i + 1, i + columns + 1, i + columns], tri)
            tri += 6
          }
        }
      }

      const shader = (type, source) => {
        const s = gl.createShader(type)
        gl.shaderSource(s, source)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
        return s
      }
      const program = gl.createProgram()
      gl.attachShader(program, shader(gl.VERTEX_SHADER, `
        attribute vec2 position;
        attribute vec2 source;
        varying vec2 uv;
        void main() { gl_Position = vec4(position, 0.0, 1.0); uv = source; }
      `))
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        uniform sampler2D mascot;
        varying vec2 uv;
        void main() { gl_FragColor = texture2D(mascot, uv); }
      `))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
      gl.useProgram(program)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      const dynamicPositions = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, dynamicPositions)
      gl.bufferData(gl.ARRAY_BUFFER, positions.byteLength, gl.DYNAMIC_DRAW)
      const positionAttribute = gl.getAttribLocation(program, 'position')
      gl.enableVertexAttribArray(positionAttribute)
      gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0)
      const uvBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW)
      const sourceAttribute = gl.getAttribLocation(program, 'source')
      gl.enableVertexAttribArray(sourceAttribute)
      gl.vertexAttribPointer(sourceAttribute, 2, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangles, gl.STATIC_DRAW)

      const eyelidY = (x, y, amount) => {
        for (const eye of eyes) {
          const across = Math.abs(x - eye.x)
          if (across >= eye.radius + 10) continue
          const center = eye.y + (x - eye.x) * eye.slope
          const delta = y - center
          const distance = Math.abs(delta)
          if (distance >= 37) continue
          const factor = 1 - 0.95 * amount * (1 - ramp(eye.radius - 6, eye.radius + 10, across))
          const inner = 15
          const squeezed = distance <= inner ? distance * factor : mix(inner * factor, 37, (distance - inner) / (37 - inner))
          return center + Math.sign(delta) * squeezed
        }
        return y
      }

      const draw = (time, ademTijd) => {
        const lift = ramp(0.76, 1.62, time) - ramp(3.61, 4.65, time)
        const waveAmount = ramp(1.44, 1.78, time) * (1 - ramp(3.14, 3.6, time))
        const phase = (time - 1.63) * Math.PI * 4.1
        const wave = waveAmount * Math.sin(phase)
        const blink = Math.max(pulse(time, 0.49, 0.105), pulse(time, 4.27, 0.108))
        const wiggle = radians(6 * waveAmount * Math.sin(phase - 0.68))
        const swing = radians(mix(45, -4, lift) + 2.3 * wave)
        const bend = radians(mix(20, 0, lift) + 10 * wave)
        const wiCos = Math.cos(wiggle), wiSin = Math.sin(wiggle)
        // Ademen loopt ook door in de pauze tussen twee keer zwaaien.
        const breathing = Math.sin(ademTijd / DUUR * Math.PI * 4) * 2.75
        const sway = -12 * lift + 3.2 * wave
        for (let i = 0; i < points.length; i++) {
          const p = points[i]
          let x = p.x
          let y = blink ? eyelidY(x, p.y, blink) : p.y
          if (p.armInfluence) {
            if (p.nearHand > 0 && waveAmount > 0) {
              const dx = x - wrist.x, dy = y - wrist.y
              x = mix(x, wrist.x + dx * wiCos - dy * wiSin, p.nearHand)
              y = mix(y, wrist.y + dx * wiSin + dy * wiCos, p.nearHand)
            }
            const elbowAngle = bend * elbowWeight(x, y) * p.armInfluence
            if (elbowAngle) {
              const dx = x - elbow.x, dy = y - elbow.y
              const c = Math.cos(elbowAngle), s = Math.sin(elbowAngle)
              x = elbow.x + dx * c - dy * s
              y = elbow.y + dx * s + dy * c
            }
            const shoulderAngle = swing * shoulderWeight(x, y) * p.armInfluence
            if (shoulderAngle) {
              const dx = x - shoulder.x, dy = y - shoulder.y
              const c = Math.cos(shoulderAngle), s = Math.sin(shoulderAngle)
              x = shoulder.x + dx * c - dy * s
              y = shoulder.y + dx * s + dy * c
            }
          }
          const bodyWeight = clamp((1490 - p.y) / 1130)
          x += sway * bodyWeight
          y += (breathing - 2.4 * lift) * bodyWeight
          positions[i * 2] = (x + 180) * 2 / 1440 - 1
          positions[i * 2 + 1] = 1 - (y + 48) * 2 / 1632
        }
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.bindBuffer(gl.ARRAY_BUFFER, dynamicPositions)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions)
        gl.drawElements(gl.TRIANGLES, triangles.length, gl.UNSIGNED_SHORT, 0)
      }

      const beeld = new Image()
      beeld.onload = () => {
        if (weg) return
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, beeld)
        const start = performance.now()
        const stap = (nu) => {
          if (weg) return
          const t = (nu - start) / 1000
          const inRonde = t % (DUUR + PAUZE)
          draw(Math.min(DUUR, inRonde), t)
          raf = requestAnimationFrame(stap)
        }
        raf = requestAnimationFrame(stap)
      }
      beeld.onerror = () => setStil(true)
      beeld.src = BRON
    } catch (e) {
      console.warn('Zwaai-animatie niet gestart', e?.message)
      setStil(true)
    }
    return () => { weg = true; cancelAnimationFrame(raf) }
  }, [hoogte, breed])

  return (
    <div aria-hidden style={{ position: 'relative', height: hoogte, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      {/* schaduw onder de voeten */}
      <div style={{ position: 'absolute', bottom: hoogte * 0.035, width: hoogte * 0.42, height: hoogte * 0.06, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', filter: 'blur(2px)' }} />
      {stil
        ? <img src={STIL} alt="" draggable={false} style={{ height: hoogte, width: 'auto', display: 'block', position: 'relative' }} />
        : <canvas ref={canvasRef} style={{ width: breed, height: hoogte, display: 'block', position: 'relative' }} />}
    </div>
  )
}
