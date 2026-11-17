// Live Activity van de rusttimer: vergrendelscherm + Dynamic Island.
// De klok telt zelf af (Text(timerInterval:)), dus er hoeft niets te draaien.
// Na de eindtijd markeert iOS hem als 'stale' en staat er "Rust voorbij".

import ActivityKit
import SwiftUI
import WidgetKit

@main
struct RustTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        RustTimerLiveActivity()
    }
}

private let groen = Color(red: 16 / 255, green: 185 / 255, blue: 129 / 255)

struct RustKlok: View {
    let state: RustTimerAttributes.ContentState
    let voorbij: Bool
    var body: some View {
        if state.gepauzeerd {
            Text(state.pauzeTekst)
        } else if voorbij || state.eind <= Date() {
            Text("0:00").foregroundColor(groen)
        } else {
            Text(timerInterval: Date()...state.eind, countsDown: true)
        }
    }
}

struct RustTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RustTimerAttributes.self) { context in
            let voorbij = context.isStale && !context.state.gepauzeerd
            HStack(spacing: 14) {
                Image(systemName: voorbij ? "bell.fill" : (context.state.gepauzeerd ? "pause.fill" : "timer"))
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(voorbij ? groen : .white)
                VStack(alignment: .leading, spacing: 2) {
                    Text(voorbij ? "Rust voorbij" : (context.state.gepauzeerd ? "Rust gepauzeerd" : "Rust"))
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundColor(.white.opacity(0.6))
                    Text(context.state.oefening)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                Spacer()
                RustKlok(state: context.state, voorbij: voorbij)
                    .font(.system(size: 38, weight: .heavy).monospacedDigit())
                    .foregroundColor(.white)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 120, alignment: .trailing)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .activityBackgroundTint(.black)
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let voorbij = context.isStale && !context.state.gepauzeerd
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "timer").font(.title2).foregroundColor(.white)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    RustKlok(state: context.state, voorbij: voorbij)
                        .font(.system(size: 30, weight: .heavy).monospacedDigit())
                        .frame(maxWidth: 110, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.oefening).font(.subheadline.bold()).lineLimit(1)
                }
            } compactLeading: {
                Image(systemName: "timer").foregroundColor(voorbij ? groen : .white)
            } compactTrailing: {
                RustKlok(state: context.state, voorbij: voorbij)
                    .monospacedDigit()
                    .frame(maxWidth: 44)
            } minimal: {
                Image(systemName: "timer").foregroundColor(voorbij ? groen : .white)
            }
        }
    }
}
