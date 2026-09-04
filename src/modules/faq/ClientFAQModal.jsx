// src/modules/faq/ClientFAQModal.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  HelpCircle, X, ArrowRight, MessageCircle, ChevronRight, Search,
  Smartphone, Dumbbell, Utensils, UtensilsCrossed, Moon, Pill, Scale,
  TrendingUp, Pizza, Flame, Apple, Zap, Activity, Heart, AlertTriangle,
  Timer, BarChart2, ShoppingBag, Camera, Phone, User, CheckCircle,
  CheckSquare, RefreshCw
} from 'lucide-react'
import FAQService from './FAQService'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const COACH_PHOTO    = 'https://i.ibb.co/nq4dW5h9/Scherm-afbeelding-2026-03-07-om-18-17-10.png'
const COACH_WHATSAPP = '31612345678' // ← vervang met jouw nummer
const GOLD           = '#FFD700'
const GOLD_DIM       = 'rgba(255,215,0,0.55)'

// ─── ICON RESOLVER ───────────────────────────────────────────────────────────
const ICONS = {
  Smartphone, Dumbbell, Utensils, UtensilsCrossed, Moon, Pill, Scale,
  TrendingUp, Pizza, Flame, Apple, Zap, Activity, Heart, AlertTriangle,
  Timer, BarChart2, ShoppingBag, Camera, Phone, User, CheckCircle,
  CheckSquare, RefreshCw, HelpCircle,
}

function NodeIcon({ name, size = 13, color = GOLD_DIM }) {
  const Icon = ICONS[name] || HelpCircle
  return <Icon size={size} color={color} />
}

// ─── FUZZY SEARCH ─────────────────────────────────────────────────────────────
function scoreMatch(node, query) {
  const q = query.toLowerCase()
  const inLabel  = node.label?.toLowerCase().includes(q)
  const inAnswer = node.answer?.toLowerCase().includes(q)
  if (inLabel)  return 2
  if (inAnswer) return 1
  return 0
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function ClientFAQModal({ onNavigate, coachPhoto, coachWhatsApp, open: openProp, onOpenChange }) {
  const isMobile = window.innerWidth <= 768
  const controlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function'
  const [isOpenInternal, setIsOpenInternal] = useState(false)
  const isOpen = controlled ? openProp : isOpenInternal
  const setIsOpen = (val) => {
    const next = typeof val === 'function' ? val(isOpen) : val
    if (controlled) onOpenChange(next); else setIsOpenInternal(next)
  }
  const [path, setPath]       = useState([])
  const [tree, setTree]       = useState([])
  const [leaves, setLeaves]   = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery]     = useState('')

  const photo    = coachPhoto    || COACH_PHOTO
  const whatsapp = coachWhatsApp || COACH_WHATSAPP

  // ─── LOAD ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || tree.length > 0) return
    ;(async () => {
      setLoading(true)
      const [treeData, leavesData] = await Promise.all([
        FAQService.getTree(),
        FAQService.getLeaves(),
      ])
      setTree(treeData)
      setLeaves(leavesData)
      setLoading(false)
    })()
  }, [isOpen])

  // ─── SEARCH RESULTS ────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    return leaves
      .map(n => ({ ...n, score: scoreMatch(n, query) }))
      .filter(n => n.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [query, leaves])

  const isSearching = query.trim().length > 0

  // ─── TREE NAV ──────────────────────────────────────────────────────────────
  const currentNode     = path.length > 0 ? path[path.length - 1] : null
  const currentChildren = currentNode ? (currentNode.children || []) : tree
  const isLeaf          = node => !!node.answer && (!node.children || node.children.length === 0)

  const select = node => { setQuery(''); setPath(p => [...p, node]) }
  const back   = ()   => setPath(p => p.slice(0, -1))

  const close = () => {
    setIsOpen(false)
    setTimeout(() => { setPath([]); setQuery('') }, 300)
  }

  const navigate = deeplink => {
    if (onNavigate && deeplink) { onNavigate(deeplink); close() }
  }

  const openWA = (prefill) => {
    const clean = (whatsapp || '').replace(/\D/g, '')
    if (!clean) return
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(prefill || 'Hoi! Ik heb een vraag: ')}`, '_blank')
  }

  const bubbleText = () => {
    if (isSearching)    return `Resultaten voor "${query}":`
    if (!currentNode)   return 'Wat wil je weten? Zoek hieronder of kies een onderwerp.'
    if (isLeaf(currentNode)) return 'Dit is mijn antwoord voor je:'
    return 'Kies een vraag:'
  }

  return createPortal(
    <>
      {/* ── FLOATING BADGE — alleen in uncontrolled mode (geen sidebar) ── */}
      {!controlled && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '208px', right: '0', zIndex: 997,
            width: isMobile ? '40px' : '44px', height: isMobile ? '40px' : '44px',
            background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,215,0,0.2)', borderBottom: '1px solid rgba(255,215,0,0.2)', borderLeft: '1px solid rgba(255,215,0,0.2)',
            borderRadius: '10px 0 0 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <HelpCircle size={16} color={GOLD} />
        </button>
      )}

      {/* ── OVERLAY ── */}
      {isMobile && isOpen && (
        <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 998 }} />
      )}

      {/* ── SIDEBAR ── */}
      <div style={{
        position: 'fixed', top: 0,
        right: isOpen ? '0' : '-100%',
        width: isMobile ? '88%' : '380px', maxWidth: '400px',
        height: '100vh', background: '#0a0a0a',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        transition: 'right 0.3s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* HEADER */}
        <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Hulp & Uitleg</div>
            <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
              {isSearching ? 'Zoekresultaten' : path.length === 0 ? 'Wat wil je weten?' : currentNode?.label}
            </div>
          </div>
          <button onClick={close} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <X size={15} color='rgba(255,255,255,0.4)' />
          </button>
        </div>

        {/* ZOEKBALK */}
        <div style={{ padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.45rem 0.75rem' }}>
            <Search size={12} color='rgba(255,255,255,0.25)' />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPath([]) }}
              placeholder='Zoek een vraag...'
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: '500', fontFamily: 'inherit' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, touchAction: 'manipulation', display: 'flex' }}>
                <X size={11} color='rgba(255,255,255,0.25)' />
              </button>
            )}
          </div>
        </div>

        {/* BREADCRUMB — alleen zichtbaar als niet aan het zoeken */}
        {!isSearching && path.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: isMobile ? '0.375rem 1rem' : '0.375rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
            <button onClick={() => setPath([])} style={crumbBtn}>Start</button>
            {path.map((n, i) => (
              <React.Fragment key={n.id}>
                <ChevronRight size={9} color='rgba(255,255,255,0.15)' />
                <button onClick={() => i < path.length - 1 && setPath(p => p.slice(0, i + 1))} style={{ ...crumbBtn, color: i === path.length - 1 ? GOLD : 'rgba(255,255,255,0.3)', fontWeight: i === path.length - 1 ? '600' : '400' }}>
                  {n.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* SCROLL AREA */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* COACH BUBBEL */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', padding: isMobile ? '0.75rem 1rem 0.625rem' : '0.875rem 1.25rem 0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: '1.5px solid rgba(255,215,0,0.25)', overflow: 'hidden' }}>
              <img src={photo} alt='Kersten' style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => e.target.style.display = 'none'} />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px 10px 10px 2px', padding: '0.5rem 0.75rem', maxWidth: '78%' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.775rem', fontWeight: '500', lineHeight: 1.5, margin: 0 }}>
                {bubbleText()}
              </p>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
              Laden...
            </div>
          )}

          {/* ZOEKRESULTATEN */}
          {!loading && isSearching && (
            <div style={{ padding: isMobile ? '0 1rem 1.5rem' : '0 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.775rem', marginBottom: '0.875rem' }}>
                    Geen resultaat voor "{query}"
                  </div>
                  <button onClick={() => openWA(`Hoi! Ik heb een vraag die ik niet kon vinden: ${query}`)} style={waBtn}>
                    <MessageCircle size={12} color='#25D366' />
                    Stel je vraag via WhatsApp
                  </button>
                </div>
              ) : (
                searchResults.map(node => (
                  <SearchResultCard key={node.id} node={node} onNavigate={navigate} onWA={openWA} isMobile={isMobile} />
                ))
              )}
              {searchResults.length > 0 && (
                <button onClick={() => openWA(`Hoi! Ik heb een vraag: ${query}`)} style={{ ...waBtn, marginTop: '0.25rem' }}>
                  <MessageCircle size={12} color='rgba(37,211,102,0.6)' />
                  <span style={{ color: 'rgba(37,211,102,0.6)' }}>Toch liever direct vragen? Stuur een bericht</span>
                </button>
              )}
            </div>
          )}

          {/* ANTWOORD (eindknoop via tree nav) */}
          {!loading && !isSearching && currentNode && isLeaf(currentNode) && (
            <div style={{ padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1rem' }}>
              <div style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)', borderRadius: '10px', padding: '0.875rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.8rem', fontWeight: '500', lineHeight: 1.65, margin: '0 0 0.875rem 0' }}>
                  {currentNode.answer}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {currentNode.deeplink && (
                    <button onClick={() => navigate(currentNode.deeplink)} style={actionBtn(GOLD, 'rgba(255,215,0,0.08)', 'rgba(255,215,0,0.22)')}>
                      <ArrowRight size={12} color={GOLD} />
                      {currentNode.hint || 'Ga naar pagina'}
                    </button>
                  )}
                  {currentNode.whatsapp && (
                    <button onClick={() => openWA(currentNode.whatsapp)} style={actionBtn('#25D366', 'rgba(37,211,102,0.07)', 'rgba(37,211,102,0.18)')}>
                      <MessageCircle size={12} color='#25D366' />
                      Vraag je coach via WhatsApp
                    </button>
                  )}
                  <button onClick={back} style={{ padding: '0.4rem', background: 'none', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', touchAction: 'manipulation' }}>
                    ← Vorige stap
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KEUZE BUTTONS (tree nav) */}
          {!loading && !isSearching && (!currentNode || !isLeaf(currentNode)) && (
            <div style={{ padding: isMobile ? '0 1rem 1.5rem' : '0 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.325rem' }}>
              {currentChildren.map(node => (
                <button
                  key={node.id}
                  onClick={() => select(node)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: isMobile ? '0.625rem 0.875rem' : '0.7rem 1rem',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px', transition: 'background 0.12s ease, border-color 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,215,0,0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                  onTouchStart={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,215,0,0.15)' }}
                  onTouchEnd={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '6px', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <NodeIcon name={node.icon} size={12} color={GOLD_DIM} />
                  </div>
                  <span style={{ flex: 1, color: '#fff', fontSize: isMobile ? '0.8rem' : '0.825rem', fontWeight: '600', lineHeight: 1.4, textAlign: 'left' }}>
                    {node.label}
                  </span>
                  <ChevronRight size={12} color='rgba(255,255,255,0.15)' style={{ flexShrink: 0 }} />
                </button>
              ))}

              {path.length > 0 && (
                <button onClick={() => openWA('Hoi! Ik heb een vraag die ik niet kon vinden: ')} style={{ ...waBtn, marginTop: '0.25rem' }}>
                  <MessageCircle size={12} color='rgba(37,211,102,0.6)' />
                  <span style={{ color: 'rgba(37,211,102,0.6)' }}>Staat er niet bij? Stuur je coach een bericht</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`div::-webkit-scrollbar{display:none}`}</style>
    </>,
    document.body
  )
}

// ─── SEARCH RESULT CARD ───────────────────────────────────────────────────────
function SearchResultCard({ node, onNavigate, onWA, isMobile }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.875rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
      >
        <div style={{ width: 24, height: 24, borderRadius: '5px', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <NodeIcon name={node.icon} size={11} color='rgba(255,215,0,0.55)' />
        </div>
        <span style={{ flex: 1, color: '#fff', fontSize: '0.8rem', fontWeight: '600', lineHeight: 1.4 }}>{node.label}</span>
        <ChevronRight size={11} color='rgba(255,255,255,0.15)' style={{ flexShrink: 0, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>
      {expanded && (
        <div style={{ padding: '0 0.875rem 0.75rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.775rem', lineHeight: 1.6, margin: '0 0 0.625rem 0' }}>{node.answer}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {node.deeplink && (
              <button onClick={() => onNavigate(node.deeplink)} style={actionBtn('#FFD700', 'rgba(255,215,0,0.08)', 'rgba(255,215,0,0.2)')}>
                <ArrowRight size={11} color='#FFD700' />{node.hint || 'Ga naar pagina'}
              </button>
            )}
            {node.whatsapp && (
              <button onClick={() => onWA(node.whatsapp)} style={actionBtn('#25D366', 'rgba(37,211,102,0.07)', 'rgba(37,211,102,0.18)')}>
                <MessageCircle size={11} color='#25D366' />Vraag je coach via WhatsApp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const crumbBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.1rem',
  color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem',
  touchAction: 'manipulation', whiteSpace: 'nowrap', flexShrink: 0,
}

const actionBtn = (color, bg, border) => ({
  display: 'flex', alignItems: 'center', gap: '0.375rem',
  padding: '0.5rem 0.7rem', background: bg, border: `1px solid ${border}`,
  borderRadius: '7px', cursor: 'pointer', color,
  fontSize: '0.72rem', fontWeight: '600',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', textAlign: 'left',
})

const waBtn = {
  display: 'flex', alignItems: 'center', gap: '0.375rem',
  padding: '0.5rem 0.7rem', background: 'rgba(37,211,102,0.05)',
  border: '1px solid rgba(37,211,102,0.12)', borderRadius: '7px',
  cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
