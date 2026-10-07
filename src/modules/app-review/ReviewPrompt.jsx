// src/modules/app-review/ReviewPrompt.jsx
//
// "Hoe bevalt MY ARC?" — vijf sterren, midden in het scherm. Vier of vijf
// sterren: door naar de echte winkelbeoordeling (iOS/Android via het
// native review-venster, op het web de winkelpagina). Drie of minder: wat
// kan beter, en dat landt als feedback bij de coach.
//
// Wanneer we het vragen: account minstens een week oud, minstens drie
// trainingen met gelogde sets in de laatste dertig dagen, niet eerder dan
// negentig dagen na de vorige vraag, en nooit meer na een winkelbeoordeling.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Star, X } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { APP_STORE_URL, PLAY_STORE_URL } from '../app-update/appVersie'

const DAG = 86400000
const nl = (d) => new Date(d).getTime()

export default function ReviewPrompt({ db, client }) {
  const [open, setOpen] = useState(false)
  const [rijId, setRijId] = useState(null)
  const [sterren, setSterren] = useState(0)
  const [stap, setStap] = useState('sterren') // sterren | winkel | feedback | klaar
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const platform = Capacitor.getPlatform()

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    const t = setTimeout(async () => {
      try {
        // Lokale rem: nooit twee keer in dezelfde week, ook als de server traag is.
        try { if (Number(localStorage.getItem('myarc_review_laatst') || 0) > Date.now() - 7 * DAG) return } catch { /* geen opslag */ }
        if (client.created_at && Date.now() - nl(client.created_at) < 7 * DAG) return
        const { data: eerder } = await db.supabase.from('app_review_prompts').select('asked_at, naar_winkel, stars')
          .eq('client_id', client.id).order('asked_at', { ascending: false }).limit(1).then(r => r, () => ({ data: [] }))
        const vorige = eerder?.[0]
        if (vorige) {
          if (vorige.naar_winkel) return
          if (Date.now() - nl(vorige.asked_at) < 90 * DAG) return
        }
        const vanaf = new Date(Date.now() - 30 * DAG).toISOString().slice(0, 10)
        const { data: sessies } = await db.supabase.from('workout_sessions').select('id').eq('client_id', client.id).gte('workout_date', vanaf)
          .then(r => r, () => ({ data: [] }))
        const ids = (sessies || []).map(s => s.id)
        if (ids.length < 3) return
        const { data: sets } = await db.supabase.from('workout_progress').select('session_id').in('session_id', ids).then(r => r, () => ({ data: [] }))
        const metSets = new Set((sets || []).map(x => x.session_id))
        if (metSets.size < 3) return
        if (weg) return
        const { data: rij } = await db.supabase.from('app_review_prompts').insert({ client_id: client.id, platform }).select('id').single().then(r => r, () => ({ data: null }))
        try { localStorage.setItem('myarc_review_laatst', String(Date.now())) } catch { /* geen opslag */ }
        setRijId(rij?.id || null)
        setOpen(true)
      } catch (e) { console.warn('review-vraag overgeslagen:', e?.message) }
    }, 4000)
    return () => { weg = true; clearTimeout(t) }
  }, [client?.id, client?.created_at, db, platform])

  const bewaar = async (velden) => {
    if (!rijId || !db?.supabase) return
    await db.supabase.from('app_review_prompts').update(velden).eq('id', rijId).then(r => r, () => null)
  }

  const kies = async (n) => {
    setSterren(n)
    if (navigator.vibrate) navigator.vibrate(10)
    await bewaar({ stars: n })
    setStap(n >= 4 ? 'winkel' : 'feedback')
  }

  const naarWinkel = async () => {
    setBezig(true)
    try {
      await bewaar({ naar_winkel: true })
      if (Capacitor.isNativePlatform()) {
        const { AppReview } = await import('@capawesome/capacitor-app-review')
        try { await AppReview.requestReview() } catch { await AppReview.openAppStore({ appId: '6764539959' }).catch(() => null) }
      } else {
        const ios = /iPhone|iPad|Macintosh/i.test(navigator.userAgent)
        window.open(ios ? APP_STORE_URL : PLAY_STORE_URL, '_blank', 'noopener')
      }
    } finally { setBezig(false); setStap('klaar'); setTimeout(() => setOpen(false), 1200) }
  }

  const stuurFeedback = async () => {
    if (!tekst.trim()) { setOpen(false); return }
    setBezig(true)
    try {
      await bewaar({ feedback: tekst.trim() })
      await db.supabase.from('client_feedback').insert({
        client_id: client.id,
        client_name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Onbekend',
        type: 'app_review', message: `${sterren} van 5 sterren · ${tekst.trim()}`, page: 'review', status: 'new',
      }).then(r => r, () => null)
    } finally { setBezig(false); setStap('klaar'); setTimeout(() => setOpen(false), 1400) }
  }

  const sluit = async () => { await bewaar({ dismissed: true }); setOpen(false) }
  if (!open) return null

  const primair = {
    width: '100%', minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a',
    fontSize: '0.92rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const kaal = { ...primair, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', minHeight: 40 }

  return createPortal(
    <div onClick={sluit} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: isMobile ? '1.3rem 1.1rem 1.2rem' : '1.5rem 1.4rem 1.4rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', textAlign: 'center', position: 'relative' }}>
        <button onClick={sluit} aria-label="Sluit" style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, padding: 0, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} strokeWidth={2.6} /></button>

        {stap === 'sterren' && (
          <>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>Hoe bevalt MY ARC?</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>Eén tik, meer vragen we niet.</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => kies(n)} aria-label={`${n} sterren`} style={{ width: 52, height: 52, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <Star size={38} strokeWidth={1.8} color="#fff" fill={n <= sterren ? '#fff' : 'transparent'} />
                </button>
              ))}
            </div>
          </>
        )}

        {stap === 'winkel' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 12 }}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={22} strokeWidth={1.8} color="#fff" fill={n <= sterren ? '#fff' : 'transparent'} />)}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>Fijn om te horen</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 18, lineHeight: 1.45 }}>Wil je dit ook in de {platform === 'android' ? 'Play Store' : 'App Store'} achterlaten? Het kost je een paar seconden en helpt ons enorm.</div>
            <button onClick={naarWinkel} disabled={bezig} style={primair}>{bezig ? 'Bezig…' : 'Ja, beoordelen'}</button>
            <button onClick={sluit} style={kaal}>Nee, bedankt</button>
          </>
        )}

        {stap === 'feedback' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 12 }}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={22} strokeWidth={1.8} color="#fff" fill={n <= sterren ? '#fff' : 'transparent'} />)}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>Wat kan beter?</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>Dit gaat rechtstreeks naar je coach.</div>
            <textarea value={tekst} onChange={e => setTekst(e.target.value)} rows={3} placeholder="Bijvoorbeeld: het loggen van sets duurt te lang…" style={{ width: '100%', boxSizing: 'border-box', resize: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit', padding: '0.7rem 0.8rem', outline: 'none', marginBottom: 12 }} />
            <button onClick={stuurFeedback} disabled={bezig} style={primair}>{bezig ? 'Bezig…' : 'Versturen'}</button>
            <button onClick={sluit} style={kaal}>Liever niet</button>
          </>
        )}

        {stap === 'klaar' && (
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Dankjewel</div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
