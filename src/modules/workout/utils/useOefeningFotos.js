// src/modules/workout/utils/useOefeningFotos.js
import { useEffect, useState } from 'react'
import { getFallbackImage, youtubeThumb } from './oefeningFoto'

// Foto per oefening, dezelfde keten als de oefeningkaart van de klant:
// thumbnail van de coach, YouTube-thumb, foto uit de oefeningentabel, en
// anders de stockfoto op naam. Eén query voor alle oefeningen van een sessie.
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
          .select('name, thumbnail_url, video_url, image_url')
          .in('name', namen)
        if (weg) return
        const uit = {}
        ;(data || []).forEach(ex => {
          uit[ex.name] = ex.thumbnail_url || youtubeThumb(ex.video_url) || ex.image_url || null
        })
        setFotos(uit)
      } catch (e) { console.warn('oefeningfoto\'s laden mislukt', e?.message) }
    })()
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, sleutel])
  return (naam) => fotos[naam] || getFallbackImage({ name: naam })
}

