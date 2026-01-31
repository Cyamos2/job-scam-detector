package com.anonymous.jobsdamdetector

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.common.LifecycleState
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        return PackageList(this).packages
      }

      override fun getJSMainModuleName(): String = "index"

      override val isDebug: Boolean
        get() = BuildConfig.DEBUG

      override val bundleAssetName: String
        get() = "index.bundle"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val enableMetroBundlerMetroOptions: Map<String, Any>
        get() = mapOf()
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(this, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, /* native exopackage */ false)
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost)
  }
}

