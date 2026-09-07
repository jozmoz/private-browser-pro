package com.jozmoz.privatebrowser.stealth

import com.jozmoz.privatebrowser.data.Profile
import org.json.JSONArray
import org.json.JSONObject

object StealthScriptBuilder {

    fun build(profile: Profile): String {
        val platform = when (profile.os.lowercase()) {
            "mac" -> "MacIntel"
            "linux" -> "Linux x86_64"
            "android" -> "Linux armv8l"
            else -> "Win32"
        }

        val ua = if (profile.userAgent.isNotBlank()) {
            profile.userAgent
        } else {
            when (profile.os.lowercase()) {
                "mac" -> "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                "linux" -> "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                "android" -> "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
                else -> "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
            }
        }

        val resParts = profile.resolution.split("x", "X")
        val screenWidth = resParts.getOrNull(0)?.toIntOrNull() ?: 1920
        val screenHeight = resParts.getOrNull(1)?.toIntOrNull() ?: 1080

        val languagesJson = JSONArray().apply {
            put(profile.language)
            val baseLang = profile.language.split("-")[0]
            if (baseLang != profile.language) {
                put(baseLang)
            }
            if (baseLang != "en") {
                put("en-US")
                put("en")
            }
        }

        val config = JSONObject().apply {
            put("hardwareConcurrency", profile.hardwareConcurrency)
            put("deviceMemory", profile.deviceMemory)
            put("platform", platform)
            put("userAgent", ua)
            put("languages", languagesJson)
            put("screenWidth", screenWidth)
            put("screenHeight", screenHeight)
            put("canvasNoise", profile.canvasNoise)
            put("audioNoise", profile.audioNoise)
            put("webglNoise", profile.webglNoise)
            put("webglVendor", profile.webglVendor)
            put("webglRenderer", profile.webglRenderer)
            put("webrtcProtection", profile.webrtcProtection)
            put("timezone", profile.timezone)
        }

        return """
            (function() {
                const cfg = ${config};

                // 1. Native Function Masking
                const nativeToString = Function.prototype.toString;
                const hookedFns = new WeakMap();
                function makeNative(fn, name) {
                    hookedFns.set(fn, name || fn.name || '');
                    return fn;
                }
                Function.prototype.toString = function() {
                    if (hookedFns.has(this)) {
                        return 'function ' + hookedFns.get(this) + '() { [native code] }';
                    }
                    return nativeToString.call(this);
                };
                makeNative(Function.prototype.toString, 'toString');

                // 2. Navigator Overrides
                try {
                    const nav = Navigator.prototype;

                    Object.defineProperty(nav, 'userAgent', {
                        get: makeNative(function userAgent() { return cfg.userAgent; }, 'get userAgent'),
                        configurable: true, enumerable: true
                    });

                    Object.defineProperty(nav, 'platform', {
                        get: makeNative(function platform() { return cfg.platform; }, 'get platform'),
                        configurable: true, enumerable: true
                    });

                    Object.defineProperty(nav, 'hardwareConcurrency', {
                        get: makeNative(function hardwareConcurrency() { return cfg.hardwareConcurrency; }, 'get hardwareConcurrency'),
                        configurable: true, enumerable: true
                    });

                    Object.defineProperty(nav, 'deviceMemory', {
                        get: makeNative(function deviceMemory() { return cfg.deviceMemory; }, 'get deviceMemory'),
                        configurable: true, enumerable: true
                    });

                    Object.defineProperty(nav, 'languages', {
                        get: makeNative(function languages() { return cfg.languages; }, 'get languages'),
                        configurable: true, enumerable: true
                    });

                    Object.defineProperty(nav, 'webdriver', {
                        get: makeNative(function webdriver() { return undefined; }, 'get webdriver'),
                        configurable: true, enumerable: true
                    });
                } catch(e) {}

                // 3. Client Hints (navigator.userAgentData)
                try {
                    const uad = {
                        brands: [
                            { brand: 'Chromium', version: '130' },
                            { brand: 'Google Chrome', version: '130' },
                            { brand: 'Not?A_Brand', version: '24' }
                        ],
                        mobile: cfg.platform.includes('arm') || cfg.platform.includes('Android'),
                        platform: cfg.platform.includes('Win') ? 'Windows' : (cfg.platform.includes('Mac') ? 'macOS' : 'Linux'),
                        getHighEntropyValues: makeNative(function getHighEntropyValues() {
                            return Promise.resolve({
                                architecture: 'x86',
                                bitness: '64',
                                brands: uad.brands,
                                mobile: uad.mobile,
                                platform: uad.platform
                            });
                        }, 'getHighEntropyValues')
                    };
                    Object.defineProperty(Navigator.prototype, 'userAgentData', {
                        get: makeNative(function userAgentData() { return uad; }, 'get userAgentData'),
                        configurable: true, enumerable: true
                    });
                } catch(e) {}

                // 4. Screen Resolution
                try {
                    const scr = Screen.prototype;
                    Object.defineProperty(scr, 'width', { get: makeNative(function width() { return cfg.screenWidth; }, 'get width') });
                    Object.defineProperty(scr, 'height', { get: makeNative(function height() { return cfg.screenHeight; }, 'get height') });
                    Object.defineProperty(scr, 'availWidth', { get: makeNative(function availWidth() { return cfg.screenWidth; }, 'get availWidth') });
                    Object.defineProperty(scr, 'availHeight', { get: makeNative(function availHeight() { return cfg.screenHeight - 40; }, 'get availHeight') });
                } catch(e) {}

                // 5. WebGL Vendor & Renderer Spoofing
                try {
                    function hookContext(proto) {
                        if (!proto) return;
                        const origGetParameter = proto.getParameter;
                        proto.getParameter = makeNative(function getParameter(param) {
                            if (param === 0x9245) return cfg.webglVendor; // UNMASKED_VENDOR_WEBGL
                            if (param === 0x9246) return cfg.webglRenderer; // UNMASKED_RENDERER_WEBGL
                            return origGetParameter.apply(this, arguments);
                        }, 'getParameter');
                    }
                    if (typeof WebGLRenderingContext !== 'undefined') hookContext(WebGLRenderingContext.prototype);
                    if (typeof WebGL2RenderingContext !== 'undefined') hookContext(WebGL2RenderingContext.prototype);
                } catch(e) {}

                // 6. Canvas Noise Protection
                if (cfg.canvasNoise) {
                    try {
                        const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
                        HTMLCanvasElement.prototype.toDataURL = makeNative(function toDataURL() {
                            const ctx = this.getContext('2d');
                            if (ctx && this.width > 0 && this.height > 0) {
                                try {
                                    const imgData = ctx.getImageData(0, 0, 1, 1);
                                    imgData.data[0] = (imgData.data[0] + 1) % 256;
                                    ctx.putImageData(imgData, 0, 0);
                                } catch(e) {}
                            }
                            return origToDataURL.apply(this, arguments);
                        }, 'toDataURL');
                    } catch(e) {}
                }

                // 7. AudioContext Noise Protection
                if (cfg.audioNoise) {
                    try {
                        if (typeof AudioBuffer !== 'undefined') {
                            const origGetChannelData = AudioBuffer.prototype.getChannelData;
                            AudioBuffer.prototype.getChannelData = makeNative(function getChannelData(ch) {
                                const buffer = origGetChannelData.apply(this, arguments);
                                if (buffer && buffer.length > 0) {
                                    buffer[0] += 0.0000001;
                                }
                                return buffer;
                            }, 'getChannelData');
                        }
                    } catch(e) {}
                }

                // 8. WebRTC IP Protection
                if (cfg.webrtcProtection) {
                    try {
                        if (typeof window.RTCPeerConnection !== 'undefined') {
                            const origCreateOffer = window.RTCPeerConnection.prototype.createOffer;
                            window.RTCPeerConnection.prototype.createOffer = makeNative(function createOffer() {
                                return origCreateOffer.apply(this, arguments);
                            }, 'createOffer');
                        }
                    } catch(e) {}
                }
            })();
        """.trimIndent()
    }
}
