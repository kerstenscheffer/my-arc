// supabase/functions/instagram-publiceer/index.ts
//
// Content-autopilot → Instagram (1 nov 2026), zonder Metricool. Plaatst
// goedgekeurde varianten zelf via de Instagram Content Publishing API
// (Instagram-login, graph.instagram.com). Instagram kan reels niet inplannen,
// dus het inplannen doen wij: pg_cron roept dit elke 10 minuten aan via
// content_autopilot_publiceer() (instagram-publiceer.sql) en wij plaatsen
// zodra planned_date + planned_time (Europe/Amsterdam) voorbij is.
//
// Veiligheidspoort: ALLEEN autopilot_status 'goedgekeurd' (Goedkeuren-knop).
// De schakelaar Automatisch laat Gino varianten klaarzetten, nooit plaatsen.
// Max max_per_dag magnets per dag (eigen posts meegeteld).
//
// Nooit dubbel: vóór de Instagram-call gaat de rij met een voorwaardelijke
// update naar 'bezig' (en vóór media_publish naar 'publiceert'). Alleen wie
// die update wint, praat met Instagram. Valt er halverwege iets weg, dan wordt
// het 'fout' met de vraag eerst op Instagram te kijken; er is geen automatische
// herhaling.
//
//   POST {}                         → cron: plaatsen wat aan de beurt is
//   POST { check: true }            → eigenaar: account + publiceerlimiet
//   POST { dry_run: true, id }      → eigenaar: container maken + status
//                                     volgen, NIET publiceren, rij ongemoeid
//
// Token: Vault meta_ig_token via RPC content_ig_token() (alleen service_role).
// Het token komt nooit in logs, app_fouten of antwoorden.
import { createClient } from 'npm:@supabase/supabase-js@2'

const EIGENAAR = '5a0135ac-3188-499d-8682-ed6a179e5541' // Kersten
const IG = 'https://graph.instagram.com/v21.0/'
const TZ = 'Europe/Amsterdam'
const BUCKET_PREVIEW = 'content-varianten'
const BUCKET_OUD = 'content-autopilot'
const URL_GELDIG = 3600 // ondertekende video/cover-link: 1 uur
const MAX_TE_LAAT_UUR = 12 // later dan dit na het geplande moment: niet meer plaatsen
const POLL_MS = 8000
const POLL_MAX = 11 // ~90 s binnen één aanroep, daarna pakt de volgende cron hem op

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
const slaap = (ms: number) => new Promise((r) => setTimeout(r, ms))

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

type Item = {
  id: string; hook: string | null; title: string | null; planned_date: string | null; planned_time: string | null
  autopilot_status: string | null; autopilot_woord: string | null; autopilot_caption: string | null
  autopilot_video: string | null; autopilot_cover: string | null; autopilot_preview: string | null
  autopilot_container: string | null; autopilot_bestand: string | null; autopilot_bron: string | null; updated_at: string
}
const KOLOMMEN = 'id, hook, title, planned_date, planned_time, autopilot_status, autopilot_woord, autopilot_caption, autopilot_video, autopilot_cover, autopilot_preview, autopilot_container, autopilot_bestand, autopilot_bron, updated_at'

let TOKEN = ''
const schoon = (t: string) => (TOKEN ? t.split(TOKEN).join('[token]') : t).slice(0, 500)

async function ig(pad: string, body?: Record<string, string>) {
  const url = IG + pad + (body ? '' : `${pad.includes('?') ? '&' : '?'}access_token=${TOKEN}`)
  const res = await fetch(url, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...body, access_token: TOKEN }) }
    : undefined)
  const j = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, j, fout: schoon(j?.error?.message || `HTTP ${res.status}`) }
}

const meldFout = (melding: string) => sb.from('app_fouten')
  .insert({ user_id: EIGENAAR, pagina: 'instagram-publiceer', melding: schoon(melding) })
  .then((r) => { if (r.error) console.error('app_fouten', r.error.message) }, () => {})

// Lokale Amsterdamse kloktijd → UTC (zomer- en wintertijd).
function amsterdamNaarUtc(datum: string, tijd: string | null) {
  const [j, m, d] = datum.split('-').map(Number)
  const [u, mi] = (/^\d{1,2}:\d{2}$/.test(tijd || '') ? tijd! : '14:00').split(':').map(Number)
  const gok = Date.UTC(j, m - 1, d, u, mi)
  const offset = (t: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(t)).map((x) => [x.type, x.value]))
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t
  }
  const eerst = gok - offset(gok)
  return new Date(gok - offset(eerst))
}
const vandaagAmsterdam = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())

// Caption: hook, dan de caption, en altijd 'Comment <WOORD>' erin.
function caption(it: Item) {
  const delen = [it.hook?.trim(), it.autopilot_caption?.trim()].filter(Boolean) as string[]
  const woord = it.autopilot_woord?.trim().toUpperCase()
  let tekst = delen.join('\n\n')
  if (woord && !new RegExp(`comment\\s+["“]?${woord}\\b`, 'i').test(tekst)) tekst += `${tekst ? '\n\n' : ''}Comment ${woord}`
  return tekst.slice(0, 2200)
}

async function mediaUrls(it: Item) {
  if (it.autopilot_preview) {
    const cover = it.autopilot_preview.replace(/variant\.mp4$/, 'cover.jpg')
    const { data } = await sb.storage.from(BUCKET_PREVIEW).createSignedUrls([it.autopilot_preview, cover], URL_GELDIG)
    const video = data?.find((x) => x.path === it.autopilot_preview && x.signedUrl)?.signedUrl
    const coverUrl = data?.find((x) => x.path === cover && x.signedUrl)?.signedUrl
    return { video, cover: coverUrl }
  }
  if (it.autopilot_video) {
    const pub = (p: string) => sb.storage.from(BUCKET_OUD).getPublicUrl(p).data.publicUrl
    return { video: pub(it.autopilot_video), cover: it.autopilot_cover ? pub(it.autopilot_cover) : undefined }
  }
  return { video: undefined, cover: undefined }
}

async function maakContainer(it: Item) {
  const { video, cover } = await mediaUrls(it)
  if (!video) return { fout: 'Geen video gevonden in de opslag' }
  const r = await ig('me/media', {
    media_type: 'REELS', video_url: video, caption: caption(it), share_to_feed: 'true',
    ...(cover ? { cover_url: cover } : {}),
  })
  if (!r.ok || !r.j?.id) return { fout: `Container maken mislukt: ${r.fout}` }
  return { id: String(r.j.id) }
}

const zetFout = (id: string, melding: string, extra: Record<string, unknown> = {}) => sb.from('content_items')
  .update({ autopilot_status: 'fout', autopilot_fout: schoon(melding), updated_at: new Date().toISOString(), ...extra }).eq('id', id)

// Container volgen; FINISHED → publiceren. Geeft 'gepost' | 'wacht' | 'fout'.
async function volgEnPubliceer(it: Item, container: string, maxPolls: number) {
  for (let i = 0; i < maxPolls; i++) {
    const s = await ig(`${container}?fields=status_code,status`)
    const code = s.j?.status_code
    if (code === 'FINISHED') return await publiceer(it, container)
    if (code === 'PUBLISHED') {
      await zetFout(it.id, 'Instagram meldt deze container als al geplaatst. Controleer je profiel; niet opnieuw goedkeuren.')
      return 'fout'
    }
    if (code === 'ERROR' || code === 'EXPIRED') {
      await zetFout(it.id, `Instagram verwerkte de video niet (${code}${s.j?.status ? `: ${s.j.status}` : ''})`)
      return 'fout'
    }
    if (i < maxPolls - 1) await slaap(POLL_MS)
  }
  if (Date.now() - new Date(it.updated_at + (it.updated_at.endsWith('Z') ? '' : 'Z')).getTime() > 60 * 60 * 1000) {
    await zetFout(it.id, 'Instagram bleef langer dan een uur bezig met de video')
    return 'fout'
  }
  return 'wacht'
}

async function publiceer(it: Item, container: string) {
  // Slot: alleen wie bezig → publiceert wint, plaatst.
  const { data: slot } = await sb.from('content_items').update({ autopilot_status: 'publiceert', updated_at: new Date().toISOString() })
    .eq('id', it.id).eq('autopilot_status', 'bezig').select('id')
  if (!slot?.length) return 'wacht'
  const r = await ig('me/media_publish', { creation_id: container })
  if (!r.ok || !r.j?.id) {
    await zetFout(it.id, `Plaatsen mislukt: ${r.fout}. Controleer je profiel voor je opnieuw goedkeurt.`)
    return 'fout'
  }
  const igId = String(r.j.id)
  const p = await ig(`${igId}?fields=permalink,timestamp`)
  const nu = new Date().toISOString()
  await sb.from('content_items').update({
    autopilot_status: 'gepubliceerd', ig_media_id: igId, ig_permalink: p.j?.permalink || null,
    posted_at: nu, status: 'created', autopilot_fout: null, updated_at: nu,
  }).eq('id', it.id)
  // Variant in de bibliotheek: content_autopilot_meet meet hem na 48 uur.
  await sb.from('content_bibliotheek').upsert({
    ig_id: igId, eigenaar: EIGENAAR, soort: 'magnet', woord: it.autopilot_woord, tijd: p.j?.timestamp || nu,
    lokaal_pad: it.autopilot_bestand, is_variant: true, bron_ig_id: it.autopilot_bron, item_id: it.id,
  }, { onConflict: 'ig_id', ignoreDuplicates: true })
  return 'gepost'
}

async function laadToken() {
  const { data, error } = await sb.rpc('content_ig_token')
  TOKEN = typeof data === 'string' ? data : ''
  return error ? `token-RPC: ${error.message}` : TOKEN ? '' : 'geen meta_ig_token in Vault'
}

async function cron() {
  const log: string[] = []
  // 1. Lopende containers afmaken.
  const { data: lopend } = await sb.from('content_items').select(KOLOMMEN)
    .eq('coach_id', EIGENAAR).eq('autopilot_status', 'bezig').limit(5)
  for (const it of (lopend || []) as Item[]) {
    if (!it.autopilot_container) {
      const oud = Date.now() - new Date(it.updated_at + (it.updated_at.endsWith('Z') ? '' : 'Z')).getTime() > 15 * 60 * 1000
      if (oud) await zetFout(it.id, 'Plaatsen onderbroken. Controleer je profiel voor je opnieuw goedkeurt.')
      continue
    }
    log.push(`${it.id}: ${await volgEnPubliceer(it, it.autopilot_container, 1)}`)
  }
  // 'publiceert' die bleef hangen: nooit opnieuw proberen, wel melden.
  const { data: hangt } = await sb.from('content_items').select('id, updated_at')
    .eq('coach_id', EIGENAAR).eq('autopilot_status', 'publiceert').lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
  for (const h of hangt || []) await zetFout(h.id, 'Plaatsen onderbroken tijdens publiceren. Controleer je profiel; niet opnieuw goedkeuren als hij er al staat.')

  // 2. Nieuwe: goedgekeurd en het moment is daar.
  const { data: kand } = await sb.from('content_items').select(KOLOMMEN)
    .eq('coach_id', EIGENAAR).eq('autopilot_status', 'goedgekeurd')
    .is('ig_media_id', null).is('posted_at', null).not('planned_date', 'is', null)
    .or('autopilot_preview.not.is.null,autopilot_video.not.is.null')
    .order('planned_date').order('planned_time').limit(20)
  const nu = Date.now()
  const aanDeBeurt = ((kand || []) as Item[]).filter((it) => amsterdamNaarUtc(it.planned_date!, it.planned_time).getTime() <= nu)
  if (!aanDeBeurt.length) return log

  const { data: inst } = await sb.from('content_autopilot').select('max_per_dag').eq('eigenaar', EIGENAAR).maybeSingle()
  const max = inst?.max_per_dag ?? 5
  const dag = vandaagAmsterdam()
  const { data: vandaag } = await sb.from('content_ig_media').select('id').eq('eigenaar', EIGENAAR).eq('soort', 'magnet').eq('dag', dag)
  const ids = new Set((vandaag || []).map((m) => m.id))
  const { data: zelf } = await sb.from('content_items').select('ig_media_id')
    .eq('coach_id', EIGENAAR).in('autopilot_status', ['gepubliceerd', 'bezig', 'publiceert'])
    .gte('updated_at', new Date(nu - 24 * 3600 * 1000).toISOString())
  let geteld = ids.size + (zelf || []).filter((z) => !z.ig_media_id || !ids.has(z.ig_media_id)).length

  for (const it of aanDeBeurt.slice(0, 2)) {
    const moment = amsterdamNaarUtc(it.planned_date!, it.planned_time).getTime()
    if (nu - moment > MAX_TE_LAAT_UUR * 3600 * 1000) {
      await zetFout(it.id, 'Het geplande moment is al ruim voorbij. Kies een nieuwe dag en keur opnieuw goed.')
      continue
    }
    if (geteld >= max) { log.push(`${it.id}: max ${max} per dag bereikt`); continue }
    // Slot vóór de Instagram-call.
    const { data: slot } = await sb.from('content_items')
      .update({ autopilot_status: 'bezig', autopilot_container: null, autopilot_fout: null, updated_at: new Date().toISOString() })
      .eq('id', it.id).eq('autopilot_status', 'goedgekeurd').select(KOLOMMEN)
    if (!slot?.length) continue
    geteld++
    const c = await maakContainer(it)
    if (c.fout) { await zetFout(it.id, c.fout); log.push(`${it.id}: fout`); continue }
    await sb.from('content_items').update({ autopilot_container: c.id }).eq('id', it.id)
    log.push(`${it.id}: ${await volgEnPubliceer(slot[0] as Item, c.id!, POLL_MAX)}`)
  }
  return log
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const body = await req.json().catch(() => ({}))
    const tokFout = await laadToken()

    // Test-acties alleen voor de eigenaar zelf (zijn eigen login).
    if (body?.check || body?.dry_run) {
      const { data: { user } } = await sb.auth.getUser((req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''))
      if (user?.id !== EIGENAAR) return json({ fout: 'alleen_eigenaar' }, 403)
      if (tokFout) return json({ fout: tokFout }, 503)
      const me = await ig('me?fields=user_id,username,account_type')
      const lim = await ig('me/content_publishing_limit?fields=quota_usage,config')
      const stand = {
        account: me.ok ? `${me.j.username} (${me.j.account_type})` : me.fout,
        publiceren_toegestaan: lim.ok,
        limiet: lim.ok ? `${lim.j?.data?.[0]?.quota_usage ?? '?'} van ${lim.j?.data?.[0]?.config?.quota_total ?? 100} in 24 uur` : lim.fout,
      }
      if (!body.dry_run) return json(stand)
      const { data: it } = await sb.from('content_items').select(KOLOMMEN).eq('id', body.id).eq('coach_id', EIGENAAR).maybeSingle()
      if (!it) return json({ ...stand, fout: 'item niet gevonden' }, 404)
      const c = await maakContainer(it as Item)
      if (c.fout) return json({ ...stand, container: null, fout: c.fout })
      let code = ''
      for (let i = 0; i < POLL_MAX; i++) {
        code = (await ig(`${c.id}?fields=status_code`)).j?.status_code || ''
        if (code && code !== 'IN_PROGRESS') break
        await slaap(POLL_MS)
      }
      // Niet publiceren: de container vervalt vanzelf na 24 uur.
      return json({ ...stand, container: c.id, status: code || 'onbekend', gepubliceerd: false, caption: caption(it as Item) })
    }

    if (tokFout) { await meldFout(tokFout); return json({ fout: tokFout }, 503) }
    return json({ ok: true, log: await cron() })
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e)
    await meldFout(`onverwacht: ${m}`)
    return json({ fout: schoon(m) }, 500)
  }
})
