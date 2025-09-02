
// ============================================
// 6️⃣ ChallengeAssignV2.jsx
// ============================================
// src/coach/v2/1-client-management/pages/ChallengeAssignV2.jsx

import { useState } from 'react'
// Import assignment delen van ChallengeBuilder

export default function ChallengeAssignV2({ db, client, challenges, refreshData, isMobile }) {
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [isMoneyBack, setIsMoneyBack] = useState(false)
  
  const assignChallenge = async () => {
    // Assignment logic from ChallengeBuilder
  }
  
  return (
    <div>
      {/* Challenge selector */}
      {/* Challenge preview */}
      {/* Money-back toggle */}
      {/* Assign button */}
    </div>
  )
}
