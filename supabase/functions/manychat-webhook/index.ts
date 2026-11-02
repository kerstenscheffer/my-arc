// supabase/functions/manychat-webhook/index.ts
//
// ManyChat → leadsysteem, alleen meelezen (zie lead-management/manychat.sql).
//  - POST: één gebeurtenis van de actie External Request.
//  - GET:  controleert MANYCHAT_TOKEN met het leesendpoint page/getInfo.
// Sleutel alleen in de header x-webhook-key: een URL komt in de edge-logs.
// Sleutel, token en antwoordteksten worden nooit gelogd. Deze functie stuurt
// nooit iets naar ManyChat behalve die ene GET.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  const sleutel = req.headers.get('x-webhook-key')
  if (!sleutel) return json({ ok: false, fout: 'sleutel' }, 401)

  if (req.method === 'POST') {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return json({ ok: false, fout: 'body' }, 400)
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ ok: false, fout: 'body' }, 400)
    const { data, error } = await sb.rpc('manychat_verwerk', { p_sleutel: sleutel, p: body })
    if (error) {
      console.error('manychat_verwerk mislukt', error.code)
      return json({ ok: false, fout: 'opslaan' }, 500)
    }
    return json(data, data?.ok ? 200 : data?.fout === 'sleutel' ? 401 : 400)
  }

  if (req.method === 'GET') {
    const { data, error } = await sb.rpc('manychat_verwerk', { p_sleutel: sleutel, p: null })
    if (error || !data?.ok) return json({ ok: false, fout: 'sleutel' }, 401)
    const token = Deno.env.get('MANYCHAT_TOKEN')
    if (!token) return json({ ok: true, token_ingesteld: false })
    const res = await fetch('https://api.manychat.com/fb/page/getInfo', { headers: { Authorization: `Bearer ${token}` } })
    const info = await res.json().catch(() => null)
    return json({
      ok: true, token_ingesteld: true, http: res.status, token_geldig: res.ok && info?.status === 'success',
      naam: info?.data?.name ?? null, is_pro: info?.data?.is_pro ?? null,
    })
  }

  return json({ ok: false, fout: 'methode' }, 405)
})
