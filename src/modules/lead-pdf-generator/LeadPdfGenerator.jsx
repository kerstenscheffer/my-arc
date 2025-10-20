import React, { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Settings, Upload, X, Image, Camera, Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react'

// Template imports
import CoverPage from './templates/CoverPage'
import TruthPage from './templates/TruthPage'
import ChecklistPage from './templates/ChecklistPage'
import MasterChecklistPage from './templates/MasterChecklistPage'
import CTAPage from './templates/CTAPage'

// Component imports
import EditModal from './components/EditModal'
import QuickSettings, { DEFAULT_SETTINGS } from './components/QuickSettings'
import PhotoLibrary from './components/PhotoLibrary'

// PDF PREVIEW MODAL COMPONENT
function PDFPreviewModal({ isOpen, onClose, pdfPages, isGenerating }) {
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0)
  const isMobile = window.innerWidth <= 768
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      padding: isMobile ? '1rem' : '2rem',
      touchAction: 'manipulation'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #333'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          margin: 0,
          color: '#fff'
        }}>
          PDF Preview {isGenerating ? '(Generating...)' : ''}
        </h2>
        <button
          onClick={onClose}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#333',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '44px',
            minWidth: '44px'
          }}
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Loading State */}
      {isGenerating && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#fff', fontSize: '1.125rem' }}>
            Generating PDF preview...
          </p>
          <p style={{ color: '#999', fontSize: '0.875rem' }}>
            Page {currentPreviewPage + 1} / 13
          </p>
        </div>
      )}
      
      {/* Preview Content */}
      {!isGenerating && pdfPages.length > 0 && (
        <>
          {/* Navigation Controls */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setCurrentPreviewPage(Math.max(0, currentPreviewPage - 1))}
              disabled={currentPreviewPage === 0}
              style={{
                padding: '0.75rem 1rem',
                background: currentPreviewPage === 0 ? '#222' : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: currentPreviewPage === 0 ? '#666' : '#fff',
                cursor: currentPreviewPage === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                minHeight: '44px'
              }}
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            
            <span style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              Page {currentPreviewPage + 1} / {pdfPages.length}
            </span>
            
            <button
              onClick={() => setCurrentPreviewPage(Math.min(pdfPages.length - 1, currentPreviewPage + 1))}
              disabled={currentPreviewPage === pdfPages.length - 1}
              style={{
                padding: '0.75rem 1rem',
                background: currentPreviewPage === pdfPages.length - 1 ? '#222' : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: currentPreviewPage === pdfPages.length - 1 ? '#666' : '#fff',
                cursor: currentPreviewPage === pdfPages.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                minHeight: '44px'
              }}
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
          
          {/* Page Display */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'auto',
            background: '#0a0a0a',
            borderRadius: '12px',
            padding: '1rem'
          }}>
            <img
              src={pdfPages[currentPreviewPage]}
              alt={`Page ${currentPreviewPage + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>
          
          {/* Thumbnail Strip */}
          <div style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            padding: '0.5rem',
            background: '#111',
            borderRadius: '8px'
          }}>
            {pdfPages.map((page, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPreviewPage(idx)}
                style={{
                  minWidth: isMobile ? '60px' : '80px',
                  height: isMobile ? '85px' : '113px',
                  border: currentPreviewPage === idx ? '3px solid #10b981' : '2px solid #333',
                  borderRadius: '4px',
                  padding: 0,
                  cursor: 'pointer',
                  background: 'transparent',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0
                }}
              >
                <img
                  src={page}
                  alt={`Thumbnail ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: '#fff',
                  fontSize: '0.625rem',
                  padding: '2px',
                  textAlign: 'center'
                }}>
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// QuickPhotoSlot Component
function QuickPhotoSlot({ 
  currentPage,
  photoLibrary, 
  setPhotoLibrary,
  isMobile 
}) {
  const [dragOver, setDragOver] = useState(false)
  
  const getSlotId = () => {
    if (currentPage === 0) return 'page-0-hero'
    if (currentPage === 12) return 'page-12-hero'
    return `page-${currentPage}-watermark`
  }
  
  const slotId = getSlotId()
  const currentPhoto = photoLibrary.uploads.find(
    p => p.id === photoLibrary.assignments[slotId]
  )
  
  const getPageName = () => {
    if (currentPage === 0) return 'Cover Photo'
    if (currentPage === 12) return 'Profile Photo'
    if (currentPage === 11) return 'Master Checklist'
    if (currentPage % 2 === 0) {
      return `Truth ${Math.floor(currentPage / 2)}`
    }
    return `Checklist ${Math.floor((currentPage + 1) / 2)}`
  }
  
  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      
      if (!file.type.startsWith('image/')) {
        alert('Alleen afbeeldingen toegestaan')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Max 5MB per foto')
        return
      }
      
      const url = URL.createObjectURL(file)
      
      const newPhoto = {
        id: Date.now().toString(),
        url: url,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
      
      setPhotoLibrary({
        uploads: [...photoLibrary.uploads, newPhoto],
        assignments: {
          ...photoLibrary.assignments,
          [slotId]: newPhoto.id
        }
      })
    }
  }
  
  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingen toegestaan')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB per foto')
      return
    }
    
    const url = URL.createObjectURL(file)
    
    const newPhoto = {
      id: Date.now().toString(),
      url: url,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }
    
    setPhotoLibrary({
      uploads: [...photoLibrary.uploads, newPhoto],
      assignments: {
        ...photoLibrary.assignments,
        [slotId]: newPhoto.id
      }
    })
  }
  
  const clearPhoto = () => {
    const newAssignments = { ...photoLibrary.assignments }
    delete newAssignments[slotId]
    setPhotoLibrary({
      ...photoLibrary,
      assignments: newAssignments
    })
  }
  
  const bulkAssignToWatermarks = () => {
    if (!currentPhoto) return
    
    const newAssignments = { ...photoLibrary.assignments }
    for (let i = 1; i <= 10; i++) {
      newAssignments[`page-${i}-watermark`] = currentPhoto.id
    }
    setPhotoLibrary({
      ...photoLibrary,
      assignments: newAssignments
    })
  }
  
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      marginBottom: '2rem',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minWidth: isMobile ? '100%' : '200px'
      }}>
        <Camera size={24} style={{ color: '#10b981' }} />
        <div>
          <div style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '0.25rem'
          }}>
            Page {currentPage + 1} / 13
          </div>
          <div style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {getPageName()}
          </div>
        </div>
      </div>
      
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          flex: 1,
          height: isMobile ? '120px' : '100px',
          background: dragOver ? 
            'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)' :
            currentPhoto ? 
              'rgba(16, 185, 129, 0.1)' :
              'rgba(255, 255, 255, 0.05)',
          border: dragOver ? 
            '2px dashed #10b981' : 
            currentPhoto ?
              '2px solid rgba(16, 185, 129, 0.5)' :
              '2px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'manipulation'
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          id={`page-upload-${currentPage}`}
        />
        
        {currentPhoto ? (
          <>
            <img 
              src={currentPhoto.url}
              alt={currentPhoto.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.3,
                filter: 'blur(2px)'
              }}
            />
            
            <div style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              padding: '1rem'
            }}>
              <Image size={32} style={{ marginBottom: '0.5rem', color: '#10b981' }} />
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#10b981',
                marginBottom: '0.25rem'
              }}>
                Photo Loaded
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '200px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentPhoto.name}
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearPhoto()
              }}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <label 
            htmlFor={`page-upload-${currentPage}`}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: '0.5rem'
            }}
          >
            <Upload size={32} style={{ opacity: 0.7, color: '#10b981' }} />
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Drop photo here or click
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              For {getPageName().toLowerCase()}
            </div>
          </label>
        )}
      </div>
      
      {currentPage >= 1 && currentPage <= 10 && currentPhoto && (
        <button
          onClick={bulkAssignToWatermarks}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem',
            minHeight: '44px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Apply to All Watermarks
        </button>
      )}
    </div>
  )
}

// Main Component
export default function LeadPdfGenerator() {
  const isMobile = window.innerWidth <= 768
  
  const [currentPage, setCurrentPage] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewPages, setPreviewPages] = useState([])
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  
  const [photoLibrary, setPhotoLibrary] = useState({
    uploads: [],
    assignments: {}
  })
  
  const [yourPhoto, setYourPhoto] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editPageType, setEditPageType] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const [pdfContent, setPdfContent] = useState({
    cover: {
      title: "De 5 Fundamentele\nFitness Waarheden",
      subtitle: "Leer de basis, spot de bullshit",
      tagline: "↓ Scroll voor waarheid ↓"
    },
    truths: [
      {
        number: "①",
        title: "SPIEREN GROEIEN DOOR STIMULUS",
        explanation: "Spieren groeien alleen als ze een reden krijgen. Die reden? Progressieve overload. Meer gewicht, meer reps, of betere techniek.",
        why: "Als je dit niet begrijpt, doe je random shit in de gym zonder resultaat."
      },
      {
        number: "②",
        title: "CALORIEËN & EIWITTEN ZIJN KONING",
        explanation: "Wil je afvallen? Calorietekort. Wil je groeien? Surplus + genoeg eiwit (1.6-2.2g per kg lichaamsgewicht).",
        why: "90% van je resultaat komt hier vandaan. De rest is details."
      },
      {
        number: "③",
        title: "PROGRESSIEVE OVERLOAD IS DE WET",
        explanation: "Elke week iets meer. Extra rep, extra kilo, betere vorm. Progress = groei.",
        why: "Zonder progressie train je voor niks. Je lichaam past zich alleen aan als het moet."
      },
      {
        number: "④",
        title: "HERSTEL IS WANNEER JE GROEIT",
        explanation: "In de gym breek je spieren af. In bed bouw je ze op. 7-9 uur slaap is niet onderhandelbaar.",
        why: "Geen herstel = geen groei. Simpel."
      },
      {
        number: "⑤",
        title: "CONSISTENTIE > PERFECTIE",
        explanation: "3x per week voor een jaar > 6x per week voor een maand. Bouw gewoontes, niet motivatie.",
        why: "Motivatie verdwijnt. Discipline blijft. De beste workout is degene die je actually doet."
      }
    ],
    checklists: [
      {
        title: "IS DEZE OEFENING GOED?",
        checks: [
          "Voel je de target spier werken?",
          "Kun je progressie maken (meer gewicht/reps)?",
          "Geen pijn in gewrichten?",
          "Kun je het consistent uitvoeren?"
        ],
        redFlags: [
          "Instagram oefening die er fancy uitziet",
          "Kan geen progressie maken",
          "Voelt onnatuurlijk"
        ],
        greenFlags: [
          "Barbell/dumbbell basis",
          "Decennia bewezen",
          "Voelt natuurlijk"
        ]
      },
      {
        title: "IS DIT DIEET LEGIT?",
        checks: [
          "Calorieën geteld?",
          "Eiwitten voldoende?",
          "Kun je het volhouden?",
          "Past bij je lifestyle?"
        ],
        redFlags: [
          "Verbiedt hele voedselgroepen",
          "Belooft >1kg per week verlies",
          "Kost €100+ per maand"
        ],
        greenFlags: [
          "Flexibel met voedselkeuze",
          "Focus op calorieën & eiwitten",
          "Sustainable approach"
        ]
      },
      {
        title: "IS JE PROGRESSIE GOED?",
        checks: [
          "Log je workouts?",
          "Voeg je wekelijks gewicht/reps toe?",
          "Track je lichaamsgewicht?",
          "Maak je foto's?"
        ],
        redFlags: [
          "Doet al maanden hetzelfde",
          "Geen idee wat vorige week was",
          "Random workout elke keer"
        ],
        greenFlags: [
          "Logboek bijhouden",
          "Wekelijkse kleine wins",
          "Data-driven approach"
        ]
      },
      {
        title: "HERSTEL JE GENOEG?",
        checks: [
          "7+ uur slaap?",
          "2L+ water per dag?",
          "Rustdagen gepland?",
          "Stress onder controle?"
        ],
        redFlags: [
          "Altijd moe",
          "Kracht daalt",
          "Constant spierpijn"
        ],
        greenFlags: [
          "Energiek gevoel",
          "Prestaties stijgen",
          "Motivated voor training"
        ]
      },
      {
        title: "BEN JE CONSISTENT?",
        checks: [
          "3+ workouts per week?",
          "80% van meals on point?",
          "Slaapschema consistent?",
          "Lange termijn denken?"
        ],
        redFlags: [
          "Elke week nieuw programma",
          "All-or-nothing mindset",
          "Weekend ruins progress"
        ],
        greenFlags: [
          "Gemiste workouts inhalen",
          "80/20 regel toepassen",
          "Geduld hebben"
        ]
      }
    ],
    masterChecklist: {
      sections: [
        {
          category: "TRAINING",
          checks: [
            "Progressive overload elke week",
            "Compound oefeningen basis",
            "3-5x per week consistent",
            "Logboek bijhouden"
          ]
        },
        {
          category: "VOEDING",
          checks: [
            "Calorieën geteld voor doel",
            "1.6-2.2g eiwit per kg",
            "80% whole foods",
            "Hydratatie op punt"
          ]
        },
        {
          category: "ALGEMEEN",
          checks: [
            "7+ uur slaap",
            "Stress management",
            "Geduld & lange termijn",
            "Progress tracking"
          ]
        }
      ],
      scoring: {
        high: "10+ checks = Je weet wat je doet",
        medium: "6-9 checks = Op de goede weg",
        low: "<6 checks = Time to learn basics"
      }
    },
    cta: {
      title: "KLAAR VOOR DE WAARHEID?",
      body: "Deze regels zijn alles wat je nodig hebt.\nGeen BS, geen shortcuts, alleen resultaten.",
      ctaText: "Scan voor gratis analyse",
      instagramHandle: "@myarc.fitness",
      qrCodeUrl: null
    }
  })
  
  const getPhotoForSlot = (slotId) => {
    const photoId = photoLibrary.assignments[slotId]
    if (!photoId) return yourPhoto
    const photo = photoLibrary.uploads.find(p => p.id === photoId)
    return photo ? photo.url : yourPhoto
  }
  
  // PREVIEW PDF FUNCTION
  const previewPDF = async () => {
    setIsGeneratingPreview(true)
    setPreviewModalOpen(true)
    setPreviewPages([])
    
    try {
      const pages = []
      
      for (let i = 0; i < 13; i++) {
        const element = document.getElementById(`pdf-page-${i}`)
        
        if (!element) {
          console.error(`Page ${i} not found`)
          continue
        }
        
        const canvas = await html2canvas(element, {
          scale: 2,
          width: 794,
          height: 1123,
          backgroundColor: '#000',
          useCORS: true,
          allowTaint: true,
          logging: false
        })
        
        const imgData = canvas.toDataURL('image/png')
        pages.push(imgData)
        
        // Update preview pages progressively
        setPreviewPages([...pages])
        
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
    } catch (error) {
      console.error('Preview generation failed:', error)
      alert('Er ging iets mis met het genereren van de preview')
    } finally {
      setIsGeneratingPreview(false)
    }
  }
  
  // DOWNLOAD PDF FUNCTION
  const downloadPDF = async () => {
    setIsDownloading(true)
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      for (let i = 0; i < 13; i++) {
        const element = document.getElementById(`pdf-page-${i}`)
        
        if (!element) {
          console.error(`Page ${i} not found`)
          continue
        }
        
        const canvas = await html2canvas(element, {
          scale: 2,
          width: 794,
          height: 1123,
          backgroundColor: '#000',
          useCORS: true,
          allowTaint: true,
          logging: false
        })
        
        const imgData = canvas.toDataURL('image/png')
        
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
        
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      pdf.save('de-5-fitness-waarheden.pdf')
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Er ging iets mis met het genereren van de PDF')
    } finally {
      setIsDownloading(false)
    }
  }
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setYourPhoto(e.target.result)
      reader.readAsDataURL(file)
    }
  }
  
  const getPageType = (pageIndex) => {
    if (pageIndex === 0) return 'Cover'
    if (pageIndex === 12) return 'CTA'
    if (pageIndex === 11) return 'Master Checklist'
    if (pageIndex % 2 === 0) return `Truth ${Math.floor(pageIndex / 2)}`
    return `Checklist ${Math.floor((pageIndex + 1) / 2)}`
  }
  
  const getEditType = (pageIndex) => {
    if (pageIndex === 0) return 'cover'
    if (pageIndex === 12) return 'cta'
    if (pageIndex === 11) return 'master'
    if (pageIndex % 2 === 0) return 'truth'
    return 'checklist'
  }
  
  const openEditModal = () => {
    setEditPageType(getEditType(currentPage))
    setEditModalOpen(true)
  }
  
  const renderCurrentPage = () => {
    const pageProps = {
      content: pdfContent,
      yourPhoto: getPhotoForSlot(`page-${currentPage}-hero`) || getPhotoForSlot(`page-${currentPage}-watermark`),
      pageIndex: currentPage,
      settings: settings
    }
    
    switch(currentPage) {
      case 0:
        return <CoverPage {...pageProps} />
      case 11:
        return <MasterChecklistPage {...pageProps} />
      case 12:
        return <CTAPage {...pageProps} />
      default:
        if (currentPage % 2 === 0) {
          const truthIndex = Math.floor(currentPage / 2) - 1
          return <TruthPage {...pageProps} truthIndex={truthIndex} />
        } else {
          const checklistIndex = Math.floor((currentPage - 1) / 2)
          return <ChecklistPage {...pageProps} checklistIndex={checklistIndex} />
        }
    }
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      padding: isMobile ? '1rem' : '2rem',
      touchAction: 'manipulation'
    }}>
      <div style={{
        marginBottom: '2rem',
        borderBottom: '1px solid #333',
        paddingBottom: '1rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          PDF Lead Magnet Generator
        </h1>
        <p style={{ color: '#999' }}>
          De 5 Fundamentele Fitness Waarheden - 13 pagina's
        </p>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{
            display: 'inline-block',
            padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
            background: '#333',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center'
          }}>
            Upload Foto
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </label>
          {yourPhoto && <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>✓</span>}
        </div>
        
        <button
          onClick={openEditModal}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            minHeight: '44px'
          }}
        >
          ✏️ Edit Content
        </button>
        
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '44px'
          }}
        >
          <Settings size={18} />
          Settings
        </button>
        
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
              background: currentPage === 0 ? '#222' : '#333',
              border: 'none',
              borderRadius: '8px',
              color: currentPage === 0 ? '#666' : '#fff',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              minHeight: '44px'
            }}
          >
            ← Vorige
          </button>
          
          <span style={{ 
            margin: '0 1rem',
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}>
            Pagina {currentPage + 1} / 13 ({getPageType(currentPage)})
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(12, currentPage + 1))}
            disabled={currentPage === 12}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
              background: currentPage === 12 ? '#222' : '#333',
              border: 'none',
              borderRadius: '8px',
              color: currentPage === 12 ? '#666' : '#fff',
              cursor: currentPage === 12 ? 'not-allowed' : 'pointer',
              minHeight: '44px'
            }}
          >
            Volgende →
          </button>
        </div>
        
        {/* PREVIEW BUTTON - NEW */}
        <button
          onClick={previewPDF}
          disabled={isGeneratingPreview}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '0.5rem 1.5rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: isGeneratingPreview ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '44px'
          }}
        >
          <Eye size={18} />
          {isGeneratingPreview ? 'Generating...' : 'Preview PDF'}
        </button>
        
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '0.5rem 1.5rem',
            background: isDownloading ? '#666' : '#10b981',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '44px'
          }}
        >
          <Download size={18} />
          {isDownloading ? 'Genereren...' : 'Download PDF'}
        </button>
      </div>
      
      <QuickPhotoSlot
        currentPage={currentPage}
        photoLibrary={photoLibrary}
        setPhotoLibrary={setPhotoLibrary}
        isMobile={isMobile}
      />
      
      <div style={{
        background: '#111',
        borderRadius: '12px',
        padding: isMobile ? '0.5rem' : '1rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          marginBottom: '1rem',
          fontSize: isMobile ? '1rem' : '1.25rem',
          textAlign: 'center'
        }}>Preview</h3>
        
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'auto',
          maxHeight: '600px',
          background: settings.colors.pageBackground,
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{ 
            transform: isMobile ? 'scale(0.35)' : 'scale(0.45)', 
            transformOrigin: 'top center',
            width: '794px',
            height: '1123px',
            flexShrink: 0,
            position: 'relative',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
            padding: '3px',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: settings.colors.pageBackground,
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              {renderCurrentPage()}
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div id="pdf-page-0">
          <CoverPage 
            content={pdfContent} 
            yourPhoto={getPhotoForSlot('page-0-hero')} 
            pageIndex={0} 
            settings={settings} 
          />
        </div>
        
        {[1,2,3,4,5,6,7,8,9,10].map(pageNum => (
          <div key={pageNum} id={`pdf-page-${pageNum}`}>
            {pageNum % 2 === 0 ? (
              <TruthPage 
                content={pdfContent} 
                yourPhoto={getPhotoForSlot(`page-${pageNum}-watermark`)} 
                truthIndex={Math.floor(pageNum / 2) - 1}
                pageIndex={pageNum}
                settings={settings}
              />
            ) : (
              <ChecklistPage 
                content={pdfContent} 
                yourPhoto={getPhotoForSlot(`page-${pageNum}-watermark`)} 
                checklistIndex={Math.floor((pageNum - 1) / 2)}
                pageIndex={pageNum}
                settings={settings}
              />
            )}
          </div>
        ))}
        
        <div id="pdf-page-11">
          <MasterChecklistPage 
            content={pdfContent} 
            yourPhoto={null} 
            pageIndex={11} 
            settings={settings} 
          />
        </div>
        
        <div id="pdf-page-12">
          <CTAPage 
            content={pdfContent} 
            yourPhoto={getPhotoForSlot('page-12-hero')} 
            pageIndex={12} 
            settings={settings} 
          />
        </div>
      </div>
      
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        pageIndex={currentPage}
        pageType={editPageType}
        content={pdfContent}
        onUpdate={setPdfContent}
        yourPhoto={yourPhoto}
        settings={settings}
      />
      
      <QuickSettings
        settings={settings}
        setSettings={setSettings}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      
      <PhotoLibrary
        photoLibrary={photoLibrary}
        setPhotoLibrary={setPhotoLibrary}
        currentPage={currentPage}
        isMobile={isMobile}
      />
      
      {/* PDF PREVIEW MODAL */}
      <PDFPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        pdfPages={previewPages}
        isGenerating={isGeneratingPreview}
      />
    </div>
  )
}
