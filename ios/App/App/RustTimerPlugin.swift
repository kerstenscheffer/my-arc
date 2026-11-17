// Rusttimer op het vergrendelscherm (17 nov 2026, Kersten): een Live Activity
// die zelf aftelt, ook met het scherm uit. De bel op nul komt los daarvan uit
// rustMelding.js (lokale melding met rustbel.wav).
//
// JS: src/modules/workout/components/todays-workout/rustLive.js
// Geregistreerd in MainViewController.swift.

import Foundation
import Capacitor
import ActivityKit

@objc(RustTimerPlugin)
public class RustTimerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RustTimerPlugin"
    public let jsName = "RustTimer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "toon", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
    ]

    @objc func toon(_ call: CAPPluginCall) {
        let eindMs = call.getDouble("eind") ?? 0
        let oefening = call.getString("oefening") ?? ""
        let pauze = call.getBool("pauze") ?? false
        let pauzeTekst = call.getString("pauzeTekst") ?? ""
        if #available(iOS 16.2, *) {
            let state = RustTimerAttributes.ContentState(
                eind: Date(timeIntervalSince1970: eindMs / 1000),
                gepauzeerd: pauze, pauzeTekst: pauzeTekst, oefening: oefening)
            Task { await RustActivity.toon(state); call.resolve() }
        } else {
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            Task { await RustActivity.stopAlles(); call.resolve() }
        } else {
            call.resolve()
        }
    }
}

@available(iOS 16.2, *)
enum RustActivity {
    // Na nul nog even "Rust voorbij" laten staan, net als de balk in de app.
    static let naijlen: TimeInterval = 5 * 60

    static func toon(_ state: RustTimerAttributes.ContentState) async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let stale = state.gepauzeerd ? nil : state.eind
        let content = ActivityContent(state: state, staleDate: stale)
        let lopend = Activity<RustTimerAttributes>.activities
        if let eerste = lopend.first {
            await eerste.update(content)
            for extra in lopend.dropFirst() { await extra.end(nil, dismissalPolicy: .immediate) }
        } else {
            _ = try? Activity.request(attributes: RustTimerAttributes(), content: content, pushType: nil)
        }
    }

    static func stopAlles() async {
        for a in Activity<RustTimerAttributes>.activities {
            await a.end(nil, dismissalPolicy: .immediate)
        }
    }
}
