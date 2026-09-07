# Bug Class: CWE-94 (Code Injection via Evaluated Content Scripts)

## Description
Code injection occurs when dynamically constructed scripts or code templates incorporate untrusted input without strict data-encoding or serialization. In Private Browser Pro, both the Electron desktop application and the Android companion app synthesize JavaScript content scripts (`stealth.js`) on the fly to spoof browser fingerprint parameters. Because these scripts execute in the browser's `MAIN` execution world with full page script privileges, improper interpolation could allow arbitrary JavaScript execution or syntax disruption.

## Primary Threat Vectors in Private Browser Pro
1. **Unescaped String Interpolation in Script Templates:** If attributes such as `profile.name`, `profile.userAgent`, or `webglRenderer` are injected into JavaScript templates via string concatenation instead of JSON encoding, characters like quotes, backticks, or closing script tags (`</script>`) can break out of string literals.
2. **Prototype Pollution via Injected Configs:** Injected configuration dictionaries must not expose mutable prototype chains that could be manipulated by third-party web page scripts to tamper with extension logic.

## Relevant Code Areas & Components
- **[Fingerprint Engine](../entities/fingerprint_stealth.md):** Generates `stealth.js` in `main.js:buildStealthScript`.
- **[Android Subsystem](../entities/android_subsystem.md):** Generates WebView injection scripts in `StealthScriptBuilder.kt`.
- **[Main Process](../entities/main_process.md):** Writes dynamic extensions into `<sessionDir>/stealth-ext/`.

## Anti-Pattern Example (What NOT To Do)
```javascript
// DANGEROUS: Direct template string interpolation of user-supplied fields
function buildBadStealthScript(profile) {
  return `
    const userAgent = "${profile.userAgent}";
    const gpuName = "${profile.gpuName}";
    // If profile.gpuName is: "; alert(document.domain); //
  `;
}
```

```kotlin
// DANGEROUS: Kotlin raw string interpolation without JSON escaping
val script = """
    const ua = "${profile.userAgent}";
    // Broken if userAgent contains quotation marks or newline escapes
"""
```

## Defensive Architecture & Mitigations in Codebase
1. **JSON Object Serialization:** Profile specifications are compiled into a formal JSON object and serialized via `JSON.stringify(config)` (in Node.js) or `JSONObject().put(...)` (in Android Kotlin):
   ```javascript
   const configJson = JSON.stringify(safeConfig);
   const script = `(function() { const cfg = ${configJson}; ... })();`;
   ```
2. **Closure Encapsulation:** Stealth scripts are wrapped in Immediately Invoked Function Expressions (IIFE) with strict scoping (`'use strict'`), preventing leaked global variables.
3. **Hardened Native Function Hooks:** Hooked functions use closure variables and `WeakMap` registries to avoid leaving accessible global properties that malicious page scripts could overwrite.
