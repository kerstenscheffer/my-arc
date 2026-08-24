// src/modules/notifications/FixedNotifications.jsx
// De vaste meldingen: aan/uit per soort. Anders dan de regel-bouwer hiernaast
// zijn dit gebeurtenissen die vanzelf vuren (iemand vult de intake in, jij wijst
// een plan toe). Je kunt ze niet herschrijven — alleen aan- of uitzetten.
//
// Opslag: notification_settings (coach_id + key). Geen rij = aan. Een BEFORE
// INSERT-filter op beide meldingstabellen gooit de melding weg zodra de soort
// uitstaat, dus de schakelaar werkt ongeacht wie de melding probeert te maken.
import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardCheck, CheckCircle2, Dumbbell, Video, MessageCircle, AlertCircle, Users,
} from 'lucide-react'
import RecipientsModal from './RecipientsModal'

const GREEN = '#10b981'
const RED = '#ef4444'

// De `key` moet exact matchen met wat filter_coach_notification /
// filter_client_notification in de database afleiden.
const FIXED = [
  { key: 'intake_completed',  who: 'coach',  label: 'Intake ingevuld',   desc: 'Een lead of klant rondt de intake af.',        Icon: ClipboardCheck, color: '#3b82f6' },
  { key: 'checkin_completed', who: 'coach',  label: 'Check-in binnen',   desc: 'Een klant levert zijn check-in in.',           Icon: CheckCircle2,   color: GREEN },
  { key: 'client_workout',    who: 'klant',  label: 'Nieuw trainingsschema', desc: 'Je wijst een klant een nieuw plan toe.',   Icon: Dumbbell,       color: '#a855f7' },
  { key: 'client_video',      who: 'klant',  label: 'Video toegewezen',  desc: 'Je deelt een video met een klant.',            Icon: Video,          color: '#f59e0b' },
  { key: 'client_message',    who: 'klant',  label: 'Bericht van jou',   desc: 'Je stuurt een klant zelf een melding.',        Icon: MessageCircle,  color: '#06b6d4' },
]

export default function FixedNotifications({ db, coachId }) {
  const [settings, setSettings] = useState({})   // key → enabled
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState(null)
  const [error, setError] = useState(null)
  // Welke melding staat open in "naar wie is dit gegaan?" — null = dicht.
  const [showFor, setShowFor] = useState(null)

  const load = useCallback(async () => {
    if (!coachId) return
    setLoading(true); setError(null)
    try {
      const { data, error: e } = await db.supabase
        .from('notification_settings')
        .select('key, enabled')
        .eq('coach_id', coachId)
      if (e) throw e
      setSettings(Object.fromEntries((data || []).map(r => [r.key, r.enabled])))
    } catch (e) {
      console.error('Meldings-instellingen laden mislukt:', e)
      setError(e.message || 'Laden mislukt')
    } finally { setLoading(false) }
  }, [db, coachId])

  useEffect(() => { load() }, [load])

  // Geen rij in de tabel betekent "aan" — zie notification_enabled() in de DB.
  const isOn = (key) => settings[key] !== false

  const toggle = async (key) => {
    const next = !isOn(key)
    setBusyKey(key)
    setSettings(prev => ({ ...prev, [key]: next }))   // optimistisch
    try {
      const { error: e } = await db.supabase
        .from('notification_settings')
        .upsert({ coach_id: coachId, key, enabled: next, updated_at: new Date().toISOString() },
                { onConflict: 'coach_id,key' })
      if (e) throw e
    } catch (e) {
      console.error('Omzetten mislukt:', e)
      setError(e.message || 'Omzetten mislukt')
      setSettings(prev => ({ ...prev, [key]: !next }))  // terugdraaien
    } finally { setBusyKey(null) }
  }

  const uitAantal = FIXED.filter(f => !isOn(f.key)).length

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 0.5rem 0.15rem' }}>
        <div style={{ flex: 1, fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          Vaste meldingen
        </div>
        {uitAantal > 0 && (
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: RED }}>{uitAantal} uit</span>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0.6rem 0.8rem', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: `1px solid ${RED}44`, marginBottom: 8, fontSize: '0.75rem', color: RED }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: '1.4rem' }}>
        {loading ? (
          <div style={{ padding: '1.4rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Laden…</div>
        ) : FIXED.map((f, i) => {
          const on = isOn(f.key)
          return (
            <div key={f.key} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0.7rem 0.85rem', borderBottom: i === FIXED.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)', opacity: on ? 1 : 0.5 }}>
              <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: `${f.color}1a`, border: `1px solid ${f.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <f.Icon size={15} color={f.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {f.label}
                  {/* Wie 'm krijgt — jij of de klant. */}
                  <span style={{ flexShrink: 0, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
                    {f.who}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
              <button onClick={() => setShowFor(f)} title="Naar wie is dit gestuurd?"
                style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={13} />
              </button>
              <button onClick={() => toggle(f.key)} disabled={busyKey === f.key} title={on ? 'Uitzetten' : 'Aanzetten'}
                style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: busyKey === f.key ? 'wait' : 'pointer', padding: 2, background: on ? GREEN : 'rgba(255,255,255,0.14)', transition: 'background 0.15s' }}>
                <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: `translateX(${on ? 20 : 0}px)`, transition: 'transform 0.15s' }} />
              </button>
            </div>
          )
        })}
      </div>

      {showFor && (
        <RecipientsModal db={db} title={showFor.label} fixedKey={showFor.key}
          isMobile={typeof window !== 'undefined' && window.innerWidth <= 768}
          onClose={() => setShowFor(null)} />
      )}
    </>
  )
}
