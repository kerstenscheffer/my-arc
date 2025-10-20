// src/modules/ai-meal-generator/AIMealGenerator.jsx
import MealPlanGenerator from './MealPlanGenerator'

export default function AIMealGenerator({ db, clients, selectedClient, onClientSelect }) {
  return (
    <MealPlanGenerator 
      db={db} 
      clients={clients} 
      selectedClient={selectedClient} 
      onClientSelect={onClientSelect} 
    />
  )
}
