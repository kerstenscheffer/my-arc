// src/modules/ai-meal-generator/HTMLPages.js
// MY ARC MEAL PLAN PDF - PAGE GENERATORS
// Individual page builders for complete meal plan PDF

import { DAY_NAMES, MEAL_TYPES, formatIngredientsCompact } from './HTMLHelpers.js'

/**
 * PAGE 1: Cover Page
 */
export const generateCoverPage = (clientName, weekRange, stats, totalWeekCost) => {
  return `
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
                        <span class="cover-stat-value">€${totalWeekCost}</span>
                        <span class="cover-stat-label">WEEK BUDGET</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
}

/**
 * PAGE 2: Table of Contents
 */
export const generateTOCPage = () => {
  return `
    <div class="page">
        <div class="toc-page">
            <div class="page-header">
                <span class="page-title">Inhoudsopgave</span>
                <span class="page-num">Pagina 1</span>
            </div>
            
            <h2 class="section-title">JOUW COMPLETE GIDS</h2>
            
            <div class="toc-grid">
                <div class="toc-item">
                    <div class="toc-item-content">
                        <div class="toc-icon"><i data-lucide="book-open" style="width: 24px; height: 24px; color: #FFD700;"></i></div>
                        <div class="toc-text">
                            <div class="toc-label">Introductie</div>
                            <div class="toc-desc">Jouw complete week overzicht</div>
                        </div>
                    </div>
                    <div class="toc-page-num">3</div>
                </div>
                
                <div class="toc-item">
                    <div class="toc-item-content">
                        <div class="toc-icon"><i data-lucide="clock" style="width: 24px; height: 24px; color: #FFD700;"></i></div>
                        <div class="toc-text">
                            <div class="toc-label">Maaltijd Timing</div>
                            <div class="toc-desc">Wanneer eet je wat en waarom</div>
                        </div>
                    </div>
                    <div class="toc-page-num">4-5</div>
                </div>
                
                <div class="toc-item">
                    <div class="toc-item-content">
                        <div class="toc-icon"><i data-lucide="repeat" style="width: 24px; height: 24px; color: #FFD700;"></i></div>
                        <div class="toc-text">
                            <div class="toc-label">Maaltijden Aanpassen</div>
                            <div class="toc-desc">Simpele regels & voorbeelden</div>
                        </div>
                    </div>
                    <div class="toc-page-num">6</div>
                </div>
                
                <div class="toc-item">
                    <div class="toc-item-content">
                        <div class="toc-icon"><i data-lucide="pill" style="width: 24px; height: 24px; color: #FFD700;"></i></div>
                        <div class="toc-text">
                            <div class="toc-label">Supplementen</div>
                            <div class="toc-desc">Basis stapel & opties</div>
                        </div>
                    </div>
                    <div class="toc-page-num">7</div>
                </div>
                
                <div class="toc-divider"></div>
                
                <div class="toc-item">
                    <div class="toc-item-content">
                        <div class="toc-icon"><i data-lucide="calendar-days" style="width: 24px; height: 24px; color: #FFD700;"></i></div>
                        <div class="toc-text">
                            <div class="toc-label">7 Dagen Maaltijden</div>
                            <div class="toc-desc">Maandag t/m zondag</div>
                        </div>
                    </div>
                    <div class="toc-page-num">8-14</div>
                </div>
                
                <div class="toc-item">
                    <div class="toc-item-content">
                        <div class="toc-icon"><i data-lucide="sparkles" style="width: 24px; height: 24px; color: #FFD700;"></i></div>
                        <div class="toc-text">
                            <div class="toc-label">Succes Formule</div>
                            <div class="toc-desc">Op naar resultaten!</div>
                        </div>
                    </div>
                    <div class="toc-page-num">15</div>
                </div>
            </div>
        </div>
    </div>
  `
}

/**
 * PAGE 3: Introduction
 */
export const generateIntroPage = (stats) => {
  return `
    <div class="page">
        <div class="intro-page">
            <div class="page-header">
                <span class="page-title">Introductie</span>
                <span class="page-num">Pagina 2</span>
            </div>
            
            <h2 class="section-title">JOUW COMPLETE WEEK</h2>
            
            <div class="coach-bubble">
                <div class="coach-photo">
                    <img src="https://i.ibb.co/601NSR8W/IMG-4752.jpg" alt="Kersten">
                </div>
                <div class="coach-message">
                    <div class="coach-name">Kersten — Jouw Coach</div>
                    <p class="coach-text">
                        <strong>Succes met je voeding</strong> draait niet om perfectie. Het draait om het hebben van een 
                        <strong>duidelijk plan</strong> dat bij jouw leven past.
                    </p>
                    <p class="coach-text" style="margin-top: 6px;">
                        Dit weekplan neemt het denken weg. <strong>Alles is berekend</strong> - calorieën, eiwitten, 
                        zelfs je boodschappenlijst. Volg het plan en de resultaten komen vanzelf.
                    </p>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-box">
                    <span class="stat-value">${stats.avgCalories}</span>
                    <span class="stat-label">KCAL/DAG</span>
                </div>
                <div class="stat-box">
                    <span class="stat-value">${stats.avgProtein}g</span>
                    <span class="stat-label">EIWIT/DAG</span>
                </div>
                <div class="stat-box">
                    <span class="stat-value">${stats.avgCarbs}g</span>
                    <span class="stat-label">KOOLH/DAG</span>
                </div>
                <div class="stat-box">
                    <span class="stat-value">${stats.avgFat}g</span>
                    <span class="stat-label">VET/DAG</span>
                </div>
            </div>
            
            <div class="content-box">
                <h3 class="content-title">Jouw Complete Week</h3>
                <ul class="content-list">
                    <li><strong>7 dagen</strong> aan maaltijden - ontbijt, lunch, diner & snacks</li>
                    <li><strong>${stats.uniqueIngredients} ingrediënten</strong> - alles wat je nodig hebt</li>
                    <li><strong>Perfect afgestemd</strong> op jouw doelen en voorkeuren</li>
                    <li><strong>Inclusief bereidingstips</strong> voor elke maaltijd</li>
                </ul>
            </div>
            
            <div class="content-box">
                <h3 class="content-title">Jouw Succesformule</h3>
                <ul class="content-list">
                    <li><strong>Meal prep op zondag:</strong> Bereid voor 3-4 dagen = geen stress doordeweeks</li>
                    <li><strong>Weeg je porties:</strong> De eerste week precies, daarna ken je de hoeveelheden</li>
                    <li><strong>80/20 regel:</strong> 80% volgens plan, 20% flexibiliteit voor het leven</li>
                    <li><strong>Water eerst:</strong> Begin elke maaltijd met een glas water</li>
                </ul>
            </div>
        </div>
    </div>
  `
}

/**
 * PAGE 4A & 4B: Meal Timing (2 pages)
 */
export const generateTimingPages = () => {
  return `
    <!-- PAGE 4A: MEAL TIMING - DEEL 1 -->
    <div class="page">
        <div class="timing-page">
            <div class="page-header">
                <span class="page-title">Maaltijd Timing - Deel 1</span>
                <span class="page-num">Pagina 3</span>
            </div>
            
            <h2 class="section-title">WANNEER EET JE WAT?</h2>
            
            <div class="timing-intro">
                Je lichaam heeft op verschillende momenten andere voedingsstoffen nodig. 
                Dit plan is strategisch getimed rondom je training voor maximale prestaties en herstel.
            </div>
            
            <div class="timing-grid">
                <div class="timing-card">
                    <div class="timing-icon">
                        <i data-lucide="sunrise" style="width: 28px; height: 28px;"></i>
                    </div>
                    <div class="timing-content">
                        <h4>Ontbijt</h4>
                        <div class="timing-time">07:00-08:00</div>
                        <div class="timing-macro">Balanced: ~20-30g E | 50-70g K | 15-25g V</div>
                        <div class="timing-why">
                            Je lichaam heeft 8 uur gevast. We willen nu: <strong>Glycogeen voorraden aanvullen</strong> 
                            (energie uit koolhydraten), <strong>spiereiwitopbouw starten</strong> met eiwit, en 
                            <strong>complexe koolhydraten</strong> (zoals haver) voor langdurige energie. 
                            <strong>Weetje:</strong> Ontbijt binnen 1u verhoogt metabolisme met 15-20%.
                        </div>
                    </div>
                </div>
                
                <div class="timing-card">
                    <div class="timing-icon">
                        <i data-lucide="dumbbell" style="width: 28px; height: 28px;"></i>
                    </div>
                    <div class="timing-content">
                        <h4>Lunch (Pre-Workout)</h4>
                        <div class="timing-time">13:00 (2-3u voor training)</div>
                        <div class="timing-macro">High Carb: ~35-50g E | 45-60g K | <15g V</div>
                        <div class="timing-why">
                            We focussen op <strong>glycogeen loading</strong> voor je training. We willen: 
                            <strong>Complexe koolhydraten</strong> eten zodat we een geleidelijke glucose toevoer 
                            hebben in ons bloed, <strong>magere eiwitbron</strong> (want weinig vet = snellere vertering), 
                            en <strong>laag vet</strong> zodat je maag niet zwaar voelt. 
                            <strong>Resultaat:</strong> 30-40% betere performance vs lege maag.
                        </div>
                    </div>
                </div>
                
                <div class="timing-card">
                    <div class="timing-icon">
                        <i data-lucide="zap" style="width: 28px; height: 28px;"></i>
                    </div>
                    <div class="timing-content">
                        <h4>Pre-Workout Snack</h4>
                        <div class="timing-time">16:00 (1u voor training)</div>
                        <div class="timing-macro">Pure Fast Carbs: 60-100g K | <5g V</div>
                        <div class="timing-why">
                            We willen <strong>snel beschikbare glucose</strong> in je bloed. Daarom: 
                            <strong>Snelle koolhydraten</strong> (hoge GI zoals rijstwafels, banaan, honing), 
                            <strong>geen vet of eiwit</strong> (vertraagt opname). 30-45 min voor training = 
                            glucose beschikbaar tijdens eerste sets. 
                            <strong>Resultaat:</strong> +12% kracht, +15% volume.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- PAGE 4B: MEAL TIMING - DEEL 2 -->
    <div class="page">
        <div class="timing-page">
            <div class="page-header">
                <span class="page-title">Maaltijd Timing - Deel 2</span>
                <span class="page-num">Pagina 4</span>
            </div>
            
            <h2 class="section-title">WANNEER EET JE WAT?</h2>
            
            <div class="timing-grid">
                <div class="timing-card">
                    <div class="timing-icon">
                        <i data-lucide="activity" style="width: 28px; height: 28px;"></i>
                    </div>
                    <div class="timing-content">
                        <h4>Diner (Post-Workout)</h4>
                        <div class="timing-time">19:00-20:00 (1-2u na training)</div>
                        <div class="timing-macro">High Carb+Protein: ~40-50g E | 50-60g K | 20-30g V</div>
                        <div class="timing-why">
                            Na training zijn je <strong>glycogeen voorraden leeg</strong>. We willen: 
                            <strong>Koolhydraten</strong> om glycogeen te herstellen, <strong>eiwit</strong> 
                            om aminozuren beschikbaar te hebben voor spiergroei, en <strong>gezonde vetten</strong> 
                            voor herstel en ontstekingsremming. 
                            <strong>Resultaat:</strong> 25-30% meer spiergroei vs >3u wachten.
                        </div>
                    </div>
                </div>
                
                <div class="timing-card">
                    <div class="timing-icon">
                        <i data-lucide="moon" style="width: 28px; height: 28px;"></i>
                    </div>
                    <div class="timing-content">
                        <h4>Voor Bed</h4>
                        <div class="timing-time">21:30-22:00</div>
                        <div class="timing-macro">Pure Caseïne: 25-35g E | <10g K</div>
                        <div class="timing-why">
                            Tijdens slaap wil je <strong>geen spierafbraak</strong>. Daarom: 
                            <strong>Caseïne eiwit</strong> (verteert in 7-8u), <strong>constante aanvoer</strong> 
                            van aminozuren tijdens je slaap, voorkomt dat je lichaam spieren afbreekt voor energie. 
                            <strong>Resultaat:</strong> +22% meer nachtelijk spierherstel.
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: rgba(255, 215, 0, 0.08); border-left: 4px solid var(--gold);">
                <h4 style="font-family: 'Anton', sans-serif; font-size: 16px; color: var(--gold); text-transform: uppercase; margin-bottom: 15px;">
                    💡 Praktisch Voorbeeld: Training om 18:00
                </h4>
                <div style="font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.8;">
                    <strong>15:30</strong> (2.5u voor) → Lunch: Kip + Rijst + Groenten<br>
                    <strong>17:30</strong> (30 min voor) → Pre-workout: 2 bananen + rijstwafels<br>
                    <strong>18:00-19:30</strong> → Training<br>
                    <strong>20:00</strong> (30 min na) → Diner: Kip + Pasta + Groenten<br>
                    <strong>21:30</strong> → Voor bed: Kwark of caseïne shake
                </div>
            </div>
        </div>
    </div>
  `
}

/**
 * PAGE 5: Flexibility
 */
export const generateFlexibilityPage = () => {
  return `
    <div class="page">
        <div class="flexibility-page">
            <div class="page-header">
                <span class="page-title">Flexibiliteit</span>
                <span class="page-num">Pagina 5</span>
            </div>
            
            <h2 class="section-title">MAALTIJDEN AANPASSEN</h2>
            
            <div class="flex-intro">
                <strong>In de MY ARC app</strong> kun je eenvoudig alternatieven vinden door op het 
                <strong>🔄 draai-icoontje</strong> te klikken bij elke maaltijd. 
                Hieronder vind je de belangrijkste regels om zelf slim te wisselen.
            </div>
            
            <div class="flex-grid">
                <div class="flex-card">
                    <h4>Ontbijt Wisselen</h4>
                    <ul class="flex-list">
                        <li style="margin-bottom: 12px;"><strong>Waar op te letten:</strong></li>
                        <li>Behoud 20-30g eiwit + 50-70g koolhydraten</li>
                        <li>Mix van snel en langzaam verterende koolhydraten</li>
                        <li>Voeg gezonde vetten toe voor verzadiging</li>
                    </ul>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">INGREDIËNT VOORBEELDEN:</div>
                        <div style="font-size: 11px; line-height: 1.6;">
                            <strong style="color: var(--gold);">Eiwit:</strong> Eieren, Griekse yoghurt, Kwark, Skyr<br>
                            <strong style="color: var(--gold);">Koolhydraten:</strong> Haver, Volkoren brood, Fruit<br>
                            <strong style="color: var(--gold);">Vetten:</strong> Pindakaas, Noten, Avocado
                        </div>
                    </div>
                </div>
                
                <div class="flex-card">
                    <h4>Lunch/Diner Wisselen</h4>
                    <ul class="flex-list">
                        <li style="margin-bottom: 12px;"><strong>Waar op te letten:</strong></li>
                        <li>Behoud 35-50g eiwit + 45-60g koolhydraten</li>
                        <li>Pre-workout: Hou vet laag (<15g) voor snelle vertering</li>
                        <li>Post-workout: Vet mag hoger (25-30g) voor herstel</li>
                    </ul>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">INGREDIËNT VOORBEELDEN:</div>
                        <div style="font-size: 11px; line-height: 1.6;">
                            <strong style="color: var(--gold);">Eiwit:</strong> Kip, Kalkoen, Zalm, Mager rund, Tofu<br>
                            <strong style="color: var(--gold);">Koolhydraten:</strong> Rijst, Pasta, Aardappel, Quinoa<br>
                            <strong style="color: var(--gold);">Groenten:</strong> Broccoli, Spinazie, Paprika, Wortel
                        </div>
                    </div>
                </div>
                
                <div class="flex-card">
                    <h4>Pre-Workout Snack Wisselen</h4>
                    <ul class="flex-list">
                        <li style="margin-bottom: 12px;"><strong>Waar op te letten:</strong></li>
                        <li>MOET: Snelle koolhydraten voor directe energie</li>
                        <li>Hou vet extreem laag (<5g)</li>
                        <li>60-100g koolhydraten voor max energie</li>
                    </ul>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">INGREDIËNT VOORBEELDEN:</div>
                        <div style="font-size: 11px; line-height: 1.6;">
                            <strong style="color: #10b981;">✅ WEL:</strong> Witte rijst, Rijstwafels, Banaan, Honing, Dadels, Jam<br>
                            <strong style="color: #ef4444;">❌ NIET:</strong> Noten, Kaas, Vet vlees (te traag)
                        </div>
                    </div>
                </div>
                
                <div class="flex-card">
                    <h4>Voor Bed Snack Wisselen</h4>
                    <ul class="flex-list">
                        <li style="margin-bottom: 12px;"><strong>Waar op te letten:</strong></li>
                        <li>MOET: Caseïne eiwit (langzaam verterende)</li>
                        <li>25-35g eiwit</li>
                        <li>Hou koolhydraten laag (<10g)</li>
                    </ul>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">INGREDIËNT VOORBEELDEN:</div>
                        <div style="font-size: 11px; line-height: 1.6;">
                            <strong style="color: var(--gold);">Goede keuzes:</strong> Kwark, Griekse yoghurt, Caseïne shake
                        </div>
                    </div>
                </div>
                
                <div class="flex-rules">
                    <h4>⚠️ Belangrijke Timing Regels</h4>
                    <div class="flex-rules-grid">
                        <div>
                            <h5 style="color: #10b981; font-size: 13px; margin-bottom: 10px;">✅ DOE WEL</h5>
                            <ul class="flex-list do">
                                <li>Pre-workout meal 2-3u voor training</li>
                                <li>Snelle koolhydraten 30-60 min voor training</li>
                                <li>Post-workout binnen 2u na training</li>
                                <li>Eiwit elke 3-4u (6 meals/dag ideaal)</li>
                                <li>Caseïne voor bed (1-1.5u voor slapen)</li>
                            </ul>
                        </div>
                        <div>
                            <h5 style="color: #ef4444; font-size: 13px; margin-bottom: 10px;">❌ DOE NIET</h5>
                            <ul class="flex-list dont">
                                <li>Zware vette meal <2u voor training</li>
                                <li>Trainen op lege maag (glycogeen leeg)</li>
                                <li>>4u zonder eiwit (risico spierafbraak)</li>
                                <li>Te veel vet voor bed (vertraagt slaap)</li>
                                <li>Post-workout meal >3u uitstellen</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
}

/**
 * PAGE 6: Supplements
 */
export const generateSupplementsPage = () => {
  return `
    <div class="page">
        <div class="supplement-page">
            <div class="page-header">
                <span class="page-title">Supplementen</span>
                <span class="page-num">Pagina 6</span>
            </div>
            
            <h2 class="section-title">ESSENTIËLE SUPPLEMENTEN</h2>
            
            <div class="suppl-intro">
                De basis stack voor maximale resultaten. Deze supplementen zijn wetenschappelijk bewezen 
                en geven 20-30% betere gains voor €43-70/maand.
            </div>
            
            <div class="suppl-grid">
                <div class="suppl-card">
                    <div class="suppl-header">
                        <div class="suppl-badge">MUST-HAVE</div>
                        <h4>Creatine Monohydraat</h4>
                    </div>
                    <div class="suppl-dose">5g/dag • Ochtend of post-workout</div>
                    <div class="suppl-why">
                        +15% kracht & power, +10% volume, betere recovery. 
                        Meest onderzochte supplement (>500 studies).
                    </div>
                    <div class="suppl-cost">~€10/maand</div>
                </div>
                
                <div class="suppl-card">
                    <div class="suppl-header">
                        <div class="suppl-badge">MUST-HAVE</div>
                        <h4>Vitamine D3 + K2</h4>
                    </div>
                    <div class="suppl-dose">4000 IU + 100µg • Ochtend (met vet)</div>
                    <div class="suppl-why">
                        +25% testosteron boost, betere spier contractie, 
                        immuun support. K2 stuurt calcium naar botten.
                    </div>
                    <div class="suppl-cost">~€3/maand</div>
                </div>
                
                <div class="suppl-card">
                    <div class="suppl-header">
                        <div class="suppl-badge">MUST-HAVE</div>
                        <h4>Omega-3 (EPA/DHA)</h4>
                    </div>
                    <div class="suppl-dose">2000-2500mg • Avond bij diner</div>
                    <div class="suppl-why">
                        Anti-inflammatoir (snellere recovery), eiwit synthese support, 
                        testosteron ondersteuning.
                    </div>
                    <div class="suppl-cost">~€15/maand</div>
                </div>
                
                <div class="suppl-card">
                    <div class="suppl-header">
                        <div class="suppl-badge">MUST-HAVE</div>
                        <h4>Magnesium Bisglycinaat</h4>
                    </div>
                    <div class="suppl-dose">400mg • Avond (1u voor bed)</div>
                    <div class="suppl-why">
                        +20-24% testosteron, betere slaap (diepere REM), 
                        spier ontspanning, cortisol demping.
                    </div>
                    <div class="suppl-cost">~€15/maand</div>
                </div>
                
                <div class="suppl-card">
                    <div class="suppl-header">
                        <div class="suppl-badge" style="background: rgba(59, 130, 246, 0.8);">OPTIONEEL</div>
                        <h4>Whey Protein</h4>
                    </div>
                    <div class="suppl-dose">25-30g • Post-workout of tussen maaltijden</div>
                    <div class="suppl-why">
                        Gemak (makkelijke 25g eiwit), snelle absorptie. 
                        Alleen nodig als je moeite hebt met 150g+ eiwit via voeding.
                    </div>
                    <div class="suppl-cost">~€25/maand (€0.60/serving)</div>
                </div>
                
                <div class="suppl-card">
                    <div class="suppl-header">
                        <div class="suppl-badge" style="background: rgba(59, 130, 246, 0.8);">OPTIONEEL</div>
                        <h4>Caseïne Protein</h4>
                    </div>
                    <div class="suppl-dose">30-35g • Voor bed (21:30-22:00)</div>
                    <div class="suppl-why">
                        Slow-release (7-8u), nachtelijke MPS. 
                        Alleen nodig als je geen kwark/Griekse yoghurt lust.
                    </div>
                    <div class="suppl-cost">~€30/maand</div>
                </div>
                
                <div class="suppl-skip">
                    <h4>❌ Skip Deze (Geldverspilling)</h4>
                    <ul class="flex-list" style="font-size: 11px; color: rgba(255,255,255,0.8);">
                        <li>Fat burners - Calorieën deficit = enige echte fat burner</li>
                        <li>Test boosters - Meestal bullshit, D3+Magnesium doen dit al beter</li>
                    </ul>
                </div>
                
                <div class="suppl-total">
                    <div class="suppl-total-value">€43-70</div>
                    <div class="suppl-total-label">Totale kosten per maand (basis + opties)</div>
                    <div style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.7);">
                        ROI: Voor €43-70/maand krijg je 20-30% betere gains = beste investering mogelijk
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
}

/**
 * DAY PAGE: Individual day with meals
 */
export const generateDayPage = (day, dayData, dayIndex, meals) => {
  // Debug logging
  console.log(`📅 ${day.toUpperCase()}:`, {
    has_is_training_day: 'is_training_day' in dayData,
    is_training_day_value: dayData.is_training_day,
    dayIndex: dayIndex,
    dayDataKeys: Object.keys(dayData),
    // Check if it's in a meal object instead
    firstMealKeys: dayData.breakfast ? Object.keys(dayData.breakfast) : []
  })
  
  // Try multiple sources for is_training_day
  const isTrainingDay = dayData.is_training_day || 
                        dayData.breakfast?.is_training_day ||
                        (dayIndex % 2 === 0)  // Fallback: even days = training
  
  const daySubtitle = isTrainingDay 
    ? 'Training dag - Pre/post workout timing' 
    : 'Rust dag - Herstel en groei'
  
  console.log(`  → isTrainingDay: ${isTrainingDay}, subtitle: "${daySubtitle}"`)
  
  return `
    <div class="page">
        <div class="day-page">
            <div class="page-header">
                <span class="page-title">Dag ${dayIndex + 1}</span>
                <span class="page-num">Pagina ${dayIndex + 8}</span>
            </div>
            
            <h2 class="day-header-large">
                <span class="gold">${DAY_NAMES[day].toUpperCase()}</span>
            </h2>
            
            <div class="day-subtitle" style="text-align: center; color: ${isTrainingDay ? '#f59e0b' : '#10b981'}; font-size: 14px; font-weight: 600; margin-top: -8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
                ${isTrainingDay ? '💪' : '🌙'} ${daySubtitle}
            </div>
            
            <div class="day-totals">
                <div class="day-total">
                    <div class="day-total-value">${dayData.totals?.kcal || 0}</div>
                    <div class="day-total-label">Kcal</div>
                </div>
                <div class="day-total">
                    <div class="day-total-value">${dayData.totals?.protein || 0}g</div>
                    <div class="day-total-label">Eiwit</div>
                </div>
                <div class="day-total">
                    <div class="day-total-value">${dayData.totals?.carbs || 0}g</div>
                    <div class="day-total-label">Koolh</div>
                </div>
                <div class="day-total">
                    <div class="day-total-value">${dayData.totals?.fat || 0}g</div>
                    <div class="day-total-label">Vet</div>
                </div>
            </div>
            
            <div class="meals-grid">
                ${meals.map(({ type, data, photo, timing }) => `
                <div class="meal-card">
                    <div class="meal-photo" style="background-image: url('${photo}');">
                        <div class="meal-photo-overlay">
                            <div class="meal-type">${timing.icon} ${MEAL_TYPES[type]} • ${timing.time}</div>
                        </div>
                    </div>
                    
                    <div class="meal-content">
                        <div class="meal-function">${timing.function}</div>
                        
                        <div class="meal-header">
                            <div class="meal-name">${data.meal_name || data.name || 'Geen naam'}</div>
                            <div class="meal-calories">${data.calories || 0}</div>
                        </div>
                        
                        ${data.ingredients && data.ingredients.length > 0 ? formatIngredientsCompact(data.ingredients) : ''}
                        
                        <div class="meal-macros">
                            <span class="macro-badge">${data.protein || 0}g E</span>
                            <span class="macro-badge">${data.carbs || 0}g K</span>
                            <span class="macro-badge">${data.fat || 0}g V</span>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            
            <div class="page-footer">
                <span>${DAY_NAMES[day]}</span>
                <span>MY ARC | Transform Your Life</span>
            </div>
        </div>
    </div>
  `
}

/**
 * FINAL PAGE: Closing
 */
export const generateFinalPage = () => {
  return `
    <div class="page">
        <div class="final-page">
            <div class="final-top">
                <h2 class="final-quote">
                    WEEK<br>
                    <span class="gold">COMPLEET!</span>
                </h2>
                <p class="final-text">
                    Goed gedaan - je bent klaar voor een geweldige week. 
                    Dit plan is een hulpmiddel, geen wet. Luister naar je lichaam, 
                    pas aan waar nodig, en vooral: geniet van je eten!
                </p>
            </div>
            
            <div class="final-bottom">
                <div class="cta-grid">
                    <div class="cta-item">
                        <div class="cta-icon">
                            <i data-lucide="shopping-cart" style="width: 22px; height: 22px; color: #0a0a0a;"></i>
                        </div>
                        <h4 class="cta-title">Boodschappen</h4>
                        <p class="cta-desc">Alles wat je deze week nodig hebt</p>
                    </div>
                    
                    <div class="cta-item">
                        <div class="cta-icon">
                            <i data-lucide="chef-hat" style="width: 22px; height: 22px; color: #0a0a0a;"></i>
                        </div>
                        <h4 class="cta-title">Meal Prep</h4>
                        <p class="cta-desc">Zondag voorbereiden = doordeweeks relaxen</p>
                    </div>
                    
                    <div class="cta-item">
                        <div class="cta-icon">
                            <i data-lucide="trophy" style="width: 22px; height: 22px; color: #0a0a0a;"></i>
                        </div>
                        <h4 class="cta-title">Resultaat</h4>
                        <p class="cta-desc">Op naar een geweldige week!</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
}

export default {
  generateCoverPage,
  generateTOCPage,
  generateIntroPage,
  generateTimingPages,
  generateFlexibilityPage,
  generateSupplementsPage,
  generateDayPage,
  generateFinalPage
}
