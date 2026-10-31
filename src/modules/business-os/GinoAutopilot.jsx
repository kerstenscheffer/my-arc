// src/modules/business-os/GinoAutopilot.jsx
//
// Content-autopilot wachtrij (31 okt 2026). Varianten van winnende magnet-
// reels die Gino maakte (scripts/content-autopilot.mjs) staan als content_items
// met autopilot_status. Per variant: video-preview, hook, woord, moment en
// Goedkeuren / Overslaan / Hook aanpassen. Goedgekeurd = de cron
// content_autopilot_publiceer zet hem op het geplande moment op Instagram.
// Schakelaar Automatisch (content_autopilot) staat standaard uit.
// Database: src/modules/business-os/content-autopilot.sql.

import { useCallback, useEffect, useState } from 'react'
import { Check, X, Pencil, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const G = colors.success
const OPEN = ['wacht', 'hook_aanpassen', 'goedgekeurd', 'bezig', 'fout', 'concept']
// concept = Gino's planning zonder video; pas na 'maak' wordt het 'wacht'.
const LABEL = { concept: 'Concept', wacht: 'Wacht op jou', hook_aanpassen: 'Gino maakt nieuwe hook', goedgekeurd: 'Goedgekeurd', bezig: 'Wordt geplaatst', fout: 'Fout', gepubliceerd: 'Online' }
const publiek = (pad) => (pad ? supabase.storage.from('content-autopilot').getPublicUrl(pad).data.publicUrl : null)
// Lokaal gerenderd maar nog niet geüpload: alleen op de dev-server te bekijken
// (vite.config.js staat de bibliotheekmap toe via /@fs).
const lokaal = (it) => (import.meta.env.DEV && it.autopilot_bestand ? `/@fs${it.autopilot_bestand}` : null)
// Kalenderdatum → weekdag zoals in Nederland, los van de tijdzone van het apparaat.
const moment = (it) => {
  if (!it.planned_date) return 'Nog geen moment'
  const d = new Date(`${it.planned_date}T12:00:00Z`)
  return `${d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })} · ${it.planned_time || 'geen tijd'}`
}

export default function GinoAutopilot({ onSluit, isMobile = false }) {
  const [items, setItems] = useState(null)
  const [fout, setFout] = useState(null)
  const [auto, setAuto] = useState(false)
  const [bewerk, setBewerk] = useState(null) // { id, hook }
  const [bezig, setBezig] = useState(null)

  const laad = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const [r, s] = await Promise.all([
      supabase.from('content_items')
        .select('id, title, hook, planned_date, planned_time, autopilot_status, autopilot_woord, autopilot_video, autopilot_cover, autopilot_bestand, autopilot_caption, autopilot_fout, posted_at')
        .in('autopilot_status', OPEN).order('planned_date').order('planned_time').limit(200)
        .then(x => x, e => ({ error: e })),
      supabase.from('content_autopilot').select('automatisch').eq('eigenaar', user?.id).maybeSingle()
        .then(x => x, e => ({ error: e })),
    ])
    if (r.error) { setFout('De autopilot staat nog niet in de database.'); setItems([]); return }
    setItems(r.data || [])
    setAuto(!!s.data?.automatisch)
  }, [])

  useEffect(() => { laad() }, [laad])

  const zet = async (id, velden) => {
    setBezig(id)
    const { error } = await supabase.from('content_items').update({ ...velden, updated_at: new Date().toISOString() }).eq('id', id)
      .then(x => x, e => ({ error: e }))
    setBezig(null)
    if (error) { setFout('Opslaan lukte niet.'); return }
    laad()
  }

  const wisselAuto = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const nieuw = !auto
    const { error } = await supabase.from('content_autopilot')
      .upsert({ eigenaar: user.id, automatisch: nieuw, updated_at: new Date().toISOString() })
      .then(x => x, e => ({ error: e }))
    if (!error) setAuto(nieuw)
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 6, display: 'flex', flexDirection: 'column', minHeight: 0,
      background: 'rgba(5,8,6,0.96)', border: `1px solid ${G}33`, borderRadius: 16, padding: isMobile ? 12 : 16,
      animation: 'gk-blad .3s ease-out both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, flexShrink: 0 }}>
        <Zap size={16} strokeWidth={2.6} style={{ color: G }} />
        <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Autopilot</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
          {items ? `${items.filter(i => i.autopilot_status === 'wacht').length} wachten op jou · ${items.filter(i => i.autopilot_status === 'concept').length} concepten` : ''}
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={wisselAuto} title="Aan: Gino plaatst ook zonder jouw goedkeuring" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11, fontWeight: 800, color: auto ? G : 'rgba(255,255,255,0.6)',
        }}>
          Automatisch
          <span style={{ width: 30, height: 17, borderRadius: 999, background: auto ? G : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background .2s' }}>
            <span style={{ position: 'absolute', top: 2, left: auto ? 15 : 2, width: 13, height: 13, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
          </span>
        </button>
        <button type="button" onClick={onSluit} aria-label="Autopilot sluiten" style={knop}><X size={15} strokeWidth={2.6} /></button>
      </div>

      {fout && <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', paddingBottom: 10 }}>{fout}</div>}

      <div className="gk-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 150 : 190}px, 1fr))`, gap: 12, alignContent: 'start' }}>
        {items?.length === 0 && !fout && (
          <div style={{ gridColumn: '1 / -1', fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Nog geen varianten. Vraag Gino om de winnende reels van deze week opnieuw te maken.
          </div>
        )}
        {items?.map(it => {
          const video = publiek(it.autopilot_video) || lokaal(it)
          const open = bewerk?.id === it.id
          return (
            <div key={it.id} style={{ border: `1px solid ${it.autopilot_status === 'goedgekeurd' ? G : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', aspectRatio: '9 / 16', background: '#000' }}>
                {video
                  ? <video src={video} poster={publiek(it.autopilot_cover) || undefined} controls playsInline preload="none" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{it.autopilot_status === 'concept' ? 'Nog geen video' : 'Geen video'}</div>}
                {it.autopilot_woord && (
                  <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 999, background: G, color: '#000', fontSize: 10, fontWeight: 900, letterSpacing: '.08em' }}>{it.autopilot_woord}</span>
                )}
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: it.autopilot_status === 'fout' ? '#ff6b6b' : it.autopilot_status === 'concept' ? 'rgba(255,255,255,0.55)' : G }}>{LABEL[it.autopilot_status] || it.autopilot_status} · {moment(it)}</div>
                {open ? (
                  <textarea value={bewerk.hook} onChange={e => setBewerk({ ...bewerk, hook: e.target.value })} rows={3} autoFocus style={{
                    width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
                    color: '#fff', background: 'rgba(255,255,255,0.06)', border: `1px solid ${G}66`, borderRadius: 8, padding: 8,
                  }} />
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{it.hook || it.title}</div>
                )}
                {!it.autopilot_video && it.autopilot_bestand && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Staat alleen lokaal. Na jouw akkoord uploadt Gino hem, dan kun je goedkeuren.</div>
                )}
                {it.autopilot_fout && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{it.autopilot_fout}</div>}
                {it.autopilot_caption && !open && (
                  <details style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 800 }}>Caption</summary>
                    <div style={{ whiteSpace: 'pre-wrap', paddingTop: 4 }}>{it.autopilot_caption}</div>
                  </details>
                )}
                <div style={{ display: 'flex', gap: 6, paddingTop: 2 }}>
                  {open ? (
                    <>
                      <button type="button" disabled={bezig === it.id || !bewerk.hook.trim()} onClick={() => { zet(it.id, { hook: bewerk.hook.trim(), autopilot_status: 'hook_aanpassen', status: 'idea' }); setBewerk(null) }} style={{ ...actie, background: G, color: '#000' }}>
                        <Check size={13} strokeWidth={3} /> Opslaan
                      </button>
                      <button type="button" onClick={() => setBewerk(null)} style={actie}>Terug</button>
                    </>
                  ) : (
                    <>
                      {['wacht', 'fout'].includes(it.autopilot_status) && it.autopilot_video && (
                        <button type="button" disabled={bezig === it.id} onClick={() => zet(it.id, { autopilot_status: 'goedgekeurd', status: 'planned', autopilot_fout: null })} style={{ ...actie, background: G, color: '#000' }}>
                          <Check size={13} strokeWidth={3} /> Goedkeuren
                        </button>
                      )}
                      {['wacht', 'goedgekeurd', 'fout', 'hook_aanpassen', 'concept'].includes(it.autopilot_status) && (
                        <button type="button" disabled={bezig === it.id} onClick={() => zet(it.id, { autopilot_status: 'overgeslagen' })} title="Overslaan" style={actie}>
                          <X size={13} strokeWidth={3} />
                        </button>
                      )}
                      {['wacht', 'goedgekeurd', 'fout'].includes(it.autopilot_status) && (
                        <button type="button" onClick={() => setBewerk({ id: it.id, hook: it.hook || '' })} title="Hook aanpassen" style={actie}>
                          <Pencil size={12} strokeWidth={2.8} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const knop = {
  width: 28, height: 28, borderRadius: '50%', border: `1px solid ${G}44`, background: 'transparent', color: '#fff',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
}
const actie = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 10px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 11.5, fontWeight: 900,
}
