// Statusregel bovenaan het logboek (24 nov 2026, Kersten): de geldende stand
// van de klant in één regel, dik wit, met de datum erachter. Daaronder een
// veld voor een nieuwe regel. Bewaren = een nieuwe 'status'-rij in het logboek
// (statusRegel.js); de oude blijft als historie in de tijdlijn staan.
//
// Voorstel van Gino: staat er in de voorbereiding een regel 'Stand: …' die
// nieuwer is dan de geldende stand, dan staat die voorgevuld in het veld. Er
// wordt niets vanzelf opgeslagen: Kersten past aan en bewaart.
import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { colors } from '../../../ui/tokens'
import { laadStatusRegel, schrijfStatusRegel, MAX_STATUS } from '../statusRegel'

const nlDag = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
const datumKort = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
}

// klaar: de voorbereiding is geladen (pas dan weten we of er een voorstel is).
// voorstelDag: ronde_datum (YYYY-MM-DD) van de voorbereiding met het voorstel.
export default function StatusRegelBalk({ client, db, coachId, status, klaar = true, voorstel = '', voorstelDag = '', onBewaard }) {
  const [huidig, setHuidig] = useState(undefined) // undefined = laden, null = nog geen
  const [tekst, setTekst] = useState('')
  const [aangeraakt, setAangeraakt] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(false)

  useEffect(() => {
    let weg = false
    laadStatusRegel(db.supabase, client.id).then(r => { if (!weg) setHuidig(r) })
    return () => { weg = true }
  }, [client.id, db])

  // Voorinvullen, alleen zolang Kersten het veld niet zelf aanraakte en het
  // voorstel van ná de geldende stand is (anders is het al verwerkt).
  useEffect(() => {
    if (huidig === undefined || !klaar || aangeraakt || !voorstel) return
    const nieuwer = !huidig || !voorstelDag || nlDag(huidig.datum) < voorstelDag
    if (nieuwer && voorstel !== huidig?.tekst) setTekst(voorstel)
  }, [huidig, klaar, aangeraakt, voorstel, voorstelDag])

  const schoon = tekst.replace(/\s+/g, ' ').trim()
  const kan = !!schoon && schoon !== huidig?.tekst && !bezig
  const isVoorstel = !aangeraakt && !!schoon && schoon === voorstel

  const bewaar = async () => {
    if (!kan) return
    setBezig(true); setFout(false)
    try {
      const rij = await schrijfStatusRegel(db.supabase, { clientId: client.id, coachId, status, tekst: schoon })
      setHuidig({ id: rij.id, clientId: rij.client_id, tekst: rij.note, datum: rij.created_at })
      setTekst(''); setAangeraakt(true)
      onBewaard?.(rij)
    } catch (e) {
      console.error('Statusregel opslaan mislukt:', e)
      setFout(true)
    }
    setBezig(false)
  }

  return (
    <div style={{ padding: '0.7rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
      {huidig?.tekst && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ minWidth: 0, fontSize: '0.98rem', fontWeight: 900, color: '#fff', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
            {huidig.tekst}
          </span>
          <span style={{ flexShrink: 0, fontSize: '0.82rem', fontWeight: 900, color: colors.success, whiteSpace: 'nowrap' }}>
            {datumKort(huidig.datum)}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isVoorstel && (
          <span style={{ flexShrink: 0, fontSize: '0.82rem', fontWeight: 900, color: colors.success }}>Voorstel</span>
        )}
        <input value={tekst} maxLength={MAX_STATUS}
          onChange={e => { setTekst(e.target.value); setAangeraakt(true); setFout(false) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); bewaar() } }}
          placeholder={huidig?.tekst ? 'Nieuwe stand' : 'Stand in 1 regel'}
          aria-label="Statusregel"
          style={{
            flex: 1, minWidth: 0, height: 40, boxSizing: 'border-box', padding: '0 0.7rem', borderRadius: 10, outline: 'none',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${schoon ? `${colors.success}99` : 'rgba(255,255,255,0.14)'}`,
            color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 800,
          }} />
        <button type="button" onClick={bewaar} disabled={!kan} title="Bewaren" aria-label="Statusregel bewaren"
          style={{
            width: 40, height: 40, flexShrink: 0, padding: 0, borderRadius: '50%', border: 'none',
            background: kan ? colors.success : 'rgba(255,255,255,0.08)', color: kan ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: kan ? 'pointer' : 'default',
            opacity: bezig ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
          <Check size={18} strokeWidth={3.2} />
        </button>
      </div>
      {fout && <div style={{ marginTop: 6, fontSize: '0.85rem', fontWeight: 900, color: colors.danger }}>Opslaan mislukt</div>}
    </div>
  )
}
