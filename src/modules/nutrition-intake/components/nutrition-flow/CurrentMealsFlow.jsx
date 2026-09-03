// src/modules/nutrition-intake/components/nutrition-flow/CurrentMealsFlow.jsx
// Stap 0: Huidige eetgewoonten — wat eet je op een typische dag?
// Vaste structuur (4 slots) met toevoeg-optie, vrije tekst + suggesties
import React, { useState, useRef, useEffect } from 'react'
import { Q, Hint, NextBtn, BackBtn } from '../../../public-intake/components/phase1/FlowStep'

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


// Voorbeeld van wat een bruikbare screenshot laat zien: naam, kcal en de drie
// macro's. Als kaart in de pagina i.p.v. een plaatje — scherp op elk scherm,
// geen asset om kwijt te raken, en hij volgt vanzelf de stijl van de app.
function ScreenshotVoorbeeld({ isMobile }) {
  const macro = (waarde, label) => (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900, color: '#fff' }}>{waarde}</span>
      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>{label}</span>
    </span>
  )
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem' }}>
        Dit is wat ik graag zie:
      </div>
      <div style={{
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        padding: isMobile ? '0.7rem 0.8rem' : '0.8rem 0.9rem',
        maxWidth: 320,
      }}>
        <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', marginBottom: '0.45rem' }}>
          Kwark met bosvruchten
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 10 : 14, flexWrap: 'wrap' }}>
          {macro(380, 'KCAL')}
          {macro(61, 'EIWIT')}
          {macro(25, 'KOOLH')}
          {macro(3, 'VET')}
        </div>
        <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Magere kwark 500g · Bosvruchten 100g
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.4rem', lineHeight: 1.5 }}>
        Naam, calorieën en de macro's. Hoeveelheden erbij is helemaal top.
      </div>
    </div>
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
        <ScreenshotVoorbeeld isMobile={isMobile} />

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
