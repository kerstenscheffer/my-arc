// src/modules/client-meal-builder/OpenFoodFactsService.js
// Integration with OpenFoodFacts API - 2.8M+ products

export default class OpenFoodFactsService {
  constructor() {
    this.baseUrl = 'https://world.openfoodfacts.org/api/v2'
    this.userAgent = 'MyArc - Nutrition App - Version 1.0'
  }

  // ========================================
  // BARCODE LOOKUP
  // ========================================
  
  async getProductByBarcode(barcode) {
    try {
      console.log('🌍 OpenFoodFacts lookup:', barcode)
      
      const response = await fetch(`${this.baseUrl}/product/${barcode}.json`, {
        headers: {
          'User-Agent': this.userAgent
        }
      })
      
      if (!response.ok) {
        console.log('⚠️ OpenFoodFacts API error:', response.status)
        return null
      }
      
      const data = await response.json()
      
      if (data.status === 0 || !data.product) {
        console.log('❌ Product not found in OpenFoodFacts')
        return null
      }
      
      console.log('✅ Product found:', data.product.product_name)
      return this.normalizeProduct(data.product)
      
    } catch (error) {
      console.error('❌ OpenFoodFacts lookup error:', error)
      return null
    }
  }

  // ========================================
  // SEARCH BY NAME
  // ========================================
  
  async searchProducts(searchTerm, limit = 20) {
    try {
      console.log('🔍 OpenFoodFacts search:', searchTerm)
      
      const response = await fetch(
        `${this.baseUrl}/search?search_terms=${encodeURIComponent(searchTerm)}&page_size=${limit}&json=true`,
        {
          headers: {
            'User-Agent': this.userAgent
          }
        }
      )
      
      if (!response.ok) {
        console.log('⚠️ Search API error:', response.status)
        return []
      }
      
      const data = await response.json()
      
      if (!data.products || data.products.length === 0) {
        console.log('No products found')
        return []
      }
      
      console.log(`✅ Found ${data.products.length} products`)
      return data.products.map(product => this.normalizeProduct(product))
      
    } catch (error) {
      console.error('❌ Search error:', error)
      return []
    }
  }

  // ========================================
  // NORMALIZE TO AI_INGREDIENTS FORMAT
  // ========================================
  
  normalizeProduct(product) {
    // OpenFoodFacts data structure → ai_ingredients format
    const nutriments = product.nutriments || {}
    
    // Get name (prefer Dutch, fallback to English, then generic)
    const name = product.product_name_nl || 
                 product.product_name_en || 
                 product.product_name || 
                 'Onbekend Product'
    
    const normalized = {
      // Basic info
      name: name,
      name_en: product.product_name_en || name,
      barcode: product.code || product._id,
      
      // Category
      category: this.extractCategory(product),
      
      // Nutritional values per 100g
      calories_per_100g: Math.round(nutriments['energy-kcal_100g'] || nutriments.energy_100g / 4.184 || 0),
      protein_per_100g: Math.round(nutriments.proteins_100g || 0),
      carbs_per_100g: Math.round(nutriments.carbohydrates_100g || 0),
      fat_per_100g: Math.round(nutriments.fat_100g || 0),
      fiber_per_100g: Math.round(nutriments.fiber_100g || 0),
      
      // Additional nutritional info
      sugar_per_100g: Math.round(nutriments.sugars_100g || 0),
      saturated_fat_per_100g: Math.round(nutriments['saturated-fat_100g'] || 0),
      sodium_per_100g: Math.round(nutriments.sodium_100g || 0),
      salt_per_100g: Math.round(nutriments.salt_100g || 0),
      
      // Product details
      brands: product.brands || null,
      image_url: product.image_url || product.image_front_url || null,
      serving_size: product.serving_size || '100g',
      
      // Labels & tags
      labels: this.extractLabels(product),
      allergens: this.extractAllergens(product),
      
      // Portions (default values)
      default_portion_gram: 100,
      min_portion_gram: 10,
      max_portion_gram: 500,
      
      // Storage
      unit_type: 'gram',
      purchase_unit: product.quantity || '1 stuk',
      scalable: true,
      
      // Meta
      source: 'openfoodfacts',
      external_id: product._id || product.code,
      data_quality: this.calculateDataQuality(product)
    }
    
    return normalized
  }

  // ========================================
  // HELPER METHODS
  // ========================================
  
  extractCategory(product) {
    // Try to get most specific category
    if (product.categories_tags && product.categories_tags.length > 0) {
      const category = product.categories_tags[0].replace('en:', '').replace('-', ' ')
      return category.charAt(0).toUpperCase() + category.slice(1)
    }
    
    if (product.categories) {
      const cats = product.categories.split(',')
      return cats[0]?.trim() || 'Overig'
    }
    
    return 'Overig'
  }

  extractLabels(product) {
    const labels = []
    
    // Nutrition grade
    if (product.nutrition_grades) {
      labels.push(`nutriscore-${product.nutrition_grades.toLowerCase()}`)
    }
    
    // Certifications
    if (product.labels_tags) {
      product.labels_tags.forEach(label => {
        const cleanLabel = label.replace('en:', '').replace('nl:', '')
        if (cleanLabel.includes('organic') || cleanLabel.includes('bio')) {
          labels.push('organic')
        }
        if (cleanLabel.includes('vegan')) {
          labels.push('vegan')
        }
        if (cleanLabel.includes('vegetarian')) {
          labels.push('vegetarian')
        }
        if (cleanLabel.includes('gluten-free')) {
          labels.push('gluten-free')
        }
        if (cleanLabel.includes('lactose-free')) {
          labels.push('lactose-free')
        }
      })
    }
    
    // Dietary info
    if (product.ingredients_analysis_tags) {
      product.ingredients_analysis_tags.forEach(tag => {
        if (tag.includes('vegan')) labels.push('vegan')
        if (tag.includes('vegetarian')) labels.push('vegetarian')
        if (tag.includes('palm-oil-free')) labels.push('palm-oil-free')
      })
    }
    
    return [...new Set(labels)] // Remove duplicates
  }

  extractAllergens(product) {
    const allergens = []
    
    if (product.allergens_tags) {
      product.allergens_tags.forEach(allergen => {
        const clean = allergen.replace('en:', '').replace('nl:', '')
        allergens.push(clean)
      })
    }
    
    return allergens
  }

  calculateDataQuality(product) {
    // Score product data completeness (0-100)
    let score = 0
    
    if (product.product_name) score += 20
    if (product.nutriments?.['energy-kcal_100g']) score += 20
    if (product.nutriments?.proteins_100g) score += 15
    if (product.nutriments?.carbohydrates_100g) score += 15
    if (product.nutriments?.fat_100g) score += 15
    if (product.image_url) score += 10
    if (product.categories) score += 5
    
    return Math.min(score, 100)
  }

  // ========================================
  // PRODUCT IMAGE HELPERS
  // ========================================
  
  getProductImage(product, size = 'small') {
    // OpenFoodFacts image sizes: small (200px), display (400px), full (original)
    const sizeMap = {
      small: product.image_small_url || product.image_thumb_url,
      medium: product.image_url || product.image_front_url,
      large: product.image_front_url
    }
    
    return sizeMap[size] || product.image_url || null
  }

  // ========================================
  // VALIDATION
  // ========================================
  
  isValidProduct(product) {
    // Check if product has minimum required data
    if (!product) return false
    if (!product.name || product.name === 'Onbekend Product') return false
    if (!product.calories_per_100g && !product.protein_per_100g) return false
    
    return true
  }

  hasNutritionalData(product) {
    return !!(
      product.calories_per_100g || 
      product.protein_per_100g || 
      product.carbs_per_100g || 
      product.fat_per_100g
    )
  }

  // ========================================
  // BATCH OPERATIONS
  // ========================================
  
  async getProductsByBarcodes(barcodes) {
    // Get multiple products at once
    const promises = barcodes.map(barcode => this.getProductByBarcode(barcode))
    const results = await Promise.all(promises)
    return results.filter(product => product !== null)
  }

  // ========================================
  // CONTRIBUTION (Optional - for future)
  // ========================================
  
  getContributionUrl(barcode) {
    // URL to allow users to contribute missing products
    return `https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${barcode}`
  }
}
