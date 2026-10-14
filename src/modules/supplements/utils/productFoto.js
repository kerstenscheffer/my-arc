// De echte productfoto bij een supplement: de foto van het product met de
// hoogste prioriteit in de winkelcatalogus (supplement_products). Big Buffalo
// staat daar bovenaan, dus waar die een product heeft zie je dat potje.
// Zonder product valt de kaart terug op de stockfoto uit supplementFoto.
//
// Eén query voor de hele sessie: de catalogus is klein en coach-breed, en
// elke kaart apart laten vragen gaf een rij identieke verzoeken.

import { useEffect, useState } from 'react'
import DatabaseService from '../../../services/DatabaseService'

let belofte = null

export function laadProductFotos() {
  if (!belofte) {
    belofte = DatabaseService.supabase
      .from('supplement_products')
      .select('category, image_url, link_status, priority')
      .eq('active', true)
      .not('image_url', 'is', null)
      .order('priority', { ascending: false })
      .then(({ data }) => {
        const fotos = {}
        for (const p of data || []) {
          if (p.link_status === 'dood' || !p.image_url || fotos[p.category]) continue
          fotos[p.category] = p.image_url
        }
        return fotos
      }, () => { belofte = null; return {} })
  }
  return belofte
}

export function useProductFotos() {
  const [fotos, setFotos] = useState({})
  useEffect(() => {
    let leeft = true
    laadProductFotos().then(f => { if (leeft) setFotos(f) })
    return () => { leeft = false }
  }, [])
  return fotos
}
