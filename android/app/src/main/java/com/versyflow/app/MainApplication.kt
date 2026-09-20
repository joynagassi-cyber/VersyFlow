package com.versyflow.app

import android.app.Application
import android.content.res.Configuration
import com.getcapacitor.BridgeApplication

class MainApplication : BridgeApplication() {

  override fun onCreate() {
    super.onCreate()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
  }
}
