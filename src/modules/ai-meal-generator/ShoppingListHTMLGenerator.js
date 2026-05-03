// MY ARC SHOPPING LIST HTML GENERATOR - COACH EDITION
// Met coach bubble, Nederlandse tips en winkel-georganiseerde lijst

/**
 * Generate shopping list HTML met coach introductie
 * @param {Object} shoppingListData - Shopping data
 * @param {string} clientName - Client naam
 * @param {string} weekRange - Week range
 * @returns {string} HTML voor print/PDF
 */
export const generateShoppingListHTML = (shoppingListData, clientName = 'Client', weekRange = 'Week Plan') => {
  // Extract data
  const ingredients = shoppingListData.ingredients || []
  const itemCount = shoppingListData.itemCount || ingredients.length || 0
  const totalCost = shoppingListData.totalCost || '0.00'
  const weekDays = shoppingListData.weekDays || 7
  const dailyCost = (parseFloat(totalCost) / weekDays).toFixed(2)
  
  // Organiseer ingrediënten per winkel categorie
  const winkelCategories = {
    'Groenten & Fruit': { items: [], color: '#10b981' },
    'Vlees & Vis': { items: [], color: '#dc2626' },
    'Zuivel & Eieren': { items: [], color: '#3b82f6' },
    'Brood & Granen': { items: [], color: '#f59e0b' },
    'Conserven & Potten': { items: [], color: '#8b5cf6' },
    'Vriezer': { items: [], color: '#06b6d4' },
    'Overig': { items: [], color: '#6b7280' }
  }
  
  // Sorteer items in winkel categorieën
  ingredients.forEach(item => {
    let assigned = false
    const name = item.name.toLowerCase()
    
    // Groenten & Fruit
    if (name.includes('groente') || name.includes('fruit') || name.includes('sla') || 
        name.includes('tomaat') || name.includes('komkommer') || name.includes('appel') ||
        name.includes('banaan') || name.includes('ui') || name.includes('paprika')) {
      winkelCategories['Groenten & Fruit'].items.push(item)
      assigned = true
    }
    // Vlees & Vis
    else if (name.includes('kip') || name.includes('vlees') || name.includes('vis') || 
             name.includes('zalm') || name.includes('gehakt')) {
      winkelCategories['Vlees & Vis'].items.push(item)
      assigned = true
    }
    // Zuivel & Eieren
    else if (name.includes('melk') || name.includes('kaas') || name.includes('yoghurt') || 
             name.includes('kwark') || name.includes('eier') || name.includes('zuivel')) {
      winkelCategories['Zuivel & Eieren'].items.push(item)
      assigned = true
    }
    // Brood & Granen
    else if (name.includes('brood') || name.includes('rijst') || name.includes('pasta') || 
             name.includes('havermout') || name.includes('meel')) {
      winkelCategories['Brood & Granen'].items.push(item)
      assigned = true
    }
    // Conserven
    else if (name.includes('blik') || name.includes('pot') || name.includes('bonen')) {
      winkelCategories['Conserven & Potten'].items.push(item)
      assigned = true
    }
    // Vriezer
    else if (name.includes('bevroren') || name.includes('diepvries')) {
      winkelCategories['Vriezer'].items.push(item)
      assigned = true
    }
    
    if (!assigned) {
      winkelCategories['Overig'].items.push(item)
    }
  })
  
  // Remove empty categories
  Object.keys(winkelCategories).forEach(cat => {
    if (winkelCategories[cat].items.length === 0) delete winkelCategories[cat]
  })
  
  // Build HTML
  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clientName} - Boodschappenlijst</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #0a0a0a;
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
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
            background: #0a0a0a;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden;
            position: relative;
        }

        .page:last-child {
            page-break-after: avoid;
        }

        /* HEADER */
        .header {
            background: #1a1a1a;
            padding: 20px 30px 18px 30px;
            text-align: center;
            border-bottom: 3px solid #FFD700;
        }

        .badge {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #0a0a0a;
            font-size: 11px;
            font-weight: 800;
            padding: 5px 15px;
            border-radius: 15px;
            display: inline-block;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        .title {
            font-size: 32px;
            font-weight: 900;
            color: #FFD700;
            text-transform: uppercase;
            letter-spacing: 2px;
            line-height: 1;
            margin-bottom: 8px;
        }

        .subtitle {
            font-size: 14px;
            color: #ccc;
        }

        /* CONTENT */
        .content {
            padding: 25px 35px;
        }

        /* COACH BUBBLE */
        .coach-section {
            margin-bottom: 30px;
        }

        .coach-bubble-container {
            display: flex;
            align-items: flex-start;
            gap: 20px;
        }

        .profile-circle {
            flex-shrink: 0;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #333;
            border: 3px solid #FFD700;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 900;
            color: #FFD700;
        }

        .speech-bubble {
            position: relative;
            background: rgba(255, 215, 0, 0.15);
            border: 2px solid #FFD700;
            border-radius: 15px;
            padding: 18px 22px;
            flex: 1;
        }

        .speech-bubble::before {
            content: '';
            position: absolute;
            left: -10px;
            top: 20px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 10px 10px 10px 0;
            border-color: transparent #FFD700 transparent transparent;
        }

        .speech-bubble::after {
            content: '';
            position: absolute;
            left: -6px;
            top: 22px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 8px 8px 8px 0;
            border-color: transparent rgba(255, 215, 0, 0.15) transparent transparent;
        }

        .speech-text {
            font-size: 14px;
            color: #fff;
            line-height: 1.6;
        }

        .speech-text strong {
            color: #FFD700;
        }

        /* INHOUDSOPGAVE */
        .inhoud-box {
            background: #1a1a1a;
            border: 2px solid #FFD700;
            border-radius: 10px;
            padding: 20px;
        }

        .inhoud-title {
            font-size: 20px;
            font-weight: 900;
            color: #FFD700;
            margin-bottom: 15px;
            text-transform: uppercase;
        }

        .inhoud-list {
            list-style: none;
        }

        .inhoud-list li {
            font-size: 14px;
            color: #e0e0e0;
            margin-bottom: 10px;
            padding-left: 25px;
            position: relative;
        }

        .inhoud-list li::before {
            content: '•';
            position: absolute;
            left: 0;
        }

        .inhoud-list strong {
            color: #FFD700;
        }

        /* SHOPPING LIST */
        .shop-section {
            margin-bottom: 20px;
        }

        .shop-category {
            margin-bottom: 20px;
        }

        .category-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .category-label {
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            color: #fff;
            padding: 4px 12px;
            border-radius: 6px;
        }

        .item-list {
            background: #1a1a1a;
            border-radius: 8px;
            padding: 10px;
        }

        .shop-item {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .shop-item:last-child {
            border-bottom: none;
        }

        .checkbox {
            width: 16px;
            height: 16px;
            border: 2px solid #FFD700;
            border-radius: 3px;
            margin-right: 10px;
            flex-shrink: 0;
        }

        .item-name {
            flex: 1;
            font-size: 14px;
            font-weight: 600;
            color: #fff;
        }

        .item-amount {
            font-size: 13px;
            color: #FFD700;
            font-weight: 700;
            margin-left: 10px;
        }

        /* TIPS */
        .tips-box {
            background: rgba(255, 215, 0, 0.1);
            border: 2px solid #FFD700;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .tips-title {
            font-size: 18px;
            font-weight: 900;
            color: #FFD700;
            margin-bottom: 12px;
            text-transform: uppercase;
        }

        .tip-item {
            font-size: 13px;
            color: #e0e0e0;
            margin-bottom: 10px;
            padding-left: 20px;
            position: relative;
            line-height: 1.5;
        }

        .tip-item::before {
            content: '•';
            position: absolute;
            left: 0;
        }

        .tip-item strong {
            color: #FFD700;
        }

        /* FOOTER */
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 12px;
            text-align: center;
            background: #1a1a1a;
            color: #888;
            font-size: 11px;
            border-top: 2px solid #FFD700;
        }

        .footer strong {
            color: #FFD700;
        }

        /* PRINT BUTTON */
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #0a0a0a;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            z-index: 9999;
            text-transform: uppercase;
        }

        @media print {
            .print-btn {
                display: none;
            }
            body {
                background: #0a0a0a !important;
            }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print PDF</button>

    <!-- PAGINA 1: INTRO & INHOUDSOPGAVE -->
    <div class="page">
        <div class="header">
            <div class="badge">Boodschappen</div>
            <h1 class="title">MEAL PLAN - ${clientName}</h1>
            <p class="subtitle">${weekRange}</p>
        </div>

        <div class="content">
            <!-- COACH BUBBLE -->
            <div class="coach-section">
                <div class="coach-bubble-container">
                    <div class="profile-circle">
                        <img src="https://i.ibb.co/601NSR8W/IMG-4752.jpg" 
                             alt="Kersten" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    </div>
                    <div class="speech-bubble">
                        <p class="speech-text">
                            Een <strong>gezonde levensstijl</strong> draait niet om discipline. Het draait om het hebben van de 
                            <strong>juiste structuur en routines</strong> waar je op terug kunt vallen.
                        </p>
                        <p class="speech-text" style="margin-top: 10px; margin-bottom: 0;">
                            Daarom maken we dit plan - zodat je <strong>zonder nadenken</strong> gezond kunt eten. 
                            Alles wat je nodig hebt staat klaar. Je hoeft alleen maar te volgen.
                        </p>
                    </div>
                </div>
            </div>

            <!-- INHOUDSOPGAVE -->
            <div class="inhoud-box">
                <h2 class="inhoud-title">Wat vind je in dit plan?</h2>
                <ul class="inhoud-list">
                    <li><strong>Pagina 1:</strong> Deze introductie - waarom structuur belangrijker is dan wilskracht</li>
                    <li><strong>Pagina 2:</strong> Complete boodschappenlijst georganiseerd per winkelafdeling</li>
                    <li><strong>Pagina 3:</strong> Praktische tips om €30-50 per week te besparen op boodschappen</li>
                    <li><strong>Extra:</strong> Je persoonlijke weekmenu met alle maaltijden (aparte PDF)</li>
                </ul>
            </div>

            <!-- WEEK OVERZICHT -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 25px;">
                <div style="background: #1a1a1a; border: 2px solid #FFD700; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 900; color: #FFD700;">${itemCount}</div>
                    <div style="font-size: 12px; color: #ccc; text-transform: uppercase;">Items totaal</div>
                </div>
                <div style="background: #1a1a1a; border: 2px solid #FFD700; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 900; color: #FFD700;">€${totalCost}</div>
                    <div style="font-size: 12px; color: #ccc; text-transform: uppercase;">Week budget</div>
                </div>
                <div style="background: #1a1a1a; border: 2px solid #FFD700; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 900; color: #FFD700;">€${dailyCost}</div>
                    <div style="font-size: 12px; color: #ccc; text-transform: uppercase;">Per dag</div>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 10px; padding: 20px; margin-top: 25px; text-align: center;">
                <p style="font-size: 18px; font-weight: 900; color: #0a0a0a; margin: 0;">
                    Klaar om te beginnen? Pak deze lijst en ga shoppen!
                </p>
            </div>
        </div>

        <div class="footer">
            <strong>MY ARC</strong> | Transform Your Life | Pagina 1/3
        </div>
    </div>

    <!-- PAGINA 2: BOODSCHAPPENLIJST -->
    <div class="page">
        <div class="header">
            <div class="badge">Shopping</div>
            <h1 class="title">BOODSCHAPPENLIJST</h1>
            <p class="subtitle">Georganiseerd per winkelafdeling</p>
        </div>

        <div class="content" style="padding: 20px 30px;">
            ${Object.entries(winkelCategories).map(([category, data]) => {
                if (data.items.length === 0) return ''
                
                return `
                    <div class="shop-category">
                        <div class="category-header">
                            <div class="category-label" style="background: ${data.color};">
                                ${category}
                            </div>
                        </div>
                        <div class="item-list">
                            ${data.items.map(item => {
                                // Format amount
                                let displayAmount = ''
                                if (item.displayAmount) {
                                    displayAmount = item.displayAmount
                                } else if (item.totalAmount !== undefined) {
                                    displayAmount = `${Math.round(item.totalAmount)}${item.unit || 'g'}`
                                }
                                
                                return `
                                    <div class="shop-item">
                                        <div class="checkbox"></div>
                                        <div class="item-name">${item.name}</div>
                                        <div class="item-amount">${displayAmount}</div>
                                    </div>
                                `
                            }).join('')}
                        </div>
                    </div>
                `
            }).join('')}

            <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid #FFD700; border-radius: 10px; padding: 15px; margin-top: 20px; text-align: center;">
                <p style="font-size: 14px; color: #FFD700; font-weight: 700; margin: 0;">
                    💡 Tip: Kruis af wat je al hebt gepakt - zo vergeet je niks!
                </p>
            </div>
        </div>

        <div class="footer">
            <strong>MY ARC</strong> | Transform Your Life | Pagina 2/3
        </div>
    </div>

    <!-- PAGINA 3: BESPAARTIPS -->
    <div class="page">
        <div class="header">
            <div class="badge">Budget Tips</div>
            <h1 class="title">SLIM BOODSCHAPPEN DOEN</h1>
            <p class="subtitle">Bespaar €30-50 per week</p>
        </div>

        <div class="content">
            <!-- WINKELROUTE -->
            <div class="tips-box">
                <h3 class="tips-title">Slimme Winkelroute</h3>
                <div class="tip-item">
                    <strong>Start bij Lidl/Aldi:</strong> Hier haal je 80% van je lijst. Basics zoals zuivel, vlees, groenten zijn hier het goedkoopst.
                </div>
                <div class="tip-item">
                    <strong>Dan naar de markt:</strong> Voor verse groenten en fruit. Vaak 50% goedkoper dan supermarkt, zeker aan het einde van de dag.
                </div>
                <div class="tip-item">
                    <strong>Turkse supermarkt:</strong> Voor kruiden, peulvruchten en groenten. Veel groter en goedkoper dan reguliere super.
                </div>
                <div class="tip-item">
                    <strong>AH/Jumbo alleen voor specials:</strong> Kijk de bonus, maar ga niet zomaar shoppen. Te duur voor dagelijkse boodschappen.
                </div>
            </div>

            <!-- BULK TIPS -->
            <div class="tips-box">
                <h3 class="tips-title">Voorraad Aanleggen</h3>
                <div class="tip-item">
                    <strong>Koop heel vlees:</strong> Hele kip is €8/kg versus kipfilet €15/kg. 10 minuten werk scheelt €7 per kilo.
                </div>
                <div class="tip-item">
                    <strong>Vriezen is je vriend:</strong> Koop brood, vlees en groenten in bulk. Portioneer direct en vries in.
                </div>
                <div class="tip-item">
                    <strong>Seizoensgroenten:</strong> Koop wat in het seizoen is. Broccoli in winter, courgette in zomer = halve prijs.
                </div>
                <div class="tip-item">
                    <strong>Huismerk regelt:</strong> Voor basis producten (rijst, pasta, zuivel) is huismerk perfect. Scheelt 30-40%.
                </div>
            </div>

            <!-- MEAL PREP -->
            <div class="tips-box">
                <h3 class="tips-title">Tijd = Geld</h3>
                <div class="tip-item">
                    <strong>Prep op zondag:</strong> 2 uur werk = hele week klaar. Geen dure impulse aankopen meer.
                </div>
                <div class="tip-item">
                    <strong>Dubbel koken:</strong> Maak altijd dubbele porties. Eten voor morgen of invriezen voor volgende week.
                </div>
                <div class="tip-item">
                    <strong>Bakjes systeem:</strong> Investeer in goede bakjes. Alles voorgeportioneerd = nooit meer twijfelen.
                </div>
            </div>

            <!-- TOTALE BESPARING -->
            <div style="background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 10px; padding: 25px; text-align: center; margin-top: 25px;">
                <div style="font-size: 48px; font-weight: 900; color: #0a0a0a; line-height: 1;">€150-200</div>
                <p style="font-size: 16px; color: #0a0a0a; font-weight: 700; margin-top: 10px;">
                    Maandelijkse besparing met deze tips<br>
                    Dat is €2000+ per jaar extra in je zak!
                </p>
            </div>
        </div>

        <div class="footer">
            <strong>MY ARC</strong> | Transform Your Life | Pagina 3/3
        </div>
    </div>

</body>
</html>
  `
  
  return html
}

/**
 * Open shopping list voor print/PDF
 */
export const openShoppingListForPrint = (shoppingListData, clientName, weekRange) => {
  const html = generateShoppingListHTML(shoppingListData, clientName, weekRange)
  
  // Open print window
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
    // Iframe fallback
    const printFrame = document.createElement('iframe')
    printFrame.style.cssText = 'position: fixed; width: 0; height: 0; border: 0;'
    document.body.appendChild(printFrame)
    
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document
    frameDoc.open()
    frameDoc.write(html)
    frameDoc.close()
    
    setTimeout(() => {
      printFrame.contentWindow.focus()
      printFrame.contentWindow.print()
      
      setTimeout(() => {
        document.body.removeChild(printFrame)
      }, 1000)
    }, 500)
  }
}

export default { generateShoppingListHTML, openShoppingListForPrint }
