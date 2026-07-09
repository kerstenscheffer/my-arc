// src/modules/progress/components/BeforeAfterCard.jsx
// Automatische before/after-transformatiekaart (client-kant). Pakt de EERSTE en
// LAATSTE voorkant-foto uit ch8_progress_photos, tekent ze naast elkaar in een
// 4:5-frame met de MA-COACHING-overlay en de maand-labels ("Maand 1" links,
// "Maand X" rechts). Downloadbaar als PNG.
//
// `bare` = alleen de 4:5-kaart (voor gebruik als preview-blok), zonder eigen
// kop; `fallbackUrl` = afbeelding om te tonen als er nog geen 2 voorkant-foto's
// zijn, met de overlay eroverheen zodat het altijd branded oogt.

import { useEffect, useRef, useState } from 'react'
import { Download, Loader } from 'lucide-react'

const W = 1080, H = 1350
const OVERLAY_SRC = '/ma-coaching-logo.png'

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

const isFront = (p) => {
  const s = (p.metadata?.subtype || p.photo_type || '').toLowerCase()
  return s === 'front' || s === 'voor' || s.includes('front') || s.includes('voor')
}

export default function BeforeAfterCard({ client, db, isMobile, bare = false, fallbackUrl = null }) {
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | empty | error
  const [pair, setPair] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!client?.id || !db?.supabase) return
      setStatus('loading')
      try {
        const { data } = await db.supabase
          .from('ch8_progress_photos')
          .select('id, photo_url, photo_type, photo_date, metadata')
          .eq('client_id', client.id)
          .order('photo_date', { ascending: true })
        const all = (data || []).filter(p => p.photo_url)
        const front = all.filter(isFront)
        const use = front.length >= 2 ? front : all
        if (use.length < 2) { if (!cancelled) setStatus('empty'); return }
        if (!cancelled) setPair({ first: use[0], last: use[use.length - 1] })
      } catch (e) { console.error('BeforeAfter laden mislukt:', e); if (!cancelled) setStatus('error') }
    })()
    return () => { cancelled = true }
  }, [client?.id, db])

  useEffect(() => {
    if (!pair) return
    let cancelled = false
    ;(async () => {
      try {
        const [imgA, imgB, overlay] = await Promise.all([
          loadImg(pair.first.photo_url, true),
          loadImg(pair.last.photo_url, true),
          loadImg(OVERLAY_SRC, false),
        ])
        if (cancelled) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = W; canvas.height = H
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
        drawCover(ctx, imgA, 0, 0, W / 2, H)          // links = eerste (Maand 1)
        drawCover(ctx, imgB, W / 2, 0, W / 2, H)      // rechts = laatste (Maand X)
        ctx.drawImage(overlay, 0, 0, W, H)

        const fd = new Date(pair.first.photo_date), ld = new Date(pair.last.photo_date)
        const lastMonth = Math.max(1, monthsBetween(fd, ld) + 1)
        ctx.save()
        ctx.font = 'italic 900 62px Arial, sans-serif'
        ctx.fillStyle = '#fff'
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        const y = H * 0.86
        ctx.fillText('Maand 1', W * 0.24, y)
        ctx.fillText(`Maand ${lastMonth}`, W * 0.76, y)
        ctx.restore()

        if (!cancelled) setStatus('ready')
      } catch (e) { console.error('BeforeAfter tekenen mislukt:', e); if (!cancelled) setStatus('error') }
    })()
    return () => { cancelled = true }
  }, [pair])

  const download = (e) => {
    e?.stopPropagation?.()
    try {
      const a = document.createElement('a')
      a.href = canvasRef.current.toDataURL('image/png')
      a.download = `myarc-transformatie-${(client.first_name || 'client').toLowerCase()}.png`
      document.body.appendChild(a); a.click(); a.remove()
    } catch (err) { console.error('Download mislukt:', err); alert('Download lukt niet (foto-beveiliging). Probeer later opnieuw.') }
  }

  // ── 4:5-canvas (of nette fallback) ──
  const canvasArea = (
    <div style={{ position: 'relative', width: '100%', maxWidth: bare ? '100%' : 480, margin: '0 auto', aspectRatio: '4 / 5', borderRadius: 14, overflow: 'hidden', background: '#0a0a0a' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: status === 'ready' ? 'block' : 'none' }} />

      {(status === 'empty' || status === 'error') && (
        <>
          {fallbackUrl
            ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${fallbackUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            : <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)' }} />}
          <img src={OVERLAY_SRC} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
          {status === 'empty' && (
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              Nog geen before/after — upload 2 voorkant-foto's
            </div>
          )}
        </>
      )}

      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', gap: 8 }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Laden…
        </div>
      )}

      {status === 'ready' && (
        <button onClick={download} title="Download" style={{ position: 'absolute', top: 8, right: 8, width: 38, height: 38, borderRadius: 10, background: '#FFD700', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', touchAction: 'manipulation' }}>
          <Download size={16} />
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (bare) return canvasArea

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 16, padding: isMobile ? 12 : 16, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Jouw transformatie</div>
      {canvasArea}
    </div>
  )
}
