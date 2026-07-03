// src/modules/coach-command-center/components/AddClientModal.jsx
//
// Compacte modal voor "Nieuwe klant" — geopend vanuit CoachCommandCenter
// header. Gebruikt dezelfde flow als ClientInfoTab: maak een auth-user aan
// via supabase.auth.signUp en insert een rij in `clients` met trainer_id /
// coach_id van de huidige coach.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, UserPlus, Loader2, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { signUpNewClient } from '../../../lib/supabase'

const initial = {
  firstName: '', lastName: '', email: '', password: '',
  phone: '', currentWeight: '', targetWeight: '', height: '',
}

export default function AddClientModal({ open, db, coachId, onClose, onCreated, isMobile = false }) {
  const [form, setForm] = useState(initial)
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const reset = () => {
    setForm(initial)
    setError(null)
    setSuccess(false)
    setShowPw(false)
  }

  const handleClose = () => {
    if (busy) return
    reset()
    onClose && onClose()
  }

  const valid = form.firstName.trim() && form.lastName.trim() && form.email.trim()
    && form.password.length >= 6

  const insertClient = async (authUserId) => {
    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      current_weight: form.currentWeight ? parseFloat(form.currentWeight) : null,
      target_weight: form.targetWeight ? parseFloat(form.targetWeight) : null,
      height: form.height ? parseInt(form.height) : null,
      auth_user_id: authUserId,
      trainer_id: coachId,
      coach_id: coachId,
      created_at: new Date().toISOString(),
    }
    const { data, error: insErr } = await db.supabase
      .from('clients')
      .insert(payload)
      .select()
      .single()
    if (insErr) throw insErr
    return data
  }

  const handleSubmit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      let resolvedCoachId = coachId
      if (!resolvedCoachId) {
        const { data: { user } } = await db.supabase.auth.getUser()
        resolvedCoachId = user?.id
      }
      if (!resolvedCoachId) {
        throw new Error('Coach-account niet gevonden — log opnieuw in.')
      }

      // Check eerst of email al bestaat als client
      const existing = await db.getClientByEmail?.(form.email.trim().toLowerCase())
      if (existing) {
        setError('Een klant met dit e-mailadres bestaat al in je lijst.')
        setBusy(false)
        return
      }

      // Maak auth-user aan op een geïsoleerde client, zodat de
      // coach-sessie niet wordt vervangen door die van de nieuwe klant
      const { data: authData, error: authErr } = await signUpNewClient(
        form.email.trim().toLowerCase(),
        form.password,
        {
          full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          role: 'client',
        }
      )

      let authUserId = authData?.user?.id || null
      if (authErr) {
        // Email bestond al in auth → maak client-record zonder auth_user_id
        // (coach kan'm later linken). Zelfde fallback als ClientInfoTab.
        if (!authErr.message.toLowerCase().includes('already')) {
          throw authErr
        }
        authUserId = null
      }

      const created = await insertClient(authUserId)
      setSuccess(true)
      onCreated && onCreated(created)
      setTimeout(() => { handleClose() }, 1100)
    } catch (err) {
      console.error('Add client failed:', err)
      setError(err.message || 'Onbekende fout bij aanmaken klant.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const node = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2147483600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'addClientFade 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: 18,
          width: '100%',
          maxWidth: 560,
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
          animation: 'addClientPop 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.1rem 1.15rem 0.95rem' : '1.4rem 1.5rem 1.1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: isMobile ? 40 : 44, height: isMobile ? 40 : 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0a0a0a',
            flexShrink: 0,
            boxShadow: '0 6px 18px rgba(255,215,0,0.28)',
          }}>
            <UserPlus size={isMobile ? 18 : 20} strokeWidth={2.6} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 800, color: '#FFD700',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              opacity: 0.85, marginBottom: 2,
            }}>
              Coach Command
            </div>
            <div style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              Nieuwe klant toevoegen
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Sluiten"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: isMobile ? '1.1rem 1.15rem' : '1.4rem 1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
        }}>
          {/* Naam — twee velden naast elkaar */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label>Voornaam *</Label>
              <input
                type="text"
                value={form.firstName}
                onChange={set('firstName')}
                style={inputStyle(isMobile)}
                autoFocus
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Achternaam *</Label>
              <input
                type="text"
                value={form.lastName}
                onChange={set('lastName')}
                style={inputStyle(isMobile)}
              />
            </div>
          </div>

          <div>
            <Label>E-mailadres *</Label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              autoCapitalize="none"
              autoCorrect="off"
              style={inputStyle(isMobile)}
            />
          </div>

          <div>
            <Label>Wachtwoord * <span style={{ opacity: 0.45, fontWeight: 600 }}>(min 6)</span></Label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                style={{ ...inputStyle(isMobile), paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                style={{
                  position: 'absolute', right: 8, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 28, height: 28,
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <Label>Telefoon <span style={{ opacity: 0.45, fontWeight: 600 }}>(optioneel)</span></Label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              style={inputStyle(isMobile)}
              placeholder="+31 6 ..."
            />
          </div>

          {/* Body-stats — compact 3-kolom */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label>Gewicht (kg)</Label>
              <input
                type="number" step="0.1"
                value={form.currentWeight}
                onChange={set('currentWeight')}
                style={inputStyle(isMobile)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Doel (kg)</Label>
              <input
                type="number" step="0.1"
                value={form.targetWeight}
                onChange={set('targetWeight')}
                style={inputStyle(isMobile)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Lengte (cm)</Label>
              <input
                type="number"
                value={form.height}
                onChange={set('height')}
                style={inputStyle(isMobile)}
              />
            </div>
          </div>

          {/* Error / success feedback */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '0.7rem 0.85rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              fontSize: '0.78rem', fontWeight: 700,
              color: '#ef4444', lineHeight: 1.4,
            }}>
              <AlertCircle size={14} strokeWidth={2.6} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.7rem 0.85rem',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.35)',
              borderRadius: 10,
              fontSize: '0.85rem', fontWeight: 800,
              color: '#10b981',
            }}>
              <Check size={15} strokeWidth={3} />
              Klant aangemaakt!
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!valid || busy}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: isMobile ? '0.95rem' : '1.05rem',
              minHeight: 52,
              background: (valid && !busy)
                ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                : 'rgba(255,215,0,0.18)',
              color: (valid && !busy) ? '#0a0a0a' : 'rgba(0,0,0,0.4)',
              border: 'none', borderRadius: 12,
              fontSize: isMobile ? '0.95rem' : '1.02rem',
              fontWeight: 900, letterSpacing: '0.02em',
              cursor: (valid && !busy) ? 'pointer' : 'not-allowed',
              boxShadow: (valid && !busy) ? '0 10px 24px rgba(255,215,0,0.3)' : 'none',
              marginTop: 4,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {busy
              ? <><Loader2 size={16} strokeWidth={2.6} style={{ animation: 'addClientSpin 0.9s linear infinite' }} /> Aanmaken…</>
              : <><UserPlus size={16} strokeWidth={2.6} /> Klant aanmaken</>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes addClientFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes addClientPop {
          from { opacity: 0; transform: scale(0.96) translateY(8px) }
          to   { opacity: 1; transform: scale(1) translateY(0) }
        }
        @keyframes addClientSpin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
  return createPortal(node, document.body)
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: '0.6rem', fontWeight: 800,
      color: 'rgba(255,255,255,0.55)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: 5,
    }}>
      {children}
    </div>
  )
}

const inputStyle = (isMobile) => ({
  width: '100%',
  padding: isMobile ? '0.7rem 0.85rem' : '0.8rem 0.95rem',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#fff',
  fontSize: isMobile ? '0.9rem' : '0.95rem',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
})
