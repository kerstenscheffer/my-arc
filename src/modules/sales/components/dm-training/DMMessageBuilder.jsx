// src/modules/sales/components/dm-training/DMMessageBuilder.jsx
import { useState } from 'react'
import { Copy, Check, MessageSquare, Sparkles, RotateCcw } from 'lucide-react'
import { SALES_THEME } from '../../SalesSection'

export default function DMMessageBuilder({ isMobile }) {
  const [inputMessage, setInputMessage] = useState('')
  const [step1, setStep1] = useState('') // Parafraseer
  const [step2, setStep2] = useState('') // Patroon
  const [step3, setStep3] = useState('') // Brug (optioneel)
  const [step4, setStep4] = useState('') // Vraag
  const [copied, setCopied] = useState(false)

  const exampleData = {
    input: "Yooo ja wel oke was anderhalve week ziek dus die hielp niet mee. Track en nog niet mee begonnen vanaf februari weer nu wel begonnen met het loggen van mn workouts om progressie te boeken tijdens de bulk",
    step1: "Ahh kut man, ziek zijn is altijd kut timing. Goed dat je weer begonnen bent! 💪",
    step2: "Nice dat je workouts al logt, dat is een sterke stap. Maar wat ik vaak zie is dat jongens perfect trainen en alles loggen, maar niet de resultaten halen die ze kunnen halen. Dit komt doordat hun lichaam niet de bouwstenen krijgt die hij nodig is om spieren op te bouwen.",
    step3: "",
    step4: "Hoe zit dat bij jou? Let je ook op hoeveel je eet?"
  }

  const loadExample = () => {
    setInputMessage(exampleData.input)
    setStep1(exampleData.step1)
    setStep2(exampleData.step2)
    setStep3(exampleData.step3)
    setStep4(exampleData.step4)
  }

  const clearAll = () => {
    setInputMessage('')
    setStep1('')
    setStep2('')
    setStep3('')
    setStep4('')
  }

  const generateOutput = () => {
    const parts = []
    if (step1) parts.push(step1)
    if (step2) parts.push(step2)
    if (step3) parts.push(step3)
    if (step4) parts.push(step4)
    return parts.join('\n\n')
  }

  const copyOutput = () => {
    const output = generateOutput()
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const output = generateOutput()
  const hasContent = step1 || step2 || step3 || step4

  return (
    <div style={{
      marginTop: isMobile ? '2rem' : '3rem',
      padding: isMobile ? '1.5rem' : '2rem',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '10px',
            background: `${SALES_THEME.primary}20`,
            border: `1px solid ${SALES_THEME.primary}40`
          }}>
            <MessageSquare size={isMobile ? 20 : 24} color={SALES_THEME.primary} />
          </div>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              color: '#fff',
              margin: 0
            }}>
              DM Bericht Opsteller
            </h3>
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0,
              marginTop: '0.25rem'
            }}>
              Youri's methode - Parafraseer → Patroon → Vraag
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={loadExample}
            style={{
              padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#a78bfa',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={14} />
            {!isMobile && 'Voorbeeld'}
          </button>

          {hasContent && (
            <button
              onClick={clearAll}
              style={{
                padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <RotateCcw size={14} />
              {!isMobile && 'Reset'}
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '1.5rem' : '2rem'
      }}>
        {/* LEFT: Input Fields */}
        <div>
          {/* Input Message */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              📩 Zijn Bericht
            </label>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Plak hier zijn bericht..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.875rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#e5e5e5',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = SALES_THEME.primary}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            />
          </div>

          {/* Step 1: Parafraseer */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '700',
              color: '#3b82f6',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              1️⃣ Parafraseer (Validatie)
            </label>
            <textarea
              value={step1}
              onChange={(e) => setStep1(e.target.value)}
              placeholder="Valideer wat hij zegt... bijv: 'Ahh kut man, ziek zijn is altijd kut timing. Goed dat je weer begonnen bent! 💪'"
              style={{
                width: '100%',
                minHeight: '70px',
                padding: '0.75rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                color: '#e5e5e5',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          {/* Step 2: Patroon */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              2️⃣ Patroon ("Wat ik vaak zie...")
            </label>
            <textarea
              value={step2}
              onChange={(e) => setStep2(e.target.value)}
              placeholder="Educatie + patroon... bijv: 'Wat ik vaak zie is dat jongens perfect trainen maar niet de resultaten halen...'"
              style={{
                width: '100%',
                minHeight: '90px',
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#e5e5e5',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          {/* Step 3: Brug (optioneel) */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '700',
              color: '#f59e0b',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              3️⃣ Brug (Optioneel)
            </label>
            <textarea
              value={step3}
              onChange={(e) => setStep3(e.target.value)}
              placeholder="Extra context of redirect... bijv: 'Want je kunt 100% op training zitten, maar als je te weinig eet groei je niet.'"
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '0.75rem',
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                color: '#e5e5e5',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          {/* Step 4: Vraag */}
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '700',
              color: '#ec4899',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              4️⃣ Vraag (Open + Relevant)
            </label>
            <textarea
              value={step4}
              onChange={(e) => setStep4(e.target.value)}
              placeholder="Open vraag die verder gaat... bijv: 'Hoe zit dat bij jou? Let je ook op hoeveel je eet?'"
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '0.75rem',
                background: 'rgba(236, 72, 153, 0.05)',
                border: '1px solid rgba(236, 72, 153, 0.2)',
                borderRadius: '8px',
                color: '#e5e5e5',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* RIGHT: Output Preview */}
        <div>
          <div style={{
            position: 'sticky',
            top: '1rem'
          }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              📤 Output (Ready to Copy)
            </label>

            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: hasContent 
                ? `1px solid ${SALES_THEME.primary}40`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: isMobile ? '1rem' : '1.25rem',
              minHeight: '300px',
              position: 'relative'
            }}>
              {hasContent ? (
                <>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    color: '#e5e5e5',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '1rem'
                  }}>
                    {output}
                  </div>

                  <button
                    onClick={copyOutput}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.875rem' : '1rem',
                      background: copied 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
                      border: 'none',
                      borderRadius: '8px',
                      color: '#000',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      transform: copied ? 'scale(0.98)' : 'scale(1)'
                    }}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Gekopieerd!' : 'Kopieer Bericht'}
                  </button>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: '250px',
                  color: 'rgba(255, 255, 255, 0.3)',
                  textAlign: 'center',
                  padding: '2rem'
                }}>
                  <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', margin: 0 }}>
                    Vul de stappen in om je bericht te zien
                  </p>
                  <p style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', marginTop: '0.5rem' }}>
                    Of klik op "Voorbeeld" voor een template
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: '#a78bfa',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                💡 Tips:
              </div>
              <ul style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                paddingLeft: '1.25rem',
                lineHeight: '1.6'
              }}>
                <li>Parafraseer = valideer wat hij zegt (empathie)</li>
                <li>Patroon = "Wat ik vaak zie..." (educatie)</li>
                <li>Brug = extra context (optioneel)</li>
                <li>Vraag = open vraag naar waar jij wilt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
