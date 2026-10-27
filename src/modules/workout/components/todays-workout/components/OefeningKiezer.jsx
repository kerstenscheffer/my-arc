// src/modules/workout/components/todays-workout/components/OefeningKiezer.jsx
//
// Gedeelde bouwstenen voor het toevoeg- en het wisselvenster op de
// workout-pagina van de klant. Beide vensters zijn hetzelfde soort scherm
// (zoek een oefening, kies er één), dus ze delen de schil, de zoekbalk en de
// rij. Alles uit src/ui/tokens volgens DESIGN-CONTRACT.md.
import { useEffect, useState } from 'react'
import { createPortal } from '../../../../../client/paginaPortal'
import { X, Search, ArrowRight, Dumbbell } from 'lucide-react'
import { colors, radius, space, overlay, gradientImage } from '../../../../../ui/tokens'
import { getFallbackImage } from '../../../utils/oefeningFoto'
import { fotoVoor, spierLabel, materiaalLabel } from '../../../utils/oefeningLabels'

// Foto die bij een kapotte link terugvalt op de stockfoto van de spiergroep.
export function OefeningFoto({ ex, maat = 56 }) {
  const [src, setSrc] = useState(() => fotoVoor(ex))
  useEffect(() => { setSrc(fotoVoor(ex)) }, [ex])
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => {
        const reserve = getFallbackImage({ ...ex, primairSpieren: ex?.primair_spieren || ex?.primairSpieren })
        if (src !== reserve) setSrc(reserve)
      }}
      style={{
        width: maat, height: maat, flexShrink: 0, objectFit: 'cover',
        borderRadius: radius.btn, background: colors.surfaceHover, display: 'block',
      }}
    />
  )
}

// De schil: overlay met blur, mobiel een bottom sheet, desktop gecentreerd.
// `kop` blijft staan (zoeken en filters), `children` scrollt.
export function KiezerSchil({ titel, onClose, isMobile, kop, children }) {
  const [zichtbaar, setZichtbaar] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setZichtbaar(true), 20)
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const opToets = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', opToets)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = vorige
      window.removeEventListener('keydown', opToets)
    }
  }, [onClose])

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: overlay.color, backdropFilter: overlay.blur, WebkitBackdropFilter: overlay.blur,
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : space[6],
        opacity: zichtbaar ? 1 : 0, transition: 'opacity 0.2s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: isMobile ? '100%' : 560,
        height: isMobile ? '92dvh' : 'min(760px, 88vh)',
        // Zelfde blad als het maaltijd-wisselvenster: zwart, ronde bovenhoeken.
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '22px 22px 0 0' : 22,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transform: zichtbaar ? 'translateY(0)' : 'translateY(24px)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ flexShrink: 0, padding: space[4], paddingBottom: space[3], display: 'flex', flexDirection: 'column', gap: space[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space[3] }}>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.025em', color: colors.textPrimary }}>{titel}</div>
            <button
              onClick={onClose}
              aria-label="Sluiten"
              style={{
                width: 36, height: 36, flexShrink: 0, padding: 0, marginRight: -6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none',
                color: colors.textPrimary, cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={22} strokeWidth={2.4} />
            </button>
          </div>
          {kop}
        </div>
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${space[4]}px)`,
        }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export function ZoekVeld({ waarde, zet, placeholder, autoFocus }) {
  return (
    <div style={{ position: 'relative' }}>
      <Search size={17} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: space[3], top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      <input
        type="text"
        value={waarde}
        onChange={(e) => zet(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', height: 44, boxSizing: 'border-box',
          padding: `0 ${space[3]}px 0 ${space[8] + space[2]}px`,
          background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 12,
          color: colors.textPrimary, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none',
        }}
      />
    </div>
  )
}

// Een rij keuzemenu's naast elkaar, gescheiden door een haarlijn.
export function FilterBalk({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 40,
    }}>
      {children}
    </div>
  )
}
export const FilterStreep = () => <div style={{ width: 1, height: 16, background: colors.borderSubtle, flexShrink: 0 }} />

// Eén oefening in de lijst: foto, naam, spiergroep en materiaal.
export function OefeningRij({ ex, onClick, rechts, actief, uit }) {
  const meta = [
    ex.primair_spieren && spierLabel(ex.primair_spieren),
    ex.equipment && materiaalLabel(ex.equipment),
    ex._isCustom && 'Eigen oefening',
    !ex._isCustom && ex.home_friendly && 'Thuis',
  ].filter(Boolean).join(' · ')
  return (
    <button
      onClick={onClick}
      disabled={uit}
      style={{
        width: '100%', minHeight: 72, display: 'flex', alignItems: 'center', gap: space[3],
        padding: `${space[2]}px ${space[4]}px`,
        background: actief ? colors.surfaceHover : 'transparent', border: 'none',
        textAlign: 'left', fontFamily: 'inherit', cursor: uit ? 'default' : 'pointer',
        opacity: uit ? 0.5 : 1,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <OefeningFoto ex={ex} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ex.name}
        </div>
        {meta && (
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meta}
          </div>
        )}
      </div>
      {rechts}
    </button>
  )
}

// De oefening die je wisselt, als foto-kaart bovenaan.
export function HuidigeOefening({ ex, ondertitel }) {
  return (
    <div style={{
      position: 'relative', height: 104, borderRadius: radius.card, overflow: 'hidden',
      background: colors.surfaceHover,
    }}>
      <img
        src={fotoVoor(ex)} alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: gradientImage }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
      <div style={{ position: 'absolute', left: space[4], right: space[4], bottom: space[3], textShadow: '0 2px 8px rgba(0,0,0,0.85)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.accent }}>Je wisselt</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ex.name}
        </div>
        {ondertitel && <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{ondertitel}</div>}
      </div>
    </div>
  )
}

// Oud -> nieuw in twee cirkels, zoals het wisselvenster van de maaltijden
// (27 okt 2026). Links wat je wisselt, rechts de aangetikte vervanger die
// erin popt; nog niets gekozen = stippellijn.
export function WisselCirkels({ oud, oudOnder, nieuw }) {
  const cirkel = { width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', background: colors.surfaceHover, border: '1px solid rgba(255,255,255,0.12)', boxSizing: 'border-box' }
  const naam = { fontSize: 13, fontWeight: 800, color: colors.textPrimary, marginTop: space[2], maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
  const onder = { fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginTop: 2, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
  const kant = { flex: '0 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }
  const nieuwOnder = nieuw ? [spierLabel(nieuw.primair_spieren), materiaalLabel(nieuw.equipment)].filter(Boolean).join(' · ') : ''
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 6, padding: `${space[1]}px 0 ${space[2]}px` }}>
      <style>{'@keyframes okPopIn { 0% { opacity: 0; transform: scale(0.4) } 100% { opacity: 1; transform: scale(1) } }'}</style>
      <div style={kant}>
        <img src={fotoVoor(oud)} alt="" style={{ ...cirkel, opacity: 0.6 }} onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
        <div style={naam}>{oud?.name}</div>
        {oudOnder && <div style={onder}>{oudOnder}</div>}
      </div>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <ArrowRight size={20} strokeWidth={2.8} color="#fff" />
      </div>
      <div style={kant}>
        {nieuw ? (
          <div key={nieuw.name} style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'okPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
            <img src={fotoVoor(nieuw)} alt="" style={cirkel} onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
            <div style={naam}>{nieuw.name}</div>
            {nieuwOnder && <div style={onder}>{nieuwOnder}</div>}
          </div>
        ) : (<>
          <div style={{ ...cirkel, border: '1.5px dashed rgba(255,255,255,0.35)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <Dumbbell size={22} strokeWidth={2} />
          </div>
          <div style={{ ...onder, marginTop: space[2] }}>Kies hieronder</div>
        </>)}
      </div>
    </div>
  )
}

// Laden: grijze rijen met dezelfde maat als de echte.
export function LaadRijen({ aantal = 7 }) {
  return (
    <div>
      <style>{'@keyframes okPuls { 0%,100% { opacity: 0.5 } 50% { opacity: 0.9 } }'}</style>
      {Array.from({ length: aantal }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: space[3], padding: `${space[2]}px ${space[4]}px`, minHeight: 72, animation: 'okPuls 1.4s ease-in-out infinite' }}>
          <div style={{ width: 56, height: 56, borderRadius: radius.btn, background: colors.surfaceHover }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '55%', height: 14, borderRadius: 6, background: colors.surfaceHover }} />
            <div style={{ width: '35%', height: 12, borderRadius: 6, background: colors.surfaceHover, marginTop: space[2] }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Secundaire knop onderaan de lijst.
export function EigenOefeningKnop({ onClick, label = 'Eigen oefening maken', icoon }) {
  return (
    <div style={{ padding: space[4] }}>
      <button
        onClick={onClick}
        style={{
          width: '100%', minHeight: 48, borderRadius: radius.btn,
          background: 'transparent', border: `1px solid ${colors.borderSubtle}`,
          color: colors.textPrimary, fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space[2],
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {icoon}{label}
      </button>
    </div>
  )
}
