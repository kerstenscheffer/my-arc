// src/modules/productivity/hooks/useTaskTimer.js
// Centrale timer state — te gebruiken in CoachHub en ProductivityKanban

import { useState } from 'react'

export function useTaskTimer(productivityService, coachId) {
  const [activeTask, setActiveTask] = useState(null)   // { task, sessionMinutes }
  const [showStartModal, setShowStartModal] = useState(null) // task object

  const handleStartTask = (task) => setShowStartModal(task)

  const handleConfirmStart = (minutes) => {
    setActiveTask({ task: showStartModal, sessionMinutes: minutes })
    setShowStartModal(null)
  }

  const handleStopTimer = async (minutesSpent) => {
    if (minutesSpent >= 1 && productivityService && coachId && activeTask) {
      await productivityService.logTime(
        coachId,
        activeTask.task.id,
        activeTask.task.title,
        activeTask.task.category,
        minutesSpent
      )
    }
    setActiveTask(null)
  }

  const handleCompleteFromTimer = async (minutesSpent, onComplete) => {
    if (minutesSpent >= 1 && productivityService && coachId && activeTask) {
      await productivityService.logTime(
        coachId,
        activeTask.task.id,
        activeTask.task.title,
        activeTask.task.category,
        minutesSpent
      )
    }
    if (onComplete) await onComplete(activeTask?.task?.id)
    setActiveTask(null)
  }

  return {
    activeTask,
    showStartModal,
    handleStartTask,
    handleConfirmStart,
    handleStopTimer,
    handleCompleteFromTimer,
    setActiveTask,
    setShowStartModal
  }
}
