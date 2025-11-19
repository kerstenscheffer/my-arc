// src/modules/ai-meal-generator/ShoppingListHTMLGenerator.js
// Premium GOLDEN HTML-based Shopping List PDF Generator voor MY ARC

/**
 * Generate HTML shopping list for PDF export with GOLDEN LUXURY THEME
 * @param {Object} shoppingListData - From ShoppingListFormatter.js
 * @param {string} clientName - Client's name
 * @param {string} weekRange - Week date range
 * @returns {string} HTML content ready for print/PDF
 */
export const generateShoppingListHTML = (shoppingListData, clientName = 'Client', weekRange = 'Week Plan') => {
  // Helper: Group ingredients by category
  const groupByCategory = (ingredients) => {
    return ingredients.reduce((acc, item) => {
      const cat = item.category || 'Overig'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
  }
  
  // Helper: Generate smart shopping tips
  const generateSmartTips = (shoppingListData) => {
    const ingredients = shoppingListData.ingredients || []
    const tips = []
    
    // Fresh items tip
    const fresh = ingredients.filter(i => 
      i.category === 'Groenten' || i.category === 'Fruit'
    )
    if (fresh.length > 0) {
      tips.push('Begin bij verse producten - die blijven het minst lang goed')
    }
    
    // Bulk tip
    const bulk = ingredients.filter(i => i.packagesNeeded && i.packagesNeeded > 5)
    if (bulk.length > 0) {
      tips.push(`Let op grote hoeveelheden: ${bulk[0].name} (${bulk[0].packagesNeeded}x)`)
    }
    
    // Expensive items
    const expensive = ingredients.filter(i => i.estimatedCost && i.estimatedCost > 10)
    if (expensive.length > 0) {
      tips.push(`Check aanbiedingen bij: ${expensive.map(i => i.name).slice(0,2).join(', ')}`)
    }
    
    // Always add these golden tips
    tips.push('Lidl/Aldi vaak 30-40% goedkoper op basis producten')
    tips.push('Hele kip kopen = €4-6/kg besparing t.o.v. kipfilet')
    
    return tips.slice(0, 5)
  }
  
  // Group ingredients by category
  const grouped = groupByCategory(shoppingListData.ingredients || [])
  const categoryOrder = ['Eiwitten', 'Groenten', 'Koolhydraten', 'Zuivel', 'Vetten & Oliën', 'Fruit', 'Overig']
  
  // Generate shopping tips
  const smartTips = generateSmartTips(shoppingListData)
  
  // Calculate stats
  const itemCount = shoppingListData.itemCount || shoppingListData.ingredients?.length || 0
  const totalCost = shoppingListData.totalCost || '0.00'
  const weekDays = shoppingListData.weekDays || 7
  const dailyCost = (parseFloat(totalCost) / weekDays).toFixed(2)
  
  // Build HTML with GOLDEN LUXURY THEME
  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MY ARC Boodschappenlijst - ${clientName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #0a0a0a;
            color: #ffffff;
            font-family: Arial, sans-serif;
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

        /* BACKGROUND */
        .page-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.25;
            filter: grayscale(40%) blur(0.5px);
        }

        .page-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(255,215,0,0.03) 50%, rgba(10,10,10,0.95) 100%);
        }

        /* HEADER */
        .page-header {
            position: relative;
            background: linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(10,10,10,0.95) 100%);
            backdrop-filter: blur(10px);
            padding: 45px 40px 40px 40px;
            text-align: center;
            z-index: 1;
        }

        .page-header-small {
            position: relative;
            background: linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(10,10,10,0.95) 100%);
            backdrop-filter: blur(10px);
            padding: 28px 40px 24px 40px;
            text-align: center;
            z-index: 1;
        }

        .header-border {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
        }

        .badge {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #0a0a0a;
            font-size: 12px;
            font-weight: 900;
            padding: 7px 20px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .main-title {
            font-size: 52px;
            font-weight: 900;
            color: #FFD700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 14px;
            line-height: 1.1;
        }

        .main-title-small {
            font-size: 44px;
            font-weight: 900;
            color: #FFD700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
            line-height: 1.1;
        }

        .subtitle {
            font-size: 20px;
            color: #cccccc;
            margin-bottom: 12px;
        }

        .author {
            font-size: 18px;
            color: #FFD700;
            font-weight: 700;
        }

        /* CONTENT */
        .content {
            position: relative;
            padding: 32px 48px 65px 48px;
            z-index: 1;
        }

        /* STATS CONTAINERS */
        .stats-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 0 0 24px 0;
        }

        .stat-box {
            background: linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(26,26,26,0.9) 100%);
            backdrop-filter: blur(10px);
            border: 2px solid #FFD700;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .stat-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 900;
            color: #FFD700;
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* SPEECH BUBBLE */
        .speech-bubble-container {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            margin: 0 0 28px 0;
        }

        .profile-circle {
            flex-shrink: 0;
            width: 85px;
            height: 85px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #FFD700;
            box-shadow: 0 4px 12px rgba(255,215,0,0.4);
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 900;
            color: #0a0a0a;
        }

        .profile-circle img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .speech-bubble {
            position: relative;
            background: linear-gradient(135deg, rgba(255,215,0,0.25) 0%, rgba(255,165,0,0.15) 100%);
            backdrop-filter: blur(10px);
            border: 2px solid #FFD700;
            border-radius: 18px;
            padding: 20px 24px;
            flex: 1;
        }

        .speech-bubble::before {
            content: '';
            position: absolute;
            left: -12px;
            top: 25px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 10px 12px 10px 0;
            border-color: transparent #FFD700 transparent transparent;
        }

        .speech-bubble::after {
            content: '';
            position: absolute;
            left: -8px;
            top: 27px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 8px 10px 8px 0;
            border-color: transparent rgba(255,215,0,0.25) transparent transparent;
        }

        .speech-text {
            font-size: 16px;
            color: #ffffff;
            line-height: 1.65;
            margin-bottom: 14px;
        }

        .speech-text strong {
            color: #FFD700;
        }

        /* CATEGORY SECTIONS */
        .category-section {
            margin-bottom: 28px;
        }

        .category-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 3px solid #FFD700;
        }

        .category-icon {
            font-size: 28px;
        }

        .category-title {
            font-size: 24px;
            font-weight: 900;
            color: #FFD700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        /* SHOPPING ITEMS */
        .shopping-item {
            background: linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(26,26,26,0.9) 100%);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,215,0,0.3);
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.3s ease;
        }

        .shopping-item:hover {
            background: linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(26,26,26,0.9) 100%);
            border-color: #FFD700;
            transform: translateX(4px);
        }

        .checkbox {
            width: 24px;
            height: 24px;
            border: 2px solid #FFD700;
            border-radius: 4px;
            flex-shrink: 0;
            position: relative;
            background: rgba(10,10,10,0.5);
        }

        .item-content {
            flex: 1;
        }

        .item-name {
            font-size: 17px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 3px;
        }

        .item-amount {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.7);
        }

        .item-price {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #0a0a0a;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 800;
            white-space: nowrap;
        }

        .item-tip {
            width: 100%;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255,215,0,0.3);
            font-size: 14px;
            color: #FFA500;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* INFO BOXES */
        .box {
            background: linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(26,26,26,0.9) 100%);
            backdrop-filter: blur(10px);
            border: 2px solid #FFD700;
            border-radius: 12px;
            padding: 20px;
            margin: 16px 0;
        }

        .box-title {
            font-size: 22px;
            font-weight: 900;
            color: #FFD700;
            margin-bottom: 12px;
            text-transform: uppercase;
        }

        .box-list {
            list-style: none;
            padding: 0;
        }

        .box-list li {
            font-size: 16px;
            color: #e0e0e0;
            margin-bottom: 9px;
            padding-left: 26px;
            position: relative;
            line-height: 1.5;
        }

        .box-list li::before {
            content: '•';
            position: absolute;
            left: 0;
            font-size: 22px;
            color: #FFD700;
            font-weight: 900;
        }

        /* ROUTE BOX */
        .route-box {
            background: linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(26,26,26,0.9) 100%);
            backdrop-filter: blur(10px);
            border: 2px solid #FFD700;
            border-radius: 12px;
            padding: 22px;
            margin-bottom: 20px;
        }

        .route-box ol {
            margin: 0;
            padding-left: 24px;
        }

        .route-box li {
            font-size: 16px;
            color: #e0e0e0;
            margin-bottom: 10px;
            line-height: 1.6;
        }

        .route-box li strong {
            color: #FFD700;
        }

        /* BIG NUMBER */
        .big {
            font-size: 68px;
            font-weight: 900;
            color: #FFD700;
            display: inline-block;
            line-height: 1;
        }

        /* FOOTER */
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 15px;
            text-align: center;
            background: linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(10,10,10,0.95) 100%);
            backdrop-filter: blur(10px);
            color: #888;
            font-size: 12px;
            border-top: 3px solid #FFD700;
            z-index: 1;
        }

        .footer strong {
            color: #FFD700;
        }

        /* PRINT BUTTON */
        .print-btn {
            position: fixed;
            top: 30px;
            right: 30px;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #0a0a0a;
            border: none;
            padding: 14px 26px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            z-index: 9999;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
        }

        .print-btn:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 8px 24px rgba(255,215,0,0.4);
        }

        @media print {
            .print-btn {
                display: none;
            }
        }

        /* UTILITIES */
        .center {
            text-align: center;
        }

        .text {
            font-size: 17px;
            color: #e0e0e0;
            line-height: 1.65;
            margin-bottom: 14px;
        }

        .text strong {
            color: #FFD700;
        }

        /* PRICE TAG */
        .price {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #0a0a0a;
            padding: 3px 9px;
            border-radius: 6px;
            font-weight: 800;
            display: inline-block;
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print PDF</button>

    <!-- PAGE 1: COVER -->
    <div class="page">
        <div class="page-overlay"></div>
        
        <div class="page-header">
            <div class="badge">Shopping Guide</div>
            <h1 class="main-title">MY ARC<br>BOODSCHAPPEN</h1>
            <p class="subtitle">Slim winkelen voor maximale groei</p>
            <p class="author">${clientName} • ${weekRange}</p>
            <div class="header-border"></div>
        </div>

        <div class="content">
            <div class="speech-bubble-container">
                <div class="profile-circle">K</div>
                <div class="speech-bubble">
                    <p class="speech-text">
                        Dit is jouw gepersonaliseerde boodschappenlijst. Ik heb alles berekend voor 
                        <strong>maximale besparing</strong> zonder in te leveren op kwaliteit. 
                        Met mijn tips bespaar je <strong>€30-50 per maand</strong>.
                    </p>
                    <p class="speech-text" style="margin: 0;">
                        Print deze lijst uit, vink af wat je hebt, en shop slim. 
                        <strong>Lidl/Aldi eerst</strong>, dan pas de rest!
                    </p>
                </div>
            </div>

            <div class="stats-container">
                <div class="stat-box">
                    <div class="stat-icon">📦</div>
                    <div class="stat-value">${itemCount}</div>
                    <div class="stat-label">items totaal</div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon">💰</div>
                    <div class="stat-value">€${totalCost}</div>
                    <div class="stat-label">week budget</div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">€${dailyCost}</div>
                    <div class="stat-label">per dag</div>
                </div>
            </div>

            <div class="box">
                <h3 class="box-title">Shopping Philosophy</h3>
                <ul class="box-list">
                    <li><strong>Lidl/Aldi eerst</strong> - 30-40% goedkoper op basics</li>
                    <li><strong>Hele kip kopen</strong> - €4-6/kg besparing vs kipfilet</li>
                    <li><strong>Kwark bij Lidl</strong> - €0,69 vs €1,50 bij AH</li>
                    <li><strong>Seizoensgroente</strong> - Tot 50% goedkoper</li>
                    <li><strong>Bulk waar mogelijk</strong> - Rijst, pasta, blikken</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <strong>MY ARC</strong> | Jouw Personal Training Partner | Pagina 1
        </div>
    </div>

    <!-- PAGES 2+: SHOPPING LIST -->
    ${(() => {
        let pageContent = ''
        let currentPage = []
        let pageNum = 2
        
        categoryOrder.forEach(category => {
            if (!grouped[category] || grouped[category].length === 0) return
            
            const categoryEmoji = {
                'Eiwitten': '🥚',
                'Groenten': '🥦', 
                'Koolhydraten': '🍚',
                'Zuivel': '🥛',
                'Vetten & Oliën': '🫒',
                'Fruit': '🍎',
                'Overig': '📦'
            }[category] || '📦'
            
            const categoryHTML = `
                <div class="category-section">
                    <div class="category-header">
                        <span class="category-icon">${categoryEmoji}</span>
                        <h2 class="category-title">${category}</h2>
                    </div>
                    
                    ${grouped[category].map(item => {
                        // Safe amount display
                        let displayAmount = ''
                        if (item.displayAmount) {
                            displayAmount = item.displayAmount
                        } else if (item.amount !== undefined && item.amount !== null) {
                            displayAmount = `${item.amount}${item.unit || ''}`
                        } else if (item.totalAmount !== undefined && item.totalAmount !== null) {
                            displayAmount = `${item.totalAmount}${item.unit || ''}`
                        }
                        
                        // Safe price display
                        let priceDisplay = ''
                        if (item.estimatedCost !== undefined && item.estimatedCost > 0) {
                            priceDisplay = `€${item.estimatedCost.toFixed(2)}`
                        }
                        
                        return `
                            <div class="shopping-item">
                                <div class="checkbox"></div>
                                <div class="item-content">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-amount">${displayAmount}</div>
                                    ${item.shoppingTip ? `
                                        <div class="item-tip">
                                            <span>💡</span>
                                            ${item.shoppingTip}
                                        </div>
                                    ` : ''}
                                </div>
                                ${priceDisplay ? `<div class="item-price">${priceDisplay}</div>` : ''}
                            </div>
                        `
                    }).join('')}
                </div>
            `
            
            currentPage.push(categoryHTML)
            
            // Check if we need a new page (rough estimate)
            if (currentPage.join('').length > 3000) {
                pageContent += `
                    <div class="page">
                        <div class="page-overlay"></div>
                        
                        <div class="page-header-small">
                            <div class="badge">Boodschappenlijst</div>
                            <h1 class="main-title-small">SHOPPING LIST</h1>
                            <div class="header-border"></div>
                        </div>

                        <div class="content">
                            ${currentPage.join('')}
                        </div>

                        <div class="footer">
                            <strong>MY ARC</strong> | Jouw Personal Training Partner | Pagina ${pageNum}
                        </div>
                    </div>
                `
                currentPage = []
                pageNum++
            }
        })
        
        // Add remaining content
        if (currentPage.length > 0) {
            pageContent += `
                <div class="page">
                    <div class="page-overlay"></div>
                    
                    <div class="page-header-small">
                        <div class="badge">Boodschappenlijst</div>
                        <h1 class="main-title-small">SHOPPING LIST</h1>
                        <div class="header-border"></div>
                    </div>

                    <div class="content">
                        ${currentPage.join('')}
                    </div>

                    <div class="footer">
                        <strong>MY ARC</strong> | Jouw Personal Training Partner | Pagina ${pageNum}
                    </div>
                </div>
            `
        }
        
        return pageContent
    })()}

    <!-- LAST PAGE: SMART TIPS -->
    <div class="page">
        <div class="page-overlay"></div>
        
        <div class="page-header-small">
            <div class="badge">Bespaar Tips</div>
            <h1 class="main-title-small">SHOP SLIM<br>GROEI GROOT</h1>
            <div class="header-border"></div>
        </div>

        <div class="content">
            <div class="route-box">
                <h3 class="box-title">Optimale Winkel Route</h3>
                <ol>
                    <li><strong>Start bij Lidl/Aldi</strong> voor basics (80% van je lijst)</li>
                    <li><strong>Groente & fruit</strong> → Turkse supermarkt of markt</li>
                    <li><strong>Specifieke items</strong> → AH/Jumbo alleen indien nodig</li>
                    <li><strong>Diepvries als laatste</strong> (blijft koud tijdens transport)</li>
                </ol>
            </div>

            ${smartTips.length > 0 ? `
                <div class="box">
                    <h3 class="box-title">Quick Tips Deze Week</h3>
                    <ul class="box-list">
                        ${smartTips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="box">
                <h3 class="box-title">Kersten's Budget Hacks</h3>
                <ul class="box-list">
                    <li><strong>Hele kip:</strong> €8,50/kg vs Kipfilet: €12-15/kg</li>
                    <li><strong>Lidl kwark:</strong> €0,69 vs AH/Jumbo: €1,20-1,50</li>
                    <li><strong>Whey online:</strong> €20-25/kg vs Winkel: €35-40/kg</li>
                    <li><strong>Eieren bulk:</strong> 30 stuks voor €0,25/stuk</li>
                </ul>
            </div>

            <div class="center" style="margin: 28px 0;">
                <div class="big">€30-50</div>
                <p class="text" style="font-size: 20px; margin-top: 16px;">
                    <strong>Besparing per maand</strong><br>
                    Dat is €400+ per jaar extra gains!
                </p>
            </div>

            <div class="box" style="text-align: center;">
                <h3 class="box-title">Groei Elke Dag</h3>
                <p class="text" style="font-size: 16px; margin: 0;">
                    Met deze lijst en tips shop je <strong>slimmer</strong>, niet harder.<br>
                    Meer geld over = meer gains. Let's go! 💪
                </p>
            </div>
        </div>

        <div class="footer">
            <strong>MY ARC</strong> | Transform Your Life | Groei! 💪
        </div>
    </div>

</body>
</html>
  `
  
  return html
}

/**
 * Open shopping list directly in print dialog
 */
export const openShoppingListForPrint = (shoppingListData, clientName, weekRange) => {
  const html = generateShoppingListHTML(shoppingListData, clientName, weekRange)
  
  // Remove any existing print iframe
  const existingFrame = document.getElementById('shopping-list-print-frame')
  if (existingFrame) {
    existingFrame.remove()
  }
  
  // Create hidden iframe for printing
  const printFrame = document.createElement('iframe')
  printFrame.id = 'shopping-list-print-frame'
  printFrame.style.cssText = `
    position: absolute;
    top: -10000px;
    left: -10000px;
    width: 0;
    height: 0;
    border: none;
  `
  
  // Append to body
  document.body.appendChild(printFrame)
  
  // Write HTML to iframe and trigger print
  printFrame.onload = () => {
    // Remove the print button from the content
    const printHTML = html.replace('<button class="print-btn" onclick="window.print()">Print PDF</button>', '')
    
    printFrame.contentDocument.write(printHTML)
    printFrame.contentDocument.close()
    
    // Small delay to ensure content is rendered
    setTimeout(() => {
      printFrame.contentWindow.print()
      
      // Clean up iframe after print dialog closes
      // Note: onafterprint doesn't work reliably across browsers
      setTimeout(() => {
        printFrame.remove()
      }, 1000)
    }, 250)
  }
  
  // Trigger load
  printFrame.src = 'about:blank'
}

export default { generateShoppingListHTML, openShoppingListForPrint }
