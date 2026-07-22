// src/modules/videos/CoachVideoTab.jsx
// v3.0 — Netflix categorie rijen + nieuwe filters (custom categorie + page filter)
import React, { useState, useEffect } from 'react'
import { Video, Plus, FolderPlus, ChevronRight, ChevronDown, ChevronUp, GraduationCap, Send, Pencil, Trash2 } from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'
import videoService from './VideoService'
import CoachFileManager from './CoachFileManager'
import ManageAssignmentsModal from './ManageAssignmentsModal'
import CategoryManagerModal from './CategoryManagerModal'
import CourseManagerModal from './CourseManagerModal'

import VideoSearchFilters from './video-tab-components/VideoSearchFilters'
import VideoCard from './video-tab-components/VideoCard'
import VideoUploadModal from './video-tab-components/VideoUploadModal'
import VideoAssignModal from './video-tab-components/VideoAssignModal'
import VideoVisibilityModal from './video-tab-components/VideoVisibilityModal'
import VideoEditModal from './video-tab-components/VideoEditModal'

const GOLD = '#FFD700'

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
  const [coachId, setCoachId] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Cursussen (bundels van video's)
  const [courses, setCourses] = useState([])
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [showCourseAssign, setShowCourseAssign] = useState(false)
  const [assigningCourse, setAssigningCourse] = useState(null)

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
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
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

  // ── GROUP BY CATEGORY ──
  const grouped = {}
  const uncategorized = []

  filteredVideos.forEach(video => {
    const catId = video.category_id
    if (catId && customCategories.find(c => c.id === catId)) {
      if (!grouped[catId]) grouped[catId] = []
      grouped[catId].push(video)
    } else {
      uncategorized.push(video)
    }
  })

  // Order categories by order_index, only those with videos
  const orderedCategories = customCategories
    .filter(cat => grouped[cat.id] && grouped[cat.id].length > 0)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  const getCategoryConfig = (video) => {
    // Try custom category first
    const customCat = customCategories.find(c => c.id === video.category_id)
    if (customCat) {
      return { label: customCat.name, color: customCat.color || GOLD }
    }
    // Fallback to legacy tag
    return LEGACY_TAG_LOOKUP[video.category] || { label: video.category || 'Video', color: 'rgba(255,255,255,0.4)' }
  }

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

  const totalCount = filteredVideos.length
  const isFilteringActive = searchQuery || selectedCategoryId !== 'all' || selectedPage !== 'all'

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
          <div style={{
            fontSize: isMobile ? '0.4rem' : '0.45rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.2rem'
          }}>
            Coach Studio
          </div>
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
            <Video size={20} color={GOLD} />
            Video Library
            <span style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.3)',
              fontWeight: '700',
              marginLeft: '0.2rem'
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
              background: '#0a0a0a',
              border: `1px solid ${GOLD}`,
              borderRadius: '8px',
              color: GOLD,
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '40px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <FolderPlus size={13} />
            Categorieën
            {customCategories.length > 0 && (
              <span style={{
                padding: '0.1rem 0.35rem',
                background: GOLD,
                color: '#000',
                borderRadius: '8px',
                fontSize: '0.55rem',
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
              background: '#0a0a0a',
              border: `1px solid ${GOLD}`,
              borderRadius: '8px',
              color: GOLD,
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '40px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
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
              background: GOLD,
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '40px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <Plus size={14} />
            Nieuwe video
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <VideoSearchFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        customCategories={customCategories}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        selectedPage={selectedPage}
        setSelectedPage={setSelectedPage}
      />

      {/* Result count */}
      {!loading && (
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.4rem',
          marginBottom: '0.75rem',
          padding: '0 0.25rem'
        }}>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em'
          }}>
            {totalCount}
          </div>
          <div style={{
            fontSize: '0.6rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            {totalCount === 1 ? 'video' : "video's"}
            {isFilteringActive && ' gevonden'}
          </div>
          {isFilteringActive && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategoryId('all')
                setSelectedPage('all')
              }}
              style={{
                marginLeft: 'auto',
                padding: '0.25rem 0.5rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.55rem',
                fontWeight: '800',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* ── CURSUSSEN ── */}
      {courses.length > 0 && (
        <CourseRow
          courses={courses}
          videos={videos}
          onAssign={(c) => { setAssigningCourse(c); setShowCourseAssign(true) }}
          onEdit={(c) => { setEditingCourse(c); setShowCourseModal(true) }}
          onDelete={handleDeleteCourse}
          onVideoAssign={(v) => { setSelectedVideo(v); setShowVisibilityModal(true) }}
          onVideoManage={(v) => { setManagingVideo(v); setShowManageModal(true) }}
          onVideoEdit={(v) => { setEditingVideo(v); setShowEditModal(true) }}
          onVideoDelete={handleDeleteVideo}
          getCategoryConfig={getCategoryConfig}
          isMobile={isMobile}
        />
      )}

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '0.7rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          Videos laden...
        </div>
      ) : filteredVideos.length === 0 ? (
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
          {/* Custom categories with videos */}
          {orderedCategories.map(cat => (
            <CategoryRow
              key={cat.id}
              title={cat.name}
              color={cat.color || GOLD}
              videos={grouped[cat.id]}
              onAssign={(v) => { setSelectedVideo(v); setShowVisibilityModal(true) }}
              onManage={(v) => { setManagingVideo(v); setShowManageModal(true) }}
              onEdit={(v) => { setEditingVideo(v); setShowEditModal(true) }}
              onDelete={handleDeleteVideo}
              getCategoryConfig={getCategoryConfig}
              isMobile={isMobile}
            />
          ))}

          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <CategoryRow
              title="Zonder Categorie"
              color="rgba(255, 255, 255, 0.3)"
              videos={uncategorized}
              onAssign={(v) => { setSelectedVideo(v); setShowVisibilityModal(true) }}
              onManage={(v) => { setManagingVideo(v); setShowManageModal(true) }}
              onEdit={(v) => { setEditingVideo(v); setShowEditModal(true) }}
              onDelete={handleDeleteVideo}
              getCategoryConfig={getCategoryConfig}
              isMobile={isMobile}
              isUncategorized
            />
          )}
        </div>
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
            const result = await videoService.createVideo({
              ...videoData,
              coach_id: user.id
            })
            if (result.success) {
              await loadVideos()
              setShowUploadModal(false)
            }
          }}
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
    </div>
  )
}

// ============================================
// COURSE ROW — cursus-kaarten met toewijzen/bewerken/verwijderen
// ============================================
function CourseRow({ courses, videos, onAssign, onEdit, onDelete, onVideoAssign, onVideoManage, onVideoEdit, onVideoDelete, getCategoryConfig, isMobile }) {
  const [expandedId, setExpandedId] = useState(null)
  const thumbFor = (course) => {
    if (course.thumbnail_url) return course.thumbnail_url
    const first = videos.find(v => v.id === (course.videoIds || [])[0])
    return first ? videoService.getThumbnailUrl(first) : null
  }
  const expanded = expandedId ? courses.find(c => c.id === expandedId) : null
  const expandedVideos = expanded
    ? (expanded.videoIds || []).map(id => videos.find(v => v.id === id)).filter(Boolean)
    : []

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', padding: '0 0.25rem' }}>
        <GraduationCap size={15} color={GOLD} />
        <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cursussen</div>
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>· {courses.length}</div>
      </div>
      <div className="cvt-row" style={{ display: 'flex', gap: '0.625rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: '0.25rem' }}>
        {courses.map(course => {
          const thumb = thumbFor(course)
          const isOpen = expandedId === course.id
          return (
            <div key={course.id} style={{ flexShrink: 0, width: isMobile ? '220px' : '260px', background: '#0a0a0a', border: `1px solid ${isOpen ? GOLD : GOLD + '33'}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Klik op de kaart = video's uitklappen */}
              <div onClick={() => setExpandedId(isOpen ? null : course.id)} style={{ position: 'relative', height: isMobile ? 110 : 130, background: '#000', cursor: 'pointer' }}>
                {thumb && <img src={thumb} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} onError={e => { e.currentTarget.style.display = 'none' }} />}
                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.45rem', background: GOLD, borderRadius: 6, color: '#000', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <GraduationCap size={11} /> Cursus · {course.videoCount}
                </div>
                {/* Uitklap-indicator */}
                <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 3, padding: '0.2rem 0.4rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  {isOpen ? <><ChevronUp size={11} /> Sluit</> : <><ChevronDown size={11} /> Video's</>}
                </div>
              </div>
              <div style={{ padding: '0.6rem 0.7rem' }}>
                <div onClick={() => setExpandedId(isOpen ? null : course.id)} style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem', cursor: 'pointer' }}>{course.title}</div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => onAssign(course)} style={{ flex: 2, padding: '0.45rem', background: GOLD, border: 'none', borderRadius: 6, color: '#000', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textTransform: 'uppercase' }}><Send size={11} /> Toewijzen</button>
                  <button onClick={() => onEdit(course)} style={{ flex: 1, padding: '0.45rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={12} /></button>
                  <button onClick={() => onDelete(course)} style={{ flex: 1, padding: '0.45rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: 'rgba(239,68,68,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Uitgeklapte cursus → z'n video's eronder */}
      {expanded && (
        <div style={{ marginTop: '0.75rem', padding: isMobile ? '0.7rem' : '0.85rem', background: 'rgba(255,215,0,0.03)', border: `1px solid ${GOLD}22`, borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <GraduationCap size={13} color={GOLD} />
            <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.72rem' }}>Video's in "{expanded.title}"</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', fontWeight: 700 }}>· {expandedVideos.length}</span>
            <button onClick={() => setExpandedId(null)} style={{ marginLeft: 'auto', padding: '0.25rem 0.55rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}><ChevronUp size={11} /> Sluit</button>
          </div>
          {expandedVideos.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>Nog geen video's in deze cursus.</div>
          ) : (
            <div className="cvt-row" style={{ display: 'flex', gap: '0.625rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: '0.25rem' }}>
              {expandedVideos.map(v => (
                <div key={v.id} style={{ flexShrink: 0, width: isMobile ? '220px' : '260px' }}>
                  <VideoCard
                    video={v}
                    categoryConfig={getCategoryConfig(v)}
                    onAssign={() => onVideoAssign(v)}
                    onManage={() => onVideoManage(v)}
                    onEdit={() => onVideoEdit(v)}
                    onDelete={() => onVideoDelete(v)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`.cvt-row::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

// ============================================
// CATEGORY ROW — horizontal scroll van VideoCards
// ============================================
function CategoryRow({
  title,
  color,
  videos,
  onAssign,
  onManage,
  onEdit,
  onDelete,
  getCategoryConfig,
  isMobile,
  isUncategorized
}) {
  return (
    <div style={{
      marginBottom: '1.25rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.625rem',
        padding: '0 0.25rem'
      }}>
        <div style={{
          width: '3px',
          height: '14px',
          background: color,
          borderRadius: '2px',
          opacity: isUncategorized ? 0.5 : 1
        }} />
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.78rem',
          fontWeight: '800',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '0.6rem',
          color: 'rgba(255, 255, 255, 0.3)',
          fontWeight: '700'
        }}>
          · {videos.length}
        </div>
      </div>

      {/* Horizontal scroll */}
      <div
        className="cvt-row"
        style={{
          display: 'flex',
          gap: '0.625rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: '0.25rem'
        }}
      >
        {videos.map(video => (
          <div
            key={video.id}
            style={{
              flexShrink: 0,
              width: isMobile ? '220px' : '260px'
            }}
          >
            <VideoCard
              video={video}
              categoryConfig={getCategoryConfig(video)}
              onAssign={() => onAssign(video)}
              onManage={() => onManage(video)}
              onEdit={() => onEdit(video)}
              onDelete={() => onDelete(video)}
            />
          </div>
        ))}
      </div>

      <style>{`.cvt-row::-webkit-scrollbar { display: none; }`}</style>
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
