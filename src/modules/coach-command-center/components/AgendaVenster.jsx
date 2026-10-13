// src/modules/coach-command-center/components/AgendaVenster.jsx
//
// De agenda van de klant als zwevend venster vanuit Coach Inzicht: te
// verslepen aan de kop, groter of kleiner aan de hoek, in te klappen tot de
// balk en op volledig scherm te zetten. Dezelfde vensterlogica als het
// intake-venster (useZwevendVenster), zodat je ze naast elkaar kunt hebben.

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { X, GripVertical, Minus, Maximize2, Minimize2, CalendarDays, UtensilsCrossed } from 'lucide-react'
import { useModalHost } from '../../../coach/ModalHost'
import useZwevendVenster from '../../../components/useZwevendVenster'
import ClientAgendaView from '../../client-agenda/ClientAgendaView'
import AIMealDashboard from '../../meal-plan/AIMealDashboard'

// Breed genoeg voor de hele week naast elkaar; op een kleiner scherm de
// breedte van het scherm min een randje.
const STANDAARD = {
  w: Math.min(1180, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 48),
  h: 800,
}

export default function AgendaVenster({ db, client, isMobile, onClose }) {
  return (
    <KlantVenster titel="Agenda" Icoon={CalendarDays} client={client} isMobile={isMobile} onClose={onClose}>
      <ClientAgendaView client={client} db={db} isMobile={isMobile} viewerRole="coach" />
    </KlantVenster>
  )
}

// De maaltijdpagina van de klant, zoals hij hem zelf ziet: dagkiezer,
// macrobalk, maaltijden, Aanpassen en Wisselen. Alles wat je aanpast staat
// meteen in zijn plan. Afvinken en loggen staan uit (alleenKijken): dat zou in
// zijn logboek belanden alsof hij het zelf deed.
export function MaaltijdVenster({ db, client, isMobile, onClose }) {
  // De volledige klantrij: de lijst in Coach Command haalt bewust niet alle
  // kolommen op, en de maaltijdpagina heeft o.a. macrodoelen en het
  // trainingsrooster nodig.
  const [volledig, setVolledig] = useState(null)
  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let weg = false
    db.supabase.from('clients').select('*').eq('id', client.id).maybeSingle()
      .then(({ data }) => { if (!weg) setVolledig(data || client) }, () => { if (!weg) setVolledig(client) })
    return () => { weg = true }
  }, [db, client?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    // zIndex net boven Coach Inzicht (10000) en ónder de pop-ups van de
    // maaltijdpagina (info 10500, aanpassen 11000): die gaan via een portal
    // naar de body en moeten boven dit venster uitkomen.
    <KlantVenster titel="Voedingsplan" Icoon={UtensilsCrossed} client={client} isMobile={isMobile} onClose={onClose} standaard={{ w: 520, h: 860 }} zIndex={10050}>
      {volledig
        ? <AIMealDashboard client={volledig} db={db} alleenKijken onNavigate={() => {}} />
        : <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700 }}>Laden…</div>}
    </KlantVenster>
  )
}

function KlantVenster(props) {
  const { titel, Icoon, client, isMobile, onClose, standaard = STANDAARD, zIndex = null, children } = props
  const modalHost = useModalHost()
  const {
    ingeklapt, setIngeklapt, volledig, wisselVolledig, vensterStijl, sleepHandvat, formaatHandvat,
  } = useZwevendVenster({ isMobile, standaard: { ...standaard, w: Math.min(standaard.w, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 48) } })
  const naam = [client?.first_name, client?.last_name].filter(Boolean).join(' ').trim()

  const venster = (
    <div style={{
      ...vensterStijl,
      ...(zIndex != null ? { zIndex } : {}),
      background: 'rgba(10,10,10,0.96)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: volledig || isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: volledig || isMobile ? 0 : 16,
      boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.35)',
    }}>
      {/* Kop; op desktop ook het handvat om te verslepen. */}
      <div
        {...sleepHandvat}
        onDoubleClick={isMobile ? undefined : wisselVolledig}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          padding: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 0.6rem) 0.8rem 0.6rem' : '0.55rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          ...(sleepHandvat.style || {}),
        }}
      >
        {!isMobile && !volledig && <GripVertical size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />}
        <Icoon size={15} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', flexShrink: 0 }}>{titel}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</span>
        </div>
        {!isMobile && !volledig && (
          <button onClick={() => setIngeklapt(v => !v)} title={ingeklapt ? 'Uitklappen' : 'Inklappen'} aria-label={ingeklapt ? 'Uitklappen' : 'Inklappen'} style={kopKnop}>
            <Minus size={15} />
          </button>
        )}
        {!isMobile && (
          <button onClick={wisselVolledig} title={volledig ? 'Terug naar venster' : 'Volledig scherm'} aria-label={volledig ? 'Terug naar venster' : 'Volledig scherm'} style={kopKnop}>
            {volledig ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
        <button onClick={onClose} title="Sluiten" aria-label="Sluiten" style={kopKnop}>
          <X size={15} />
        </button>
      </div>

      {!ingeklapt && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
          {children}
        </div>
      )}

      {/* Hoekje rechtsonder om het venster groter of kleiner te maken. */}
      {formaatHandvat && !ingeklapt && (
        <div {...formaatHandvat} style={{
          position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, cursor: 'se-resize',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 3,
        }}>
          <div style={{ width: 9, height: 9, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)' }} />
        </div>
      )}
    </div>
  )

  // Geen gedimde achtergrond: de klantkaart eronder blijft bruikbaar.
  return createPortal(venster, modalHost)
}

const kopKnop = {
  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0, fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
