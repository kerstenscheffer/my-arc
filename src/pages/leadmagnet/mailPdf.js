// src/pages/leadmagnet/mailPdf.js
// Dezelfde PDF die iemand downloadt ook naar zijn mail, via de edge function
// mail-lead-pdf (Resend). Faalt stil: de download is het belangrijkste; geen
// mail (nog niet ingesteld, limiet, fout) betekent alleen geen bevestiging.
import db from '../../services/DatabaseService'

export async function mailPdf({ soort, leadId, email, voornaam, doc }) {
  if (!leadId || !email || !doc) return false
  try {
    const pdf = doc.output('datauristring').split(',')[1]
    const { error } = await db.supabase.functions.invoke('mail-lead-pdf', {
      body: { soort, lead_id: leadId, email, voornaam, pdf_base64: pdf },
    })
    return !error
  } catch { return false }
}
