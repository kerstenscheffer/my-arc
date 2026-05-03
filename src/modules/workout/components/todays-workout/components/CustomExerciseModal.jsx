// src/modules/workout/components/todays-workout/components/CustomExerciseModal.jsx
import { X, Search, AlertCircle, CheckCircle, Camera, Image, BookmarkPlus, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ExerciseService from '../../../../../services/ExerciseService'

export default function CustomExerciseModal({ onClose, onSave, client, db, schema }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState('form') // 'form' | 'confirm'
  const [savedExercise, setSavedExercise] = useState(null)

  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('dumbbells')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('12')
  const [rust, setRust] = useState('60s')
  const [primairSpieren, setPrimairSpieren] = useState('chest')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [savingPermanent, setSavingPermanent] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  // custom_exercises.client_id → FK naar clients.id
  // Gebruik altijd client.id (de clients tabel UUID)
  const getAuthClientId = () => client?.id

  useEffect(() => {
    const run = async () => {
      if (name.length < 2) { setSuggestions([]); setShowSuggestions(false); setIsDuplicate(false); return }
      setLoading(true)
      try {
        const results = await ExerciseService.searchExercises(name, {
          limit: 5,
          clientId: getAuthClientId()
        })
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
        setIsDuplicate(!!results.find(ex => ex.name.toLowerCase() === name.toLowerCase()))
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    const t = setTimeout(run, 300)
    return () => clearTimeout(t)
  }, [name])

  const handleSuggestionClick = (s) => {
    setName(s.name); setEquipment(s.equipment || 'dumbbells')
    setPrimairSpieren(s.primair_spieren || 'chest'); setShowSuggestions(false)
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file); setPhotoPreview(URL.createObjectURL(file))
  }

  const uploadPhoto = async (authClientId, file) => {
    const ext = file.name.split('.').pop()
    const fileName = `${authClientId}/${Date.now()}.${ext}`
    const { error } = await db.supabase.storage.from('exercise-photos').upload(fileName, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = db.supabase.storage.from('exercise-photos').getPublicUrl(fileName)
    return publicUrl
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setUploading(true)
    try {
      const authClientId = getAuthClientId()
      let imageUrl = null
      if (photo && authClientId) imageUrl = await uploadPhoto(authClientId, photo)

      const exerciseData = {
        name: name.trim(), equipment,
        sets: parseInt(sets) || 3, reps, rust,
        primairSpieren, primair_spieren: primairSpieren,
        image_url: imageUrl, type: 'custom'
      }

      // RLS fix: gebruik auth_user_id als client_id voor de insert
      if (db?.saveCustomExercise && authClientId) {
        try {
          await db.saveCustomExercise(authClientId, {
            name: exerciseData.name,
            muscleGroup: primairSpieren,
            sets: exerciseData.sets,
            reps, rest: rust, notes: ''
          })
        } catch (saveErr) {
          // Niet fataal — oefening kan nog steeds toegevoegd worden aan workout
          console.warn('⚠️ saveCustomExercise failed (RLS?):', saveErr.message)
        }
      }

      setSavedExercise(exerciseData)
      setStep('confirm')
    } catch (error) {
      console.error('❌ Save failed:', error)
      alert('Opslaan mislukt. Probeer opnieuw.')
    } finally { setUploading(false) }
  }

  const handleOnlyToday = () => onSave(savedExercise)

  const handlePermanent = async () => {
    if (!selectedDay || !schema?.id || !db) return
    setSavingPermanent(true)
    try {
      const weekStructure = schema.week_structure || {}
      const day = weekStructure[selectedDay]
      if (!day) throw new Error('Dag niet gevonden')

      const updatedStructure = {
        ...weekStructure,
        [selectedDay]: {
          ...day,
          exercises: [...(day.exercises || []), {
            name: savedExercise.name, sets: savedExercise.sets,
            reps: savedExercise.reps, rust: savedExercise.rust,
            primairSpieren: savedExercise.primairSpieren,
            equipment: savedExercise.equipment,
            image_url: savedExercise.image_url, type: 'custom'
          }]
        }
      }

      const { error } = await db.supabase.from('workout_schemas')
        .update({ week_structure: updatedStructure, updated_at: new Date().toISOString() })
        .eq('id', schema.id)

      if (error) throw error
      if (navigator.vibrate) navigator.vibrate(50)
      onSave({ ...savedExercise, _addedToDay: selectedDay })
    } catch (error) {
      console.error('❌ Permanent save failed:', error)
      alert('Kon niet permanent opslaan. Probeer opnieuw.')
    } finally { setSavingPermanent(false) }
  }

  const handleClose = () => { setVisible(false); setTimeout(() => onClose(), 300) }

  const schemadays = schema?.week_structure
    ? Object.entries(schema.week_structure).map(([key, val]) => ({ key, name: val.name || key }))
    : []

  const inputStyle = {
    width: '100%', padding: '0.75rem 0.875rem',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#fff', fontSize: '0.9rem', fontWeight: '600', outline: 'none'
  }
  const labelStyle = {
    display: 'block', fontSize: '0.7rem', fontWeight: '700',
    color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: '0.5rem'
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '0' : '2rem',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease'
    }} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>

      <div style={{
        maxWidth: isMobile ? '100%' : '500px', width: '100%',
        height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '92vh',
        background: '#0a0a0a', border: isMobile ? 'none' : '1px solid rgba(255,215,0,0.15)',
        borderRadius: isMobile ? '0' : '20px', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)'
      }}>

        {/* HEADER */}
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            {step === 'form' ? 'Eigen Oefening' : 'Toevoegen aan plan'}
          </h2>
          <button onClick={handleClose} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── STAP 1: FORM ── */}
        {step === 'form' && (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '1rem' : '1.5rem', WebkitOverflowScrolling: 'touch' }}>

              {/* FOTO */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Foto (optioneel)</label>
                {photoPreview ? (
                  <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: '140px' }}>
                    <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => { setPhoto(null); setPhotoPreview(null) }} style={{ position: 'absolute', top: '8px', right: '8px', width: '30px', height: '30px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[{ icon: Camera, label: 'Camera', capture: 'environment' }, { icon: Image, label: 'Galerij', capture: null }].map(({ icon: Icon, label, capture }) => (
                      <label key={label} style={{ flex: 1, height: '72px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', cursor: 'pointer', touchAction: 'manipulation' }}>
                        <Icon size={20} color="rgba(255,215,0,0.5)" />
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{label}</span>
                        <input type="file" accept="image/*" {...(capture ? { capture } : {})} onChange={handlePhotoSelect} style={{ display: 'none' }} />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* NAAM */}
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <label style={labelStyle}>Oefening Naam</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="rgba(255,215,0,0.4)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Typ om te zoeken..."
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                    style={{ ...inputStyle, paddingLeft: '2.75rem', border: isDuplicate ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)' }} />
                  {loading && <div style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                </div>

                {isDuplicate && (
                  <div style={{ marginTop: '0.5rem', padding: '0.625rem 0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} color="#ef4444" />
                    <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '600' }}>Bestaat al in de database</span>
                  </div>
                )}

                {showSuggestions && suggestions.length > 0 && !isDuplicate && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, right: 0, background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: '220px', overflowY: 'auto' }}>
                    <div style={{ padding: '0.5rem 0.875rem', fontSize: '0.65rem', color: 'rgba(255,215,0,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>Suggesties</div>
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => handleSuggestionClick(s)} style={{ width: '100%', padding: '0.75rem 0.875rem', background: 'transparent', border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', color: '#fff', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,215,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {s._isCustom && <span style={{ fontSize: '0.58rem', background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: '800', textTransform: 'uppercase' }}>Eigen</span>}
                          {s.name}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{s.equipment} • {s.primair_spieren}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SPIERGROEP */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Spiergroep</label>
                <select value={primairSpieren} onChange={(e) => setPrimairSpieren(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {[['chest','Borst'],['back','Rug'],['shoulders','Schouders'],['biceps','Biceps'],['triceps','Triceps'],['legs','Benen'],['core','Core']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* EQUIPMENT */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Equipment</label>
                <select value={equipment} onChange={(e) => setEquipment(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {[['dumbbells','Dumbbells'],['barbell','Barbell'],['cables','Kabels'],['machine','Machine'],['bodyweight','Bodyweight']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* SETS / REPS / RUST */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
                {[{ label: 'Sets', val: sets, set: setSets }, { label: 'Reps', val: reps, set: setReps }, { label: 'Rust', val: rust, set: setRust }].map(({ label, val, set }) => (
                  <div key={label}>
                    <label style={labelStyle}>{label}</label>
                    <input type="text" value={val} onChange={(e) => set(e.target.value)} style={{ ...inputStyle, textAlign: 'center', padding: '0.75rem', borderRadius: '8px' }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={!name.trim() || isDuplicate || uploading} style={{
                width: '100%', padding: '0.875rem',
                background: (!name.trim() || isDuplicate || uploading) ? 'rgba(255,255,255,0.07)' : 'rgba(255,215,0,0.12)',
                border: (!name.trim() || isDuplicate || uploading) ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,215,0,0.3)',
                borderRadius: '12px', color: (!name.trim() || isDuplicate || uploading) ? 'rgba(255,255,255,0.35)' : '#FFD700',
                fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                cursor: (!name.trim() || isDuplicate || uploading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}>
                {uploading
                  ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Opslaan...</>
                  : <><CheckCircle size={18} strokeWidth={2.5} />Volgende</>}
              </button>
            </div>
          </>
        )}

        {/* ── STAP 2: CONFIRM ── */}
        {step === 'confirm' && savedExercise && (
          <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '1rem' : '1.5rem', WebkitOverflowScrolling: 'touch' }}>

            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <CheckCircle size={18} color="#10b981" strokeWidth={2.5} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981' }}>{savedExercise.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(16,185,129,0.7)', fontWeight: '600' }}>Opgeslagen in je oefeningen</div>
              </div>
            </div>

            {/* Alleen vandaag */}
            <button onClick={handleOnlyToday} style={{ width: '100%', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', textAlign: 'left' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={18} color="#FFD700" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', marginBottom: '0.15rem' }}>Alleen vandaag</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Toevoegen aan huidige workout</div>
              </div>
            </button>

            {/* Permanent */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', borderBottom: schemadays.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookmarkPlus size={18} color="#FFD700" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', marginBottom: '0.15rem' }}>Permanent in plan</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
                    {schemadays.length > 0 ? 'Kies een trainingsdag' : 'Geen schema beschikbaar'}
                  </div>
                </div>
              </div>

              {schemadays.length > 0 && (
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
                    {schemadays.map(({ key, name: dayName }) => (
                      <button key={key} onClick={() => setSelectedDay(key === selectedDay ? null : key)} style={{ padding: '0.625rem 0.875rem', background: selectedDay === key ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)', border: selectedDay === key ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: selectedDay === key ? '#FFD700' : 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: '700', textAlign: 'left', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{dayName}</span>
                        {selectedDay === key && <CheckCircle size={15} strokeWidth={2.5} />}
                      </button>
                    ))}
                  </div>
                  <button onClick={handlePermanent} disabled={!selectedDay || savingPermanent} style={{ width: '100%', padding: '0.75rem', background: (!selectedDay || savingPermanent) ? 'rgba(255,255,255,0.05)' : 'rgba(255,215,0,0.12)', border: (!selectedDay || savingPermanent) ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', color: (!selectedDay || savingPermanent) ? 'rgba(255,255,255,0.3)' : '#FFD700', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: (!selectedDay || savingPermanent) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    {savingPermanent
                      ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Opslaan...</>
                      : <><BookmarkPlus size={15} strokeWidth={2.5} />Zet permanent in plan</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  )
}
