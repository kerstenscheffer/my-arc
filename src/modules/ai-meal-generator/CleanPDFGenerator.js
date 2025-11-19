// src/modules/ai-meal-generator/CleanPDFGenerator.js
// Clean MY ARC Shopping List PDF Generator - Wit, simpel, functioneel

/**
 * Generate clean MY ARC shopping list PDF
 * @param {Object} shoppingListData - From ShoppingListFormatter.js
 * @param {string} clientName - Client's name
 * @param {string} weekRange - Week date range
 */
export const generateCleanShoppingPDF = (shoppingListData, clientName = 'Client', weekRange = 'Week Plan') => {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  // Clean color palette - geen fancy gradients
  const colors = {
    primary: [16, 185, 129],      // MY ARC green
    black: [0, 0, 0],             // Text
    gray: [100, 100, 100],        // Muted text
    lightGray: [240, 240, 240],   // Background fills
    white: [255, 255, 255]        // Page background
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
  
  // ===== PAGE 1: HEADER & OVERZICHT =====
  let pageNum = 1
  let yPos = 20
  
  // MY ARC Logo/Title
  doc.setTextColor(...colors.primary)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('MY ARC', 105, yPos, { align: 'center' })
  
  yPos += 10
  doc.setFontSize(16)
  doc.setTextColor(...colors.black)
  doc.text('BOODSCHAPPENLIJST', 105, yPos, { align: 'center' })
  
  yPos += 15
  
  // Client info box
  doc.setFillColor(...colors.lightGray)
  doc.rect(50, yPos - 8, 110, 25, 'F')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...colors.black)
  doc.text(`Voor: ${clientName}`, 105, yPos, { align: 'center' })
  
  yPos += 7
  doc.text(`Week: ${weekRange}`, 105, yPos, { align: 'center' })
  
  yPos += 20
  
  // Summary section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('OVERZICHT', 20, yPos)
  
  yPos += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  // Summary items - GEEN EMOJI's!
  const summaryLines = [
    `Totaal items: ${shoppingListData.itemCount || 0}`,
    `Geschatte kosten: EUR ${shoppingListData.totalCost || '0.00'}`,
    `Geschatte winkeltijd: 45 minuten`
  ]
  
  summaryLines.forEach(line => {
    doc.text(`• ${line}`, 25, yPos)
    yPos += 7
  })
  
  yPos += 10
  
  // Shopping tips
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SHOPPING TIPS', 20, yPos)
  
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...colors.gray)
  
  const tips = [
    'Start bij Lidl/Aldi voor basics (30-40% goedkoper)',
    'Hele kip kopen i.p.v. kipfilet spaart EUR 4-6/kg',
    'Check aanbiedingen voor grote hoeveelheden',
    'Groente/fruit vaak goedkoper op de markt'
  ]
  
  tips.forEach(tip => {
    doc.text(`• ${tip}`, 25, yPos)
    yPos += 6
  })
  
  // Footer page 1
  doc.setTextColor(...colors.gray)
  doc.setFontSize(9)
  doc.text('MY ARC - Jouw Personal Training Partner', 105, 280, { align: 'center' })
  doc.text(`Pagina ${pageNum}`, 195, 280, { align: 'right' })
  
  // ===== PAGE 2+: BOODSCHAPPENLIJST =====
  doc.addPage()
  pageNum++
  yPos = 20
  
  // Page header
  doc.setTextColor(...colors.primary)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('BOODSCHAPPENLIJST', 105, yPos, { align: 'center' })
  
  yPos += 15
  
  // Group ingredients
  const grouped = groupByCategory(shoppingListData.ingredients)
  const categoryOrder = ['Eiwitten', 'Groenten', 'Koolhydraten', 'Zuivel', 'Vetten & Oliën', 'Fruit', 'Overig']
  
  categoryOrder.forEach(category => {
    if (!grouped[category] || grouped[category].length === 0) return
    
    // Check for new page
    if (yPos > 250) {
      // Add footer
      doc.setTextColor(...colors.gray)
      doc.setFontSize(9)
      doc.text('MY ARC - Jouw Personal Training Partner', 105, 280, { align: 'center' })
      doc.text(`Pagina ${pageNum}`, 195, 280, { align: 'right' })
      
      doc.addPage()
      pageNum++
      yPos = 20
      
      // Repeat header
      doc.setTextColor(...colors.primary)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('BOODSCHAPPENLIJST', 105, yPos, { align: 'center' })
      yPos += 15
    }
    
    // Category header
    doc.setFillColor(...colors.lightGray)
    doc.rect(15, yPos - 5, 180, 10, 'F')
    
    doc.setTextColor(...colors.black)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(category.toUpperCase(), 20, yPos)
    
    yPos += 12
    
    // Items in category
    grouped[category].forEach(item => {
      if (yPos > 260) {
        // Footer and new page
        doc.setTextColor(...colors.gray)
        doc.setFontSize(9)
        doc.text('MY ARC - Jouw Personal Training Partner', 105, 280, { align: 'center' })
        doc.text(`Pagina ${pageNum}`, 195, 280, { align: 'right' })
        
        doc.addPage()
        pageNum++
        yPos = 20
        
        doc.setTextColor(...colors.primary)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('BOODSCHAPPENLIJST', 105, yPos, { align: 'center' })
        yPos += 15
      }
      
      // Checkbox
      doc.setDrawColor(...colors.black)
      doc.setLineWidth(0.5)
      doc.rect(20, yPos - 3, 4, 4)
      
      // Item name
      doc.setTextColor(...colors.black)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(item.name || 'Onbekend product', 28, yPos)
      
      // Amount
      let displayAmount = ''
      if (item.displayAmount) {
        displayAmount = item.displayAmount
      } else if (item.amount) {
        displayAmount = `${item.amount}${item.unit || 'gram'}`
      } else if (item.totalAmount) {
        displayAmount = `${Math.round(item.totalAmount)}${item.unit || 'gram'}`
      } else {
        displayAmount = 'Hoeveelheid onbekend'
      }
      
      doc.setTextColor(...colors.gray)
      doc.setFontSize(9)
      doc.text(displayAmount, 28, yPos + 5)
      
      // Price (if available)
      if (item.pricePerPackage || item.estimatedCost) {
        let priceText = ''
        if (item.pricePerPackage) {
          priceText = `EUR ${item.pricePerPackage.toFixed(2)}/stuk`
        }
        if (item.estimatedCost) {
          if (priceText) priceText += ' - '
          priceText += `Totaal: EUR ${item.estimatedCost.toFixed(2)}`
        }
        
        doc.setTextColor(...colors.primary)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(priceText, 195, yPos, { align: 'right' })
      }
      
      yPos += 12
      
      // Shopping tip if exists
      if (item.shoppingTip) {
        doc.setTextColor(...colors.gray)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.text(`Tip: ${item.shoppingTip}`, 28, yPos)
        yPos += 5
      }
    })
    
    yPos += 5 // Extra space between categories
  })
  
  // Footer last page
  doc.setTextColor(...colors.gray)
  doc.setFontSize(9)
  doc.text('MY ARC - Jouw Personal Training Partner', 105, 280, { align: 'center' })
  doc.text(`Pagina ${pageNum}`, 195, 280, { align: 'right' })
  
  // ===== LAATSTE PAGINA: WINKEL STRATEGIE =====
  doc.addPage()
  pageNum++
  yPos = 20
  
  doc.setTextColor(...colors.primary)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('WINKEL STRATEGIE', 105, yPos, { align: 'center' })
  
  yPos += 20
  
  // Winkel route
  doc.setTextColor(...colors.black)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('OPTIMALE ROUTE', 20, yPos)
  
  yPos += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  const route = [
    '1. Lidl/Aldi voor basis producten',
    '2. Groente & fruit bij markt of Turkse supermarkt',
    '3. Specifieke items bij AH/Jumbo indien nodig',
    '4. Diepvries als laatste (blijft koud)'
  ]
  
  route.forEach(step => {
    doc.text(step, 25, yPos)
    yPos += 8
  })
  
  yPos += 15
  
  // Bespaar tips
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('BESPAAR TIPS', 20, yPos)
  
  yPos += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  const savingTips = [
    'Hele kip kopen bespaart EUR 4-6 per kg',
    'Lidl kwark: EUR 0,69 vs EUR 1,50 bij AH',
    'Seizoensgroente tot 50% goedkoper',
    'Bulk rijst/pasta: EUR 0,50-1,00/kg besparing'
  ]
  
  savingTips.forEach(tip => {
    doc.text(`• ${tip}`, 25, yPos)
    yPos += 8
  })
  
  yPos += 20
  
  // Bottom message box
  doc.setFillColor(...colors.lightGray)
  doc.rect(30, yPos - 5, 150, 30, 'F')
  
  doc.setTextColor(...colors.black)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const message = 'Met deze tips bespaar je EUR 30-50 per maand!'
  doc.text(message, 105, yPos + 5, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.text('Dat is EUR 400+ per jaar extra in je zak', 105, yPos + 12, { align: 'center' })
  
  // Final footer
  doc.setTextColor(...colors.gray)
  doc.setFontSize(9)
  doc.text('MY ARC - Groei elke dag!', 105, 280, { align: 'center' })
  doc.text(`Pagina ${pageNum}`, 195, 280, { align: 'right' })
  
  // Save the PDF
  const fileName = `MY_ARC_Boodschappen_${clientName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export default generateCleanShoppingPDF
