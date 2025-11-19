// src/modules/ai-meal-generator/PremiumPDFGenerator.js
// Premium MY ARC Shopping List PDF Generator - Kersten Style

/**
 * Generate premium MY ARC branded shopping list PDF
 * Styled after Kersten's Eiwit Guide design
 */
export const generatePremiumShoppingPDF = (shoppingListData, clientName = 'Client', weekRange = 'Week Plan') => {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  // Premium Color Palette (Kersten's design)
  const colors = {
    // Backgrounds
    black: [10, 10, 10],              // #0a0a0a
    darkGray: [26, 26, 26],           // #1a1a1a
    
    // Primary colors
    gold: [255, 215, 0],              // #FFD700
    orange: [255, 165, 0],            // #FFA500
    green: [16, 185, 129],            // #10b981 (MY ARC)
    
    // Text colors
    white: [255, 255, 255],           // #ffffff
    lightGray: [224, 224, 224],       // #e0e0e0
    mutedGray: [204, 204, 204],       // #cccccc
    darkText: [136, 136, 136],        // #888888
    
    // Category colors
    protein: [239, 68, 68],           // #ef4444 Red
    vegetables: [16, 185, 129],       // #10b981 Green
    carbs: [245, 158, 11],            // #f59e0b Orange
    dairy: [59, 130, 246],            // #3b82f6 Blue
    fats: [139, 92, 246],             // #8b5cf6 Purple
    fruit: [251, 191, 36],            // #fbbf24 Yellow
    other: [107, 114, 128]            // #6b7280 Gray
  }
  
  // Category color mapping
  const categoryColors = {
    'Eiwitten': colors.protein,
    'Groenten': colors.vegetables,
    'Koolhydraten': colors.carbs,
    'Zuivel': colors.dairy,
    'Vetten & Oliën': colors.fats,
    'Fruit': colors.fruit,
    'Overig': colors.other
  }
  
  // Helper: Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Eiwitten': '🥚',
      'Groenten': '🥦',
      'Koolhydraten': '🍚',
      'Zuivel': '🥛',
      'Vetten & Oliën': '🫒',
      'Fruit': '🍎',
      'Overig': '📦'
    }
    return icons[category] || '📦'
  }
  
  // Helper: Draw gradient box (simulated with opacity)
  const drawGradientBox = (x, y, width, height, color, opacity1 = 0.15, opacity2 = 0.05) => {
    // Base color with higher opacity
    doc.setFillColor(...color)
    doc.setGState(new doc.GState({ opacity: opacity1 }))
    doc.roundedRect(x, y, width, height, 3, 3, 'F')
    
    // Overlay for gradient effect
    doc.setGState(new doc.GState({ opacity: opacity2 }))
    doc.roundedRect(x + 1, y + 1, width - 2, height - 2, 2, 2, 'F')
    
    // Reset opacity
    doc.setGState(new doc.GState({ opacity: 1 }))
    
    // Border
    doc.setDrawColor(...color)
    doc.setLineWidth(0.8)
    doc.roundedRect(x, y, width, height, 3, 3, 'S')
  }
  
  // Helper: Draw speech bubble
  const drawSpeechBubble = (x, y, width, height, text, avatar = 'K') => {
    // Avatar circle
    doc.setFillColor(...colors.green)
    doc.circle(x - 10, y + 12, 6, 'F')
    
    // Avatar text
    doc.setFillColor(...colors.black)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(avatar, x - 10, y + 15, { align: 'center' })
    
    // Speech bubble background
    drawGradientBox(x, y, width, height, colors.gold, 0.25, 0.15)
    
    // Arrow
    doc.setFillColor(...colors.gold)
    doc.setGState(new doc.GState({ opacity: 0.25 }))
    doc.triangle(x - 2, y + 10, x - 2, y + 14, x + 3, y + 12, 'F')
    doc.setGState(new doc.GState({ opacity: 1 }))
    
    // Text
    doc.setFillColor(...colors.white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, width - 10)
    let textY = y + 8
    lines.forEach(line => {
      doc.text(line, x + 5, textY)
      textY += 5
    })
  }
  
  // Helper: Draw premium box
  const drawPremiumBox = (x, y, width, height, color = colors.gold, title = '') => {
    drawGradientBox(x, y, width, height, color, 0.08, 0.04)
    
    if (title) {
      doc.setFillColor(...color)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(title, x + 5, y + 8)
    }
  }
  
  // Helper: Group ingredients by category
  const groupByCategory = (ingredients) => {
    return ingredients.reduce((acc, item) => {
      const cat = item.category || 'Overig'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
  }
  
  // ===== PAGE 1: PREMIUM COVER =====
  
  // Black background
  doc.setFillColor(...colors.black)
  doc.rect(0, 0, 210, 297, 'F')
  
  // Header gradient background
  doc.setFillColor(...colors.darkGray)
  doc.setGState(new doc.GState({ opacity: 0.95 }))
  doc.rect(0, 0, 210, 70, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
  
  // Badge
  doc.setFillColor(...colors.gold)
  doc.roundedRect(75, 15, 60, 10, 5, 5, 'F')
  doc.setFillColor(...colors.black)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('BOODSCHAPPEN', 105, 21, { align: 'center' })
  
  // Main title
  doc.setFillColor(...colors.gold)
  doc.setFontSize(38)
  doc.setFont('helvetica', 'bold')
  doc.text('MY ARC', 105, 40, { align: 'center' })
  
  // Subtitle
  doc.setFillColor(...colors.white)
  doc.setFontSize(14)
  doc.text('SHOPPING LIST', 105, 52, { align: 'center' })
  
  // Client info
  doc.setFillColor(...colors.mutedGray)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Voor: ${clientName}`, 105, 60, { align: 'center' })
  doc.text(`Week: ${weekRange}`, 105, 66, { align: 'center' })
  
  // Header border gradient
  doc.setFillColor(...colors.gold)
  doc.rect(0, 70, 210, 4, 'F')
  doc.setFillColor(...colors.orange)
  doc.setGState(new doc.GState({ opacity: 0.5 }))
  doc.rect(0, 70, 210, 4, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
  
  // Speech bubble from Kersten
  drawSpeechBubble(30, 85, 150, 35, 
    'Dit is jouw persoonlijke boodschappenlijst met al mijn tips voor slim winkelen. Bespaar tot 30% door slim te shoppen!',
    'K'
  )
  
  // Stats boxes
  const statsY = 130
  const boxWidth = 55
  const boxHeight = 30
  const gap = 12.5
  
  // Stats data
  const stats = [
    { 
      icon: '📊', 
      value: shoppingListData.itemCount || 0, 
      label: 'items',
      color: colors.green
    },
    { 
      icon: '💰', 
      value: `€${shoppingListData.totalCost || '0.00'}`, 
      label: 'totaal',
      color: colors.gold
    },
    { 
      icon: '🕐', 
      value: '~45min', 
      label: 'winkeltijd',
      color: colors.orange
    }
  ]
  
  stats.forEach((stat, index) => {
    const x = 27.5 + (index * (boxWidth + gap))
    
    drawGradientBox(x, statsY, boxWidth, boxHeight, stat.color)
    
    // Icon
    doc.setFontSize(18)
    doc.text(stat.icon, x + 8, statsY + 12)
    
    // Value
    doc.setFillColor(...colors.white)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(String(stat.value), x + boxWidth/2, statsY + 12, { align: 'center' })
    
    // Label
    doc.setFillColor(...colors.mutedGray)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + boxWidth/2, statsY + 22, { align: 'center' })
  })
  
  // Kersten's Shopping Philosophy Box
  let yPos = 170
  drawPremiumBox(20, yPos, 170, 70, colors.gold, '💡 KERSTEN\'S SHOPPING FILOSOFIE')
  
  doc.setFillColor(...colors.lightGray)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const philosophy = [
    '• Altijd eerst naar Lidl/Aldi voor basics (30-40% goedkoper)',
    '• Hele kip kopen i.p.v. kipfilet (€4-6/kg besparing)',
    '• Kwark bij Lidl = €0,69 vs €1,50 bij AH',
    '• Groente/fruit op de markt of bij Turkse supermarkt',
    '• Bulk kopen wat lang houdbaar is (rijst, pasta, blikken)'
  ]
  
  yPos += 15
  philosophy.forEach(tip => {
    doc.text(tip, 25, yPos)
    yPos += 8
  })
  
  // Footer
  doc.setFillColor(...colors.darkGray)
  doc.setGState(new doc.GState({ opacity: 0.95 }))
  doc.rect(0, 275, 210, 22, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
  
  // Footer border
  doc.setFillColor(...colors.gold)
  doc.rect(0, 275, 210, 3, 'F')
  
  // Footer text
  doc.setFillColor(...colors.gold)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Kersten\'s Shopping Guide', 105, 286, { align: 'center' })
  doc.setFillColor(...colors.darkText)
  doc.setFontSize(8)
  doc.text('Pagina 1', 105, 292, { align: 'center' })
  
  // ===== PAGE 2+: SHOPPING LIST =====
  doc.addPage()
  
  // Black background
  doc.setFillColor(...colors.black)
  doc.rect(0, 0, 210, 297, 'F')
  
  // Header
  doc.setFillColor(...colors.darkGray)
  doc.setGState(new doc.GState({ opacity: 0.95 }))
  doc.rect(0, 0, 210, 45, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
  
  // Badge
  doc.setFillColor(...colors.gold)
  doc.roundedRect(75, 8, 60, 8, 4, 4, 'F')
  doc.setFillColor(...colors.black)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('BOODSCHAPPENLIJST', 105, 13, { align: 'center' })
  
  // Title
  doc.setFillColor(...colors.gold)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('SHOPPING LIST', 105, 28, { align: 'center' })
  
  // Week info
  doc.setFillColor(...colors.mutedGray)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${clientName} • ${weekRange}`, 105, 37, { align: 'center' })
  
  // Header border
  doc.setFillColor(...colors.gold)
  doc.rect(0, 45, 210, 3, 'F')
  
  // Group ingredients
  const grouped = groupByCategory(shoppingListData.ingredients)
  const categoryOrder = ['Eiwitten', 'Groenten', 'Koolhydraten', 'Zuivel', 'Vetten & Oliën', 'Fruit', 'Overig']
  
  yPos = 60
  let pageNum = 2
  
  categoryOrder.forEach(category => {
    if (!grouped[category] || grouped[category].length === 0) return
    
    // Check if new page needed
    if (yPos > 240) {
      // Footer
      doc.setFillColor(...colors.darkGray)
      doc.setGState(new doc.GState({ opacity: 0.95 }))
      doc.rect(0, 275, 210, 22, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
      doc.setFillColor(...colors.gold)
      doc.rect(0, 275, 210, 3, 'F')
      doc.setFillColor(...colors.gold)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Kersten\'s Shopping Guide', 105, 286, { align: 'center' })
      doc.setFillColor(...colors.darkText)
      doc.setFontSize(8)
      doc.text(`Pagina ${pageNum}`, 105, 292, { align: 'center' })
      
      // New page
      doc.addPage()
      pageNum++
      
      // Repeat header
      doc.setFillColor(...colors.black)
      doc.rect(0, 0, 210, 297, 'F')
      doc.setFillColor(...colors.darkGray)
      doc.setGState(new doc.GState({ opacity: 0.95 }))
      doc.rect(0, 0, 210, 45, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
      doc.setFillColor(...colors.gold)
      doc.roundedRect(75, 8, 60, 8, 4, 4, 'F')
      doc.setFillColor(...colors.black)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('BOODSCHAPPENLIJST', 105, 13, { align: 'center' })
      doc.setFillColor(...colors.gold)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text('SHOPPING LIST', 105, 28, { align: 'center' })
      doc.setFillColor(...colors.mutedGray)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`${clientName} • ${weekRange}`, 105, 37, { align: 'center' })
      doc.setFillColor(...colors.gold)
      doc.rect(0, 45, 210, 3, 'F')
      
      yPos = 60
    }
    
    const categoryColor = categoryColors[category] || colors.other
    
    // Category header with icon
    doc.setFillColor(...categoryColor)
    doc.rect(20, yPos, 5, 10, 'F')
    
    doc.setFillColor(...colors.gold)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`${getCategoryIcon(category)} ${category.toUpperCase()}`, 30, yPos + 8)
    
    yPos += 15
    
    // Items in category
    grouped[category].forEach(item => {
      if (yPos > 240) return // Will create new page on next category
      
      // Item box
      drawGradientBox(25, yPos, 160, 25, categoryColor, 0.08, 0.04)
      
      // Checkbox
      doc.setDrawColor(...categoryColor)
      doc.setLineWidth(0.5)
      doc.rect(30, yPos + 6, 4, 4, 'S')
      
      // Item name
      doc.setFillColor(...colors.white)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(item.name || 'Onbekend', 38, yPos + 10)
      
      // Amount
      doc.setFillColor(...colors.lightGray)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      let displayAmount = ''
      if (item.displayAmount) {
        displayAmount = item.displayAmount
      } else if (item.amount) {
        displayAmount = `${item.amount}${item.unit || ''}`
      }
      doc.text(displayAmount, 38, yPos + 16)
      
      // Price badge
      if (item.pricePerPackage || item.estimatedCost) {
        doc.setFillColor(...categoryColor)
        doc.roundedRect(140, yPos + 7, 40, 10, 2, 2, 'F')
        doc.setFillColor(...colors.black)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        
        const price1 = item.pricePerPackage ? `€${item.pricePerPackage.toFixed(2)}` : ''
        const price2 = item.estimatedCost ? `€${item.estimatedCost.toFixed(2)}` : ''
        const priceText = [price1, price2].filter(Boolean).join(' • ')
        
        doc.text(priceText, 160, yPos + 13, { align: 'center' })
      }
      
      yPos += 30
    })
    
    yPos += 10 // Space between categories
  })
  
  // Final footer
  doc.setFillColor(...colors.darkGray)
  doc.setGState(new doc.GState({ opacity: 0.95 }))
  doc.rect(0, 275, 210, 22, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))
  doc.setFillColor(...colors.gold)
  doc.rect(0, 275, 210, 3, 'F')
  doc.setFillColor(...colors.gold)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Kersten\'s Shopping Guide', 105, 286, { align: 'center' })
  doc.setFillColor(...colors.darkText)
  doc.setFontSize(8)
  doc.text(`Pagina ${pageNum} • Groei! 💪`, 105, 292, { align: 'center' })
  
  // Save PDF
  const fileName = `MY_ARC_Boodschappen_${clientName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export default generatePremiumShoppingPDF
