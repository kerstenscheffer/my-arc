// src/client/components/dagNavigatie.js
// Een dag vooruit of terug, met de week die meeschuift zodra je voorbij zondag
// of vóór maandag komt. Apart bestand omdat de begroeting op home en de
// dagagenda dezelfde dag tonen: de pijltjes staan bij de een, het rooster bij
// de ander, en ze moeten het over dezelfde dag hebben.

import { DAYS, getMondayOf } from '../../modules/client-agenda/ClientAgendaService'

export const dagSleutelVan = (d) => DAYS[(d.getDay() + 6) % 7]

export const vandaagStand = () => ({
  weekAnker: getMondayOf(new Date()),
  dag: dagSleutelVan(new Date()),
})

export function verzetDag({ dag, weekAnker }, richting) {
  const i = DAYS.indexOf(dag)
  const n = i + richting
  if (n < 0) {
    const vorige = new Date(weekAnker); vorige.setDate(vorige.getDate() - 7)
    return { weekAnker: vorige, dag: DAYS[DAYS.length - 1] }
  }
  if (n > DAYS.length - 1) {
    const volgende = new Date(weekAnker); volgende.setDate(volgende.getDate() + 7)
    return { weekAnker: volgende, dag: DAYS[0] }
  }
  return { weekAnker, dag: DAYS[n] }
}
