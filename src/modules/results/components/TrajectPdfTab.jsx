// src/modules/results/components/TrajectPdfTab.jsx
// Eind-van-traject-PDF genereren: kies klant (komt binnen via prop), typ een
// afsluitende tekst, klik genereer → HTML→print→PDF.
import { useState } from 'react'
import { FileText, Loader } from 'lucide-react'
import TrajectPDFService from '../TrajectPDFService'
import { openTrajectForPrint } from '../trajectPdfGenerator'

const GOLD = '#FFD700'

export default function TrajectPdfTab({ client, db }) {
  const [journeyText, setJourneyText] = useState('')
  const [coachText, setCoachText] = useState('')
  const [planText, setPlanText] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!client?.id) return
    setLoading(true)
    try {
      const svc = new TrajectPDFService(db.supabase)
      const data = await svc.getTrajectData(client.id)
      openTrajectForPrint(data, {
        clientName: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Klant',
        journeyText,
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
        Voor <strong style={{ color: '#fff' }}>{client.first_name} {client.last_name}</strong>. Bevat automatisch:
        transformatiefoto's (front/side/back), gewichtsprogressie en krachtprogressie per spiergroep (2 meest gedane oefeningen, start → eind).
        De twee tekstvakken hieronder vul je zelf in.
      </p>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
        Voedingsprogressie / jouw verhaal <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>(optioneel)</span>
      </label>
      <textarea
        value={journeyText}
        onChange={e => setJourneyText(e.target.value)}
        placeholder="Hoe kwam de klant binnen, welke punten waren lastig, en wat hebben jullie samen bereikt?…"
        rows={7}
        style={{ width: '100%', boxSizing: 'border-box', padding: '0.9rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: 15, lineHeight: 1.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 20 }}
      />

      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
        Woord van je coach <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>(optioneel)</span>
      </label>
      <textarea
        value={coachText}
        onChange={e => setCoachText(e.target.value)}
        placeholder="Bijv. wat je van het traject vond, wat de klant heeft laten zien, en wat je meegeeft voor de toekomst…"
        rows={6}
        style={{ width: '100%', boxSizing: 'border-box', padding: '0.9rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: 15, lineHeight: 1.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 20 }}
      />

      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
        Plan / vooruitzicht <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>(optioneel — komt onder het coach-woord)</span>
      </label>
      <textarea
        value={planText}
        onChange={e => setPlanText(e.target.value)}
        placeholder="Het nieuwe vooruitzicht voor de klant: doelen, focus en volgende stappen voor de komende periode…"
        rows={6}
        style={{ width: '100%', boxSizing: 'border-box', padding: '0.9rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: 15, lineHeight: 1.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 20 }}
      />

      <button
        onClick={generate}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '0 1.5rem',
          borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
          background: loading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${GOLD} 0%, #D4AF37 100%)`,
          color: loading ? 'rgba(255,255,255,0.5)' : '#000',
          boxShadow: loading ? 'none' : '0 6px 18px rgba(255,215,0,0.22)',
        }}
      >
        {loading ? <Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={17} />}
        {loading ? 'Genereren…' : 'Genereer PDF'}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
