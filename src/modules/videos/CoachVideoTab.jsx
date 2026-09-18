// src/modules/videos/CoachVideoTab.jsx
// v3.0 — Netflix categorie rijen + nieuwe filters (custom categorie + page filter)
import React, { useState, useEffect } from 'react'
import { Video, Plus, FolderPlus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, GraduationCap, Search, X, MoreHorizontal, Send, Pencil, Trash2 } from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'
import videoService from './VideoService'
import CoachFileManager from './CoachFileManager'
import ManageAssignmentsModal from './ManageAssignmentsModal'
import CategoryManagerModal from './CategoryManagerModal'
import CourseManagerModal from './CourseManagerModal'

import VideoRow from './video-tab-components/VideoRow'
import VideoUploadModal from './video-tab-components/VideoUploadModal'
import VideoAssignModal from './video-tab-components/VideoAssignModal'
import VideoVisibilityModal from './video-tab-components/VideoVisibilityModal'
import CourseVisibilityModal from './video-tab-components/CourseVisibilityModal'
import VideoEditModal from './video-tab-components/VideoEditModal'

const GOLD = '#FFD700'

const PAGINAS = [
  { id: 'home',         label: 'Home' },
  { id: 'workout',      label: 'Workout' },
  { id: 'meal',         label: 'Meal' },
  { id: 'boodschappen', label: 'Boodschappen' },
  { id: 'tracking',     label: 'Tracking' },
  { id: 'calls',        label: 'Calls' },
  { id: 'profile',      label: 'Profiel' },
]

const selectStyle = (isMobile) => ({
  flex: isMobile ? '1 1 45%' : '0 0 auto',
  minHeight: 38,
  padding: '0 0.7rem',
  background: '#0a0a0a',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#fff',
  fontSize: '0.8rem',
  fontWeight: 700,
  cursor: 'pointer',
  outline: 'none',
})

// Legacy categories — alleen nog voor VideoCard categoryConfig fallback
const LEGACY_TAG_LOOKUP = {
  motivation: { label: 'Motivatie', color: '#ef4444' },
  technique:  { label: 'Techniek',  color: '#3b82f6' },
  nutrition:  { label: 'Voeding',   color: '#10b981' },
  mindset:    { label: 'Mindset',   color: '#8b5cf6' },
  recovery:   { label: 'Herstel',   color: '#06b6d4' },
  onboarding: { label: 'Onboarding', color: '#f59e0b' }
}

export default function CoachVideoTab({ clients = [], db }) {
  const [videos, setVideos] = useState([])
  const [assignCounts, setAssignCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [selectedPage, setSelectedPage] = useState('all')

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showVisibilityModal, setShowVisibilityModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [localClients, setLocalClients] = useState([])
  const [showManageModal, setShowManageModal] = useState(false)
  const [managingVideo, setManagingVideo] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState(null)

  // Custom categories
  const [customCategories, setCustomCategories] = useState([])
  const [sectie, setSectie] = useState(null)   // null = het overzicht
  const [coachId, setCoachId] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Cursussen (bundels van video's)
  const [courses, setCourses] = useState([])
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [showCourseAssign, setShowCourseAssign] = useState(false)
  const [assigningCourse, setAssigningCourse] = useState(null)
  const [showCourseVisibility, setShowCourseVisibility] = useState(false)
  const [visibilityCourse, setVisibilityCourse] = useState(null)

  const isMobile = useIsMobile()

  useEffect(() => {
    initData()
  }, [])

  const initData = async () => {
    try {
      const user = await db.getCurrentUser()
      setCoachId(user.id)
      await Promise.all([
        loadVideos(user.id),
        loadClients(),
        loadCategories(user.id),
        loadCourses(user.id)
      ])
    } catch (e) {
      console.error('Init failed:', e)
    }
  }

  const loadVideos = async (userId) => {
    setLoading(true)
    try {
      const uid = userId || coachId || (await db.getCurrentUser()).id
      const data = await videoService.getCoachVideos(uid)
      setVideos(data)
      await loadAssignCounts(data)
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Per video: aan hoeveel klanten is 'ie toegewezen? Dat is wat je op het
  // scherm wil zien — anders weet je van geen enkele video voor wie 'ie is.
  const loadAssignCounts = async (lijst) => {
    try {
      const ids = (lijst || []).map(v => v.id)
      if (!ids.length) { setAssignCounts({}); return }
      const { data, error } = await db.supabase
        .from('video_assignments').select('video_id, client_id').in('video_id', ids)
      if (error) return
      const perVideo = {}
      for (const rij of data || []) {
        (perVideo[rij.video_id] ||= new Set()).add(rij.client_id)
      }
      setAssignCounts(Object.fromEntries(
        Object.entries(perVideo).map(([id, set]) => [id, set.size])
      ))
    } catch (e) {
      console.error('Tellen van toewijzingen mislukt:', e)
    }
  }

  const loadClients = async () => {
    setClientsLoading(true)
    try {
      if (!clients || clients.length === 0) {
        const user = await db.getCurrentUser()
        const clientsData = await db.getClients(user.id)
        setLocalClients(clientsData || [])
      } else {
        setLocalClients(clients)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setClientsLoading(false)
    }
  }

  const loadCategories = async (userId) => {
    try {
      const uid = userId || coachId || (await db.getCurrentUser()).id
      const data = await videoService.getCategories(uid)
      setCustomCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadCourses = async (userId) => {
    try {
      const uid = userId || coachId || (await db.getCurrentUser()).id
      const data = await videoService.getCoachCourses(uid)
      setCourses(data)
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const handleDeleteCourse = async (course) => {
    if (!confirm(`Cursus "${course.title}" verwijderen? Bestaande toewijzingen van deze cursus worden ook verwijderd.`)) return
    const res = await videoService.deleteCourse(course.id)
    if (res.success) await loadCourses()
    else alert('Verwijderen mislukt: ' + (res.error || 'onbekende fout'))
  }

  // ── FILTER LOGIC ──
  const matchesSearch = (video) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      video.title?.toLowerCase().includes(q) ||
      video.description?.toLowerCase().includes(q)
    )
  }

  const matchesCategory = (video) => {
    if (selectedCategoryId === 'all') return true
    if (selectedCategoryId === 'uncategorized') return !video.category_id
    return video.category_id === selectedCategoryId
  }

  const matchesPage = (video) => {
    if (selectedPage === 'all') return true
    return Array.isArray(video.default_pages) && video.default_pages.includes(selectedPage)
  }

  // Video's die in een cursus zitten tonen we NIET los in het grid — ze zitten
  // onder hun cursus-kaart (uitklapbaar). Set van alle cursus-video-ids.
  const courseVideoIds = new Set(courses.flatMap(c => c.videoIds || []))

  const filteredVideos = videos.filter(v =>
    !courseVideoIds.has(v.id) && matchesSearch(v) && matchesCategory(v) && matchesPage(v)
  )

  const handleDeleteVideo = async (video) => {
    // "Standaard" = default_pages heeft pagina's (de echte bron van waarheid),
    // niet het dode is_default-veld.
    const isDefault = Array.isArray(video.default_pages) && video.default_pages.length > 0
    const confirmMessage = isDefault
      ? `Weet je zeker dat je "${video.title}" wilt verwijderen? Deze video is standaard zichtbaar voor alle clients!`
      : `Weet je zeker dat je "${video.title}" wilt verwijderen?`

    if (confirm(confirmMessage)) {
      const result = await videoService.deleteVideo(video.id)
      if (result.success) {
        await loadVideos()
      } else {
        alert('Er ging iets mis: ' + (result.error || 'Onbekende fout'))
      }
    }
  }

  const categorieNaamVan = (v) =>
    customCategories.find(c => c.id === v.category_id)?.name
    || LEGACY_TAG_LOOKUP[v.category]?.label
    || null

  // Eén lijst, gesorteerd op categorie en dan titel. Video's van dezelfde
  // categorie staan zo bij elkaar zonder dat er een kop tussen hoeft.
  const gesorteerdeVideos = [...filteredVideos].sort((a, b) =>
    (categorieNaamVan(a) || 'zzz').localeCompare(categorieNaamVan(b) || 'zzz')
    || (a.title || '').localeCompare(b.title || '')
  )

  const isFilteringActive = searchQuery || selectedCategoryId !== 'all' || selectedPage !== 'all'

  // Secties: één kaart per categorie, plus de cursussen en wat geen categorie
  // heeft. Zonder dit stond de hele bibliotheek uitgeklapt op één pagina —
  // achttien video's en alle cursussen onder elkaar.
  const persoonlijkeVideos = videos.filter(v => v.is_personal === true)
  const secties = [
    // Persoonlijk vooraan: dat is het spul waar een naam aan hangt, dus waar
    // je iets mee moet.
    ...(persoonlijkeVideos.length > 0
      ? [{ id: 'persoonlijk', label: 'Persoonlijk', aantal: persoonlijkeVideos.length,
           thumb: persoonlijkeVideos.map(v => videoService.getThumbnailUrl(v)).find(Boolean) }]
      : []),
    ...(courses.length > 0
      ? [{ id: 'cursussen', label: 'Cursussen', aantal: courses.length,
           thumb: courses.map(c => c.thumbnail_url || videoService.getThumbnailUrl(videos.find(v => v.id === (c.videoIds || [])[0]) || {})).find(Boolean) }]
      : []),
    ...customCategories.map(c => {
      const erin = videos.filter(v => v.category_id === c.id && v.is_personal !== true)
      return {
        id: c.id, label: c.name, aantal: erin.length,
        thumb: erin.map(v => videoService.getThumbnailUrl(v)).find(Boolean),
      }
    }),
    ...(() => {
      const zonder = videos.filter(v => !v.category_id && v.is_personal !== true)
      return zonder.length > 0
        ? [{ id: 'uncategorized', label: 'Zonder categorie', aantal: zonder.length,
             thumb: zonder.map(v => videoService.getThumbnailUrl(v)).find(Boolean) }]
        : []
    })(),
  ]

  const sectieLabel = secties.find(x => x.id === sectie)?.label
  const videosVanSectie = sectie === 'persoonlijk'
    ? gesorteerdeVideos.filter(v => v.is_personal === true)
    : sectie === 'uncategorized'
      ? gesorteerdeVideos.filter(v => !v.category_id && v.is_personal !== true)
      : (sectie && sectie !== 'cursussen')
        ? gesorteerdeVideos.filter(v => v.category_id === sectie && v.is_personal !== true)
        : gesorteerdeVideos
  // Zoeken gaat door alles heen; zonder zoekterm blijf je in je sectie.
  const toonOverzicht = !sectie && !isFilteringActive

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      background: '#0a0a0a',
      minHeight: '100vh'
    }}>
      {/* ── HEADER ── */}
      <div style={{
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '0.75rem',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.2rem' : '1.4rem',
            fontWeight: '800',
            color: '#fff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            <Video size={19} />
            Video's
            <span style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.4)',
              fontWeight: '700'
            }}>
              {videos.length}
            </span>
          </h2>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          flexDirection: isMobile ? 'row' : 'row'
        }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              flex: isMobile ? 1 : '0 0 auto',
              padding: '0.55rem 0.875rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.74rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '40px'
            }}
          >
            <FolderPlus size={13} />
            Categorieën
            {customCategories.length > 0 && (
              <span style={{
                padding: '0.1rem 0.35rem',
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: '800'
              }}>
                {customCategories.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setEditingCourse(null); setShowCourseModal(true) }}
            style={{
              flex: isMobile ? 1 : '0 0 auto',
              padding: '0.55rem 0.875rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.74rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '40px'
            }}
          >
            <GraduationCap size={14} />
            Cursus
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              flex: isMobile ? 1 : '0 0 auto',
              padding: '0.55rem 1rem',
              background: '#fff',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '0.74rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '40px'
            }}
          >
            <Plus size={14} />
            Nieuwe video
          </button>
        </div>
      </div>

      {/* ── ZOEKEN + FILTERS — twee dropdowns, geen rijen chips ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
        alignItems: 'center', marginBottom: '0.9rem',
      }}>
        <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1 1 280px', minWidth: 0 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op titel"
            style={{
              width: '100%', minHeight: 38, padding: '0 0.7rem 0 2.1rem',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, color: '#fff', fontSize: '0.82rem', fontWeight: 600,
              outline: 'none',
            }}
          />
        </div>

        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          style={selectStyle(isMobile)}
        >
          <option value="all">Alle categorieën</option>
          {customCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          <option value="uncategorized">Zonder categorie</option>
        </select>

        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          title="Video's die standaard op een pagina staan"
          style={selectStyle(isMobile)}
        >
          <option value="all">Alle pagina's</option>
          {PAGINAS.map(pg => (
            <option key={pg.id} value={pg.id}>{pg.label}</option>
          ))}
        </select>

        {isFilteringActive && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategoryId('all'); setSelectedPage('all') }}
            style={{
              minHeight: 38, padding: '0 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
              color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <X size={14} /> Wis
          </button>
        )}
      </div>

      {/* ── INHOUD ── */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700 }}>
          Video's laden...
        </div>
      ) : toonOverzicht ? (
        /* Overzicht: één kaart per sectie. Klik je er een aan, dan staat die
           inhoud eronder — in plaats van alles tegelijk op één pagina. */
        secties.length === 0 ? (
          <EmptyState
            isFiltering={false}
            onUpload={() => setShowUploadModal(true)}
            onResetFilters={() => {}}
            isMobile={isMobile}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: isMobile ? '0.6rem' : '0.75rem',
          }}>
            {secties.map(sec => (
              <button
                key={sec.id}
                onClick={() => setSectie(sec.id)}
                style={{
                  position: 'relative', overflow: 'hidden',
                  aspectRatio: '16 / 10', padding: 0,
                  borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)',
                  background: '#141414', cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {sec.thumb && (
                  <span style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${sec.thumb})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.85,
                  }} />
                )}
                <span style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.92) 100%)',
                }} />
                <span style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  padding: isMobile ? '0.65rem 0.7rem' : '0.8rem 0.85rem',
                  display: 'flex', alignItems: 'flex-end', gap: 6, textAlign: 'left',
                }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block',
                      fontSize: isMobile ? '0.88rem' : '0.98rem', fontWeight: 900, color: '#fff',
                      letterSpacing: '-0.02em', lineHeight: 1.2,
                      textShadow: '0 2px 10px rgba(0,0,0,0.85)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {sec.label}
                    </span>
                    <span style={{
                      display: 'block', marginTop: 2,
                      fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                    }}>
                      {sec.id === 'cursussen'
                        ? `${sec.aantal} cursus${sec.aantal === 1 ? '' : 'sen'}`
                        : `${sec.aantal} video${sec.aantal === 1 ? '' : "'s"}`}
                    </span>
                  </span>
                  <ChevronRight size={16} color="#fff" strokeWidth={3} style={{ flexShrink: 0, marginBottom: 2 }} />
                </span>
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          {/* Terug naar de secties */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
            <button
              onClick={() => { setSectie(null); setSearchQuery(''); setSelectedCategoryId('all'); setSelectedPage('all') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                minHeight: 34, padding: '0 0.7rem 0 0.5rem',
                background: 'transparent', border: 'none',
                color: '#fff', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <ChevronLeft size={16} strokeWidth={3} />
              {sectieLabel || 'Alle video\'s'}
            </button>
          </div>

          {sectie === 'cursussen' && courses.length > 0 && (
            <CourseList
              courses={courses}
              videos={videos}
              assignCounts={assignCounts}
              categorieNaamVan={categorieNaamVan}
              onAssign={(c) => { setAssigningCourse(c); setShowCourseAssign(true) }}
              onVisibility={(c) => { setVisibilityCourse(c); setShowCourseVisibility(true) }}
              onEdit={(c) => { setEditingCourse(c); setShowCourseModal(true) }}
              onDelete={handleDeleteCourse}
              onVideoAssign={(v) => { setSelectedVideo(v); setShowVisibilityModal(true) }}
              onVideoManage={(v) => { setManagingVideo(v); setShowManageModal(true) }}
              onVideoEdit={(v) => { setEditingVideo(v); setShowEditModal(true) }}
              onVideoDelete={handleDeleteVideo}
              isMobile={isMobile}
            />
          )}

          {sectie !== 'cursussen' && (
            videosVanSectie.length === 0 ? (
              <EmptyState
                isFiltering={isFilteringActive}
                onUpload={() => setShowUploadModal(true)}
                onResetFilters={() => {
                  setSearchQuery('')
                  setSelectedCategoryId('all')
                  setSelectedPage('all')
                }}
                isMobile={isMobile}
              />
            ) : (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0 0.5rem 0.4rem',
                  fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
                }}>
                  {videosVanSectie.length} van {videos.length} video's
                </div>
                {/* Raster in plaats van regels over de volle breedte. Op een
                    telefoon blijft het één regel per video. */}
                <div style={isMobile
                  ? { borderTop: '1px solid rgba(255,255,255,0.06)' }
                  : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}
                >
                  {videosVanSectie.map(v => (
                    <VideoRow
                      key={v.id}
                      video={v}
                      categorieNaam={categorieNaamVan(v)}
                      aantalKlanten={assignCounts[v.id] || 0}
                      onAssign={() => { setSelectedVideo(v); setShowVisibilityModal(true) }}
                      onManage={() => { setManagingVideo(v); setShowManageModal(true) }}
                      onEdit={() => { setEditingVideo(v); setShowEditModal(true) }}
                      onDelete={() => handleDeleteVideo(v)}
                      isMobile={isMobile}
                      vorm={isMobile ? 'regel' : 'kaart'}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* ── PDF / Bestanden manager — onderaan (video's hebben prioriteit). */}
      {coachId && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <CoachFileManager coachId={coachId} />
        </div>
      )}

      {/* ── MODALS ── */}
      {showUploadModal && (
        <VideoUploadModal
          onClose={() => setShowUploadModal(false)}
          onSave={async (videoData) => {
            const user = await db.getCurrentUser()
            // _audience/_clientIds/_assignPage zijn UI-only velden; createVideo
            // negeert onbekende velden, maar we halen ze er netjes uit.
            const { _audience, _clientIds = [], _assignPage = 'home', ...videoFields } = videoData
            const result = await videoService.createVideo({
              ...videoFields,
              coach_id: user.id
            })
            if (result.success) {
              // Specifieke klant(en) → direct toewijzen aan de nieuwe video.
              if (_audience === 'specific' && _clientIds.length > 0 && result.data?.id) {
                const assignRes = await videoService.assignVideo(result.data.id, _clientIds, {
                  type: 'manual',
                  pageContext: _assignPage,
                })
                if (!assignRes.success) {
                  alert(`Video aangemaakt, maar toewijzen mislukte: ${assignRes.error}`)
                }
              }
              await loadVideos()
              setShowUploadModal(false)
            }
          }}
          clients={localClients}
          customCategories={customCategories}
          db={db}
        />
      )}

      {showAssignModal && selectedVideo && (
        <VideoAssignModal
          video={selectedVideo}
          clients={localClients}
          clientsLoading={clientsLoading}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedVideo(null)
          }}
          onAssign={async (clientIds, assignmentData) => {
            const result = await videoService.assignVideo(
              selectedVideo.id,
              clientIds,
              assignmentData
            )
            if (result.success) {
              alert(`Video toegewezen aan ${clientIds.length} client(s)!`)
              setShowAssignModal(false)
              setSelectedVideo(null)
            }
          }}
        />
      )}

      {/* Zichtbaarheid-modal — primaire kaart-knop. Stelt standaard-pagina's +
          home-slider in voor ALLE clients (via updateVideo), i.p.v. losse
          per-client toewijzingen. */}
      {showVisibilityModal && selectedVideo && (
        <VideoVisibilityModal
          video={selectedVideo}
          clients={localClients}
          onClose={() => { setShowVisibilityModal(false); setSelectedVideo(null) }}
          onSaved={() => { loadVideos() }}
        />
      )}

      {showManageModal && managingVideo && (
        <ManageAssignmentsModal
          video={managingVideo}
          onClose={() => {
            setShowManageModal(false)
            setManagingVideo(null)
          }}
          onUpdate={() => loadVideos()}
        />
      )}

      {showEditModal && editingVideo && (
        <VideoEditModal
          video={editingVideo}
          onClose={() => {
            setShowEditModal(false)
            setEditingVideo(null)
          }}
          onSave={() => loadVideos()}
          customCategories={customCategories}
          db={db}
        />
      )}

      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        coachId={coachId}
        onChange={() => loadCategories()}
      />

      {/* ── CURSUS aanmaken/bewerken ── */}
      {showCourseModal && (
        <CourseManagerModal
          course={editingCourse}
          videos={videos}
          onClose={() => { setShowCourseModal(false); setEditingCourse(null) }}
          onSaved={() => loadCourses()}
        />
      )}

      {/* ── CURSUS toewijzen — hergebruikt VideoAssignModal ── */}
      {showCourseAssign && assigningCourse && (
        <VideoAssignModal
          video={{ title: `Cursus: ${assigningCourse.title}` }}
          clients={localClients}
          clientsLoading={clientsLoading}
          onClose={() => { setShowCourseAssign(false); setAssigningCourse(null) }}
          onAssign={async (clientIds, assignmentData) => {
            const result = await videoService.assignCourse(assigningCourse.id, clientIds, assignmentData)
            if (result.success) {
              alert(`Cursus toegewezen aan ${clientIds.length} client(s)!`)
              setShowCourseAssign(false)
              setAssigningCourse(null)
            } else {
              alert('Toewijzen mislukt: ' + (result.error || 'onbekende fout'))
            }
          }}
        />
      )}

      {/* ── CURSUS zichtbaarheid (standaard voor iedereen: pagina's + slider) ── */}
      {showCourseVisibility && visibilityCourse && (
        <CourseVisibilityModal
          course={visibilityCourse}
          onClose={() => { setShowCourseVisibility(false); setVisibilityCourse(null) }}
          onSaved={() => loadCourses()}
        />
      )}
    </div>
  )
}

// ============================================
// CURSUSSEN — compacte regels, klik klapt de video's eruit
// ============================================
function CourseList({
  courses, videos, assignCounts, categorieNaamVan,
  onAssign, onVisibility, onEdit, onDelete,
  onVideoAssign, onVideoManage, onVideoEdit, onVideoDelete, isMobile,
}) {
  // Dicht bij binnenkomst. In de cursus-sectie staan de cursussen onder
  // elkaar; ze allemaal opengeklapt tonen maakte er weer één lange lap van.
  const [open_, setOpen_] = useState(() => new Set())
  const [menuId, setMenuId] = useState(null)
  const wisselOpen = (id) => setOpen_(prev => {
    const kopie = new Set(prev)
    if (kopie.has(id)) kopie.delete(id); else kopie.add(id)
    return kopie
  })

  const thumbFor = (course) => {
    if (course.thumbnail_url) return course.thumbnail_url
    const eerste = videos.find(v => v.id === (course.videoIds || [])[0])
    return eerste ? videoService.getThumbnailUrl(eerste) : null
  }

  const menuItem = {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    width: '100%', padding: '0.6rem 0.8rem',
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', fontWeight: 700,
    cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0 0.5rem 0.4rem',
        fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
      }}>
        <GraduationCap size={14} />
        {courses.length === 1 ? '1 cursus' : `${courses.length} cursussen`}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {courses.map(course => {
          const open = open_.has(course.id)
          const thumb = thumbFor(course)
          const cursusVideos = open
            ? (course.videoIds || []).map(id => videos.find(v => v.id === id)).filter(Boolean)
            : []

          return (
            <div key={course.id}>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: isMobile ? '0.6rem' : '0.85rem',
                padding: isMobile ? '0.55rem 0.25rem' : '0.6rem 0.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div
                  onClick={() => wisselOpen(course.id)}
                  style={{
                    position: 'relative', flexShrink: 0,
                    width: isMobile ? 76 : 96, aspectRatio: '16 / 9',
                    borderRadius: 6, overflow: 'hidden', background: '#000', cursor: 'pointer',
                  }}
                >
                  {thumb && (
                    <img
                      src={thumb} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                </div>

                <div
                  onClick={() => wisselOpen(course.id)}
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <div style={{
                    fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 800, color: '#fff',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {course.title}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem',
                    fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                  }}>
                    Cursus · {course.videoCount} video's
                    {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </div>
                </div>

                <button
                  onClick={() => onVisibility(course)}
                  style={{
                    flexShrink: 0, minHeight: 34, padding: isMobile ? '0 0.7rem' : '0 0.9rem',
                    background: '#fff', border: 'none', borderRadius: 8,
                    color: '#000', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  Delen
                </button>

                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={() => setMenuId(menuId === course.id ? null : course.id)}
                    title="Meer"
                    style={{
                      width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuId === course.id && (
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 30,
                      minWidth: 200, padding: '0.25rem 0',
                      background: 'rgba(10,10,10,0.96)',
                      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                      boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
                    }}>
                      <button style={menuItem} onClick={() => { setMenuId(null); onAssign(course) }}>
                        <Send size={14} /> Aan klanten toewijzen
                      </button>
                      <button style={menuItem} onClick={() => { setMenuId(null); onEdit(course) }}>
                        <Pencil size={14} /> Bewerken
                      </button>
                      <button
                        style={{ ...menuItem, color: '#ef4444' }}
                        onClick={() => { setMenuId(null); onDelete(course) }}
                      >
                        <Trash2 size={14} /> Verwijderen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {open && (
                cursusVideos.length === 0 ? (
                  <div style={{
                    padding: '0.9rem 1.75rem', fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    Nog geen video's in deze cursus.
                  </div>
                ) : (
                  cursusVideos.map(v => (
                    <VideoRow
                      key={v.id}
                      video={v}
                      categorieNaam={categorieNaamVan(v)}
                      aantalKlanten={assignCounts[v.id] || 0}
                      onAssign={() => onVideoAssign(v)}
                      onManage={() => onVideoManage(v)}
                      onEdit={() => onVideoEdit(v)}
                      onDelete={() => onVideoDelete(v)}
                      isMobile={isMobile}
                      ingesprongen
                    />
                  ))
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ isFiltering, onUpload, onResetFilters, isMobile }) {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '8px',
      padding: isMobile ? '2rem 1rem' : '3rem',
      textAlign: 'center'
    }}>
      <Video size={36} style={{ color: 'rgba(255, 255, 255, 0.1)', margin: '0 auto 1rem' }} />
      <div style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        fontWeight: '800',
        color: '#fff',
        marginBottom: '0.4rem',
        letterSpacing: '-0.01em'
      }}>
        {isFiltering ? 'Geen video\'s gevonden' : 'Nog geen video\'s'}
      </div>
      <div style={{
        fontSize: '0.7rem',
        color: 'rgba(255, 255, 255, 0.3)',
        marginBottom: '1.25rem'
      }}>
        {isFiltering
          ? 'Probeer andere filters of reset alles.'
          : 'Upload je eerste video om te beginnen.'}
      </div>
      {isFiltering ? (
        <button
          onClick={onResetFilters}
          style={{
            padding: '0.55rem 1rem',
            background: GOLD,
            border: 'none',
            borderRadius: '6px',
            color: '#000',
            fontSize: '0.7rem',
            fontWeight: '800',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '38px'
          }}
        >
          Reset filters
        </button>
      ) : (
        <button
          onClick={onUpload}
          style={{
            padding: '0.55rem 1rem',
            background: GOLD,
            border: 'none',
            borderRadius: '6px',
            color: '#000',
            fontSize: '0.7rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '38px'
          }}
        >
          <Plus size={13} />
          Upload eerste video
        </button>
      )}
    </div>
  )
}
