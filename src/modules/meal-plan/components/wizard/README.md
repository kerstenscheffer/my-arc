# Meal Setup Wizard V2 - Kersten's Methode

## 📋 Overzicht

Een volledig vernieuwde 5-stap wizard die clients persoonlijk begeleidt door hun meal plan setup met Kersten's coaching aanpak.

## ✨ Features

### 1. Coach Avatar Integratie
- Persoonlijke begeleiding met coach avatar (👨‍🍳 placeholder)
- Specifieke coaching teksten per stap
- Spraakwolkje met uitleg en motivatie
- Responsive layout (sidebar op desktop, boven op mobile)

### 2. Database Integratie
- Ingredient picker met live database queries
- Suggesties van Kersten per categorie
- Zoekfunctie in alle ingredient modals
- Auto-save progress tijdens wizard

### 3. 5-Step Flow

#### Step 1: Goals (Doelen)
- Toont client macro doelen (calories, protein, carbs, fat)
- Visuele kaarten met gradients
- Uitleg waarom deze doelen belangrijk zijn
- **Component**: `Slide1Goals.jsx`

#### Step 2: Meal Frequency (Maaltijd Frequentie)
- Kies aantal maaltijden per dag (3-5)
- Kies aantal snacks (0-3)
- Live summary van totaal eetmomenten
- **Component**: `Slide2MealFrequency.jsx`

#### Step 3: Protein Picker (Eiwitbronnen)
- Selecteer exact 3 eiwitbronnen
- Database integratie met `ingredients` tabel waar category='protein'
- Kersten's suggesties: Whey, Varkensvlees, Eieren
- Toont macros per 100g van geselecteerde items
- **Component**: `Slide4ProteinPicker.jsx`
- **Kersten's tekst**: _"Omdat genoeg eiwitten eten essentieel is, heb ik hier iets op bedacht wat enorm helpt je eiwitten te halen: 3 bronnen opstellen die je dagelijks zou kunnen/willen eten."_

#### Step 4: Carb Picker (Koolhydraten)
- Selecteer exact 3 koolhydraatbronnen
- Database integratie met `ingredients` tabel waar category='carbs'
- Kersten's suggesties: Havermout, Rijst, Bruin Brood
- Focus op complexe carbs (volkoren/vezel)
- **Component**: `Slide5CarbPicker.jsx`
- **Kersten's tekst**: _"Nu we de eiwitten hebben, vind ik het fijn om 3 bronnen complexe koolhydraten te hebben die ik makkelijk kan verhogen of verminderen. Blijf weg van witte pasta's en bloem!"_

#### Step 5: Meal Prep (Voorbereiding)
- Toggle voor batch cooking (grote batches)
- Selecteer dagelijkse prep opties (kwark, fruit, groenten, rijst)
- Portie calculator (1-6 personen)
- Tijd en portie schattingen
- **Component**: `Slide6MealPrep.jsx`
- **Kersten's tekst**: _"Meal prep kan het verschil maken tussen pizza of pasta kiezen. Het kan zo simpel zijn als een bakje kwark klaarzetten of 20 bakken pasta voor 2 weken maken."_

## 🔧 Technische Implementatie

### File Structuur
```
src/modules/meal-plan/components/wizard/
├── MealSetupWizardV2.jsx          # Hoofd wizard component
├── README.md                       # Deze file
├── slides/
│   ├── Slide1Goals.jsx            # Step 1: Goals overzicht
│   ├── Slide2MealFrequency.jsx    # Step 2: Meal frequency
│   ├── Slide4ProteinPicker.jsx    # Step 3: Protein selectie
│   ├── Slide5CarbPicker.jsx       # Step 4: Carb selectie
│   └── Slide6MealPrep.jsx         # Step 5: Meal prep plan
├── shared/
│   └── WizardLayout.jsx           # Shared layout met coach avatar
└── pickers/
    └── IngredientPickerModal.jsx  # Herbruikbare ingredient picker
```

### Database Requirements

#### Bestaande Tabellen (moet bestaan):
1. **`ingredients`** - Ingredient database
   ```sql
   - id: UUID
   - name: TEXT
   - category: TEXT ('protein', 'carbs', 'fats', 'vegetables')
   - calories_per_100g: NUMERIC
   - protein_per_100g: NUMERIC
   - carbs_per_100g: NUMERIC
   - fat_per_100g: NUMERIC
   ```

2. **`clients`** - Client data
   ```sql
   - id: UUID
   - name: TEXT
   - macro_goals: JSONB { calories, protein, carbs, fat }
   - has_completed_meal_setup: BOOLEAN
   ```

#### Nieuwe Tabel (optioneel, voor progress saving):
3. **`client_meal_setup_data`** - Wizard progress
   ```sql
   CREATE TABLE client_meal_setup_data (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
     wizard_data JSONB,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### DatabaseService Methods Gebruikt:
- `db.getIngredientsByCategory(category)` - Haalt ingredients op per categorie
- `db.supabase.from('clients').update(...)` - Update client data
- `db.supabase.from('client_meal_setup_data').upsert(...)` - Save wizard progress

## 🚀 Gebruik

### In een Parent Component

```jsx
import MealSetupWizardV2 from './modules/meal-plan/components/wizard/MealSetupWizardV2'
import DatabaseService from './services/DatabaseService'
import useIsMobile from './hooks/useIsMobile'

function MyComponent() {
  const [showWizard, setShowWizard] = useState(false)
  const isMobile = useIsMobile()
  const db = DatabaseService

  const handleComplete = () => {
    console.log('Wizard completed!')
    // Refresh data, navigate, etc.
  }

  return (
    <>
      <button onClick={() => setShowWizard(true)}>
        Start Meal Setup
      </button>

      <MealSetupWizardV2
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleComplete}
        client={currentClient}
        db={db}
        isMobile={isMobile}
      />
    </>
  )
}
```

### Props Interface

```typescript
interface MealSetupWizardV2Props {
  isOpen: boolean              // Controls modal visibility
  onClose: () => void          // Called when wizard closes
  onComplete?: () => void      // Called when wizard completes
  client: {                    // Client object
    id: string
    name: string
    macro_goals?: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
  }
  db: DatabaseService          // Database service instance
  isMobile: boolean            // Mobile detection
}
```

## 📱 Mobile Responsiveness

- **Desktop**: Coach avatar links, content rechts
- **Mobile**: Coach avatar boven, content onder
- Touch targets minimum 44px
- Modal 90% width op mobile
- 1 kolom layouts voor alle grids op mobile
- Font sizes schalen mee

## 🎨 Design Tokens

```javascript
// Colors
const colors = {
  protein: {
    primary: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  carbs: {
    primary: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  success: {
    primary: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  }
}

// Breakpoints
const breakpoints = {
  mobile: '768px'
}
```

## ✅ Validation Rules

- **Step 1**: Always passable (informatie only)
- **Step 2**: Always passable (default values set)
- **Step 3**: Require exactly 3 protein sources selected
- **Step 4**: Require exactly 3 carb sources selected
- **Step 5**: Always passable (meal prep is optional)

## 🔄 Data Flow

```javascript
// Wizard State Shape
{
  mealFrequency: {
    meals: 3,        // 3-5
    snacks: 1        // 0-3
  },
  proteinSources: [
    { id, name, protein_per_100g, calories_per_100g, ... },
    { ... },
    { ... }
  ],
  carbSources: [
    { id, name, carbs_per_100g, calories_per_100g, ... },
    { ... },
    { ... }
  ],
  mealPrepPlan: {
    batchCooking: false,
    dailyPrep: ['yogurt', 'rice'],
    portionSize: 1   // 1-6
  }
}
```

## 🎯 Next Steps / TODO

1. **Coach Avatar**: Vervang 👨‍🍳 emoji met echte foto van Kersten
2. **Database Migration**: Run SQL voor `client_meal_setup_data` tabel
3. **Ingredient Data**: Zorg dat `ingredients` tabel gevuld is met data
4. **Testing**: Test complete flow van start tot eind
5. **Integration**: Integreer met bestaande meal planning systeem
6. **Analytics**: Track welke ingredients het meest gekozen worden

## 🐛 Known Issues / Limitations

- Coach avatar is placeholder emoji (moet foto worden)
- Geen foto upload voor custom coach avatar
- Ingredient database moet vooraf gevuld zijn
- Geen offline support (vereist database connectie)
- Auto-save werkt alleen als `client_meal_setup_data` tabel bestaat

## 📝 Changelog

### Version 2.0.0 (2025-01-23)
- ✨ Complete herwrite met Kersten's coaching aanpak
- ✨ Coach avatar integratie met persoonlijke teksten
- ✨ Database integratie voor ingredient selectie
- ✨ 5-step flow: Goals → Frequency → Proteins → Carbs → MealPrep
- ✨ Suggesties van Kersten per categorie
- ✨ Auto-save progress functionaliteit
- ✨ Mobile-first responsive design
- ✨ Validation per step
