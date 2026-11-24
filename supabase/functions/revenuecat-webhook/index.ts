// supabase/functions/revenuecat-webhook/index.ts
//
// RevenueCat → public.app_abonnementen (24 nov 2026).
// RevenueCat stuurt bij elke koop, verlenging, opzegging of afloop een event.
// De app kent de gebruiker in RevenueCat onder zijn Supabase auth-id
// (src/lib/appAbonnement.js), dus app_user_id = auth.users.id.
//
// Beveiliging: RevenueCat stuurt de header Authorization met de waarde die in
// het RevenueCat-dashboard staat. Die moet gelijk zijn aan het secret
// REVENUECAT_WEBHOOK_AUTH. De waarde wordt nooit gelogd.
//
// Volgorde: events kunnen dubbel of in een andere volgorde binnenkomen. Een
// event dat ouder is dan het laatst verwerkte wordt overgeslagen.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const gelijk = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let v = 0
  for (let i = 0; i < a.length; i++) v |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return v === 0
}

// Welke auth-id hoort bij dit event? app_user_id, anders een alias die een uuid is.
const authIdVan = (e: Record<string, unknown>): string | null => {
  const kandidaten = [e.app_user_id, e.original_app_user_id, ...((e.aliases as unknown[]) || [])]
  for (const k of kandidaten) if (typeof k === 'string' && UUID.test(k)) return k.toLowerCase()
  return null
}

const iso = (ms: unknown) => (typeof ms === 'number' && ms > 0 ? new Date(ms).toISOString() : null)

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, fout: 'methode' }, 405)
  const verwacht = Deno.env.get('REVENUECAT_WEBHOOK_AUTH') || ''
  const gekregen = req.headers.get('authorization') || ''
  if (!verwacht || !gelijk(gekregen.replace(/^Bearer\s+/i, ''), verwacht.replace(/^Bearer\s+/i, ''))) {
    return json({ ok: false, fout: 'sleutel' }, 401)
  }

  let body: { event?: Record<string, unknown> }
  try { body = await req.json() } catch { return json({ ok: false, fout: 'body' }, 400) }
  const e = body?.event
  if (!e || typeof e !== 'object') return json({ ok: false, fout: 'body' }, 400)

  const type = String(e.type || '')
  if (type === 'TEST') return json({ ok: true, test: true })

  const authId = authIdVan(e)
  if (!authId) {
    // Anoniem gekocht (zou niet moeten): RevenueCat koppelt het bij inloggen
    // alsnog via een TRANSFER of een nieuw event.
    console.warn('revenuecat: event zonder auth-id', type)
    return json({ ok: true, overgeslagen: 'geen_auth_id' })
  }

  // Bestaat het account? Anders kan de foreign key niet.
  const { data: gebruiker } = await sb.auth.admin.getUserById(authId)
  if (!gebruiker?.user) {
    console.warn('revenuecat: onbekend account', type)
    return json({ ok: true, overgeslagen: 'onbekend_account' })
  }

  const { data: huidig } = await sb.from('app_abonnementen')
    .select('status, proef_gebruikt, ruw').eq('auth_user_id', authId).maybeSingle()
  const tijd = typeof e.event_timestamp_ms === 'number' ? e.event_timestamp_ms : Date.now()
  const vorigeTijd = Number((huidig?.ruw as Record<string, unknown> | null)?.event_timestamp_ms || 0)
  if (vorigeTijd && tijd < vorigeTijd) return json({ ok: true, overgeslagen: 'ouder_event' })

  const proef = e.period_type === 'TRIAL'
  const verloopt = iso(e.expiration_at_ms)
  let status: string = huidig?.status || 'verlopen'
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION':
    case 'SUBSCRIPTION_EXTENDED':
    case 'TEMPORARY_ENTITLEMENT_GRANT':
      status = proef ? 'proef' : 'actief'
      break
    case 'CANCELLATION':
      // Automatisch verlengen staat uit; toegang loopt door tot verloopt_op.
      status = proef ? 'proef' : (huidig?.status === 'respijt' ? 'respijt' : 'actief')
      if (e.cancel_reason === 'CUSTOMER_SUPPORT' && !verloopt) status = 'gestopt' // terugbetaald
      break
    case 'BILLING_ISSUE':
      status = 'respijt'
      break
    case 'EXPIRATION':
      status = 'verlopen'
      break
    case 'SUBSCRIPTION_PAUSED':
      status = 'gestopt'
      break
    default:
      // TRANSFER, NON_RENEWING_PURCHASE, enz.: alleen bewaren.
      break
  }

  // Bijhorende klantrij (kan ontbreken bij een kaal account).
  const { data: klant } = await sb.from('clients').select('id').eq('auth_user_id', authId).limit(1).maybeSingle()

  const rij = {
    auth_user_id: authId,
    client_id: klant?.id ?? null,
    status,
    product_id: typeof e.product_id === 'string' ? e.product_id : null,
    store: typeof e.store === 'string' ? e.store : null,
    verloopt_op: type === 'BILLING_ISSUE' ? (iso(e.grace_period_expiration_at_ms) || verloopt) : verloopt,
    proef_gebruikt: !!huidig?.proef_gebruikt || proef,
    laatste_event: type,
    ruw: e,
    updated_at: new Date().toISOString(),
  }
  const { error } = await sb.from('app_abonnementen').upsert(rij, { onConflict: 'auth_user_id' })
  if (error) {
    console.error('revenuecat: opslaan mislukt', error.code)
    return json({ ok: false, fout: 'opslaan' }, 500) // RevenueCat probeert het opnieuw
  }
  return json({ ok: true, status })
})
