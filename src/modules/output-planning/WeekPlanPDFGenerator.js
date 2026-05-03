// src/modules/output-planning/WeekPlanPDFGenerator.js
// PREMIUM PDF GENERATOR - Week Planning Export
// Pure HTML generation with SVG Lucide icons - Opens in new window for print

/**
 * Lucide SVG icons in gold
 */
const ICONS = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  
  camera: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  
  target: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  
  share: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`,
  
  image: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  
  video: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`,
  
  megaphone: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
  
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  
  brain: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>`,
  
  utensils: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  
  dumbbell: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>`,
  
  messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8860b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,

  check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  
  lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  
  fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
  
  externalLink: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`
}

// Type configurations
const STORY_TYPES = {
  personal: { label: 'Persoonlijk', icon: 'camera', color: '#8b5cf6' },
  lead_magnet: { label: 'Lead Magnet (Poll)', icon: 'target', color: '#f59e0b' },
  content_push: { label: 'Content Push', icon: 'share', color: '#3b82f6' }
}

const POST_TYPES = {
  photo: { label: 'Foto Post', icon: 'image', color: '#ec4899' },
  lead_magnet: { label: 'Lead Magnet', icon: 'target', color: '#f59e0b' },
  video: { label: 'Uitleg Video', icon: 'video', color: '#ef4444' },
  announcement: { label: 'Aankondiging', icon: 'megaphone', color: '#10b981' }
}

const COMMUNITY_GROUPS = {
  mindset: { label: 'Mindset', icon: 'brain', color: '#8b5cf6' },
  voeding: { label: 'Voeding', icon: 'utensils', color: '#10b981' },
  gym: { label: 'Gym', icon: 'dumbbell', color: '#f97316' },
  community: { label: 'Community', icon: 'messageCircle', color: '#3b82f6' },
  announcement: { label: 'Aankondiging', icon: 'megaphone', color: '#FFD700' }
}

const DAYS = [
  { id: 'monday', label: 'Maandag' },
  { id: 'tuesday', label: 'Dinsdag' },
  { id: 'wednesday', label: 'Woensdag' },
  { id: 'thursday', label: 'Donderdag' },
  { id: 'friday', label: 'Vrijdag' },
  { id: 'saturday', label: 'Zaterdag' },
  { id: 'sunday', label: 'Zondag' }
]

/**
 * Format week range for display
 */
function formatWeekRange(monday) {
  const start = new Date(monday)
  const end = new Date(monday)
  end.setDate(end.getDate() + 6)
  
  const options = { day: 'numeric', month: 'long' }
  return `${start.toLocaleDateString('nl-NL', options)} - ${end.toLocaleDateString('nl-NL', options)} ${start.getFullYear()}`
}

/**
 * Get date for specific day
 */
function getDayDate(monday, dayIndex) {
  const date = new Date(monday)
  date.setDate(date.getDate() + dayIndex)
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

/**
 * Get icon SVG with custom color
 */
function getIcon(iconKey, color = '#b8860b') {
  const icon = ICONS[iconKey] || ICONS.calendar
  if (color && color !== '#b8860b') {
    return icon.replace(/stroke="[^"]*"/g, `stroke="${color}"`)
  }
  return icon
}

/**
 * Generate complete HTML for week plan PDF
 */
export function generateWeekPlanPDFHTML(dayItems, currentWeekMonday) {
  const weekRange = formatWeekRange(currentWeekMonday)
  
  // Group items by day
  const getItemsForDay = (dayId) => dayItems.filter(item => item.day_of_week === dayId)
  const getItemsByType = (dayId, type) => dayItems.filter(item => item.day_of_week === dayId && item.item_type === type)
  
  // Calculate stats
  const totalItems = dayItems.length
  const completedItems = dayItems.filter(i => i.completed).length
  
  // Generate day pages HTML
  const dayPagesHTML = DAYS.map((day, dayIndex) => {
    const stories = getItemsByType(day.id, 'story')
    const posts = getItemsByType(day.id, 'post')
    const community = getItemsByType(day.id, 'community')
    const gym = getItemsByType(day.id, 'gym')
    const dayDate = getDayDate(currentWeekMonday, dayIndex)
    const dayTotal = stories.length + posts.length + community.length + gym.length
    
    return `
    <!-- DAY PAGE: ${day.label} -->
    <div class="page">
        <div class="page-inner">
            <div class="page-header">
                <div class="page-number">Dag ${dayIndex + 1} van 7</div>
                <h2 class="page-title">
                    ${day.label}
                    <span class="page-title-date">${dayDate}</span>
                </h2>
                <div class="gold-line"></div>
                ${dayTotal > 0 ? `<div class="day-stats">${dayTotal} items gepland</div>` : ''}
            </div>

            <div class="two-col">
                <div class="col">
                    ${renderSection('Stories', 'camera', stories, 'story_type', STORY_TYPES)}
                    ${renderSection('Posts / Reels', 'image', posts, 'post_type', POST_TYPES)}
                </div>
                <div class="col">
                    ${renderSection('Community', 'users', community, 'community_group', COMMUNITY_GROUPS)}
                    ${renderGymSection(gym)}
                    ${renderNotesBox()}
                </div>
            </div>

            <div class="page-footer">
                <span class="footer-logo">MY ARC Output</span>
                <span>${day.label} | Pagina ${dayIndex + 2} van 8</span>
            </div>
        </div>
    </div>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Week Planning - ${weekRange}</title>
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
            margin: 15px 0;
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
            font-size: 72px;
            font-weight: 400;
            letter-spacing: -2px;
            line-height: 0.9;
            margin-bottom: 10px;
        }
        .cover-title-bold { font-weight: 900; font-style: italic; }
        .cover-date {
            font-size: 14px;
            color: #666;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 25px;
        }
        .cover-for {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e0e0e0;
        }
        .cover-stats { display: flex; gap: 50px; justify-content: center; }
        .cover-stat { text-align: center; }
        .cover-stat-value {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            font-weight: 700;
            color: #b8860b;
        }
        .cover-stat-label {
            font-size: 10px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #888;
            margin-top: 5px;
        }
        .cover-bottom {
            padding: 40px 50px;
            background: #fafafa;
            border-top: 1px solid #e0e0e0;
        }
        .cover-bottom-content {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .cover-bottom-text {
            font-size: 12px;
            color: #666;
        }
        .cover-bottom-brand {
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            color: #1a1a1a;
            font-weight: 600;
        }

        /* PAGE INNER */
        .page-inner {
            padding: 40px 50px;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .page-header { margin-bottom: 25px; }
        .page-number {
            font-size: 10px;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #b8860b;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .page-title {
            font-family: 'Playfair Display', serif;
            font-size: 38px;
            font-weight: 700;
            line-height: 1;
            color: #1a1a1a;
            display: flex;
            align-items: baseline;
            gap: 15px;
        }
        .page-title-date {
            font-size: 16px;
            font-weight: 400;
            color: #888;
            font-family: 'Inter', sans-serif;
        }
        .day-stats {
            font-size: 13px;
            color: #666;
            margin-top: 5px;
        }

        /* TWO COLUMN */
        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 35px;
            flex: 1;
        }
        .col { display: flex; flex-direction: column; }

        /* SECTION */
        .section { margin-bottom: 25px; }
        .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e0e0e0;
        }
        .section-icon {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, rgba(184, 134, 11, 0.1), rgba(212, 168, 75, 0.05));
            border: 1px solid rgba(184, 134, 11, 0.25);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .section-icon svg { width: 16px; height: 16px; }
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .section-count {
            font-size: 10px;
            background: #fafafa;
            border: 1px solid #e0e0e0;
            padding: 2px 8px;
            border-radius: 10px;
            color: #666;
        }

        /* ITEMS */
        .item-list { list-style: none; padding: 0; margin: 0; }
        .item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .item:last-child { border-bottom: none; }
        .item-checkbox {
            width: 18px;
            height: 18px;
            border: 2px solid #d0d0d0;
            border-radius: 4px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .item-checkbox-done {
            background: #dcfce7;
            border-color: #059669;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .item-content { flex: 1; }
        .item-type {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 3px;
        }
        .item-type-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; }
        .item-type-icon svg { width: 14px; height: 14px; }
        .item-type-label {
            font-size: 11px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .item-description {
            font-size: 11px;
            color: #666;
            line-height: 1.5;
        }
        .item-goal {
            font-size: 10px;
            color: #b8860b;
            font-style: italic;
            margin-top: 3px;
        }
        
        /* REFERENCE ITEMS */
        .item-references {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #e0e0e0;
        }
        .item-ref {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            margin-bottom: 6px;
            padding: 6px 8px;
            background: #fafafa;
            border-radius: 4px;
            border-left: 2px solid #e0e0e0;
        }
        .item-ref:last-child { margin-bottom: 0; }
        .item-ref-problem { border-left-color: #f59e0b; background: #fffbeb; }
        .item-ref-pdf { border-left-color: #ef4444; background: #fef2f2; }
        .item-ref-content { border-left-color: #3b82f6; background: #eff6ff; }
        .item-ref-icon {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .item-ref-content-wrap { flex: 1; }
        .item-ref-title {
            font-size: 10px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 2px;
        }
        .item-ref-detail {
            font-size: 9px;
            color: #666;
            line-height: 1.4;
        }
        .item-ref-link {
            font-size: 9px;
            color: #3b82f6;
            word-break: break-all;
        }

        /* EMPTY STATE */
        .empty-state {
            font-size: 11px;
            color: #999;
            font-style: italic;
            padding: 10px 0;
        }

        /* GYM SECTION */
        .gym-section {
            background: #fafafa;
            border: 1px solid #e0e0e0;
            border-left: 3px solid #f97316;
            padding: 15px 18px;
            margin-bottom: 20px;
        }
        .gym-header {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .gym-checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #d0d0d0;
            border-radius: 4px;
        }
        .gym-label {
            font-size: 13px;
            font-weight: 600;
            color: #1a1a1a;
        }

        /* NOTES BOX */
        .notes-box {
            background: #fafafa;
            border-left: 3px solid #b8860b;
            padding: 15px 18px;
            margin-top: auto;
        }
        .notes-title {
            font-family: 'Playfair Display', serif;
            font-size: 13px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 10px;
        }
        .notes-line {
            border-bottom: 1px solid #e0e0e0;
            height: 22px;
        }

        /* FOOTER */
        .page-footer {
            margin-top: auto;
            padding-top: 15px;
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
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print PDF</button>

    <!-- PAGINA 1: COVER -->
    <div class="page">
        <div class="cover">
            <div class="cover-top">
                <div class="cover-label">Content Planning</div>
                <h1 class="cover-title">
                    Week<br>
                    <span class="cover-title-bold">Planning</span>
                </h1>
                <div class="cover-date">${weekRange}</div>
                <div class="gold-line gold-line-center"></div>
                <div class="cover-for">
                    <div class="cover-stats">
                        <div class="cover-stat">
                            <div class="cover-stat-value">${totalItems}</div>
                            <div class="cover-stat-label">Items</div>
                        </div>
                        <div class="cover-stat">
                            <div class="cover-stat-value">7</div>
                            <div class="cover-stat-label">Dagen</div>
                        </div>
                        <div class="cover-stat">
                            <div class="cover-stat-value">${completedItems}</div>
                            <div class="cover-stat-label">Voltooid</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="cover-bottom">
                <div class="cover-bottom-content">
                    ${ICONS.sparkles}
                    <div>
                        <div class="cover-bottom-text">Gegenereerd met</div>
                        <div class="cover-bottom-brand">MY ARC Output Systeem</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    ${dayPagesHTML}

</body>
</html>
  `
}

/**
 * Render reference items (problem, pdf, content)
 */
function renderReferences(item) {
  const refs = []
  
  // Problem reference
  if (item.problem) {
    refs.push(`
      <div class="item-ref item-ref-problem">
        <div class="item-ref-icon">${ICONS.lightbulb}</div>
        <div class="item-ref-content-wrap">
          <div class="item-ref-title">💡 ${item.problem.problem_title}</div>
          ${item.problem.solution_approach ? `<div class="item-ref-detail"><strong>Oplossing:</strong> ${item.problem.solution_approach}</div>` : ''}
          ${item.problem.content_angle ? `<div class="item-ref-detail"><strong>Content hoek:</strong> ${item.problem.content_angle}</div>` : ''}
        </div>
      </div>
    `)
  }
  
  // PDF reference
  if (item.pdf) {
    refs.push(`
      <div class="item-ref item-ref-pdf">
        <div class="item-ref-icon">${ICONS.fileText}</div>
        <div class="item-ref-content-wrap">
          <div class="item-ref-title">📄 ${item.pdf.title}</div>
          ${item.pdf.description ? `<div class="item-ref-detail">${item.pdf.description}</div>` : ''}
          ${item.pdf.drive_link ? `<div class="item-ref-link">🔗 ${item.pdf.drive_link}</div>` : ''}
        </div>
      </div>
    `)
  }
  
  // Content reference
  if (item.content) {
    refs.push(`
      <div class="item-ref item-ref-content">
        <div class="item-ref-icon">${ICONS.externalLink}</div>
        <div class="item-ref-content-wrap">
          <div class="item-ref-title">🎬 ${item.content.title}</div>
          ${item.content.description ? `<div class="item-ref-detail">${item.content.description}</div>` : ''}
          ${item.content.link ? `<div class="item-ref-link">🔗 ${item.content.link}</div>` : ''}
        </div>
      </div>
    `)
  }
  
  if (refs.length === 0) return ''
  
  return `<div class="item-references">${refs.join('')}</div>`
}

/**
 * Render a section (Stories, Posts, Community)
 */
function renderSection(title, iconKey, items, typeKey, typeConfigs) {
  const itemsHTML = items.length > 0 
    ? items.map(item => {
        const config = typeConfigs[item[typeKey]] || { label: 'Item', icon: 'calendar', color: '#666' }
        const referencesHTML = renderReferences(item)
        return `
          <li class="item">
              <div class="item-checkbox ${item.completed ? 'item-checkbox-done' : ''}">
                  ${item.completed ? ICONS.check : ''}
              </div>
              <div class="item-content">
                  <div class="item-type">
                      <span class="item-type-icon">${getIcon(config.icon, config.color)}</span>
                      <span class="item-type-label">${config.label}</span>
                  </div>
                  ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                  ${item.goal ? `<div class="item-goal">Doel: ${item.goal}</div>` : ''}
                  ${referencesHTML}
              </div>
          </li>
        `
      }).join('')
    : `<div class="empty-state">Geen items gepland</div>`

  return `
    <div class="section">
        <div class="section-header">
            <div class="section-icon">${getIcon(iconKey)}</div>
            <span class="section-title">${title}</span>
            ${items.length > 0 ? `<span class="section-count">${items.length}</span>` : ''}
        </div>
        <ul class="item-list">
            ${itemsHTML}
        </ul>
    </div>
  `
}

/**
 * Render gym section
 */
function renderGymSection(gymItems) {
  const hasGym = gymItems.length > 0
  const isDone = hasGym && gymItems[0].completed
  
  return `
    <div class="gym-section">
        <div class="gym-header">
            <div class="gym-checkbox ${isDone ? 'item-checkbox-done' : ''}" style="${isDone ? 'background: #dcfce7; border-color: #059669; display: flex; align-items: center; justify-content: center;' : ''}">
                ${isDone ? ICONS.check : ''}
            </div>
            ${getIcon('dumbbell', '#f97316')}
            <span class="gym-label">Gym Workout</span>
        </div>
    </div>
  `
}

/**
 * Render notes box
 */
function renderNotesBox() {
  return `
    <div class="notes-box">
        <div class="notes-title">Notities</div>
        <div class="notes-line"></div>
        <div class="notes-line"></div>
        <div class="notes-line"></div>
    </div>
  `
}

/**
 * Open week plan in new window for printing
 */
export function openWeekPlanForPrint(dayItems, currentWeekMonday) {
  const html = generateWeekPlanPDFHTML(dayItems, currentWeekMonday)
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  } else {
    alert('Popup geblokkeerd. Sta popups toe voor deze site.')
  }
}

export default { generateWeekPlanPDFHTML, openWeekPlanForPrint }
