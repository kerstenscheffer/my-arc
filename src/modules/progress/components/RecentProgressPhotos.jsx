// src/modules/progress/components/RecentProgressPhotos.jsx
// v4.0 - Alleen de upload-knop. De "recente foto's"-grid is verwijderd op verzoek.
// Props IDENTIEK: { photos, onUpload, todayData, isFriday, isMobile }

import React from 'react'
import UploadSection from '../../progress-photos/components/UploadSection'

export default function RecentProgressPhotos({ onUpload, todayData = {}, isFriday = false, isMobile = false }) {
  return (
    <UploadSection
      onUpload={onUpload}
      todayData={todayData}
      isFriday={isFriday}
      isMobile={isMobile}
    />
  )
}
