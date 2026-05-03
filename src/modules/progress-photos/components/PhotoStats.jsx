// src/modules/progress-photos/components/PhotoStats.jsx
// v3.0 - ONLY PROGRESS - Simplified flush stat bar
// Props IDENTIEK: { weeklyStats, todayData, isMobile }

import React from 'react'
import { Calendar, Image, Award, TrendingUp } from 'lucide-react'

export default function PhotoStats({ weeklyStats = {}, todayData = {}, isMobile = false }) {
  const { total = 0, activeDays = 0, dailyAverage = 0, current_week = 0, progress = 0 } = weeklyStats
  const todayTotal = todayData?.counts?.total || 0

  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      background: 'rgba(10, 10, 10, 0.5)'
    }}>
      {[
        { label: 'VANDAAG', val: todayTotal, icon: Calendar, gold: true },
        { label: 'WEEK', val: current_week || total, icon: Image, gold: false },
        { label: 'TOTAAL', val: progress || total, icon: TrendingUp, gold: false },
        { label: 'ACTIEF', val: `${activeDays}/7`, icon: Award, gold: false }
      ].map((s, i) => (
        <div key={i} style={{
          flex: 1,
          padding: isMobile ? '0.5rem 0.25rem' : '0.625rem 0.5rem',
          borderRight: i < 3 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          {React.createElement(s.icon, {
            size: isMobile ? 11 : 12,
            color: s.gold ? '#FFD700' : 'rgba(255,255,255,0.25)',
            style: { marginBottom: '0.1rem' }
          })}
          <div style={{
            fontSize: isMobile ? '0.45rem' : '0.5rem', fontWeight: '700',
            color: s.gold ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem'
          }}>{s.label}</div>
          <div style={{
            fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: '800',
            color: s.gold ? '#FFD700' : '#fff', lineHeight: 1
          }}>{s.val}</div>
        </div>
      ))}
    </div>
  )
}
