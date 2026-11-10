// src/modules/ai-meal-generator/tabs/plan-analyzer/WeekStats.jsx
//
// De week in cijfers (10 nov 2026), zelfde opzet als het spieroverzicht in
// de workout builder: één blok met per macro een kolom. Dicht zie je alleen
// de grijze kopregel (weekgemiddelde tegen het doel); klik erop en per macro
// staan de zeven dagen eronder, met kleur als een dag buiten de band valt.
// Daaronder de signalen: wat valt op in deze week. Klik op een dag of een
// signaal om die dag te openen.

import { AlertTriangle, Info } from 'lucide-react'
import { MACROS, pctVan, pctKleur, weekGemiddelde, weekSignalen } from './weekCijfers'

const LIJN = '1px solid rgba(255,255,255,0.12)'
const DUN = '1px solid rgba(255,255,255,0.06)'
const DAG = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const getallen = { fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }
// Op het lichte vlak: donkerder tinten voor contrast.
const DONKER = { '#ef4444': '#b91c1c', '#f59e0b': '#b45309', '#22c55e': '#047857' }
const ERNST = { rood: '#ef4444', oranje: '#f59e0b', grijs: 'rgba(255,255,255,0.55)' }

export default function WeekStats({ dagen, targets = {}, open, onOpen, onKiesDag, isMobile }) {
  const gem = weekGemiddelde(dagen)
  const signalen = weekSignalen(dagen, targets)
  const doelVan = (mac) => Number(targets?.[mac.doel]) || 0
  const m = isMobile

  return (
    <div style={{ border: LIJN, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MACROS.length}, minmax(${m ? 120 : 0}px, 1fr))`, overflowX: m ? 'auto' : 'visible' }}>
        {MACROS.map((mac, i) => {
          const doel = doelVan(mac)
          const p = pctVan(gem[mac.key], doel)
          const kleur = p == null ? null : pctKleur(p)
          return (
            <div key={mac.key} style={{ borderLeft: i ? LIJN : 'none', minWidth: 0 }}>
              <button onClick={() => onOpen?.(!open)} aria-expanded={!!open} title={open ? 'Inklappen' : 'Per dag tonen'} style={{
                width: '100%', display: 'flex', alignItems: 'baseline', gap: 6, padding: '0.6rem 0.75rem',
                background: '#e6e6e6', border: 'none', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', color: '#000',
              }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{mac.label}</span>
                {kleur && kleur !== '#22c55e' && <span title={`${Math.round(p)}% van het doel`} style={{ fontSize: '0.8rem', fontWeight: 900, color: DONKER[kleur] }}>{p < 100 ? '↓' : '↑'}</span>}
                <span style={{ marginLeft: 'auto', ...getallen, fontSize: '0.92rem', fontWeight: 900 }}>{nl(gem[mac.key])}</span>
                {doel > 0 && <span style={{ ...getallen, fontSize: '0.7rem', fontWeight: 800, color: 'rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>/ {nl(doel)}{mac.eenheid}</span>}
              </button>
              {open && (
                <div style={{ borderTop: LIJN }}>
                  {dagen.map((dag, j) => {
                    const pd = pctVan(dag[mac.key], doel)
                    const leeg = dag.maaltijden.length === 0
                    return (
                      <button key={dag.index} onClick={() => onKiesDag?.(dag.index)} title={`${DAG[dag.index]} openen`} style={{
                        width: '100%', display: 'flex', alignItems: 'baseline', gap: 6, padding: '0.38rem 0.75rem',
                        background: 'transparent', border: 'none', borderTop: j ? DUN : 'none',
                        fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                      }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff', width: 22 }}>{DAG[dag.index]}</span>
                        {dag.training && <span title="Trainingsdag" style={{ fontSize: '0.56rem', fontWeight: 900, color: '#0a0a0a', background: '#fff', borderRadius: 3, padding: '0 3px', lineHeight: '12px' }}>T</span>}
                        <span style={{ marginLeft: 'auto', ...getallen, fontSize: '0.84rem', fontWeight: 900, color: leeg ? 'rgba(255,255,255,0.3)' : '#fff' }}>{leeg ? '—' : nl(dag[mac.key])}</span>
                        {pd != null && !leeg && (
                          <span style={{ ...getallen, width: 38, textAlign: 'right', fontSize: '0.7rem', fontWeight: 900, color: pctKleur(pd) }}>{Math.round(pd)}%</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Signalen: altijd zichtbaar als er iets is, ook dichtgeklapt kort. */}
      {signalen.length > 0 && (
        <div style={{ borderTop: LIJN, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(open ? signalen : signalen.slice(0, 2)).map((s, i) => (
            <button key={i} onClick={() => s.dagen?.length && onKiesDag?.(s.dagen[0])} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '0.15rem 0', background: 'none', border: 'none',
              fontFamily: 'inherit', cursor: s.dagen?.length ? 'pointer' : 'default', textAlign: 'left',
              fontSize: '0.8rem', fontWeight: 800, color: s.ernst === 'grijs' ? 'rgba(255,255,255,0.7)' : '#fff',
            }}>
              {s.ernst === 'grijs'
                ? <Info size={13} strokeWidth={2.8} color={ERNST.grijs} style={{ flexShrink: 0 }} />
                : <AlertTriangle size={13} strokeWidth={2.8} color={ERNST[s.ernst]} style={{ flexShrink: 0 }} />}
              <span>{s.tekst}</span>
            </button>
          ))}
          {!open && signalen.length > 2 && (
            <button onClick={() => onOpen?.(true)} style={{ alignSelf: 'flex-start', padding: 0, background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>
              + {signalen.length - 2} meer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
