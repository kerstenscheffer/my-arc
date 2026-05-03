// src/modules/output-planning/components/WeekPlanExport.jsx
// Printable Week Plan Export - A4 PDF with Gold Theme
// Uses Lucide icons, checkboxes, elegant typography

import { useState } from 'react'
import { 
  X, 
  Printer,
  Calendar,
  Camera,
  Image,
  Video,
  Target,
  Share,
  Megaphone,
  Users,
  Brain,
  Utensils,
  Dumbbell,
  MessageCircle,
  FileText,
  CheckSquare,
  Square,
  Clock,
  Sparkles
} from 'lucide-react'

// Days configuration
const DAYS = [
  { id: 'monday', label: 'Maandag', short: 'Ma' },
  { id: 'tuesday', label: 'Dinsdag', short: 'Di' },
  { id: 'wednesday', label: 'Woensdag', short: 'Wo' },
  { id: 'thursday', label: 'Donderdag', short: 'Do' },
  { id: 'friday', label: 'Vrijdag', short: 'Vr' },
  { id: 'saturday', label: 'Zaterdag', short: 'Za' },
  { id: 'sunday', label: 'Zondag', short: 'Zo' }
]

// Type configs for icons
const STORY_TYPES = {
  personal: { label: 'Persoonlijk', icon: Camera, color: '#8b5cf6' },
  lead_magnet: { label: 'Lead Magnet (Poll)', icon: Target, color: '#f59e0b' },
  content_push: { label: 'Content Push', icon: Share, color: '#3b82f6' }
}

const POST_TYPES = {
  photo: { label: 'Foto Post', icon: Image, color: '#ec4899' },
  lead_magnet: { label: 'Lead Magnet', icon: Target, color: '#f59e0b' },
  video: { label: 'Uitleg Video', icon: Video, color: '#ef4444' },
  announcement: { label: 'Aankondiging', icon: Megaphone, color: '#10b981' }
}

const COMMUNITY_GROUPS = {
  mindset: { label: 'Mindset', icon: Brain, color: '#8b5cf6' },
  voeding: { label: 'Voeding', icon: Utensils, color: '#10b981' },
  gym: { label: 'Gym', icon: Dumbbell, color: '#f97316' },
  community: { label: 'Community', icon: MessageCircle, color: '#3b82f6' },
  announcement: { label: 'Aankondiging', icon: Megaphone, color: '#FFD700' }
}

// Format date range for header
const formatWeekRange = (monday) => {
  const start = new Date(monday)
  const end = new Date(monday)
  end.setDate(end.getDate() + 6)
  
  const options = { day: 'numeric', month: 'long' }
  return `${start.toLocaleDateString('nl-NL', options)} - ${end.toLocaleDateString('nl-NL', options)} ${start.getFullYear()}`
}

// Get date for specific day
const getDayDate = (monday, dayIndex) => {
  const date = new Date(monday)
  date.setDate(date.getDate() + dayIndex)
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default function WeekPlanExport({ 
  weekPlan, 
  dayItems, 
  currentWeekMonday,
  onClose 
}) {
  const [printing, setPrinting] = useState(false)
  
  // Group items by day
  const getItemsForDay = (dayId) => {
    return dayItems.filter(item => item.day_of_week === dayId)
  }
  
  // Get items by type
  const getItemsByType = (dayId, type) => {
    return dayItems.filter(item => item.day_of_week === dayId && item.item_type === type)
  }
  
  // Calculate stats
  const totalItems = dayItems.length
  const completedItems = dayItems.filter(i => i.completed).length
  
  // Handle print
  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 100)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 2000,
      overflow: 'auto'
    }}>
      {/* Controls - Hidden during print */}
      <div className="no-print" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 2001
      }}>
        <button
          onClick={handlePrint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 28px',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}
        >
          <Printer size={18} />
          Print PDF
        </button>
        
        <button
          onClick={onClose}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '8px',
            background: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Print Container */}
      <div id="print-container" style={{
        width: '210mm',
        margin: '0 auto',
        background: '#fff'
      }}>
        
        {/* ============================================ */}
        {/* PAGE 1: COVER */}
        {/* ============================================ */}
        <div className="page" style={{
          width: '210mm',
          minHeight: '297mm',
          background: '#ffffff',
          pageBreakAfter: 'always',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Cover Top */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px 50px',
            textAlign: 'center'
          }}>
            {/* Label */}
            <div style={{
              fontSize: '11px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: '#b8860b',
              fontWeight: '600',
              marginBottom: '30px'
            }}>
              Content Planning
            </div>
            
            {/* Title */}
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '72px',
              fontWeight: '400',
              letterSpacing: '-2px',
              lineHeight: '0.9',
              margin: 0,
              color: '#1a1a1a'
            }}>
              Week
              <br />
              <span style={{ fontWeight: '900', fontStyle: 'italic' }}>Planning</span>
            </h1>
            
            {/* Week Range */}
            <div style={{
              fontSize: '14px',
              color: '#666',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginTop: '20px'
            }}>
              {formatWeekRange(currentWeekMonday)}
            </div>
            
            {/* Gold Line */}
            <div style={{
              width: '60px',
              height: '2px',
              background: 'linear-gradient(90deg, #b8860b, #d4a84b)',
              margin: '30px 0'
            }} />
            
            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '40px',
              marginTop: '20px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#b8860b'
                }}>
                  {totalItems}
                </div>
                <div style={{
                  fontSize: '10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#888'
                }}>
                  Items
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#b8860b'
                }}>
                  7
                </div>
                <div style={{
                  fontSize: '10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#888'
                }}>
                  Dagen
                </div>
              </div>
            </div>
          </div>
          
          {/* Cover Bottom */}
          <div style={{
            padding: '40px 50px',
            background: '#fafafa',
            borderTop: '1px solid #e0e0e0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <Sparkles size={24} color="#b8860b" />
              <div>
                <div style={{
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Gemaakt met
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '18px',
                  color: '#1a1a1a',
                  fontWeight: '600'
                }}>
                  MY ARC Output System
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* PAGES 2-8: ONE PAGE PER DAY */}
        {/* ============================================ */}
        {DAYS.map((day, dayIndex) => {
          const stories = getItemsByType(day.id, 'story')
          const posts = getItemsByType(day.id, 'post')
          const community = getItemsByType(day.id, 'community')
          const gym = getItemsByType(day.id, 'gym')
          const dayTotal = stories.length + posts.length + community.length + gym.length
          const dayCompleted = [...stories, ...posts, ...community, ...gym].filter(i => i.completed).length
          
          return (
            <div 
              key={day.id}
              className="page" 
              style={{
                width: '210mm',
                minHeight: '297mm',
                background: '#ffffff',
                pageBreakAfter: 'always',
                pageBreakInside: 'avoid',
                position: 'relative'
              }}
            >
              <div style={{
                padding: '50px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Page Header */}
                <div style={{ marginBottom: '30px' }}>
                  {/* Page Number */}
                  <div style={{
                    fontSize: '10px',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: '#b8860b',
                    marginBottom: '12px',
                    fontWeight: '600'
                  }}>
                    Dag {dayIndex + 1} van 7
                  </div>
                  
                  {/* Day Title */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '15px'
                  }}>
                    <h2 style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '42px',
                      fontWeight: '700',
                      margin: 0,
                      color: '#1a1a1a'
                    }}>
                      {day.label}
                    </h2>
                    <span style={{
                      fontSize: '16px',
                      color: '#888'
                    }}>
                      {getDayDate(currentWeekMonday, dayIndex)}
                    </span>
                  </div>
                  
                  {/* Gold Line */}
                  <div style={{
                    width: '60px',
                    height: '2px',
                    background: 'linear-gradient(90deg, #b8860b, #d4a84b)',
                    margin: '15px 0'
                  }} />
                  
                  {/* Day Stats */}
                  {dayTotal > 0 && (
                    <div style={{
                      fontSize: '13px',
                      color: '#666'
                    }}>
                      {dayTotal} items gepland
                    </div>
                  )}
                </div>

                {/* Two Column Layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '40px',
                  flex: 1
                }}>
                  {/* Left Column */}
                  <div>
                    {/* Stories Section */}
                    <SectionBlock 
                      title="Stories" 
                      icon={Camera}
                      items={stories}
                      typeConfigs={STORY_TYPES}
                      typeKey="story_type"
                    />
                    
                    {/* Posts Section */}
                    <SectionBlock 
                      title="Posts / Reels" 
                      icon={Image}
                      items={posts}
                      typeConfigs={POST_TYPES}
                      typeKey="post_type"
                    />
                  </div>
                  
                  {/* Right Column */}
                  <div>
                    {/* Community Section */}
                    <SectionBlock 
                      title="Community" 
                      icon={Users}
                      items={community}
                      typeConfigs={COMMUNITY_GROUPS}
                      typeKey="community_group"
                    />
                    
                    {/* Gym Section */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{
                        fontSize: '9px',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        color: '#b8860b',
                        marginBottom: '10px',
                        fontWeight: '600'
                      }}>
                        Gym Workout
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        padding: '12px 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #d0d0d0',
                          borderRadius: '4px',
                          flexShrink: 0
                        }} />
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Dumbbell size={16} color="#f97316" />
                          <span style={{
                            fontSize: '13px',
                            color: '#444'
                          }}>
                            Gym Sessie
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes Box */}
                    <div style={{
                      background: '#fafafa',
                      borderLeft: '3px solid #b8860b',
                      padding: '20px 25px',
                      marginTop: '20px'
                    }}>
                      <div style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '10px'
                      }}>
                        Notities
                      </div>
                      <div style={{
                        minHeight: '60px',
                        borderBottom: '1px solid #e0e0e0'
                      }} />
                      <div style={{
                        minHeight: '30px',
                        borderBottom: '1px solid #e0e0e0',
                        marginTop: '10px'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Page Footer */}
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '16px',
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: '#999'
                }}>
                  <span style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '14px',
                    color: '#1a1a1a'
                  }}>
                    Week Planning
                  </span>
                  <span>
                    {day.label} | Pagina {dayIndex + 2} van 8
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Print Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
        
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #fff !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          
          .page:last-child {
            page-break-after: avoid !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        }
        
        #print-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
    </div>
  )
}

// Section Block Component
function SectionBlock({ title, icon: Icon, items, typeConfigs, typeKey }) {
  if (items.length === 0) {
    return (
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          fontSize: '9px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: '#b8860b',
          marginBottom: '10px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Icon size={14} color="#b8860b" />
          {title}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#999',
          fontStyle: 'italic',
          padding: '10px 0'
        }}>
          Geen items gepland
        </div>
      </div>
    )
  }
  
  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Section Header */}
      <div style={{
        fontSize: '9px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        color: '#b8860b',
        marginBottom: '10px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Icon size={14} color="#b8860b" />
        {title}
        <span style={{
          background: '#fafafa',
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          padding: '2px 8px',
          fontSize: '9px',
          color: '#666'
        }}>
          {items.length}
        </span>
      </div>
      
      {/* Items List */}
      <div style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, index) => {
          const typeConfig = typeConfigs[item[typeKey]] || { label: 'Item', color: '#666' }
          const TypeIcon = typeConfig.icon || Icon
          
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 0',
                borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #d0d0d0',
                borderRadius: '4px',
                flexShrink: 0,
                marginTop: '2px'
              }} />
              
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <TypeIcon size={14} color={typeConfig.color} />
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>
                    {typeConfig.label}
                  </span>
                </div>
                
                {item.description && (
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    lineHeight: '1.5'
                  }}>
                    {item.description}
                  </div>
                )}
                
                {item.goal && (
                  <div style={{
                    fontSize: '10px',
                    color: '#b8860b',
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    Doel: {item.goal}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
