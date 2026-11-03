// scripts/gino-waakhond.mjs (3 nov 2026)
//
// Herkent of Gino vastzit. Kersten: "hij mag nog geen minuut vastlopen".
//
// Vast = geen teken van Claude (ook geen denkwerk: --include-partial-messages) én
// geen rekenwerk in wat Claude startte. Een montage of build zwijgt soms minuten,
// maar rekent wel; dat telt dus niet als vast. Een hangende download of `sleep` wel.
//
// Na 60 s: melden, niet stoppen. Lang denkwerk kan er hetzelfde uitzien, en een
// halve opdracht afbreken kost meer dan een melding. Komt er weer activiteit, dan
// trekt hij de melding in. Na stopMs (3 min): stoppen.
// Wachten op een toestemmingskaart telt niet mee (pauze/verder).

import { execFile } from 'node:child_process'

const seconden = (t) => t.trim().split(':').reduce((som, d) => som * 60 + Number(d), 0)

// Totale cpu-tijd (s) van alle processen onder pid, zonder pid zelf. null = meten lukte niet.
export function cpuOnder(pid) {
  return new Promise((klaar) => {
    execFile('ps', ['-A', '-o', 'pid=,ppid=,time='], { maxBuffer: 1 << 22 }, (fout, uit) => {
      if (fout) return klaar(null)
      const kinderen = new Map(), cpu = new Map()
      for (const regel of uit.split('\n')) {
        const m = regel.trim().match(/^(\d+)\s+(\d+)\s+([\d:.]+)$/)
        if (!m) continue
        const p = Number(m[1]), ouder = Number(m[2])
        cpu.set(p, seconden(m[3]))
        if (!kinderen.has(ouder)) kinderen.set(ouder, [])
        kinderen.get(ouder).push(p)
      }
      let som = 0
      const rij = [...(kinderen.get(pid) || [])]
      while (rij.length) {
        const p = rij.pop()
        som += cpu.get(p) || 0
        rij.push(...(kinderen.get(p) || []))
      }
      klaar(som)
    })
  })
}

// Zelfde vorm als maakKlok in business-os-pa.mjs: pauze, verder, stop, opnieuw.
export function maakStilteKlok({ pid, opMeld, opHersteld, opVast, meldMs = 60000, stopMs = 180000, tikMs = 15000, cpuDrempel = 0.3 }) {
  let teken = Date.now(), gepauzeerd = false, uit = false, gemeld = false, vorigeCpu = null, bezigMeten = false
  const tik = async () => {
    if (uit || gepauzeerd || bezigMeten) return
    bezigMeten = true
    const cpu = await cpuOnder(pid())
    bezigMeten = false
    if (uit || gepauzeerd) return
    if (cpu !== null && vorigeCpu !== null && cpu - vorigeCpu >= cpuDrempel) activiteit()
    if (cpu !== null) vorigeCpu = cpu
    const stil = Date.now() - teken
    if (stil >= stopMs) { uit = true; clearInterval(t); opVast(stil); return }
    if (stil >= meldMs && !gemeld) { gemeld = true; opMeld(stil) }
  }
  const activiteit = () => {
    teken = Date.now()
    if (gemeld) { gemeld = false; opHersteld() }
  }
  const t = setInterval(tik, tikMs)
  return {
    pauze() { gepauzeerd = true },
    verder() { gepauzeerd = false; activiteit() },
    stop() { uit = true; clearInterval(t) },
    opnieuw() { if (!uit) activiteit() },
  }
}
