// src/modules/ai-meal-generator/pdf-generator/sections/CoverPage.js
// COVER PAGE COMPONENT

/**
 * Generate cover page HTML
 * @param {string} clientName - Client name
 * @param {string} weekRange - Week date range
 * @param {Object} stats - Weekly statistics
 * @param {number} totalWeekCost - Total week cost
 * @returns {string} Cover page HTML
 */
export function generateCoverPage(clientName, weekRange, stats, totalWeekCost) {
  return `
    <!-- PAGE 1: COVER -->
    <div class="page">
      <div class="cover-page">
        <div class="cover-image"></div>
        <div class="cover-overlay"></div>
        
        <div class="cover-header">
          <div class="cover-logo">MY ARC NUTRITION</div>
          <div class="cover-date">${weekRange}</div>
        </div>
        
        <div class="cover-content">
          <div class="cover-tag">WEEK PLAN</div>
          
          <h1 class="cover-title">
            MY ARC NUTRITION - ${clientName.toUpperCase()}
          </h1>
          
          <p class="cover-subtitle">
            Succes met je voeding draait niet om perfectie. Het draait om het hebben van een 
            duidelijk plan dat bij jouw leven past.
          </p>
          
          <div class="cover-stats">
            <div class="cover-stat">
              <span class="cover-stat-value">${stats.avgCalories}</span>
              <span class="cover-stat-label">KCAL/DAG</span>
            </div>
            <div class="cover-stat">
              <span class="cover-stat-value">${stats.avgProtein}g</span>
              <span class="cover-stat-label">EIWIT/DAG</span>
            </div>
            <div class="cover-stat">
              <span class="cover-stat-value">€${Math.round(totalWeekCost)}</span>
              <span class="cover-stat-label">WEEK BUDGET</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate table of contents page
 * @returns {string} TOC page HTML
 */
export function generateTOCPage() {
  return `
    <!-- PAGE 2: INHOUDSOPGAVE -->
    <div class="page">
      <div class="toc-page" style="height: 100%; background: #0a0a0a; color: #fff; padding: 40px;">
        <div class="page-header">
          <span class="page-title">Inhoudsopgave</span>
          <span class="page-num">Pagina 1</span>
        </div>
        
        <h2 style="font-family: 'Anton', sans-serif; font-size: 42px; line-height: 1; text-transform: uppercase; margin-bottom: 30px;">
          JOUW COMPLETE GIDS
        </h2>
        
        <div style="display: grid; gap: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 25px; background: rgba(255, 215, 0, 0.08); border-left: 4px solid #FFD700;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="font-size: 24px;">📖</div>
              <div>
                <div style="font-size: 16px; font-weight: 700; text-transform: uppercase; color: #fff;">Introductie</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 3px;">Jouw complete week overzicht</div>
              </div>
            </div>
            <div style="font-family: 'Anton', sans-serif; font-size: 28px; color: #FFD700;">3</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 25px; background: rgba(255, 215, 0, 0.08); border-left: 4px solid #FFD700;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="font-size: 24px;">⏰</div>
              <div>
                <div style="font-size: 16px; font-weight: 700; text-transform: uppercase; color: #fff;">Maaltijd Timing</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 3px;">Wanneer eet je wat en waarom</div>
              </div>
            </div>
            <div style="font-family: 'Anton', sans-serif; font-size: 28px; color: #FFD700;">4-5</div>
          </div>
          
          <div style="margin: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 25px; background: rgba(255, 215, 0, 0.08); border-left: 4px solid #FFD700;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="font-size: 24px;">📅</div>
              <div>
                <div style="font-size: 16px; font-weight: 700; text-transform: uppercase; color: #fff;">7 Dagen Maaltijden</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 3px;">Maandag t/m zondag</div>
              </div>
            </div>
            <div style="font-family: 'Anton', sans-serif; font-size: 28px; color: #FFD700;">6-12</div>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate intro page
 * @param {Object} stats - Weekly statistics
 * @returns {string} Intro page HTML
 */
export function generateIntroPage(stats) {
  return `
    <!-- PAGE 3: INTRO -->
    <div class="page">
      <div style="height: 100%; background: #0a0a0a; color: #fff; padding: 35px;">
        <div class="page-header">
          <span class="page-title">Introductie</span>
          <span class="page-num">Pagina 2</span>
        </div>
        
        <h2 style="font-family: 'Anton', sans-serif; font-size: 42px; line-height: 1; text-transform: uppercase; margin-bottom: 20px;">
          JOUW COMPLETE WEEK
        </h2>
        
        <div style="display: flex; align-items: flex-start; gap: 18px; padding: 20px; background: rgba(255, 215, 0, 0.15); border: 2px solid #FFD700; border-radius: 12px; margin-bottom: 25px;">
          <div style="width: 65px; height: 65px; border-radius: 50%; border: 3px solid #FFD700; overflow: hidden; flex-shrink: 0; background: #1a1a1a;"></div>
          <div>
            <div style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #FFD700; margin-bottom: 8px;">
              Kersten — Jouw Coach
            </div>
            <p style="font-size: 14px; color: rgba(255,255,255,0.9); line-height: 1.6; margin-bottom: 6px;">
              <strong style="color: #FFD700;">Succes met je voeding</strong> draait niet om perfectie. Het draait om het hebben van een 
              <strong style="color: #FFD700;">duidelijk plan</strong> dat bij jouw leven past.
            </p>
            <p style="font-size: 14px; color: rgba(255,255,255,0.9); line-height: 1.6;">
              Dit weekplan neemt het denken weg. <strong style="color: #FFD700;">Alles is berekend</strong> - calorieën, eiwitten, 
              zelfs je boodschappenlijst. Volg het plan en de resultaten komen vanzelf.
            </p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px;">
          <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid #FFD700; padding: 18px; text-align: center;">
            <span style="font-family: 'Anton', sans-serif; font-size: 28px; color: #FFD700; display: block; line-height: 1;">
              ${stats.avgCalories}
            </span>
            <span style="font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px; display: block;">
              KCAL/DAG
            </span>
          </div>
          <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid #FFD700; padding: 18px; text-align: center;">
            <span style="font-family: 'Anton', sans-serif; font-size: 28px; color: #FFD700; display: block; line-height: 1;">
              ${stats.avgProtein}g
            </span>
            <span style="font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px; display: block;">
              EIWIT/DAG
            </span>
          </div>
          <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid #FFD700; padding: 18px; text-align: center;">
            <span style="font-family: 'Anton', sans-serif; font-size: 28px; color: #FFD700; display: block; line-height: 1;">
              ${stats.avgCarbs}g
            </span>
            <span style="font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px; display: block;">
              KOOLH/DAG
            </span>
          </div>
          <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid #FFD700; padding: 18px; text-align: center;">
            <span style="font-family: 'Anton', sans-serif; font-size: 28px; color: #FFD700; display: block; line-height: 1;">
              ${stats.avgFat}g
            </span>
            <span style="font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px; display: block;">
              VET/DAG
            </span>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate timing explanation pages
 * @param {string} trainingTime - Client's training time
 * @returns {string} Timing pages HTML
 */
export function generateTimingPages(trainingTime) {
  const hour = parseInt(trainingTime.split(':')[0])
  
  return `
    <!-- PAGE 4: MEAL TIMING -->
    <div class="page">
      <div style="height: 100%; background: #0a0a0a; color: #fff; padding: 35px;">
        <div class="page-header">
          <span class="page-title">Maaltijd Timing</span>
          <span class="page-num">Pagina 3</span>
        </div>
        
        <h2 style="font-family: 'Anton', sans-serif; font-size: 42px; line-height: 1; text-transform: uppercase; margin-bottom: 20px;">
          WANNEER EET JE WAT?
        </h2>
        
        <div style="background: rgba(255, 215, 0, 0.08); border-left: 4px solid #FFD700; padding: 20px; margin-bottom: 25px; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.85);">
          Je plan is afgestemd op <strong style="color: #FFD700;">training om ${trainingTime}</strong>. 
          Trainings dagen en rust dagen hebben <strong style="color: #FFD700;">verschillende meal timing</strong> voor optimale resultaten.
        </div>
        
        <div style="display: grid; gap: 15px;">
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-left: 4px solid #10b981; padding: 18px;">
            <h4 style="font-family: 'Anton', sans-serif; font-size: 16px; color: #10b981; text-transform: uppercase; margin-bottom: 8px;">
              🏋️ TRAININGSDAG
            </h4>
            <div style="font-size: 12px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 10px;">
              <strong style="color: #FFD700;">08:00</strong> - Ontbijt (Metabolisme kickstart)<br>
              <strong style="color: #FFD700;">11:30</strong> - Snack (Eiwit top-up)<br>
              <strong style="color: #FFD700;">14:00</strong> - Diner (Grote maaltijd VROEG)<br>
              <strong style="color: #FFD700;">${hour - 3}:00</strong> - Lunch (Pre-workout fuel, 3u voor training)<br>
              <strong style="color: #FFD700;">${hour - 1}:00</strong> - Snack (Pre-workout boost, 1u voor training)<br>
              <strong style="color: #10b981;">[${trainingTime} - TRAINING]</strong><br>
              <strong style="color: #FFD700;">${hour + 2}:00</strong> - Snack (Post-workout, 2u na training)<br>
              <strong style="color: #FFD700;">23:00</strong> - Voor bed (Caseïne)
            </div>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-left: 4px solid #3b82f6; padding: 18px;">
            <h4 style="font-family: 'Anton', sans-serif; font-size: 16px; color: #3b82f6; text-transform: uppercase; margin-bottom: 8px;">
              😴 RUSTDAG
            </h4>
            <div style="font-size: 12px; color: rgba(255,255,255,0.8); line-height: 1.6;">
              <strong style="color: #FFD700;">08:00</strong> - Ontbijt (Metabolisme kickstart)<br>
              <strong style="color: #FFD700;">11:30</strong> - Snack (Eiwit top-up)<br>
              <strong style="color: #FFD700;">14:00</strong> - Lunch (Middag maaltijd)<br>
              <strong style="color: #FFD700;">17:00</strong> - Snack (Tussendoor)<br>
              <strong style="color: #FFD700;">19:00</strong> - Diner (Avondmaaltijd)<br>
              <strong style="color: #FFD700;">21:00</strong> - Snack (Avond snack)<br>
              <strong style="color: #FFD700;">22:00</strong> - Voor bed (Caseïne)
            </div>
          </div>
        </div>
        
        <div style="margin-top: 25px; padding: 20px; background: rgba(255, 215, 0, 0.08); border-left: 4px solid #FFD700; font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.6;">
          <strong style="color: #FFD700;">💡 Belangrijke tip:</strong> Op trainingsdagen eet je de grote maaltijd 's middags (14:00) 
          zodat je lichaam genoeg tijd heeft om te verteren voor de training. Post-workout krijg je een lichtere snack voor herstel.
        </div>
      </div>
    </div>
  `
}

export default { 
  generateCoverPage, 
  generateTOCPage, 
  generateIntroPage,
  generateTimingPages 
}
