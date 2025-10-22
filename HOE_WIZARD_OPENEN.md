# Hoe Open Je de Meal Setup Wizard?

## ✅ Er is WEL een button!

De wizard kan op 2 manieren geopend worden:

### 1. **Automatisch (Eerste Keer)**
Als een client nog nooit de meal setup heeft afgerond:
- Wizard opent automatisch bij het openen van het Meal Dashboard
- Dit checkt `has_completed_meal_setup` in de database

**Code:** `AIMealDashboard.jsx:58-73`
```javascript
const checkFirstTimeSetup = async () => {
  const { data } = await db.supabase
    .from('clients')
    .select('has_completed_meal_setup')
    .eq('id', client.id)
    .single()

  // Auto-open wizard if first time
  if (!data?.has_completed_meal_setup) {
    setShowWizard(true)
  }
}
```

### 2. **Handmatig via Quick Actions Button** ⭐

In het **Meal Dashboard** zie je een sectie genaamd **"Quick Actions"** met verschillende buttons.

De eerste button is:
- **Label:** "Meal Setup"
- **Icoon:** ✨ Sparkles (paars)
- **Kleur:** Paars (#8b5cf6)
- **Positie:** Linksboven in de Quick Actions grid (3 kolommen)

**Code:** `AIQuickActions.jsx:29-36`
```javascript
{
  id: 'wizard',
  label: 'Meal Setup',
  icon: Sparkles,
  color: '#8b5cf6',
  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  onClick: () => onOpenWizard?.()
}
```

## Hoe Ziet Het Eruit?

De Quick Actions sectie bevat deze buttons (3x3 grid):

```
┌─────────────────────────────────────────────┐
│          Quick Actions                       │
├─────────────┬─────────────┬─────────────────┤
│ ✨ Meal     │ 📅 Week     │ ⭐ Favorieten   │
│   Setup     │   Planner   │                 │
├─────────────┼─────────────┼─────────────────┤
│ ➕ Eigen    │ 🕐 Historie │ 📖 Meal Base    │
│   Meal      │             │                 │
├─────────────┼─────────────┼─────────────────┤
│ 🛒 Bood-    │ 👨‍🍳 Recepten │                 │
│   schappen  │             │                 │
└─────────────┴─────────────┴─────────────────┘
```

**De wizard button = linksboven met Sparkles icoon ✨**

## Wat Gebeurt Er Als Je Klikt?

1. Button trigger: `onClick` in `AIQuickActions.jsx:35`
2. Roept aan: `onOpenWizard()` in `AIMealDashboard.jsx:400`
3. Sets state: `setShowWizard(true)`
4. Wizard wordt gerenderd: `AIMealDashboard.jsx:496-507`

## Als Je De Button Niet Ziet

**Mogelijke redenen:**

1. **Niet in het Meal Dashboard**
   - Zorg dat je op de juiste pagina bent
   - Navigeer naar: Meal Planning / AI Meal Dashboard

2. **Button is buiten beeld**
   - Scroll naar beneden
   - Quick Actions staat onder de Daily Goals en Next Meal sections

3. **Component laadt niet**
   - Check browser console voor errors
   - Ververs de pagina

4. **Display issue**
   - Controleer of `AIQuickActions` component rendered wordt
   - Check CSS/styling conflicts

## Debug: Is De Wizard Beschikbaar?

Open browser console en run:
```javascript
// Check if wizard is available
console.log('Wizard state:', document.querySelector('#quick-actions'))
```

Of kijk in React DevTools naar:
```
AIMealDashboard
  → showWizard (state)
  → AIQuickActions (component)
```

## Wizard Heropenen Na Voltooien

Als je de wizard al 1x hebt voltooid maar opnieuw wilt openen:
1. Klik op "Meal Setup" button in Quick Actions
2. Of reset `has_completed_meal_setup` in database naar `false`

## Locatie in Code

- **Wizard Component:** `src/modules/meal-plan/components/MealSetupWizard.jsx`
- **Button Component:** `src/modules/meal-plan/components/AIQuickActions.jsx:29-36`
- **Dashboard Logic:** `src/modules/meal-plan/AIMealDashboard.jsx:400, 496-507`
