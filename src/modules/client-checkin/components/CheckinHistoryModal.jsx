// src/modules/client-checkin/components/CheckinHistoryModal.jsx
//
// Je eigen check-ins teruglezen, vanaf de tracking-pagina.
//
// Tot nu toe verdween een check-in zodra je 'm verstuurde: alleen de coach zag
// hem terug. Juist de klant heeft er iets aan, want in de antwoorden van vier
// weken geleden staat vaak precies waar het nu weer misgaat.
//
// Twee schermen in één venster: de lijst met weken, en één week uitgeklapt.
// Geen aparte pagina, want je komt hier om iets na te kijken en daarna terug
// te gaan naar waar je was.

import { useEffect, useState } from 'react'
import { ChevronRight, ArrowLeft, MessageSquare } from 'lucide-react'
import { Venster, VensterKop, VensterVoet, Kopje, Knop } from '../../../components/arc-ui'
import { LIJN, LIJN_ZACHT } from '../../../components/arc-tokens'
import CheckinService from '../CheckinService'

// De cijfervragen uit het formulier, in dezelfde volgorde als je ze invulde.
// `van` maakt er een verhouding van (4 van 7); zonder `van` staat het getal
// alleen met zijn eenheid erachter.
const CIJFERS = [
  { id: 'training_gedaan', label: 'Trainingen', vanId: 'training_gepland' },
  { id: 'dagen_gewogen', label: 'Dagen gewogen', van: 7 },
  { id: 'dagen_voeding', label: 'Dagen op plan', van: 7 },
  { id: 'alcohol_aantal', label: 'Drankjes', eenheid: '' },
  { id: 'slaap_uren_gem', label: 'Slaap', eenheid: 'u' },
  { id: 'energie_score', label: 'Energie', van: 10 },
]

// De keuzevragen: korte antwoorden die als woord zijn opgeslagen.
const KEUZES = [
  { id: 'training_gelogd', label: 'Trainingen gelogd' },
  { id: 'training_falen', label: 'Sets tot falen' },
]

// De open vragen. Label is korter dan de vraag zelf: je weet wat je hebt
// ingevuld, je zoekt het antwoord.
const OPEN = [
  { id: 'hoe_gaat_het', label: 'Hoe het ging' },
  { id: 'struggles', label: 'Wat moeite kostte' },
  { id: 'vastgelopen', label: 'Waar je op vastliep' },
  { id: 'wins', label: 'Wat beter ging' },
  { id: 'komende_week', label: 'Komende week' },
  { id: 'coaching_fijnste', label: 'Fijnste aan de coaching' },
  { id: 'coaching_verbeterpunt', label: 'Wat beter kan' },
]

// Het oude formulier (versie 1) vroeg om cijfers per onderdeel plus notities.
// Die check-ins staan er nog en horen er gewoon bij.
const OUD_SCORES = [
  { id: 'voeding_score', label: 'Voeding' },
  { id: 'training_score', label: 'Training' },
  { id: 'slaap_score', label: 'Slaap' },
  { id: 'weekend_score', label: 'Weekend' },
]
const OUD_NOTITIES = [
  { id: 'voeding_notes', label: 'Voeding' },
  { id: 'training_notes', label: 'Training' },
  { id: 'slaap_notes', label: 'Slaap' },
  { id: 'weekend_notes', label: 'Weekend' },
]

const gevuld = (v) => v !== null && v !== undefined && String(v).trim() !== ''

const getal = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? String(Number(n.toFixed(1))) : String(v)
}

const datumLang = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

export default function CheckinHistoryModal({ db, client, isMobile = false, onClose }) {
  const [rijen, setRijen] = useState(null)   // null = nog aan het laden
  const [fout, setFout] = useState(null)
  const [open, setOpen] = useState(null)     // de check-in die uitgeklapt staat

  useEffect(() => {
    let weg = false
    const laad = async () => {
      try {
        const service = new CheckinService(db)
        const data = await service.getClientCheckins(client?.id, 52)
        if (!weg) setRijen(data || [])
      } catch (e) {
        console.error('Check-ins laden mislukt:', e)
        if (!weg) { setFout(e.message || 'Laden mislukt'); setRijen([]) }
      }
    }
    if (client?.id) laad(); else setRijen([])
    return () => { weg = true }
  }, [db, client?.id])

  const titel = open ? datumLang(open.checkin_date) : 'Jouw check-ins'
  const sub = open
    ? 'Wat je die week hebt ingevuld'
    : rijen?.length
      ? `${rijen.length} ${rijen.length === 1 ? 'check-in' : 'check-ins'} bewaard`
      : null

  return (
    <Venster isMobile={isMobile} onClose={onClose} maxWidth={460}>
      <VensterKop isMobile={isMobile} titel={titel} sub={sub} onClose={onClose} />

      <div style={{ padding: isMobile ? '1rem' : '1.15rem', overflowY: 'auto' }}>
        {rijen === null && <Melding tekst="Laden…" />}
        {rijen !== null && fout && <Melding tekst={`Kon je check-ins niet laden: ${fout}`} />}
        {rijen !== null && !fout && rijen.length === 0 && (
          <Melding tekst="Je hebt nog geen check-in ingevuld. Zodra je er een instuurt, staat hij hier." />
        )}

        {!open && rijen?.map((r, i) => (
          <Rij key={r.id} rij={r} eerste={i === 0} onClick={() => setOpen(r)} />
        ))}

        {open && <Detail rij={open} />}
      </div>

      <VensterVoet isMobile={isMobile}>
        {open
          ? (
            <>
              <Knop soort="stil" breedte={44} titel="Terug naar de lijst" onClick={() => setOpen(null)}>
                <ArrowLeft size={15} />
              </Knop>
              <Knop soort="primair" flex={1} onClick={onClose}>Klaar</Knop>
            </>
          )
          : <Knop soort="primair" flex={1} onClick={onClose}>Sluiten</Knop>}
      </VensterVoet>
    </Venster>
  )
}

function Melding({ tekst }) {
  return (
    <div style={{
      fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
      lineHeight: 1.5, padding: '0.5rem 0',
    }}>
      {tekst}
    </div>
  )
}

// Eén week in de lijst: datum links, de twee cijfers waar je op stuurt in het
// midden, chevron rechts. Rijen met een scheidingslijn, geen kaartjes.
function Rij({ rij, eerste, onClick }) {
  const trainingen = gevuld(rij.training_gedaan) && gevuld(rij.training_gepland)
    ? `${rij.training_gedaan}/${rij.training_gepland} training`
    : null
  const energie = gevuld(rij.energie_score) ? `energie ${getal(rij.energie_score)}` : null
  const samen = [trainingen, energie].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '0.7rem 0', textAlign: 'left',
        background: 'transparent', border: 'none',
        borderTop: eerste ? 'none' : `1px solid ${LIJN_ZACHT}`,
        cursor: 'pointer', fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.015em',
        }}>
          {datumLang(rij.checkin_date)}
        </span>
        {samen && (
          <span style={{
            display: 'block', fontSize: '0.66rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.35)', marginTop: 2,
          }}>
            {samen}
          </span>
        )}
      </span>
      <ChevronRight size={15} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
    </button>
  )
}

function Detail({ rij }) {
  const cijfers = CIJFERS
    .map(c => {
      if (!gevuld(rij[c.id])) return null
      const van = c.vanId ? rij[c.vanId] : c.van
      return {
        label: c.label,
        waarde: getal(rij[c.id]),
        achter: gevuld(van) ? `van ${van}` : (c.eenheid ?? ''),
      }
    })
    .filter(Boolean)

  const keuzes = KEUZES.filter(k => gevuld(rij[k.id]))
  const open = OPEN.filter(o => gevuld(rij[o.id]))
  const oudeScores = OUD_SCORES.filter(s => gevuld(rij[s.id]))
  const oudeNotities = OUD_NOTITIES.filter(n => gevuld(rij[n.id]))

  return (
    <>
      {cijfers.length > 0 && (
        <>
          <Kopje tekst="Je week in cijfers" />
          <div style={{ marginBottom: '1.1rem' }}>
            {cijfers.map((c, i) => (
              <Waardenrij key={c.label} label={c.label} eerste={i === 0}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {c.waarde}
                </span>
                {c.achter && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginLeft: 3 }}>
                    {c.achter}
                  </span>
                )}
              </Waardenrij>
            ))}
          </div>
        </>
      )}

      {oudeScores.length > 0 && (
        <>
          <Kopje tekst="Cijfers per onderdeel" />
          <div style={{ marginBottom: '1.1rem' }}>
            {oudeScores.map((s, i) => (
              <Waardenrij key={s.id} label={s.label} eerste={i === 0}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>{getal(rij[s.id])}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginLeft: 3 }}>van 10</span>
              </Waardenrij>
            ))}
          </div>
        </>
      )}

      {keuzes.length > 0 && (
        <>
          <Kopje tekst="Hoe je trainde" />
          <div style={{ marginBottom: '1.1rem' }}>
            {keuzes.map((k, i) => (
              <Waardenrij key={k.id} label={k.label} eerste={i === 0}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>{rij[k.id]}</span>
              </Waardenrij>
            ))}
          </div>
        </>
      )}

      {open.map(o => (
        <Tekstblok key={o.id} label={o.label} tekst={rij[o.id]} />
      ))}

      {oudeNotities.map(n => (
        <Tekstblok key={n.id} label={`Notitie ${n.label.toLowerCase()}`} tekst={rij[n.id]} />
      ))}

      {/* Wat de coach terugschreef. coach_notes blijft hier bewust buiten:
          dat is het kladblok van de coach, niet een bericht aan jou. */}
      {gevuld(rij.coach_message) && (
        <div style={{
          marginTop: '0.4rem', padding: '0.7rem 0.8rem', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
        }}>
          <Kopje tekst="Reactie van je coach" Icon={MessageSquare} />
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {rij.coach_message}
          </div>
        </div>
      )}
    </>
  )
}

function Waardenrij({ label, eerste, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0.5rem 0',
      borderTop: eerste ? 'none' : `1px solid ${LIJN_ZACHT}`,
    }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
      <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'baseline' }}>{children}</span>
    </div>
  )
}

function Tekstblok({ label, tekst }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <Kopje tekst={label} />
      <div style={{
        fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.5, whiteSpace: 'pre-wrap',
      }}>
        {tekst}
      </div>
    </div>
  )
}
