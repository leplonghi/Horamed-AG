import Foundation
import Capacitor

/**
 * iOS implementation of AndroidPermissions plugin
 * This plugin is Android-only, so iOS implementation is a no-op
 */
@objc(AndroidPermissionsPlugin)
public class AndroidPermissionsPlugin: CAPPlugin {
    
    @objc func checkExactAlarmPermission(_ call: CAPPluginCall) {
        call.resolve(["granted": true])
    }
    
    @objc func requestExactAlarmPermission(_ call: CAPPluginCall) {
        call.resolve()
    }
    
    @objc func checkBatteryOptimization(_ call: CAPPluginCall) {
        call.resolve(["optimized": false])
    }
    
    @objc func requestIgnoreBatteryOptimization(_ call: CAPPluginCall) {
        call.resolve()
    }
    
    @objc func getDeviceInfo(_ call: CAPPluginCall) {
        call.resolve([
            "manufacturer": "Apple",
            "model": UIDevice.current.model,
            "androidVersion": 0,
            "sdkInt": 0
        ])
    }
    
    @objc func isDeviceIdleMode(_ call: CAPPluginCall) {
        call.resolve(["idle": false])
    }
    
    @objc func openAppSettings(_ call: CAPPluginCall) {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            DispatchQueue.main.async {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
        }
        call.resolve()
    }
}
