# Weight Tracker Components - Integration Guide

## Component Overview

The Weight Tracker has been split into 6 modular components that can be used independently or combined:

1. **WeightHeader** - Title and Friday badge
2. **FridayAlert** - Friday warning banner
3. **WeightProgressRing** - Main weight input with ring
4. **WeightStatsGrid** - 4 statistics cards
5. **WeightHistory** - Collapsible history list
6. **WeightTracker** - Main orchestrator

## Folder Structure

```
src/modules/weight-tracker/
├── WeightTracker.jsx
├── WeightTrackerService.js
└── components/
    ├── WeightHeader.jsx
    ├── FridayAlert.jsx
    ├── WeightProgressRing.jsx
    ├── WeightStatsGrid.jsx
    └── WeightHistory.jsx
```

## Individual Component Usage

### WeightProgressRing
Main weight input with progress visualization.

```javascript
import WeightProgressRing from './components/WeightProgressRing'

<WeightProgressRing 
  weight={75.5}                    // Current weight value
  onWeightChange={setWeight}       // Weight change handler
  onSave={handleSave}             // Save handler
  saving={false}                   // Loading state
  todayEntry={null}               // Today's entry if exists
  progressPercent={65}            // Progress to goal (0-100)
  isFriday={false}                // Friday detection
  isMobile={false}                // Mobile detection
/>
```

### WeightStatsGrid
Four statistics cards showing current, week change, goal, and Friday progress.

```javascript
import WeightStatsGrid from './components/WeightStatsGrid'

<WeightStatsGrid 
  stats={{
    current: 75.5,
    weekChange: -0.8,
    monthChange: -2.3
  }}
  client={{
    goal_weight: 70,
    start_weight: 80
  }}
  fridayData={{
    friday_count: 3,
    percentage: 37.5
  }}
  isMobile={false}
/>
```

### WeightHistory
Collapsible list of weight entries.

```javascript
import WeightHistory from './components/WeightHistory'

<WeightHistory 
  history={[
    { id: 1, date: '2025-01-08', weight: 75.5, is_friday_weighin: false },
    { id: 2, date: '2025-01-07', weight: 75.8, is_friday_weighin: false }
  ]}
  isMobile={false}
  maxItems={14}                  // Max items to show
/>
```

### WeightHeader
Header with title and Friday compliance badge.

```javascript
import WeightHeader from './components/WeightHeader'

<WeightHeader 
  fridayData={{
    friday_count: 3,
    total_fridays: 8
  }}
  isMobile={false}
/>
```

### FridayAlert
Conditional Friday warning banner.

```javascript
import FridayAlert from './components/FridayAlert'

<FridayAlert 
  isFriday={true}               // Is today Friday?
  todayEntry={null}             // Already logged today?
  isMobile={false}
/>
```

## Combined Usage Example

### Weight + Photos Page

```javascript
import React, { useState, useEffect } from 'react'
import WeightTrackerService from '../weight-tracker/WeightTrackerService'
import WeightProgressRing from '../weight-tracker/components/WeightProgressRing'
import WeightStatsGrid from '../weight-tracker/components/WeightStatsGrid'
import PhotoGallery from '../photos/components/PhotoGallery'

export default function ProgressDashboard({ client, db }) {
  const [weightData, setWeightData] = useState({})
  const [photoData, setPhotoData] = useState([])
  const isMobile = window.innerWidth <= 768
  
  // Service
  const weightService = new WeightTrackerService(db)
  
  // Load data
  useEffect(() => {
    async function loadData() {
      const [stats, photos] = await Promise.all([
        weightService.getWeightStats(client.id),
        db.getProgressPhotos(client.id)
      ])
      setWeightData(stats)
      setPhotoData(photos)
    }
    loadData()
  }, [client.id])
  
  return (
    <div>
      {/* Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Weight Section */}
        <div>
          <h3>Weight Progress</h3>
          <WeightProgressRing 
            weight={weightData.current || 70}
            progressPercent={65}
            isMobile={isMobile}
          />
        </div>
        
        {/* Photos Section */}
        <div>
          <h3>Progress Photos</h3>
          <PhotoGallery 
            photos={photoData}
            isMobile={isMobile}
          />
        </div>
      </div>
      
      {/* Stats Below */}
      <WeightStatsGrid 
        stats={weightData}
        client={client}
        isMobile={isMobile}
      />
    </div>
  )
}
```

### Custom Layout Example

```javascript
// Mix components in custom order
<div>
  <WeightHeader fridayData={data} isMobile={true} />
  
  <div style={{ display: 'flex', gap: '1rem' }}>
    <div style={{ flex: 1 }}>
      <WeightProgressRing {...props} />
    </div>
    <div style={{ flex: 1 }}>
      <CustomPhotoUpload />
    </div>
  </div>
  
  <WeightHistory history={history} />
</div>
```

## Data Requirements

Each component needs specific data from `WeightTrackerService`:

```javascript
const service = new WeightTrackerService(db)

// For stats
const stats = await service.getWeightStats(clientId)
// Returns: { current, weekChange, monthChange, lowest, highest }

// For history
const history = await service.getWeightHistory(clientId, 56)
// Returns: Array of weight entries

// For Friday compliance
const fridayData = await service.getFridayCompliance(clientId)
// Returns: { friday_count, percentage, is_compliant }
```

## Styling Customization

All components use the THEME object that can be overridden:

```javascript
const CUSTOM_THEME = {
  primary: '#dc2626',    // Red instead of green
  gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#dc2626',
  friday: '#8b5cf6'
}
```

## Mobile Optimization

All components accept `isMobile` prop for responsive design:
- Font sizes scale down 10-30%
- Spacing reduces 25-50%
- Touch targets minimum 44px
- Grid layouts adjust columns

## Integration Checklist

- [ ] Import needed components
- [ ] Initialize WeightTrackerService
- [ ] Load data with service methods
- [ ] Pass correct props to components
- [ ] Handle save/update callbacks
- [ ] Check mobile detection
- [ ] Test Friday detection logic
- [ ] Verify database permissions
