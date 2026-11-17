// src/modules/workout/utils/variatie.js
//
// Variaties binnen één oefening (17 nov 2026, Kersten): "Hack Squat (voeten
// hoog)" is dezelfde oefening in de bibliotheek, maar een eigen regel in het
// plan en een eigen logboek.
//
//  • exercise.basis    — de oefening in de bibliotheek ("Hack Squat")
//  • exercise.variatie — de uitvoering ("voeten hoog")
//  • exercise.name     — basis + variatie; daar hangen logs, records en
//                        "vorige keer" aan, zodat gewichten niet door elkaar lopen.
//
// Foto, video en uitleg zoek je altijd op bibNaam: er komt dus geen nieuwe
// oefening in de database bij.
export const bibNaam = (ex) => String(ex?.basis || ex?.name || '')
export const metVariatie = (basis, variatie) => {
  const b = String(basis || '').trim(), v = String(variatie || '').trim()
  return v ? `${b} (${v})` : b
}
