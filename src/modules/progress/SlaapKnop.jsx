// src/modules/progress/SlaapKnop.jsx
//
// Zwevende knop links op de tracking-pagina waarmee je je nacht logt. Tikken
// opent een blad dat van onderen omhoog schuift.
//
// Waarom een zwevende knop en niet een blok in de pagina: je logt je nacht
// 's ochtends, meteen als je de app opent. Moet je daar eerst een halve pagina
// voor scrollen, dan gebeurt het één keer en daarna niet meer. Zelfde gedachte
// als de waterfles op de maaltijdpagina.
//
// Wat we vragen en waarom in deze volgorde: eerst hoe laat je naar bed ging en
// hoe laat je opstond — dat weet je nog. De uren rekenen we daaruit voor (je
// mag ze overschrijven, want wakker liggen telt niet mee). Daarna het cijfer,
// want dat is het getal waar de coach op stuurt: acht uur slecht slapen zegt
// meer dan zeven uur goed.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Moon, X, Check } from 'lucide-react'

const vandaagIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Uren tussen twee kloktijden, over middernacht heen.
const urenTussen = (bed, op) => {
  if (!bed || !op) return null
  const [bu, bm] = bed.split(':').map(Number)
  const [ou, om] = op.split(':').map(Number)
  if ([bu, bm, ou, om].some(n => !Number.isFinite(n))) return null
  let minuten = (ou * 60 + om) - (bu * 60 + bm)
  if (minuten <= 0) minuten += 24 * 60
  return Math.round((minuten / 60) * 10) / 10
}

const veld = {
  width: '100%', minHeight: 46, padding: '0 0.75rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12, color: '#fff', fontSize: '0.95rem', fontWeight: 800,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

const kopje = {
  fontSize: '0.56rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 6,
}

export default function SlaapKnop({ client, db, isMobile = false, onderMarge = 96, onOpgeslagen }) {
  const [open, setOpen] = useState(false)
  const [bed, setBed] = useState('23:00')
  const [opstaan, setOpstaan] = useState('07:00')
  const [uren, setUren] = useState('')
  const [urenAangeraakt, setUrenAangeraakt] = useState(false)
  const [kwaliteit, setKwaliteit] = useState(null)
  const [struggles, setStruggles] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [alGelogd, setAlGelogd] = useState(false)

  // Al gelogd vannacht? Dan kleurt de knop groen en vult het blad zich met wat
  // er staat, zodat je 'm bijwerkt in plaats van er een tweede naast te zetten.
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    db.supabase
      .from('sleep_logs')
      .select('id, bedtime, wake_time, hours_slept, quality, struggles')
      .eq('client_id', client.id)
      .eq('log_date', vandaagIso())
      .maybeSingle()
      .then(({ data }) => {
        if (weg || !data) return
        setAlGelogd(true)
        if (data.bedtime) setBed(String(data.bedtime).slice(0, 5))
        if (data.wake_time) setOpstaan(String(data.wake_time).slice(0, 5))
        if (data.hours_slept != null) { setUren(String(data.hours_slept)); setUrenAangeraakt(true) }
        if (data.quality != null) setKwaliteit(Number(data.quality))
        if (data.struggles) setStruggles(data.struggles)
      })
    return () => { weg = true }
  }, [db, client?.id])

  const berekend = useMemo(() => urenTussen(bed, opstaan), [bed, opstaan])
  const urenWaarde = urenAangeraakt && uren !== '' ? parseFloat(String(uren).replace(',', '.')) : berekend

  const bewaar = async () => {
    if (!db?.supabase || !client?.id) return
    setBezig(true); setFout(null)
    try {
      const rij = {
        client_id: client.id,
        log_date: vandaagIso(),
        bedtime: bed || null,
        wake_time: opstaan || null,
        hours_slept: Number.isFinite(urenWaarde) ? urenWaarde : null,
        quality: kwaliteit,
        struggles: struggles.trim() || null,
      }
      // Eén nacht per dag: bestaat er al een rij van vandaag, dan werken we die
      // bij in plaats van er een tweede naast te zetten.
      const { data: bestaand } = await db.supabase
        .from('sleep_logs').select('id')
        .eq('client_id', client.id).eq('log_date', rij.log_date).maybeSingle()

      const { error } = bestaand?.id
        ? await db.supabase.from('sleep_logs').update(rij).eq('id', bestaand.id)
        : await db.supabase.from('sleep_logs').insert(rij)
      if (error) throw error

      setAlGelogd(true)
      setOpen(false)
      onOpgeslagen?.()
    } catch (e) {
      console.error('Slaap opslaan mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
    } finally {
      setBezig(false)
    }
  }

  if (!client?.id) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Slaap loggen"
        aria-label="Slaap loggen"
        style={{
          position: 'fixed',
          left: isMobile ? 10 : 16,
          bottom: `calc(${onderMarge}px + env(safe-area-inset-bottom, 0px))`,
          zIndex: 95,
          width: 48, height: 48, padding: 0, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${alGelogd ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.14)'}`,
          color: alGelogd ? '#10b981' : '#fff',
          cursor: 'pointer',
          boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Moon size={20} strokeWidth={2.4} />
      </button>

      {open && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483100,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 520, maxHeight: '92dvh', overflowY: 'auto',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '18px 18px 0 0',
              padding: '0.9rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
              animation: 'slaapOmhoog 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <Moon size={17} color="#fff" strokeWidth={2.4} />
              <span style={{ flex: 1, fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                Je nacht
              </span>
              <button onClick={() => setOpen(false)} aria-label="Sluiten" style={{
                width: 30, height: 30, padding: 0, background: 'transparent', border: 'none',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: '0.9rem' }}>
              <div style={{ flex: 1 }}>
                <div style={kopje}>Naar bed</div>
                <input type="time" value={bed} onChange={e => setBed(e.target.value)} style={veld} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={kopje}>Opgestaan</div>
                <input type="time" value={opstaan} onChange={e => setOpstaan(e.target.value)} style={veld} />
              </div>
            </div>

            <div style={{ marginBottom: '0.9rem' }}>
              <div style={kopje}>Uren geslapen</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" inputMode="decimal" step="0.5"
                  value={urenAangeraakt ? uren : (berekend ?? '')}
                  onChange={e => { setUren(e.target.value); setUrenAangeraakt(true) }}
                  style={{ ...veld, width: 100 }}
                />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                  {urenAangeraakt && berekend != null && urenWaarde !== berekend
                    ? `tussen bed en opstaan zit ${berekend} uur`
                    : 'uitgerekend uit de tijden — pas aan als je wakker lag'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '0.9rem' }}>
              <div style={kopje}>Hoe voelde het? 1 = slecht, 10 = top</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                  const aan = kwaliteit === n
                  return (
                    <button
                      key={n}
                      onClick={() => setKwaliteit(aan ? null : n)}
                      style={{
                        flex: 1, minHeight: 40, borderRadius: 9,
                        background: aan ? '#fff' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.09)'}`,
                        color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                        fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
                        cursor: 'pointer', padding: 0,
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={kopje}>Wat ging er mis of juist goed?</div>
              <textarea
                value={struggles}
                onChange={e => setStruggles(e.target.value)}
                placeholder="Laat opgebleven, kind wakker, telefoon weggelegd…"
                rows={2}
                style={{ ...veld, minHeight: 64, padding: '0.6rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, resize: 'vertical' }}
              />
            </div>

            {fout && (
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.6rem' }}>
                {fout}
              </div>
            )}

            <button
              onClick={bewaar}
              disabled={bezig}
              style={{
                width: '100%', minHeight: 48, borderRadius: 12, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#fff', color: '#0a0a0a',
                fontSize: '0.88rem', fontWeight: 900, letterSpacing: '-0.01em',
                cursor: bezig ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: bezig ? 0.6 : 1,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Check size={16} strokeWidth={3} />
              {bezig ? 'Opslaan…' : alGelogd ? 'Bijwerken' : 'Opslaan'}
            </button>

            <style>{`
              @keyframes slaapOmhoog { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
