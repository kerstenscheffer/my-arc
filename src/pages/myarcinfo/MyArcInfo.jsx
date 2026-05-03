// src/pages/myarcinfo/MyArcInfo.jsx
import Hero from './components/Hero'
import ClientResults from './components/ClientResults'
import HowItWorks from './components/HowItWorks'
import Reviews from './components/Reviews'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import BookCall from './components/BookCall'

export default function MyArcInfo() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Hero />
      <ClientResults />
      <HowItWorks />
      <Reviews />
      <Pricing />
      <FAQ />
      <BookCall />
    </div>
  )
}
