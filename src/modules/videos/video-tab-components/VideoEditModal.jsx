// src/modules/videos/video-tab-components/VideoEditModal.jsx
// v2.0 — Volledige editor (titel, beschrijving, URL, categorie, thumbnail, default_pages)
// Brand styling, createPortal, correcte page_context keys
import React, { useState, useEffect } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { useModalHost } from '../../../coach/ModalHost'
import {
  Edit, X, ChevronDown, Globe, Camera, Image as ImageIcon, Check, Youtube,
  Home, Dumbbell, Utensils, ShoppingCart, Camera as TrackingIcon, Phone, User
} from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'
import videoService from '../VideoService'

// Wit, zoals de rest van de app. Het goud kwam uit de tijd dat elk blok zijn
// eigen kleur had; in een formulier vol zwarte velden is een witte knop het
// duidelijkst.
const WIT = '#fff'

// ── Page keys matchen ClientDashboard ──
const PAGE_OPTIONS = [
  { value: 'home',         label: 'Home',         icon: Home },
  { value: 'workout',      label: 'Workout',      icon: Dumbbell },
  { value: 'meal',         label: 'Meal',         icon: Utensils },
  { value: 'boodschappen', label: 'Boodschappen', icon: ShoppingCart },
  { value: 'tracking',     label: 'Tracking',     icon: TrackingIcon },
  { value: 'calls',        label: 'Calls',        icon: Phone },
  { value: 'profile',      label: 'Profile',      icon: User }
]

// Eén rij: links het onderwerp, rechts wat er nu staat. Met `id` klapt hij open
// (één tegelijk); met `rechts` staat de bediening in de rij zelf. Buiten het
// venster gedefinieerd: binnenin zou elke toetsaanslag het veld opnieuw
// opbouwen en ben je je cursor kwijt.
function Rij({ id, label, waarde, rechts, titel, children, open, setOpen, zij }) {
  const isOpen = !!id && open === id
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div onClick={id ? () => setOpen(isOpen ? null : id) : undefined} title={titel} role={id ? 'button' : undefined} aria-expanded={id ? isOpen : undefined}
        style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: `0 ${zij}`, cursor: id ? 'pointer' : 'default' }}>
        <span style={{ flexShrink: 0, fontSize: '0.84rem', fontWeight: 800, color: '#fff' }}>{label}</span>
        <span style={{ flex: 1, minWidth: 0, textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isOpen ? '' : waarde}
        </span>
        {rechts || (id && <ChevronDown size={15} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />)}
      </div>
      {isOpen && <div style={{ padding: `0 ${zij} 0.8rem` }}>{children}</div>}
    </div>
  )
}

function Schakel({ aan, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={!!aan} style={{ width: 40, height: 22, flexShrink: 0, padding: 0, border: 'none', borderRadius: 11, position: 'relative', cursor: 'pointer', background: aan ? '#fff' : 'rgba(255,255,255,0.12)', transition: 'background 0.2s ease' }}>
      <span style={{ position: 'absolute', top: 2, left: aan ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: aan ? '#0a0a0a' : '#fff', transition: 'left 0.2s ease' }} />
    </button>
  )
}

export default function VideoEditModal({ 
  video, 
  onClose, 
  onSave,
  customCategories = [],
  clients = [],
  db
}) {
  const modalHost = useModalHost()
  const [formData, setFormData] = useState({
    title: video.title || '',
    description: video.description || '',
    video_url: video.video_url || '',
    category_id: video.category_id || null,
    is_personal: video.is_personal === true,
    default_pages: video.default_pages || [],
    show_in_slider: video.show_in_slider || false,
    is_belangrijk: video.is_belangrijk === true
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(video.thumbnail_url || null)
  const [thumbnailChanged, setThumbnailChanged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('video')
  const [open, setOpen] = useState(null) // welke rij is uitgeklapt
  // Voor wie: alleen de gekozen klanten, of alle klanten. Eén keuze bovenaan,
  // zodat "voor iedereen" nooit per ongeluk aan kan staan naast een klant
  // (13 nov 2026, Kersten).
  const [bereik, setBereik] = useState((video.default_pages || []).length > 0 || video.show_in_slider ? 'iedereen' : 'klanten')

  // Toewijzingen aan klanten: staan in video_assignments, los van de video zelf.
  const [toewijzingen, setToewijzingen] = useState(null) // null = laden
  const [klantZoek, setKlantZoek] = useState('')
  const [nieuwePagina, setNieuwePagina] = useState('workout')
  const [bezigKlant, setBezigKlant] = useState(null)
  const [klantFout, setKlantFout] = useState(null)
  const klantNaam = (c) => `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || c?.email || 'Klant'
  const laadToewijzingen = async () => setToewijzingen(await videoService.getVideoAssignments(video.id))
  useEffect(() => { laadToewijzingen() }, [video.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const naKlantWijziging = async (res) => {
    setBezigKlant(null)
    if (res && res.success === false) { setKlantFout(res.error || 'Wijzigen mislukt'); return }
    setKlantFout(null)
    await laadToewijzingen()
    if (onSave) onSave() // de lijst erachter telt de klanten opnieuw
  }
  const wijzigPagina = async (t, pagina) => { setBezigKlant(t.id); naKlantWijziging(await videoService.updateAssignment(t.id, { page_context: pagina })) }
  const haalKlantWeg = async (t) => { setBezigKlant(t.id); naKlantWijziging(await videoService.unassignVideo(video.id, [t.client_id])) }
  const voegKlantToe = async (c) => {
    setBezigKlant(c.id); setKlantZoek('')
    naKlantWijziging(await videoService.assignVideo(video.id, [c.id], { pageContext: nieuwePagina }))
  }
  const alToegewezen = new Set((toewijzingen || []).map(t => t.client_id))
  const teKiezen = (clients || [])
    .filter(c => !alToegewezen.has(c.id) && klantNaam(c).toLowerCase().includes(klantZoek.trim().toLowerCase()))
    .slice(0, 6)

  const isMobile = useIsMobile()

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])

  const togglePage = (pageValue) => {
    if (formData.default_pages.includes(pageValue)) {
      setFormData({
        ...formData,
        default_pages: formData.default_pages.filter(p => p !== pageValue)
      })
    } else {
      setFormData({
        ...formData,
        default_pages: [...formData.default_pages, pageValue]
      })
    }
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailChanged(true)
      const reader = new FileReader()
      reader.onload = (e) => setThumbnailPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const removeThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setThumbnailChanged(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.video_url.trim()) {
      alert('Titel en URL zijn verplicht')
      return
    }

    setSaving(true)
    try {
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        video_url: formData.video_url.trim(),
        category_id: formData.category_id || null,
        is_personal: formData.is_personal === true,
        // Alleen gekozen klanten: nergens standaard voor iedereen.
        default_pages: bereik === 'iedereen' ? formData.default_pages : [],
        show_in_slider: bereik === 'iedereen' ? formData.show_in_slider : false,
        is_belangrijk: formData.is_belangrijk === true
      }

      // Handle thumbnail upload if changed
      if (thumbnailChanged) {
        if (thumbnailFile) {
          const user = await db?.getCurrentUser?.()
          const coachId = user?.id || video.coach_id
          const uploadResult = await videoService.uploadThumbnail(thumbnailFile, coachId)
          if (uploadResult.success) {
            updates.thumbnail_url = uploadResult.thumbnailUrl
          } else {
            alert('Thumbnail upload mislukt: ' + uploadResult.error)
            setSaving(false)
            return
          }
        } else {
          // User verwijderde thumbnail
          updates.thumbnail_url = null
        }
      }

      const result = await videoService.updateVideo(video.id, updates)

      if (result.success) {
        if (onSave) await onSave()
        onClose()
      } else {
        alert('Fout bij opslaan: ' + (result.error || 'Onbekend'))
      }
    } catch (error) {
      console.error('Error updating video:', error)
      alert('Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  // Shared styles
  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: '#000',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: isMobile ? '0.85rem' : '0.9rem',
    fontWeight: '600',
    outline: 'none'
  }

  const zij = isMobile ? '0.875rem' : '1.125rem'
  const rij = { open, setOpen, zij }
  const kiesStijl = { flexShrink: 0, maxWidth: 150, background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', cursor: 'pointer', outline: 'none', padding: '0.3rem 0' }
  const knopKlein = { minHeight: 34, display: 'inline-flex', alignItems: 'center', padding: '0 0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8, color: '#fff', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 10001,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '1rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          width: '100%',
          maxWidth: isMobile ? '100%' : '560px',
          maxHeight: isMobile ? '92vh' : '88vh',
          borderRadius: isMobile ? '12px 12px 0 0' : '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateZ(0)'
        }}
      >
        {/* HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '0.4rem' : '0.45rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.2rem'
            }}>
              Video bewerken
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {video.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Twee tabbladen (13 nov 2026, Kersten): de video zelf, en voor wie hij is.
            Stond als één lange lijst waarin de klanten ontbraken. */}
        <div style={{ display: 'flex', gap: 6, padding: isMobile ? '0.55rem 0.875rem' : '0.6rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {[['video', 'Video'], ['wie', `Voor wie${toewijzingen?.length ? ` · ${toewijzingen.length}` : ''}`]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} style={{
              flex: 1, minHeight: 36, borderRadius: 9, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer',
              background: tab === id ? '#fff' : 'transparent', color: tab === id ? '#000' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${tab === id ? '#fff' : 'rgba(255,255,255,0.12)'}`, touchAction: 'manipulation',
            }}>{label}</button>
          ))}
        </div>

        {/* BODY */}
        <div
          className="edit-modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Alles als één rij per onderwerp (13 nov 2026, Kersten): links wat het
              is, rechts wat er nu staat. Tikken klapt alleen die ene rij open. */}
          {tab === 'video' && (<>
            <Rij {...rij} id="titel" label="Titel" waarde={formData.title || 'Geen'}>
              <input type="text" autoFocus value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Titel van de video" style={inputStyle} />
            </Rij>
            <Rij {...rij} id="link" label="Link" waarde={formData.video_url.replace(/^https?:\/\/(www\.)?/, '') || 'Geen'}>
              <input type="url" autoFocus value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} placeholder="YouTube, Instagram, TikTok of Zoom" style={inputStyle} />
            </Rij>
            <Rij {...rij} id="omslag" label="Omslag" waarde={thumbnailPreview ? 'Ingesteld' : 'Geen'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {thumbnailPreview && <img src={thumbnailPreview} alt="" style={{ width: 112, aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8, background: '#000' }} />}
                <label htmlFor="edit-omslag" style={{ ...knopKlein, cursor: 'pointer' }}>{thumbnailPreview ? 'Vervangen' : 'Kies afbeelding'}</label>
                {thumbnailPreview && <button type="button" onClick={removeThumbnail} style={{ ...knopKlein, color: 'rgba(255,255,255,0.6)' }}>Weghalen</button>}
                <input id="edit-omslag" type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleThumbnailChange} style={{ display: 'none' }} />
              </div>
            </Rij>
            <Rij {...rij} id="beschrijving" label="Beschrijving" waarde={formData.description || 'Geen'}>
              <textarea autoFocus value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Wat leert de klant hier?" rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.4 }} />
            </Rij>
            <Rij {...rij} label="Categorie" rechts={
              <select value={formData.category_id || ''} onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })} style={kiesStijl}>
                <option value="" style={{ background: '#0a0a0a' }}>Geen</option>
                {customCategories.map(cat => <option key={cat.id} value={cat.id} style={{ background: '#0a0a0a' }}>{cat.name}</option>)}
              </select>
            } />
            <Rij {...rij} label="Persoonlijk" titel="Voor één klant: blijft uit de bibliotheek van de anderen en staat bij de klant onder Voor jou"
              rechts={<Schakel aan={formData.is_personal === true} onClick={() => setFormData({ ...formData, is_personal: !formData.is_personal })} />} />
          </>)}

          {tab === 'wie' && (<>
            <div style={{ display: 'flex', gap: 6, padding: `0.7rem ${zij}`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[['klanten', 'Alleen gekozen klanten'], ['iedereen', 'Alle klanten']].map(([id, label]) => (
                <button key={id} type="button" onClick={() => { setBereik(id); setOpen(id === 'klanten' ? 'klanten' : 'iedereen') }} aria-pressed={bereik === id} style={{
                  flex: 1, minHeight: 36, borderRadius: 9, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer',
                  background: bereik === id ? '#fff' : 'transparent', color: bereik === id ? '#000' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${bereik === id ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                }}>{label}</button>
              ))}
            </div>
            {bereik === 'klanten' && (
            <Rij {...rij} id="klanten" label="Klanten" waarde={toewijzingen === null ? 'Laden…' : toewijzingen.length ? toewijzingen.map(t => `${klantNaam(t.client)} · ${PAGE_OPTIONS.find(o => o.value === t.page_context)?.label || t.page_context || 'Home'}`).join(', ') : 'Niemand'}>
              {toewijzingen?.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {klantNaam(t.client)}
                    {t.status && t.status !== 'pending' && <span style={{ marginLeft: 6, fontSize: '0.66rem', fontWeight: 700, color: '#10b981' }}>bekeken</span>}
                  </span>
                  <select value={t.page_context || 'home'} disabled={bezigKlant === t.id} onChange={(e) => wijzigPagina(t, e.target.value)} style={kiesStijl}>
                    {PAGE_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#0a0a0a' }}>{o.label}</option>)}
                    {!PAGE_OPTIONS.some(o => o.value === (t.page_context || 'home')) && <option value={t.page_context} style={{ background: '#0a0a0a' }}>{t.page_context}</option>}
                  </select>
                  <button type="button" onClick={() => haalKlantWeg(t)} disabled={bezigKlant === t.id} title="Weghalen bij deze klant" aria-label="Weghalen"
                    style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
                    <X size={15} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input type="text" value={klantZoek} onChange={(e) => setKlantZoek(e.target.value)} placeholder="Klant toevoegen…" style={{ ...inputStyle, flex: 1 }} />
                {/* Pas zichtbaar als je iemand zoekt: los eronder leek het een
                    tweede pagina voor de klant erboven. */}
                {klantZoek.trim() && (<>
                  <select value={nieuwePagina} onChange={(e) => setNieuwePagina(e.target.value)} aria-label="Pagina voor de nieuwe klant" style={kiesStijl}>
                    {PAGE_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#0a0a0a' }}>{o.label}</option>)}
                  </select>
                  <span style={{ width: 28, flexShrink: 0 }} />
                </>)}
              </div>
              {klantZoek.trim() && (teKiezen.length === 0
                ? <div style={{ padding: '0.5rem 0', fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>Niemand gevonden</div>
                : teKiezen.map(c => (
                  <button key={c.id} type="button" onClick={() => voegKlantToe(c)} disabled={bezigKlant === c.id} style={{
                    display: 'block', width: '100%', textAlign: 'left', minHeight: 36, padding: 0, background: 'transparent', border: 'none',
                    color: '#fff', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  }}>+ {klantNaam(c)} <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>op {PAGE_OPTIONS.find(o => o.value === nieuwePagina)?.label}</span></button>
                )))}
              {klantFout && <div style={{ marginTop: 6, fontSize: '0.72rem', fontWeight: 700, color: '#f87171' }}>{klantFout}</div>}
            </Rij>
            )}
            {bereik === 'iedereen' && (
            <Rij {...rij} id="iedereen" label="Bij alle klanten op" waarde={formData.default_pages.length ? formData.default_pages.map(v => PAGE_OPTIONS.find(o => o.value === v)?.label || v).join(', ') : 'Geen pagina'}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {PAGE_OPTIONS.map(page => {
                  const aan = formData.default_pages.includes(page.value)
                  return (
                    <button key={page.value} type="button" onClick={() => togglePage(page.value)} style={{
                      minHeight: 36, padding: '0 4px', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                      background: aan ? '#fff' : 'transparent', color: aan ? '#000' : 'rgba(255,255,255,0.7)',
                      border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{page.label}</button>
                  )
                })}
              </div>
            </Rij>
            )}
            <Rij {...rij} label="Moet gezien worden" titel="Staat als blok op de pagina tot de klant bevestigt dat hij hem gezien heeft"
              rechts={<Schakel aan={formData.is_belangrijk} onClick={() => setFormData({ ...formData, is_belangrijk: !formData.is_belangrijk })} />} />
            {bereik === 'iedereen' && <Rij {...rij} label="Home-slider" titel="In de slider bovenaan de home-pagina, voor alle klanten"
              rechts={<Schakel aan={formData.show_in_slider} onClick={() => setFormData({ ...formData, show_in_slider: !formData.show_in_slider })} />} />}
          </>)}

          <div style={{ height: '0.5rem' }} />
        </div>

        {/* ── ACTIONS ── */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1.125rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0,
          background: '#0a0a0a'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.7rem',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '42px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Annuleer
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.title.trim() || !formData.video_url.trim()}
            style={{
              flex: 2,
              padding: '0.625rem',
              background: saving || !formData.title.trim() || !formData.video_url.trim()
                ? 'rgba(255, 255, 255, 0.2)'
                : WIT,
              border: 'none',
              borderRadius: '6px',
              color: saving || !formData.title.trim() || !formData.video_url.trim()
                ? 'rgba(0, 0, 0, 0.4)'
                : '#000',
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: saving || !formData.title.trim() || !formData.video_url.trim()
                ? 'not-allowed'
                : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '42px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'vm-spin 0.8s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Edit size={13} />
                Opslaan
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .edit-modal-body::-webkit-scrollbar { display: none; }
        @keyframes vm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    modalHost
  )
}
