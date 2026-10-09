// src/modules/supplements/SupplementProductenModal.jsx
//
// Winkels per supplement: welke producten ziet de klant onder "Waar koop je
// het". De catalogus (supplement_products) is coach-breed, dus wat je hier
// aanzet geldt voor iedere klant met dit supplement.
//
// Zoeken en uitlezen gaat via de edge function `supplement-scrape`:
//  - typ een zoekterm → resultaten van Bol en Etos, uitgelezen met prijs en foto
//  - plak een link    → die ene productpagina uitgelezen
// Bol weert verzoeken vanaf de server; een Bol-link plakken geeft dan geen
// gegevens terug. Vul in dat geval zelf naam en prijs in.
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../coach/ModalHost'
import { X, Search, Trash2, RefreshCw, ExternalLink, Plus, Check, Loader } from 'lucide-react'

const VELDEN = 'id, name, category, emoji, store, product_name, brand, price, url, image_url, in_stock, priority, active, link_status, last_checked_at'
const prijs = (p) => p == null ? '' : `€${Number(p).toFixed(2).replace('.', ',')}`
const winkelVanUrl = (u) => {
  try {
    const h = new URL(u).hostname.replace(/^www\./, '')
    return ({ 'bol.com': 'Bol', 'etos.nl': 'Etos', 'bulk.com': 'Bulk', 'kruidvat.nl': 'Kruidvat', 'ah.nl': 'Albert Heijn', 'myprotein.nl': 'MyProtein' })[h] || h
  } catch { return '' }
}

// Productfoto's zijn vrijwel altijd op wit geschoten.
function Foto({ src, emoji }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fff', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src ? <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 18 }}>{emoji || '💊'}</span>}
    </div>
  )
}

export default function SupplementProductenModal({ db, categorie, naam, emoji, coachId, isMobile, onClose }) {
  const modalHost = useModalHost()
  const m = isMobile
  const [producten, setProducten] = useState(null)
  const [zoek, setZoek] = useState(naam || '')
  const [resultaten, setResultaten] = useState(null)
  const [zoekBezig, setZoekBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [handmatig, setHandmatig] = useState(null)   // { url, store, product_name, price }
  const [toevoegBezig, setToevoegBezig] = useState(null)
  const [checkBezig, setCheckBezig] = useState(false)
  const [zekerId, setZekerId] = useState(null)

  const laad = async () => {
    const { data } = await db.supabase.from('supplement_products').select(VELDEN)
      .eq('category', categorie).order('active', { ascending: false }).order('priority', { ascending: false })
    setProducten(data || [])
  }
  useEffect(() => { laad() }, [categorie])

  const roep = async (body) => {
    const { data, error } = await db.supabase.functions.invoke('supplement-scrape', { body })
    if (error) throw new Error(data?.error || error.message || 'Ophalen mislukt')
    if (data?.error) throw new Error(data.error)
    return data
  }

  const isLink = /^https?:\/\//i.test(zoek.trim())

  const zoekNu = async () => {
    const q = zoek.trim()
    if (!q) return
    setZoekBezig(true); setFout(''); setResultaten(null); setHandmatig(null)
    try {
      if (isLink) {
        const { product } = await roep({ action: 'parse', url: q })
        if (product?.link_status === 'ok' && product.product_name) setResultaten([product])
        else if (product?.link_status === 'dood') setFout('Deze link werkt niet (de winkel geeft een foutpagina).')
        else setHandmatig({ url: product?.url || q, store: product?.store || winkelVanUrl(q), product_name: '', price: '' })
      } else {
        const { resultaten: r } = await roep({ action: 'zoek', query: q, max: 8 })
        setResultaten(r || [])
      }
    } catch (e) { setFout(e.message) }
    setZoekBezig(false)
  }

  const bekendeUrls = new Set((producten || []).map(p => p.url))

  const voegToe = async (p, bron = 'scrape') => {
    setToevoegBezig(p.url); setFout('')
    try {
      const laagste = Math.min(110, ...(producten || []).map(x => x.priority ?? 100))
      const nu = new Date().toISOString()
      const { error } = await db.supabase.from('supplement_products').insert([{
        name: naam, category: categorie, emoji: emoji || '💊',
        store: p.store || winkelVanUrl(p.url), product_name: p.product_name, brand: p.brand || null,
        price: p.price === '' || p.price == null ? null : Number(String(p.price).replace(',', '.')),
        url: p.url, image_url: p.image_url || null, in_stock: p.in_stock ?? true,
        priority: laagste - 10, active: true,
        link_status: bron === 'scrape' ? 'ok' : 'onbekend', last_checked_at: bron === 'scrape' ? nu : null,
        source: bron, added_by: coachId || null, created_at: nu, updated_at: nu,
      }])
      if (error) throw error
      setHandmatig(null)
      await laad()
    } catch (e) { setFout('Toevoegen mislukt: ' + (e.message || e)) }
    setToevoegBezig(null)
  }

  const zetActief = async (p) => {
    setProducten(v => v.map(x => x.id === p.id ? { ...x, active: !p.active } : x))
    const { error } = await db.supabase.from('supplement_products').update({ active: !p.active, updated_at: new Date().toISOString() }).eq('id', p.id)
    if (error) { setFout(error.message); laad() }
  }

  const verwijder = async (p) => {
    if (zekerId !== p.id) { setZekerId(p.id); return }
    const { error } = await db.supabase.from('supplement_products').delete().eq('id', p.id)
    if (error) setFout(error.message)
    setZekerId(null); laad()
  }

  const controleer = async () => {
    setCheckBezig(true); setFout('')
    try { await roep({ action: 'controleer', ids: (producten || []).map(p => p.id) }); await laad() }
    catch (e) { setFout(e.message) }
    setCheckBezig(false)
  }

  const pad = m ? '0.75rem 1rem' : '0.85rem 1.5rem'
  const statusTekst = (s) => s === 'dood' ? 'link werkt niet' : s === 'geblokkeerd' ? 'prijs niet te controleren' : null
  const knop = { minHeight: 40, padding: '0 0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, color: '#fff', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
  const wit = { ...knop, background: '#fff', border: 'none', color: '#0a0a0a' }
  const icoon = { minWidth: 40, minHeight: 40, padding: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }
  const veld = { flex: 1, minWidth: 0, minHeight: 44, padding: '0 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, color: '#fff', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none' }
  const meta = { fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
  const titel = { fontSize: '0.9rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

  const inhoud = (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center', padding: m ? 0 : '1rem' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: m ? '16px 16px 0 0' : 16, width: m ? '100%' : 560, maxHeight: m ? '90vh' : '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: m ? '0.75rem 1rem 0.5rem' : '1rem 1.5rem 0.5rem', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: m ? '1.15rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>Waar koop je het</div>
            <div style={{ ...meta, marginTop: 2 }}>{emoji} {naam} · geldt voor al je klanten</div>
          </div>
          <button onClick={onClose} aria-label="Sluit" style={{ width: 36, height: 36, flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} strokeWidth={2.5} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {/* Wat de klant nu ziet. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: m ? '0.5rem 1rem' : '0.5rem 1.5rem' }}>
            <div style={{ flex: 1, fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>
              Producten{producten ? ` (${producten.filter(p => p.active).length} zichtbaar)` : ''}
            </div>
            {producten?.length > 0 && (
              <button onClick={controleer} disabled={checkBezig} style={{ ...knop, minHeight: 36 }} title="Prijzen, foto's en links opnieuw ophalen">
                {checkBezig ? <Loader size={13} style={{ animation: 'spmSpin 1s linear infinite' }} /> : <RefreshCw size={13} strokeWidth={2.6} />}
                {checkBezig ? 'Bezig…' : 'Prijzen bijwerken'}
              </button>
            )}
          </div>
          {producten === null && <div style={{ padding: pad, ...meta }}>Laden…</div>}
          {producten?.length === 0 && <div style={{ padding: pad, ...meta }}>Nog geen producten. Zoek er hieronder een.</div>}
          {(producten || []).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: pad, borderTop: '1px solid rgba(255,255,255,0.06)', opacity: p.active ? 1 : 0.45 }}>
              <Foto src={p.image_url} emoji={emoji} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={titel}>{p.product_name}</div>
                <div style={meta}>
                  {[p.brand, p.store, prijs(p.price)].filter(Boolean).join(' · ')}
                  {statusTekst(p.link_status) && <span style={{ color: p.link_status === 'dood' ? '#ef4444' : 'rgba(255,255,255,0.45)' }}> · {statusTekst(p.link_status)}</span>}
                </div>
              </div>
              <a href={p.url} target="_blank" rel="noopener noreferrer" title="Open in de winkel" style={{ ...icoon, textDecoration: 'none' }}><ExternalLink size={15} /></a>
              <button onClick={() => zetActief(p)} style={{ ...knop, minHeight: 36, padding: '0 0.7rem' }} title={p.active ? 'Verbergen voor klanten' : 'Tonen aan klanten'}>
                {p.active ? 'Zichtbaar' : 'Verborgen'}
              </button>
              <button onClick={() => verwijder(p)} onBlur={() => setTimeout(() => setZekerId(null), 200)} title="Verwijderen" style={{ ...icoon, color: zekerId === p.id ? '#ef4444' : icoon.color }}>
                {zekerId === p.id ? <span style={{ fontSize: '0.72rem', fontWeight: 900, padding: '0 0.3rem' }}>Zeker?</span> : <Trash2 size={14} />}
              </button>
            </div>
          ))}

          {/* Toevoegen: zoeken of een link plakken. */}
          <div style={{ padding: pad, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>Product toevoegen</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={zoek} onChange={e => { setZoek(e.target.value); setFout('') }} onKeyDown={e => { if (e.key === 'Enter') zoekNu() }}
                placeholder="Zoek op Bol en Etos, of plak een productlink" style={veld} />
              <button onClick={zoekNu} disabled={zoekBezig || !zoek.trim()} style={{ ...wit, minHeight: 44, opacity: zoekBezig || !zoek.trim() ? 0.5 : 1 }}>
                {zoekBezig ? <Loader size={14} style={{ animation: 'spmSpin 1s linear infinite' }} /> : <Search size={14} strokeWidth={2.6} />}
                {isLink ? 'Ophalen' : 'Zoek'}
              </button>
            </div>
            {zoekBezig && <div style={{ ...meta, marginTop: 8 }}>Winkels doorzoeken, dit duurt een paar seconden…</div>}
            {fout && <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', marginTop: 8 }}>{fout}</div>}
          </div>

          {resultaten && resultaten.length === 0 && <div style={{ padding: pad, ...meta }}>Niets gevonden. Probeer een andere zoekterm of plak een link.</div>}
          {(resultaten || []).map(r => {
            const al = bekendeUrls.has(r.url)
            return (
              <div key={r.url} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: pad, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Foto src={r.image_url} emoji={emoji} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={titel}>{r.product_name}</div>
                  <div style={meta}>{[r.brand, r.store, prijs(r.price), r.in_stock === false && 'uitverkocht'].filter(Boolean).join(' · ')}</div>
                </div>
                <a href={r.url} target="_blank" rel="noopener noreferrer" title="Bekijk" style={{ ...icoon, textDecoration: 'none' }}><ExternalLink size={15} /></a>
                {al ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#22c55e', fontSize: '0.8rem', fontWeight: 900, flexShrink: 0 }}><Check size={14} strokeWidth={3} /> Staat erin</span>
                ) : (
                  <button onClick={() => voegToe(r)} disabled={!!toevoegBezig} style={knop}>
                    {toevoegBezig === r.url ? 'Bezig…' : <><Plus size={13} strokeWidth={2.6} /> Toevoegen</>}
                  </button>
                )}
              </div>
            )
          })}

          {/* Winkel weert de server: zelf invullen. */}
          {handmatig && (
            <div style={{ padding: pad, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ ...meta, whiteSpace: 'normal', marginBottom: 8 }}>
                {handmatig.store || 'Deze winkel'} laat zich niet automatisch uitlezen. Vul naam en prijs zelf in.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={handmatig.product_name} onChange={e => setHandmatig(h => ({ ...h, product_name: e.target.value }))} placeholder="Productnaam" style={{ ...veld, flexBasis: 220 }} />
                <input value={handmatig.price} onChange={e => setHandmatig(h => ({ ...h, price: e.target.value }))} placeholder="Prijs" inputMode="decimal" style={{ ...veld, flex: '0 0 90px' }} />
                <button onClick={() => voegToe(handmatig, 'handmatig')} disabled={!handmatig.product_name.trim() || !!toevoegBezig} style={{ ...wit, minHeight: 44, opacity: handmatig.product_name.trim() ? 1 : 0.5 }}>
                  <Plus size={13} strokeWidth={2.6} /> Toevoegen
                </button>
              </div>
            </div>
          )}
          <div style={{ height: 16 }} />
        </div>
      </div>
      <style>{'@keyframes spmSpin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )

  return createPortal(inhoud, modalHost)
}
