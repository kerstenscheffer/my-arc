// src/modules/shopping/ShoppingService.js - V3 UNIT CONVERSION SYSTEM
export default class ShoppingService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
    
    // ── PLACEHOLDER INGREDIENT MAP ──
    // Veel ai_meals zijn ooit aangemaakt met placeholder-strings als
    // ingredient_id (bv. "EGGS-UUID", "[BOTER-UUID-HIER]") in plaats van
    // echte UUIDs. Die strings bestaan niet in ai_ingredients, dus de
    // shopping-list fallback toonde voorheen "Unknown Ingredient" voor
    // ~82 maaltijden. Deze map vertaalt elke bekende placeholder naar
    // een nette Nederlandse naam + correcte category, zodat de klant
    // wél een leesbare boodschappenlijst krijgt totdat de data zelf is
    // opgeschoond.
    this.PLACEHOLDER_MAP = {
      // Proteins
      'EGGS-UUID':            { name: 'Eieren',              category: 'protein',    unit_type: 'gram' },
      'BOILED-EGG-UUID':      { name: 'Eieren',              category: 'protein',    unit_type: 'gram' },
      'EGG-WHITES-UUID':      { name: 'Eiwitten',            category: 'protein',    unit_type: 'gram' },
      'EGG-SALAD-UUID':       { name: 'Eiersalade',          category: 'protein',    unit_type: 'gram' },
      'HAM-UUID':             { name: 'Ham',                 category: 'protein',    unit_type: 'gram' },
      'HAM-CUBES-UUID':       { name: 'Hamblokjes',          category: 'protein',    unit_type: 'gram' },
      'CHICKEN-SLICES-UUID':  { name: 'Kipfilet plakjes',    category: 'protein',    unit_type: 'gram' },
      'GRILLED-CHICKEN-UUID': { name: 'Gegrilde kip',        category: 'protein',    unit_type: 'gram' },
      'CANNED-TUNA-UUID':     { name: 'Tonijn (blik)',       category: 'protein',    unit_type: 'gram' },
      'WHEY-VANILLA-UUID':    { name: 'Whey eiwit vanille',  category: 'protein',    unit_type: 'gram' },
      'PROTEIN-BAR-UUID':     { name: 'Proteïnereep',        category: 'protein',    unit_type: 'gram' },

      // Carbs
      'BREAD-UUID':           { name: 'Brood',               category: 'carbs',      unit_type: 'gram' },
      'OATS-UUID':            { name: 'Havermout',           category: 'carbs',      unit_type: 'gram' },
      'MUESLI-UUID':          { name: 'Muesli',              category: 'carbs',      unit_type: 'gram' },
      'GRANOLA-UUID':         { name: 'Granola',             category: 'carbs',      unit_type: 'gram' },
      'CROISSANT-UUID':       { name: 'Croissant',           category: 'carbs',      unit_type: 'gram' },
      'ENGLISH-MUFFIN-UUID':  { name: 'English Muffin',      category: 'carbs',      unit_type: 'gram' },
      'ONTBIJTKOEK-UUID':     { name: 'Ontbijtkoek',         category: 'carbs',      unit_type: 'gram' },
      'BRINTA-UUID':          { name: 'Brinta',              category: 'carbs',      unit_type: 'gram' },
      'CRACKERS-UUID':        { name: 'Crackers',            category: 'carbs',      unit_type: 'gram' },
      'LIGA-UUID':            { name: 'Liga koeken',         category: 'carbs',      unit_type: 'gram' },
      'MUESLI-BAR-UUID':      { name: 'Muesli reep',         category: 'carbs',      unit_type: 'gram' },
      'RICE-CAKE-PLAIN-UUID':   { name: 'Rijstwafels naturel',   category: 'carbs', unit_type: 'gram' },
      'RICE-CAKE-BBQ-UUID':     { name: 'Rijstwafels barbecue',  category: 'carbs', unit_type: 'gram' },
      'RICE-CAKE-CHEESE-UUID':  { name: 'Rijstwafels kaas',      category: 'carbs', unit_type: 'gram' },
      'RICE-CAKE-PAPRIKA-UUID': { name: 'Rijstwafels paprika',   category: 'carbs', unit_type: 'gram' },
      'RICE-CAKE-SALT-UUID':    { name: 'Rijstwafels zeezout',   category: 'carbs', unit_type: 'gram' },
      'RICE-CAKE-CHOCO-UUID':   { name: 'Rijstwafels chocolade', category: 'carbs', unit_type: 'gram' },

      // Dairy
      'MILK-UUID':            { name: 'Melk',                category: 'dairy',      unit_type: 'ml'   },
      'ALMOND-MILK-UUID':     { name: 'Amandelmelk',         category: 'dairy',      unit_type: 'ml'   },
      'GREEK-YOGURT-UUID':    { name: 'Griekse yoghurt',     category: 'dairy',      unit_type: 'gram' },
      'YOGURT-UUID':          { name: 'Yoghurt',             category: 'dairy',      unit_type: 'gram' },
      'SKYR-UUID':            { name: 'Skyr',                category: 'dairy',      unit_type: 'gram' },
      'QUARK-UUID':           { name: 'Kwark',               category: 'dairy',      unit_type: 'gram' },
      'COTTAGE-CHEESE-UUID':  { name: 'Cottage cheese',      category: 'dairy',      unit_type: 'gram' },
      'MOZZARELLA-UUID':      { name: 'Mozzarella',          category: 'dairy',      unit_type: 'gram' },
      'CHEDDAR-UUID':         { name: 'Cheddar',             category: 'dairy',      unit_type: 'gram' },
      'GORGONZOLA-UUID':      { name: 'Gorgonzola',          category: 'dairy',      unit_type: 'gram' },
      'BRIE-UUID':            { name: 'Brie',                category: 'dairy',      unit_type: 'gram' },
      'GRATED-CHEESE-UUID':   { name: 'Geraspte kaas',       category: 'dairy',      unit_type: 'gram' },

      // Fats
      '[BOTER-UUID-HIER]':    { name: 'Boter',               category: 'fats',       unit_type: 'gram' },
      'OLIVE-OIL-UUID':       { name: 'Olijfolie',           category: 'fats',       unit_type: 'ml'   },
      'PEANUT-BUTTER-UUID':   { name: 'Pindakaas',           category: 'fats',       unit_type: 'gram' },
      'MIXED-NUTS-UUID':      { name: 'Notenmix',            category: 'fats',       unit_type: 'gram' },
      'WALNUTS-UUID':         { name: 'Walnoten',            category: 'fats',       unit_type: 'gram' },
      'AVOCADO-UUID':         { name: 'Avocado',             category: 'fats',       unit_type: 'gram' },
      'COOKING-SPRAY-UUID':   { name: 'Bakspray',            category: 'fats',       unit_type: 'ml'   },
      'HOLLANDAISE-UUID':     { name: 'Hollandaisesaus',     category: 'fats',       unit_type: 'ml'   },

      // Fruit
      'BANANA-UUID':          { name: 'Banaan',              category: 'fruit',      unit_type: 'gram' },
      'APPLE-UUID':           { name: 'Appel',               category: 'fruit',      unit_type: 'gram' },
      'ORANGE-UUID':          { name: 'Sinaasappel',         category: 'fruit',      unit_type: 'gram' },
      'BLUEBERRIES-UUID':     { name: 'Blauwe bessen',       category: 'fruit',      unit_type: 'gram' },
      'STRAWBERRIES-UUID':    { name: 'Aardbeien',           category: 'fruit',      unit_type: 'gram' },
      'RASPBERRIES-UUID':     { name: 'Frambozen',           category: 'fruit',      unit_type: 'gram' },
      'PINEAPPLE-UUID':       { name: 'Ananas',              category: 'fruit',      unit_type: 'gram' },
      'MIXED-FRUIT-UUID':     { name: 'Gemengd fruit',       category: 'fruit',      unit_type: 'gram' },

      // Vegetables
      'TOMATO-UUID':          { name: 'Tomaat',              category: 'vegetables', unit_type: 'gram' },
      'CHERRY-TOMATO-UUID':   { name: 'Cherrytomaatjes',     category: 'vegetables', unit_type: 'gram' },
      'CANNED-TOMATOES-UUID': { name: 'Tomaten (blik)',      category: 'vegetables', unit_type: 'gram' },
      'CUCUMBER-UUID':        { name: 'Komkommer',           category: 'vegetables', unit_type: 'gram' },
      'LETTUCE-UUID':         { name: 'Sla',                 category: 'vegetables', unit_type: 'gram' },
      'SPINACH-UUID':         { name: 'Spinazie',            category: 'vegetables', unit_type: 'gram' },
      'ONION-UUID':           { name: 'Ui',                  category: 'vegetables', unit_type: 'gram' },
      'GARLIC-UUID':          { name: 'Knoflook',            category: 'vegetables', unit_type: 'gram' },
      'BELL-PEPPER-UUID':     { name: 'Paprika',             category: 'vegetables', unit_type: 'gram' },
      'MUSHROOMS-UUID':       { name: 'Champignons',         category: 'vegetables', unit_type: 'gram' },
      'BASIL-UUID':           { name: 'Basilicum',           category: 'vegetables', unit_type: 'gram' },

      // Other / spices / extras
      'HUMMUS-UUID':          { name: 'Hummus',              category: 'other',      unit_type: 'gram' },
      'PESTO-UUID':           { name: 'Pesto',               category: 'other',      unit_type: 'gram' },
      'HAGELSLAG-UUID':       { name: 'Hagelslag',           category: 'other',      unit_type: 'gram' },
      'STRAWBERRY-JAM-UUID':  { name: 'Aardbeienjam',        category: 'other',      unit_type: 'gram' },
      'HONEY-UUID':           { name: 'Honing',              category: 'other',      unit_type: 'gram' },
      'COCOA-UUID':           { name: 'Cacao',               category: 'other',      unit_type: 'gram' },
      'CINNAMON-UUID':        { name: 'Kaneel',              category: 'other',      unit_type: 'gram' },
      'VANILLA-UUID':         { name: 'Vanille',             category: 'other',      unit_type: 'ml'   },
      'CHIA-SEEDS-UUID':      { name: 'Chiazaad',            category: 'other',      unit_type: 'gram' },
      'COCONUT-FLAKES-UUID':  { name: 'Kokosrasp',           category: 'other',      unit_type: 'gram' },
      'PAPRIKA-POWDER-UUID':  { name: 'Paprikapoeder',       category: 'other',      unit_type: 'gram' },
      'CUMIN-UUID':           { name: 'Komijn',              category: 'other',      unit_type: 'gram' },
      'WATER-UUID':           { name: 'Water',               category: 'other',      unit_type: 'ml'   },
    }

    // ── UNIT CONVERSION TABLE ──
    // Ingredients stored in grams but sold per piece
    // gram_per_piece = average weight of 1 unit
    this.PIECE_CONVERSIONS = {
      'eieren':    { gramPerPiece: 60,  displayUnit: 'stuks', packSizes: [6, 10, 12, 20, 30] },
      'ei':        { gramPerPiece: 60,  displayUnit: 'stuks', packSizes: [6, 10, 12, 20, 30] },
      'banaan':    { gramPerPiece: 120, displayUnit: 'stuks', packSizes: null },
      'bananen':   { gramPerPiece: 120, displayUnit: 'stuks', packSizes: null },
      'appel':     { gramPerPiece: 180, displayUnit: 'stuks', packSizes: null },
      'appels':    { gramPerPiece: 180, displayUnit: 'stuks', packSizes: null },
      'avocado':   { gramPerPiece: 150, displayUnit: 'stuks', packSizes: null },
      'peer':      { gramPerPiece: 170, displayUnit: 'stuks', packSizes: null },
      'kiwi':      { gramPerPiece: 80,  displayUnit: 'stuks', packSizes: null },
      'citroen':   { gramPerPiece: 80,  displayUnit: 'stuks', packSizes: null },
      'limoen':    { gramPerPiece: 60,  displayUnit: 'stuks', packSizes: null },
      'mango':     { gramPerPiece: 300, displayUnit: 'stuks', packSizes: null },
      'sinaasappel': { gramPerPiece: 200, displayUnit: 'stuks', packSizes: null },
      'rijstwafels': { gramPerPiece: 8, displayUnit: 'stuks', packSizes: null },
    }
  }
  
  // ── CHECK IF INGREDIENT NEEDS PIECE CONVERSION ──
  // Match-strategie:
  //   1. Exacte naam (lowercase) — primair pad
  //   2. Heel-woord match (\b…\b regex) — voor namen met merknaam erbij,
  //      bv. "Tortilla volkoren wrap (Albert Heijn)" → matcht "wrap" maar
  //      NIET "ei" (de substring in "heijn") want word-boundary verplicht
  //      een woordgrens. Voorheen werd "ei" wel gematcht en kreeg een
  //      tortilla-wrap per ongeluk 60g/stuk als eieren-conversie.
  getConversionInfo(ingredientName, dbUnitType) {
    if (!ingredientName) return null
    const nameLower = ingredientName.toLowerCase().trim()

    if (this.PIECE_CONVERSIONS[nameLower]) {
      return this.PIECE_CONVERSIONS[nameLower]
    }

    for (const [key, conv] of Object.entries(this.PIECE_CONVERSIONS)) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'i')
      if (regex.test(nameLower)) return conv
    }

    if (dbUnitType === 'piece' || dbUnitType === 'stuks') {
      console.warn(`⚠️ Ingredient "${ingredientName}" is sold per piece but has no conversion entry`)
      return null
    }

    return null
  }
  
  // ── CONVERT GRAMS TO PIECES ──
  convertToPieces(totalGrams, conversionInfo) {
    if (!conversionInfo) return null
    
    const rawCount = totalGrams / conversionInfo.gramPerPiece
    const roundedCount = Math.ceil(rawCount)
    
    // Round to nearest pack size if available
    if (conversionInfo.packSizes && conversionInfo.packSizes.length > 0) {
      const pack = conversionInfo.packSizes.find(size => size >= roundedCount)
      return pack || Math.ceil(roundedCount / conversionInfo.packSizes[conversionInfo.packSizes.length - 1]) * conversionInfo.packSizes[conversionInfo.packSizes.length - 1]
    }
    
    return roundedCount
  }
  
  // Get active meal plan with shopping list
  async getActiveMealPlan(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_meal_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      console.log('✅ Active meal plan loaded:', data?.template_name)
      return data
    } catch (error) {
      console.error('❌ Failed to get active meal plan:', error)
      return null
    }
  }
  
  // Generate shopping list from week structure
  async generateShoppingList(weekStructure) {
    try {
      const ingredientMap = {}
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      for (const day of days) {
        const dayMeals = weekStructure[day]
        if (!dayMeals) continue
        
        console.log(`🔍 Processing ${day}`)
        const slots = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3', 'snacks']
        
        for (const slot of slots) {
          const mealData = dayMeals[slot]
          if (!mealData) continue
          
          const meals = Array.isArray(mealData) ? mealData : [mealData]
          
          for (const mealItem of meals) {
            let mealId = null
            if (typeof mealItem === 'string') {
              mealId = mealItem.split('_')[0]
            } else if (typeof mealItem === 'object') {
              mealId = mealItem?.meal_id || mealItem?.id
              if (mealId) mealId = mealId.split('_')[0]
            }
            
            if (!mealId) continue
            
            console.log(`📦 Loading meal with ID: ${mealId}`)
            
            const inlineIngredients = (typeof mealItem === 'object' && mealItem?.ingredients_list) 
              ? mealItem.ingredients_list : null
            
            let fullMealData
            if (inlineIngredients && Array.isArray(inlineIngredients) && inlineIngredients.length > 0) {
              const dbMeal = await this.getMealWithIngredients(mealId)
              fullMealData = {
                name: dbMeal?.name || mealItem?.meal_name || mealItem?.name || 'Unknown',
                ingredients_list: inlineIngredients
              }
              console.log(`✅ Using scaled ingredients from plan: ${fullMealData.name}, Ingredients:`, inlineIngredients.length)
            } else {
              fullMealData = await this.getMealWithIngredients(mealId)
              if (!fullMealData) continue
              console.log(`✅ Loaded from DB: ${fullMealData.name}, Ingredients:`, fullMealData.ingredients_list?.length || 0)
            }
            
            if (fullMealData.ingredients_list && Array.isArray(fullMealData.ingredients_list)) {
              for (const ing of fullMealData.ingredients_list) {
                const key = ing.ingredient_id
                
                if (!ingredientMap[key]) {
                  const ingredient = await this.getIngredientDetails(ing.ingredient_id)
                  
                  if (!ingredient) {
                    ingredientMap[key] = {
                      id: ing.ingredient_id,
                      name: ing.ingredient_name || ing.name || 'Unknown Ingredient',
                      category: 'other',
                      totalGrams: 0,
                      originalUnit: ing.unit || 'gram',
                      unit: ing.unit || 'gram',
                      instances: [],
                      pricePerUnit: 0,
                      unitType: 'kg',
                      conversionInfo: null
                    }
                  } else {
                    // Check if this ingredient needs piece conversion
                    const convInfo = this.getConversionInfo(ingredient.name, ingredient.unit_type)
                    
                    ingredientMap[key] = {
                      id: ing.ingredient_id,
                      name: ingredient.name || 'Unknown',
                      category: ingredient.category || 'other',
                      totalGrams: 0,
                      originalUnit: ing.unit || 'gram',
                      unit: convInfo ? convInfo.displayUnit : (ing.unit || 'gram'),
                      instances: [],
                      pricePerUnit: ingredient.price_per_unit || 0,
                      unitType: ingredient.unit_type || 'kg',
                      conversionInfo: convInfo
                    }
                  }
                }
                
                const amount = ing.amount || 0
                ingredientMap[key].totalGrams += amount
                ingredientMap[key].instances.push({
                  day, meal: slot, mealName: fullMealData.name, amount
                })
              }
            }
          }
        }
      }
      
      // ── BUILD FINAL LIST WITH CONVERSIONS ──
      const shoppingList = Object.values(ingredientMap).map(item => {
        let displayAmount, totalAmount, unit, estimatedCost
        
        if (item.conversionInfo) {
          // PIECE CONVERSION: grams → stuks
          const pieces = this.convertToPieces(item.totalGrams, item.conversionInfo)
          displayAmount = pieces
          totalAmount = pieces
          unit = item.conversionInfo.displayUnit
          
          // Price: price_per_unit is per piece
          if (item.unitType === 'piece' || item.unitType === 'stuks') {
            estimatedCost = pieces * parseFloat(item.pricePerUnit || 0)
          } else {
            // Fallback: estimate from gram cost
            estimatedCost = this.calculateCost(item.totalGrams, item.pricePerUnit, item.originalUnit, item.unitType)
          }
          
          console.log(`🔄 Converted: ${item.name} ${item.totalGrams}g → ${pieces} ${unit} (€${estimatedCost.toFixed(2)})`)
        } else {
          // NORMAL: keep in grams/ml, apply realistic purchase rounding
          const purchaseAmount = this.calculateRealisticPurchase(item)
          displayAmount = purchaseAmount
          totalAmount = item.totalGrams
          unit = item.originalUnit
          estimatedCost = this.calculateCost(purchaseAmount, item.pricePerUnit, item.originalUnit, item.unitType)
        }
        
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          totalAmount,
          displayAmount,
          unit,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
          instances: item.instances,
          totalGrams: item.totalGrams
        }
      })
      
      // Sort by category — accepteer zowel "fruit" als "fruits" omdat de
      // ai_ingredients tabel beide vormen kent.
      const normalizeCat = (c) => (c === 'fruits' ? 'fruit' : c)
      shoppingList.sort((a, b) => {
        const categoryOrder = ['protein', 'carbs', 'vegetables', 'fats', 'dairy', 'fruit', 'other']
        const aCat = normalizeCat(a.category)
        const bCat = normalizeCat(b.category)
        const aIdx = categoryOrder.indexOf(aCat) !== -1 ? categoryOrder.indexOf(aCat) : 999
        const bIdx = categoryOrder.indexOf(bCat) !== -1 ? categoryOrder.indexOf(bCat) : 999
        if (aIdx !== bIdx) return aIdx - bIdx
        return a.name.localeCompare(b.name)
      })
      
      console.log(`✅ Generated shopping list with ${shoppingList.length} items`)
      
      return {
        items: shoppingList,
        totalCost: shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0),
        itemCount: shoppingList.length,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Failed to generate shopping list:', error)
      return { items: [], totalCost: 0, itemCount: 0, generatedAt: new Date().toISOString() }
    }
  }
  
  // Realistic purchase amounts (only for NON-piece items now)
  calculateRealisticPurchase(item) {
    const amount = item.totalGrams || item.totalAmount || 0
    
    if (item.category === 'protein') {
      if (amount <= 200) return 200
      if (amount <= 400) return 400
      if (amount <= 500) return 500
      if (amount <= 750) return 750
      if (amount <= 1000) return 1000
      return Math.ceil(amount / 500) * 500
    }
    
    if (item.category === 'vegetables') {
      if (amount <= 250) return 250
      if (amount <= 500) return 500
      if (amount <= 750) return 750
      return Math.ceil(amount / 500) * 500
    }
    
    if (item.category === 'carbs') {
      if (amount <= 500) return 500
      if (amount <= 1000) return 1000
      return Math.ceil(amount / 1000) * 1000
    }
    
    if (amount <= 100) return 100
    if (amount <= 250) return 250
    if (amount <= 500) return 500
    if (amount <= 750) return 750
    if (amount <= 1000) return 1000
    return Math.ceil(amount / 500) * 500
  }
  
  // Calculate cost for gram/ml based items
  calculateCost(amount, pricePerUnit, unit, unitType) {
    if (!pricePerUnit) return 0
    const price = parseFloat(pricePerUnit)
    
    if (unit === 'gram' && unitType === 'kg') {
      return (amount / 1000) * price
    }
    if (unit === 'ml' && unitType === 'liter') {
      return (amount / 1000) * price
    }
    if (unitType === 'piece' || unitType === 'stuks') {
      return Math.ceil(amount) * price
    }
    return amount * price
  }
  
  // Get meal with ingredients
  async getMealWithIngredients(mealId) {
    try {
      const { data, error } = await this.supabase
        .from('ai_meals')
        .select('*')
        .eq('id', mealId.trim())
        .single()
      if (error) return null
      return data
    } catch (error) {
      console.error('❌ Failed to get meal:', error)
      return null
    }
  }
  
  // Detecteer placeholder-strings die ooit als ingredient_id zijn
  // opgeslagen ipv echte UUIDs. We willen geen DB-call doen op een
  // string als "EGGS-UUID" — die zou alleen maar errors loggen.
  isPlaceholderId(ingredientId) {
    if (!ingredientId || typeof ingredientId !== 'string') return false
    if (ingredientId in this.PLACEHOLDER_MAP) return true
    // Vangnet: alles dat eindigt op -UUID of in vierkante haken staat
    // is geen geldige UUID en kan een onbekende placeholder zijn.
    if (/-UUID$/i.test(ingredientId)) return true
    if (/^\[.*\]$/.test(ingredientId)) return true
    // Echte UUIDs hebben 8-4-4-4-12 hex-formaat
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ingredientId)) return true
    return false
  }

  // Synthetiseer een ai_ingredients-achtig object uit een placeholder.
  // Onbekende placeholders krijgen een afgeleide naam (bv. "CRACKERS-UUID"
  // → "Crackers") zodat ze nog steeds leesbaar zijn in de boodschappenlijst.
  resolvePlaceholder(ingredientId) {
    const known = this.PLACEHOLDER_MAP[ingredientId]
    if (known) {
      return { id: ingredientId, ...known, price_per_unit: 0, _placeholder: true }
    }
    // Onbekende placeholder — derive name from prefix
    let derived = String(ingredientId).replace(/-UUID$/i, '').replace(/^\[|\]$/g, '')
    derived = derived.replace(/-/g, ' ').toLowerCase()
    derived = derived.charAt(0).toUpperCase() + derived.slice(1)
    return {
      id: ingredientId,
      name: derived || 'Onbekend',
      category: 'other',
      unit_type: 'gram',
      price_per_unit: 0,
      _placeholder: true,
    }
  }

  // Get ingredient details
  async getIngredientDetails(ingredientId) {
    // Placeholder-strings nooit naar Supabase sturen — geeft een Postgres
    // type-error en zorgde voorheen voor "Unknown Ingredient" in de lijst.
    if (this.isPlaceholderId(ingredientId)) {
      return this.resolvePlaceholder(ingredientId)
    }
    try {
      const { data, error } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .eq('id', ingredientId)
        .single()
      if (error) return null
      return data
    } catch (error) {
      return null
    }
  }
  
  // Save shopping progress (week_end fix included)
  async saveShoppingProgress(clientId, planId, progress) {
    try {
      const { data: existing } = await this.supabase
        .from('ai_shopping_progress')
        .select('id')
        .eq('client_id', clientId)
        .eq('plan_id', planId)
        .single()
      
      const now = new Date()
      const purchasedCount = Object.values(progress.checkedItems || {}).filter(Boolean).length
      
      if (existing) {
        const { error } = await this.supabase
          .from('ai_shopping_progress')
          .update({
            purchased_items: progress.checkedItems,
            purchased_count: purchasedCount,
            updated_at: now.toISOString()
          })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const weekStart = new Date(now)
        const dayOfWeek = weekStart.getDay()
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        weekStart.setDate(weekStart.getDate() + diffToMonday)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        const { error } = await this.supabase
          .from('ai_shopping_progress')
          .insert({
            client_id: clientId,
            plan_id: planId,
            purchased_items: progress.checkedItems,
            purchased_count: purchasedCount,
            week_start: weekStart.toISOString(),
            week_end: weekEnd.toISOString(),
            created_at: now.toISOString()
          })
        if (error) throw error
      }
      
      console.log('✅ Shopping progress saved')
      return true
    } catch (error) {
      console.error('❌ Failed to save shopping progress:', error)
      return false
    }
  }
  
  // Get shopping progress
  async getShoppingProgress(clientId, planId) {
    if (!planId) return null
    try {
      const { data, error } = await this.supabase
        .from('ai_shopping_progress')
        .select('*')
        .eq('client_id', clientId)
        .eq('plan_id', planId)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      return null
    }
  }
  
  // Format amount for display
  formatAmount(amount, unit) {
    if (unit === 'stuks' || unit === 'pieces') return `${Math.round(amount)} stuks`
    if (unit === 'gram' || unit === 'g') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}kg`
      return `${Math.round(amount)}g`
    }
    if (unit === 'ml') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}L`
      return `${Math.round(amount)}ml`
    }
    return `${Math.round(amount)} ${unit}`
  }
  
  // Export shopping list as text
  generateExportText(shoppingList) {
    if (!shoppingList?.items) return ''
    
    let text = 'MY ARC BOODSCHAPPENLIJST\n\n'
    const categoryNames = {
      'protein': '🥩 EIWITTEN', 'carbs': '🌾 KOOLHYDRATEN',
      'vegetables': '🥬 GROENTEN', 'fats': '🥑 VETTEN',
      'dairy': '🥛 ZUIVEL', 'fruit': '🍎 FRUIT',
      'sauces': '🧂 SAUZEN & KRUIDEN', 'other': '📦 OVERIG'
    }
    
    const categories = {}
    shoppingList.items.forEach(item => {
      const cat = item.category || 'other'
      if (!categories[cat]) categories[cat] = []
      categories[cat].push(item)
    })
    
    Object.keys(categoryNames).forEach(catKey => {
      if (categories[catKey]) {
        text += `${categoryNames[catKey]}\n`
        categories[catKey].forEach(item => {
          const amount = this.formatAmount(item.displayAmount || item.totalAmount, item.unit)
          text += `- ${item.name} ${amount}\n`
        })
        text += '\n'
      }
    })
    
    text += `Totaal: €${shoppingList.totalCost?.toFixed(2) || '0.00'} · ${shoppingList.itemCount || 0} items\n`
    text += `${new Date().toLocaleDateString('nl-NL')}`
    return text
  }
  
  shareViaWhatsApp(text) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }
  
  async copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); return true }
    catch { return false }
  }
}
