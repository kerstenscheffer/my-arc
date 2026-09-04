// src/modules/public-intake/components/phase1/BasicsFlow.jsx
// Stap 1: Basisgegevens — naam, contact, geslacht, geboortedatum
// Conversational flow, één vraag per stap

import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, TextField, NumberField, OptionGrid } from './FlowStep'
import DatabaseService from '../../../../services/DatabaseService'

const supabase = DatabaseService.supabase

const STEPS = ['voornaam', 'achternaam', 'email', 'telefoon', 'geslacht', 'geboortejaar', 'geboortedatum', 'foto']

// De foto gaat naar /api/intake-photo, dat 'm met de service key in storage
// zet. De browser mag daar niet zelf bij: de intake draait zonder login en
// dan zou de bucket voor iedereen openstaan.
//
// Voor het versturen verkleinen we naar 512px en jpeg-kwaliteit 0.85. Een
// telefoonfoto is zo 4-8 MB; dat past niet in een serverless request en is
// voor een rondje van 40 pixels sowieso zinloos.
const FOTO_MAX = 512
async function verkleinFoto(file) {
  const bitmap = await createImageBitmap(file)
  const schaal = Math.min(1, FOTO_MAX / Math.max(bitmap.width, bitmap.height))
  const b = Math.round(bitmap.width * schaal)
  const h = Math.round(bitmap.height * schaal)
  const canvas = document.createElement('canvas')
  canvas.width = b; canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, b, h)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export default function BasicsFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState('voornaam')
  const [history, setHistory] = useState([])
  const [emailChecking, setEmailChecking] = useState(false)
  const [fotoUrl, setFotoUrl] = useState(data.profile_photo_url || null)
  const [fotoBezig, setFotoBezig] = useState(false)
  const [fotoFout, setFotoFout] = useState(null)
  const [emailError,    setEmailError]    = useState(null)

  const go = (next) => { setHistory(h => [...h, step]); setStep(next) }
  const goBack = () => {
    if (history.length === 0) { onBack?.(); return }
    setStep(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }

  const update = (field, value) => onChange({ ...data, [field]: value })

  const handleOnNext = () => {
    console.log('✅ SECTIE 1 (Basis) klaar:', {
      naam: `${data.first_name} ${data.last_name}`,
      email: data.email,
      telefoon: data.phone,
      geslacht: data.gender,
      geboortedatum: data.date_of_birth,
    })
    onNext()
  }

  const handleEmailNext = async () => {
    if (!data.email?.includes('@')) return
    setEmailChecking(true)
    setEmailError(null)
    console.log('🔍 EMAIL CHECK gestart voor:', data.email)
    try {
      const email = data.email.toLowerCase().trim()
      const { data: found, error } = await supabase
        .from('clients').select('id').eq('email', email).limit(1)
      if (error) {
        console.error('❌ EMAIL CHECK — verbindingsfout:', error)
        setEmailError({ title: 'Verbindingsfout', lines: ['Er kon geen verbinding worden gemaakt.'], action: 'Controleer je internet en probeer opnieuw.' })
        setEmailChecking(false); return
      }
      if (!found || found.length === 0) {
        console.warn('⚠️ EMAIL CHECK — niet gevonden in DB:', email)
        setEmailError({
          title: 'E-mailadres niet gevonden',
          lines: [
            'Gebruik het adres waarmee je coach je heeft aangemeld.',
            'Let op: geen hoofdletters, geen spaties voor of na het adres.',
            `Je vulde in: "${data.email}"`
          ],
          action: 'Weet je het niet meer? Neem contact op met je coach.'
        })
        setEmailChecking(false); return
      }
      console.log('✅ EMAIL CHECK — gevonden! client_id:', found[0].id, '| email:', email)
      setEmailChecking(false)
      go('telefoon')
    } catch(e) {
      console.error('❌ EMAIL CHECK — exception:', e)
      setEmailError({ title: 'Er ging iets mis', lines: ['Probeer het opnieuw.'], action: 'Blijft het fout gaan? Neem contact op met je coach.' })
      setEmailChecking(false)
    }
  }

  // Geboortejaar opties — 12 t/m 80 jaar geleden
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear - 12; y >= currentYear - 80; y--) years.push(y)

  // Geboortedatum uit losse velden samenvoegen
  const updateBirthdate = (day, month, year) => {
    if (day && month && year) {
      const d = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      update('date_of_birth', d)
    }
  }

  const parsedDob = data.date_of_birth ? {
    year: data.date_of_birth.split('-')[0],
    month: parseInt(data.date_of_birth.split('-')[1]),
    day: parseInt(data.date_of_birth.split('-')[2])
  } : { year: null, month: null, day: null }

  const [dobDay,   setDobDay]   = useState(parsedDob.day   ? String(parsedDob.day)   : '')
  const [dobMonth, setDobMonth] = useState(parsedDob.month ? String(parsedDob.month) : '')
  const [dobYear,  setDobYear]  = useState(parsedDob.year  || '')

  const MONTHS = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec']

  const renderStep = () => {
    switch (step) {

      case 'voornaam':
        return <>
          <Q isMobile={isMobile}>Wat is je voornaam?</Q>
          <TextField
            value={data.first_name}
            onChange={v => update('first_name', v)}
            placeholder="Je voornaam"
            isMobile={isMobile}
            autoFocus
          />
          <NextBtn
            onClick={() => go('achternaam')}
            disabled={!data.first_name?.trim()}
            isMobile={isMobile}
          />
        </>

      case 'achternaam':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>En je achternaam?</Q>
          <TextField
            value={data.last_name}
            onChange={v => update('last_name', v)}
            placeholder="Je achternaam"
            isMobile={isMobile}
            autoFocus
          />
          <NextBtn
            onClick={() => go('email')}
            disabled={!data.last_name?.trim()}
            isMobile={isMobile}
          />
        </>

      case 'email':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat is je e-mailadres?</Q>
          <Hint isMobile={isMobile}>Gebruik het adres dat je coach heeft meegestuurd.</Hint>
          <input
            type="email"
            value={data.email || ''}
            onChange={e => { update('email', e.target.value); setEmailError(null) }}
            placeholder="jouw@email.nl"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleEmailNext()}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem',
              background: emailError ? 'rgba(220,38,38,0.04)' : '#0d0d0d',
              border: `1px solid ${emailError ? 'rgba(220,38,38,0.35)' : data.email ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px',
              color: emailError ? '#dc2626' : data.email ? '#FFD700' : '#fff',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: data.email ? 700 : 500,
              fontFamily: 'inherit', outline: 'none',
              WebkitAppearance: 'none', transition: 'all 0.2s ease'
            }}
          />

          {/* Foutmelding */}
          {emailError && (
            <div style={{
              background: 'rgba(220,38,38,0.04)',
              border: '1px solid rgba(220,38,38,0.15)',
              borderLeft: '3px solid #dc2626',
              borderRadius: '0 8px 8px 0',
              padding: isMobile ? '0.6rem 0.75rem' : '0.65rem 0.85rem',
            }}>
              <div style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.25rem' }}>
                {emailError.title}
              </div>
              {emailError.lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start', marginBottom: '0.15rem' }}>
                  <span style={{ fontSize: '0.45rem', color: 'rgba(220,38,38,0.5)', marginTop: '0.15rem', flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: isMobile ? '0.65rem' : '0.68rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, lineHeight: 1.5 }}>{line}</span>
                </div>
              ))}
              <div style={{ fontSize: isMobile ? '0.6rem' : '0.62rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500, marginTop: '0.3rem', lineHeight: 1.5 }}>
                {emailError.action}
              </div>
            </div>
          )}

          <NextBtn
            onClick={handleEmailNext}
            label={emailChecking ? 'Even checken...' : 'VOLGENDE →'}
            disabled={!data.email?.includes('@') || emailChecking}
            isMobile={isMobile}
          />
        </>

      case 'telefoon':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>En je telefoonnummer?</Q>
          <div style={{ display: 'flex', gap: 0 }}>
            <select
              defaultValue="+31"
              onChange={e => {
                const num = data.phone?.replace(/^\+\d+ /, '') || ''
                update('phone', `${e.target.value} ${num}`)
              }}
              style={{
                width: isMobile ? '80px' : '88px',
                padding: '0.8rem 0.5rem',
                background: '#0d0d0d',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px 0 0 8px',
                color: '#FFD700', fontSize: '0.9rem', fontWeight: 800,
                fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                WebkitAppearance: 'none', appearance: 'none', textAlign: 'center'
              }}
            >
              <option value="+31">+31 NL</option>
              <option value="+32">+32 BE</option>
            </select>
            <input
              type="tel"
              value={data.phone?.replace(/^\+\d+ /, '') || ''}
              onChange={e => {
                const cc = data.phone?.match(/^\+\d+/)?.[0] || '+31'
                // Alleen cijfers, spaties en koppeltekens toestaan
                const cleaned = e.target.value.replace(/[^0-9\s\-]/g, '')
                update('phone', `${cc} ${cleaned}`)
              }}
              onPaste={e => {
                e.preventDefault()
                const cc = data.phone?.match(/^\+\d+/)?.[0] || '+31'
                const pasted = e.clipboardData.getData('text')
                const cleaned = pasted.replace(/[^0-9\s\-]/g, '')
                update('phone', `${cc} ${cleaned}`)
              }}
              placeholder="6 12345678"
              autoFocus
              inputMode="numeric"
              style={{
                flex: 1, padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem',
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: '2px solid rgba(255,215,0,0.3)',
                borderRadius: '0 8px 8px 0',
                color: data.phone ? '#FFD700' : '#fff',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: data.phone ? 700 : 500,
                fontFamily: 'inherit', outline: 'none',
                WebkitAppearance: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <NextBtn
            onClick={() => go('geslacht')}
            disabled={!data.phone?.replace(/^\+\d+ /, '').trim()}
            isMobile={isMobile}
          />
        </>

      case 'geslacht':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat is je geslacht?</Q>
          <Hint isMobile={isMobile}>We gebruiken dit voor je caloriebehoefte berekening.</Hint>
          <BigOption
            label="Man"
            onClick={() => { update('gender', 'male'); go('geboortejaar') }}
            selected={data.gender === 'male'}
            isMobile={isMobile}
          />
          <BigOption
            label="Vrouw"
            onClick={() => { update('gender', 'female'); go('geboortejaar') }}
            selected={data.gender === 'female'}
            isMobile={isMobile}
          />
        </>

      case 'geboortejaar':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>In welk jaar ben je geboren?</Q>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${isMobile ? 4 : 5}, 1fr)`,
            gap: '0.25rem',
            maxHeight: '280px',
            overflowY: 'auto'
          }}>
            {years.map(y => {
              const isSelected = dobYear === String(y)
              return (
                <button key={y} onClick={() => {
                  setDobYear(String(y))
                  updateBirthdate(dobDay, dobMonth, y)
                  go('geboortedatum')
                }} style={{
                  padding: '0.6rem 0.3rem',
                  background: isSelected ? 'rgba(255,215,0,0.08)' : '#0d0d0d',
                  border: `1px solid ${isSelected ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '7px',
                  color: isSelected ? '#FFD700' : 'rgba(255,255,255,0.45)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                }}>
                  {y}
                </button>
              )
            })}
          </div>
        </>

      case 'geboortedatum':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>En welke dag en maand?</Q>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Maand */}
            <div>
              <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>MAAND</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
                {MONTHS.map((m, i) => {
                  const monthNum = String(i + 1)
                  const isSelected = dobMonth === monthNum
                  return (
                    <button key={m} onClick={() => {
                      setDobMonth(monthNum)
                      updateBirthdate(dobDay, monthNum, dobYear)
                    }} style={{
                      padding: '0.55rem 0.3rem',
                      background: isSelected ? 'rgba(255,215,0,0.08)' : '#0d0d0d',
                      border: `1px solid ${isSelected ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: '7px',
                      color: isSelected ? '#FFD700' : 'rgba(255,255,255,0.45)',
                      fontSize: isMobile ? '0.78rem' : '0.82rem',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                    }}>{isSelected ? '✓ ' : ''}{m}</button>
                  )
                })}
              </div>
            </div>
            {/* Dag */}
            {dobMonth && (
              <div>
                <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>DAG</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.2rem' }}>
                  {Array.from({ length: new Date(dobYear || 2000, parseInt(dobMonth), 0).getDate() }, (_, i) => i + 1).map(d => {
                    const isSelected = dobDay === String(d)
                    return (
                      <button key={d} onClick={() => {
                        setDobDay(String(d))
                        updateBirthdate(d, dobMonth, dobYear)
                      }} style={{
                        padding: '0.5rem 0',
                        background: isSelected ? 'rgba(255,215,0,0.08)' : '#0d0d0d',
                        border: `1px solid ${isSelected ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: '6px',
                        color: isSelected ? '#FFD700' : 'rgba(255,255,255,0.45)',
                        fontSize: isMobile ? '0.72rem' : '0.75rem',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                      }}>{d}</button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <NextBtn
            onClick={() => go('foto')}
            disabled={!data.date_of_birth}
            label="VOLGENDE →"
            isMobile={isMobile}
          />
        </>

      case 'foto':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Heb je een foto van jezelf?</Q>
          <Hint isMobile={isMobile}>
            Zodat je coach een gezicht bij je naam heeft. Overslaan mag.
          </Hint>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', margin: '0.6rem 0 1rem' }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%', flexShrink: 0,
              background: fotoUrl ? `url(${fotoUrl}) center/cover` : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', color: 'rgba(255,255,255,0.2)',
            }}>
              {!fotoUrl && '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{
                display: 'inline-block', padding: '0.6rem 1rem', borderRadius: 0,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 800,
                cursor: fotoBezig ? 'wait' : 'pointer',
              }}>
                {fotoBezig ? 'Bezig…' : fotoUrl ? 'Andere foto' : 'Foto kiezen'}
                <input
                  type="file" accept="image/*" disabled={fotoBezig}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    setFotoFout(null); setFotoBezig(true)
                    try {
                      const dataUrl = await verkleinFoto(file)
                      const res = await fetch('/api/intake-photo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: data.email, dataUrl }),
                      })
                      const uit = await res.json().catch(() => ({}))
                      if (!res.ok) throw new Error(uit.error || `Upload mislukt (${res.status})`)
                      setFotoUrl(uit.url)
                      update('profile_photo_url', uit.url)
                    } catch (err) {
                      setFotoFout(err.message || 'Uploaden mislukt')
                    } finally { setFotoBezig(false) }
                  }}
                />
              </label>
              {fotoFout && (
                <div style={{ marginTop: 6, fontSize: '0.7rem', fontWeight: 700, color: '#ef4444' }}>{fotoFout}</div>
              )}
            </div>
          </div>

          <NextBtn onClick={handleOnNext} label={fotoUrl ? 'VOLGENDE →' : 'OVERSLAAN →'} isMobile={isMobile} />
        </>

      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {renderStep()}
    </div>
  )
}
