// src/modules/lead-management/betaalPauze.js
//
// Betaalpauze. Zelfde regel als pauze_schuif in de database: een termijn op
// of na de start van een pauze staat stil zolang de pauze loopt (null), en
// schuift na het hervatten op met de lengte van de pauze. `pauzes` komt uit
// sale_pauzes_team(), op volgorde: [{ vanaf: 'YYYY-MM-DD', tot: ... | null }].
// De pauzes zelf zijn de rijen in coaching_pauses van de klant die aan de sale
// gekoppeld is (lead_movements.client_id).

const dagStr = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function pauzeSchuif(datum, pauzes) {
  if (!pauzes?.length) return datum
  let d = new Date(datum)
  for (const p of pauzes) {
    if (dagStr(d) >= p.vanaf) {
      if (!p.tot) return null
      const dagen = Math.round((new Date(p.tot + 'T12:00:00') - new Date(p.vanaf + 'T12:00:00')) / 86400000)
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + dagen, d.getHours(), d.getMinutes())
    }
  }
  return d
}

// Alle betaalmomenten van één sale-rij, met de pauze toegepast. Spreiding
// zoals get_payment_schedule: reservering op de sale-dag, de rest vanaf de
// afgesproken datum, maandelijks in gelijke termijnen.
export function termijnenVanSale(m, pauzes) {
  const totaal = Number(m.order_value) || 0
  const reservering = m.is_reservation ? Math.max(0, Number(m.reservation_amount) || 0) : 0
  const saleDag = new Date(m.moved_at)
  const start = m.payment_due_date ? new Date(m.payment_due_date + 'T12:00:00') : saleDag
  const maanden = m.payment_type === 'monthly' ? Math.max(1, Number(m.duration_months) || 1) : 1
  const rest = Math.max(0, totaal - reservering)
  const uit = []
  if (reservering > 0) uit.push({ soort: 'Reservering', bedrag: reservering, oud: saleDag, nieuw: saleDag })
  if (rest > 0) {
    for (let i = 0; i < maanden; i++) {
      const oud = new Date(start.getFullYear(), start.getMonth() + i, start.getDate(), 12)
      uit.push({
        soort: maanden > 1 ? `Termijn ${i + 1} van ${maanden}` : (reservering ? 'Restbetaling' : 'Vooruitbetaald'),
        bedrag: rest / maanden, oud, nieuw: pauzeSchuif(oud, pauzes),
      })
    }
  }
  return uit
}
