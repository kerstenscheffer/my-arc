// src/modules/business-os/useNieuweMannen.js
//
// Laadt de weken Nieuwe mannen voor de context van Gino (BusinessOS). Niet op het scherm: Kersten wil dat blok niet (5 nov 2026).

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { laadNieuweMannen } from './nieuweMannenData'

export function useNieuweMannen() {
  const [weken, setWeken] = useState(null)
  const [fout, setFout] = useState(null)
  useEffect(() => {
    let weg = false
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!user?.id) throw new Error('Niet ingelogd')
        return laadNieuweMannen(supabase, user.id)
      })
      .then(
        (w) => { if (!weg) setWeken(w) },
        (e) => { if (!weg) setFout(e.message || 'Laden mislukt') },
      )
    return () => { weg = true }
  }, [])
  return { weken, fout }
}
