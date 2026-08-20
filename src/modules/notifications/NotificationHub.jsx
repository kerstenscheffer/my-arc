// src/modules/notifications/NotificationHub.jsx
// Meldingen-hub voor de coach: één plek die precies laat zien HOE en WAT van het
// push-meldingsysteem. Toont live de setup-status (server + toestel), hoe je je
// iPhone koppelt, een testmelding-knop, welke gebeurtenissen een melding sturen,
// en een feed van recente meldingen.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell, BellRing, Smartphone, Server, Check, X, AlertCircle, Send,
  Zap, RefreshCw, ClipboardCheck, MessageCircle, FileText, CheckCircle2,
} from 'lucide-react'

const GOLD = '#FFD700'
const GREEN = '#10b981'
const RED = '#ef4444'
const AMBER = '#f59e0b'

// Welke gebeurtenissen een melding aanmaken (en dus — zodra je iPhone gekoppeld
// is — een push sturen). De DB-trigger pusht bij ELKE nieuwe coach-notificatie.
const EVENT_TYPES = [
  { type: 'intake_completed', label: 'Intake ingevuld', desc: 'Een lead/klant rondt de intake af.', Icon: ClipboardCheck, color: '#3b82f6' },
  { type: 'checkin_completed', label: 'Check-in binnen', desc: 'Een klant levert de wekelijkse check-in in.', Icon: CheckCircle2, color: GREEN },
  { type: 'plan_ready', label: 'Plan klaar', desc: 'Een gegenereerd plan is klaar om te reviewen.', Icon: FileText, color: '#a855f7' },
  { type: 'support_message', label: 'Support-bericht', desc: 'Een klant stuurt een support-/hulpvraag.', Icon: MessageCircle, color: AMBER },
]

const typeMeta = (t) => EVENT_TYPES.find(e => e.type === t) || { label: t, Icon: Bell, color: 'rgba(255,255,255,0.5)' }

const timeAgo = (iso) => {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return 'net'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}u`
    return `${Math.floor(diff / 86400)}d`
  } catch { return '' }
}

export default function NotificationHub({ db }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [status, setStatus] = useState(null)   // { apns_configured, trigger_active, my_device_tokens, bundle_id }
  const [recent, setRecent] = useState([])
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      setUserId(user?.id || null)
      const [{ data: st }, { data: notifs }] = await Promise.all([
        db.supabase.rpc('get_push_status'),
        db.supabase.from('coach_notifications')
          .select('id, type, title, message, read_status, created_at')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false })
          .limit(15),
      ])
      setStatus(st || null)
      setRecent(notifs || [])
    } catch (e) { console.error('NotificationHub load failed:', e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const sendTest = async () => {
    if (testing || !userId) return
    setTesting(true); setTestResult(null)
    try {
      const { error } = await db.supabase.from('coach_notifications').insert({
        coach_id: userId,
        type: 'test',
        priority: 'normal',
        title: '🔔 Testmelding',
        message: 'Als het goed is zie je deze melding in je bel — en op je iPhone zodra die gekoppeld is.',
      })
      if (error) throw error
      setTestResult('ok')
      await load()
    } catch (e) {
      console.error('Testmelding mislukt:', e)
      setTestResult('err')
    } finally { setTesting(false) }
  }

  const hasToken = (status?.my_device_tokens || 0) > 0
  const serverReady = !!status?.apns_configured && !!status?.trigger_active
  // Volledig werkend = server klaar + minstens één toestel gekoppeld.
  const fullyWorking = serverReady && hasToken

  if (loading) {
    return <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Meldingen-status laden…</div>
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '1rem 0.9rem 2rem' : '1.5rem 1rem 3rem' }}>
      {/* ─── Titel ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.1rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,215,0,0.1)', border: `1px solid ${GOLD}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BellRing size={20} color={GOLD} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Meldingen-hub</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>Hoe en wat van je push-meldingen — in één oogopslag.</div>
        </div>
        <button onClick={load} title="Vernieuwen" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ─── Grote status-banner ─── */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        borderRadius: 14, marginBottom: '1.1rem',
        background: fullyWorking ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.07)',
        border: `1px solid ${fullyWorking ? GREEN : AMBER}44`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: fullyWorking ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {fullyWorking ? <Check size={22} color={GREEN} strokeWidth={3} /> : <AlertCircle size={22} color={AMBER} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 800, color: '#fff' }}>
            {fullyWorking ? 'Push-meldingen zijn actief' : 'Bijna klaar — koppel je iPhone'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 1.4 }}>
            {fullyWorking
              ? 'Je ontvangt meldingen op je iPhone zodra er iets gebeurt (intake, check-in, plan klaar, support).'
              : serverReady
                ? 'De server is volledig ingesteld. Er is alleen nog geen iPhone gekoppeld — open de app op je iPhone en geef toestemming.'
                : 'De server-configuratie is nog niet compleet. Zie de checklist hieronder.'}
          </div>
        </div>
      </div>

      {/* ─── Status-checklist ─── */}
      <SectionTitle>Status</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.3rem' }}>
        <StatusRow ok={!!status?.apns_configured} Icon={Server}
          title="Server (APNs) geconfigureerd"
          okText="Sleutel, Team-ID & bundle staan klaar"
          failText="APNs-gegevens ontbreken in de config" />
        <StatusRow ok={!!status?.trigger_active} Icon={Zap}
          title="Automatische push-trigger"
          okText="Elke nieuwe melding stuurt een push"
          failText="Trigger ontbreekt" />
        <StatusRow ok={hasToken} Icon={Smartphone}
          title="iPhone gekoppeld"
          okText={`${status?.my_device_tokens} toestel(len) geregistreerd`}
          failText="Nog geen toestel — zie stappen hieronder" />
      </div>

      {/* ─── Zo koppel je je iPhone (alleen als nog geen token) ─── */}
      {!hasToken && (
        <>
          <SectionTitle>Zo koppel je je iPhone</SectionTitle>
          <div style={{ padding: '0.9rem 1rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.3rem' }}>
            {[
              'Zorg dat de app als echte iOS-app op je iPhone staat (via TestFlight of de App Store — niet de browser).',
              'Open de app en log in als coach.',
              'Geef toestemming voor meldingen wanneer iOS erom vraagt.',
              'Klaar — je toestel registreert zich automatisch en deze status wordt groen.',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.4rem 0' }}>
                <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,215,0,0.14)', border: `1px solid ${GOLD}55`, color: GOLD, fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                <div style={{ flex: 1, fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>{step}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── Testmelding ─── */}
      <SectionTitle>Test</SectionTitle>
      <div style={{ padding: '0.9rem 1rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.3rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Stuur jezelf een testmelding</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.4 }}>
            Verschijnt direct in je bel. {hasToken ? 'En als push op je iPhone.' : 'Op je iPhone zodra die gekoppeld is.'}
          </div>
        </div>
        <button onClick={sendTest} disabled={testing}
          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.6rem 1rem', borderRadius: 10, background: GOLD, border: 'none', color: '#000', fontSize: '0.82rem', fontWeight: 800, cursor: testing ? 'wait' : 'pointer', opacity: testing ? 0.6 : 1 }}>
          <Send size={15} /> {testing ? 'Versturen…' : 'Testmelding'}
        </button>
        {testResult === 'ok' && <span style={{ fontSize: '0.72rem', color: GREEN, fontWeight: 700, width: '100%' }}>✓ Verstuurd — check je bel (rechtsboven).</span>}
        {testResult === 'err' && <span style={{ fontSize: '0.72rem', color: RED, fontWeight: 700, width: '100%' }}>Versturen mislukt.</span>}
      </div>

      {/* ─── Welke gebeurtenissen ─── */}
      <SectionTitle>Wanneer krijg je een melding?</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8, marginBottom: '1.3rem' }}>
        {EVENT_TYPES.map(ev => (
          <div key={ev.type} style={{ padding: '0.75rem 0.85rem', borderRadius: 11, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: `${ev.color}1a`, border: `1px solid ${ev.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ev.Icon size={15} color={ev.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{ev.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{ev.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Recente meldingen ─── */}
      <SectionTitle>Recente meldingen ({recent.length})</SectionTitle>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        {recent.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Nog geen meldingen.</div>
        ) : recent.map((n, i) => {
          const m = typeMeta(n.type)
          return (
            <div key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0.65rem 0.85rem', borderBottom: i === recent.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)', background: n.read_status ? 'transparent' : 'rgba(255,215,0,0.03)' }}>
              <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <m.Icon size={14} color={m.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: n.read_status ? 600 : 800, color: n.read_status ? 'rgba(255,255,255,0.6)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title || m.label}</div>
                {n.message && <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>}
              </div>
              <span style={{ flexShrink: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{timeAgo(n.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.5rem 0.15rem' }}>{children}</div>
}

function StatusRow({ ok, Icon, title, okText, failText }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0.7rem 0.85rem', borderRadius: 11, background: 'rgba(255,255,255,0.03)', border: `1px solid ${ok ? GREEN : AMBER}33` }}>
      <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={ok ? GREEN : AMBER} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{title}</div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{ok ? okText : failText}</div>
      </div>
      <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {ok ? <Check size={13} color={GREEN} strokeWidth={3} /> : <X size={13} color={AMBER} strokeWidth={3} />}
      </div>
    </div>
  )
}
