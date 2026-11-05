// src/modules/business-os/useTestMeting.js
//
// Eigen stand per rij of bord: een fout of traag antwoord raakt de andere niet.
// Alleen de velden die de meting gebruikt tellen, dus een tekst aanpassen meet niet opnieuw.

import { useEffect, useState } from 'react'
import { meetTest } from './testMeting'
import { supabase } from '../../lib/supabase'

export function useTestMeting(test, doel) {
  const sleutel = JSON.stringify(test
    ? { woorden: test.woorden, van: test.van, tot: test.tot, ig_ids: test.ig_ids, nulmeting_per_10: test.nulmeting_per_10 }
    : null)
  const [stand, setStand] = useState(null)
  useEffect(() => {
    const t = JSON.parse(sleutel)
    if (!t) return
    let weg = false
    meetTest(supabase, t, doel).then(
      uit => { if (!weg) setStand({ klaar: true, uit }) },
      () => { if (!weg) setStand({ klaar: true, uit: null, fout: true }) },
    )
    return () => { weg = true }
  }, [sleutel, doel])
  return stand
}
