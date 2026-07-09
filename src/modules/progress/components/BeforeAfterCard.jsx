// src/modules/progress/components/BeforeAfterCard.jsx
// Automatische before/after-transformatiekaart (client-kant). Pakt de EERSTE en
// LAATSTE progressiefoto (voorkant gematcht) uit ch8_progress_photos, tekent ze
// naast elkaar in een 4:5-frame met de MA-COACHING-overlay en de maand-labels
// ("Maand 1" links, "Maand X" rechts). Downloadbaar als PNG.

import { useEffect, useRef, useState } from 'react'
import { Download, Loader, ImageOff } from 'lucide-react'

const W = 1080, H = 1350
const OVERLAY_SRC = '/ma-coaching-logo.png'

// Hele maanden tussen twee datums (op basis van de dag-van-de-maand).
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
      // CORS niet toegestaan? Val terug op laden zónder crossOrigin, zodat de
      // kaart in elk geval getoond wordt (download kan dan evt. mislukken).
      img.onerror = () => {
        const img2 = new Image()
        img2.onload = () => resolve(img2)
        img2.onerror = reject
        img2.src = src
      }
    } else {
      img.onload = () => resolve(img)
      img.onerror = reject
    }
    img.src = src
  })
}

// Teken een foto "cover" (bijgesneden, gevuld) in een doelvak.
function drawCover(ctx, img, dx, dy, dw, dh) {
  const ir = img.width / img.height, tr = dw / dh
  let sw, sh, sx, sy
  if (ir > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw) / 2; sy = 0 }
  else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

export default function BeforeAfterCard({ client, db, isMobile }) {
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | empty | error
  const [pair, setPair] = useState(null)

  // 1) Kies de eerste + laatste foto (voorkant gematcht).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!client?.id || !db?.supabase) return
      setStatus('loading')
      try {
        const { data } = await db.supabase
          .from('ch8_progress_photos')
          .select('id, photo_url, photo_type, photo_date')
          .eq('client_id', client.id)
          .order('photo_date', { ascending: true })
        const all = (data || []).filter(p => p.photo_url)
        const front = all.filter(p => /front|voor/i.test(p.photo_type || ''))
        const use = front.length >= 2 ? front : all
        if (use.length < 2) { if (!cancelled) setStatus('empty'); return }
        if (!cancelled) setPair({ first: use[0], last: use[use.length - 1] })
      } catch (e) { console.error('BeforeAfter laden mislukt:', e); if (!cancelled) setStatus('error') }
    })()
    return () => { cancelled = true }
  }, [client?.id, db])

  // 2) Teken het canvas zodra het paar + de overlay geladen zijn.
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
        drawCover(ctx, imgA, 0, 0, W / 2, H)
        drawCover(ctx, imgB, W / 2, 0, W / 2, H)
        ctx.drawImage(overlay, 0, 0, W, H)

        // Maand-labels
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
      } catch (e) {
        console.error('BeforeAfter tekenen mislukt:', e)
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [pair])

  const download = () => {
    try {
      const a = document.createElement('a')
      a.href = canvasRef.current.toDataURL('image/png')
      a.download = `myarc-transformatie-${(client.first_name || 'client').toLowerCase()}.png`
      document.body.appendChild(a); a.click(); a.remove()
    } catch (e) {
      console.error('Download mislukt:', e)
      alert('Download lukt niet (foto-beveiliging). Probeer het later opnieuw.')
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)',
      borderRadius: 16, padding: isMobile ? 12 : 16, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Jouw transformatie</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Eerste vs. laatste foto</div>
        </div>
        {status === 'ready' && (
          <button onClick={download} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 1rem', borderRadius: 12, background: '#FFD700', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 18px rgba(255,215,0,0.22)', touchAction: 'manipulation' }}>
            <Download size={16} /> Download
          </button>
        )}
      </div>

      {status === 'empty' ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          <ImageOff size={28} style={{ opacity: 0.5, marginBottom: 8 }} /><br />
          Nog te weinig foto's voor een before/after. Upload minstens 2 voorkant-foto's op verschillende momenten.
        </div>
      ) : status === 'error' ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Kon de transformatiekaart niet laden. Probeer de pagina te verversen.
        </div>
      ) : (
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', borderRadius: 12, display: status === 'ready' ? 'block' : 'none', border: '1px solid rgba(255,255,255,0.06)' }} />
          {status === 'loading' && (
            <div style={{ aspectRatio: '4 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', gap: 8 }}>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Laden…
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
