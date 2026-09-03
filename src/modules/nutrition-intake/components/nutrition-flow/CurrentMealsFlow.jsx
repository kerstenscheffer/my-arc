// src/modules/nutrition-intake/components/nutrition-flow/CurrentMealsFlow.jsx
// Stap 0: Huidige eetgewoonten — wat eet je op een typische dag?
// Vaste structuur (4 slots) met toevoeg-optie, vrije tekst + suggesties
import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Q, Hint, NextBtn } from '../../../public-intake/components/phase1/FlowStep'

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


// Voorbeeld naast de screenshot-knop: een tegel van hetzelfde formaat als een
// geüploade screenshot, met "voorbeeld" erop. Tikken vergroot 'm. Verdwijnt
// zodra er een echte screenshot staat — dan snapt de klant het al.
//
// Bewust nagebouwd in plaats van een plaatje: scherp op elk scherm, geen
// bestand dat zoekraakt, en het volgt vanzelf de stijl van de app.
const VOORBEELD = {
  titel: 'Volkoren wrap met ei, kaas en kipfilet',
  moment: 'Ontbijt',
  kcal: 898,
  macros: [
    { pct: 29, gram: 46, label: 'Koolhydr', kleur: '#f59e0b' },
    { pct: 35, gram: 54, label: 'Vetten',   kleur: '#a855f7' },
    { pct: 36, gram: 57, label: 'Eiwitten', kleur: '#eab308' },
  ],
  onderdelen: [
    { naam: 'Eieren',                        sub: '300g',        kcal: 465 },
    { naam: 'Olijf olie extra vierge',       sub: 'Jumbo, 5g',   kcal: 41 },
    { naam: 'Kaas 48+ jong',                 sub: '40g',         kcal: 148 },
    { naam: 'Tortilla wraps naturel',        sub: '81g',         kcal: 244 },
  ],
}

function VoorbeeldKaart({ isMobile, groot }) {
  const M = VOORBEELD
  // De ring uit de app: drie macro's als segmenten, in dezelfde volgorde.
  const ring = (() => {
    let op = 0
    const stops = M.macros.map(m => {
      const van = op; op += m.pct
      return `${m.kleur} ${van}% ${op}%`
    }).join(', ')
    return `conic-gradient(${stops}, rgba(255,255,255,0.1) ${op}% 100%)`
  })()
  const ringMaat = groot ? 68 : 22

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.12)',
      background: '#111',
      width: groot ? 'min(360px, 90vw)' : undefined,
      height: groot ? undefined : '100%',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box', overflow: 'hidden',
      textAlign: 'left',
    }}>
      <div style={{
        padding: groot ? (isMobile ? '0.8rem 0.9rem' : '0.9rem 1rem') : '3px 4px',
        borderBottom: groot ? '1px solid rgba(255,255,255,0.08)' : 'none',
      }}>
        <div style={{
          fontSize: groot ? (isMobile ? '0.95rem' : '1.05rem') : '0.3rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em',
        }}>{M.titel}</div>
      </div>

      {groot && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Maaltijd</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6, padding: '0.25rem 0.6rem' }}>{M.moment}</span>
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center',
        gap: groot ? (isMobile ? 12 : 18) : 3,
        padding: groot ? '0.85rem 0.9rem' : '2px 4px',
        borderBottom: groot ? '1px solid rgba(255,255,255,0.08)' : 'none',
      }}>
        <div style={{
          width: ringMaat, height: ringMaat, borderRadius: '50%', flexShrink: 0,
          background: ring, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: ringMaat - (groot ? 14 : 6), height: ringMaat - (groot ? 14 : 6),
            borderRadius: '50%', background: '#111',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: groot ? '0.95rem' : '0.28rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{M.kcal}</span>
            {groot && <span style={{ fontSize: '0.45rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>CAL</span>}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: groot ? 8 : 2 }}>
          {M.macros.map(m => (
            <div key={m.label} style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: groot ? '0.6rem' : '0.2rem', fontWeight: 800, color: m.kleur }}>{m.pct} %</div>
              <div style={{ fontSize: groot ? (isMobile ? '0.95rem' : '1rem') : '0.3rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{m.gram} g</div>
              <div style={{ fontSize: groot ? '0.55rem' : '0.18rem', fontWeight: 700, color: m.kleur }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {groot && (
        <div style={{ padding: '0.75rem 0.9rem 0.9rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', marginBottom: '0.6rem' }}>Onderdelen maaltijd</div>
          {M.onderdelen.map(o => (
            <div key={o.naam} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0.4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{o.naam}</div>
                <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)' }}>{o.sub}</div>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>{o.kcal}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VoorbeeldTegel({ isMobile }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Voorbeeld van een bruikbare screenshot"
        style={{
          position: 'relative', width: 42, height: 42, padding: 0,
          border: '1px dashed rgba(255,255,255,0.3)', background: 'none',
          cursor: 'zoom-in', flexShrink: 0,
        }}
      >
        <VoorbeeldKaart isMobile={isMobile} />
        <span style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.75)',
          fontSize: '0.42rem', fontWeight: 900, letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '1px 0',
        }}>voorbeeld</span>
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
          <VoorbeeldKaart isMobile={isMobile} groot />
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.55, maxWidth: 300 }}>
            Naam, calorieën, de macro's en de ingrediënten met hoeveelheden. Hoe completer, hoe beter ik je plan kan maken.
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function MealSlot({
  slotKey, label, placeholder, value, onChange, isMobile, removable, onRemove,
  shots = [], onShots, werktGoed, onWerktGoed, uploaden,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const suggestions = SUGGESTIONS[slotKey] || SUGGESTIONS.snack

  const appendSuggestion = (s) => {
    const current = value || ''
    const separator = current.trim() ? ', ' : ''
    onChange(current.trim() + separator + s)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
          {label}
        </div>
        {removable && (
          <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', cursor: 'pointer', padding: '0', fontFamily: 'inherit', touchAction: 'manipulation' }}>
            ✕ verwijder
          </button>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <textarea
          ref={inputRef}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={1}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: isMobile ? '0.7rem 0.85rem' : '0.75rem 0.9rem',
            fontSize: isMobile ? '0.82rem' : '0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontFamily: 'inherit',
            lineHeight: 1.5, resize: 'vertical',
            outline: 'none', transition: 'border-color 0.15s ease',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
        />
        <button
          onClick={() => setShowSuggestions(p => !p)}
          style={{
            position: 'absolute', bottom: '0.45rem', right: '0.5rem',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.6)', fontSize: '0.58rem', fontWeight: 800,
            cursor: 'pointer', padding: '0.2rem 0.5rem', fontFamily: 'inherit',
            letterSpacing: '0.04em', touchAction: 'manipulation',
          }}
        >
          {showSuggestions ? 'SLUIT' : 'SUGGESTIES'}
        </button>
      </div>
      {showSuggestions && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => appendSuggestion(s)}
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? '0.67rem' : '0.7rem',
                fontWeight: 600, cursor: 'pointer', padding: '0.25rem 0.6rem',
                fontFamily: 'inherit', touchAction: 'manipulation',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Screenshot uit een tracking-app hoort bij dít moment, niet bij de
          hele dag: zo weet je van welke maaltijd je naar de getallen kijkt. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '0.45rem', flexWrap: 'wrap' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '0.4rem 0.7rem', minHeight: 36,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)',
          color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 800,
          cursor: uploaden ? 'wait' : 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          {uploaden ? 'Bezig…' : '+ Screenshot'}
          <input type="file" accept="image/*" multiple disabled={uploaden} style={{ display: 'none' }}
            onChange={e => { const f = [...(e.target.files || [])]; e.target.value = ''; if (f.length) onShots?.(f) }} />
        </label>
        {shots.length === 0 && <VoorbeeldTegel isMobile={isMobile} />}
        {shots.map((u, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={u} alt="" style={{ width: 42, height: 42, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)', display: 'block' }} />
            <button onClick={() => onShots?.(null, i)} style={{
              position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
              fontSize: '0.65rem', lineHeight: 1, cursor: 'pointer', padding: 0,
            }}>×</button>
          </div>
        ))}
      </div>

      {/* Wat werkt er al bij dit moment — je wil weten wat je moet behouden. */}
      <div style={{ marginTop: '0.55rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: '0.25rem' }}>
          Wat werkt goed?
        </div>
        <input
          value={werktGoed || ''}
          onChange={e => onWerktGoed?.(e.target.value)}
          placeholder="Bijv: hier heb ik de hele ochtend genoeg aan"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: isMobile ? '0.55rem 0.75rem' : '0.6rem 0.8rem',
            fontSize: isMobile ? '0.8rem' : '0.82rem',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>
    </div>
  )
}

export default function CurrentMealsFlow({ data, onChange, onNext, onBack, isMobile, clientId }) {
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

  const canContinue = BASE_SLOTS.some(s => (data[`current_meals_${s.key}`] || '').trim())

  return (
    <div style={{ padding: isMobile ? '1.5rem 1rem 2.5rem' : '2rem 1.25rem 3rem' }}>

      {/* Twee regels van gelijk gewicht: wat we vragen, en hoeveel we willen
          weten. De tweede regel is de aansporing en mag niet ondergeschikt
          ogen aan de eerste. */}
      <Q isMobile={isMobile}>Wat eet je nu op dagelijkse basis?</Q>
      <Q isMobile={isMobile}>Vertel mij zoveel mogelijk.</Q>
      <Hint isMobile={isMobile}>
        Vul in per moment wat je nu eet, en wat goed bij jou past.
      </Hint>

      <div style={{ marginTop: '1.25rem' }}>
        {BASE_SLOTS.map(slot => (
          <MealSlot
            key={slot.key}
            slotKey={slot.key}
            label={slot.label}
            placeholder={slot.placeholder}
            value={data[`current_meals_${slot.key}`]}
            onChange={val => handleChange(`current_meals_${slot.key}`, val)}
            shots={shotsVan(slot.key)}
            onShots={(files, weg) => uploadShots(slot.key, files, weg)}
            uploaden={uploadBezig === slot.key}
            werktGoed={data[`current_meals_${slot.key}_werkt`]}
            onWerktGoed={val => handleChange(`current_meals_${slot.key}_werkt`, val)}
            isMobile={isMobile}
          />
        ))}

        {uploadFout && (
          <div style={{ marginBottom: '0.7rem', fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>
            {uploadFout}
          </div>
        )}

        {extraSlots.map((id, idx) => (
          <MealSlot
            key={id}
            slotKey="snack"
            label={`Extra snack ${idx + 1}`}
            placeholder="Bijv: proteïnerijpe, appel met nootjes"
            value={data[`current_meals_extra_${idx}`]}
            onChange={val => handleChange(`current_meals_extra_${idx}`, val)}
            shots={shotsVan(`extra_${idx}`)}
            onShots={(files, weg) => uploadShots(`extra_${idx}`, files, weg)}
            uploaden={uploadBezig === `extra_${idx}`}
            werktGoed={data[`current_meals_extra_${idx}_werkt`]}
            onWerktGoed={val => handleChange(`current_meals_extra_${idx}_werkt`, val)}
            isMobile={isMobile}
            removable
            onRemove={() => removeExtraSlot(id)}
          />
        ))}

        <button
          onClick={addExtraSlot}
          style={{
            background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? '0.72rem' : '0.75rem',
            fontWeight: 700, cursor: 'pointer', width: '100%',
            padding: '0.6rem', fontFamily: 'inherit', marginBottom: '1.25rem',
            letterSpacing: '0.04em', touchAction: 'manipulation',
          }}
        >
          + Extra snackmoment toevoegen
        </button>
      </div>

      {/* Wat is er al geprobeerd — voorkomt dat je iets voorstelt dat vorig
          jaar al is mislukt. */}
      <div style={{ marginTop: '1.4rem' }}>
        <Q isMobile={isMobile}>Wat heb je al geprobeerd met je voeding?</Q>
        <Hint isMobile={isMobile}>Diëten, apps, periodes waarin het lukte of juist niet. Optioneel.</Hint>
        <textarea
          value={data.eerder_geprobeerd || ''}
          onChange={e => onChange({ ...data, eerder_geprobeerd: e.target.value })}
          placeholder="Bijv: keto geprobeerd, hield ik drie weken vol…"
          rows={3}
          style={vrijVeld(isMobile)}
        />
      </div>

      <NextBtn
        onClick={onNext}
        label={canContinue ? 'VOLGENDE →' : 'OVERSLAAN →'}
        isMobile={isMobile}
      onBack={onBack} />
      {!canContinue && (
        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
          Je mag dit overslaan — ook zonder invullen ga je door
        </div>
      )}
    </div>
  )
}
