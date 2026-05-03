// src/modules/resource-hub/HubRouter.jsx
import { useState, useEffect } from 'react'
import BundelPage from './BundelPage'
import CardioMenu from './pages/CardioMenu'
import CardioSchema from './pages/CardioSchema'
import CardioBlessures from './pages/CardioBlessures'
import CardioSerie from './pages/CardioSerie'

const BUNDEL_SUBPAGES = {
  cardio: { menu: CardioMenu, schema: CardioSchema, blessures: CardioBlessures, serie: CardioSerie }
}

const BUNDEL_CONFIGS = {
  cardio: {
    slug: 'cardio',
    title: 'Het Lean Machine Cardio Plan',
    subtitle: 'BUNDEL 8 · CARDIO SYSTEEM',
    description: 'Van nul naar shredded — afgestemd op jouw conditie en blessures.',
    theme_color: '#f97316',
    calendly_url: null,
    whatsapp_prompt: 'Hey Kersten, ik zou graag hulp willen met mijn cardioplan. Kun je me daarmee helpen?',
    total_bundels: 18,
    stats: [
      { value: '15+', label: 'vormen' },
      { value: '8', label: 'weken' },
      { value: '€197', label: 'waarde' }
    ]
  }
}

export default function HubRouter({ db }) {
  const [bundelSlug, setBundelSlug] = useState('')
  const [subPage, setSubPage] = useState('')
  const [user, setUser] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  const init = async () => {
    try {
      const parts = window.location.pathname.split('/').filter(Boolean)
      setBundelSlug(parts[1] || '')
      setSubPage(parts[2] || '')
      try {
        const authUser = await db.getCurrentUser()
        if (authUser) {
          setUser(authUser)
          try {
            const clientData = await db.getClientByEmail(authUser.email)
            if (clientData) setClient(clientData)
          } catch (clientErr) {
            console.log('Hub: user logged in but not a client — visitor mode')
          }
        }
      } catch (e) { console.log('Hub: visitor mode') }
    } catch (e) { console.error('Hub init error:', e) }
    finally { setLoading(false) }
  }

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    const parts = path.split('/').filter(Boolean)
    setBundelSlug(parts[1] || '')
    setSubPage(parts[2] || '')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const bundel = BUNDEL_CONFIGS[bundelSlug]
  const isMember = !!(user && client)

  if (!bundel) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFD700', marginBottom: '0.5rem' }}>MY ARC</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Deze pagina bestaat niet (nog).</div>
    </div>
  )

  if (subPage && BUNDEL_SUBPAGES[bundelSlug]?.[subPage]) {
    const Sub = BUNDEL_SUBPAGES[bundelSlug][subPage]
    return <Sub db={db} bundel={bundel} user={user} client={client} isMember={isMember} navigate={navigate} />
  }

  return <BundelPage db={db} bundel={bundel} user={user} client={client} isMember={isMember} navigate={navigate} />
}
