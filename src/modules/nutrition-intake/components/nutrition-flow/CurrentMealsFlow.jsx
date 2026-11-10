// src/modules/nutrition-intake/components/nutrition-flow/CurrentMealsFlow.jsx
// Stap 0: Huidige eetgewoonten, wat eet je op een typische dag?
// Vaste structuur (4 slots) met toevoeg-optie, vrije tekst + suggesties
import React, { useState, useRef } from 'react'
import { createPortal } from '../../../../client/paginaPortal'
import { Lightbulb, ImagePlus, X } from 'lucide-react'
import { Q, Hint, NextBtn, BigOption } from '../../../public-intake/components/phase1/FlowStep'
import { MaaltijdDrillDown, MAALTIJD_CONFIG, MIN_ITEMS_PER_MEAL, countMealItems, isMealSkipped } from './EatPatternFlow'

const vrijVeld = (isMobile) => ({
  width: '100%', boxSizing: 'border-box',
  padding: isMobile ? '0.75rem 0.9rem' : '0.8rem 1rem',
  background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem',
  fontWeight: 500, fontFamily: 'inherit', outline: 'none',
  resize: 'none', lineHeight: 1.5,
})

const SUGGESTIONS = {
  ontbijt: [
    'Havermout', 'Brood met kaas', 'Brood met pindakaas', 'Yoghurt met granola',
    'Eieren', 'Kwark', 'Croissant', 'Smoothie', 'Fruit', 'Cornflakes met melk',
    'Skyr met fruit', 'Eiwitshake', 'Niks / sla ontbijt over',
  ],
  lunch: [
    'Brood met beleg', 'Salade', 'Soep', 'Wrap', 'Restjes avondeten',
    'Rijst met groenten', 'Pasta', 'Kwark', 'Niks / sla lunch over',
  ],
  diner: [
    'Aardappelen, groenten en vlees', 'Pasta', 'Rijst met kip', 'Pizza',
    'Wrap / burrito', 'Stamppot', 'Roerbakgerecht', 'Vis met groenten',
    'Soep', 'Eiwitrijke salade', 'Besteld eten / afhaal',
  ],
  snack: [
    'Fruit', 'Yoghurt', 'Noten', 'Kwark', 'Eiwitreep', 'Rijstwafels',
    'Chips of koekjes', 'Snoep', 'Brood of cracker', 'Kaas', 'Niks / geen snacks',
  ],
}

const BASE_SLOTS = [
  { key: 'ontbijt', label: 'Ontbijt',    placeholder: 'Bijv: havermout met banaan en melk' },
  { key: 'lunch',   label: 'Lunch',      placeholder: 'Bijv: 2 boterhammen met kaas' },
  { key: 'diner',   label: 'Diner',      placeholder: 'Bijv: rijst, kip en broccoli' },
  { key: 'snack',   label: 'Snack',      placeholder: 'Bijv: kwark met fruit' },
]


// Voorbeeld-tegel rechts van het invulvak: laat zien wat voor screenshot we
// willen, zodat mensen er zelf een sturen. Echte maaltijd uit de app
// van Kersten: naam, kcal, macro's en ingrediënten met grammen. Verdwijnt
// zodra er bij dit moment een screenshot staat. Tikken vergroot 'm.
const VOORBEELD_SRC = '/voorbeeld-screenshot.png'

function VoorbeeldTegel() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Vergroot voorbeeld" style={{
        width: 84, flexShrink: 0, alignSelf: 'stretch', padding: 0,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        borderRadius: 14, border: '1px dashed rgba(255,255,255,0.3)', background: '#000',
        cursor: 'zoom-in', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <img src={VOORBEELD_SRC} alt="Voorbeeld van een goede screenshot uit een voedingsapp"
          style={{ display: 'block', width: '100%', flex: 1, minHeight: 0, objectFit: 'cover', objectPosition: 'top left' }} />
        <span style={{
          display: 'block', padding: '0.35rem 0', background: '#fff', color: '#000',
          fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center',
        }}>Voorbeeld</span>
      </button>

      {open && createPortal(
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 2147483600,
          background: 'rgba(0,0,0,0.94)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '0.9rem',
          padding: '1.5rem', cursor: 'zoom-out',
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center' }}>
            Dit wil ik graag zien
          </div>
          <img src={VOORBEELD_SRC} alt="Voorbeeld van een bruikbare screenshot"
            style={{ maxWidth: 'min(420px, 92vw)', maxHeight: '68vh', objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', display: 'block' }} />
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.55, maxWidth: 300 }}>
            Naam, calorieën, de macro's en de ingrediënten met hoeveelheden. Hoe completer, hoe beter ik je plan kan maken.
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const RADIUS = 14

// Vierkante icoonknop in de balk onderin de kaart, compact zoals de knoppen
// op de meal cards in de app.
const icoonKnop = {
  width: 36, height: 36, flexShrink: 0, padding: 0, borderRadius: 10,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
  color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

// Kaal icoon in de balk: geen eigen vlak of rand, zodat de regel laag blijft.
const balkIcoon = {
  width: 30, height: 30, flexShrink: 0, padding: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

// Wat de klant in de keuze-modal aantikte, als leesbare namen.
function gekozenNamen(maaltijdKey, data) {
  const cfg = MAALTIJD_CONFIG[maaltijdKey]
  if (!cfg) return []
  const subLabel = {}
  cfg.categories.forEach(c => c.subs.forEach(sub => { subLabel[sub.id] = sub.label }))
  const subs = (data[`${maaltijdKey}_subs`] || []).map(id => {
    if (subLabel[id]) return subLabel[id]
    const i = id.indexOf('_custom_')
    return i >= 0 ? id.slice(i + 8) : null
  })
  const teksten = Object.values(data[`${maaltijdKey}_text`] || {}).map(t => (t || '').trim())
  const overslaan = isMealSkipped(maaltijdKey, data) ? ['Sla ik over'] : []
  return [...overslaan, ...subs, ...teksten].filter(Boolean)
}

// Keuze-modal: wat eet je of vind je lekker. Zelfde opbouw als de slaap-popup
// in de app (SlaapKnop): donkere blur-achtergrond, kaart met kop, sluitknop,
// witte hoofdknop onderaan. Voor ontbijt/lunch/diner de foto-kaarten uit de
// oude voorkeurenstap (EatPatternFlow); voor snacks de losse suggesties.
function KeuzeModal({ maaltijdKey, titel, data, onChange, onKies, onClose, isMobile }) {
  const heeftKaarten = !!MAALTIJD_CONFIG[maaltijdKey]
  const aantal = heeftKaarten ? countMealItems(maaltijdKey, data) : 0
  const klaar = !heeftKaarten || isMealSkipped(maaltijdKey, data) || aantal >= MIN_ITEMS_PER_MEAL
  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 2147483100,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1.1rem 1rem 0.8rem' }}>
          <div style={{ width: 40 }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {titel}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              Wat eet je of vind je lekker?
            </div>
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{ ...icoonKnop, width: 40, height: 40, borderRadius: 12 }}>
            <X size={18} strokeWidth={2.8} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem' }}>
          {heeftKaarten ? (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '0.9rem' }}>
                Tik aan wat je eet of graag eet, minimaal {MIN_ITEMS_PER_MEAL}.
              </div>
              <MaaltijdDrillDown maaltijdKey={maaltijdKey} data={data} onChange={onChange} isMobile={isMobile} tweeKolommen />
            </>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
              {(SUGGESTIONS[maaltijdKey] || SUGGESTIONS.snack).map(sug => (
                <button key={sug} type="button" onClick={() => onKies(sug)} style={{
                  minHeight: 38, padding: '0 0.85rem', borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  touchAction: 'manipulation',
                }}>{sug}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '0.8rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {heeftKaarten && (
            <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 800, marginBottom: 10, color: klaar ? '#10b981' : 'rgba(255,255,255,0.55)' }}>
              {isMealSkipped(maaltijdKey, data) ? 'Je slaat deze maaltijd over'
                : klaar ? `✓ ${aantal} gekozen` : `${aantal} van ${MIN_ITEMS_PER_MEAL} gekozen`}
            </div>
          )}
          <button onClick={onClose} style={{
            width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a',
            fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>Klaar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function MealSlot({
  slotKey, label, placeholder, value, onChange, isMobile, removable, onRemove,
  shots = [], onShots, werktGoed, onWerktGoed, uploaden, flowData, onFlowChange, momentLabel,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const gekozen = flowData ? gekozenNamen(slotKey, flowData) : []
  const [focus, setFocus] = useState(false)
  const inputRef = useRef(null)
  // "Wat werkt goed?" pas tonen als er iets staat: eerst vertellen wat je
  // eet, dan pas wat eraan bevalt. Blijft staan als het al was ingevuld.
  const toonWerkt = !!(value || '').trim() || !!(werktGoed || '').trim()

  const appendSuggestion = (s) => {
    const current = value || ''
    const separator = current.trim() ? ', ' : ''
    onChange(current.trim() + separator + s)
  }

  return (
    <div style={{ marginBottom: '1.1rem' }}>
      {(label || removable) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{label}</div>
          {removable && (
            <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', padding: 0, fontFamily: 'inherit', touchAction: 'manipulation' }}>
              Verwijder
            </button>
          )}
        </div>
      )}

      {/* Eén kaart: tekst bovenin, knoppen onderin binnen dezelfde rand.
          Rechts ervan het voorbeeld, zolang er nog geen screenshot is. */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      <div style={{
        flex: 1, minWidth: 0,
        background: '#0d0d0d', borderRadius: RADIUS,
        border: `1px solid ${focus ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)'}`,
        transition: 'border-color 0.15s ease', overflow: 'hidden',
      }}>
        <textarea
          ref={inputRef}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          rows={3}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            padding: isMobile ? '0.85rem 0.9rem 0.4rem' : '0.9rem 1rem 0.4rem',
            fontSize: isMobile ? '0.9rem' : '0.92rem', fontWeight: 600,
            background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontFamily: 'inherit', lineHeight: 1.5, resize: 'none',
          }}
        />

        {shots.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: isMobile ? '0.2rem 0.9rem 0.5rem' : '0.2rem 1rem 0.5rem' }}>
            {shots.map((u, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={u} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', display: 'block' }} />
                <button onClick={() => onShots?.(null, i)} style={{
                  position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', border: 'none', color: '#000', fontWeight: 900,
                  fontSize: '0.72rem', lineHeight: 1, cursor: 'pointer', padding: 0,
                }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0.15rem 0.45rem', borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          <button type="button" onClick={() => setShowSuggestions(true)} aria-label="Suggesties: wat eet je of vind je lekker" style={balkIcoon}>
            <Lightbulb size={17} strokeWidth={2.4} />
          </button>
          {/* Wat er in de modal is gekozen, als korte regel naast de knop */}
          <button type="button" onClick={() => setShowSuggestions(true)} style={{
            flex: 1, minWidth: 0, minHeight: 30, padding: '0 0.1rem', background: 'none', border: 'none',
            textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.75rem', fontWeight: 700, color: gekozen.length ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {gekozen.length ? gekozen.join(', ') : 'Wat vind je lekker?'}
          </button>
          <label aria-label="Screenshot toevoegen" style={{ ...balkIcoon, cursor: uploaden ? 'wait' : 'pointer', opacity: uploaden ? 0.5 : 1 }}>
            <ImagePlus size={17} strokeWidth={2.4} />
            <input type="file" accept="image/*" multiple disabled={uploaden} style={{ display: 'none' }}
              onChange={e => { const f = [...(e.target.files || [])]; e.target.value = ''; if (f.length) onShots?.(f) }} />
          </label>
        </div>
      </div>
      {shots.length === 0 && <VoorbeeldTegel />}
      </div>

      {showSuggestions && (
        <KeuzeModal
          maaltijdKey={slotKey}
          titel={momentLabel || label || 'Snack'}
          data={flowData || {}}
          onChange={onFlowChange}
          onKies={appendSuggestion}
          onClose={() => setShowSuggestions(false)}
          isMobile={isMobile}
        />
      )}

      {/* Wat werkt er al bij dit moment: je wil weten wat je moet behouden. */}
      {toonWerkt && (
        <div style={{ marginTop: '0.9rem' }}>
          <div style={{ fontSize: isMobile ? '0.88rem' : '0.9rem', fontWeight: 900, color: '#fff', marginBottom: '0.45rem' }}>
            Wat werkt hier goed aan?
          </div>
          <input
            value={werktGoed || ''}
            onChange={e => onWerktGoed?.(e.target.value)}
            placeholder="Bijv: hier heb ik lang genoeg aan"
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 48,
              padding: isMobile ? '0.7rem 0.9rem' : '0.75rem 1rem',
              fontSize: isMobile ? '0.9rem' : '0.92rem', fontWeight: 600,
              background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: RADIUS,
              color: '#fff', fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          />
        </div>
      )}
    </div>
  )
}

// Macro-ring: zelfde vorm als de ringen in de app, maar het getal in het
// midden is een invulveld. Tik op het getal en typ. De ring vult zich met het
// aandeel van die macro in de calorieën; de kcal-ring is vol zodra er iets
// staat.
const MACROS = [
  { key: 'macro_kcal',  label: 'Calorieën',    eenheid: 'kcal', kcalPerG: null, max: 6000 },
  { key: 'macro_eiwit', label: 'Eiwit',        eenheid: 'g',    kcalPerG: 4,    max: 500 },
  { key: 'macro_kh',    label: 'Koolhydraten', eenheid: 'g',    kcalPerG: 4,    max: 900 },
  { key: 'macro_vet',   label: 'Vet',          eenheid: 'g',    kcalPerG: 9,    max: 400 },
]

function MacroRing({ label, eenheid, waarde, vulling, aandeel, onChange, placeholder, isMobile }) {
  const inputRef = useRef(null)
  const size = isMobile ? 132 : 140
  const stroke = 9
  const r = (size - stroke) / 2
  const omtrek = 2 * Math.PI * r
  const offset = omtrek - Math.max(0, Math.min(1, vulling)) * omtrek
  const leeg = waarde === '' || waarde == null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{ position: 'relative', width: size, height: size, cursor: 'text' }}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth={stroke} fill="none"
            strokeDasharray={omtrek} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={leeg ? '' : waarde}
            placeholder={placeholder || 'Tik'}
            onChange={e => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            style={{
              width: size * 0.62, background: 'transparent', border: 'none', outline: 'none',
              borderBottom: `2px solid ${leeg ? 'rgba(255,255,255,0.25)' : 'transparent'}`,
              color: '#fff', textAlign: 'center', fontFamily: 'inherit',
              fontSize: '1.55rem', fontWeight: 900, letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums', padding: '0 0 2px', lineHeight: 1.1,
            }}
          />
          <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
            {eenheid}
          </div>
        </div>
      </div>
      <div style={{ fontSize: isMobile ? '0.85rem' : '0.88rem', fontWeight: 900, color: '#fff' }}>
        {label}
        {aandeel != null && <span style={{ marginLeft: 5, fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{aandeel}%</span>}
      </div>
    </div>
  )
}

// Rekent door zoals Coach Inzicht (MacroRingen.jsx): koolhydraten zijn de
// restpost, en kcal is altijd eiwit×4 + koolh×4 + vet×9. Zo kan er nooit
// 2000 kcal staan bij macro's die samen 2650 zijn.
//   kcal gewijzigd          → koolh = wat overblijft na eiwit en vet
//   eiwit/vet gewijzigd     → met kcal: koolh vult aan; zonder kcal: kcal = som
//   koolh gewijzigd         → kcal = som
function herbereken(data, veld, ruw) {
  const n = (v) => parseInt(v || '0', 10) || 0
  const set = { ...data, [veld]: ruw }
  const e = n(set.macro_eiwit), v = n(set.macro_vet), kcal = n(set.macro_kcal)
  const som = () => n(set.macro_eiwit) * 4 + n(set.macro_kh) * 4 + n(set.macro_vet) * 9
  const vulKoolhAan = () => {
    const rest = Math.round((kcal - e * 4 - v * 9) / 4)
    if (rest >= 0) { set.macro_kh = String(rest); return true }
    return false
  }

  // Alleen een kcal die de klant zelf typte is een doel om naartoe te
  // rekenen; een uitgerekende kcal volgt gewoon de macro's.
  if (veld === 'macro_kcal') {
    set.macro_kcal_zelf = !!kcal
    if ((e || v) && kcal) vulKoolhAan()
  } else if (veld === 'macro_kh') {
    set.macro_kcal = som() ? String(som()) : ''
    set.macro_kcal_zelf = false
  } else {
    // eiwit of vet
    if (!(set.macro_kcal_zelf && kcal && vulKoolhAan())) {
      set.macro_kcal = som() ? String(som()) : ''
      set.macro_kcal_zelf = false
    }
  }
  return set
}

function MacroTargets({ data, onChange, isMobile }) {
  const getal = (k) => parseInt(data[k] || '0', 10) || 0
  const uitMacros = getal('macro_eiwit') * 4 + getal('macro_kh') * 4 + getal('macro_vet') * 9
  const heeft = data.macro_targets_heeft

  return (
    <>
      <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff', margin: '1.2rem 0 0.6rem' }}>
        Heb je macro targets voor jezelf?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BigOption label="Ja, die heb ik" selected={heeft === 'ja'} isMobile={isMobile}
          onClick={() => onChange({ ...data, macro_targets_heeft: 'ja' })} />
        <BigOption label="Nee" selected={heeft === 'nee'} isMobile={isMobile}
          onClick={() => onChange({ ...data, macro_targets_heeft: 'nee' })} />
      </div>

      {heeft === 'ja' && (
        <div style={{ marginTop: '1.3rem' }}>
          <Hint isMobile={isMobile}>Tik op een ring en vul je getal in. Weet je er een niet? Laat 'm leeg.</Hint>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '1.1rem 0.5rem' : '1.3rem 1rem', marginTop: '0.9rem', justifyItems: 'center' }}>
            {MACROS.map(m => {
              const g = getal(m.key)
              // Aandeel over de som van de macro's, net als in Coach Inzicht:
              // dan tellen de drie percentages altijd op tot 100.
              const aandeel = m.kcalPerG && uitMacros > 0 ? Math.round((g * m.kcalPerG / uitMacros) * 100) : null
              const vulling = m.kcalPerG ? (aandeel || 0) / 100 : (g > 0 ? 1 : 0)
              return (
                <MacroRing
                  key={m.key}
                  label={m.label}
                  eenheid={m.eenheid}
                  waarde={data[m.key] || ''}
                  vulling={vulling}
                  aandeel={g > 0 ? aandeel : null}
                  onChange={v => onChange(herbereken(data, m.key, v))}
                  isMobile={isMobile}
                />
              )
            })}
          </div>
          <div style={{ marginTop: '0.9rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            Koolhydraten en calorieën rekenen automatisch mee.
          </div>
        </div>
      )}
    </>
  )
}

// Eerst de macro-vraag, dan één moment per scherm: ontbijt, lunch, diner,
// snack, en als laatste wat er al geprobeerd is. Zo voelt het als een
// gesprek, niet als een formulier.
const STAPPEN = ['macros', ...BASE_SLOTS.map(s => s.key), 'geprobeerd']
const VRAAG = {
  ontbijt: 'Wat eet je meestal als ontbijt?',
  lunch:   'Wat eet je meestal als lunch?',
  diner:   'Wat eet je meestal als avondeten?',
  snack:   'Wat snack je meestal tussendoor?',
}

export default function CurrentMealsFlow({ data, onChange, onNext, onBack, isMobile, clientId }) {
  const [stap, setStap] = useState(0)
  // Screenshots uit een voedingsapp. Gaan via /api/intake-photo naar storage;
  // de intake draait zonder login, dus de browser mag daar niet zelf bij.
  const [uploadBezig, setUploadBezig] = useState(null)   // slotKey dat nu uploadt
  const [uploadFout, setUploadFout] = useState(null)

  const verkleinNaarDataUrl = async (file) => {
    const bitmap = await createImageBitmap(file)
    // Screenshots mogen groter blijven dan een profielfoto: je moet de
    // getallen kunnen lezen. 1400px is genoeg en past ruim in een request.
    const schaal = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height))
    const b = Math.round(bitmap.width * schaal), h = Math.round(bitmap.height * schaal)
    const c = document.createElement('canvas'); c.width = b; c.height = h
    c.getContext('2d').drawImage(bitmap, 0, 0, b, h)
    return c.toDataURL('image/jpeg', 0.82)
  }

  // Screenshots hangen aan het maaltijdmoment. We bewaren ze per slot
  // (current_meals_<slot>_shots) én in één platte lijst, zodat de coach-modal
  // ze als galerij kan tonen zonder elk slot af te lopen.
  const shotsVan = (slot) => data[`current_meals_${slot}_shots`] || []

  const zetShots = (slot, lijst) => {
    const alle = BASE_SLOTS.map(m => m.key)
      .concat(extraSlots.map((_, i) => `extra_${i}`))
      .flatMap(k => (k === slot ? lijst : (data[`current_meals_${k}_shots`] || [])))
    onChange({
      ...data,
      [`current_meals_${slot}_shots`]: lijst,
      voeding_screenshots: alle,
    })
  }

  const uploadShots = async (slot, files, verwijderIndex) => {
    if (verwijderIndex != null) {
      zetShots(slot, shotsVan(slot).filter((_, i) => i !== verwijderIndex))
      return
    }
    setUploadFout(null); setUploadBezig(slot)
    const nieuw = []
    try {
      for (const file of files) {
        const dataUrl = await verkleinNaarDataUrl(file)
        const res = await fetch('/api/intake-photo', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, dataUrl, soort: 'voeding' }),
        })
        const uit = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(uit.error || `Upload mislukt (${res.status})`)
        nieuw.push(uit.url)
      }
    } catch (err) {
      setUploadFout(err.message || 'Uploaden mislukt')
    } finally {
      if (nieuw.length) zetShots(slot, [...shotsVan(slot), ...nieuw])
      setUploadBezig(null)
    }
  }

  const [extraSlots, setExtraSlots] = useState(() => {
    const count = parseInt(data.current_meals_extra_count || '0', 10)
    return Array.from({ length: count }, (_, i) => i)
  })
  const [nextId, setNextId] = useState(extraSlots.length)

  const handleChange = (key, val) => onChange({ ...data, [key]: val })

  const addExtraSlot = () => {
    setExtraSlots(p => [...p, nextId])
    setNextId(p => p + 1)
    onChange({ ...data, current_meals_extra_count: String(extraSlots.length + 1) })
  }

  const removeExtraSlot = (id) => {
    const remaining = extraSlots.filter(x => x !== id)
    setExtraSlots(remaining)
    // Compact remaining data
    const next = { ...data, current_meals_extra_count: String(remaining.length) }
    remaining.forEach((origId, newIdx) => {
      next[`current_meals_extra_${newIdx}`] = data[`current_meals_extra_${origId}`] || ''
    })
    onChange(next)
  }

  const naarStap = (i) => {
    setStap(i)
    setUploadFout(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const verder = () => (stap < STAPPEN.length - 1 ? naarStap(stap + 1) : onNext())
  const terug = () => (stap > 0 ? naarStap(stap - 1) : onBack?.())

  const huidig = STAPPEN[stap]
  const slot = BASE_SLOTS.find(s => s.key === huidig)
  const ingevuld = huidig === 'macros'
    ? !!data.macro_targets_heeft
    : slot
      ? !!(data[`current_meals_${huidig}`] || '').trim()
      : !!(data.eerder_geprobeerd || '').trim()

  return (
    <div style={{ padding: isMobile ? '1.5rem 1rem 2.5rem' : '2rem 1.25rem 3rem' }}>

      {huidig === 'macros' ? (
        <>
          <Q isMobile={isMobile}>Wat eet je nu op dagelijkse basis?</Q>
          <Q isMobile={isMobile}>Vertel mij zoveel mogelijk.</Q>
          <Hint isMobile={isMobile}>We beginnen met je huidige doelen, daarna loop je per moment door wat je eet.</Hint>
          <MacroTargets data={data} onChange={onChange} isMobile={isMobile} />
          <div style={{ height: '1.3rem' }} />
        </>
      ) : slot ? (
        <>
          <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.45rem' }}>
            {slot.label} · {stap} van {BASE_SLOTS.length}
          </div>
          <Q isMobile={isMobile}>{VRAAG[huidig]}</Q>
          <Hint isMobile={isMobile}>Vertel mij zoveel mogelijk. Een screenshot uit je voedingsapp mag ook.</Hint>

          <div style={{ marginTop: '1rem' }}>
            <MealSlot
              key={huidig}
              slotKey={huidig}
              placeholder={slot.placeholder}
              value={data[`current_meals_${huidig}`]}
              onChange={val => handleChange(`current_meals_${huidig}`, val)}
              shots={shotsVan(huidig)}
              onShots={(files, weg) => uploadShots(huidig, files, weg)}
              uploaden={uploadBezig === huidig}
              werktGoed={data[`current_meals_${huidig}_werkt`]}
              onWerktGoed={val => handleChange(`current_meals_${huidig}_werkt`, val)}
              isMobile={isMobile}
              flowData={data}
              onFlowChange={onChange}
              momentLabel={slot.label}
            />

            {/* Extra snackmomenten horen bij het snack-scherm */}
            {huidig === 'snack' && (
              <>
                {extraSlots.map((id, idx) => (
                  <MealSlot
                    key={id}
                    slotKey="snack"
                    label={`Extra snack ${idx + 1}`}
                    placeholder="Bijv: eiwitreep, appel met nootjes"
                    value={data[`current_meals_extra_${idx}`]}
                    onChange={val => handleChange(`current_meals_extra_${idx}`, val)}
                    shots={shotsVan(`extra_${idx}`)}
                    onShots={(files, weg) => uploadShots(`extra_${idx}`, files, weg)}
                    uploaden={uploadBezig === `extra_${idx}`}
                    werktGoed={data[`current_meals_extra_${idx}_werkt`]}
                    onWerktGoed={val => handleChange(`current_meals_extra_${idx}_werkt`, val)}
                    isMobile={isMobile}
                    flowData={data}
                    onFlowChange={onChange}
                    removable
                    onRemove={() => removeExtraSlot(id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={addExtraSlot}
                  style={{
                    background: 'transparent', border: '1px dashed rgba(255,255,255,0.25)', borderRadius: RADIUS,
                    color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.78rem' : '0.8rem',
                    fontWeight: 800, cursor: 'pointer', width: '100%', minHeight: 46,
                    padding: '0.6rem', fontFamily: 'inherit', marginBottom: '1.1rem',
                    touchAction: 'manipulation',
                  }}
                >
                  + Extra snackmoment toevoegen
                </button>
              </>
            )}

            {uploadFout && (
              <div style={{ marginBottom: '0.7rem', fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>
                {uploadFout}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Wat is er al geprobeerd: voorkomt dat je iets voorstelt dat
              vorig jaar al is mislukt. */}
          <Q isMobile={isMobile}>Wat heb je al geprobeerd met je voeding?</Q>
          <Hint isMobile={isMobile}>Diëten, apps, periodes waarin het lukte of juist niet. Optioneel.</Hint>
          <textarea
            value={data.eerder_geprobeerd || ''}
            onChange={e => onChange({ ...data, eerder_geprobeerd: e.target.value })}
            placeholder="Bijv: keto geprobeerd, hield ik drie weken vol…"
            rows={4}
            style={{ ...vrijVeld(isMobile), borderRadius: RADIUS, marginTop: '1rem', marginBottom: '1.1rem' }}
          />
        </>
      )}

      <NextBtn
        onClick={verder}
        label={ingevuld ? 'VOLGENDE →' : 'OVERSLAAN →'}
        isMobile={isMobile}
        onBack={stap > 0 || onBack ? terug : undefined}
      />
    </div>
  )
}
