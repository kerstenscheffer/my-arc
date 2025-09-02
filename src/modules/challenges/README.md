# 🏆 MY ARC CHALLENGES MODULE

## Bestanden:
- `challenges.sql` - Database schema
- `ChallengesService.js` - Database service methods
- `ClientChallenges.jsx` - Hoofdcomponent voor challenges tab
- `ChallengeWidget.jsx` - Floating widget voor alle pagina's

## Integratie:

### 1. In ClientProgress.jsx:
```javascript
// Import toevoegen bovenaan
import ClientChallenges from '../../modules/challenges/ClientChallenges'

// Tab toevoegen (vervang 'achievements'):
{ id: 'challenges', label: 'Challenges', icon: <Trophy size={16} /> }

// Content toevoegen:
{viewMode === 'challenges' && (
  <ClientChallenges client={client} db={db} />
)}
```

### 2. In DatabaseService.js:
```javascript
// Voeg alle methods uit ChallengesService.js toe
```

### 3. Op Workout pagina:
```javascript
import { WorkoutChallengeWidget } from '../modules/challenges/ChallengeWidget'

// In render:
<WorkoutChallengeWidget 
  workoutChallenge={activeChallenge}
  onComplete={() => handleChallengeComplete()}
/>
```

### 4. Floating widget (optioneel op elke pagina):
```javascript
import { ChallengeWidget } from '../modules/challenges/ChallengeWidget'

// In render:
<ChallengeWidget 
  activeChallenge={currentChallenge}
  position="bottom-right"
/>
```

## Database Setup:
1. Open Supabase SQL editor
2. Run challenges.sql
3. Check tables zijn aangemaakt

## Features:
- ✅ Money Back systeem (3 challenges = 100% terug)
- ✅ Rode challenge tab (#ef4444)
- ✅ Progress tracking
- ✅ Milestones
- ✅ Daily logging
- ✅ Leaderboard ready
- ✅ Nederlandse UI

## Testing:
```bash
npm run dev
# Check console voor errors
# Test challenge start
# Check progress updates
```
