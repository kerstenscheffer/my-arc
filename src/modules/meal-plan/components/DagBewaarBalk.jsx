// src/modules/meal-plan/components/DagBewaarBalk.jsx
//
// Eén regel boven de maaltijden die zegt welke dag je voor je hebt.
//
// Komt de dag uit een bewaarde dag — van je coach of van jezelf — dan staat
// daar zijn naam. Wissel je één maaltijd, dan klopt dat niet meer en valt de
// naam weg. Dat is geen vlaggetje in de database maar een
// vergelijking van de inhoud: welke maaltijd staat op welk slot. Zo kan er geen
// naam blijven staan bij een dag die allang iets anders is.

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, ChevronRight } from 'lucide-react'
import {
  getKlantDagTemplates, getEigenDagen, vindDag, BRON_KLANT,
} from '../DayTemplateService'

const LIJN = 'rgba(255,255,255,0.1)'

export default function DagBewaarBalk({
  db, client, maaltijden, isMobile, verversSleutel = 0,
  // Deze regel is ook de ingang naar de bewaarde dagen: een tik op de naam
  // links opent dat paneel. Vroeger zat dat achter een verticale tab tegen de
  // linkerrand van het scherm, en die viel niemand op.
  onOpenDagen,
}) {
  const [dagen, setDagen] = useState([])

  const laad = useCallback(async () => {
    if (!db?.supabase || !client?.id) return
    const [coach, eigen] = await Promise.all([
      getKlantDagTemplates(db.supabase, client.id),
      getEigenDagen(db.supabase, client.id),
    ])
    setDagen([...eigen, ...coach])
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad, verversSleutel])

  if (!maaltijden?.length) return null

  const herkend = vindDag(maaltijden, dagen)

  const rij = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: isMobile ? '0.7rem 1rem' : '0.8rem 1.25rem',
    borderBottom: `1px solid ${LIJN}`,
  }

  // Het linkerdeel van de regel — icoon plus naam — is de knop naar de dagen.
  const linkerKnop = {
    flex: 1, minWidth: 0,
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'transparent', border: 'none', padding: 0,
    color: 'inherit', fontFamily: 'inherit', textAlign: 'left',
    cursor: onOpenDagen ? 'pointer' : 'default',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }

  // Deze dag heeft een naam: laten zien welke, en waar hij vandaan komt.
  if (herkend) {
    const vanMij = herkend.bron === BRON_KLANT
    return (
      <div style={rij}>
        <button onClick={() => onOpenDagen?.()} disabled={!onOpenDagen} style={linkerKnop}>
          <CalendarDays size={16} color="rgba(255,255,255,0.5)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
          <span style={{
            minWidth: 0, fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: 800,
            color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {herkend.name || herkend.template_name}
          </span>
          {onOpenDagen && (
            <ChevronRight size={16} strokeWidth={3.4} color="#fff" style={{ flexShrink: 0 }} />
          )}
          {/* Duwt het label rechts naar de rand; het pijltje blijft zo tegen
              de naam aan staan in plaats van aan de andere kant van de regel. */}
          <span style={{ flex: 1 }} />
        </button>
        {/* Alleen bij een dag van de coach een label; een eigen dag heeft er geen nodig. */}
        {!vanMij && (
          <span style={{
            flexShrink: 0, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.06em',
            textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6,
            color: 'rgba(255,255,255,0.6)', background: 'transparent', border: `1px solid ${LIJN}`,
          }}>
            Van je coach
          </span>
        )}
      </div>
    )
  }

  // Niets herkend: geen naam, alleen de weg naar de dagen — en die alleen als
  // er dagen zijn om uit te kiezen. Zelf een dag bewaren kan niet meer: dat
  // werd niet gebruikt (okt 2026), oude bewaarde dagen blijven wel kiesbaar.
  if (!dagen.length || !onOpenDagen) return null
  return (
    <div style={rij}>
      <button onClick={() => onOpenDagen()} style={linkerKnop}>
        <CalendarDays size={16} color="rgba(255,255,255,0.4)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span style={{ minWidth: 0, fontSize: isMobile ? '0.85rem' : '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Andere dag kiezen
        </span>
        <ChevronRight size={16} strokeWidth={3.4} color="#fff" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }} />
      </button>
    </div>
  )
}
