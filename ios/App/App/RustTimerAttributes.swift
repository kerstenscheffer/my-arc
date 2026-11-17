// Gedeeld tussen de app en de widget-extensie RustTimerWidget: de vorm van de
// Live Activity van de rusttimer. Velden alleen toevoegen, nooit hernoemen —
// een lopende activity van een oudere build moet nog te lezen zijn.

import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct RustTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var eind: Date          // wanneer de rust om is
        var gepauzeerd: Bool
        var pauzeTekst: String  // "1:20" als hij gepauzeerd staat
        var oefening: String
    }
}
