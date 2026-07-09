// src/modules/results/components/TrajectPdfTab.jsx
// Eind-van-traject-PDF genereren: kies klant (via prop), kies zelf de foto's per
// hoek (Start/Nu), typ de teksten, klik genereer → HTML→print→PDF.
import { useState, useEffect } from 'react'
import { FileText, Loader } from 'lucide-react'
import TrajectPDFService from '../TrajectPDFService'
import { openTrajectForPrint } from '../trajectPdfGenerator'

const GOLD = '#FFD700'
const ANGLES = [
  { key: 'back', label: 'Back' },
  { key: 'side', label: 'Side' },
  { key: 'front', label: 'Front (ook cover)' },
]

const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return '' }
}

function AnglePicker({ label, photos, sel, onPick }) {
  if (!photos?.length) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Geen foto's voor deze hoek.</div>
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
        {photos.map(p => {
          const isBefore = sel?.before === p.id
          const isAfter = sel?.after === p.id
          const active = isBefore || isAfter
          return (
            <div key={p.id} style={{ flexShrink: 0, width: 92 }}>
              <div style={{ position: 'relative', width: 92, height: 115, borderRadius: 10, overflow: 'hidden', border: active ? `2px solid ${GOLD}` : '2px solid rgba(255,255,255,0.1)', background: '#111' }}>
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {active && (
                  <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 10, fontWeight: 800, color: '#000', background: GOLD, padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>
                    {isBefore ? 'Start' : 'Nu'}
                  </span>
                )}
                <span style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 9, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: 5 }}>{fmtDate(p.date)}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                <button onClick={() => onPick('before', p.id)} style={pickBtn(isBefore)}>Start</button>
                <button onClick={() => onPick('after', p.id)} style={pickBtn(isAfter)}>Nu</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const pickBtn = (on) => ({
  flex: 1, minHeight: 26, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800,
  background: on ? GOLD : 'rgba(255,255,255,0.1)', color: on ? '#000' : 'rgba(255,255,255,0.7)', touchAction: 'manipulation',
})

const textareaStyle = { width: '100%', boxSizing: 'border-box', padding: '0.9rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: 15, lineHeight: 1.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 20 }
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }
const optHint = { color: 'rgba(255,255,255,0.4)', fontWeight: 500 }

export default function TrajectPdfTab({ client, db }) {
  const [coverText, setCoverText] = useState('')
  const [introText, setIntroText] = useState('')
  const [photoText, setPhotoText] = useState('')
  const [journeyText, setJourneyText] = useState('')
  const [workoutText, setWorkoutText] = useState('')
  const [coachText, setCoachText] = useState('')
  const [planText, setPlanText] = useState('')
  const [options, setOptions] = useState(null)      // { front:[], side:[], back:[] }
  const [selection, setSelection] = useState({})    // { front:{before,after}, ... }
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [loading, setLoading] = useState(false)

  // Foto-opties laden + standaardkeuze (eerste = Start, laatste = Nu).
  useEffect(() => {
    let cancelled = false
    if (!client?.id || !db?.supabase) { setOptions(null); setSelection({}); return }
    setLoadingPhotos(true)
    ;(async () => {
      try {
        const opts = await new TrajectPDFService(db.supabase).getPhotoOptions(client.id)
        if (cancelled) return
        const defSel = {}
        for (const { key } of ANGLES) {
          const arr = opts[key] || []
          if (arr.length) defSel[key] = { before: arr[0].id, after: arr.length >= 2 ? arr[arr.length - 1].id : arr[0].id }
        }
        setOptions(opts); setSelection(defSel)
      } catch (e) { console.error('Foto-opties laden mislukt:', e); if (!cancelled) setOptions({ front: [], side: [], back: [] }) }
      finally { if (!cancelled) setLoadingPhotos(false) }
    })()
    return () => { cancelled = true }
  }, [client?.id, db])

  const pick = (angle, which, id) => setSelection(s => ({ ...s, [angle]: { ...(s[angle] || {}), [which]: id } }))

  const generate = async () => {
    if (!client?.id) return
    setLoading(true)
    try {
      const svc = new TrajectPDFService(db.supabase)
      const data = await svc.getTrajectData(client.id, selection)
      openTrajectForPrint(data, {
        clientName: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Klant',
        coverText,
        introText,
        photoText,
        journeyText,
        workoutText,
        coachText,
        planText,
      })
    } catch (e) {
      console.error('Traject-PDF mislukt:', e)
      alert('PDF maken mislukt: ' + (e.message || 'onbekende fout'))
    } finally { setLoading(false) }
  }

  if (!client) {
    return <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Kies eerst een klant links.</div>
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Traject-PDF</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: '4px 0 6px' }}>Eind-van-traject rapport</h2>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
        Voor <strong style={{ color: '#fff' }}>{client.first_name} {client.last_name}</strong>. Kies hieronder per hoek de Start- en Nu-foto,
        vul de teksten in en genereer. Gewicht en kracht worden automatisch opgehaald.
      </p>

      {/* Fotokiezer */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 14, padding: '1rem', marginBottom: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Kies de foto's</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>Per hoek: tik <strong style={{ color: GOLD }}>Start</strong> voor de beginfoto en <strong style={{ color: GOLD }}>Nu</strong> voor de eindfoto. De Front-keuze wordt ook de cover.</div>
        {loadingPhotos && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Foto's laden…</div>}
        {!loadingPhotos && options && ANGLES.map(a => (
          <AnglePicker key={a.key} label={a.label} photos={options[a.key]} sel={selection[a.key]} onPick={(which, id) => pick(a.key, which, id)} />
        ))}
        {!loadingPhotos && options && !ANGLES.some(a => options[a.key]?.length) && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Deze klant heeft nog geen voortgangsfoto's.</div>
        )}
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Berichten per pagina</div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>Elk bericht komt als "Bericht van Kersten" (met je foto) op die pagina. Leeg = geen bericht op die pagina.</div>

      <label style={labelStyle}>Cover <span style={optHint}>(optioneel)</span></label>
      <textarea value={coverText} onChange={e => setCoverText(e.target.value)} rows={3}
        placeholder="Kort welkomstwoord op de voorpagina…" style={textareaStyle} />

      <label style={labelStyle}>Inleiding <span style={optHint}>(optioneel)</span></label>
      <textarea value={introText} onChange={e => setIntroText(e.target.value)} rows={3}
        placeholder="Bericht bij de inleiding-pagina…" style={textareaStyle} />

      <label style={labelStyle}>Foto- & gewichtsprogressie <span style={optHint}>(optioneel)</span></label>
      <textarea value={photoText} onChange={e => setPhotoText(e.target.value)} rows={4}
        placeholder="Wat je opviel aan de foto's en het gewichtsverloop…" style={textareaStyle} />

      <label style={labelStyle}>Krachtprogressie <span style={optHint}>(optioneel)</span></label>
      <textarea value={workoutText} onChange={e => setWorkoutText(e.target.value)} rows={4}
        placeholder="Bijv. wat je opviel aan de krachtprogressie, sterke punten en waar je trots op bent…" style={textareaStyle} />

      <label style={labelStyle}>Voedingsprogressie / jouw verhaal <span style={optHint}>(optioneel)</span></label>
      <textarea value={journeyText} onChange={e => setJourneyText(e.target.value)} rows={6}
        placeholder="Hoe kwam de klant binnen, welke punten waren lastig, en wat hebben jullie samen bereikt?…" style={textareaStyle} />

      <label style={labelStyle}>Woord van je coach <span style={optHint}>(optioneel)</span></label>
      <textarea value={coachText} onChange={e => setCoachText(e.target.value)} rows={6}
        placeholder="Bijv. wat je van het traject vond, wat de klant heeft laten zien, en wat je meegeeft voor de toekomst…" style={textareaStyle} />

      <label style={labelStyle}>Plan / vooruitzicht <span style={optHint}>(optioneel — komt onder het coach-woord)</span></label>
      <textarea value={planText} onChange={e => setPlanText(e.target.value)} rows={6}
        placeholder="Het nieuwe vooruitzicht voor de klant: doelen, focus en volgende stappen voor de komende periode…" style={textareaStyle} />

      <button onClick={generate} disabled={loading} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '0 1.5rem',
        borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
        background: loading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${GOLD} 0%, #D4AF37 100%)`,
        color: loading ? 'rgba(255,255,255,0.5)' : '#000',
        boxShadow: loading ? 'none' : '0 6px 18px rgba(255,215,0,0.22)',
      }}>
        {loading ? <Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={17} />}
        {loading ? 'Genereren…' : 'Genereer PDF'}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
