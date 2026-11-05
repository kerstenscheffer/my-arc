// src/modules/business-os/challengeGeld.js
//
// Wat de challenge echt oplevert, op één plek: Klanten en Omzet tonen dezelfde getallen.
// Alleen lezen. Dit schrijft geen status weg, dus de uitbetaling aan Marcel verandert hier niet.

import { supabase } from '../../lib/supabase'
import { haalEisen, haalInstellingen, borgOordeel } from '../challenge-monitor/challengeCoach'

const dagKort = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '') : '—')

// Wat de challenge oplevert. De borg telt pas als winst als de verlenging betaald is, of als de
// challenge voorbij is en de klant niet geschikt is voor borg terug: dat geld blijft.
// ctx.klantVan: sale-id → klantnaam, ctx.nietGeschikt: sale-id → true. Rekent alleen, schrijft niets.
export function rekenGeld(rijen, ctx) {
  const n = (x) => Number(x) || 0
  const challenges = rijen.filter(r => r.sale_kind === 'challenge' && n(r.order_value) > 0 && r.challenge_status !== 'uitgesteld')
  const verlengingen = rijen.filter(r => r.borg_movement_id && n(r.order_value) > 0)
  const borgVan = new Map(verlengingen.map(v => [v.borg_movement_id, v]))
  const som = (l) => l.reduce((t, r) => t + n(r.order_value), 0)
  const betaaldV = verlengingen.filter(v => v.payment_received)
  const openV = verlengingen.filter(v => !v.payment_received)
  const levend = challenges.filter(c => c.challenge_status !== 'terugbetaald')
  const zekerB = levend.filter(c => c.challenge_status === 'behouden' || borgVan.get(c.id)?.payment_received)
  const blijftB = levend.filter(c => !zekerB.includes(c) && ctx.nietGeschikt(c.id))
  const toegezegdB = levend.filter(c => !zekerB.includes(c) && !blijftB.includes(c) && borgVan.has(c.id))
  const onzekerB = levend.filter(c => !zekerB.includes(c) && !blijftB.includes(c) && !borgVan.has(c.id))
  // Echte naam als de sale gekoppeld is. Anders de Instagram-naam, soms dubbel ("jan jan").
  const naam = (r) => {
    const echt = ctx.klantVan(r.borg_movement_id || r.id)
    if (echt) return echt
    const w = String(r.lead_name || 'Onbekend').trim().split(/\s+/)
    return w.length === 2 && w[0] === w[1] ? w[0] : w.join(' ')
  }
  const regel = (r, sub = dagKort(r.moved_at), bedrag = n(r.order_value)) => ({ id: r.id, naam: naam(r), bedrag, sub })
  const opNaam = (l) => l.sort((a, b) => a.naam.localeCompare(b.naam))
  const borgPlus = (l) => l.map(c => regel(c, dagKort(c.moved_at), n(c.order_value) + n(borgVan.get(c.id)?.order_value)))
  const zekerIds = new Set(zekerB.map(c => c.id))
  const toegezegdIds = new Set(toegezegdB.map(c => c.id))
  return {
    lijsten: {
      verkocht: opNaam(levend.map(c => regel(c))),
      zeker: opNaam([
        ...borgPlus(zekerB),
        ...blijftB.map(c => regel(c, 'Niet geschikt')),
        ...betaaldV.filter(v => !zekerIds.has(v.borg_movement_id)).map(v => regel(v, 'Verlenging')),
      ]),
      toegezegd: opNaam([
        ...borgPlus(toegezegdB),
        ...openV.filter(v => !toegezegdIds.has(v.borg_movement_id)).map(v => regel(v, 'Verlenging')),
      ]),
      onzeker: opNaam(onzekerB.map(c => regel(c))),
      refund: opNaam(challenges.filter(c => c.challenge_status === 'terugbetaald').map(c => regel(c))),
    },
    aantal: levend.length,
    verkocht: som(levend),
    zeker: som(zekerB) + som(blijftB) + som(betaaldV),
    toegezegd: som(toegezegdB) + som(openV),
    onzeker: som(onzekerB),
    onzekerAantal: onzekerB.length,
    refund: som(challenges.filter(c => c.challenge_status === 'terugbetaald')),
  }
}

const naamVan = (c) => [c?.first_name, c?.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || null

// Alles zelf ophalen, voor schermen die de klantenlijst niet al hebben (Omzet).
export async function haalChallengeGeld() {
  const [sales, instellingen] = await Promise.all([
    supabase.from('lead_movements').select('id, lead_name, moved_at, order_value, challenge_status, payment_received, borg_movement_id, sale_kind')
      .or('sale_kind.eq.challenge,borg_movement_id.not.is.null').is('reverted_at', null),
    haalInstellingen(),
  ])
  if (sales.error) throw sales.error
  const klantVanSale = new Map()
  for (const [clientId, i] of instellingen) if (i.sale_id) klantVanSale.set(i.sale_id, clientId)
  const ids = [...klantVanSale.values()]
  const { data: klanten, error } = ids.length
    ? await supabase.from('clients').select('id, first_name, last_name, coaching_start_date, coaching_total_weeks, coaching_paused_days_total').in('id', ids)
    : { data: [] }
  if (error) throw error
  // Vier tegelijk, net als in Klanten.
  const eisen = {}
  const wachtrij = [...(klanten || [])]
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (wachtrij.length) {
      const c = wachtrij.shift()
      eisen[c.id] = await haalEisen(c).catch(() => null)
    }
  }))
  const klantOp = new Map((klanten || []).map(c => [c.id, c]))
  return rekenGeld(sales.data || [], {
    klantVan: (saleId) => naamVan(klantOp.get(klantVanSale.get(saleId))),
    nietGeschikt: (saleId) => {
      const id = klantVanSale.get(saleId)
      const e = id && eisen[id]
      return !!e?.voorbij && borgOordeel(e, instellingen.get(id))?.geschikt === false
    },
  })
}
