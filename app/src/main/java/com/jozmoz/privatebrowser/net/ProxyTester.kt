package com.jozmoz.privatebrowser.net

import androidx.webkit.ProxyConfig
import androidx.webkit.ProxyController
import com.jozmoz.privatebrowser.data.Profile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.InetSocketAddress
import java.net.Proxy
import java.net.URL
import javax.net.ssl.HttpsURLConnection

data class ProxyTestResult(
    val success: Boolean,
    val pingMs: Long = 0,
    val message: String = ""
)

object ProxyTester {

    suspend fun testProxy(
        host: String,
        port: Int,
        type: String,
        user: String = "",
        pass: String = ""
    ): ProxyTestResult = withContext(Dispatchers.IO) {
        if (host.isBlank() || port <= 0) {
            return@withContext ProxyTestResult(false, 0, "Invalid host or port")
        }

        val startTime = System.currentTimeMillis()
        try {
            val proxyType = if (type.lowercase() == "socks5") Proxy.Type.SOCKS else Proxy.Type.HTTP
            val proxy = Proxy(proxyType, InetSocketAddress(host, port))

            val connection = URL("https://httpbin.org/ip").openConnection(proxy) as HttpsURLConnection
            connection.connectTimeout = 8000
            connection.readTimeout = 8000
            connection.requestMethod = "GET"

            if (user.isNotBlank() && pass.isNotBlank() && type.lowercase() == "http") {
                val auth = "$user:$pass"
                val encodedAuth = android.util.Base64.encodeToString(auth.toByteArray(), android.util.Base64.NO_WRAP)
                connection.setRequestProperty("Proxy-Authorization", "Basic $encodedAuth")
            }

            val responseCode = connection.responseCode
            val ping = System.currentTimeMillis() - startTime
            connection.disconnect()

            if (responseCode in 200..399) {
                ProxyTestResult(true, ping, "Connected (${ping}ms)")
            } else {
                ProxyTestResult(false, ping, "HTTP error $responseCode")
            }
        } catch (e: Exception) {
            val ping = System.currentTimeMillis() - startTime
            ProxyTestResult(false, ping, e.localizedMessage ?: "Connection failed")
        }
    }

    fun applyProxyToWebView(profile: Profile) {
        try {
            val proxyController = ProxyController.getInstance()

            if (!profile.proxyEnabled || profile.proxyHost.isBlank() || profile.proxyPort <= 0) {
                proxyController.clearProxyOverride({ }, { })
                return
            }

            val scheme = if (profile.proxyType.lowercase() == "socks5") "socks5" else "http"
            val proxyUrl = "$scheme://${profile.proxyHost}:${profile.proxyPort}"

            val proxyConfig = ProxyConfig.Builder()
                .addProxyRule(proxyUrl)
                .build()

            proxyController.setProxyOverride(proxyConfig, { }, { })
        } catch (_: Exception) { }
    }
}
