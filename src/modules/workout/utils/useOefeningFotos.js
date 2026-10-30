// src/modules/workout/utils/useOefeningFotos.js
import { useEffect, useState } from 'react'
import { getFallbackImage, fotoKandidaten, fotoAchtergrond } from './oefeningFoto'

// Foto per oefening, dezelfde volgorde als de oefeningkaart van de klant
// (zie oefeningFoto.js). Eén query voor alle oefeningen van een sessie.
//
// Geeft een CSS background-image terug met alle kandidaten als lagen: laadt
// de eerste niet, dan schijnt de volgende erdoor; bodem is de stockfoto en
// daaronder een neutraal halter-vlak. Gebruik: backgroundImage: fotoVan(naam)
export default function useOefeningFotos(db, namen) {
  const sleutel = namen.join('|')
  const [fotos, setFotos] = useState({})
  useEffect(() => {
    if (!db?.supabase || namen.length === 0) return
    let weg = false
    ;(async () => {
      try {
        const { data } = await db.supabase
          .from('exercises')
          .select('name, thumbnail_url, video_url, fallback_video_url, image_url')
          .in('name', namen)
        if (weg) return
        const uit = {}
        ;(data || []).forEach(ex => { uit[ex.name] = fotoKandidaten(ex) })
        setFotos(uit)
      } catch (e) { console.warn('oefeningfoto\'s laden mislukt', e?.message) }
    })()
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, sleutel])
  return (naam) => fotoAchtergrond([...(fotos[naam] || []), getFallbackImage({ name: naam })])
}
