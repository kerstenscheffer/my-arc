// src/modules/notifications/NotificationHub.jsx
// Meldingen-hub voor de coach. Bewust kaal: één statusregel, je automatische
// regels, en wat er recent uitging.
//
// Wat er UIT is gehaald (was ruis): een checklist van zes technische rijen
// (APNs-config, DB-triggers, cron-job) die alleen zeggen of de plumbing staat,
// een losse test-sectie, de koppel-stappen voor de iPhone, en een vast rooster
// "wanneer krijg je een melding" dat inmiddels niet meer klopte. De statusregel
// dekt nu de enige vraag die telt: komt het op je telefoon aan of niet.
import { useState, useEffect } from 'react'
import {
  BellRing, Smartphone, Check, Send, RefreshCw, Bell, ChevronDown, ChevronRight,
} from 'lucide-react'
import ScheduledNotifications from './ScheduledNotifications'
import FixedNotifications from './FixedNotifications'

const GOLD = '#FFD700'
const GREEN = '#10b981'
const RED = '#ef4444'
const AMBER = '#f59e0b'

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
  const [status, setStatus] = useState(null)
  const [recent, setRecent] = useState([])
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  // Standaard dicht: de regels erboven zijn waar je iets mee doet, dit is
  // naslag. Klap open als je wilt zien wat er echt uitging.
  const [recentOpen, setRecentOpen] = useState(false)

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
        // 'test' bestaat niet in de valid_type-constraint op coach_notifications
        // — die insert faalde stil, dus de testknop deed niets.
        type: 'announcement',
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

  if (loading) {
    return <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '1rem 0.9rem 2rem' : '1.5rem 1rem 3rem' }}>
      {/* ─── Titel + acties ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.1rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,215,0,0.1)', border: `1px solid ${GOLD}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BellRing size={20} color={GOLD} />
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Meldingen
        </div>
        <button onClick={sendTest} disabled={testing} title="Stuur jezelf een testmelding"
          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.8rem', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 700, cursor: testing ? 'wait' : 'pointer' }}>
          <Send size={14} /> {testing ? '…' : 'Test'}
        </button>
        <button onClick={load} title="Vernieuwen"
          style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {testResult && (
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: 9, marginBottom: '0.8rem', fontSize: '0.75rem', fontWeight: 700,
          background: testResult === 'ok' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${testResult === 'ok' ? GREEN : RED}44`,
          color: testResult === 'ok' ? GREEN : RED }}>
          {testResult === 'ok' ? '✓ Verstuurd — check je bel rechtsboven.' : 'Versturen mislukt.'}
        </div>
      )}

      {/* ─── Eén statusregel. Groen = komt op je telefoon aan; oranje = blijft
             in de app hangen omdat er nog geen toestel gekoppeld is. ─── */}
      <div style={{
        padding: '0.85rem 1rem', borderRadius: 12, marginBottom: '1.4rem',
        background: hasToken ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)',
        border: `1px solid ${hasToken ? GREEN : AMBER}44`,
        display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: hasToken ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasToken ? <Check size={18} color={GREEN} strokeWidth={3} /> : <Smartphone size={17} color={AMBER} />}
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', lineHeight: 1.45 }}>
          {hasToken ? (
            <span style={{ color: '#fff', fontWeight: 700 }}>Push staat aan op je iPhone.</span>
          ) : (
            <>
              <span style={{ color: '#fff', fontWeight: 700 }}>Nog geen iPhone gekoppeld.</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}> Meldingen komen wel in je bel. Open de app op je iPhone en geef toestemming.</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Vaste meldingen: alleen aan/uit ─── */}
      <FixedNotifications db={db} coachId={userId} />

      {/* ─── Regels die je zelf instelt (tijdstip, drempel, tekst) ─── */}
      <ScheduledNotifications db={db} coachId={userId} isMobile={isMobile} />

      {/* ─── Recente meldingen — inklapbaar, standaard dicht ─── */}
      <button onClick={() => setRecentOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: 0, margin: '0 0 0.5rem 0.15rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        {recentOpen ? <ChevronDown size={13} color="rgba(255,255,255,0.4)" /> : <ChevronRight size={13} color="rgba(255,255,255,0.4)" />}
        <span style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          Recent
        </span>
        {recent.length > 0 && (
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{recent.length}</span>
        )}
      </button>
      {recentOpen && (
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        {recent.length === 0 ? (
          <div style={{ padding: '1.6rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Nog geen meldingen.</div>
        ) : recent.map((n, i) => (
          <div key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0.65rem 0.85rem', borderBottom: i === recent.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)', background: n.read_status ? 'transparent' : 'rgba(255,215,0,0.03)' }}>
            <Bell size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: n.read_status ? 600 : 800, color: n.read_status ? 'rgba(255,255,255,0.6)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
              {n.message && <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>}
            </div>
            <span style={{ flexShrink: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{timeAgo(n.created_at)}</span>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
