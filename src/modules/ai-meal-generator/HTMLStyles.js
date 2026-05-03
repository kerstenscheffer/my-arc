// src/modules/ai-meal-generator/HTMLStyles.js
// MY ARC MEAL PLAN PDF - CSS STYLING
// All styling for Men's Health inspired meal plan PDFs

/**
 * Generate complete CSS for meal plan HTML
 * @returns {string} Complete CSS block
 */
export const generateStyles = () => {
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
           PAGE 1: COVER
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
           PAGE 2: INHOUDSOPGAVE
           ================================ */
        .toc-page {
            height: 100%;
            background: var(--dark);
            color: var(--white);
            padding: 40px;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
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

        .section-title {
            font-family: 'Anton', sans-serif;
            font-size: 42px;
            line-height: 1;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            margin-bottom: 30px;
        }

        .toc-grid {
            display: grid;
            gap: 15px;
        }

        .toc-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 25px;
            background: rgba(255, 215, 0, 0.08);
            border-left: 4px solid var(--gold);
            transition: all 0.2s ease;
        }

        .toc-item:hover {
            background: rgba(255, 215, 0, 0.12);
            transform: translateX(5px);
        }

        .toc-item-content {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .toc-icon {
            font-size: 24px;
        }

        .toc-text {
            display: flex;
            flex-direction: column;
        }

        .toc-label {
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--white);
        }

        .toc-desc {
            font-size: 12px;
            color: rgba(255,255,255,0.6);
            margin-top: 3px;
        }

        .toc-page-num {
            font-family: 'Anton', sans-serif;
            font-size: 28px;
            color: var(--gold);
        }

        .toc-divider {
            margin: 20px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        /* ================================
           PAGE 3: INTRO
           ================================ */
        .intro-page {
            height: 100%;
            background: var(--dark);
            color: var(--white);
            padding: 40px;
        }

        .coach-bubble {
            display: flex;
            align-items: flex-start;
            gap: 18px;
            padding: 20px;
            background: rgba(255, 215, 0, 0.15);
            border: 2px solid var(--gold);
            border-radius: 12px;
            margin-bottom: 25px;
        }

        .coach-photo {
            width: 65px;
            height: 65px;
            border-radius: 50%;
            border: 3px solid var(--gold);
            overflow: hidden;
            flex-shrink: 0;
        }

        .coach-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .coach-message {
            flex: 1;
        }

        .coach-name {
            font-size: 15px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--gold);
            margin-bottom: 8px;
        }

        .coach-text {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            line-height: 1.6;
        }

        .coach-text strong {
            color: var(--gold);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
        }

        .stat-box {
            background: rgba(255, 215, 0, 0.1);
            border: 2px solid var(--gold);
            padding: 18px;
            text-align: center;
        }

        .stat-value {
            font-family: 'Anton', sans-serif;
            font-size: 28px;
            color: var(--gold);
            display: block;
            line-height: 1;
        }

        .stat-label {
            font-size: 9px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: rgba(255,255,255,0.6);
            margin-top: 6px;
        }

        .content-box {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid var(--gold);
            padding: 20px;
            margin-bottom: 20px;
        }

        .content-title {
            font-family: 'Anton', sans-serif;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            color: var(--gold);
        }

        .content-list {
            list-style: none;
        }

        .content-list li {
            font-size: 13px;
            color: rgba(255,255,255,0.9);
            margin-bottom: 10px;
            padding-left: 20px;
            position: relative;
            line-height: 1.5;
        }

        .content-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: var(--gold);
            font-weight: 800;
            font-size: 14px;
        }

        /* ================================
           PAGE 4: MEAL TIMING
           ================================ */
        .timing-page {
            height: 100%;
            background: var(--dark);
            color: var(--white);
            padding: 35px;
        }

        .timing-intro {
            background: rgba(255, 215, 0, 0.08);
            border-left: 4px solid var(--gold);
            padding: 20px;
            margin-bottom: 25px;
            font-size: 13px;
            line-height: 1.6;
            color: rgba(255,255,255,0.85);
        }

        .timing-grid {
            display: grid;
            gap: 15px;
        }

        .timing-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid var(--gold);
            padding: 18px;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 15px;
        }

        .timing-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .timing-icon i {
            color: var(--gold);
        }

        .timing-content h4 {
            font-family: 'Anton', sans-serif;
            font-size: 16px;
            color: var(--gold);
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .timing-time {
            font-size: 11px;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .timing-macro {
            font-size: 12px;
            color: rgba(255,255,255,0.7);
            margin-bottom: 10px;
        }

        .timing-why {
            font-size: 12px;
            color: rgba(255,255,255,0.8);
            line-height: 1.5;
        }

        .timing-why strong {
            color: var(--gold);
        }

        /* ================================
           PAGE 5: FLEXIBILITEIT
           ================================ */
        .flexibility-page {
            height: 100%;
            background: var(--dark);
            color: var(--white);
            padding: 35px;
        }

        .flex-intro {
            background: rgba(255, 215, 0, 0.08);
            border-left: 4px solid var(--gold);
            padding: 20px;
            margin-bottom: 25px;
            font-size: 13px;
            line-height: 1.6;
            color: rgba(255,255,255,0.85);
        }

        .flex-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .flex-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid var(--gold);
            padding: 18px;
        }

        .flex-card h4 {
            font-family: 'Anton', sans-serif;
            font-size: 14px;
            color: var(--gold);
            text-transform: uppercase;
            margin-bottom: 12px;
        }

        .flex-list {
            list-style: none;
            font-size: 12px;
            color: rgba(255,255,255,0.8);
            line-height: 1.6;
        }

        .flex-list li {
            margin-bottom: 8px;
            padding-left: 18px;
            position: relative;
        }

        .flex-list li::before {
            position: absolute;
            left: 0;
            font-weight: 800;
        }

        .flex-list.do li::before {
            content: '✅';
            color: #10b981;
        }

        .flex-list.dont li::before {
            content: '❌';
            color: #ef4444;
        }

        .flex-rules {
            grid-column: span 2;
            background: rgba(255, 215, 0, 0.08);
            border-left: 4px solid var(--gold);
            padding: 20px;
        }

        .flex-rules h4 {
            font-family: 'Anton', sans-serif;
            font-size: 16px;
            color: var(--gold);
            text-transform: uppercase;
            margin-bottom: 15px;
        }

        .flex-rules-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        /* ================================
           PAGE 6: SUPPLEMENTEN
           ================================ */
        .supplement-page {
            height: 100%;
            background: var(--dark);
            color: var(--white);
            padding: 35px;
        }

        .suppl-intro {
            background: rgba(255, 215, 0, 0.08);
            border-left: 4px solid var(--gold);
            padding: 20px;
            margin-bottom: 25px;
            font-size: 13px;
            line-height: 1.6;
            color: rgba(255,255,255,0.85);
        }

        .suppl-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }

        .suppl-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid var(--gold);
            padding: 14px;
        }

        .suppl-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .suppl-badge {
            display: inline-block;
            padding: 3px 8px;
            background: var(--gold);
            color: var(--black);
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            flex-shrink: 0;
        }

        .suppl-card h4 {
            font-family: 'Anton', sans-serif;
            font-size: 14px;
            color: var(--white);
            text-transform: uppercase;
            margin: 0;
        }

        .suppl-dose {
            font-size: 11px;
            color: var(--gold);
            margin-bottom: 8px;
            font-weight: 600;
        }

        .suppl-why {
            font-size: 10px;
            color: rgba(255,255,255,0.75);
            line-height: 1.5;
            margin-bottom: 8px;
        }

        .suppl-cost {
            font-size: 10px;
            color: rgba(255,255,255,0.6);
            font-style: italic;
        }

        .suppl-skip {
            grid-column: span 2;
            background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid #ef4444;
            padding: 18px;
        }

        .suppl-skip h4 {
            font-family: 'Anton', sans-serif;
            font-size: 14px;
            color: #ef4444;
            text-transform: uppercase;
            margin-bottom: 12px;
        }

        .suppl-total {
            grid-column: span 2;
            background: rgba(255, 215, 0, 0.15);
            border: 2px solid var(--gold);
            padding: 20px;
            text-align: center;
        }

        .suppl-total-value {
            font-family: 'Anton', sans-serif;
            font-size: 36px;
            color: var(--gold);
            line-height: 1;
        }

        .suppl-total-label {
            font-size: 12px;
            color: rgba(255,255,255,0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
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
           FINAL PAGE
           ================================ */
        .final-page {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .final-top {
            flex: 1;
            padding: 50px 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: var(--white);
        }

        .final-bottom {
            background: var(--dark);
            color: var(--white);
            padding: 40px;
        }

        .final-quote {
            font-family: 'Anton', sans-serif;
            font-size: 52px;
            line-height: 1;
            text-transform: uppercase;
            margin-bottom: 20px;
            color: var(--black);
        }

        .final-quote .gold {
            color: var(--gold);
        }

        .final-text {
            font-size: 15px;
            color: var(--gray);
            max-width: 450px;
            line-height: 1.6;
        }

        .cta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 25px;
        }

        .cta-item {
            text-align: center;
        }

        .cta-icon {
            width: 50px;
            height: 50px;
            background: var(--gold);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
        }

        .cta-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 8px;
            color: var(--white);
        }

        .cta-desc {
            font-size: 12px;
            color: rgba(255,255,255,0.6);
            line-height: 1.5;
        }

        .page-footer {
            position: absolute;
            bottom: 20px;
            left: 30px;
            right: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            font-weight: 600;
            color: var(--gray);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Print Button */
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

export default { generateStyles }
