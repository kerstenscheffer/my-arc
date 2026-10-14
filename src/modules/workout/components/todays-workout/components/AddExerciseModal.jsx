// src/modules/workout/components/todays-workout/components/AddExerciseModal.jsx
//
// Oefening toevoegen aan de training van vandaag. Eén vraag: welke oefening?
// Zoeken en spiergroep bovenaan, de lijst met echte oefeningfoto's eronder,
// en een eigen oefening maken als laatste optie onderaan.
import { Plus } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import ExerciseService from '../../../../../services/ExerciseService'
import CustomExerciseModal from './CustomExerciseModal'
import Keuze from '../../../../meal-plan/components/Keuze'
import { laadOefeningMedia } from '../../../utils/oefeningFoto'
import { colors } from '../../../../../ui/tokens'
import {
  KiezerSchil, ZoekVeld, FilterBalk, FilterStreep, OefeningRij, LaadRijen,
  EigenOefeningKnop,
} from './OefeningKiezer'
import { spierLabel, materiaalLabel } from '../../../utils/oefeningLabels'

export default function AddExerciseModal({ onClose, onSave, client, db, schema }) {
  const isMobile = window.innerWidth <= 768
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [query, setQuery] = useState('')
  const [allExercises, setAllExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [spier, setSpier] = useState('all')
  const [materiaal, setMateriaal] = useState('all')

  useEffect(() => {
    let weg = false
    ;(async () => {
      setLoading(true)
      try {
        const [dbExercises, customResult, media] = await Promise.all([
          ExerciseService.getAllExercises(),
          client?.id
            ? db.supabase.from('custom_exercises').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
          laadOefeningMedia(db),
        ])
        const customExercises = (customResult?.data || []).map(c => ({
          id: c.id, name: c.name,
          primair_spieren: c.primair_spieren || c.muscle_group || null,
          equipment: c.equipment || null, type: 'custom',
          image_url: c.image_url || null, _isCustom: true,
        }))
        const seen = new Set(customExercises.map(c => c.name.toLowerCase()))
        const deduped = (dbExercises || [])
          .filter(ex => !seen.has(ex.name.toLowerCase()))
          .map(ex => ({ ...ex, ...(media.get(ex.name) || {}) }))
        if (!weg) setAllExercises([...customExercises, ...deduped])
      } catch (e) {
        console.error('❌ Oefeningen laden mislukt:', e)
      } finally {
        if (!weg) setLoading(false)
      }
    })()
    return () => { weg = true }
  }, [client?.id, db])

  const spieren = useMemo(() => [...new Set(allExercises.map(ex => ex.primair_spieren).filter(Boolean))].sort(), [allExercises])
  const materialen = useMemo(() => [...new Set(allExercises.filter(ex => !ex._isCustom).map(ex => ex.equipment).filter(Boolean))].sort(), [allExercises])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allExercises.filter(ex =>
      (spier === 'all' || ex.primair_spieren === spier) &&
      (materiaal === 'all' || ex.equipment === materiaal) &&
      (!q || ex.name.toLowerCase().includes(q))
    )
  }, [allExercises, spier, materiaal, query])

  const handleSelectExercise = (exercise) => {
    onSave({
      name: exercise.name,
      sets: exercise.sets || 3,
      reps: exercise.reps || '10',
      rust: exercise.rust || '90s',
      primairSpieren: exercise.primair_spieren || null,
      equipment: exercise.equipment || null,
      image_url: exercise.image_url || null,
      // Media van deze oefening mee, zodat kaart en log-scherm meteen de
      // juiste foto en video hebben.
      thumbnail_url: exercise.thumbnail_url || null,
      video_url: exercise.video_url || null,
      fallback_video_url: exercise.fallback_video_url || null,
      type: exercise.type || 'standard',
      _pendingPermanent: true, // signaal voor ExerciseCard
    })
  }

  if (showCustomModal) {
    return (
      <CustomExerciseModal
        onClose={() => setShowCustomModal(false)}
        onSave={(exercise) => { setShowCustomModal(false); onSave(exercise) }}
        client={client}
        db={db}
        schema={schema}
      />
    )
  }

  return (
    <KiezerSchil
      titel="Oefening toevoegen"
      onClose={onClose}
      isMobile={isMobile}
      kop={<>
        <ZoekVeld waarde={query} zet={setQuery} placeholder="Zoek een oefening" autoFocus={!isMobile} />
        <FilterBalk>
          <Keuze waarde={spier} zet={setSpier} isMobile={isMobile}
            opties={[{ id: 'all', label: 'Alle spieren' }, ...spieren.map(s => ({ id: s, label: spierLabel(s) }))]} />
          <FilterStreep />
          <Keuze waarde={materiaal} zet={setMateriaal} isMobile={isMobile} uitlijning="rechts"
            opties={[{ id: 'all', label: 'Alle materiaal' }, ...materialen.map(m => ({ id: m, label: materiaalLabel(m) }))]} />
        </FilterBalk>
      </>}
    >
      {loading ? <LaadRijen /> : results.length === 0 ? (
        <div style={{ padding: '32px 16px 0', textAlign: 'center', fontSize: 15, color: colors.textMuted }}>
          Niets gevonden. Probeer een andere zoekterm, of maak hem zelf aan.
        </div>
      ) : results.map((ex, i) => (
        <OefeningRij
          key={`${ex._isCustom ? 'c' : 'd'}-${ex.id || ex.name || i}`}
          ex={ex}
          onClick={() => handleSelectExercise(ex)}
          rechts={<Plus size={20} strokeWidth={2.6} color={colors.textMuted} style={{ flexShrink: 0 }} />}
        />
      ))}
      {!loading && (
        <EigenOefeningKnop onClick={() => setShowCustomModal(true)} icoon={<Plus size={18} strokeWidth={2.6} />} />
      )}
    </KiezerSchil>
  )
}
