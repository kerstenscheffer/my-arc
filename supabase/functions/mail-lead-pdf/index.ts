// supabase/functions/mail-lead-pdf/index.ts
//
// Stuurt de PDF uit een lead magnet (/mijn-split, /mijn-menu) als bijlage
// naar de lead, via Resend. De pagina maakt de PDF zelf (jsPDF) en stuurt hem
// hierheen op het moment dat iemand op de downloadknop drukt.
//
// Tegen misbruik (anders kan iedereen via ons mail met bijlage versturen):
//   - alleen naar een lead die net binnenkwam via die pagina: lead_id + e-mail
//     moeten kloppen in call_leads (lead_source mijn_split / mijn_menu) en de
//     lead is in de afgelopen 24 uur aangemaakt of bijgewerkt
//   - maximaal 3 mails per lead per 24 uur (lead_pdf_mails)
//   - alleen een echte PDF (begint met %PDF), maximaal 6 MB
//   - onderwerp en tekst staan hier vast; de pagina levert alleen de naam
//
// Secrets (supabase secrets): RESEND_API_KEY, RESEND_FROM
// (bv. "Kersten van MY ARC <kersten@myarcfitness.com>"), optioneel
// MAIL_REPLY_TO. Zonder RESEND_API_KEY antwoordt hij 503 en downloadt de
// pagina gewoon zonder mail.
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const antwoord = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const BRON: Record<string, string> = { split: 'mijn_split', menu: 'mijn_menu' }
const MAX_BYTES = 6 * 1024 * 1024

const TEKST: Record<string, { onderwerp: string; kop: string; alineas: string[]; bestand: string }> = {
  split: {
    onderwerp: 'Je trainingssplit van MY ARC',
    kop: 'Je split staat klaar',
    alineas: [
      'Hierbij je split als PDF, zodat je hem altijd bij de hand hebt.',
      'Zet hem op je telefoon of print hem, en vul per training het logboek in. Zo zie je zwart op wit dat je sterker wordt.',
      'Vragen over een oefening of over je schema? Reageer gewoon op deze mail.',
    ],
    bestand: 'mijn-split.pdf',
  },
  menu: {
    onderwerp: 'Je weekmenu van MY ARC',
    kop: 'Je weekmenu staat klaar',
    alineas: [
      'Hierbij je weekmenu als PDF, met de recepten en een boodschappenlijst voor de hele week.',
      'Weeg jezelf de komende twee weken elke ochtend en kijk naar het weekgemiddelde. Zo weet je of je calorieën kloppen.',
      'Vragen over je menu? Reageer gewoon op deze mail.',
    ],
    bestand: 'mijn-weekmenu.pdf',
  },
}

const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function html(soort: string, naam: string) {
  const t = TEKST[soort]
  const groet = naam ? `Hoi ${escape(naam)},` : 'Hoi,'
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#f2f2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#0e0e0e;padding:22px;text-align:center;"><img src="https://www.myarcfitness.com/ma-logo-header.png" alt="MY ARC" width="96" style="display:inline-block;width:96px;height:auto;"></td></tr>
<tr><td style="padding:28px 26px 8px;">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.15;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:-0.02em;">${t.kop}</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.55;color:#1a1a1a;font-weight:600;">${groet}</p>
${t.alineas.map(a => `<p style="margin:0 0 12px;font-size:16px;line-height:1.55;color:#1a1a1a;">${a}</p>`).join('')}
<p style="margin:18px 0 0;font-size:16px;line-height:1.55;color:#1a1a1a;">Groet,<br><strong>Kersten</strong><br><span style="color:#666;">MY ARC</span></p>
</td></tr>
<tr><td style="padding:18px 26px 26px;"><div style="border-top:1px solid #e5e5e5;padding-top:14px;font-size:12px;color:#888;line-height:1.5;">Je krijgt deze mail omdat je op myarcfitness.com je gegevens achterliet. De PDF zit als bijlage bij deze mail.</div></td></tr>
</table></td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return antwoord(405, { fout: 'alleen POST' })

  const sleutel = Deno.env.get('RESEND_API_KEY')
  const van = Deno.env.get('RESEND_FROM')
  if (!sleutel || !van) return antwoord(503, { fout: 'mail nog niet ingesteld' })

  let body: { lead_id?: string; email?: string; soort?: string; voornaam?: string; pdf_base64?: string }
  try { body = await req.json() } catch { return antwoord(400, { fout: 'geen geldige json' }) }
  const soort = String(body.soort || '')
  const email = String(body.email || '').trim().toLowerCase()
  const leadId = String(body.lead_id || '')
  const naam = String(body.voornaam || '').trim().slice(0, 60)
  const pdf = String(body.pdf_base64 || '')
  if (!BRON[soort]) return antwoord(400, { fout: 'onbekende soort' })
  if (!/^[0-9a-f-]{36}$/i.test(leadId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return antwoord(400, { fout: 'lead of e-mail ongeldig' })
  if (!pdf || pdf.length * 0.75 > MAX_BYTES) return antwoord(413, { fout: 'pdf ontbreekt of is te groot' })
  if (!pdf.startsWith('JVBER')) return antwoord(400, { fout: 'geen pdf' })   // base64 van "%PDF"

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const dag = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  const { data: lead } = await db.from('call_leads').select('id, email, lead_source, created_at, last_touched')
    .eq('id', leadId).eq('lead_source', BRON[soort]).maybeSingle()
  const recent = lead && (lead.created_at >= dag || (lead.last_touched && lead.last_touched >= dag))
  if (!lead || String(lead.email || '').toLowerCase() !== email || !recent) return antwoord(403, { fout: 'onbekende lead' })

  const { count } = await db.from('lead_pdf_mails').select('id', { count: 'exact', head: true })
    .eq('lead_id', leadId).gte('created_at', dag)
  if ((count || 0) >= 3) return antwoord(429, { fout: 'al genoeg gemaild' })

  const t = TEKST[soort]
  const replyTo = Deno.env.get('MAIL_REPLY_TO')
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sleutel}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: van, to: [email], subject: t.onderwerp, html: html(soort, naam),
      ...(replyTo ? { reply_to: replyTo } : {}),
      attachments: [{ filename: t.bestand, content: pdf }],
    }),
  })
  const uit = await r.json().catch(() => ({}))
  await db.from('lead_pdf_mails').insert({
    lead_id: leadId, email, soort, status: r.ok ? 'verstuurd' : 'mislukt',
    fout: r.ok ? null : JSON.stringify(uit).slice(0, 500), resend_id: r.ok ? uit.id : null,
  })
  if (!r.ok) return antwoord(502, { fout: 'versturen mislukt' })
  return antwoord(200, { ok: true })
})
