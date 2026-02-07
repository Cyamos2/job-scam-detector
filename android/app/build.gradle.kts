plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

apply(plugin = "com.facebook.react")

android {
  namespace = "com.anonymous.jobsdamdetector"
  compileSdk = 34

  defaultConfig {
    applicationId = "com.anonymous.jobsdamdetector"
    minSdk = 24
    targetSdk = 34
    versionCode = 1
    versionName = "1.0.0"

    buildConfigField("boolean", "IS_NEW_ARCHITECTURE_ENABLED", "false")
  }

  buildTypes {
    debug {
      isMinifyEnabled = true
      isDebuggable = true
    }
    release {
      isMinifyEnabled = true
      isShrinkResources = true
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }

  buildFeatures {
    buildConfig = true
  }

  packaging {
    resources {
      excludes += "/res/?values"
      excludes += "/res/values/strings.xml"
    }
  }

  lint {
    abortOnError = false
    checkReleaseBuilds = true
    warningsAsErrors = false
  }
}

dependencies {
  // AndroidX
  implementation("androidx.core:core-ktx:1.12.0")
  implementation("androidx.appcompat:appcompat:1.6.1")
  implementation("androidx.activity:activity:1.8.2")
  implementation("androidx.fragment:fragment:1.6.2")
  implementation("androidx.constraintlayout:constraintlayout:2.1.4")
  implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")

  // Splash Screen
  implementation("androidx.core:core-splashscreen:1.0.1")

  // React Native
  implementation("com.facebook.react:react-android:0.73.2")
  implementation("com.facebook.react:hermes-android:0.73.2")

  // Flipper
  debugImplementation("com.facebook.flipper:flipper-android:0.201.0")
  debugImplementation("com.facebook.flipper:flipper-react-native:0.201.0")
  debugImplementation("com.facebook.soloader:soloader:0.10.5")

  // Testing
  testImplementation("junit:junit:4.13.2")
  androidTestImplementation("androidx.test.ext:junit:1.1.5")
  androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}

