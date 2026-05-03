// src/modules/ai-meal-generator/pdf-generator/config/styleConfig.js
// PDF STYLING CONFIGURATION
// All CSS styles for meal plan PDF generation

/**
 * Generate complete CSS stylesheet for PDF
 * @returns {string} Complete CSS as string
 */
export function generatePDFStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --black: #1a1a1a;
      --dark: #0a0a0a;
      --white: #ffffff;
      --gold: #FFD700;
      --gold-dark: #D4AF37;
      --gray-light: #f5f5f5;
      --gray: #666666;
      --gray-dark: #333333;
    }

    body {
      background: var(--white);
      color: var(--black);
      font-family: 'Source Sans 3', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page { 
      size: A4; 
      margin: 0; 
    }

    .page {
      width: 210mm;
      height: 297mm;
      background: var(--white);
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
      position: relative;
    }

    .page:last-child { 
      page-break-after: avoid; 
    }

    /* ================================
       COVER PAGE
       ================================ */
    .cover-page {
      height: 100%;
      background: var(--dark);
      color: var(--white);
      position: relative;
      overflow: hidden;
    }

    .cover-image {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('https://i.ibb.co/YBXKM0Zz/1.png');
      background-size: cover;
      background-position: center;
      opacity: 0.7;
    }

    .cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.7) 100%);
    }

    .cover-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 25px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      border-bottom: 2px solid var(--gold);
    }

    .cover-logo {
      font-family: 'Anton', sans-serif;
      font-size: 24px;
      letter-spacing: 2px;
      color: var(--gold);
    }

    .cover-date {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.7);
    }

    .cover-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 50px 40px;
      z-index: 10;
    }

    .cover-tag {
      display: inline-block;
      padding: 8px 16px;
      background: var(--gold);
      color: var(--black);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .cover-title {
      font-family: 'Anton', sans-serif;
      font-size: 70px;
      line-height: 0.95;
      letter-spacing: -1px;
      text-transform: uppercase;
      margin-bottom: 15px;
    }

    .cover-subtitle {
      font-size: 16px;
      font-weight: 400;
      color: rgba(255,255,255,0.8);
      max-width: 450px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .cover-stats {
      display: flex;
      gap: 35px;
    }

    .cover-stat {
      display: flex;
      flex-direction: column;
    }

    .cover-stat-value {
      font-family: 'Anton', sans-serif;
      font-size: 42px;
      color: var(--gold);
      line-height: 1;
    }

    .cover-stat-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
      margin-top: 5px;
    }

    /* ================================
       DAY PAGES - 3x2 GRID (6 MEALS)
       ================================ */
    .day-page {
      height: 100%;
      padding: 30px;
      background: var(--dark);
      color: var(--white);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--gold);
    }

    .page-title {
      font-family: 'Anton', sans-serif;
      font-size: 14px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--gold);
    }

    .page-num {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255,255,255,0.5);
    }

    .day-header-large {
      font-family: 'Anton', sans-serif;
      font-size: 42px;
      line-height: 0.9;
      letter-spacing: -1px;
      text-transform: uppercase;
      margin-bottom: 12px;
      color: var(--white);
    }

    .day-header-large .gold {
      color: var(--gold);
    }

    .day-type-badge {
      display: inline-block;
      padding: 4px 12px;
      background: var(--gold);
      color: var(--black);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-left: 15px;
      border-radius: 4px;
    }

    .day-totals {
      display: flex;
      justify-content: space-between;
      padding: 12px 18px;
      background: #1a1a1a;
      border-left: 4px solid var(--gold);
      margin-bottom: 18px;
    }

    .day-total {
      text-align: center;
    }

    .day-total-value {
      font-family: 'Anton', sans-serif;
      font-size: 22px;
      color: var(--gold);
      line-height: 1;
    }

    .day-total-label {
      font-size: 9px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 4px;
    }

    /* 3x2 GRID voor 6 meals */
    .meals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .meal-card {
      background: #1a1a1a;
      border: 2px solid #2a2a2a;
      border-left: 4px solid var(--gold);
      overflow: hidden;
      page-break-inside: avoid;
    }

    .meal-photo {
      width: 100%;
      height: 75px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .meal-photo-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 6px 10px;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    }

    .meal-type {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gold);
    }

    .meal-content {
      padding: 12px;
    }

    .meal-function {
      font-size: 8px;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .meal-name {
      font-family: 'Anton', sans-serif;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: var(--white);
      flex: 1;
      line-height: 1.1;
    }

    .meal-calories {
      font-family: 'Anton', sans-serif;
      font-size: 20px;
      color: var(--gold);
      line-height: 1;
      margin-left: 8px;
    }

    .ingredients-list {
      background: rgba(0, 0, 0, 0.3);
      padding: 8px;
      margin-bottom: 8px;
    }

    .ingredient-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 10px;
    }

    .ingredient-row:last-child {
      border-bottom: none;
    }

    .ing-name {
      color: rgba(255, 255, 255, 0.8);
    }

    .ing-amount {
      color: var(--gold);
      font-weight: 700;
    }

    .ingredient-more {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.5);
      font-style: italic;
      padding-top: 4px;
    }

    .meal-macros {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .macro-badge {
      padding: 3px 8px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--gold);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.8);
    }

    /* ================================
       PRINT BUTTON
       ================================ */
    .print-btn {
      position: fixed;
      top: 25px;
      right: 25px;
      background: var(--gold);
      color: var(--black);
      border: none;
      padding: 12px 24px;
      font-family: 'Source Sans 3', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    }

    .print-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }

    @media print {
      .print-btn { display: none; }
      body { background: var(--white) !important; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `
}

export default { generatePDFStyles }
