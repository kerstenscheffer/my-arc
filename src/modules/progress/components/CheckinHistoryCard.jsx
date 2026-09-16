// src/modules/progress/components/CheckinHistoryCard.jsx
//
// De knop naar je eigen check-ins, onder de gewichtsgrafiek op de
// tracking-pagina. Foto links die naar rechts wegloopt in het zwart, tekst er
// half overheen: dezelfde vorm als het coach-blok bovenaan deze pagina, zodat
// de pagina één taal blijft spreken.
//
// Wat erachter zit staat in CheckinHistoryModal.

import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import CheckinHistoryModal from '../../client-checkin/components/CheckinHistoryModal'

const FOTO = '/coach-modal.png'

const datumKort = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

export default function CheckinHistoryCard({ db, client, isMobile = false }) {
  const [open, setOpen] = useState(false)
  const [aantal, setAantal] = useState(null)
  const [laatste, setLaatste] = useState(null)

  useEffect(() => {
    let weg = false
    const laad = async () => {
      // Alleen datums: genoeg voor "hoeveel" en "wanneer voor het laatst",
      // zonder de hele check-in binnen te halen voor een knop.
      const { data, error } = await db.supabase
        .from('client_checkins')
        .select('id, checkin_date')
        .eq('client_id', client.id)
        .order('checkin_date', { ascending: false })
        .limit(60)
      if (weg) return
      if (error) { console.error('Check-in-telling mislukt:', error); return }
      setAantal((data || []).length)
      setLaatste(data?.[0]?.checkin_date || null)
    }
    if (client?.id) laad()
    return () => { weg = true }
  }, [db, client?.id])

  const meta = aantal === null
    ? 'Open om terug te kijken'
    : aantal === 0
      ? 'Nog geen check-in ingevuld'
      : `${aantal} bewaard · laatste ${datumKort(laatste)}`

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true) }}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: isMobile ? 130 : 150,
          overflow: 'hidden',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '46%',
          backgroundImage: `url(${FOTO})`,
          backgroundSize: 'cover', backgroundPosition: 'center 18%',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.35) 22%, rgba(10,10,10,0.8) 40%, #0a0a0a 58%)',
        }} />

        <div style={{
          position: 'relative',
          marginLeft: '26%',
          padding: isMobile ? '0.9rem 1rem 1rem 0.5rem' : '1.1rem 1.5rem 1.2rem 0.75rem',
          display: 'flex', alignItems: 'center', gap: isMobile ? '0.6rem' : '0.85rem',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: 800, color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 5,
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            }}>
              Terugkijken
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: 900, color: '#fff',
              lineHeight: 1.3, letterSpacing: '-0.02em',
              textShadow: '0 2px 12px rgba(0,0,0,0.95)',
            }}>
              Jouw check-ins
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.76rem',
              fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4,
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            }}>
              {meta}
            </div>
          </div>

          <div style={{
            flexShrink: 0,
            width: isMobile ? 38 : 42, height: isMobile ? 38 : 42,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <ChevronRight size={isMobile ? 18 : 20} strokeWidth={2.6} />
          </div>
        </div>
      </div>

      {open && (
        <CheckinHistoryModal
          db={db}
          client={client}
          isMobile={isMobile}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
