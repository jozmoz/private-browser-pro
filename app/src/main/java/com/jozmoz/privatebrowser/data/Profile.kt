package com.jozmoz.privatebrowser.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "profiles")
data class Profile(
    @PrimaryKey val id: String,
    val name: String,
    val color: String = "#4f8cff",
    val startupUrl: String = "",
    val saveData: Boolean = true,
    val tags: String = "",
    val notes: String = "",
    val lastLaunched: Long = 0L,

    // Fingerprint fields
    val os: String = "windows",
    val resolution: String = "1920x1080",
    val timezone: String = "America/New_York",
    val language: String = "en-US",
    val gpuId: String = "nvidia-rtx4070",
    val webglVendor: String = "Google Inc. (NVIDIA)",
    val webglRenderer: String = "ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    val webglGpuName: String = "NVIDIA GeForce RTX 4070",
    val userAgent: String = "",
    val hardwareConcurrency: Int = 8,
    val deviceMemory: Int = 16,
    val canvasNoise: Boolean = true,
    val audioNoise: Boolean = true,
    val webglNoise: Boolean = true,
    val captchaSafe: Boolean = true,
    val webrtcProtection: Boolean = true,
    val dnsProtection: Boolean = true,

    // Proxy fields (non-secret metadata only; credentials live in
    // ProxyCredentialStore encrypted with a keystore-backed key)
    val proxyEnabled: Boolean = false,
    val proxyType: String = "http",
    val proxyHost: String = "",
    val proxyPort: Int = 8080,
    @Deprecated(
        message = "Moved to ProxyCredentialStore; kept only for one-time migration.",
        replaceWith = ReplaceWith("ProxyCredentialStore.getUser(context, id)")
    )
    val proxyUser: String = "",
    @Deprecated(
        message = "Moved to ProxyCredentialStore; kept only for one-time migration.",
        replaceWith = ReplaceWith("ProxyCredentialStore.getPass(context, id)")
    )
    val proxyPass: String = ""
)
