# Entity: Android Mobile Subsystem (`app/`)

## Classification
- **Criticality:** `STANDARD`
- **Availability Requirements:** Standard mobile lifecycle; handles Android Activity pauses, resumes, and SQLite Room DB transactions.
- **Trust Level:** Medium (Runs in native Android application sandbox).

## Architectural Role & Responsibilities
The Android Subsystem provides a mobile-native implementation of Private Browser Pro, leveraging Android system components and AndroidX WebKit extensions.
- **Data Persistence:** Uses Room ORM (`AppDatabase.kt`, `ProfileDao.kt`, `Profile.kt`) to store profile specifications, network credentials, and spoofing parameters in an SQLite database.
- **Proxy Controller & Testing:** Uses `ProxyTester.kt` to assess proxy latency via `HttpsURLConnection` and applies system-level proxy configurations to Android `WebView` via `androidx.webkit.ProxyController.getInstance().setProxyOverride()`.
- **Mobile Stealth Script Builder:** `StealthScriptBuilder.kt` compiles a Kotlin-templated JavaScript payload that overrides `navigator`, `Screen`, `WebGL`, and canvas properties within the Android WebView environment.

## Interfaces
- **SQLite Room DAO:** Provides asynchronous CRUD queries via Kotlin coroutines and Flow.
- **AndroidX WebKit API:** Interfaces with underlying Chromium WebView engine via `ProxyController`.
- **Network Interface:** Dispatches HTTP/HTTPS requests through `java.net.Proxy` over mobile cellular and Wi-Fi interfaces.

## Known Constraints & Sanitization
- `usesCleartextTraffic="true"` declared in `AndroidManifest.xml` to allow connecting to unencrypted local or remote HTTP proxies.
- `ProxyController` overrides apply application-wide across all WebViews within the application process.

## Associated Vulnerability Classes
- **[CWE-319: Cleartext Transmission of Sensitive Information](../vulnerabilities/CWE-319_Cleartext-Transmission.md)**
- **[CWE-94: Code Injection via Evaluated Content Scripts](../vulnerabilities/CWE-94_Code-Injection.md)**
- **[CWE-200: Information Exposure (DNS & IP Leakage)](../vulnerabilities/CWE-200_Information-Exposure.md)**
