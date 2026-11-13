// src/modules/workout/bouwfase/DeloadBalk.jsx
//
// "Deload week" door de hele app van de klant (13 nov 2026, Kersten): een
// balk bovenaan elke pagina zolang de deload loopt. Tik = het blad met waar de
// week om draait (herstellen) en de regels voor training en voeding. Geen
// losse melding "nieuw schema": dit is wat de klant ziet.

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import BladModal from '../components/todays-workout/components/BladModal'
import useBouwfase from './useBouwfase'

const ORANJE = '#f59e0b'
const datumKort = (d) => d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

// Een batterij met één streepje per deload-dag (13 nov 2026, Kersten). Elke
// dag komt er een streepje bij en loopt de kleur van oranje naar groen: je
// laadt op. Zo zie je in één oogopslag hoe ver de week is.
function Batterij({ dag, dagen }) {
  const n = Math.max(1, Math.min(14, Number(dagen) || 7))
  const vol = Math.max(0, Math.min(n, Number(dag) || 0))
  const streep = 3, tussen = 1.5, rand = 2.5, hoogte = 14
  const breedte = rand * 2 + n * streep + (n - 1) * tussen
  // Oranje (245,158,11) → groen (16,185,129), naar hoe ver de week is.
  const deel = n > 1 ? (vol - 1) / (n - 1) : 1
  const meng = (a, b) => Math.round(a + (b - a) * Math.max(0, deel))
  const kleur = `rgb(${meng(245, 16)},${meng(158, 185)},${meng(11, 129)})`
  return (
    <svg width={breedte + 3} height={hoogte} viewBox={`0 0 ${breedte + 3} ${hoogte}`} aria-hidden style={{ flexShrink: 0 }}>
      <rect x="0.75" y="0.75" width={breedte - 1.5} height={hoogte - 1.5} rx="3" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
      <rect x={breedte + 0.5} y={hoogte / 2 - 2.5} width="2" height="5" rx="1" fill="rgba(255,255,255,0.45)" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={rand + i * (streep + tussen)} y={rand + 0.5} width={streep} height={hoogte - rand * 2 - 1} rx="0.8"
          fill={i < vol ? kleur : 'rgba(255,255,255,0.12)'} />
      ))}
    </svg>
  )
}

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
      {/* Eén regel op een oranje vlak, zonder rand (13 nov 2026, Kersten): de
          batterij, dik wit, de dag ernaast. */}
      <button onClick={() => setOpen(true)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 38, padding: isMobile ? '0 1rem' : '0 1.25rem',
        background: 'rgba(245,158,11,0.14)', border: 'none', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <Batterij dag={stand.dag} dagen={stand.dagen} />
        <span style={{ fontSize: '0.86rem', fontWeight: 900, whiteSpace: 'nowrap' }}>Deload week</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>dag {stand.dag} van {stand.dagen}</span>
        <ChevronRight size={15} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
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
            metSchema ? 'Je schema is lichter gemaakt: minder sets (minimaal 2) en halve herhalingen.' : 'Doe ongeveer de helft van je normale sets.',
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
