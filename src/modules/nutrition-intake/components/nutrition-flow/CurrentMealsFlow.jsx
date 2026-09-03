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

function MealSlot({ slotKey, label, placeholder, value, onChange, isMobile, removable, onRemove }) {
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
          rows={2}
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
    </div>
  )
}

export default function CurrentMealsFlow({ data, onChange, onNext, onBack, isMobile, clientId }) {
  // Screenshots uit een voedingsapp. Gaan via /api/intake-photo naar storage;
  // de intake draait zonder login, dus de browser mag daar niet zelf bij.
  const [uploadBezig, setUploadBezig] = useState(false)
  const [uploadFout, setUploadFout] = useState(null)
  const shots = data.voeding_screenshots || []

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
      {onBack && <BackBtn onBack={onBack} />}

      <Q isMobile={isMobile}>Wat eet je nu op dagelijkse basis?</Q>
      <Hint isMobile={isMobile}>
        Vul per maaltijdmoment in wat je normaal eet — zo vrij als je wil. Dit helpt je coach je huidige gewoonten begrijpen. Gebruik de suggesties als je inspiratie nodig hebt.
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
            isMobile={isMobile}
          />
        ))}

        {extraSlots.map((id, idx) => (
          <MealSlot
            key={id}
            slotKey="snack"
            label={`Extra snack ${idx + 1}`}
            placeholder="Bijv: proteïnerijpe, appel met nootjes"
            value={data[`current_meals_extra_${idx}`]}
            onChange={val => handleChange(`current_meals_extra_${idx}`, val)}
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

      {/* Aansporing vóór het screenshot-blok: hoe meer de klant hier kwijt
          kan, hoe beter het plan. Bold wit, want dit is de regel die je wil
          dat ze lezen. */}
      <div style={{
        marginTop: '2rem', marginBottom: '0.4rem',
        fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900,
        color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.25,
      }}>
        Vertel mij zoveel mogelijk.
      </div>
      <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, lineHeight: 1.55, marginBottom: '1.2rem' }}>
        Alles wat je hieronder deelt gebruik ik om je plan op jou af te stemmen.
      </div>

      {/* Screenshots uit een voedingsapp — vaak zegt één screenshot meer dan
          drie vragen, zeker bij iemand die al bijhoudt wat hij eet. */}
      <div style={{ marginTop: '1.6rem' }}>
        <Q isMobile={isMobile}>Gebruik je een voedingsapp?</Q>
        <Hint isMobile={isMobile}>
          Stuur gerust een paar screenshots van een gewone dag. Optioneel.
        </Hint>

        {shots.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.7rem' }}>
            {shots.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt={`screenshot ${i + 1}`} style={{ width: 76, height: 76, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)', display: 'block' }} />
                <button type="button"
                  onClick={() => onChange({ ...data, voeding_screenshots: shots.filter((_, j) => j !== i) })}
                  style={{ position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: '50%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '0.8rem', lineHeight: 1, cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        )}

        <label style={{
          display: 'inline-block', padding: '0.7rem 1.1rem',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', fontSize: '0.8rem', fontWeight: 800,
          cursor: uploadBezig ? 'wait' : 'pointer', minHeight: 44,
        }}>
          {uploadBezig ? 'Bezig…' : shots.length ? 'Nog een screenshot' : 'Screenshot toevoegen'}
          <input type="file" accept="image/*" multiple disabled={uploadBezig} style={{ display: 'none' }}
            onChange={async (e) => {
              const files = [...(e.target.files || [])]
              e.target.value = ''
              if (!files.length) return
              setUploadFout(null); setUploadBezig(true)
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
                onChange({ ...data, voeding_screenshots: [...shots, ...nieuw] })
              } catch (err) {
                setUploadFout(err.message || 'Uploaden mislukt')
                if (nieuw.length) onChange({ ...data, voeding_screenshots: [...shots, ...nieuw] })
              } finally { setUploadBezig(false) }
            }} />
        </label>
        {uploadFout && <div style={{ marginTop: 6, fontSize: '0.7rem', fontWeight: 700, color: '#ef4444' }}>{uploadFout}</div>}
      </div>

      {/* Wat werkt er al — je wil weten wat je moet behouden, niet alleen wat
          er moet veranderen. */}
      <div style={{ marginTop: '1.6rem' }}>
        <Q isMobile={isMobile}>Werkt hier iets goed voor je volgens jezelf?</Q>
        <Hint isMobile={isMobile}>Iets waarvan je merkt dat het je past. Optioneel.</Hint>
        <textarea
          value={data.wat_werkt_goed || ''}
          onChange={e => onChange({ ...data, wat_werkt_goed: e.target.value })}
          placeholder="Bijv: 's ochtends havermout, daar heb ik de hele ochtend genoeg aan…"
          rows={3}
          style={vrijVeld(isMobile)}
        />
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
      />
      {!canContinue && (
        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
          Je mag dit overslaan — ook zonder invullen ga je door
        </div>
      )}
    </div>
  )
}
