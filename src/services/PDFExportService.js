// src/services/PDFExportService.js
// 🔥 PDF EXPORT SERVICE v1.0
// Clean PDF generation for meal plans + shopping lists

import jsPDF from 'jspdf'
import 'jspdf-autotable'

class PDFExportService {
  constructor() {
    this.primaryColor = [16, 185, 129] // #10b981 green
    this.textColor = [0, 0, 0]
    this.lightGray = [245, 245, 245]
    this.mediumGray = [200, 200, 200]
  }

  // ============================================
  // 1. WEEK PLAN PDF
  // ============================================
  async generateWeekPlanPDF(data) {
    const {
      weekPlan,
      clientName,
      dailyTargets,
      stats,
      mealPrepInfo
    } = data

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20

    // HEADER
    doc.setFillColor(...this.primaryColor)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('MY ARC MEAL PLAN', pageWidth / 2, 18, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Voor: ${clientName}`, pageWidth / 2, 28, { align: 'center' })
    doc.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}`, pageWidth / 2, 35, { align: 'center' })

    yPos = 50

    // DAILY TARGETS BOX
    doc.setTextColor(...this.textColor)
    doc.setFillColor(...this.lightGray)
    doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F')
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('📊 Dagelijkse Targets', 20, yPos + 7)
    
    doc.setFont('helvetica', 'normal')
    const targetText = `${dailyTargets.kcal} kcal  |  ${dailyTargets.protein}g eiwit  |  ${dailyTargets.carbs}g koolhydraten  |  ${dailyTargets.fat}g vet`
    doc.text(targetText, pageWidth / 2, yPos + 15, { align: 'center' })

    yPos += 35

    // WEEK OVERVIEW
    weekPlan.forEach((day, dayIndex) => {
      // Check page break
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = 20
      }

      // Day header
      doc.setFillColor(...this.primaryColor)
      doc.rect(15, yPos, pageWidth - 30, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(day.dayName.toUpperCase(), 20, yPos + 5.5)
      
      // Day totals
      const dayTotalText = `${Math.round(day.totals.kcal)} kcal | ${Math.round(day.totals.protein)}g P`
      doc.text(dayTotalText, pageWidth - 20, yPos + 5.5, { align: 'right' })

      yPos += 10

      // Meals
      doc.setTextColor(...this.textColor)
      doc.setFontSize(9)
      
      const meals = [
        { label: 'Ontbijt', meal: day.breakfast },
        { label: 'Lunch', meal: day.lunch },
        { label: 'Diner', meal: day.dinner }
      ]

      meals.forEach(({ label, meal }) => {
        if (!meal) return

        const isMealPrep = mealPrepInfo.weeklyPrepMeals.includes(meal.id)

        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 20, yPos)
        
        if (isMealPrep) {
          doc.setFillColor(16, 185, 129)
          doc.roundedRect(35, yPos - 3, 15, 4, 1, 1, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(7)
          doc.text('PREP', 42.5, yPos - 0.5, { align: 'center' })
          doc.setTextColor(...this.textColor)
          doc.setFontSize(9)
        }

        doc.setFont('helvetica', 'normal')
        doc.text(meal.name, isMealPrep ? 52 : 40, yPos)
        
        const macros = `${Math.round(meal.calories)} kcal | ${Math.round(meal.protein)}g P | ${Math.round(meal.carbs)}g C`
        doc.text(macros, pageWidth - 20, yPos, { align: 'right' })
        
        yPos += 6
      })

      // Snacks
      if (day.snacks && day.snacks.length > 0) {
        day.snacks.forEach((snack, idx) => {
          doc.setFont('helvetica', 'bold')
          doc.text(`Snack ${idx + 1}:`, 20, yPos)
          
          doc.setFont('helvetica', 'normal')
          doc.text(snack.name, 40, yPos)
          
          const macros = `${Math.round(snack.calories)} kcal | ${Math.round(snack.protein)}g P`
          doc.text(macros, pageWidth - 20, yPos, { align: 'right' })
          
          yPos += 6
        })
      }

      yPos += 4
    })

    // FOOTER - MEAL PREP INFO
    if (mealPrepInfo.weeklyPrepMeals.length > 0) {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        yPos = 20
      }

      doc.setFillColor(...this.lightGray)
      doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F')
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('🍱 Meal Prep Info', 20, yPos + 7)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Cook Day: ${mealPrepInfo.cookDay || 'Niet ingesteld'}`, 20, yPos + 14)
      doc.text(`Meal Prep Maaltijden: ${mealPrepInfo.weeklyPrepMeals.length} stuks`, 20, yPos + 20)
      doc.text('Deze maaltijden zijn gemarkeerd met PREP badge in het weekoverzicht', 20, yPos + 26)
    }

    // SAVE PDF
    const filename = `MY_ARC_Weekplan_${clientName}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`
    doc.save(filename)
    
    console.log(`✅ Week plan PDF saved: ${filename}`)
  }

  // ============================================
  // 2. SHOPPING LIST PDF
  // ============================================
  async generateShoppingListPDF(data) {
    const { weekPlan, allMeals, clientName } = data

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPos = 20

    // HEADER
    doc.setFillColor(...this.primaryColor)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('🛒 BOODSCHAPPENLIJST', pageWidth / 2, 18, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Voor: ${clientName}`, pageWidth / 2, 28, { align: 'center' })
    doc.text(`Week van ${new Date().toLocaleDateString('nl-NL')}`, pageWidth / 2, 35, { align: 'center' })

    yPos = 50

    // COLLECT ALL MEAL IDS
    const mealIds = new Set()
    weekPlan.forEach(day => {
      if (day.breakfast?.id) mealIds.add(day.breakfast.id)
      if (day.lunch?.id) mealIds.add(day.lunch.id)
      if (day.dinner?.id) mealIds.add(day.dinner.id)
      day.snacks?.forEach(snack => {
        if (snack?.id) mealIds.add(snack.id)
      })
    })

    // AGGREGATE INGREDIENTS
    const ingredientMap = new Map()

    mealIds.forEach(mealId => {
      const meal = allMeals.find(m => m.id === mealId)
      if (!meal) return

      let ingredientsList = meal.ingredients_list
      if (typeof ingredientsList === 'string') {
        try {
          ingredientsList = JSON.parse(ingredientsList)
        } catch {
          return
        }
      }

      if (Array.isArray(ingredientsList)) {
        ingredientsList.forEach(item => {
          const name = item.ingredient_name || item.name || 'Unknown'
          const amount = item.amount || 100
          const unit = item.unit || 'g'

          if (ingredientMap.has(name)) {
            const existing = ingredientMap.get(name)
            existing.amount += amount
            existing.count++
          } else {
            ingredientMap.set(name, { amount, unit, count: 1 })
          }
        })
      } else if (typeof ingredientsList === 'object' && ingredientsList !== null) {
        Object.entries(ingredientsList).forEach(([name, amount]) => {
          const amt = typeof amount === 'object' ? (amount.value || amount.amount || 100) : (amount || 100)
          const unit = typeof amount === 'object' ? (amount.unit || 'g') : 'g'

          if (ingredientMap.has(name)) {
            const existing = ingredientMap.get(name)
            existing.amount += amt
            existing.count++
          } else {
            ingredientMap.set(name, { amount: amt, unit, count: 1 })
          }
        })
      }
    })

    // SORT ALPHABETICALLY
    const sortedIngredients = Array.from(ingredientMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))

    // CATEGORIZE
    const categories = {
      'Eiwitten': ['kip', 'zalm', 'tonijn', 'ei', 'kwark', 'greek yogurt', 'skyr', 'whey', 'hüttenkäse'],
      'Koolhydraten': ['rijst', 'pasta', 'brood', 'havermout', 'aardappel', 'quinoa', 'couscous'],
      'Groenten': ['broccoli', 'spinazie', 'tomaat', 'paprika', 'ui', 'knoflook', 'wortel'],
      'Fruit': ['banaan', 'appel', 'bes', 'sinaasappel'],
      'Vetten': ['olijfolie', 'boter', 'avocado', 'noten', 'amandelen'],
      'Overig': []
    }

    const categorized = {}
    Object.keys(categories).forEach(cat => categorized[cat] = [])

    sortedIngredients.forEach(([name, data]) => {
      let assigned = false
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(kw => name.toLowerCase().includes(kw))) {
          categorized[category].push([name, data])
          assigned = true
          break
        }
      }
      if (!assigned) {
        categorized['Overig'].push([name, data])
      }
    })

    // RENDER CATEGORIES
    Object.entries(categorized).forEach(([category, items]) => {
      if (items.length === 0) return

      // Category header
      doc.setFillColor(...this.primaryColor)
      doc.rect(15, yPos, pageWidth - 30, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(category.toUpperCase(), 20, yPos + 4.5)

      yPos += 9

      // Items
      doc.setTextColor(...this.textColor)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      items.forEach(([name, data]) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }

        const checkbox = '☐'
        const text = `${name} - ${Math.round(data.amount)}${data.unit}`
        
        doc.text(checkbox, 20, yPos)
        doc.text(text, 30, yPos)
        
        if (data.count > 1) {
          doc.setFontSize(8)
          doc.setTextColor(100, 100, 100)
          doc.text(`(${data.count}x gebruikt)`, pageWidth - 20, yPos, { align: 'right' })
          doc.setTextColor(...this.textColor)
          doc.setFontSize(9)
        }

        yPos += 6
      })

      yPos += 4
    })

    // FOOTER
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Totaal ${sortedIngredients.length} ingrediënten`, pageWidth / 2, 285, { align: 'center' })
    doc.text('Vink ingrediënten af terwijl je winkelt!', pageWidth / 2, 290, { align: 'center' })

    // SAVE
    const filename = `MY_ARC_Boodschappenlijst_${clientName}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`
    doc.save(filename)
    
    console.log(`✅ Shopping list PDF saved: ${filename}`)
  }
}

export default PDFExportService
