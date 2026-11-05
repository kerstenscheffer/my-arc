// src/modules/business-os/ContentPreview.jsx
//
// Preview-venster van één content-item (1 nov 2026). Opent via de knop
// 'Bekijk' in de contentkalender, het Content-paneel en het Autopilot-paneel,
// of direct via de deeplink #business-os:content=<id> (contentLink in
// contentStatusData.js; BusinessOS.jsx luistert naar de hash). Laadt het item
// zelf op id, zodat de link ook werkt als Business OS nog dicht was.
//
// Toont: video (privé preview via ondertekende URL van 1 uur, cover als
// poster), hook, caption met comment-woord, gepland moment, stand, bronreel +
// cijfer uit notes. Talking heads zonder video: script, hook en CTA.
// Acties = die van het Autopilot-paneel: Goedkeuren (met video of privé
// preview), Aanpassen (hook → Gino maakt nieuwe), Overslaan, Test (container
// bij Instagram zonder plaatsen). Niets publiceert hier: goedkeuren zet alleen
// de status, instagram-publiceer plaatst op het geplande moment. Na plaatsen:
// knop Instagram met de permalink.

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from '../../client/paginaPortal'
import { Check, X, Pencil, Link2, ExternalLink, FlaskConical } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import { metStand, contentLink, isTestItem, testInstagram, CONTENT_GEWIJZIGD, kortGetal } from './contentStatusData'
import { StandChip } from './contentStatus'
import { typeLabel } from './contentStand'

const G = colors.success
const PREVIEW_BUCKET = 'content-varianten'
const KOLOMMEN = 'id, title, hook, script, notes, edit_notes, type, status, planned_date, planned_time, posted_at, ig_media_id, autopilot_status, autopilot_woord, autopilot_video, autopilot_cover, autopilot_bestand, autopilot_caption, autopilot_fout, autopilot_preview, autopilot_bron'
const LABEL = { concept: 'Concept', wacht: 'Wacht op jou', hook_aanpassen: 'Gino maakt nieuwe hook', goedgekeurd: 'Ingepland', bezig: 'Wordt geplaatst', publiceert: 'Wordt geplaatst', fout: 'Mislukt', gepubliceerd: 'Online', overgeslagen: 'Overgeslagen' }
const publiek = (pad) => (pad ? supabase.storage.from('content-autopilot').getPublicUrl(pad).data.publicUrl : null)
const coverVan = (pad) => pad.replace(/variant\.mp4$/, 'cover.jpg')
const lokaal = (it) => (import.meta.env.DEV && it.autopilot_bestand ? `/@fs${it.autopilot_bestand}` : null)
const moment = (it) => {
  if (!it.planned_date) return 'Nog geen moment'
  const d = new Date(`${it.planned_date}T12:00:00Z`)
  return `${d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })} · ${it.planned_time || 'geen tijd'}`
}
// CTA van een talking head: regel uit het script die met CTA begint, anders de caption.
const ctaVan = (it) => {
  const regel = String(it.script || '').split('\n').find(r => /^\s*cta\b/i.test(r))
  return regel ? regel.replace(/^\s*cta\s*[:-]?\s*/i, '') : (it.autopilot_caption || null)
}

export default function ContentPreview({ id, onSluit, isMobile = false }) {
  const [it, setIt] = useState(null)
  const [fout, setFout] = useState(null)
  const [urls, setUrls] = useState({})
  const [bron, setBron] = useState(null)
  const [bewerk, setBewerk] = useState(null) // hook-tekst tijdens aanpassen
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState(null)

  const laad = useCallback(async () => {
    const { data, error } = await supabase.from('content_items').select(KOLOMMEN).eq('id', id).maybeSingle()
      .then(r => r, e => ({ error: e }))
    if (error || !data || isTestItem(data)) { setFout('Deze post bestaat niet (meer) of je hebt er geen toegang toe.'); return }
    const [rij] = await metStand(supabase, [data])
    setIt(rij)
    const [u, b] = await Promise.all([
      rij.autopilot_preview && !rij.autopilot_video
        ? supabase.storage.from(PREVIEW_BUCKET).createSignedUrls([rij.autopilot_preview, coverVan(rij.autopilot_preview)], 3600).then(r => r, () => ({ data: [] }))
        : { data: [] },
      rij.autopilot_bron
        ? supabase.from('content_ig_media').select('dag, views, comments, tekst, woord').eq('id', rij.autopilot_bron).maybeSingle().then(r => r, () => ({ data: null }))
        : { data: null },
    ])
    setUrls(Object.fromEntries((u.data || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl])))
    setBron(b.data || null)
  }, [id])

  useEffect(() => { setIt(null); setFout(null); setBewerk(null); setMelding(null); laad() }, [laad])

  useEffect(() => {
    const op = (e) => { if (e.key === 'Escape') onSluit?.() }
    window.addEventListener('keydown', op)
    return () => window.removeEventListener('keydown', op)
  }, [onSluit])

  const zet = async (velden, tekst) => {
    setBezig(true)
    const { error } = await supabase.from('content_items').update({ ...velden, updated_at: new Date().toISOString() }).eq('id', id)
      .then(r => r, e => ({ error: e }))
    setBezig(false)
    if (error) { setMelding('Opslaan lukte niet.'); return }
    setMelding(tekst)
    setBewerk(null)
    window.dispatchEvent(new Event(CONTENT_GEWIJZIGD))
    laad()
  }

  const doeTest = async () => {
    setMelding('Test loopt, kan een minuut duren…')
    setMelding(await testInstagram(supabase, id))
  }

  const kopieer = async () => {
    try { await navigator.clipboard.writeText(contentLink(id)); setMelding('Link gekopieerd') } catch { setMelding(contentLink(id)) }
  }

  const st = it?.autopilot_status
  const autopilot = !!st
  const video = it && (publiek(it.autopilot_video) || urls[it.autopilot_preview] || lokaal(it))
  const poster = it && (publiek(it.autopilot_cover) || (it.autopilot_preview && urls[coverVan(it.autopilot_preview)]) || undefined)
  const heeftVideo = !!(it?.autopilot_video || it?.autopilot_preview)
  const kanGoed = autopilot && ['wacht', 'fout'].includes(st)
  const kanTest = autopilot && heeftVideo && ['wacht', 'goedgekeurd', 'fout'].includes(st)
  const kanOver = autopilot && ['wacht', 'goedgekeurd', 'fout', 'hook_aanpassen', 'concept'].includes(st)
  // Zelfde als het paneel: bij een klare variant maakt Gino een nieuwe hook;
  // bij een concept of talking head bewaren we alleen de hook.
  const nieuweHook = autopilot && ['wacht', 'goedgekeurd', 'fout'].includes(st)
  const kanAanpassen = nieuweHook || !autopilot || st === 'concept'
  const cta = it && !video ? ctaVan(it) : null

  const blok = (kop, tekst, extra) => tekst ? (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>{kop}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#fff', marginTop: 4, ...extra }}>{tekst}</div>
    </div>
  ) : null

  return createPortal(
    <div onClick={onSluit} style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24,
    }}>
      <div role="dialog" aria-label="Preview van de post" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 900, maxHeight: isMobile ? '100%' : '92vh', background: '#050806',
        border: isMobile ? 'none' : `1px solid ${G}33`, borderRadius: isMobile ? 0 : 18, boxShadow: `0 0 50px ${G}14`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#fff',
        paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>Bekijk post</div>
          {it?.stand && <StandChip stand={it.stand} views={it.views} />}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={kopieer} title="Kopieer de link naar deze preview" style={{ ...actie, padding: '6px 10px' }}>
            <Link2 size={13} strokeWidth={2.8} /> Link
          </button>
          <button type="button" onClick={onSluit} aria-label="Sluiten" style={rond}><X size={16} strokeWidth={2.6} /></button>
        </div>

        {fout && <div style={{ padding: 20, fontSize: 13, fontWeight: 700 }}>{fout}</div>}
        {!fout && !it && (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'cp-draai 1.2s linear infinite' }} />
            <style>{'@keyframes cp-draai { to { transform: rotate(360deg) } }'}</style>
          </div>
        )}

        {it && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20, padding: 16 }}>
            {(video || autopilot) && (
              <div style={{ position: 'relative', width: isMobile ? '100%' : 300, maxWidth: isMobile ? 340 : 300, alignSelf: 'center', flexShrink: 0, aspectRatio: '9 / 16', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
                {video
                  ? <video key={video} src={video} poster={poster} controls playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', fontSize: 18, fontWeight: 900, lineHeight: 1.25 }}>
                      {it.hook || it.title}
                      <span style={{ position: 'absolute', bottom: 12, left: 0, right: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Nog geen video</span>
                    </div>
                  )}
                {it.autopilot_woord && (
                  <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', borderRadius: 999, background: G, color: '#000', fontSize: 10.5, fontWeight: 900, letterSpacing: '.08em' }}>{it.autopilot_woord}</span>
                )}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: G }}>
                {moment(it)}{st ? ` · ${LABEL[st] || st}` : ''}{it.type ? ` · ${typeLabel(it.type, it.autopilot_woord)}` : ''}
              </div>
              {bewerk != null ? (
                <textarea value={bewerk} onChange={e => setBewerk(e.target.value)} rows={3} autoFocus style={{
                  width: '100%', boxSizing: 'border-box', marginTop: 8, resize: 'vertical', fontFamily: 'inherit', fontSize: 16, fontWeight: 800,
                  color: '#fff', background: 'rgba(255,255,255,0.06)', border: `1px solid ${G}66`, borderRadius: 10, padding: 10,
                }} />
              ) : (
                <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.25, marginTop: 6 }}>{it.hook || it.title}</div>
              )}
              {it.hook && it.title && it.title !== it.hook && <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{it.title}</div>}

              {!it.autopilot_video && it.autopilot_preview && (
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                  {st === 'goedgekeurd' ? `Ingepland: gaat ${moment(it)} vanzelf op Instagram.` : st === 'gepubliceerd' ? 'Staat op Instagram.' : 'Privé preview. Pas na Goedkeuren geplaatst.'}
                </div>
              )}
              {it.autopilot_fout && <div style={{ fontSize: 12, fontWeight: 700, color: '#ff6b6b', marginTop: 8 }}>{it.autopilot_fout}</div>}

              {video && blok('Caption', it.autopilot_caption)}
              {!video && blok('Script', it.script)}
              {!video && blok('CTA', cta)}
              {it.autopilot_woord && !it.autopilot_caption && blok('Comment-woord', it.autopilot_woord)}
              {!video && blok('Editnotities', it.edit_notes)}

              {(bron || it.autopilot_bron) && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Bronreel</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, lineHeight: 1.45 }}>
                    {bron ? (
                      <>
                        {new Date(`${bron.dag}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {bron.woord ? ` · ${bron.woord}` : ''} · {kortGetal(bron.views || 0)} views · {bron.comments ?? 0} comments
                        {bron.views > 0 && bron.comments != null && <span style={{ color: G }}> · {(bron.comments / bron.views * 1000).toFixed(1).replace('.', ',')} per 1.000</span>}
                        {bron.tekst && <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{String(bron.tekst).split('\n')[0].slice(0, 140)}</div>}
                      </>
                    ) : `Reel ${it.autopilot_bron}`}
                  </div>
                </div>
              )}
              {blok('Waarom deze post', it.notes, { fontSize: 12.5, color: 'rgba(255,255,255,0.75)' })}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18, paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0 }}>
                {bewerk != null ? (
                  <>
                    <button type="button" disabled={bezig || !bewerk.trim()}
                      onClick={() => zet(nieuweHook ? { hook: bewerk.trim(), autopilot_status: 'hook_aanpassen', status: 'idea' } : { hook: bewerk.trim() }, nieuweHook ? 'Gino maakt een nieuwe hook' : 'Hook bewaard')}
                      style={{ ...actie, background: G, color: '#000', borderColor: G }}>
                      <Check size={14} strokeWidth={3} /> Opslaan
                    </button>
                    <button type="button" onClick={() => setBewerk(null)} style={actie}>Terug</button>
                  </>
                ) : (
                  <>
                    {kanGoed && (
                      <button type="button" disabled={bezig || !heeftVideo}
                        title={heeftVideo ? 'Goedkeuren: gaat op het geplande moment vanzelf op Instagram' : 'Kan pas als Gino de video heeft geüpload'}
                        onClick={() => zet({ autopilot_status: 'goedgekeurd', status: 'planned', autopilot_fout: null }, 'Ingepland')}
                        style={{ ...actie, background: heeftVideo ? G : 'transparent', color: heeftVideo ? '#000' : 'rgba(255,255,255,0.4)', borderColor: heeftVideo ? G : 'rgba(255,255,255,0.15)' }}>
                        <Check size={14} strokeWidth={3} /> Goedkeuren
                      </button>
                    )}
                    {it.permalink && (
                      <a href={it.permalink} target="_blank" rel="noreferrer" style={{ ...actie, textDecoration: 'none' }}>
                        <ExternalLink size={13} strokeWidth={2.8} /> Instagram
                      </a>
                    )}
                    {kanTest && (
                      <button type="button" disabled={bezig} onClick={doeTest} title="Test bij Instagram zonder te plaatsen" style={actie}>
                        <FlaskConical size={13} strokeWidth={2.8} /> Test
                      </button>
                    )}
                    {kanAanpassen && (
                      <button type="button" disabled={bezig} onClick={() => setBewerk(it.hook || '')} style={actie}>
                        <Pencil size={13} strokeWidth={2.8} /> Aanpassen
                      </button>
                    )}
                    {kanOver && (
                      <button type="button" disabled={bezig} onClick={() => zet({ autopilot_status: 'overgeslagen' }, 'Overgeslagen')} style={actie}>
                        <X size={14} strokeWidth={3} /> Overslaan
                      </button>
                    )}
                  </>
                )}
              </div>
              {kanGoed && !heeftVideo && (
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Goedkeuren kan zodra Gino de video na jouw akkoord heeft geüpload.</div>
              )}
              {melding && <div style={{ fontSize: 12, fontWeight: 800, color: G, marginTop: 8, wordBreak: 'break-all' }}>{melding}</div>}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

const rond = {
  width: 32, height: 32, borderRadius: '50%', border: `1px solid ${G}44`, background: 'transparent', color: '#fff',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
}
const actie = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, padding: '0 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 900,
}
