// src/modules/app-update/AppVersiesPaneel.jsx
//
// Coachkant: per platform welke versie de nieuwste is en vanaf welke versie
// de app verplicht moet updaten. Eén tabel (app_release), twee rijen.
//
// iOS haalt de nieuwste versie zelf bij Apple op; het veld hier is alleen de
// terugval als Apple niet antwoordt. Voor Android is dit veld dé bron: Google
// heeft geen publieke lijst.

import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { haalStoreVersie, nieuwerDan } from './appVersie'

const PLATFORMS = [
  { key: 'ios', label: 'iOS (App Store)' },
  { key: 'android', label: 'Android (Play Store)' },
]

const VELD = {
  background: 'transparent', border: 'none', borderBottom: '1.5px solid #fff', borderRadius: 0,
  color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 16,
  padding: '8px 0', width: '100%', outline: 'none',
}

export default function AppVersiesPaneel({ db }) {
  const [rijen, setRijen] = useState(null)
  const [appleVersie, setAppleVersie] = useState(null)
  const [bezig, setBezig] = useState(null)
  const [melding, setMelding] = useState(null)

  useEffect(() => {
    let weg = false
    db.supabase.from('app_release').select('*').then(({ data }) => {
      if (weg) return
      const kaart = {}
      ;(data || []).forEach(r => { kaart[r.platform] = r })
      setRijen(kaart)
    })
    haalStoreVersie().then(v => { if (!weg) setAppleVersie(v) })
    return () => { weg = true }
  }, [db])

  const zet = (p, veld, waarde) => setRijen(prev => ({
    ...prev,
    [p]: { ...(prev?.[p] || { platform: p }), [veld]: waarde },
  }))

  const bewaar = async (p) => {
    const r = rijen?.[p] || { platform: p }
    setBezig(p); setMelding(null)
    const payload = {
      platform: p,
      latest_version: (r.latest_version || '').trim() || null,
      min_version: (r.min_version || '').trim() || null,
      bericht: (r.bericht || '').trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await db.supabase.from('app_release').upsert(payload, { onConflict: 'platform' })
    setBezig(null)
    setMelding(error ? `Opslaan mislukt: ${error.message}` : `${p === 'ios' ? 'iOS' : 'Android'} opgeslagen`)
  }

  if (!rijen) return <div style={{ padding: 24, color: '#9ca3af', fontWeight: 700 }}>Laden…</div>

  return (
    <div style={{ padding: 24, maxWidth: 720, color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Smartphone size={22} strokeWidth={2.4} />
        <div style={{ fontSize: 22, fontWeight: 800 }}>App-versies</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#9ca3af', lineHeight: 1.5, marginBottom: 24 }}>
        Klanten onder de <b style={{ color: '#fff' }}>minimumversie</b> zien een scherm dat ze eerst moeten updaten.
        Klanten onder de <b style={{ color: '#fff' }}>nieuwste versie</b> zien een balk die ze weg kunnen klikken.
        Zet de minimumversie pas omhoog als de nieuwe versie écht in de winkel staat.
      </div>

      {PLATFORMS.map(({ key, label }) => {
        const r = rijen[key] || {}
        const appleLive = key === 'ios' ? appleVersie : null
        const waarschuwing = r.min_version && (appleLive || r.latest_version) && nieuwerDan(r.min_version, appleLive || r.latest_version)
        return (
          <div key={key} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{label}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>
                  Nieuwste versie{appleLive ? ` · Apple zegt ${appleLive}` : ''}
                </div>
                <input
                  value={r.latest_version || ''}
                  onChange={e => zet(key, 'latest_version', e.target.value)}
                  placeholder="bv. 1.4"
                  inputMode="decimal"
                  style={VELD}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>Minimumversie (verplicht)</div>
                <input
                  value={r.min_version || ''}
                  onChange={e => zet(key, 'min_version', e.target.value)}
                  placeholder="leeg = niets verplicht"
                  inputMode="decimal"
                  style={VELD}
                />
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>Bericht bij verplichte update (optioneel)</div>
            <input
              value={r.bericht || ''}
              onChange={e => zet(key, 'bericht', e.target.value)}
              placeholder="Standaard: Je gebruikt versie X. Om verder te gaan heb je versie Y nodig."
              style={VELD}
            />

            {waarschuwing && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginTop: 8 }}>
                Minimumversie is hoger dan wat in de winkel staat: klanten kunnen dan niet updaten en zitten vast.
              </div>
            )}

            <button
              onClick={() => bewaar(key)}
              disabled={bezig === key}
              style={{
                marginTop: 16, minHeight: 44, padding: '0 20px', borderRadius: 12, border: 'none',
                background: '#fff', color: '#0a0a0a', fontSize: 15, fontWeight: 800,
                fontFamily: 'inherit', cursor: 'pointer', opacity: bezig === key ? 0.6 : 1,
              }}
            >
              {bezig === key ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        )
      })}

      {melding && <div style={{ fontSize: 14, fontWeight: 700, color: melding.startsWith('Opslaan mislukt') ? '#ef4444' : '#22c55e' }}>{melding}</div>}

      <LiveUpdates db={db} />

      <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginTop: 24, lineHeight: 1.5 }}>
        De versie van een build komt uit het Xcode-project (MARKETING_VERSION) en build.gradle (versionName).
        Houd die twee gelijk bij een release, anders klopt de vergelijking op één platform niet.
      </div>
    </div>
  )
}

// Live updates: webcode die zonder App Store-release naar de app gaat
// (zie liveUpdate.js). Hier zie je wat er klaarstaat en zet je een bundel
// uit als hij niet goed is.
function LiveUpdates({ db }) {
  const [lijst, setLijst] = useState(null)
  const [bezig, setBezig] = useState(null)
  const laad = () => db.supabase.from('app_live_bundle')
    .select('id, version, min_native, notitie, actief, created_at')
    .order('version', { ascending: false }).limit(10)
    .then(({ data }) => setLijst(data || []), () => setLijst([]))
  useEffect(() => { laad() }, [db]) // eslint-disable-line react-hooks/exhaustive-deps

  const wissel = async (b) => {
    setBezig(b.id)
    await db.supabase.from('app_live_bundle').update({ actief: !b.actief }).eq('id', b.id).then(r => r, () => null)
    setBezig(null)
    laad()
  }
  const tijd = (iso) => { try { return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

  return (
    <div style={{ marginTop: 8, marginBottom: 24 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Live updates</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', lineHeight: 1.5, marginBottom: 12 }}>
        Nieuwe code die zonder App Store naar de app gaat. De app haalt de nieuwste actieve versie op en
        schakelt over als de klant de app wegklikt. Uploaden: <code style={{ color: '#fff' }}>npm run live-update -- "notitie"</code>.
      </div>
      {lijst === null ? (
        <div style={{ color: '#9ca3af', fontWeight: 700 }}>Laden…</div>
      ) : lijst.length === 0 ? (
        <div style={{ color: '#6b7280', fontWeight: 700 }}>Nog geen live updates.</div>
      ) : lijst.map((b, i) => (
        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: b.actief ? '#fff' : '#6b7280' }}>
              {tijd(b.created_at)}{i === 0 && b.actief ? ' · nieuwste' : ''}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginTop: 2 }}>
              {b.notitie || 'Geen notitie'} · app {b.min_native}+
            </div>
          </div>
          <button onClick={() => wissel(b)} disabled={bezig === b.id} style={{
            minHeight: 36, padding: '0 14px', borderRadius: 10, fontFamily: 'inherit', cursor: 'pointer',
            fontSize: 13, fontWeight: 800, opacity: bezig === b.id ? 0.5 : 1,
            background: b.actief ? 'transparent' : '#fff', color: b.actief ? '#ef4444' : '#0a0a0a',
            border: b.actief ? '1px solid rgba(239,68,68,0.5)' : 'none',
          }}>
            {b.actief ? 'Uitzetten' : 'Aanzetten'}
          </button>
        </div>
      ))}
    </div>
  )
}
