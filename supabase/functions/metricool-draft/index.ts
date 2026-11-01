// supabase/functions/metricool-draft/index.ts
//
// Content-autopilot → Metricool (1 nov 2026). Zet één variant (content_items)
// als DRAFT in de Metricool-planner van brand 6149311 (Instagram kerstenscheffer).
// Nooit publiceren: draft = true en autoPublish = false.
//
//   POST { id }  → { post_id, link }   (staat er al een draft: die wordt teruggegeven)
//
// Video: privé bucket metricool-drafts/<id>/variant.mp4 (upload via
// scripts/content-autopilot.mjs metricool), anders de autopilot-video uit
// content-autopilot. Metricool krijgt een ondertekende URL van 24 uur en slaat
// het bestand zelf op (saveExternalMediaFiles), zodat de draft blijft werken.
//
// Sleutel: METRICOOL_TOKEN (Supabase Secrets), optioneel METRICOOL_USER_ID.
// Ontbreekt de sleutel: regel 'geen_sleutel' in app_fouten (pagina metricool).
// Het token gaat nooit naar de frontend of de logs.
// API: https://app.metricool.com/api (header X-Mc-Auth, query userId + blogId),
// POST /v2/scheduler/posts (schema ScheduledPost in /api/swagger.json).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const API = 'https://app.metricool.com/api'
const BLOG_ID = '6149311'
const TZ = 'Europe/Amsterdam'
const PLANNER = `https://app.metricool.com/planner?blogId=${BLOG_ID}`
const TOKEN = Deno.env.get('METRICOOL_TOKEN') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    if (req.method !== 'POST') return json({ fout: 'alleen_post' }, 405)
    if (!req.headers.get('Authorization')) return json({ fout: 'geen_login' }, 401)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    })
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return json({ fout: 'geen_login' }, 401)
    const { data: eig } = await sb.rpc('content_eigenaar')
    if (eig !== user.id) return json({ fout: 'alleen_eigenaar' }, 403)

    const meldFout = (melding: string) => sb.from('app_fouten')
      .insert({ user_id: user.id, pagina: 'metricool', melding: melding.slice(0, 1000) })
      .then((r) => { if (r.error) console.error('app_fouten', r.error.message) }, () => {})

    if (!TOKEN) {
      await meldFout('geen_sleutel: METRICOOL_TOKEN ontbreekt in Supabase Secrets')
      return json({ fout: 'geen_sleutel' }, 503)
    }

    const { id } = await req.json().catch(() => ({}))
    if (!id) return json({ fout: 'geen_id' }, 400)
    const { data: it } = await sb.from('content_items')
      .select('id, hook, title, planned_date, planned_time, autopilot_woord, autopilot_caption, autopilot_video, autopilot_cover, metricool_post_id, metricool_link')
      .eq('id', id).maybeSingle()
    if (!it) return json({ fout: 'onbekend_item' }, 404)
    if (it.metricool_post_id) return json({ post_id: it.metricool_post_id, link: it.metricool_link || PLANNER, bestond: true })
    if (!it.planned_date || !it.planned_time) return json({ fout: 'geen_moment' }, 400)

    // Video + cover: eerst de privé bucket, anders de autopilot-bucket.
    const teken = async (bucket: string, pad: string | null) => {
      if (!pad) return null
      const { data } = await sb.storage.from(bucket).createSignedUrl(pad, 60 * 60 * 24)
      return data?.signedUrl || null
    }
    const video = (await teken('metricool-drafts', `${id}/variant.mp4`)) || (await teken('content-autopilot', it.autopilot_video))
    if (!video) return json({ fout: 'geen_video' }, 409)
    const cover = (await teken('metricool-drafts', `${id}/cover.jpg`)) || (await teken('content-autopilot', it.autopilot_cover))

    // Caption: hook + tekst + 'comment WOORD' (als die er nog niet in staat).
    const woord = it.autopilot_woord
    let tekst = [it.hook, it.autopilot_caption].filter(Boolean).join('\n\n')
    if (woord && !new RegExp(`comment\\s+["“]?${woord}`, 'i').test(tekst)) tekst += `\n\nComment ${woord}`

    const kop = { 'X-Mc-Auth': TOKEN, 'Content-Type': 'application/json' }
    let userId = Deno.env.get('METRICOOL_USER_ID') || ''
    if (!userId) {
      const r = await fetch(`${API}/admin/simpleProfiles?blogId=${BLOG_ID}`, { headers: kop })
      const lijst = await r.json().catch(() => null)
      const brand = Array.isArray(lijst) ? (lijst.find((b: any) => String(b?.id) === BLOG_ID) || lijst[0]) : null
      userId = String(brand?.userId || brand?.ownerUserId || '')
      if (!userId) {
        await meldFout(`userId niet gevonden (simpleProfiles status ${r.status})`)
        return json({ fout: r.status === 401 || r.status === 403 ? 'sleutel_ongeldig' : 'geen_user_id', status: r.status }, 502)
      }
    }

    const post = {
      text: tekst,
      publicationDate: { dateTime: `${it.planned_date}T${String(it.planned_time).slice(0, 5)}:00`, timezone: TZ },
      providers: [{ network: 'instagram' }],
      media: [video],
      saveExternalMediaFiles: true,
      draft: true,
      autoPublish: false,
      shortener: false,
      firstCommentText: '',
      instagramData: { type: 'REEL', showReelOnFeed: true },
      ...(cover ? { videoThumbnailUrl: cover } : {}),
    }
    const res = await fetch(`${API}/v2/scheduler/posts?blogId=${BLOG_ID}&userId=${userId}`, { method: 'POST', headers: kop, body: JSON.stringify(post) })
    const data = await res.json().catch(() => ({}))
    const postId = data?.data?.id ?? data?.id
    if (!res.ok || postId == null) {
      const detail = String(data?.message || data?.error || data?.detail || `status ${res.status}`).slice(0, 500)
      await meldFout(`metricool ${res.status}: ${detail}`)
      return json({ fout: res.status === 401 || res.status === 403 ? 'sleutel_ongeldig' : 'metricool', status: res.status, detail }, 502)
    }
    const link = data?.data?.plannerUrl || data?.plannerUrl || PLANNER
    const { error } = await sb.from('content_items')
      .update({ metricool_post_id: String(postId), metricool_link: link, metricool_at: new Date().toISOString() }).eq('id', id)
    if (error) await meldFout(`draft ${postId} aangemaakt, opslaan mislukt: ${error.message}`)
    return json({ post_id: String(postId), link })
  } catch (e) {
    console.error('metricool-draft', (e as Error)?.message || e)
    return json({ fout: 'intern' }, 500)
  }
})
