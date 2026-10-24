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
// Naam ('Deze week') en datums apart, zodat ze elk hun eigen gewicht krijgen.
const weekNaam = (maandagIso) => {
  const nu = maandagVan()
  if (maandagIso === nu) return 'Deze week'
  if (maandagIso === plusWeken(nu, 1)) return 'Volgende week'
  const a = new Date(`${maandagIso}T00:00:00`)
  return `Week ${weekNummer(a)}`
}
const weekNummer = (d) => {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7))
  const jan1 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1))
  return Math.ceil(((x - jan1) / 86400000 + 1) / 7)
}
const weekDatums = (maandagIso) => {
  const a = new Date(`${maandagIso}T00:00:00`)
  const b = new Date(a); b.setDate(b.getDate() + 6)
  return a.getMonth() === b.getMonth() ? `${a.getDate()}–${kort(b)}` : `${kort(a)} – ${kort(b)}`
}

// `inline`: in de kopregel van de Analyzer, zonder eigen balk en met een
// korte tekst ('2 dagen anders') in plaats van de uitleg.
export default function WeekKeuze({ weekModus, aantalAangepast, onKies, onTerugzetten, bezig, isMobile, inline = false }) {
  const nu = maandagVan()
  const week = weekModus
  const LIJN = 'rgba(255,255,255,0.14)'
  const vak = { height: 32, display: 'flex', alignItems: 'stretch', flexShrink: 0, borderRadius: 9, border: `1px solid ${LIJN}`, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }
  // Eén schakelaar met twee kanten: wat je bewerkt is óf het basisplan óf één week.
  const segment = (aan) => ({
    padding: '0 0.75rem', background: aan ? '#fff' : 'transparent', border: 'none',
    color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
    cursor: bezig || aan ? 'default' : 'pointer', whiteSpace: 'nowrap',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  const pijl = (uit) => ({
    width: 30, padding: 0, background: 'transparent', border: 'none',
    color: uit ? 'rgba(255,255,255,0.18)' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uit ? 'default' : 'pointer',
  })
  const terugUit = !week || week <= nu
  const aangepast = aantalAangepast > 0

  return (
    <div style={inline ? {
      display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, opacity: bezig ? 0.6 : 1,
    } : {
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap',
      padding: isMobile ? '0.4rem 0.6rem' : '0.4rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a',
      opacity: bezig ? 0.6 : 1,
    }}>
      <div style={vak}>
        <button onClick={() => !bezig && week && onKies(null)} style={segment(!week)} title="Het basisplan: herhaalt elke week">
          Elke week
        </button>
        <div style={{ width: 1, background: LIJN }} />
        <button onClick={() => !bezig && !week && onKies(plusWeken(nu, 1))} style={segment(!!week)} title="Eén week apart aanpassen">
          Eén week
        </button>
      </div>

      {/* Welke week: alleen als je er een bewerkt. Pijlen en week in één vak. */}
      {week && (
        <div style={vak}>
          <button onClick={() => !bezig && !terugUit && onKies(plusWeken(week, -1))} disabled={terugUit} style={pijl(terugUit)} aria-label="Vorige week">
            <ChevronLeft size={16} strokeWidth={2.8} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 0.35rem', minWidth: isMobile || inline ? 0 : 170, justifyContent: 'center', borderLeft: `1px solid ${LIJN}`, borderRight: `1px solid ${LIJN}`, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>{weekNaam(week)}</span>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{weekDatums(week)}</span>
          </div>
          <button onClick={() => !bezig && onKies(plusWeken(week, 1))} style={pijl(false)} aria-label="Volgende week">
            <ChevronRight size={16} strokeWidth={2.8} />
          </button>
        </div>
      )}

      {inline ? (week && (
        <span title={aangepast ? 'Deze dagen wijken af van elke week' : 'Wat je nu wijzigt geldt alleen deze week'} style={{
          flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontSize: '0.74rem', fontWeight: 900,
          ...(aangepast
            ? { color: '#0a0a0a', background: '#fff', borderRadius: 6, padding: '3px 8px' }
            : { color: 'rgba(255,255,255,0.5)', fontWeight: 800 }),
        }}>
          {aangepast ? `${aantalAangepast} ${aantalAangepast === 1 ? 'dag' : 'dagen'} anders` : 'Nog gelijk aan elke week'}
        </span>
      )) : (
      <span style={{ flex: 1, minWidth: isMobile ? '100%' : 0, order: isMobile ? 5 : 0, fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {week
          ? (aangepast
            ? <><span style={{ color: '#fff', fontWeight: 900 }}>{aantalAangepast} {aantalAangepast === 1 ? 'dag' : 'dagen'} anders</span> dan elke week · wijzigingen gelden alleen deze week</>
            : 'Nog gelijk aan elke week · wat je nu wijzigt geldt alleen deze week')
          : 'Wijzigingen gelden elke week'}
      </span>
      )}

      {week && aangepast && (
        <button onClick={() => !bezig && onTerugzetten()} title="Deze week weer gelijk aan elke week maken" style={{
          ...vak, alignItems: 'center', gap: 5, padding: inline ? '0 0.55rem' : '0 0.7rem',
          color: '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: bezig ? 'default' : 'pointer',
        }}>
          <RotateCcw size={13} strokeWidth={2.6} />{!inline && ' Terugzetten'}
        </button>
      )}
    </div>
  )
}
