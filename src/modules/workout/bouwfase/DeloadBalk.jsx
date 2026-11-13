// src/modules/workout/bouwfase/DeloadBalk.jsx
//
// "Deload week" door de hele app van de klant (13 nov 2026, Kersten): een
// balk bovenaan elke pagina zolang de deload loopt. Tik = het blad met waar de
// week om draait (herstellen) en de regels voor training en voeding. Geen
// losse melding "nieuw schema": dit is wat de klant ziet.

import { useState } from 'react'
import { BatteryCharging, ChevronRight } from 'lucide-react'
import BladModal from '../components/todays-workout/components/BladModal'
import useBouwfase from './useBouwfase'

const ORANJE = '#f59e0b'
const datumKort = (d) => d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

function Blok({ kop, regels }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginBottom: 2 }}>{kop}</div>
      {regels.filter(Boolean).map(r => (
        <div key={r} style={{ display: 'flex', gap: 8, fontSize: '0.86rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, marginTop: 5 }}>
          <span aria-hidden style={{ color: '#10b981', fontWeight: 900, flexShrink: 0 }}>→</span><span>{r}</span>
        </div>
      ))}
    </div>
  )
}

export default function DeloadBalk({ client, db, isMobile }) {
  const { fase, stand } = useBouwfase(client, db)
  const [open, setOpen] = useState(false)
  if (!fase || stand?.soort !== 'deload') return null

  const laatste = new Date(); laatste.setDate(laatste.getDate() + Math.max(0, (stand.dagen || 1) - stand.dag))
  // Heeft het schema halve sets (mesocyclus nieuwe stijl) of doet de klant het zelf?
  const metSchema = fase.nummer != null
  const was = Number(fase.macros_voor_deload?.calories) || 0
  const nu = Number(client?.target_calories) || 0
  const kcalOmhoog = metSchema && was > 0 && nu > was

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 40, padding: isMobile ? '0 1rem' : '0 1.25rem',
        background: 'rgba(245,158,11,0.12)', border: 'none', borderBottom: '1px solid rgba(245,158,11,0.25)',
        color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <BatteryCharging size={17} color={ORANJE} strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Deload week <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>· dag {stand.dag} van {stand.dagen} · herstellen</span>
        </span>
        <ChevronRight size={16} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
      </button>

      <BladModal open={open} titel="Deload week" onClose={() => setOpen(false)}>
        <div style={{ padding: '1rem 1.25rem 1.5rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: ORANJE }}>
            Dag {stand.dag} van {stand.dagen} · tot en met {datumKort(laatste)}
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', lineHeight: 1.5, marginTop: 6 }}>
            Deze week draait om herstellen. Je lichaam verwerkt de afgelopen weken, en daar word je sterker van. Minder doen is nu het plan.
          </div>
          <Blok kop="Training" regels={[
            metSchema ? 'Je schema staat op de helft: halve sets en halve herhalingen.' : 'Doe ongeveer de helft van je normale sets.',
            'Pak ongeveer de helft van je normale gewicht. Het moet makkelijk voelen.',
            'Geen sets tot falen en geen records deze week.',
            'Kom wel trainen: licht bewegen helpt je herstel.',
          ]} />
          <Blok kop="Voeding" regels={[
            kcalOmhoog
              ? `Je eet deze week op onderhoud: ${Math.round(nu)} kcal in plaats van ${Math.round(was)}. De extra kcal zijn koolhydraten.`
              : 'Je kcal en macro\'s blijven gelijk.',
            'Haal elke dag je eiwit.',
          ]} />
          <Blok kop="Herstel" regels={[
            'Slaap 7 tot 9 uur per nacht.',
            'Blijf je stappen halen.',
            metSchema ? 'Staat er "Nieuw om te proberen" in je training? Test die oefening rustig en geef aan of je hem in je volgende fase wilt.' : null,
          ]} />
        </div>
      </BladModal>
    </>
  )
}
