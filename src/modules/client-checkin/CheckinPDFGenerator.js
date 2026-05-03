// src/modules/client-checkin/CheckinPDFGenerator.js
// PREMIUM PDF GENERATOR v2 - Luxe witte stijl met gouden Lucide icons
// Updates: SVG icons ipv emoji, 2 pagina's voor secties, coach message

/**
 * Lucide SVG icons in goud
 */
const ICONS = {
  utensils: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  
  partyPopper: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z"/></svg>`,
  
  moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  
  dumbbell: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>`,
  
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,
  
  zap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
  
  target: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  
  alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  
  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>`,
  
  messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`
}

/**
 * Generate premium HTML for check-in PDF
 * @param {Object} checkinData - Check-in data from database
 * @param {string} clientName - Client full name
 * @param {Object} coachData - Optional coach data {name, photo_url, initials}
 */
export function generateCheckinPDFHTML(checkinData, clientName, coachData = {}) {
  const date = new Date(checkinData.checkin_date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const details = checkinData.section_details || {}
  const coachMessage = checkinData.coach_message || ''
  
  // Coach info met Kersten's defaults
  const coachName = coachData.name || 'Kersten'
  const coachPhoto = coachData.photo_url || 'https://i.ibb.co/601NSR8W/IMG-4752.jpg'
  const coachInitials = coachData.initials || coachName.charAt(0).toUpperCase()
  
  // Section configuration with SVG icons
  const sections = [
    { key: 'voeding', title: 'Voeding', icon: ICONS.utensils, scoreKey: 'voeding_score', description: 'Eetgewoontes en voedingskeuzes' },
    { key: 'weekend', title: 'Weekend', icon: ICONS.partyPopper, scoreKey: 'weekend_score', description: 'Balans in het weekend' },
    { key: 'slaap', title: 'Slaap', icon: ICONS.moon, scoreKey: 'slaap_score', description: 'Slaapkwaliteit en rust' },
    { key: 'training', title: 'Training', icon: ICONS.dumbbell, scoreKey: 'training_score', description: 'Workout consistentie en intensiteit' },
    { key: 'algemeen', title: 'Algemeen Welzijn', icon: ICONS.sparkles, scoreKey: 'energie_score', description: 'Energie en motivatie' }
  ]

  // Score icons for grid
  const scoreIcons = [
    { icon: ICONS.utensils, label: 'Voeding', score: checkinData.voeding_score },
    { icon: ICONS.partyPopper, label: 'Weekend', score: checkinData.weekend_score },
    { icon: ICONS.moon, label: 'Slaap', score: checkinData.slaap_score },
    { icon: ICONS.dumbbell, label: 'Training', score: checkinData.training_score },
    { icon: ICONS.zap, label: 'Energie', score: checkinData.energie_score },
    { icon: ICONS.target, label: 'Motivatie', score: checkinData.motivatie_score }
  ]

  // Calculate average score
  const scores = [
    checkinData.voeding_score,
    checkinData.weekend_score,
    checkinData.slaap_score,
    checkinData.training_score,
    checkinData.energie_score,
    checkinData.motivatie_score
  ].filter(s => s != null)
  
  const avgScore = scores.length > 0 
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '-'

  // Count items
  let totalStruggles = 0
  let totalAfspraken = 0
  sections.forEach(section => {
    const sectionData = details[section.key] || {}
    if (sectionData.struggles?.trim()) totalStruggles++
    if (sectionData.afspraken?.trim()) totalAfspraken++
  })

  // Split sections for two pages
  const sectionsPage1 = sections.slice(0, 3) // Voeding, Weekend, Slaap
  const sectionsPage2 = sections.slice(3)    // Training, Algemeen

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wekelijkse Check-in - ${clientName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #ffffff;
            color: #1a1a1a;
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @page { size: A4; margin: 0; }
        .page {
            width: 210mm;
            height: 297mm;
            background: #ffffff;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden;
            position: relative;
        }
        .page:last-child { page-break-after: avoid; }
        
        .gold { color: #b8860b; }
        .gold-line {
            width: 60px;
            height: 2px;
            background: linear-gradient(90deg, #b8860b, #d4a84b);
            margin: 20px 0;
        }
        .gold-line-center { margin: 20px auto; }

        /* COVER */
        .cover { display: flex; flex-direction: column; height: 100%; }
        .cover-top {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px 50px;
            text-align: center;
        }
        .cover-label {
            font-size: 11px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: #b8860b;
            font-weight: 600;
            margin-bottom: 30px;
        }
        .cover-title {
            font-family: 'Playfair Display', serif;
            font-size: 56px;
            font-weight: 400;
            letter-spacing: -2px;
            line-height: 1.1;
            margin-bottom: 10px;
        }
        .cover-title-bold { font-weight: 900; font-style: italic; }
        .cover-date {
            font-size: 14px;
            color: #666;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 20px;
        }
        .cover-for {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e0e0e0;
        }
        .cover-for-label {
            font-size: 10px;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 8px;
        }
        .cover-name {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 600;
            color: #b8860b;
        }
        .cover-bottom {
            padding: 40px 50px;
            background: #fafafa;
            border-top: 1px solid #e0e0e0;
        }
        .cover-stats { display: flex; gap: 40px; justify-content: center; }
        .cover-stat { text-align: center; }
        .cover-stat-value {
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            color: #1a1a1a;
        }
        .cover-stat-label {
            font-size: 10px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #888;
            margin-top: 5px;
        }

        /* PAGE INNER */
        .page-inner {
            padding: 50px;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .page-header { margin-bottom: 30px; }
        .page-number {
            font-size: 10px;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #b8860b;
            margin-bottom: 15px;
        }
        .page-title {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 400;
            line-height: 1.1;
            margin-bottom: 5px;
        }
        .page-title-italic { font-style: italic; font-weight: 700; }

        /* SCORES GRID */
        .scores-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        .score-card {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 20px;
            text-align: center;
        }
        .score-card-highlight { border-color: #b8860b; border-width: 2px; }
        .score-icon {
            width: 40px;
            height: 40px;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .score-icon svg { width: 28px; height: 28px; }
        .score-label {
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 8px;
        }
        .score-value {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
        }
        .score-bar {
            margin-top: 12px;
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            overflow: hidden;
        }
        .score-bar-fill { height: 100%; border-radius: 2px; }

        /* SECTION BLOCKS */
        .section-block { margin-bottom: 40px; }
        .section-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        .section-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, rgba(184, 134, 11, 0.1), rgba(212, 168, 75, 0.1));
            border: 1px solid rgba(184, 134, 11, 0.3);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .section-icon svg { width: 20px; height: 20px; }
        .section-info { flex: 1; }
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .section-desc { font-size: 11px; color: #888; margin-top: 2px; }
        .section-score-badge {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 8px 16px;
            border-radius: 4px;
        }
        .section-score-value {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 700;
        }

        /* CONTENT BOXES */
        .content-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        .content-box { padding: 18px 20px; border-radius: 4px; }
        .struggles-box { background: #fef2f2; border-left: 3px solid #dc2626; }
        .afspraken-box { background: #f0fdf4; border-left: 3px solid #059669; }
        .content-box-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
        }
        .content-box-title {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .struggles-box .content-box-title { color: #dc2626; }
        .afspraken-box .content-box-title { color: #059669; }
        .content-box-text { font-size: 12px; line-height: 1.6; color: #444; }
        .content-box-empty { font-size: 11px; color: #999; font-style: italic; }

        /* ACTION PLAN */
        .action-plan {
            background: #fffbeb;
            border: 2px solid #b8860b;
            padding: 25px 30px;
            margin-top: 20px;
        }
        .action-plan-title {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 5px;
        }
        .action-plan-subtitle { font-size: 11px; color: #888; margin-bottom: 20px; }
        .action-list { list-style: none; padding: 0; }
        .action-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 12px 0;
            border-bottom: 1px solid rgba(184, 134, 11, 0.2);
        }
        .action-item:last-child { border-bottom: none; }
        .action-number {
            width: 26px;
            height: 26px;
            background: linear-gradient(135deg, #b8860b, #d4a84b);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            flex-shrink: 0;
        }
        .action-content { flex: 1; }
        .action-category {
            font-size: 9px;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #b8860b;
            font-weight: 600;
            margin-bottom: 3px;
        }
        .action-text { font-size: 13px; line-height: 1.5; color: #333; }

        /* COACH MESSAGE */
        .coach-message {
            background: linear-gradient(135deg, #fafafa, #f5f5f5);
            border: 1px solid #e0e0e0;
            border-left: 4px solid #b8860b;
            padding: 20px 25px;
            margin-top: 30px;
            position: relative;
        }
        .coach-message-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }
        .coach-message-label {
            font-size: 10px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #b8860b;
            font-weight: 600;
        }
        .coach-message-text {
            font-size: 14px;
            line-height: 1.7;
            color: #333;
            font-style: italic;
        }
        .coach-signature {
            margin-top: 15px;
            font-size: 12px;
            color: #666;
            text-align: right;
        }

        /* PREMIUM COACH BUBBLE */
        .coach-bubble {
            margin-top: 35px;
            background: linear-gradient(135deg, #faf9f7 0%, #f5f3ef 100%);
            border-radius: 20px;
            padding: 25px 30px;
            position: relative;
            border: 1px solid rgba(184, 134, 11, 0.2);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
        }
        .coach-bubble::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #b8860b 0%, #d4af37 50%, #b8860b 100%);
            border-radius: 20px 20px 0 0;
        }
        .coach-bubble-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 18px;
        }
        .coach-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #b8860b;
            box-shadow: 0 4px 15px rgba(184, 134, 11, 0.25);
        }
        .coach-avatar-placeholder {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #b8860b 0%, #d4af37 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 700;
            border: 3px solid #b8860b;
            box-shadow: 0 4px 15px rgba(184, 134, 11, 0.25);
        }
        .coach-info {
            flex: 1;
        }
        .coach-title {
            font-family: 'Playfair Display', serif;
            font-size: 16px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 3px 0;
        }
        .coach-subtitle {
            font-size: 11px;
            color: #b8860b;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
        }
        .coach-bubble-content {
            position: relative;
            padding-left: 20px;
        }
        .coach-bubble-content::before {
            content: '"';
            position: absolute;
            left: 0;
            top: -5px;
            font-family: 'Playfair Display', serif;
            font-size: 40px;
            color: #b8860b;
            opacity: 0.4;
            line-height: 1;
        }
        .coach-bubble-text {
            font-size: 14px;
            line-height: 1.8;
            color: #444;
            font-style: italic;
            margin: 0;
        }
        .coach-bubble-footer {
            margin-top: 18px;
            padding-top: 15px;
            border-top: 1px solid rgba(184, 134, 11, 0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .coach-cta {
            font-size: 11px;
            color: #888;
        }
        .coach-brand {
            font-family: 'Playfair Display', serif;
            font-size: 12px;
            color: #b8860b;
            font-weight: 600;
        }

        /* HIGHLIGHT BOX */
        .highlight-box {
            background: #fafafa;
            border-left: 3px solid #b8860b;
            padding: 15px 20px;
            margin: 20px 0;
        }
        .highlight-text { font-size: 13px; line-height: 1.6; color: #555; }

        /* FOOTER */
        .page-footer {
            margin-top: auto;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #999;
        }
        .footer-logo {
            font-family: 'Playfair Display', serif;
            font-size: 14px;
            color: #1a1a1a;
        }

        /* PRINT */
        .print-btn {
            position: fixed;
            top: 30px;
            right: 30px;
            background: #1a1a1a;
            color: #ffffff;
            border: none;
            padding: 14px 26px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            z-index: 9999;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .print-btn:hover { background: #b8860b; }
        @media print { .print-btn { display: none; } }

        .divider { width: 100%; height: 1px; background: #e0e0e0; margin: 25px 0; }
        .divider-gold { background: linear-gradient(90deg, transparent, #b8860b, transparent); }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print PDF</button>

    <!-- PAGINA 1: COVER -->
    <div class="page">
        <div class="cover">
            <div class="cover-top">
                <div class="cover-label">Wekelijkse Check-in</div>
                <h1 class="cover-title">
                    Voortgang<br>
                    <span class="cover-title-bold">Rapport</span>
                </h1>
                <div class="cover-date">${date}</div>
                <div class="gold-line gold-line-center"></div>
                <div class="cover-for">
                    <div class="cover-for-label">Opgesteld voor</div>
                    <div class="cover-name">${clientName}</div>
                </div>
            </div>
            <div class="cover-bottom">
                <div class="cover-stats">
                    <div class="cover-stat">
                        <div class="cover-stat-value">${avgScore}</div>
                        <div class="cover-stat-label">Gemiddelde Score</div>
                    </div>
                    <div class="cover-stat">
                        <div class="cover-stat-value">${totalStruggles}</div>
                        <div class="cover-stat-label">Uitdagingen</div>
                    </div>
                    <div class="cover-stat">
                        <div class="cover-stat-value">${totalAfspraken}</div>
                        <div class="cover-stat-label">Afspraken</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- PAGINA 2: SCORES OVERZICHT -->
    <div class="page">
        <div class="page-inner">
            <div class="page-header">
                <div class="page-number">Overzicht</div>
                <h2 class="page-title">
                    Scores<br>
                    <span class="page-title-italic">Deze Week</span>
                </h2>
                <div class="gold-line"></div>
            </div>
            <div class="scores-grid">
                ${scoreIcons.map(item => renderScoreCard(item.icon, item.label, item.score)).join('')}
            </div>
            <div class="divider divider-gold"></div>
            <div class="highlight-box">
                <div class="highlight-text">
                    <strong>Samenvatting:</strong> ${generateSummaryText(checkinData, avgScore)}
                </div>
            </div>
            <div class="page-footer">
                <span class="footer-logo">MY ARC</span>
                <span>${clientName} | Pagina 2</span>
            </div>
        </div>
    </div>

    <!-- PAGINA 3: UITDAGINGEN & AFSPRAKEN - DEEL 1 -->
    <div class="page">
        <div class="page-inner">
            <div class="page-header">
                <div class="page-number">Details | Deel 1</div>
                <h2 class="page-title">
                    Uitdagingen &<br>
                    <span class="page-title-italic">Afspraken</span>
                </h2>
                <div class="gold-line"></div>
            </div>
            ${sectionsPage1.map(section => renderSectionBlock(section, checkinData, details)).join('')}
            <div class="page-footer">
                <span class="footer-logo">MY ARC</span>
                <span>${clientName} | Pagina 3</span>
            </div>
        </div>
    </div>

    <!-- PAGINA 4: UITDAGINGEN & AFSPRAKEN - DEEL 2 -->
    <div class="page">
        <div class="page-inner">
            <div class="page-header">
                <div class="page-number">Details | Deel 2</div>
                <h2 class="page-title">
                    Uitdagingen &<br>
                    <span class="page-title-italic">Afspraken</span>
                </h2>
                <div class="gold-line"></div>
            </div>
            ${sectionsPage2.map(section => renderSectionBlock(section, checkinData, details)).join('')}
            <div class="page-footer">
                <span class="footer-logo">MY ARC</span>
                <span>${clientName} | Pagina 4</span>
            </div>
        </div>
    </div>

    <!-- PAGINA 5: ACTIEPLAN -->
    <div class="page">
        <div class="page-inner">
            <div class="page-header">
                <div class="page-number">Actie</div>
                <h2 class="page-title">
                    Jouw<br>
                    <span class="page-title-italic">Actieplan</span>
                </h2>
                <div class="gold-line"></div>
            </div>
            <div class="action-plan">
                <div class="action-plan-title">Focus Punten Deze Week</div>
                <div class="action-plan-subtitle">Concrete afspraken om aan te werken</div>
                <ul class="action-list">
                    ${generateActionItems(sections, details)}
                </ul>
            </div>
            
            ${coachMessage ? `
            <div class="coach-bubble">
                <div class="coach-bubble-header">
                    ${coachPhoto 
                        ? `<img src="${coachPhoto}" alt="${coachName}" class="coach-avatar" />`
                        : `<div class="coach-avatar-placeholder">${coachInitials}</div>`
                    }
                    <div class="coach-info">
                        <div class="coach-title">Bericht van ${coachName}</div>
                        <div class="coach-subtitle">Persoonlijke feedback</div>
                    </div>
                </div>
                <div class="coach-bubble-content">
                    <p class="coach-bubble-text">${coachMessage}</p>
                </div>
                <div class="coach-bubble-footer">
                    <span class="coach-cta">Vragen? Plan een call via de app.</span>
                    <span class="coach-brand">MY ARC</span>
                </div>
            </div>
            ` : `
            <div class="highlight-box" style="margin-top: 30px;">
                <div class="highlight-text">
                    <strong>Tip:</strong> Focus op maximaal 2-3 punten tegelijk. 
                    Kleine, consistente verbeteringen leiden tot grote resultaten op de lange termijn.
                </div>
            </div>
            `}

            <div class="page-footer">
                <span class="footer-logo">MY ARC</span>
                <span>${clientName} | Pagina 5</span>
            </div>
        </div>
    </div>

</body>
</html>
  `
}

function renderScoreCard(iconSvg, label, score) {
  const scoreValue = score != null ? score : '-'
  const scoreNum = parseFloat(score) || 0
  const percentage = (scoreNum / 10) * 100
  
  const getColor = (s) => {
    if (s >= 8) return '#059669'
    if (s >= 6) return '#eab308'
    if (s >= 4) return '#f97316'
    return '#dc2626'
  }
  
  const color = score != null ? getColor(scoreNum) : '#999'
  const isHighlight = scoreNum >= 8

  return `
    <div class="score-card ${isHighlight ? 'score-card-highlight' : ''}">
        <div class="score-icon">${iconSvg}</div>
        <div class="score-label">${label}</div>
        <div class="score-value" style="color: ${color}">${scoreValue}</div>
        <div class="score-bar">
            <div class="score-bar-fill" style="width: ${percentage}%; background: ${color}"></div>
        </div>
    </div>
  `
}

function renderSectionBlock(section, checkinData, details) {
  const score = checkinData[section.scoreKey]
  const sectionData = details[section.key] || {}
  const struggles = sectionData.struggles?.trim() || ''
  const afspraken = sectionData.afspraken?.trim() || ''

  const getColor = (s) => {
    if (s >= 8) return '#059669'
    if (s >= 6) return '#eab308'
    if (s >= 4) return '#f97316'
    return '#dc2626'
  }
  
  const scoreColor = score != null ? getColor(parseFloat(score)) : '#999'

  return `
    <div class="section-block">
        <div class="section-header">
            <div class="section-icon">${section.icon}</div>
            <div class="section-info">
                <div class="section-title">${section.title}</div>
                <div class="section-desc">${section.description}</div>
            </div>
            ${score != null ? `
                <div class="section-score-badge">
                    <div class="section-score-value" style="color: ${scoreColor}">${score}</div>
                </div>
            ` : ''}
        </div>
        <div class="content-row">
            <div class="content-box struggles-box">
                <div class="content-box-header">
                    ${ICONS.alertTriangle}
                    <span class="content-box-title">Uitdagingen</span>
                </div>
                ${struggles 
                    ? `<div class="content-box-text">${struggles}</div>`
                    : `<div class="content-box-empty">Geen specifieke uitdagingen deze week</div>`
                }
            </div>
            <div class="content-box afspraken-box">
                <div class="content-box-header">
                    ${ICONS.checkCircle}
                    <span class="content-box-title">Afspraken</span>
                </div>
                ${afspraken 
                    ? `<div class="content-box-text">${afspraken}</div>`
                    : `<div class="content-box-empty">Geen specifieke afspraken gemaakt</div>`
                }
            </div>
        </div>
    </div>
  `
}

function generateSummaryText(checkinData, avgScore) {
  const avg = parseFloat(avgScore)
  if (avg >= 8) return `Een uitstekende week met een gemiddelde van ${avgScore}! Je bent goed op weg en de resultaten zijn zichtbaar. Blijf dit volhouden.`
  if (avg >= 6) return `Een goede week met een gemiddelde van ${avgScore}. Er is ruimte voor verbetering op sommige gebieden, maar de basis is sterk.`
  if (avg >= 4) return `Een gemiddelde week met een score van ${avgScore}. Focus deze week op de afspraken die we hebben gemaakt om progressie te boeken.`
  return `Een uitdagende week met een gemiddelde van ${avgScore}. Geen zorgen - we pakken dit samen aan. Focus op kleine, haalbare stappen.`
}

function generateActionItems(sections, details) {
  const items = []
  let counter = 1
  
  sections.forEach(section => {
    const sectionData = details[section.key] || {}
    const afspraken = sectionData.afspraken?.trim()
    
    if (afspraken) {
      items.push(`
        <li class="action-item">
            <div class="action-number">${counter}</div>
            <div class="action-content">
                <div class="action-category">${section.title}</div>
                <div class="action-text">${afspraken}</div>
            </div>
        </li>
      `)
      counter++
    }
  })
  
  if (items.length === 0) {
    return `
      <li class="action-item">
          <div class="action-number">-</div>
          <div class="action-content">
              <div class="action-text" style="color: #888; font-style: italic;">
                  Geen specifieke afspraken gemaakt deze week. 
                  Bespreek met je coach wat de focus wordt.
              </div>
          </div>
      </li>
    `
  }
  
  return items.join('')
}

export function openCheckinForPrint(checkinData, clientName, coachData = {}) {
  const html = generateCheckinPDFHTML(checkinData, clientName, coachData)
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  } else {
    alert('Popup geblokkeerd. Sta popups toe voor deze site.')
  }
}

export function generateCoachNotesText(checkinData, clientName) {
  const date = new Date(checkinData.checkin_date).toLocaleDateString('nl-NL')
  const details = checkinData.section_details || {}
  
  let output = `COACH NOTITIES - ${clientName}\nDatum: ${date}\n${'='.repeat(50)}\n\n`
  
  const sections = ['voeding', 'weekend', 'slaap', 'training', 'algemeen']
  const titles = { voeding: 'Voeding', weekend: 'Weekend', slaap: 'Slaap', training: 'Training', algemeen: 'Algemeen' }
  
  sections.forEach(key => {
    const sectionData = details[key] || {}
    if (sectionData.coach_notes?.trim()) {
      output += `📝 ${titles[key]}:\n${sectionData.coach_notes}\n\n`
    }
  })
  
  if (checkinData.coach_notes?.trim()) {
    output += `📋 Algemene Notities:\n${checkinData.coach_notes}\n\n`
  }
  
  return output.split('\n').length <= 5 ? output + `Geen coach notities voor deze check-in.\n` : output
}

export default { generateCheckinPDFHTML, openCheckinForPrint, generateCoachNotesText }
