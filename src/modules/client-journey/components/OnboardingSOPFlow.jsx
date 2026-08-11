// src/modules/client-journey/components/OnboardingSOPFlow.jsx
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, ChevronRight, ChevronDown, AlertTriangle, X, ExternalLink } from 'lucide-react'
import IntakeCallPanel from './calls/IntakeCallPanel'

function getWAUrl(client) {
  let phone = client?.phone || client?.phone_number || ''
  phone = phone.replace(/[\s\-\+]/g, '')
  if (phone.startsWith('0')) phone = '31' + phone.substring(1)
  if (!phone) return null
  return `https://wa.me/${phone}`
}

const GOLD = '#FFD700'
const GREEN = '#10b981'
const RED = '#ef4444'
const BG = '#000'
const CARD = '#0a0a0a'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#fff'
const MUTED = 'rgba(255,255,255,0.45)'
const DIM = 'rgba(255,255,255,0.2)'

// ─── SOP DEFINITIE ───────────────────────────────────────────────
const STEPS = [
  {
    id: 0,
    title: 'Na salescall',
    label: 'COACH',
    message: {
      text: 'Hey [naam], super om je gesproken te hebben! Ik kijk er naar uit om samen aan [doel] te werken. We gaan zorgen dat je daar komt. 💪\n\nBekijk deze korte video even, dan weet je precies hoe we van start gaan:\nhttps://youtu.be/vDMftzhsPHI',
      manualVars: ['doel']
    }
  },
  {
    id: 1,
    title: 'Checkout sturen',
    label: 'COACH',
    message: {
      // Coach kiest tussen maandelijks abonnement of 12-weken in één keer.
      variants: [
        {
          id: 'monthly',
          label: 'Maandelijks',
          text: 'Om alles rond te maken kun je hier de investering voor het maandelijkse traject doen. Nadat dit gelukt is kom je op de intake pagina waar een video op je wacht over hoe je deze in kan vullen. Als je hem hebt ingevuld krijg ik een melding en ga ik direct voor je aan de slag om jouw plan binnen 2-4 dagen klaar te zetten. Ik kijk er naar uit je naar je doel toe te brengen!\nhttps://www.myarcfitness.com/maand-checkout'
        },
        {
          id: 'onetime',
          label: 'In één keer (12 wk)',
          text: 'Om alles rond te maken kun je hier de investering voor het 12-weken traject doen. Nadat dit gelukt is kom je op de intake pagina waar een video op je wacht over hoe je deze in kan vullen. Als je hem hebt ingevuld krijg ik een melding en ga ik direct voor je aan de slag om jouw plan binnen 2-4 dagen klaar te zetten. Ik kijk er naar uit je naar je doel toe te brengen!\nhttps://www.myarcfitness.com/12-week-checkout'
        }
      ],
      manualVars: []
    }
  },
  {
    id: 2,
    title: 'Wachten op betaling',
    label: 'CLIENT',
    payment: true,
    warnings: [
      {
        label: '⚠ Herinnering — niet betaald',
        text: 'Hey [naam], ik zie dat de betaling nog niet is binnengekomen. Zonder dat kan ik helaas de call niet laten doorgaan en je nog niet helpen met [doel]. Gaat het lukken om dit vandaag te regelen?',
        manualVars: ['doel']
      },
      {
        label: '⚠ Calldag — geen reactie',
        text: 'Hey [naam], ik heb nog geen bevestiging van de betaling ontvangen waardoor ik de call van vandaag helaas moet afzeggen. Ik vraag me af, heb je nog twijfels over het starten? Dan denk ik graag met je mee.',
        manualVars: []
      }
    ]
  },
  {
    id: 3,
    title: 'Intake formulier sturen',
    label: 'COACH',
    note: 'Alleen sturen na bevestiging betaling',
    message: {
      text: 'Hey [naam]! Kun je voor de call vast dit intakeformulier invullen? Kom je ergens niet uit, geen stress. We lopen er in de eerste call nog is samen doorheen.\nhttps://www.myarcfitness.com/myintake\nTot morgen! 💪',
      manualVars: []
    }
  },
  {
    id: 4,
    title: 'Onboarding call',
    label: 'COACH',
    note: 'Automatisch bericht volgt uit call panel',
    checks: [
      { id: 'intake_panel', label: 'Intake call panel volledig invullen' },
      { id: 'app_toegang', label: 'App toegang geven' },
      { id: 'call_momenten', label: 'Vaste call momenten afspreken' }
    ]
  },
  {
    id: 5,
    title: 'Plan maken',
    label: 'COACH',
    checks: [
      { id: 'sop_voeding', label: 'Volg SOP voeding (nog op te stellen)' },
      { id: 'sop_workout', label: 'Volg SOP workout (nog op te stellen)' }
    ]
  },
  {
    id: 6,
    title: 'Inloggegevens + app sturen',
    label: 'COACH',
    message: {
      // Coach kiest: App Store (nieuwe app) of Geen App Store (web/PWA-versie).
      variants: [
        {
          id: 'appstore',
          label: 'App Store',
          text: 'Top [naam], hier is de link naar de app. (laat me weten als je geen App Store hebt).\n\nLink naar de app: https://apps.apple.com/us/app/my-arc/id6764539959\n\nJe inloggegevens:\nEmail: [email]\nWachtwoord: [wachtwoord]\n\nZodra je ingelogd bent staat er een video op je te wachten over hoe de app werkt en hoe je alles eruit kan halen om je doelen te halen.\n\nVeel succes en laat het weten als je er niet uitkomt! 🏆'
        },
        {
          id: 'web',
          label: 'Geen App Store',
          text: 'Top [naam], hier is de link naar de app. Je hoeft hem maar een keer te "downloaden" en dan staat hij op je startscherm net als alle andere apps.\n\n📱 Bekijk deze korte video hoe je de app installeert:\nhttps://youtube.com/shorts/Xb_4M8lYpOk\n\nJe inloggegevens:\nEmail: [email]\nWachtwoord: [wachtwoord]\n\nHier de link: https://myarcfitness.com/login\n\nAls je het niet begrijpt, trek aan de bel en ik help je erdoorheen. 💪'
        }
      ],
      manualVars: ['wachtwoord']
    }
  }
]

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export default function OnboardingSOPFlow({ db, selectedClient, onStartSetup, onOpenMealPanel, onOpenWorkoutPanel }) {
  const isMobile = window.innerWidth <= 768

  const [currentStep, setCurrentStep] = useState(selectedClient?.onboarding_step ?? 0)
  const [checks, setChecks] = useState(selectedClient?.onboarding_checks ?? {})
  // Intake Call Panel modaal — opent vanuit step 4 zodat de coach 'm kan
  // invullen zonder de hele SOP eerst af te ronden. Autosave is no-op
  // wanneer er nog geen journey is, dus state is sessie-only tot de
  // journey aangemaakt wordt.
  const [showIntakeCall, setShowIntakeCall] = useState(false)
  const [existingJourney, setExistingJourney] = useState(null)
  useEffect(() => {
    if (!db?.supabase || !selectedClient?.id) return
    let cancelled = false
    db.supabase
      .from('client_journeys')
      .select('*')
      .eq('client_id', selectedClient.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setExistingJourney(data) })
    return () => { cancelled = true }
  }, [db, selectedClient?.id])
  const [vars, setVars] = useState({
    naam: selectedClient?.first_name || '',
    email: selectedClient?.email || '',
    wachtwoord: 'Welcome123!',
    doel: ''
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(null)
  const [expandedWarning, setExpandedWarning] = useState(null)
  // Per-stap gekozen bericht-variant (bv. checkout maandelijks vs 12-weken).
  const [variantChoice, setVariantChoice] = useState({})

  // Sync client change
  useEffect(() => {
    setCurrentStep(selectedClient?.onboarding_step ?? 0)
    setChecks(selectedClient?.onboarding_checks ?? {})
    setVars(v => ({
      ...v,
      naam: selectedClient?.first_name || '',
      email: selectedClient?.email || ''
    }))
  }, [selectedClient?.id])

  // ── DB save ──
  const save = async (step, newChecks) => {
    if (!db?.supabase || !selectedClient?.id) return
    setSaving(true)
    try {
      await db.supabase
        .from('clients')
        .update({ onboarding_step: step, onboarding_checks: newChecks })
        .eq('id', selectedClient.id)
    } catch (e) { console.error('SOP save:', e) }
    setSaving(false)
  }

  const advance = async () => {
    if (currentStep >= STEPS.length - 1) return
    const next = currentStep + 1
    setCurrentStep(next)
    await save(next, checks)
  }

  const goBack = async () => {
    if (currentStep <= 0) return
    const prev = currentStep - 1
    setCurrentStep(prev)
    await save(prev, checks)
  }

  const toggleCheck = async (checkId) => {
    const updated = { ...checks, [checkId]: !checks[checkId] }
    setChecks(updated)
    await save(currentStep, updated)
  }

  // ── Copy met var-substitutie ──
  const resolve = (text) => {
    let out = text
    Object.entries(vars).forEach(([k, v]) => {
      out = out.replace(new RegExp(`\\[${k}\\]`, 'g'), v || `[${k}]`)
    })
    return out
  }

  const copy = (text, id) => {
    navigator.clipboard.writeText(resolve(text))
    setCopied(id)
    setTimeout(() => setCopied(null), 1800)
  }

  // ── Step status ──
  const status = (id) => id < currentStep ? 'done' : id === currentStep ? 'active' : 'future'
  const borderFor = (id) => {
    const s = status(id)
    return s === 'done' ? GREEN : s === 'active' ? GOLD : 'rgba(255,255,255,0.1)'
  }

  return (
    <div style={{ background: BG, padding: isMobile ? '0.75rem' : '1rem', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: `1px solid ${BORDER}`
      }}>
        <div>
          <p style={{ fontSize: isMobile ? '0.45rem' : '0.5rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: 0 }}>
            ONBOARDING SOP
          </p>
          <h2 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: TEXT, margin: '0.15rem 0 0' }}>
            {selectedClient?.first_name} {selectedClient?.last_name}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {saving && (
            <span style={{ fontSize: '0.4rem', color: DIM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>opslaan...</span>
          )}

          {/* WhatsApp knop */}
          {(selectedClient?.phone || selectedClient?.phone_number) && (() => {
            const chatUrl = getWAUrl(selectedClient)
            return (
              <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '6px',
                  background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)',
                  textDecoration: 'none', touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent', flexShrink: 0
                }}
                title={selectedClient?.phone || selectedClient?.phone_number}
              >
                {/* WhatsApp icon SVG */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.057 23.882a.5.5 0 0 0 .612.612l6.086-1.461A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.671-.497-5.214-1.37l-.373-.213-3.865.928.944-3.799-.232-.389A9.959 9.959 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              </a>
            )
          })()}

          <div style={{
            padding: '0.25rem 0.5rem', borderRadius: '4px',
            background: `${GOLD}10`, border: `1px solid ${GOLD}25`
          }}>
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: GOLD }}>
              {currentStep + 1} / {STEPS.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Steps ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {STEPS.map((step) => {
          const s = status(step.id)
          const isActive = s === 'active'
          const isDone = s === 'done'
          const allChecked = step.checks ? step.checks.every(c => checks[c.id]) : true

          return (
            <div key={step.id} style={{
              borderLeft: `3px solid ${borderFor(step.id)}`,
              background: isActive ? CARD : 'transparent',
              borderRadius: '0 6px 6px 0',
              overflow: 'hidden',
              transition: 'background 0.15s ease'
            }}>

              {/* ── Row header ── */}
              <div
                onClick={() => !isActive && setCurrentStep(step.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: isMobile ? '0.55rem 0.75rem' : '0.6rem 0.9rem',
                  cursor: isActive ? 'default' : 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  minHeight: isDone || s === 'future' ? '36px' : undefined
                }}
              >
                {/* Status circle */}
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  background: isDone ? GREEN : isActive ? `${GOLD}15` : 'transparent',
                  border: `1.5px solid ${borderFor(step.id)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isDone && <Check size={9} color="#fff" strokeWidth={3} />}
                  {isActive && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: GOLD }} />}
                  {s === 'future' && <span style={{ fontSize: '0.38rem', color: DIM, fontWeight: 800 }}>{step.id}</span>}
                </div>

                <span style={{
                  flex: 1,
                  fontSize: isMobile ? '0.78rem' : '0.82rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isDone ? 'rgba(255,255,255,0.35)' : isActive ? TEXT : MUTED,
                  textDecoration: isDone ? 'line-through' : 'none'
                }}>
                  {step.title}
                </span>

                {/* Label pill */}
                <span style={{
                  fontSize: '0.35rem', fontWeight: 700, letterSpacing: '0.07em',
                  padding: '0.1rem 0.35rem', borderRadius: '3px',
                  background: step.label === 'CLIENT' ? 'rgba(16,185,129,0.1)' : `${GOLD}10`,
                  color: step.label === 'CLIENT' ? GREEN : GOLD,
                  border: `1px solid ${step.label === 'CLIENT' ? 'rgba(16,185,129,0.2)' : `${GOLD}20`}`
                }}>
                  {step.label}
                </span>

                {!isActive && <ChevronRight size={11} color={DIM} />}
              </div>

              {/* ── Active content ── */}
              {isActive && (
                <div style={{ padding: isMobile ? '0 0.75rem 0.75rem' : '0 0.9rem 0.85rem' }}>

                  {/* Note */}
                  {step.note && (
                    <p style={{
                      fontSize: '0.5rem', color: MUTED, margin: '0 0 0.6rem',
                      padding: '0.3rem 0.5rem', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`
                    }}>
                      ℹ {step.note}
                    </p>
                  )}

                  {/* Manual var inputs */}
                  {step.message?.manualVars?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      {step.message.manualVars.map(v => (
                        <div key={v} style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{
                            display: 'block', fontSize: '0.38rem', color: DIM,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            fontWeight: 700, marginBottom: '0.2rem'
                          }}>{v}</label>
                          <input
                            value={vars[v] || ''}
                            onChange={e => setVars(p => ({ ...p, [v]: e.target.value }))}
                            placeholder={`[${v}]`}
                            style={{
                              width: '100%', padding: '0.35rem 0.55rem',
                              background: 'rgba(255,255,255,0.04)',
                              border: `1px solid ${BORDER}`,
                              borderRadius: '5px', color: TEXT,
                              fontSize: '0.72rem', outline: 'none',
                              fontFamily: 'inherit', boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main message — met variant-keuze (bv. checkout maandelijks/12-wk) */}
                  {step.message && (() => {
                    const msg = step.message
                    if (msg.variants?.length) {
                      const chosenId = variantChoice[step.id] || msg.variants[0].id
                      const active = msg.variants.find(v => v.id === chosenId) || msg.variants[0]
                      return (
                        <>
                          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                            {msg.variants.map(v => {
                              const sel = v.id === active.id
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => setVariantChoice(p => ({ ...p, [step.id]: v.id }))}
                                  style={{
                                    flex: 1, padding: '0.35rem 0.5rem', borderRadius: '5px',
                                    background: sel ? `${GOLD}18` : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${sel ? GOLD + '55' : BORDER}`,
                                    color: sel ? GOLD : MUTED, fontSize: '0.58rem', fontWeight: 800,
                                    cursor: 'pointer', touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent', minHeight: '30px'
                                  }}
                                >
                                  {v.label}
                                </button>
                              )
                            })}
                          </div>
                          <MsgBlock
                            text={active.text}
                            msgId={`msg-${step.id}`}
                            resolve={resolve}
                            copied={copied}
                            onCopy={copy}
                            isMobile={isMobile}
                          />
                        </>
                      )
                    }
                    return (
                      <MsgBlock
                        text={msg.text}
                        msgId={`msg-${step.id}`}
                        resolve={resolve}
                        copied={copied}
                        onCopy={copy}
                        isMobile={isMobile}
                      />
                    )
                  })()}

                  {/* Warning berichten (stap 2) */}
                  {step.warnings?.map((w, i) => (
                    <div key={i} style={{ marginTop: '0.45rem' }}>
                      <button
                        onClick={() => setExpandedWarning(expandedWarning === i ? null : i)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.35rem 0.6rem', borderRadius: '5px',
                          background: 'rgba(239,68,68,0.06)',
                          border: '1px solid rgba(239,68,68,0.18)',
                          color: RED, fontSize: '0.5rem', fontWeight: 700,
                          cursor: 'pointer', touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                          minHeight: '32px'
                        }}
                      >
                        {w.label}
                        {expandedWarning === i
                          ? <ChevronDown size={10} color={RED} />
                          : <ChevronRight size={10} color={RED} />
                        }
                      </button>
                      {expandedWarning === i && (
                        <div style={{ marginTop: '0.3rem' }}>
                          {/* Doel var voor warning 0 */}
                          {w.manualVars?.length > 0 && (
                            <div style={{ marginBottom: '0.4rem' }}>
                              {w.manualVars.map(v => (
                                <div key={v}>
                                  <label style={{
                                    display: 'block', fontSize: '0.38rem', color: DIM,
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    fontWeight: 700, marginBottom: '0.2rem'
                                  }}>{v}</label>
                                  <input
                                    value={vars[v] || ''}
                                    onChange={e => setVars(p => ({ ...p, [v]: e.target.value }))}
                                    placeholder={`[${v}]`}
                                    style={{
                                      width: '100%', padding: '0.35rem 0.55rem',
                                      background: 'rgba(255,255,255,0.04)',
                                      border: `1px solid ${BORDER}`,
                                      borderRadius: '5px', color: TEXT,
                                      fontSize: '0.72rem', outline: 'none',
                                      fontFamily: 'inherit', boxSizing: 'border-box'
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <MsgBlock
                            text={w.text}
                            msgId={`warn-${step.id}-${i}`}
                            resolve={resolve}
                            copied={copied}
                            onCopy={copy}
                            isMobile={isMobile}
                            accent={RED}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Betaling bevestigen knop */}
                  {step.payment && (
                    <button
                      onClick={advance}
                      style={{
                        marginTop: '0.6rem', width: '100%', padding: '0.5rem',
                        background: `${GREEN}12`, border: `1px solid ${GREEN}35`,
                        borderRadius: '6px', color: GREEN, fontSize: '0.62rem',
                        fontWeight: 800, cursor: 'pointer',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        minHeight: '36px'
                      }}
                    >
                      ✓ Betaling ontvangen — volgende stap
                    </button>
                  )}

                  {/* Sub-checks */}
                  {step.checks && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {step.checks.map(c => (
                        <button
                          key={c.id}
                          onClick={() => toggleCheck(c.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.4rem 0.6rem', borderRadius: '5px',
                            background: checks[c.id] ? `${GREEN}08` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${checks[c.id] ? GREEN + '25' : BORDER}`,
                            cursor: 'pointer', touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                            minHeight: '34px'
                          }}
                        >
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                            background: checks[c.id] ? GREEN : 'transparent',
                            border: `1.5px solid ${checks[c.id] ? GREEN : 'rgba(255,255,255,0.18)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {checks[c.id] && <Check size={8} color="#000" strokeWidth={3.5} />}
                          </div>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 600,
                            color: checks[c.id] ? 'rgba(255,255,255,0.3)' : TEXT,
                            textDecoration: checks[c.id] ? 'line-through' : 'none'
                          }}>
                            {c.label}
                          </span>
                        </button>
                      ))}

                      {/* Intake Call Panel knop bij stap 4 — coach kan
                          'm direct openen zonder de rest van de SOP eerst
                          af te ronden. */}
                      {step.id === 4 && (
                        <button
                          onClick={() => setShowIntakeCall(true)}
                          style={{
                            marginTop: '0.25rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            padding: '0.4rem 0.6rem', borderRadius: '5px',
                            background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
                            color: GOLD, fontSize: '0.6rem', fontWeight: 800,
                            cursor: 'pointer', touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent', minHeight: '34px'
                          }}
                        >
                          <ExternalLink size={11} />
                          Open Intake Call Panel
                        </button>
                      )}

                      {/* Meal SOP knop bij stap 5 */}
                      {step.id === 5 && (
                        <button
                          onClick={() => {
                            console.log('📋 Meal SOP knop geklikt — onOpenMealPanel:', typeof onOpenMealPanel, '— clientId:', selectedClient?.id)
                            onOpenMealPanel?.(selectedClient?.id)
                          }}
                          style={{
                            marginTop: '0.25rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            padding: '0.4rem 0.6rem', borderRadius: '5px',
                            background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
                            color: GOLD, fontSize: '0.6rem', fontWeight: 800,
                            cursor: 'pointer', touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent', minHeight: '34px'
                          }}
                        >
                          📋 Open Meal Plan SOP
                        </button>
                      )}

                      {/* Workout SOP knop bij stap 5 */}
                      {step.id === 5 && (
                        <button
                          onClick={() => {
                            console.log('🏋️ Workout SOP knop geklikt — onOpenWorkoutPanel:', typeof onOpenWorkoutPanel, '— clientId:', selectedClient?.id)
                            onOpenWorkoutPanel?.(selectedClient?.id)
                          }}
                          style={{
                            marginTop: '0.25rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                            padding: '0.4rem 0.6rem', borderRadius: '5px',
                            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
                            color: '#f97316', fontSize: '0.6rem', fontWeight: 800,
                            cursor: 'pointer', touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent', minHeight: '34px'
                          }}
                        >
                          🏋️ Open Workout SOP
                        </button>
                      )}
                    </div>
                  )}

                  {/* Nav knoppen */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                    {currentStep > 0 && (
                      <button onClick={goBack} style={{
                        padding: '0.4rem 0.7rem', borderRadius: '5px',
                        background: 'transparent', border: `1px solid rgba(255,255,255,0.1)`,
                        color: MUTED, fontSize: '0.58rem', fontWeight: 700,
                        cursor: 'pointer', touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent', minHeight: '32px'
                      }}>
                        ← Terug
                      </button>
                    )}

                    {!step.payment && step.id < STEPS.length - 1 && (
                      <button onClick={advance} style={{
                        flex: 1, padding: '0.4rem 0.75rem', borderRadius: '5px',
                        background: `${GOLD}12`, border: `1px solid ${GOLD}30`,
                        color: GOLD, fontSize: '0.6rem', fontWeight: 800,
                        cursor: 'pointer', touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent', minHeight: '32px'
                      }}>
                        Stap voltooid →
                      </button>
                    )}

                    {step.id === STEPS.length - 1 && (
                      <button onClick={onStartSetup} style={{
                        flex: 1, padding: '0.5rem 0.75rem', borderRadius: '5px',
                        background: `${GOLD}18`, border: `1px solid ${GOLD}45`,
                        color: GOLD, fontSize: '0.65rem', fontWeight: 800,
                        cursor: 'pointer', touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent', minHeight: '36px'
                      }}>
                        Journey aanmaken →
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Intake Call Panel modaal — full-screen overlay zodat de coach
          tijdens de SOP een tussendoor het hele intake-call-panel kan
          invullen (macro's + doel zijn altijd zichtbaar in de header). */}
      {showIntakeCall && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.92)',
          zIndex: 2147483600,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.6rem 1rem',
            background: '#0a0a0a',
            borderBottom: '1px solid rgba(255,215,0,0.2)',
            flexShrink: 0,
          }}>
            <span style={{ color: '#FFD700', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '-0.01em' }}>
              Intake Call Panel — {selectedClient?.first_name || 'klant'}
            </span>
            <button
              onClick={() => setShowIntakeCall(false)}
              style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <IntakeCallPanel
              db={db}
              client={selectedClient}
              journey={existingJourney}
              weekNumber={1}
              totalWeeks={existingJourney?.total_weeks || 12}
              isMobile={isMobile}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── MESSAGE BLOCK ───────────────────────────────────────────────
function MsgBlock({ text, msgId, resolve, copied, onCopy, isMobile, accent }) {
  const borderColor = accent ? `${accent}20` : BORDER
  const bg = accent ? `${accent}05` : 'rgba(255,255,255,0.02)'

  return (
    <div style={{
      background: bg, border: `1px solid ${borderColor}`,
      borderRadius: '6px', padding: '0.6rem 2.2rem 0.6rem 0.75rem',
      position: 'relative'
    }}>
      <p style={{
        color: TEXT, fontSize: isMobile ? '0.7rem' : '0.73rem',
        lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap',
        fontFamily: 'inherit'
      }}>
        {resolve(text)}
      </p>
      <button
        onClick={() => onCopy(text, msgId)}
        style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          width: '26px', height: '26px', borderRadius: '5px',
          background: copied === msgId ? `${GREEN}15` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${copied === msgId ? GREEN + '35' : BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease'
        }}
      >
        {copied === msgId
          ? <Check size={11} color={GREEN} strokeWidth={2.5} />
          : <Copy size={11} color={MUTED} />
        }
      </button>
    </div>
  )
}
