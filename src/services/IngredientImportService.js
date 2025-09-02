// src/services/IngredientImportService.js
import DatabaseService from './DatabaseService'

/**
 * IngredientImportService - Converts supermarket product CSV to ingredient SQL
 * Handles nutritional data estimation and unit conversions
 */
class IngredientImportService {
  
  // Nutritional database per 100g (uitgebreide database)
  static nutritionalData = {
    // GROENTE
    'broccoli': { kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6 },
    'spinazie': { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
    'paprika': { kcal: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1 },
    'tomaten': { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
    'komkommer': { kcal: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
    'aubergine': { kcal: 25, protein: 1.0, carbs: 5.9, fat: 0.2, fiber: 3.0 },
    'courgette': { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1.0 },
    'bloemkool': { kcal: 25, protein: 1.9, carbs: 5.0, fat: 0.3, fiber: 2.0 },
    'boerenkool': { kcal: 49, protein: 4.3, carbs: 8.8, fat: 0.9, fiber: 3.6 },
    'champignons': { kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1.0 },
    'sperziebonen': { kcal: 31, protein: 1.8, carbs: 7.0, fat: 0.2, fiber: 2.7 },
    'ui': { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
    'knoflook': { kcal: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1 },
    'prei': { kcal: 61, protein: 1.5, carbs: 14.2, fat: 0.3, fiber: 1.8 },
    'wortelen': { kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8 },
    'zoete_aardappel': { kcal: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3.0 },
    'asperges': { kcal: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1 },
    'rucola': { kcal: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6 },
    'sla': { kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3 },
    
    // VLEES
    'kipfilet': { kcal: 165, protein: 31.0, carbs: 0, fat: 3.6, fiber: 0 },
    'kippendij': { kcal: 221, protein: 18.6, carbs: 0, fat: 15.9, fiber: 0 },
    'kipgehakt': { kcal: 189, protein: 27.0, carbs: 0, fat: 8.0, fiber: 0 },
    'kalkoen': { kcal: 135, protein: 30.0, carbs: 0, fat: 1.0, fiber: 0 },
    'biefstuk': { kcal: 271, protein: 26.0, carbs: 0, fat: 18.0, fiber: 0 },
    'rundergehakt': { kcal: 250, protein: 26.0, carbs: 0, fat: 17.0, fiber: 0 },
    'rundertartaar': { kcal: 130, protein: 21.5, carbs: 0, fat: 5.0, fiber: 0 },
    'varkenshaas': { kcal: 143, protein: 26.0, carbs: 0, fat: 3.5, fiber: 0 },
    'rookvlees': { kcal: 132, protein: 22.0, carbs: 0.5, fat: 4.5, fiber: 0 },
    
    // VIS
    'zalm': { kcal: 208, protein: 20.0, carbs: 0, fat: 13.0, fiber: 0 },
    'tonijn': { kcal: 132, protein: 29.0, carbs: 0, fat: 1.0, fiber: 0 },
    'makreel': { kcal: 205, protein: 18.6, carbs: 0, fat: 13.9, fiber: 0 },
    'kabeljauw': { kcal: 82, protein: 18.0, carbs: 0, fat: 0.7, fiber: 0 },
    'sardines': { kcal: 208, protein: 25.0, carbs: 0, fat: 11.0, fiber: 0 },
    'ansjovis': { kcal: 131, protein: 20.0, carbs: 0, fat: 5.0, fiber: 0 },
    
    // ZUIVEL
    'melk': { kcal: 42, protein: 3.4, carbs: 5.0, fat: 1.0, fiber: 0 },
    'yoghurt': { kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0 },
    'griekse_yoghurt': { kcal: 59, protein: 10.0, carbs: 3.6, fat: 0.4, fiber: 0 },
    'skyr': { kcal: 63, protein: 11.0, carbs: 4.0, fat: 0.2, fiber: 0 },
    'kwark': { kcal: 69, protein: 12.0, carbs: 4.0, fat: 0.3, fiber: 0 },
    'cottage_cheese': { kcal: 98, protein: 11.0, carbs: 3.4, fat: 4.3, fiber: 0 },
    'kaas': { kcal: 356, protein: 25.0, carbs: 2.2, fat: 27.0, fiber: 0 },
    'mozzarella': { kcal: 280, protein: 28.0, carbs: 3.0, fat: 17.0, fiber: 0 },
    'ei': { kcal: 155, protein: 13.0, carbs: 1.1, fat: 11.0, fiber: 0 },
    'karnemelk': { kcal: 40, protein: 3.3, carbs: 4.8, fat: 0.9, fiber: 0 },
    
    // GRANEN
    'brood': { kcal: 265, protein: 9.0, carbs: 49.0, fat: 3.2, fiber: 2.7 },
    'volkoren_brood': { kcal: 247, protein: 13.0, carbs: 41.0, fat: 4.2, fiber: 6.9 },
    'pasta': { kcal: 371, protein: 13.0, carbs: 75.0, fat: 1.5, fiber: 3.0 },
    'rijst': { kcal: 365, protein: 7.0, carbs: 80.0, fat: 0.7, fiber: 1.3 },
    'quinoa': { kcal: 368, protein: 14.0, carbs: 64.0, fat: 6.0, fiber: 7.0 },
    'havermout': { kcal: 389, protein: 17.0, carbs: 66.0, fat: 7.0, fiber: 10.0 },
    'muesli': { kcal: 364, protein: 10.0, carbs: 64.0, fat: 8.0, fiber: 8.0 },
    'bulgur': { kcal: 342, protein: 12.0, carbs: 76.0, fat: 1.3, fiber: 18.0 },
    'couscous': { kcal: 376, protein: 13.0, carbs: 77.0, fat: 0.6, fiber: 5.0 },
    'wraps': { kcal: 320, protein: 9.0, carbs: 54.0, fat: 8.0, fiber: 3.0 },
    'crackers': { kcal: 384, protein: 11.0, carbs: 74.0, fat: 4.5, fiber: 15.0 },
    'maiswafels': { kcal: 388, protein: 8.0, carbs: 84.0, fat: 1.0, fiber: 3.0 },
    'rijstwafels': { kcal: 392, protein: 9.0, carbs: 82.0, fat: 3.0, fiber: 4.0 },
    
    // FRUIT
    'appels': { kcal: 52, protein: 0.3, carbs: 14.0, fat: 0.2, fiber: 2.4 },
    'bananen': { kcal: 89, protein: 1.1, carbs: 23.0, fat: 0.3, fiber: 2.6 },
    'aardbeien': { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0 },
    'blauwe_bessen': { kcal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4 },
    'frambozen': { kcal: 52, protein: 1.2, carbs: 12.0, fat: 0.7, fiber: 6.5 },
    'druiven': { kcal: 67, protein: 0.6, carbs: 17.0, fat: 0.4, fiber: 0.9 },
    'sinaasappels': { kcal: 47, protein: 0.9, carbs: 12.0, fat: 0.1, fiber: 2.4 },
    'mango': { kcal: 60, protein: 0.8, carbs: 15.0, fat: 0.4, fiber: 1.6 },
    'ananas': { kcal: 50, protein: 0.5, carbs: 13.0, fat: 0.1, fiber: 1.4 },
    'kiwi': { kcal: 61, protein: 1.1, carbs: 15.0, fat: 0.5, fiber: 3.0 },
    'peren': { kcal: 57, protein: 0.4, carbs: 15.0, fat: 0.1, fiber: 3.1 },
    'grapefruit': { kcal: 42, protein: 0.8, carbs: 11.0, fat: 0.1, fiber: 1.6 },
    'avocado': { kcal: 160, protein: 2.0, carbs: 9.0, fat: 15.0, fiber: 7.0 },
    
    // PEULVRUCHTEN
    'kikkererwten': { kcal: 164, protein: 9.0, carbs: 27.0, fat: 2.6, fiber: 8.0 },
    'linzen': { kcal: 116, protein: 9.0, carbs: 20.0, fat: 0.4, fiber: 8.0 },
    'bonen': { kcal: 127, protein: 9.0, carbs: 23.0, fat: 0.5, fiber: 6.5 },
    'kidneybonen': { kcal: 127, protein: 9.0, carbs: 23.0, fat: 0.5, fiber: 6.5 },
    'witte_bonen': { kcal: 140, protein: 9.5, carbs: 25.0, fat: 0.6, fiber: 6.3 },
    'zwarte_bonen': { kcal: 132, protein: 9.0, carbs: 24.0, fat: 0.5, fiber: 8.7 },
    'bruine_bonen': { kcal: 151, protein: 9.0, carbs: 27.0, fat: 0.8, fiber: 5.5 },
    
    // NOTEN & ZADEN
    'amandelen': { kcal: 579, protein: 21.0, carbs: 22.0, fat: 49.0, fiber: 12.5 },
    'cashewnoten': { kcal: 553, protein: 18.0, carbs: 30.0, fat: 44.0, fiber: 3.3 },
    'walnoten': { kcal: 654, protein: 15.0, carbs: 14.0, fat: 65.0, fiber: 7.0 },
    'pindakaas': { kcal: 588, protein: 25.0, carbs: 20.0, fat: 50.0, fiber: 6.0 },
    'pistachenoten': { kcal: 560, protein: 20.0, carbs: 28.0, fat: 45.0, fiber: 10.0 },
    'chiazaad': { kcal: 486, protein: 17.0, carbs: 42.0, fat: 31.0, fiber: 34.0 },
    'lijnzaad': { kcal: 534, protein: 18.0, carbs: 29.0, fat: 42.0, fiber: 27.0 },
    'pompoenpitten': { kcal: 559, protein: 19.0, carbs: 11.0, fat: 49.0, fiber: 6.0 },
    
    // OLIËN & VETTEN
    'olijfolie': { kcal: 884, protein: 0, carbs: 0, fat: 100.0, fiber: 0 },
    'kokosolie': { kcal: 862, protein: 0, carbs: 0, fat: 100.0, fiber: 0 },
    
    // KRUIDEN & SPECERIJEN (per 100g - maar vaak in kleine hoeveelheden gebruikt)
    'basilicum': { kcal: 23, protein: 3.2, carbs: 2.7, fat: 0.6, fiber: 1.6 },
    'oregano': { kcal: 265, protein: 9.0, carbs: 69.0, fat: 4.3, fiber: 42.5 },
    'paprikapoeder': { kcal: 282, protein: 14.0, carbs: 54.0, fat: 13.0, fiber: 35.0 },
    'kerrie': { kcal: 325, protein: 14.0, carbs: 56.0, fat: 14.0, fiber: 53.0 },
    'kaneel': { kcal: 247, protein: 4.0, carbs: 81.0, fat: 1.2, fiber: 53.0 },
    'peper': { kcal: 251, protein: 10.0, carbs: 64.0, fat: 3.3, fiber: 25.0 },
    'zout': { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    
    // PLANTAARDIGE ALTERNATIEVEN
    'tofu': { kcal: 76, protein: 8.0, carbs: 1.9, fat: 4.8, fiber: 0.3 },
    'tempeh': { kcal: 193, protein: 19.0, carbs: 9.0, fat: 11.0, fiber: 9.0 },
    'seitan': { kcal: 370, protein: 75.0, carbs: 14.0, fat: 2.0, fiber: 0.6 },
    'sojadrink': { kcal: 33, protein: 3.3, carbs: 1.8, fat: 1.8, fiber: 0.5 },
    'amandeldrink': { kcal: 13, protein: 0.4, carbs: 0.3, fat: 1.1, fiber: 0.2 },
    'haverdrink': { kcal: 46, protein: 0.4, carbs: 7.0, fat: 1.5, fiber: 0.8 },
    
    // SAUZEN & CONDIMENTEN
    'ketchup': { kcal: 112, protein: 1.0, carbs: 27.0, fat: 0.1, fiber: 0.3 },
    'mayonaise': { kcal: 680, protein: 1.0, carbs: 3.0, fat: 75.0, fiber: 0 },
    'mosterd': { kcal: 66, protein: 4.0, carbs: 6.0, fat: 3.0, fiber: 3.0 },
    'sojasaus': { kcal: 53, protein: 8.0, carbs: 5.0, fat: 0.1, fiber: 0.8 },
    'sriracha': { kcal: 93, protein: 2.0, carbs: 19.0, fat: 1.0, fiber: 2.0 },
    'pesto': { kcal: 340, protein: 3.7, carbs: 6.0, fat: 34.0, fiber: 2.0 },
    'hummus': { kcal: 166, protein: 8.0, carbs: 14.0, fat: 10.0, fiber: 6.0 },
    'tzatziki': { kcal: 117, protein: 5.0, carbs: 4.0, fat: 10.0, fiber: 0.5 },
    
    // SNACKS & SUPPLEMENTEN
    'protein_bar': { kcal: 350, protein: 30.0, carbs: 35.0, fat: 10.0, fiber: 3.0 },
    'whey': { kcal: 380, protein: 80.0, carbs: 10.0, fat: 5.0, fiber: 0 },
    'beef_jerky': { kcal: 410, protein: 33.0, carbs: 11.0, fat: 26.0, fiber: 0 },
    'popcorn': { kcal: 375, protein: 13.0, carbs: 74.0, fat: 4.5, fiber: 14.5 },
    'chocolade': { kcal: 546, protein: 5.0, carbs: 61.0, fat: 31.0, fiber: 7.0 }
  }

  /**
   * Unit conversions naar gram
   */
  static unitConversions = {
    'stuks': {
      'ei': 50,
      'paprika': 170,
      'komkommer': 400,
      'tomaat': 150,
      'avocado': 200,
      'broccoli': 500,
      'bloemkool': 700,
      'courgette': 200,
      'aubergine': 300,
      'ui': 150,
      'knoflook': 30,
      'ananas': 1500,
      'mango': 350,
      'grapefruit': 300,
      'kiwi': 90,
      'appel': 180,
      'peer': 180,
      'sinaasappel': 200,
      'banaan': 120,
      'wrap': 65,
      'tortilla': 65,
      'pita': 60
    },
    'ml': {
      'melk': 1.03,
      'yoghurt': 1.03,
      'olie': 0.92,
      'azijn': 1.01,
      'saus': 1.02,
      'drank': 1.0
    },
    'gram': 1,
    'kg': 1000,
    'l': 1000
  }

  /**
   * Parse CSV product data
   */
  static parseCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    // Detect delimiter - check for | or ,
    const delimiter = lines[0].includes('|') ? '|' : ','
    console.log('Detected delimiter:', delimiter)
    
    const headers = lines[0].split(delimiter).map(h => h.trim())
    console.log('Headers found:', headers)
    
    const products = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue // Skip empty lines
      
      const values = lines[i].split(delimiter).map(v => v ? v.trim() : '')
      const product = {}
      
      headers.forEach((header, index) => {
        product[header] = values[index] || ''
      })
      
      // Log first product for debugging
      if (i === 1) {
        console.log('First product parsed:', product)
      }
      
      // Only add if product has at least a name
      if (product.name || product.Name) {
        products.push(product)
      }
    }
    
    console.log(`Parsed ${products.length} products`)
    return products
  }

  /**
   * Find best matching nutritional data
   */
  static findNutritionalData(productName, category, subcategory) {
    // Null check voor productName
    if (!productName) {
      productName = ''
    }
    const searchTerms = productName.toLowerCase()
    
    // Direct matches op product naam
    for (const [key, data] of Object.entries(this.nutritionalData)) {
      if (searchTerms.includes(key)) {
        return { ...data, matched: key }
      }
    }
    
    // Category-based matches
    const categoryMapping = {
      'vlees': 'kipfilet',
      'vis': 'zalm',
      'zuivel': 'melk',
      'groente': 'groente_mix',
      'fruit': 'appel',
      'granen': 'brood',
      'noten': 'amandelen',
      'peulvruchten': 'bonen'
    }
    
    const lowerCategory = (category || '').toLowerCase()
    if (categoryMapping[lowerCategory] && this.nutritionalData[categoryMapping[lowerCategory]]) {
      return { ...this.nutritionalData[categoryMapping[lowerCategory]], estimated: true }
    }
    
    // Default gezonde waarden - NOOIT undefined!
    return {
      kcal: 100,
      protein: 5,
      carbs: 15,
      fat: 3,
      fiber: 2,
      estimated: true
    }
  }

  /**
   * Convert grams per unit based on product type
   */
  static calculateGramsPerUnit(product) {
    const unit = product.unit?.toLowerCase() || 'gram'
    const packageSize = parseFloat(product.package_size) || 100
    
    // Voor ml-based producten
    if (unit === 'ml') {
      const conversionFactor = this.unitConversions.ml[product.category] || 1.0
      return packageSize * conversionFactor / (packageSize / 100)
    }
    
    // Voor stuks
    if (unit === 'stuks') {
      const productKey = product.name.toLowerCase().split(' ')[0]
      return this.unitConversions.stuks[productKey] || 100
    }
    
    // Voor gram/kg
    if (unit === 'kg') return 1000
    if (unit === 'l') return 1000
    
    return 100 // Default per 100g
  }

  /**
   * Generate SQL INSERT statement for ingredient
   */
  static generateSQL(product) {
    // Debug logging
    console.log('Generating SQL for product:', product)
    
    // Check verschillende mogelijke veldnamen (case-sensitive issue mogelijk)
    const productName = product.name || product.Name || product.NAME || ''
    const productCategory = product.category || product.Category || product.CATEGORY || ''
    const productBrand = product.brand || product.Brand || product.BRAND || ''
    const productUnit = product.unit || product.Unit || product.UNIT || 'gram'
    const productBarcode = product.barcode || product.Barcode || product.BARCODE || ''
    
    // Validate product heeft naam
    if (!productName || productName.trim() === '') {
      console.warn('Skipping product without name:', product)
      return null
    }
    
    const nutritionalData = this.findNutritionalData(
      productName,
      productCategory,
      product.subcategory || product.Subcategory || ''
    )
    
    const gramsPerUnit = this.calculateGramsPerUnit(product)
    
    // Clean product name EN escape apostrophes
    const cleanName = productName
      .replace(/\d+g\b/g, '')
      .replace(/\d+ml\b/g, '')
      .replace(/\d+kg\b/g, '')
      .replace(/\d+ stuks/g, '')
      .replace(/\(.*?\)/g, '')
      .trim()
      .replace(/'/g, "''") // BELANGRIJK: Escape single quotes voor SQL
    
    // Escape alle andere velden ook
    const escapedCategory = (productCategory || 'other').replace(/'/g, "''")
    const escapedBrand = productBrand.replace(/'/g, "''")
    const escapedBarcode = productBarcode.replace(/'/g, "''")
    const escapedUnit = productUnit.replace(/'/g, "''")
    
    const sql = `INSERT INTO ingredients (
  name,
  category,
  per_100g_kcal,
  per_100g_protein,
  per_100g_carbs,
  per_100g_fat,
  per_100g_fiber,
  default_unit,
  grams_per_unit,
  brand,
  barcode${nutritionalData.estimated ? '\n  -- estimated values' : ''}
) VALUES (
  '${cleanName}',
  '${escapedCategory}',
  ${nutritionalData.kcal || 100},
  ${nutritionalData.protein || 5},
  ${nutritionalData.carbs || 15},
  ${nutritionalData.fat || 3},
  ${nutritionalData.fiber || 2},
  '${escapedUnit}',
  ${gramsPerUnit || 100},
  '${escapedBrand}',
  ${escapedBarcode ? `'${escapedBarcode}'` : 'NULL'}
) ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  per_100g_kcal = EXCLUDED.per_100g_kcal,
  per_100g_protein = EXCLUDED.per_100g_protein,
  per_100g_carbs = EXCLUDED.per_100g_carbs,
  per_100g_fat = EXCLUDED.per_100g_fat,
  per_100g_fiber = EXCLUDED.per_100g_fiber,
  brand = EXCLUDED.brand,
  barcode = EXCLUDED.barcode;`
    
    return sql
  }

  /**
   * Process complete CSV and generate SQL file
   */
  static async processCSVToSQL(csvContent) {
    try {
      const products = this.parseCSV(csvContent)
      
      if (products.length === 0) {
        throw new Error('No valid products found in CSV')
      }
      
      // Group by category - fix case sensitivity
      const grouped = {}
      products.forEach(product => {
        const category = product.category || product.Category || 'other'
        if (!grouped[category]) grouped[category] = []
        grouped[category].push(product)
      })
      
      console.log('Categories found:', Object.keys(grouped))
      
      // Generate SQL statements
      let sqlOutput = `-- Generated Ingredient Import SQL
-- Date: ${new Date().toISOString()}
-- Total Products: ${products.length}

BEGIN TRANSACTION;

`
      
      let totalGenerated = 0
      
      // Process each category
      for (const [category, categoryProducts] of Object.entries(grouped)) {
        let categorySql = ''
        let categoryCount = 0
        
        categoryProducts.forEach(product => {
          const sql = this.generateSQL(product)
          if (sql) {
            categorySql += sql + '\n\n'
            categoryCount++
            totalGenerated++
          }
        })
        
        if (categorySql) {
          sqlOutput += `\n-- ==========================================\n`
          sqlOutput += `-- CATEGORY: ${category.toUpperCase()} (${categoryCount} products)\n`
          sqlOutput += `-- ==========================================\n\n`
          sqlOutput += categorySql
        }
      }
      
      sqlOutput += `\nCOMMIT;\n\n`
      sqlOutput += `-- Total products generated: ${totalGenerated}\n`
      
      // Statistics
      const stats = {
        total: products.length,
        generated: totalGenerated,
        byCategory: Object.fromEntries(
          Object.entries(grouped).map(([cat, prods]) => [cat, prods.length])
        ),
        estimated: products.filter(p => {
          const data = this.findNutritionalData(p.name || p.Name, p.category || p.Category, p.subcategory || p.Subcategory)
          return data.estimated
        }).length
      }
      
      console.log('Generation stats:', stats)
      
      return {
        sql: sqlOutput,
        stats: stats,
        success: true
      }
      
    } catch (error) {
      console.error('Error processing CSV:', error)
      return {
        sql: null,
        stats: null,
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Save to Supabase (optional - voor directe import)
   */
  static async importToDatabase(ingredients) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    for (const ingredient of ingredients) {
      try {
        const { error } = await DatabaseService.supabase
          .from('ingredients')
          .insert(ingredient)
        
        if (error) throw error
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          ingredient: ingredient.name,
          error: error.message
        })
      }
    }
    
    return results
  }
}

// Extend DatabaseService
DatabaseService.importIngredients = async function(csvContent) {
  return await IngredientImportService.processCSVToSQL(csvContent)
}

export default IngredientImportService
