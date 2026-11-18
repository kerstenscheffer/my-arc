// src/modules/manual-workout-builder/components/ConceptBrief.jsx
//
// De brief bij een automatisch gebouwd conceptplan (edge function
// workout-bouwer): wat er gekozen is en waarom, en wat de coach zelf moet
// nakijken. Het concept heeft nog geen client_id; pas bij Goedkeuren krijgt
// het die en wordt het het actieve plan van de klant.
import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, RefreshCw, AlertTriangle, FileText } from 'lucide-react'

const GROEN = '#10b981'
const ORANJE = '#f59e0b'

export default function ConceptBrief({ db, plan, client, nietOpgeslagen, onKlaar, isMobile }) {
  const opties = plan?.generation_options || {}
  const brief = opties.brief
  const isConcept = opties.status === 'concept'
  const [open, setOpen] = useState(isConcept)
  const [bezig, setBezig] = useState(null)
  if (!brief) return null

  const keurGoed = async () => {
    if (bezig || !client?.id) return
    if (nietOpgeslagen) { alert('Sla eerst je wijzigingen op.'); return }
    const voornaam = client.first_name || 'de klant'
    if (!window.confirm(`Dit plan actief maken voor ${voornaam}? ${voornaam} ziet het dan direct in de app.`)) return
    setBezig('goed')
    try {
      const { data, error } = await db.supabase.from('workout_schemas').update({
        client_id: client.id,
        name: String(plan.name || '').replace(/^Concept\s*·\s*/i, '') || plan.name,
        generation_options: { ...opties, status: 'goedgekeurd', goedgekeurd_op: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }).eq('id', plan.id).select('id')
      if (error) throw error
      if (!data?.length) throw new Error('niets bijgewerkt (geen rechten op dit plan?)')
      const r = await db.setActiveWorkoutPlan(client.id, plan.id)
      if (!r?.success) throw new Error(r?.error || 'Activeren mislukt')
      await onKlaar?.(plan.id)
    } catch (e) { alert('Goedkeuren mislukt: ' + (e?.message || e)) }
    finally { setBezig(null) }
  }

  const opnieuw = async () => {
    if (bezig || !client?.id) return
    if (!window.confirm('Concept opnieuw laten maken uit de intake? Wat je in dit concept hebt aangepast gaat verloren.')) return
    setBezig('nieuw')
    try {
      const { data, error } = await db.supabase.functions.invoke('workout-bouwer', { body: { client_id: client.id } })
      if (error || data?.error) throw new Error(data?.error || error?.message || 'mislukt')
      await onKlaar?.(data?.schema_id || plan.id)
    } catch (e) { alert('Opnieuw maken mislukt: ' + (e?.message || e)) }
    finally { setBezig(null) }
  }

  const knop = (kleur, vol) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 0.8rem', borderRadius: 8, cursor: bezig ? 'wait' : 'pointer',
    fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.02em',
    background: vol ? kleur : 'transparent', color: vol ? '#000' : '#fff', border: `1px solid ${vol ? kleur : 'rgba(255,255,255,0.18)'}`, opacity: bezig ? 0.6 : 1,
  })
  const regel = { fontSize: isMobile ? '0.78rem' : '0.74rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, margin: 0 }
  const kopje = (kleur) => ({ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: kleur, margin: '0.9rem 0 0.35rem' })
  const datum = brief.gemaakt ? new Date(brief.gemaakt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''

  return (
    <div style={{ margin: '0 0 0.75rem', background: '#0d0d0d', border: `1px solid ${isConcept ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 0.9rem', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <FileText size={15} color={isConcept ? GROEN : 'rgba(255,255,255,0.6)'} strokeWidth={2.4} />
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 900, color: '#fff' }}>
          {isConcept ? 'Concept uit de intake' : 'Brief bij dit plan'}
          <span style={{ marginLeft: 8, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{datum}</span>
        </span>
        {!!brief.nakijken?.length && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.66rem', fontWeight: 900, color: ORANJE }}>
            <AlertTriangle size={12} strokeWidth={2.6} /> {brief.nakijken.length} nakijken
          </span>
        )}
        {open ? <ChevronDown size={16} color="rgba(255,255,255,0.6)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.6)" />}
      </button>
      {open && (
        <div style={{ padding: '0 0.9rem 0.9rem' }}>
          <p style={{ ...regel, fontSize: isMobile ? '0.84rem' : '0.8rem', fontWeight: 800, color: '#fff' }}>{brief.samenvatting}</p>

          {!!brief.nakijken?.length && (<>
            <p style={kopje(ORANJE)}>Zelf nakijken</p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {brief.nakijken.map((t, i) => <li key={i} style={{ ...regel, marginBottom: 4 }}>{t}</li>)}
            </ul>
          </>)}

          {!!brief.keuzes?.length && (<>
            <p style={kopje('rgba(255,255,255,0.5)')}>Wat er gekozen is en waarom</p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {brief.keuzes.map((t, i) => <li key={i} style={{ ...regel, marginBottom: 4, color: 'rgba(255,255,255,0.7)' }}>{t}</li>)}
            </ul>
          </>)}

          {isConcept && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '0.9rem' }}>
              <button onClick={keurGoed} disabled={!!bezig} style={knop(GROEN, true)}>
                <Check size={14} strokeWidth={3} /> {bezig === 'goed' ? 'Bezig…' : 'Goedkeuren en actief maken'}
              </button>
              <button onClick={opnieuw} disabled={!!bezig} style={knop('#fff', false)}>
                <RefreshCw size={13} strokeWidth={2.6} /> {bezig === 'nieuw' ? 'Bezig…' : 'Opnieuw maken'}
              </button>
              <span style={{ alignSelf: 'center', fontSize: '0.66rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>De klant ziet dit pas na goedkeuren.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
