// Eigen bridge-scherm, alleen om app-eigen plugins te registreren
// (Main.storyboard verwijst hiernaar).

import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(RustTimerPlugin())
    }
}
