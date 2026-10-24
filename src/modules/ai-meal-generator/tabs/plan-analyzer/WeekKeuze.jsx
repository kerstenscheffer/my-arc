// src/modules/ai-meal-generator/tabs/plan-analyzer/WeekKeuze.jsx
//
// Kiezen wat je bewerkt: het basisplan (herhaalt elke week) of één bepaalde
// week. In een week slaat de Analyzer alleen de dagen op die afwijken van de
// basis, als datum-dag (client_day_overrides, bron 'coach'). De klant ziet
// die week dan die dagen; de week erna weer gewoon de basis.

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

const iso = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const maandagVan = (d = new Date()) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return iso(x)
}
const plusWeken = (maandagIso, n) => {
  const d = new Date(`${maandagIso}T00:00:00`); d.setDate(d.getDate() + 7 * n)
  return iso(d)
}
const kort = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
const weekLabel = (maandagIso) => {
  const a = new Date(`${maandagIso}T00:00:00`)
  const b = new Date(a); b.setDate(b.getDate() + 6)
  const nu = maandagVan()
  const naam = maandagIso === nu ? 'Deze week' : maandagIso === plusWeken(nu, 1) ? 'Volgende week' : null
  return `${naam ? `${naam} · ` : ''}${kort(a)} – ${kort(b)}`
}

export default function WeekKeuze({ weekModus, aantalAangepast, onKies, onTerugzetten, bezig, isMobile }) {
  const nu = maandagVan()
  const knop = (aan) => ({
    height: 32, padding: '0 0.7rem', borderRadius: 9, flexShrink: 0,
    background: aan ? '#fff' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`,
    color: aan ? '#0a0a0a' : '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 5, cursor: bezig ? 'default' : 'pointer',
    whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  const pijl = (uit) => ({
    width: 30, height: 32, padding: 0, borderRadius: 9, flexShrink: 0,
    background: 'transparent', border: 'none', color: uit ? 'rgba(255,255,255,0.2)' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uit ? 'default' : 'pointer',
  })
  const week = weekModus

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: isMobile ? 'wrap' : 'nowrap',
      padding: isMobile ? '0.4rem 0.6rem' : '0.4rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a',
      opacity: bezig ? 0.6 : 1,
    }}>
      <button onClick={() => !bezig && week && onKies(null)} style={knop(!week)} title="Het basisplan: herhaalt elke week">
        Elke week
      </button>
      <button onClick={() => !bezig && week && week > nu && onKies(plusWeken(week, -1))} disabled={!week || week <= nu} style={pijl(!week || week <= nu)} aria-label="Vorige week">
        <ChevronLeft size={17} strokeWidth={2.6} />
      </button>
      <button onClick={() => !bezig && !week && onKies(plusWeken(nu, 1))} style={{ ...knop(!!week), minWidth: isMobile ? 0 : 190, justifyContent: 'center' }}
        title="Eén week apart aanpassen">
        {week ? weekLabel(week) : 'Week aanpassen…'}
      </button>
      <button onClick={() => !bezig && onKies(week ? plusWeken(week, 1) : plusWeken(nu, 1))} style={pijl(false)} aria-label="Volgende week">
        <ChevronRight size={17} strokeWidth={2.6} />
      </button>

      <span style={{ flex: 1, minWidth: isMobile ? '100%' : 0, order: isMobile ? 5 : 0, fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {week
          ? (aantalAangepast > 0
            ? <><span style={{ color: '#fff', fontWeight: 900 }}>{aantalAangepast} {aantalAangepast === 1 ? 'dag' : 'dagen'} anders</span> dan elke week · wijzigingen gelden alleen deze week</>
            : 'Nog gelijk aan elke week · wat je nu wijzigt geldt alleen deze week')
          : 'Wijzigingen gelden elke week'}
      </span>

      {week && aantalAangepast > 0 && (
        <button onClick={() => !bezig && onTerugzetten()} style={knop(false)} title="Deze week weer gelijk aan elke week maken">
          <RotateCcw size={13} strokeWidth={2.6} /> Terugzetten
        </button>
      )}
    </div>
  )
}
