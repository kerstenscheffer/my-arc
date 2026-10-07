// src/modules/client-agenda/RealiteitBlad.jsx
//
// Tik op een blok in de stand Realiteit: wat zat erin? Een gelogde maaltijd
// toont de macro's en de ingrediënten als kaarten; een gelogde training de
// oefeningen met hun sets. Zelfde kaarten en zelfde ophaalwegen als het
// voedings- en trainingspaneel in het inzicht, zodat het één verhaal blijft.

import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import BladModal from '../workout/components/todays-workout/components/BladModal'
import MealCard from '../meal-plan/components/day-schedule/MealCard'
import { foodImageFallback } from '../meal-plan/foodImageFallback'
import { schrijfIngredientenUit, eenheidKort } from '../meal-plan/utils/ingredientenUitschrijven'
import useOefeningFotos from '../workout/utils/useOefeningFotos'

const tijd = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`

const SetDisplay = ({ s }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, whiteSpace: 'nowrap' }}>
    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums' }}>
      {s.weight || 0}<span style={{ fontSize: '0.56rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>kg</span>×{s.reps || 0}
    </span>
    {s.partials ? <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>+{s.partials}p</span> : null}
    {s.dropsets?.length > 0 ? s.dropsets.map((ds, di) => <span key={di} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>D{ds.weight}×{ds.reps}</span>) : null}
  </span>
)

const KAART = {
  margin: '0 0 0.45rem', background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden', position: 'relative',
}

function Macros({ meta }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      {[
        { label: 'kcal', waarde: Math.round(meta.kcal || 0) },
        { label: 'eiwit', waarde: `${Math.round(meta.protein || 0)}g` },
        { label: 'koolh', waarde: `${Math.round(meta.carbs || 0)}g` },
        { label: 'vet', waarde: `${Math.round(meta.fat || 0)}g` },
      ].map(x => (
        <div key={x.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.5rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{x.waarde}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{x.label}</div>
        </div>
      ))}
    </div>
  )
}

function MaaltijdInhoud({ blok, db, isMobile }) {
  const meta = blok.meta || {}
  const [ingredienten, setIngredienten] = useState(null)
  useEffect(() => {
    let weg = false
    schrijfIngredientenUit(db, meta.ingredients).then(uit => { if (!weg) setIngredienten(uit) })
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blok.id])
  return (
    <>
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
        {[meta.bronLabel, `gelogd om ${tijd(blok.start)}`].filter(Boolean).join(' · ')}
      </div>
      <Macros meta={meta} />
      {meta.notes && (
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.9rem', lineHeight: 1.4 }}>{meta.notes}</div>
      )}
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
        Ingrediënten
      </div>
      {ingredienten === null ? (
        <div style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div>
      ) : ingredienten.length === 0 ? (
        <div style={{ padding: '0.5rem 0 1rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 700 }}>
          {meta.amount > 0 ? `Los product: ${Math.round(meta.amount * 10) / 10}${eenheidKort(meta.per_unit)}.` : 'Van deze maaltijd zijn geen ingrediënten gelogd.'}
        </div>
      ) : (
        <div style={{ margin: '0 -1.25rem 1rem' }}>
          {ingredienten.map((ing, i) => (
            <MealCard
              key={`${ing.name}-${i}`}
              meal={{ name: ing.name, image_url: foodImageFallback(ing.name, null, 200), calories: ing.calories, protein: ing.protein, carbs: ing.carbs, fat: ing.fat }}
              momentLabel="" rechts={`${ing.amount}${eenheidKort(ing.unit)}`} isMobile={isMobile} acties={[]}
            />
          ))}
        </div>
      )}
    </>
  )
}

function TrainingInhoud({ blok, db, isMobile }) {
  const meta = blok.meta || {}
  const [oefeningen, setOefeningen] = useState(null)
  useEffect(() => {
    let weg = false
    if (!meta.sessionId || !db?.supabase) { setOefeningen([]); return }
    db.supabase.from('workout_progress')
      .select('exercise_name, sets, notes, created_at, attachment_used')
      .eq('session_id', meta.sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (!weg) setOefeningen(data || []) }, () => { if (!weg) setOefeningen([]) })
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blok.id])
  const fotoVan = useOefeningFotos(db, (oefeningen || []).map(o => o.exercise_name).filter(Boolean))
  const photoSize = isMobile ? 62 : 72
  return (
    <>
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
        {tijd(blok.start)}–{tijd(blok.end)} · {meta.estimated_time}{meta.exercise_count ? ` · ${meta.exercise_count} oefeningen` : ''}{meta.afgerond ? ' · afgerond' : ''}
      </div>
      {oefeningen === null ? (
        <div style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div>
      ) : oefeningen.length === 0 ? (
        <div style={{ padding: '0.5rem 0 1rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 700 }}>Geen oefeningen gelogd in deze sessie.</div>
      ) : oefeningen.map((ex, idx) => {
        const sets = Array.isArray(ex.sets) ? ex.sets : []
        const beste = sets.reduce((m, st) => Math.max(m, Number(st.weight) || 0), 0)
        return (
          <div key={idx} style={{ ...KAART, display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: photoSize, alignSelf: 'stretch', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${fotoVan(ex.exercise_name)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
              <div style={{ position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderRadius: 3, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <span style={{ fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{idx + 1}</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.4rem 0.65rem' : '0.45rem 0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.exercise_name}</span>
                <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{new Date(ex.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {sets.length > 0 && (
                <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', marginTop: 3, flexWrap: 'wrap' }}>
                  {sets.map((st, si) => <SetDisplay key={si} s={st} />)}
                </div>
              )}
              {ex.notes && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 5, paddingLeft: 7, borderLeft: '2px solid rgba(255,255,255,0.4)' }}>
                  <MessageSquare size={10} color="rgba(255,255,255,0.6)" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ex.notes}</span>
                </div>
              )}
            </div>
            {beste > 0 && (
              <div style={{ flexShrink: 0, alignSelf: 'center', padding: '0 0.8rem', fontSize: '0.9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {beste}<span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>kg</span>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

export default function RealiteitBlad({ blok, db, isMobile, onClose }) {
  const open = !!blok
  const titel = blok ? (blok.type === 'meal' ? blok.sublabel : blok.type === 'training' ? (blok.sublabel || 'Training') : blok.sublabel || blok.label) : ''
  return (
    <BladModal open={open} titel={titel} onClose={onClose} zIndex={10600}>
      {blok?.type === 'meal' && <MaaltijdInhoud blok={blok} db={db} isMobile={isMobile} />}
      {blok?.type === 'training' && <TrainingInhoud blok={blok} db={db} isMobile={isMobile} />}
      {blok && blok.type !== 'meal' && blok.type !== 'training' && (
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', paddingBottom: '0.5rem' }}>
          {blok.label} · {tijd(blok.start)}
        </div>
      )}
    </BladModal>
  )
}
