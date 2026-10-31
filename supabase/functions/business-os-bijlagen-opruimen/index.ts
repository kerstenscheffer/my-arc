// supabase/functions/business-os-bijlagen-opruimen/index.ts
//
// Ruimt bijlagen uit de Business OS-chat op: alles in bucket
// business-os-bijlagen dat ouder is dan 7 dagen gaat weg. Draait dagelijks via
// pg_cron (job 'business-os-bijlagen-opruimen', pg_net). Direct deleten in
// storage.objects mag niet (protect_delete), dus via de Storage API met de
// service-sleutel van de functie zelf. De cron roept hem aan met de (publieke)
// anon-sleutel; meer dan oude bijlagen weggooien kan hij niet. Logt alleen aantallen, nooit namen of inhoud.

import { createClient } from 'npm:@supabase/supabase-js@2'

const BUCKET = 'business-os-bijlagen'
const DAGEN = 7

Deno.serve(async () => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  const grens = Date.now() - DAGEN * 864e5
  const weg: string[] = []
  // Bovenste laag = mappen per coach (user-id), daaronder de bestanden.
  const { data: mappen, error } = await sb.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) return new Response(JSON.stringify({ fout: error.message }), { status: 500 })
  for (const map of mappen || []) {
    if (map.id) continue // los bestand in de root hoort er niet; niet aankomen
    for (let offset = 0; ; offset += 1000) {
      const { data: bestanden } = await sb.storage.from(BUCKET).list(map.name, { limit: 1000, offset })
      for (const b of bestanden || []) {
        if (b.id && Date.parse(b.created_at) < grens) weg.push(`${map.name}/${b.name}`)
      }
      if (!bestanden || bestanden.length < 1000) break
    }
  }
  for (let i = 0; i < weg.length; i += 100) {
    await sb.storage.from(BUCKET).remove(weg.slice(i, i + 100))
  }
  console.log(`bijlagen opgeruimd: ${weg.length}`)
  return new Response(JSON.stringify({ ok: true, verwijderd: weg.length }), { headers: { 'content-type': 'application/json' } })
})
