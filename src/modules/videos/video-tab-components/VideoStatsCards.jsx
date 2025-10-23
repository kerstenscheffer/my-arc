// src/modules/videos/video-tab-components/VideoStatsCards.jsx
import React from 'react'
import { Play, Eye, Users, Globe } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'

export default function VideoStatsCards({ videos, clientsCount }) {
  const isMobile = useIsMobile()
  
  const defaultVideosCount = videos.filter(v => v.default_pages && v.default_pages.length > 0).length
  const totalViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0)
  
  const stats = [
    { 
      label: 'Totaal Videos', 
      value: videos.length, 
      icon: Play, 
      color: 'rgba(59, 130, 246, 0.8)' 
    },
    { 
      label: 'Standaard Videos', 
      value: defaultVideosCount, 
      icon: Globe, 
      color: 'rgba(16, 185, 129, 0.8)' 
    },
    { 
      label: 'Clients', 
      value: clientsCount, 
      icon: Users, 
      color: 'rgba(245, 158, 11, 0.8)' 
    },
    { 
      label: 'Totaal Views', 
      value: totalViews, 
      icon: Eye, 
      color: 'rgba(139, 92, 246, 0.8)' 
    }
  ]
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {stats.map((stat, index) => (
        <div key={index} style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <stat.icon size={20} style={{ color: stat.color, opacity: 0.8 }} />
            </div>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: 'rgba(255,255,255,0.4)'
            }}>
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
