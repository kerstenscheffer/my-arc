// Klantenbord (kanban) op Command — Kersten, 24 nov 2026.
// Kolommen zijn eigen secties ("Aandacht nodig", "Loopt goed", ...). Klanten
// sleep je ertussen (desktop) of verplaats je met lang drukken (telefoon).
// De filters bovenaan werken gewoon door: het bord krijgt de gefilterde lijst.
// Binnen een kolom blijft de urgentie-volgorde van de lijst staan.
import React, { useEffect, useRef, useState } from 'react'
import { Plus, MoreHorizontal, Check, X } from 'lucide-react'
import { colors, radius, space } from '../../../ui/tokens'
import {
  KLEUREN, KLEUR_VOLGORDE, laadBord, bewaarPlek, nieuweSectie,
  wijzigSectie, verwijderSectie, bewaarVolgorde, weekMoment, kaartVolheid,
} from '../klantBord'

const NOG = '__nog__'
const KOLOM = 340

export default function KlantBord({ supabase, klanten, renderKaart, isMobile }) {
  const [bord, setBord] = useState(null)
  const [dropKolom, setDropKolom] = useState(null)
  const [verplaats, setVerplaats] = useState(null) // klant voor het keuzevenster
  const [menu, setMenu] = useState(null) // sectie-id met open menu
  const [hernoem, setHernoem] = useState(null) // { id, naam }
  const [nieuw, setNieuw] = useState(null) // naam in het invoerveld, null = dicht
  const [zeker, setZeker] = useState(null) // sectie-id die nog een tik nodig heeft
  const gesleept = useRef(null)
  const lang = useRef({ t: null, vuurde: false })

  useEffect(() => {
    let weg = false
    laadBord(supabase).then(b => { if (!weg) setBord(b) })
    return () => { weg = true }
  }, [supabase])

  if (!bord) return <div style={{ padding: space[6], color: colors.textSecondary, fontWeight: 800 }}>Bord laden…</div>

  const bestaand = new Set(bord.secties.map(s => s.id))
  const startId = (bord.secties.find(s => s.rol === 'maandag') || bord.secties[0])?.id
  const moment = weekMoment()
  const sectieById = Object.fromEntries(bord.secties.map(s => [s.id, s]))
  const sectieVan = (c) => (bestaand.has(bord.plek[c.id]) ? bord.plek[c.id] : NOG)
  const perKolom = {}
  const volheid = (c) => kaartVolheid({ sectie: sectieById[sectieVan(c)], startId, tijd: bord.tijd?.[c.id], dagen: c.dagCheck?.dagen, moment })
  for (const c of klanten) (perKolom[sectieVan(c)] ||= []).push(c)
  // Afgerond (afgevinkt of al gedaan deze week) zakt naar onderen; verder blijft
  // de urgentie-volgorde staan (sort is stabiel).
  for (const k of Object.keys(perKolom)) perKolom[k].sort((a, b) => (volheid(a) < 1) - (volheid(b) < 1))
  const kolommen = [
    ...(perKolom[NOG]?.length ? [{ id: NOG, naam: 'Nog indelen', kleur: 'wit', virtueel: true }] : []),
    ...bord.secties,
  ]

  const zet = (clientId, sectieId) => {
    const doel = sectieId === NOG ? null : sectieId
    const plek = { ...bord.plek }
    if (doel) plek[clientId] = doel; else delete plek[clientId]
    const nieuwBord = { ...bord, plek, tijd: { ...(bord.tijd || {}), [clientId]: new Date().toISOString() } }
    setBord(nieuwBord)
    bewaarPlek(supabase, nieuwBord, clientId, doel)
  }

  const maakSectie = async () => {
    const naam = (nieuw || '').trim()
    setNieuw(null)
    if (!naam) return
    const s = await nieuweSectie(supabase, bord, naam)
    if (!s) return
    const nieuwBord = { ...bord, secties: [...bord.secties, s] }
    setBord(nieuwBord)
    if (bord.bron !== 'db') bewaarVolgorde(supabase, nieuwBord)
  }

  const pasAan = (id, velden) => {
    const nieuwBord = { ...bord, secties: bord.secties.map(s => (s.id === id ? { ...s, ...velden } : s)) }
    setBord(nieuwBord)
    wijzigSectie(supabase, nieuwBord, id, velden)
  }

  // Eén startkolom en één donderdag-kolom per coach: de rol verhuist mee.
  const zetRol = (id, rol) => {
    const oud = bord.secties.find(s => s.id !== id && s.rol === rol)
    const huidig = bord.secties.find(s => s.id === id)?.rol
    const nieuweRol = huidig === rol ? null : rol
    const nieuwBord = { ...bord, secties: bord.secties.map(s => (s.id === id ? { ...s, rol: nieuweRol } : (nieuweRol && s.id === oud?.id ? { ...s, rol: null } : s))) }
    setBord(nieuwBord); setMenu(null)
    if (nieuweRol && oud) wijzigSectie(supabase, nieuwBord, oud.id, { rol: null })
    wijzigSectie(supabase, nieuwBord, id, { rol: nieuweRol })
  }

  const schuif = (id, richting) => {
    const lijst = [...bord.secties]
    const i = lijst.findIndex(s => s.id === id), j = i + richting
    if (i < 0 || j < 0 || j >= lijst.length) return
    ;[lijst[i], lijst[j]] = [lijst[j], lijst[i]]
    const nieuwBord = { ...bord, secties: lijst.map((s, n) => ({ ...s, volgorde: n })) }
    setBord(nieuwBord)
    bewaarVolgorde(supabase, nieuwBord)
  }

  const weg = (id) => {
    if (zeker !== id) { setZeker(id); return }
    const plek = Object.fromEntries(Object.entries(bord.plek).filter(([, s]) => s !== id))
    const nieuwBord = { ...bord, secties: bord.secties.filter(s => s.id !== id), plek }
    setBord(nieuwBord); setMenu(null); setZeker(null)
    verwijderSectie(supabase, nieuwBord, id)
  }

  // Lang drukken op telefoon = verplaatsen; de tik erna mag de kaart niet openen.
  const drukStart = (c) => {
    lang.current.vuurde = false
    clearTimeout(lang.current.t)
    lang.current.t = setTimeout(() => { lang.current.vuurde = true; setVerplaats(c) }, 450)
  }
  const drukStop = () => clearTimeout(lang.current.t)

  const knop = { minWidth: 44, minHeight: 44, padding: 0, border: 'none', background: 'none', color: colors.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }
  const menuRegel = { ...knop, justifyContent: 'flex-start', width: '100%', padding: `0 ${space[3]}px`, fontSize: 15, fontWeight: 800, minHeight: 44 }

  return (
    <>
    <style>{'@media (hover: hover) { .kb-kaart:hover { opacity: 1 !important; filter: none !important; } }'}</style>
    <div style={{ display: 'flex', gap: space[4], overflowX: 'auto', padding: isMobile ? `${space[3]}px` : `${space[4]}px ${space[8]}px`, alignItems: 'flex-start', scrollSnapType: isMobile ? 'x mandatory' : 'none', WebkitOverflowScrolling: 'touch', minHeight: '60vh' }}
      onClick={() => { if (menu) { setMenu(null); setZeker(null) } }}>
      {kolommen.map(k => {
        const lijst = perKolom[k.id] || []
        const kleur = KLEUREN[k.kleur] || KLEUREN.wit
        return (
          <div key={k.id}
            onDragOver={e => { if (!gesleept.current) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropKolom(k.id) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropKolom(d => (d === k.id ? null : d)) }}
            onDrop={e => { e.preventDefault(); const id = gesleept.current; gesleept.current = null; setDropKolom(null); if (id) zet(id, k.id) }}
            style={{
              flex: isMobile ? '0 0 auto' : `1 1 ${KOLOM}px`, width: isMobile ? '86vw' : undefined, minWidth: isMobile ? undefined : KOLOM, scrollSnapAlign: 'start',
              borderRadius: radius.card, padding: space[2], boxSizing: 'border-box', minHeight: 160,
              background: dropKolom === k.id ? colors.surfaceHover : 'transparent', transition: 'background .15s',
            }}>
            {/* Kop: kleurbalk (tik = andere kleur), naam (tik = hernoemen), aantal, menu. */}
            <button disabled={k.virtueel} title={k.virtueel ? undefined : 'Andere kleur'}
              onClick={() => pasAan(k.id, { kleur: KLEUR_VOLGORDE[(KLEUR_VOLGORDE.indexOf(k.kleur) + 1) % KLEUR_VOLGORDE.length] })}
              style={{ display: 'block', width: '100%', height: 12, padding: '3px 0', border: 'none', background: 'none', cursor: k.virtueel ? 'default' : 'pointer' }}>
              <span style={{ display: 'block', height: 6, borderRadius: 3, background: k.virtueel ? colors.borderSubtle : kleur }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: space[2], minHeight: 44, position: 'relative' }}>
              {hernoem?.id === k.id ? (
                <input autoFocus value={hernoem.naam}
                  onChange={e => setHernoem({ ...hernoem, naam: e.target.value })}
                  onBlur={() => { const n = hernoem.naam.trim(); if (n && n !== k.naam) pasAan(k.id, { naam: n }); setHernoem(null) }}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setHernoem(null) }}
                  style={{ flex: 1, minWidth: 0, height: 36, padding: `0 ${space[2]}px`, borderRadius: radius.btn, border: `1px solid ${colors.borderSubtle}`, background: colors.surface, color: colors.textPrimary, fontSize: 17, fontWeight: 900, fontFamily: 'inherit', outline: 'none' }} />
              ) : (
                <button onClick={() => !k.virtueel && setHernoem({ id: k.id, naam: k.naam })}
                  style={{ ...knop, justifyContent: 'flex-start', flex: 1, minWidth: 0, fontSize: 17, fontWeight: 900, textAlign: 'left', cursor: k.virtueel ? 'default' : 'text' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.naam}</span>
                  <span style={{ marginLeft: space[2], color: colors.textSecondary }}>{lijst.length}</span>
                </button>
              )}
              {!k.virtueel && (
                <button aria-label="Sectie-opties" onClick={e => { e.stopPropagation(); setZeker(null); setMenu(m => (m === k.id ? null : k.id)) }} style={knop}>
                  <MoreHorizontal size={20} strokeWidth={2.6} />
                </button>
              )}
              {menu === k.id && (
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 44, right: 0, zIndex: 20, width: 200, padding: space[1], borderRadius: radius.btn, background: colors.surface, border: `1px solid ${colors.borderSubtle}`, boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
                  <button style={menuRegel} onClick={() => { setMenu(null); setHernoem({ id: k.id, naam: k.naam }) }}>Hernoemen</button>
                  <button style={menuRegel} onClick={() => zetRol(k.id, 'maandag')}>{k.rol === 'maandag' ? '✓ ' : ''}Startkolom maandag</button>
                  <button style={menuRegel} onClick={() => zetRol(k.id, 'donderdag')}>{k.rol === 'donderdag' ? '✓ ' : ''}Donderdag-check</button>
                  <button style={menuRegel} onClick={() => schuif(k.id, -1)}>Naar links</button>
                  <button style={menuRegel} onClick={() => schuif(k.id, 1)}>Naar rechts</button>
                  <button style={{ ...menuRegel, color: colors.danger }} onClick={() => weg(k.id)}>
                    {zeker === k.id ? 'Zeker? Tik nog eens' : 'Verwijderen'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: space[3], marginTop: space[2] }}>
              {lijst.map(c => (
                <div key={c.id}
                  draggable={!isMobile}
                  onDragStart={e => { gesleept.current = c.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', c.id) } catch { /* oude browser */ } }}
                  onDragEnd={() => { gesleept.current = null; setDropKolom(null) }}
                  onContextMenu={e => { e.preventDefault(); setVerplaats(c) }}
                  onTouchStart={() => drukStart(c)} onTouchMove={drukStop} onTouchEnd={drukStop} onTouchCancel={drukStop}
                  onClickCapture={e => { if (lang.current.vuurde) { e.stopPropagation(); e.preventDefault(); lang.current.vuurde = false } }}
                  className="kb-kaart"
                  style={(() => {
                    const vol = volheid(c)
                    return {
                      cursor: isMobile ? 'auto' : 'grab', WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none',
                      '--kb-vol': vol, opacity: vol, filter: vol < 1 ? 'grayscale(0.6)' : 'none',
                      transition: 'opacity .2s, filter .2s',
                    }
                  })()}>
                  {bord.vorige?.[c.id]?.rol === 'donderdag' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: space[2], padding: `0 ${space[1]}px ${space[1]}px`, fontSize: 13, fontWeight: 800, color: colors.textPrimary }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: KLEUREN[bord.vorige[c.id].kleur] || KLEUREN.wit }} />
                      Vorige week: {bord.vorige[c.id].naam}
                    </div>
                  )}
                  {renderKaart(c)}
                </div>
              ))}
              {!lijst.length && (
                <div style={{ padding: `${space[6]}px ${space[3]}px`, borderRadius: radius.btn, border: `1px dashed ${colors.borderSubtle}`, color: colors.textSecondary, fontSize: 15, fontWeight: 800, textAlign: 'center' }}>
                  {isMobile ? 'Druk lang op een klant om hem hierheen te zetten' : 'Sleep een klant hierheen'}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Nieuwe sectie */}
      {/* Smal: alleen een + tot je er een naam in typt. */}
      <div style={{ flex: '0 0 auto', width: nieuw === null ? 44 : (isMobile ? '86vw' : 280), paddingTop: 12 + space[2], scrollSnapAlign: 'start' }}>
        {nieuw === null ? (
          <button onClick={() => setNieuw('')} title="Sectie toevoegen" aria-label="Sectie toevoegen" style={knop}>
            <Plus size={20} strokeWidth={2.8} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: space[1] }}>
            <input autoFocus value={nieuw} placeholder="Naam sectie"
              onChange={e => setNieuw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') maakSectie(); if (e.key === 'Escape') setNieuw(null) }}
              style={{ flex: 1, minWidth: 0, height: 44, padding: `0 ${space[3]}px`, borderRadius: radius.btn, border: `1px solid ${colors.borderSubtle}`, background: colors.surface, color: colors.textPrimary, fontSize: 15, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
            <button aria-label="Toevoegen" onClick={maakSectie} style={knop}><Check size={20} strokeWidth={2.8} /></button>
            <button aria-label="Annuleren" onClick={() => setNieuw(null)} style={knop}><X size={20} strokeWidth={2.8} /></button>
          </div>
        )}
      </div>

      {/* Verplaatsen (lang drukken of rechtsklik) */}
      {verplaats && (
        <div onClick={() => setVerplaats(null)} style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: isMobile ? '100%' : 360, padding: space[4], paddingBottom: isMobile ? `calc(${space[4]}px + env(safe-area-inset-bottom))` : space[4], borderRadius: isMobile ? `${radius.card}px ${radius.card}px 0 0` : radius.card, background: colors.surface }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: colors.textPrimary, marginBottom: space[2] }}>
              {verplaats.first_name} {verplaats.last_name} naar
            </div>
            {[...bord.secties, { id: NOG, naam: 'Nog indelen', kleur: 'wit' }].map(s => {
              const nu = sectieVan(verplaats) === s.id
              return (
                <button key={s.id} onClick={() => { if (!nu) zet(verplaats.id, s.id); setVerplaats(null) }}
                  style={{ ...menuRegel, gap: space[3], padding: `0 ${space[2]}px` }}>
                  <span style={{ width: 12, height: 12, borderRadius: 6, flexShrink: 0, background: s.id === NOG ? colors.borderSubtle : KLEUREN[s.kleur] }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{s.naam}</span>
                  {nu && <Check size={18} strokeWidth={2.8} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
