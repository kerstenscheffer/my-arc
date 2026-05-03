// src/modules/lead-management/utils/exportDailyReport.js
// VERSION 2.0 - Notion-style PDF met sectie kleuren

export function exportDailyReport(sections = [], config = {}, activityData = {}, funnelData = {}) {
  const { coachName = 'Coach', dailyGoal = 100 } = config
  
  const today = new Date()
  const dateStr = today.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = today.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  
  // Activity metrics
  const newOutreach = activityData.newOutreach || 0
  const followUps = activityData.followUps || 0
  const totalTouches = activityData.totalTouches || 0
  const totalMovements = activityData.totalMovements || 0
  const movementsList = activityData.movementsList || []
  
  // Funnel metrics
  const conversation = funnelData.conversation || { count: 0 }
  const callScheduled = funnelData.callScheduled || { count: 0 }
  
  // Progress calculation
  const progress = Math.min(100, Math.round((newOutreach / dailyGoal) * 100))
  const remaining = Math.max(0, dailyGoal - newOutreach)
  
  // Reply tracking
  const totalReplies = sections.reduce((sum, section) => {
    return sum + (section.leads || []).reduce((leadSum, lead) => leadSum + (lead.reply_count || 0), 0)
  }, 0)
  
  // Build section color lookup
  const sectionColorMap = {}
  sections.forEach(s => {
    sectionColorMap[s.title] = s.color || '#888'
    const cleanTitle = s.title.replace(/[^\w\s]/g, '').trim().toLowerCase()
    sectionColorMap[cleanTitle] = s.color || '#888'
  })
  
  // Helper met fuzzy matching
  const getSectionColor = (title) => {
    if (!title) return '#888'
    if (sectionColorMap[title]) return sectionColorMap[title]
    const cleanTitle = title.replace(/[^\w\s]/g, '').trim().toLowerCase()
    if (sectionColorMap[cleanTitle]) return sectionColorMap[cleanTitle]
    for (const [key, color] of Object.entries(sectionColorMap)) {
      if (key.toLowerCase().includes(cleanTitle) || cleanTitle.includes(key.toLowerCase())) {
        return color
      }
    }
    return '#888'
  }
  
  // New leads today
  const newLeadsToday = []
  sections.forEach(section => {
    (section.leads || []).forEach(lead => {
      if (lead.created_at) {
        const createdDate = new Date(lead.created_at)
        if (createdDate.toDateString() === today.toDateString()) {
          newLeadsToday.push({
            name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Geen naam',
            source: lead.lead_source || 'manual',
            section: section.title,
            sectionColor: section.color || '#888',
            time: createdDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
          })
        }
      }
    })
  })
  
  // Platform breakdown
  const platforms = {}
  newLeadsToday.forEach(lead => {
    platforms[lead.source] = (platforms[lead.source] || 0) + 1
  })
  
  // Section summary
  const sectionSummary = sections.map(s => ({
    title: s.title,
    color: s.color || '#888',
    count: (s.leads || []).length,
    newToday: (s.leads || []).filter(l => {
      if (!l.created_at) return false
      return new Date(l.created_at).toDateString() === today.toDateString()
    }).length
  })).filter(s => s.count > 0)
  
  // Platform labels
  const platformLabels = {
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    email: 'Email',
    whatsapp: 'WhatsApp',
    dm: 'Direct Message',
    cold_call: 'Cold Call',
    referral: 'Referral',
    website: 'Website',
    instagram_warmup: 'IG Warm-Up',
    manual: 'Handmatig',
    other: 'Overig'
  }

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>MY ARC Daily Report - ${dateStr}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #191919;
      color: #E8E8E8;
      font-size: 14px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page { size: A4; margin: 0; }
    @media print {
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #191919;
      padding: 35px 45px;
      position: relative;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 18px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .report-logo {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .report-logo svg { width: 24px; height: 24px; fill: white; }
    .report-title { font-size: 22px; font-weight: 800; color: #fff; }
    .report-subtitle { font-size: 12px; color: #888; margin-top: 2px; }
    .section { margin-bottom: 22px; }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .section-title { font-size: 15px; font-weight: 600; color: #fff; }
    .section-badge { padding: 3px 10px; background: rgba(16,185,129,0.15); border-radius: 6px; font-size: 11px; font-weight: 600; color: #10b981; }
    .progress-container {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 22px;
    }
    .progress-bar { height: 10px; background: rgba(0,0,0,0.4); border-radius: 5px; overflow: hidden; }
    .progress-fill {
      height: 100%;
      width: ${progress}%;
      background: ${progress >= 90 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : progress >= 70 ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'};
      border-radius: 5px;
      transition: width 0.3s ease;
    }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
    .metric-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 14px;
    }
    .metric-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .metric-value { font-size: 24px; font-weight: 800; color: #fff; }
    .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 12px; background: rgba(255,255,255,0.03); font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #ddd; }
    .data-table tr:hover td { background: rgba(255,255,255,0.02); }
    .section-tag { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .tag { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-right: 6px; }
    .callout { padding: 16px; border-radius: 10px; margin-bottom: 16px; background: rgba(245,158,11,0.1); border-left: 3px solid #f59e0b; color: #fbbf24; font-size: 13px; }
    .page-footer {
      position: absolute;
      bottom: 25px;
      left: 45px;
      right: 45px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #444;
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 12px;
    }
    .name-cell { font-weight: 600; color: #fff !important; }
    .time-cell { color: #888 !important; font-size: 11px; }
  </style>
</head>
<body>

<!-- PAGE 1: METRICS & OVERVIEW -->
<div class="page">
  <div class="report-header">
    <div style="display: flex; align-items: center; gap: 14px;">
      <div class="report-logo">
        <svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div>
        <div class="report-title">MY ARC Daily Report</div>
        <div class="report-subtitle">Coach: ${coachName}</div>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 13px; color: #aaa;">${dateStr}</div>
      <div style="font-size: 11px; color: #666;">Gegenereerd om ${timeStr}</div>
    </div>
  </div>

  <!-- Progress Section -->
  <div class="progress-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <span style="font-size: 13px; font-weight: 600; color: #fff;">Dagelijks Doel: ${dailyGoal} leads</span>
      <span style="font-size: 18px; font-weight: 800; color: ${progress >= 90 ? '#10b981' : progress >= 70 ? '#f59e0b' : '#ef4444'};">${progress}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: #666;">
      <span>${newOutreach} bereikt</span>
      <span>${remaining} nog te gaan</span>
    </div>
  </div>

  <!-- Daily Activity -->
  <div class="section">
    <div class="section-header">
      <span>📊</span>
      <span class="section-title">Dagelijkse Activiteit</span>
    </div>
    <div class="metrics-grid">
      <div class="metric-card" style="background: linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%); border-color: rgba(59,130,246,0.25);">
        <div class="metric-label">Follow-ups</div>
        <div class="metric-value" style="color: #3b82f6;">${followUps}</div>
      </div>
      <div class="metric-card" style="background: linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%); border-color: rgba(139,92,246,0.25);">
        <div class="metric-label">Totale Interacties</div>
        <div class="metric-value" style="color: #8b5cf6;">${totalTouches}</div>
      </div>
      <div class="metric-card" style="background: linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%); border-color: rgba(245,158,11,0.25);">
        <div class="metric-label">Bewegingen</div>
        <div class="metric-value" style="color: #f59e0b;">${totalMovements}</div>
      </div>
      <div class="metric-card" style="background: linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(236,72,153,0.04) 100%); border-color: rgba(236,72,153,0.25);">
        <div class="metric-label">Reply Tracking</div>
        <div class="metric-value" style="color: #ec4899;">${totalReplies}</div>
      </div>
    </div>
  </div>

  <!-- Pipeline Progress -->
  <div class="section">
    <div class="section-header">
      <span>🎯</span>
      <span class="section-title">Pipeline Voortgang</span>
    </div>
    <div class="two-columns">
      <div class="metric-card" style="background: linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%); border-color: rgba(139,92,246,0.25);">
        <div class="metric-label">In Gesprek</div>
        <div class="metric-value" style="color: #8b5cf6;">${conversation.count}</div>
      </div>
      <div class="metric-card" style="background: linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%); border-color: rgba(16,185,129,0.25);">
        <div class="metric-label">Calls Ingepland</div>
        <div class="metric-value" style="color: #10b981;">${callScheduled.count}</div>
      </div>
    </div>
  </div>

  <!-- Platform Breakdown -->
  <div class="section">
    <div class="section-header">
      <span>📱</span>
      <span class="section-title">Platform Breakdown</span>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      ${Object.entries(platforms).map(([platform, count]) => {
        const colors = {
          instagram: { bg: 'rgba(236,72,153,0.2)', color: '#ec4899' },
          linkedin: { bg: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
          email: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
          whatsapp: { bg: 'rgba(16,185,129,0.2)', color: '#10b981' }
        }
        const style = colors[platform] || { bg: 'rgba(255,255,255,0.1)', color: '#888' }
        return `<span class="tag" style="background: ${style.bg}; color: ${style.color};">${platformLabels[platform] || platform}: ${count}</span>`
      }).join('') || '<span style="color: #555;">Geen data beschikbaar</span>'}
    </div>
  </div>

  <!-- Section Overview -->
  <div class="section">
    <div class="section-header">
      <span>📋</span>
      <span class="section-title">Sectie Overzicht</span>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
      ${sectionSummary.map(s => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid ${s.color}50; border-left: 3px solid ${s.color}; border-radius: 8px; padding: 10px 14px; min-width: 130px;">
          <div style="font-size: 10px; color: ${s.color}; font-weight: 600; margin-bottom: 2px;">${s.title.substring(0, 16)}</div>
          <div style="font-size: 22px; font-weight: 800; color: #fff;">${s.count}</div>
          ${s.newToday > 0 ? `<div style="font-size: 9px; color: #10b981; margin-top: 2px;">+${s.newToday} vandaag</div>` : ''}
        </div>
      `).join('')}
    </div>
  </div>

  <div class="page-footer">
    <span>MY ARC Daily Report</span>
    <span>Pagina 1 van 2</span>
  </div>
</div>

<!-- PAGE 2: MOVEMENTS & NEW LEADS -->
<div class="page">
  <div class="report-header">
    <div style="display: flex; align-items: center; gap: 14px;">
      <div class="report-logo">
        <svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div>
        <div class="report-title">Bewegingen & Leads</div>
        <div class="report-subtitle">${dateStr}</div>
      </div>
    </div>
  </div>

  <!-- Lead Movements Table -->
  <div class="section">
    <div class="section-header">
      <span>🔄</span>
      <span class="section-title">Lead Bewegingen</span>
      <span class="section-badge">${movementsList.length}</span>
    </div>
    ${movementsList.length > 0 ? `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 30%;">Lead</th>
            <th style="width: 28%;">Van</th>
            <th style="width: 28%;">Naar</th>
            <th style="width: 14%;">Tijd</th>
          </tr>
        </thead>
        <tbody>
          ${movementsList.slice(0, 18).map(m => {
            const fromColor = getSectionColor(m.from)
            const toColor = getSectionColor(m.to)
            return `
            <tr>
              <td class="name-cell">${m.leadName || 'Onbekend'}</td>
              <td>
                <span class="section-tag" style="background: ${fromColor}20; color: ${fromColor}; border: 1px solid ${fromColor}40;">
                  ${(m.from || 'Onbekend').substring(0, 18)}
                </span>
              </td>
              <td>
                <span class="section-tag" style="background: ${toColor}20; color: ${toColor}; border: 1px solid ${toColor}40;">
                  ${(m.to || 'Onbekend').substring(0, 18)}
                </span>
              </td>
              <td class="time-cell">${m.time || '-'}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
      ${movementsList.length > 18 ? `<div class="callout">📋 Nog ${movementsList.length - 18} bewegingen niet getoond</div>` : ''}
    ` : `
      <div class="callout" style="background: rgba(16,185,129,0.08); border-color: #10b981; color: #34d399;">
        📭 Geen bewegingen vandaag geregistreerd
      </div>
    `}
  </div>

  <!-- New Leads Table -->
  <div class="section">
    <div class="section-header">
      <span>✨</span>
      <span class="section-title">Nieuwe Leads</span>
      <span class="section-badge">${newLeadsToday.length}</span>
    </div>
    ${newLeadsToday.length > 0 ? `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 30%;">Naam</th>
            <th style="width: 22%;">Platform</th>
            <th style="width: 30%;">Sectie</th>
            <th style="width: 18%;">Tijd</th>
          </tr>
        </thead>
        <tbody>
          ${newLeadsToday.slice(0, 18).map(lead => {
            const platformStyle = {
              instagram: { bg: 'rgba(236,72,153,0.2)', color: '#ec4899' },
              linkedin: { bg: 'rgba(59,130,246,0.2)', color: '#3b82f6' }
            }
            const pStyle = platformStyle[lead.source] || { bg: 'rgba(255,255,255,0.1)', color: '#888' }
            return `
            <tr>
              <td class="name-cell">${lead.name}</td>
              <td>
                <span class="tag" style="background: ${pStyle.bg}; color: ${pStyle.color};">
                  ${platformLabels[lead.source] || lead.source}
                </span>
              </td>
              <td>
                <span class="section-tag" style="background: ${lead.sectionColor}20; color: ${lead.sectionColor}; border: 1px solid ${lead.sectionColor}40;">
                  ${lead.section.substring(0, 18)}
                </span>
              </td>
              <td class="time-cell">${lead.time}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
      ${newLeadsToday.length > 18 ? `<div class="callout">📋 Nog ${newLeadsToday.length - 18} leads niet getoond</div>` : ''}
    ` : `
      <div class="callout" style="background: rgba(16,185,129,0.08); border-color: #10b981; color: #34d399;">
        📭 Geen nieuwe leads vandaag toegevoegd
      </div>
    `}
  </div>

  <div class="page-footer">
    <span>MY ARC Daily Report</span>
    <span>Pagina 2 van 2</span>
  </div>
</div>

</body>
</html>
  `

  // Open print window
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      setTimeout(() => printWindow.print(), 500)
    }
  } else {
    alert('Pop-up geblokkeerd. Sta pop-ups toe voor deze site.')
  }
}

export default exportDailyReport
