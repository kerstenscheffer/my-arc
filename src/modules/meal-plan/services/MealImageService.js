// src/modules/meal-plan/services/MealImageService.js
// Intelligente meal foto service - GEEN API KEY NODIG!

const MealImageService = {
  // Nederlandse naar Engelse vertalingen voor betere foto matches
  translations: {
    'kip': 'chicken',
    'zalm': 'salmon', 
    'tonijn': 'tuna',
    'rijst': 'rice',
    'pasta': 'pasta',
    'salade': 'salad',
    'yoghurt': 'yogurt',
    'griekse': 'greek',
    'quinoa': 'quinoa',
    'brood': 'bread',
    'ei': 'egg',
    'eieren': 'eggs',
    'avocado': 'avocado',
    'shake': 'shake',
    'smoothie': 'smoothie',
    'bowl': 'bowl',
    'wrap': 'wrap',
    'soep': 'soup',
    'noten': 'nuts',
    'fruit': 'fruit',
    'groente': 'vegetables',
    'vis': 'fish',
    'vlees': 'meat',
    'kaas': 'cheese',
    'haver': 'oats',
    'muffin': 'muffin',
    'pancake': 'pancake',
    'wafel': 'waffle',
    'bessen': 'berries',
    'banaan': 'banana',
    'appel': 'apple',
    'overnight': 'overnight',
    'oats': 'oats',
    'protein': 'protein',
    'teriyaki': 'teriyaki',
    'bolognese': 'bolognese',
    'caesar': 'caesar',
    'tosti': 'sandwich',
    'toast': 'toast',
    'boterham': 'sandwich',
    'havermout': 'oatmeal',
    'kwark': 'cottage-cheese',
    'skyr': 'skyr',
    'granola': 'granola',
    'muesli': 'muesli',
    'omelet': 'omelet',
    'roerei': 'scrambled-eggs',
    'gebakken': 'fried',
    'gegrild': 'grilled',
    'gestoomd': 'steamed',
    'gekookt': 'boiled',
    'rauw': 'raw',
    'verse': 'fresh',
    'warme': 'warm',
    'koude': 'cold',
    'spicy': 'spicy',
    'zoete': 'sweet',
    'hartige': 'savory',
    'aardappel': 'potato',
    'zoete aardappel': 'sweet-potato',
    'biefstuk': 'steak',
    'gehakt': 'minced-meat',
    'kalkoen': 'turkey',
    'ham': 'ham',
    'bacon': 'bacon',
    'garnalen': 'shrimp',
    'tofu': 'tofu',
    'tempeh': 'tempeh',
    'linzen': 'lentils',
    'bonen': 'beans',
    'kikkererwten': 'chickpeas',
    'hummus': 'hummus',
    'falafel': 'falafel',
    'couscous': 'couscous',
    'bulgur': 'bulgur',
    'noedels': 'noodles',
    'spaghetti': 'spaghetti',
    'lasagne': 'lasagna',
    'pizza': 'pizza',
    'burrito': 'burrito',
    'taco': 'taco',
    'sushi': 'sushi',
    'poke': 'poke',
    'curry': 'curry',
    'soep': 'soup',
    'stamppot': 'mashed-potatoes',
    'hutspot': 'hotchpotch',
    'boerenkool': 'kale',
    'spinazie': 'spinach',
    'broccoli': 'broccoli',
    'bloemkool': 'cauliflower',
    'wortel': 'carrot',
    'komkommer': 'cucumber',
    'tomaat': 'tomato',
    'paprika': 'bell-pepper',
    'mais': 'corn',
    'sperziebonen': 'green-beans',
    'asperges': 'asparagus',
    'champignons': 'mushrooms',
    'ui': 'onion',
    'knoflook': 'garlic',
    'gember': 'ginger',
    'kruiden': 'herbs',
    'pesto': 'pesto',
    'kaas': 'cheese',
    'mozzarella': 'mozzarella',
    'feta': 'feta',
    'parmezaan': 'parmesan',
    'melk': 'milk',
    'boter': 'butter',
    'room': 'cream',
    'ijs': 'ice-cream',
    'pudding': 'pudding',
    'vla': 'custard',
    'chocolade': 'chocolate',
    'honing': 'honey',
    'jam': 'jam',
    'pindakaas': 'peanut-butter',
    'notenpasta': 'nut-butter',
    'tahini': 'tahini'
  },

  getMealImage(mealName, size = 400) {
    if (!mealName) return this.getDefaultImage(size);
    
    // Cache key voor localStorage
    const cacheKey = `meal-img-${mealName}-${size}`;
    const cached = localStorage.getItem(cacheKey);
    
    // Return cached URL als die minder dan 24 uur oud is
    if (cached) {
      const { url, timestamp } = JSON.parse(cached);
      const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (hoursSinceCache < 24) {
        return url;
      }
    }
    
    // Genereer nieuwe URL
    const searchTerms = this.parseToEnglish(mealName);
    const url = `https://source.unsplash.com/${size}x${size}/?${searchTerms}`;
    
    // Cache de URL
    localStorage.setItem(cacheKey, JSON.stringify({
      url,
      timestamp: Date.now()
    }));
    
    return url;
  },

  parseToEnglish(mealName) {
    let parsed = mealName.toLowerCase();
    
    // Vervang Nederlandse woorden met Engelse
    Object.keys(this.translations).forEach(dutch => {
      const regex = new RegExp(`\\b${dutch}\\b`, 'gi');
      parsed = parsed.replace(regex, this.translations[dutch]);
    });
    
    // Verwijder nutteloze Nederlandse woorden
    parsed = parsed.replace(/\b(met|van|de|het|een|op|in|uit|en|voor|na|bij|zonder|extra|met een|voor de|na de|bij de|aan|over|onder|tussen|langs|tijdens|volgens|binnen|buiten)\b/g, '');
    
    // Clean up en format voor URL
    parsed = parsed
      .replace(/[^\w\s]/g, '') // Verwijder special chars
      .replace(/\s+/g, ' ') // Multiple spaces naar single
      .trim()
      .split(' ')
      .filter(word => word.length > 2) // Skip kleine woorden
      .slice(0, 3) // Max 3 keywords voor betere matches
      .join(',');
    
    // Als we geen goede keywords hebben, gebruik generale termen
    if (!parsed || parsed.length < 3) {
      return 'healthy,food,meal,fresh';
    }
    
    // Voeg context keywords toe voor betere resultaten
    const timeKeywords = this.getTimeKeywords(parsed);
    return `${parsed},${timeKeywords}`;
  },

  getTimeKeywords(parsed) {
    // Voeg tijd-specifieke keywords toe voor betere matches
    const breakfast = ['oats', 'egg', 'yogurt', 'muesli', 'granola', 'toast', 'pancake', 'waffle'];
    const lunch = ['sandwich', 'salad', 'wrap', 'soup', 'bowl'];
    const dinner = ['pasta', 'rice', 'steak', 'chicken', 'salmon', 'curry', 'lasagna'];
    const snack = ['nuts', 'fruit', 'protein', 'shake', 'smoothie'];
    
    if (breakfast.some(word => parsed.includes(word))) {
      return 'breakfast,morning,healthy';
    } else if (lunch.some(word => parsed.includes(word))) {
      return 'lunch,fresh,healthy';
    } else if (dinner.some(word => parsed.includes(word))) {
      return 'dinner,meal,healthy';
    } else if (snack.some(word => parsed.includes(word))) {
      return 'snack,healthy,fresh';
    }
    
    return 'food,healthy,meal,fresh';
  },

  getDefaultImage(size = 400) {
    // Fallback voor lege meal namen - random healthy food
    return `https://source.unsplash.com/${size}x${size}/?healthy,food,meal,fresh`;
  },

  // Utility functie om cache te clearen
  clearCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('meal-img-')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Pre-load images voor betere performance
  preloadImages(meals, size = 400) {
    meals.forEach(meal => {
      if (meal.name) {
        const img = new Image();
        img.src = this.getMealImage(meal.name, size);
      }
    });
  }
};

export default MealImageService;
