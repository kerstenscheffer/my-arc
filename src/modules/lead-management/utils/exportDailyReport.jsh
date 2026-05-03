// src/modules/lead-management/utils/exportDailyReport.js
// NOTION-STYLE PDF v2.0 - Geoptimaliseerd voor snelle inzichten

/**
 * Generate a beautiful Notion-style PDF report
 * @param {Array} sections - Kanban sections with leads
 * @param {Object} config - { coachName, dailyGoal }
 * @param {Object} activityData - From getTodayActivity()
 * @param {Object} funnelData - From getTodayFunnelStats()
 */
export function exportDailyReport(sections = [], config = {}, activityData = {}, funnelData = {}) {
  const { coachName = 'Coach', dailyGoal = 100 } = config
  
  // ============================================================================
  // DATA EXTRACTION
  // ============================================================================
  
  const today = new Date()
  const dateStr = today.toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const timeStr = today.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  
  // Activity metrics
  const newOutreach = activityData.newOutreach || 0
  const followUps = activityData.followUps || 0
  const totalTouches = activityData.totalTouches || 0
  const totalMovements = activityData.totalMovements || 0
  const movementsList = activityData.movementsList || []
  
  // Funnel metrics
  const conversation = funnelData.conversation || { count: 0, leads: [] }
  const callScheduled = funnelData.callScheduled || { count: 0, leads: [] }
  
  // Progress calculation
  const progress = Math.min(100, Math.round((newOutreach / dailyGoal) * 100))
  const remaining = Math.max(0, dailyGoal - newOutreach)
  
  // Total reply count from all leads
  const totalReplies = sections.reduce((sum, section) => {
    return sum + (section.leads || []).reduce((leadSum, lead) => {
      return leadSum + (lead.reply_count || 0)
    }, 0)
  }, 0)
  
  // Build section color lookup: title -> color
  const sectionColorMap = {}
  sections.forEach(s => {
    sectionColorMap[s.title] = s.color || '#888'
    // Also map without emoji/spaces for fuzzy matching
    const cleanTitle = s.title.replace(/[^\w\s]/g, '').trim().toLowerCase()
    sectionColorMap[cleanTitle] = s.color || '#888'
  })
  
  // Helper to get section color
  const getSectionColor = (title) => {
    if (!title) return '#888'
    if (sectionColorMap[title]) return sectionColorMap[title]
    // Try fuzzy match
    const cleanTitle = title.replace(/[^\w\s]/g, '').trim().toLowerCase()
    if (sectionColorMap[cleanTitle]) return sectionColorMap[cleanTitle]
    // Check if any key contains this title
    for (const [key, color] of Object.entries(sectionColorMap)) {
      if (key.toLowerCase().includes(cleanTitle) || cleanTitle.includes(key.toLowerCase())) {
        return color
      }
    }
    return '#888'
  }
  
  // New leads today with names
  const newLeadsToday = []
  sections.forEach(section => {
    (section.leads || []).forEach(lead => {
      if (lead.created_at) {
        const created = new Date(lead.created_at)
        if (created.toDateString() === today.toDateString()) {
          newLeadsToday.push({
            name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Geen naam',
            source: lead.lead_source || 'manual',
            section: section.title,
            sectionColor: section.color || '#888',
            time: created.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
          })
        }
      }
    })
  })
  
  // Platform breakdown
  const platforms = {}
  newLeadsToday.forEach(lead => {
    const src = lead.source || 'manual'
    platforms[src] = (platforms[src] || 0) + 1
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
  })).filter(s => s.count > 0 || s.newToday > 0)
  
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
  
  // ============================================================================
  // NOTION-STYLE HTML TEMPLATE - V2.0 (Geen cover, direct metrics)
  // ============================================================================
  
  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MY ARC Daily Report - ${dateStr}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* ============ RESET & BASE ============ */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #191919;
      color: #E8E8E8;
      font-size: 14px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* ============ PRINT SETTINGS ============ */
    @page {
      size: A4;
      margin: 0;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .page {
        page-break-after: always;
        page-break-inside: avoid;
      }
      
      .page:last-child {
        page-break-after: auto;
      }
    }
    
    /* ============ PAGE LAYOUT ============ */
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #191919;
      position: relative;
      padding: 35px 45px;
    }
    
    /* ============ HEADER ============ */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .report-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    .report-logo {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }
    
    .report-logo svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    
    .report-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
    }
    
    .report-subtitle {
      font-size: 12px;
      color: #888;
      margin-top: 2px;
    }
    
    .report-header-right {
      text-align: right;
    }
    
    .report-date {
      font-size: 13px;
      color: #aaa;
      font-weight: 500;
    }
    
    .report-time {
      font-size: 11px;
      color: #666;
    }
    
    /* ============ SECTION HEADERS ============ */
    .section {
      margin-bottom: 22px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    
    .section-icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }
    
    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
    }
    
    .section-badge {
      padding: 3px 10px;
      background: rgba(16, 185, 129, 0.15);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #10b981;
    }
    
    /* ============ PROGRESS BAR ============ */
    .progress-container {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 22px;
    }
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .progress-label {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
    }
    
    .progress-percentage {
      font-size: 16px;
      font-weight: 800;
      color: ${progress >= 90 ? '#10b981' : progress >= 70 ? '#f59e0b' : '#ef4444'};
    }
    
    .progress-bar {
      height: 10px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 5px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      width: ${progress}%;
      background: ${progress >= 90 
        ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' 
        : progress >= 70 
          ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' 
          : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'};
      border-radius: 5px;
    }
    
    .progress-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 11px;
      color: #666;
    }
    
    /* ============ METRICS GRID ============ */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 22px;
    }
    
    .metrics-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 22px;
    }
    
    .metric-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 14px;
    }
    
    .metric-card.success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%);
      border-color: rgba(16, 185, 129, 0.25);
    }
    
    .metric-card.info {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%);
      border-color: rgba(59, 130, 246, 0.25);
    }
    
    .metric-card.purple {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%);
      border-color: rgba(139, 92, 246, 0.25);
    }
    
    .metric-card.pink {
      background: linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.04) 100%);
      border-color: rgba(236, 72, 153, 0.25);
    }
    
    .metric-label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      font-family: 'SF Mono', 'Monaco', monospace;
    }
    
    .metric-value.green { color: #10b981; }
    .metric-value.blue { color: #3b82f6; }
    .metric-value.purple { color: #8b5cf6; }
    .metric-value.pink { color: #ec4899; }
    
    .metric-sub {
      font-size: 10px;
      color: #666;
      margin-top: 3px;
    }
    
    /* ============ DATA TABLE ============ */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    
    .data-table th {
      text-align: left;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 10px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .data-table td {
      padding: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: #ddd;
    }
    
    .data-table .name-cell {
      font-weight: 600;
      color: #fff;
    }
    
    .data-table .time-cell {
      font-family: 'SF Mono', 'Monaco', monospace;
      font-size: 11px;
      color: #888;
    }
    
    /* ============ DYNAMIC COLOR TAG ============ */
    .section-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 600;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    /* ============ CALLOUT BOXES ============ */
    .callout {
      display: flex;
      gap: 10px;
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 14px;
    }
    
    .callout.info {
      background: rgba(59, 130, 246, 0.1);
      border-left: 3px solid #3b82f6;
    }
    
    .callout.warning {
      background: rgba(245, 158, 11, 0.1);
      border-left: 3px solid #f59e0b;
    }
    
    .callout-icon {
      font-size: 16px;
      flex-shrink: 0;
    }
    
    .callout-text {
      font-size: 12px;
      color: #ccc;
    }
    
    /* ============ TAGS / PILLS ============ */
    .tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 600;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    
    .tag.green { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .tag.blue { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .tag.purple { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
    .tag.pink { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
    .tag.gray { background: rgba(255, 255, 255, 0.1); color: #888; }
    
    /* ============ FOOTER ============ */
    .page-footer {
      position: absolute;
      bottom: 25px;
      left: 45px;
      right: 45px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #444;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 12px;
    }
    
    /* ============ TWO COLUMN LAYOUT ============ */
    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
  </style>
</head>
<body>

  <!-- ============ PAGE 1: METRICS & OVERVIEW ============ -->
  <div class="page">
    <!-- Header -->
    <div class="report-header">
      <div class="report-header-left">
        <div class="report-logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <div>
          <div class="report-title">MY ARC Daily Report</div>
          <div class="report-subtitle">Coach: ${coachName}</div>
        </div>
      </div>
      <div class="report-header-right">
        <div class="report-date">${dateStr}</div>
        <div class="report-time">Gegenereerd om ${timeStr}</div>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-header">
        <span class="progress-label">Dagelijks Doel: ${dailyGoal} nieuwe leads</span>
        <span class="progress-percentage">${progress}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-footer">
        <span>${newOutreach} bereikt</span>
        <span>${remaining} nog te gaan</span>
      </div>
    </div>
    
    <!-- Core Metrics - 4 kolommen -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">📊</span>
        <span class="section-title">Dagelijkse Activiteit</span>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card info">
          <div class="metric-label">Follow-ups</div>
          <div class="metric-value blue">${followUps}</div>
          <div class="metric-sub">Bestaande leads</div>
        </div>
        
        <div class="metric-card purple">
          <div class="metric-label">Totale Interacties</div>
          <div class="metric-value purple">${totalTouches}</div>
          <div class="metric-sub">Alle contacten</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Bewegingen</div>
          <div class="metric-value" style="color: #f59e0b;">${totalMovements}</div>
          <div class="metric-sub">Sectie switches</div>
        </div>
        
        <div class="metric-card pink">
          <div class="metric-label">Reply Tracking</div>
          <div class="metric-value pink">${totalReplies}</div>
          <div class="metric-sub">Totaal reacties</div>
        </div>
      </div>
    </div>
    
    <!-- Pipeline Voortgang - 2 kolommen -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">🎯</span>
        <span class="section-title">Pipeline Voortgang</span>
      </div>
      
      <div class="two-columns">
        <div class="metric-card purple">
          <div class="metric-label">In Gesprek</div>
          <div class="metric-value purple">${conversation.count}</div>
          <div class="metric-sub">Sectie met "gesprek" of "kwalificatie"</div>
        </div>
        
        <div class="metric-card success">
          <div class="metric-label">Calls Ingepland</div>
          <div class="metric-value green">${callScheduled.count}</div>
          <div class="metric-sub">Sectie met "call" of "afspraak"</div>
        </div>
      </div>
    </div>
    
    <!-- Platform Breakdown -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">📱</span>
        <span class="section-title">Platform Breakdown</span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${Object.entries(platforms).length > 0 
          ? Object.entries(platforms).map(([platform, count]) => `
              <span class="tag ${platform === 'instagram' ? 'pink' : platform === 'linkedin' ? 'blue' : 'gray'}">
                ${platformLabels[platform] || platform}: ${count}
              </span>
            `).join('')
          : '<span style="color: #555; font-size: 12px;">Geen platform data vandaag</span>'
        }
      </div>
    </div>
    
    <!-- Section Summary -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">📋</span>
        <span class="section-title">Sectie Overzicht</span>
      </div>
      
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${sectionSummary.map(s => `
          <div style="
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid ${s.color}50;
            border-left: 3px solid ${s.color};
            border-radius: 8px;
            padding: 10px 14px;
            min-width: 130px;
          ">
            <div style="font-size: 10px; color: ${s.color}; font-weight: 600; margin-bottom: 3px;">
              ${s.title.substring(0, 16)}${s.title.length > 16 ? '..' : ''}
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #fff;">${s.count}</div>
            ${s.newToday > 0 ? `
              <div style="font-size: 9px; color: #10b981; margin-top: 2px;">
                +${s.newToday} vandaag
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="page-footer">
      <span>MY ARC Daily Report</span>
      <span>Pagina 1 van 2</span>
    </div>
  </div>

  <!-- ============ PAGE 2: MOVEMENTS & NEW LEADS ============ -->
  <div class="page">
    <!-- Header -->
    <div class="report-header">
      <div class="report-header-left">
        <div class="report-logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <div>
          <div class="report-title">Bewegingen & Leads</div>
          <div class="report-subtitle">${dateStr}</div>
        </div>
      </div>
    </div>
    
    <!-- Today's Movements -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">🔄</span>
        <span class="section-title">Lead Bewegingen Vandaag</span>
        <span class="section-badge">${movementsList.length}</span>
      </div>
      
      ${movementsList.length > 0 ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Van</th>
              <th>Naar</th>
              <th>Tijd</th>
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
        ${movementsList.length > 18 ? `
          <div class="callout info">
            <span class="callout-icon">ℹ️</span>
            <span class="callout-text">+ ${movementsList.length - 18} meer bewegingen (niet getoond)</span>
          </div>
        ` : ''}
      ` : `
        <div class="callout warning">
          <span class="callout-icon">📭</span>
          <span class="callout-text">Geen lead bewegingen vandaag geregistreerd</span>
        </div>
      `}
    </div>
    
    <!-- New Leads Today -->
    <div class="section">
      <div class="section-header">
        <span class="section-icon">✨</span>
        <span class="section-title">Nieuwe Leads Vandaag</span>
        <span class="section-badge">${newLeadsToday.length}</span>
      </div>
      
      ${newLeadsToday.length > 0 ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Platform</th>
              <th>Sectie</th>
              <th>Tijd</th>
            </tr>
          </thead>
          <tbody>
            ${newLeadsToday.slice(0, 18).map(lead => `
              <tr>
                <td class="name-cell">${lead.name}</td>
                <td>
                  <span class="tag ${lead.source === 'instagram' ? 'pink' : lead.source === 'linkedin' ? 'blue' : 'gray'}">
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
            `).join('')}
          </tbody>
        </table>
        ${newLeadsToday.length > 18 ? `
          <div class="callout info">
            <span class="callout-icon">ℹ️</span>
            <span class="callout-text">+ ${newLeadsToday.length - 18} meer leads (niet getoond)</span>
          </div>
        ` : ''}
      ` : `
        <div class="callout warning">
          <span class="callout-icon">📭</span>
          <span class="callout-text">Geen nieuwe leads vandaag toegevoegd</span>
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

  // ============================================================================
  // OPEN PRINT DIALOG
  // ============================================================================
  
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  } else {
    alert('Pop-up geblokkeerd. Sta pop-ups toe voor deze site.')
  }
}

export default exportDailyReport
