// src/pages/SupportPage.jsx
// Publieke support-pagina op /support. Bevat:
//   1) Contact-form die via mailto: opent (geen backend nodig)
//   2) FAQ accordion
//   3) Snelle contact-knoppen (mail, WhatsApp) + privacy link
// Geen auth nodig.

import { useState } from 'react'
import {
  Mail, MessageCircle, Shield, ArrowLeft, Send,
  HelpCircle, Plus, Minus, Loader2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const GOLD = '#FFD700'
const SUPPORT_EMAIL = 'kerstenscheffer@gmail.com'

const FAQ_ITEMS = [
  {
    q: 'Hoe reset ik mijn wachtwoord?',
    a: 'Op de login-pagina vind je onderaan een link "Wachtwoord vergeten". Vul daar je e-mailadres in en je krijgt direct een reset-link in je inbox.',
  },
  {
    q: 'Mijn workout/meal-plan wordt niet getoond, wat nu?',
    a: 'Sluit de app volledig (swipen weg) en open opnieuw. Werkt dat niet? Mail ons via het formulier hieronder met de tijd van het probleem — dan kunnen we in de logs kijken.',
  },
  {
    q: 'Hoe upload ik een progress-foto?',
    a: 'Ga naar de Tracking-pagina, tik op "Progress foto’s" en kies de hoek (voorkant/zijkant/achterkant). De foto wordt automatisch gekoppeld aan de juiste dag.',
  },
  {
    q: 'Mijn nieuwe gewicht wordt niet opgeslagen.',
    a: 'Check of je internetverbinding stabiel is. Het opgeslagen-banner verschijnt direct in groen wanneer het is gelukt. Krijg je een foutmelding? Stuur ons een screenshot via het formulier.',
  },
  {
    q: 'Kan ik mijn abonnement opzeggen of pauzeren?',
    a: 'Stuur een bericht via het formulier of mail ons direct. We regelen het binnen 1 werkdag voor je.',
  },
  {
    q: 'Hoe contacteer ik mijn coach buiten de app?',
    a: 'Je coach is bereikbaar via WhatsApp op +31 6 31 38 87 56 of via het ingebouwde contact-formulier op deze pagina.',
  },
]

export default function SupportPage() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      padding: isMobile ? '1.5rem 1rem' : '3rem 2rem',
      paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? '1.5rem' : '3rem'})`,
      paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? '1.5rem' : '3rem'})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 620,
        display: 'flex', flexDirection: 'column',
        gap: isMobile ? '1.5rem' : '2rem',
      }}>
        {/* Terug-link */}
        <a
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.78rem', fontWeight: 700,
            textDecoration: 'none',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
        >
          <ArrowLeft size={14} strokeWidth={2.4} /> Terug
        </a>

        {/* Header — coach-foto links, grote heading rechts */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: isMobile ? 14 : 20,
        }}>
          <img
            src="https://i.ibb.co/mCQzTZrZ/ea169061-c9f1-4b4d-ab88-fc746cbde003.jpg"
            alt="Kersten Scheffer"
            style={{
              width: isMobile ? 76 : 100,
              height: isMobile ? 76 : 100,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(255,215,0,0.45)',
              boxShadow: '0 6px 20px rgba(255,215,0,0.18)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.68rem', fontWeight: 800, color: GOLD,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              marginBottom: '0.35rem', opacity: 0.85,
            }}>
              Support
            </div>
            <h1 style={{
              fontSize: isMobile ? '1.6rem' : '2.2rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.025em', lineHeight: 1.05,
              margin: 0,
            }}>
              Hoe kan ik je helpen?
            </h1>
          </div>
        </div>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255,255,255,0.65)',
          fontWeight: 600,
          lineHeight: 1.5,
          margin: 0,
          marginTop: isMobile ? '-0.5rem' : '-0.75rem',
        }}>
          Stuur direct een bericht via het formulier hieronder, of check
          de veelgestelde vragen.
        </p>

        {/* Contact-form bovenaan — pas dan FAQ */}
        <ContactForm isMobile={isMobile} />

        {/* FAQ onder de mail-vak */}
        <FAQSection isMobile={isMobile} />

        {/* Snelle contact-rijen */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 800,
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 2,
          }}>
            Directe kanalen
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={contactRowStyle()}
          >
            <div style={iconBubbleStyle('rgba(255,215,0,0.15)', 'rgba(255,215,0,0.4)')}>
              <Mail size={isMobile ? 20 : 22} color={GOLD} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={contactLabelStyle()}>E-mail</div>
              <div style={contactValueStyle(isMobile)}>{SUPPORT_EMAIL}</div>
            </div>
          </a>

          <a
            href="https://wa.me/31631388756"
            target="_blank" rel="noopener noreferrer"
            style={contactRowStyle()}
          >
            <div style={iconBubbleStyle('rgba(37,211,102,0.15)', 'rgba(37,211,102,0.4)')}>
              <MessageCircle size={isMobile ? 20 : 22} color="#25D366" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={contactLabelStyle()}>WhatsApp</div>
              <div style={contactValueStyle(isMobile)}>+31 6 31 38 87 56</div>
            </div>
          </a>

          <a
            href="/privacy"
            style={{ ...contactRowStyle(), background: 'rgba(255,255,255,0.025)' }}
          >
            <div style={iconBubbleStyle('rgba(255,255,255,0.06)', 'rgba(255,255,255,0.15)')}>
              <Shield size={isMobile ? 20 : 22} color="rgba(255,255,255,0.8)" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={contactLabelStyle()}>Privacy</div>
              <div style={contactValueStyle(isMobile)}>Lees ons privacybeleid</div>
            </div>
          </a>
        </div>

        {/* Footer-info */}
        <div style={{
          fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)',
          fontWeight: 600, lineHeight: 1.5,
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          MY ARC Fitness · Powered by coaches die om je geven.
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// FAQ — accordion
// ─────────────────────────────────────────────────────────
function FAQSection({ isMobile }) {
  const [openIdx, setOpenIdx] = useState(null)
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '0.68rem', fontWeight: 800,
        color: 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '0.75rem',
      }}>
        <HelpCircle size={13} strokeWidth={2.4} />
        Veelgestelde vragen
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {FAQ_ITEMS.map((item, idx) => {
          const open = openIdx === idx
          return (
            <div
              key={idx}
              style={{
                borderBottom: idx < FAQ_ITEMS.length - 1
                  ? '1px solid rgba(255,255,255,0.05)'
                  : 'none',
              }}
            >
              <button
                onClick={() => setOpenIdx(open ? null : idx)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: isMobile ? '0.95rem 1.05rem' : '1.05rem 1.2rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  flex: 1, minWidth: 0,
                  fontSize: isMobile ? '0.88rem' : '0.95rem',
                  fontWeight: 700, color: '#fff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.35,
                }}>
                  {item.q}
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: open ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${open ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  color: open ? GOLD : 'rgba(255,255,255,0.55)',
                }}>
                  {open
                    ? <Minus size={13} strokeWidth={2.6} />
                    : <Plus size={13} strokeWidth={2.6} />}
                </div>
              </button>
              {open && (
                <div style={{
                  padding: isMobile ? '0 1.05rem 1rem 1.05rem' : '0 1.2rem 1.15rem 1.2rem',
                  fontSize: isMobile ? '0.84rem' : '0.9rem',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500, lineHeight: 1.55,
                }}>
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Contact form — schrijft direct naar Supabase `support_messages` tabel.
// Een DB-trigger maakt automatisch een coach_notifications row aan, dus
// het bericht verschijnt direct in de coach-notification-bell. Geen mail
// nodig.
// ─────────────────────────────────────────────────────────
function ContactForm({ isMobile }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const valid = name.trim() && email.trim() && message.trim().length >= 5

  const handleSend = async () => {
    if (!valid || sending) return
    setSending(true)
    setError(null)
    try {
      const { error: insertError } = await supabase
        .from('support_messages')
        .insert([{
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          user_agent: navigator.userAgent.slice(0, 500),
        }])
      if (insertError) throw insertError
      setSent(true)
      setName('')
      setEmail('')
      setMessage('')
      setTimeout(() => setSent(false), 8000)
    } catch (err) {
      console.error('Send support message failed:', err)
      setError('Versturen mislukt — check je internet en probeer opnieuw.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '0.68rem', fontWeight: 800,
        color: 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '0.75rem',
      }}>
        <Send size={13} strokeWidth={2.4} />
        Stuur een bericht
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: isMobile ? '1rem' : '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '0.7rem',
      }}>
        <input
          type="text"
          placeholder="Je naam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle(isMobile)}
        />
        <input
          type="email"
          placeholder="Je e-mailadres"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle(isMobile)}
        />
        <textarea
          placeholder="Waar kunnen we je mee helpen?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          style={{
            ...inputStyle(isMobile),
            resize: 'vertical', minHeight: 110, fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!valid || sending}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: isMobile ? '0.85rem' : '0.95rem',
            minHeight: 48,
            background: valid && !sending
              ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
              : 'rgba(255,215,0,0.2)',
            color: valid && !sending ? '#0a0a0a' : 'rgba(0,0,0,0.5)',
            border: 'none', borderRadius: 10,
            fontSize: isMobile ? '0.92rem' : '1rem',
            fontWeight: 900, letterSpacing: '0.02em',
            cursor: valid && !sending ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            boxShadow: valid && !sending ? '0 8px 20px rgba(255,215,0,0.25)' : 'none',
          }}
        >
          {sending ? (
            <>
              <Loader2 size={16} strokeWidth={2.6} style={{ animation: 'spin 1s linear infinite' }} />
              Verzenden…
            </>
          ) : (
            <>
              <Send size={16} strokeWidth={2.6} />
              Verstuur bericht
            </>
          )}
        </button>
        {sent && (
          <div style={{
            padding: '0.7rem 0.85rem',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
            fontSize: '0.82rem', fontWeight: 700,
            color: '#10b981', textAlign: 'center',
          }}>
            Ik heb je bericht ontvangen en reageer binnen 24 uur.
          </div>
        )}
        {error && (
          <div style={{
            padding: '0.7rem 0.85rem',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            fontSize: '0.78rem', fontWeight: 700,
            color: '#ef4444', textAlign: 'center',
          }}>
            {error}
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────
const inputStyle = (isMobile) => ({
  width: '100%',
  padding: isMobile ? '0.8rem 0.9rem' : '0.9rem 1rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: isMobile ? '0.9rem' : '0.95rem',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
})

const contactRowStyle = () => ({
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '0.9rem 1.05rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  color: '#fff',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background 0.15s ease, border-color 0.15s ease',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
})

const iconBubbleStyle = (bg, border) => ({
  width: 46, height: 46,
  borderRadius: 12,
  background: bg,
  border: `1px solid ${border}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
})

const contactLabelStyle = () => ({
  fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 3,
})

const contactValueStyle = (isMobile) => ({
  fontSize: isMobile ? '0.9rem' : '0.95rem',
  fontWeight: 800, color: '#fff',
  letterSpacing: '-0.01em',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
})
