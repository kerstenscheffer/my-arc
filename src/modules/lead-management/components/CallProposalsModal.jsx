// src/modules/lead-management/components/CallProposalsModal.jsx
// Overzicht van alle verstuurde 'call voorgesteld'-berichten + of ze geslaagd
// waren (lead bereikte de Sales Call-fase na het voorstel). Toont de berichttekst
// met kopieer-knop zodat de coach de succesvolle voorstellen kan hergebruiken.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, PhoneCall, Check, Copy } from 'lucide-react'

export default function CallProposalsModal({ leadService, coachId, isMobile = false, onClose }) {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [onlyReached, setOnlyReached] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try { const r = await leadService.getCallProposalsReport(coachId); if (alive) setReport(r) }
      catch (e) { console.error('Call-voorstellen laden mislukt:', e); if (alive) setReport(null) }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [leadService, coachId])

  const fmt = (iso) => { try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' }) } catch { return '' } }
  const copy = (text, idx) => {
    navigator.clipboard.writeText(text || '').then(() => {
      setCopiedIdx(idx); setTimeout(() => setCopiedIdx(c => (c === idx ? null : c)), 1600)
    })
  }

  const items = report?.items || []
  const shown = onlyReached ? items.filter(i => i.reached) : items

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 580, maxHeight: isMobile ? '92vh' : '85vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(168,85,247,0.28)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.8rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
          <PhoneCall size={17} color="#a855f7" />
          <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>Call-voorstellen</div>
          <button onClick={onClose} title="Sluiten" style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>
          ) : (!report || report.total === 0) ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Nog geen call-voorstellen verstuurd. Zodra je een lead naar "Call voorgesteld" sleept en het bericht invult, verschijnen ze hier — met of ze een call boekten.
            </div>
          ) : (
            <>
              {/* Samenvatting */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
                {[
                  { label: 'Verstuurd', value: report.total, color: '#a855f7' },
                  { label: 'Geslaagd', value: report.reached, color: '#22c55e', hint: 'call geboekt' },
                  { label: 'Slaagkans', value: report.pct != null ? `${report.pct}%` : '—', color: '#FFD700' },
                ].map(c => (
                  <div key={c.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.7rem 0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{c.label}</div>
                    {c.hint && <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{c.hint}</div>}
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div style={{ display: 'flex', gap: 6, marginBottom: '0.85rem' }}>
                {[{ id: false, label: `Alle (${items.length})` }, { id: true, label: `Alleen geslaagd (${report.reached})` }].map(f => {
                  const active = onlyReached === f.id
                  return (
                    <button key={String(f.id)} onClick={() => setOnlyReached(f.id)}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: 9, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 800,
                        background: active ? (f.id ? 'rgba(34,197,94,0.14)' : 'rgba(168,85,247,0.14)') : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? (f.id ? 'rgba(34,197,94,0.5)' : 'rgba(168,85,247,0.5)') : 'rgba(255,255,255,0.1)'}`,
                        color: active ? (f.id ? '#22c55e' : '#a855f7') : 'rgba(255,255,255,0.55)' }}>{f.label}</button>
                  )
                })}
              </div>

              {/* Lijst */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {shown.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>Geen voorstellen in deze filter.</div>
                ) : shown.map((p, i) => (
                  <div key={i} style={{ padding: '0.75rem 0.8rem', borderRadius: 11, background: 'rgba(255,255,255,0.03)', border: `1px solid ${p.reached ? 'rgba(34,197,94,0.28)' : 'rgba(255,255,255,0.08)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: p.content ? '0.55rem' : 0 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Voorgesteld {fmt(p.proposedAt)} · nu: {p.currentSection}</div>
                      </div>
                      <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.28rem 0.55rem', borderRadius: 8, fontSize: '0.64rem', fontWeight: 800,
                        background: p.reached ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${p.reached ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        color: p.reached ? '#22c55e' : 'rgba(255,255,255,0.45)' }}>
                        {p.reached ? <><Check size={12} /> Geslaagd</> : 'Nog niet'}
                      </span>
                    </div>
                    {p.content && (
                      <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '0.6rem 0.7rem' }}>
                        <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{p.content}</div>
                        <button onClick={() => copy(p.content, i)}
                          title="Kopieer bericht"
                          style={{ position: 'absolute', top: 6, right: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.25rem 0.5rem', borderRadius: 7, cursor: 'pointer', fontSize: '0.6rem', fontWeight: 800,
                            background: copiedIdx === i ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${copiedIdx === i ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.12)'}`,
                            color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.6)' }}>
                          {copiedIdx === i ? <><Check size={11} /> Gekopieerd</> : <><Copy size={11} /> Kopieer</>}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '0.85rem', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                "Geslaagd" = de lead bereikte de Sales Call-fase (of verder) ná jouw voorstel. Kopieer de winnende berichten om ze vaker in te zetten.
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
