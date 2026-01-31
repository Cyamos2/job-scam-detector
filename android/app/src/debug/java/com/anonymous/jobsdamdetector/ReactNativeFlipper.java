/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.anonymous.jobsdamdetector;

import android.content.Context;
import com.facebook.flipper.android.AndroidFlipperClient;
import com.facebook.flipper.android.utils.FlipperUtils;
import com.facebook.flipper.crashreporter.CrashReporterPlugin;
import com.facebook.flipper.databases.sqlite.FlipperSquareDatabase;
import com.facebook.flipper.databases.sqlite.SqliteDatabaseProvider;
import com.facebook.flipper.plugins.crashreporter.CrashReporterPlugin;
import com.facebook.flipper.plugins.databases.DatabasesFlipperPlugin;
import com.facebook.flipper.plugins.fresco.FrescoFlipperPlugin;
import com.facebook.flipper.plugins.inspector.DescriptorMapping;
import com.facebook.flipper.plugins.inspector.InspectorFlipperPlugin;
import com.facebook.flipper.plugins.network.FlipperOkhttpInterceptor;
import com.facebook.flipper.plugins.network.NetworkFlipperPlugin;
import com.facebook.flipper.plugins.sharedpreferences.SharedPreferencesFlipperPlugin;
import com.facebook.react.ReactInstanceEventListener;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.soloader.SoLoader;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

/**
 * Class responsible of loading Flipper inside your React Native application.
 * This is the debug flavour of it.
 * Here you can add your own plugins and customize the Flipper setup.
 */
public class ReactNativeFlipper {
  public static void initializeFlipper(Context context, ReactNativeHost reactNativeHost) {
    if (FlipperUtils.shouldEnableFlipper(context)) {
      final FlipperClient client = AndroidFlipperClient.getInstance(context);

      // Network plugin
      NetworkFlipperPlugin networkFlipperPlugin = new NetworkFlipperPlugin();
      client.addPlugin(networkFlipperPlugin);
      // Okhttp client interceptor for network events
      OkHttpClient client1 = new OkHttpClient.Builder()
        .addNetworkInterceptor(new FlipperOkhttpInterceptor(networkFlipperPlugin))
        .build();
      // Databases plugin
      client.addPlugin(
        new DatabasesFlipperPlugin(
          new SqliteDatabaseProvider(
            new FlipperSquareDatabase(
              context.getApplicationContext(),
              "react-native-debug-db",
              "1.0"
            )
          )
        )
      );

      // SharedPreferences plugin
      client.addPlugin(new SharedPreferencesFlipperPlugin(context));

      // Inspector plugin
      client.addPlugin(
        new InspectorFlipperPlugin(
          context,
          DescriptorMapping.withSyncedStateForLegacyDescriptor()
        )
      );

      // Fresco plugin
      client.addPlugin(new FrescoFlipperPlugin());

      // CrashReporter plugin
      client.addPlugin(new CrashReporterPlugin());

      // Flipper client start
      client.start();

      // We're initializing Flipper after React Native loads
      // https://github.com/facebook/flipper/issues/834
      SoLoader.init(context, /* native exopackage */ false);

      reactNativeHost.getReactInstanceManager().addReactInstanceEventListener(
        new ReactInstanceEventListener() {
          @Override
          public void onReactContextInitialized(ReactApplicationContext reactContext) {
            // Now that we have the React context, we can initialize Flipper
            ReactNativeFlipper.initializeFlipper(reactContext, reactNativeHost);
          }
        });

      ReactMarker.addBuildMarkerListener(
        new ReactMarker.ReactMarkerListener() {
          @Override
          public void logMarker(ReactMarkerConstants name, String tag, int instanceKey) {
            if (name == ReactMarkerConstants.BUILD_JS_BUNDLE_START || name == ReactMarkerConstants.BUILD_JS_BUNDLE_FINISHED || name == ReactMarkerConstants.ANALYZE_BUNDLE_START || name == ReactMarkerConstants.ANALYZE_BUNDLE_FINISHED) {
              // JS bundle loading is not a flipper event, but we want to show that the app is not frozen.
              // For this reason we report here, since those are the last markers we receive before the JS execution resumes
              if (FlipperUtils.shouldEnableFlipper(context)) {
                client.getPluginByClass(NetworkFlipperPlugin.class).ifPresent(networkFlipperPlugin -> {
                  if (name == ReactMarkerConstants.BUILD_JS_BUNDLE_START) {
                    networkFlipperPlugin.getInterceptor().reportMessage("RName: " + name + " tag: " + tag + " instanceKey: " + instanceKey, false);
                  } else if (name == ReactMarkerConstants.BUILD_JS_BUNDLE_FINISHED || name == ReactMarkerConstants.ANALYZE_BUNDLE_FINISHED) {
                    networkFlipperPlugin.getInterceptor().reportMessage("RName: " + name + " tag: " + tag + " instanceKey: " + instanceKey, true);
                  }
                });
              }
            }
          }
        });
    }
  }
}

