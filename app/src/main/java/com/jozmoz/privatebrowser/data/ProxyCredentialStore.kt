package com.jozmoz.privatebrowser.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Encrypted store for upstream proxy credentials.
 *
 * The Room [Profile] table keeps only non-secret proxy metadata. The actual
 * [proxyUser] / [proxyPass] values live here, encrypted at rest with a
 * keystore-backed key (AES256_GCM). Reads return "" when no credential was
 * saved, so callers never need to handle null.
 */
object ProxyCredentialStore {

    private const val PREFS_FILE = "proxy_credentials_enc"
    private const val KEY_USER_PREFIX = "proxy_user_"
    private const val KEY_PASS_PREFIX = "proxy_pass_"

    @Volatile
    private var cache: SharedPreferences? = null

    private fun prefs(context: Context): SharedPreferences {
        cache?.let { return it }
        return synchronized(this) {
            cache ?: buildPrefs(context).also { cache = it }
        }
    }

    private fun buildPrefs(context: Context): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            context.applicationContext,
            PREFS_FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun saveCredentials(context: Context, profileId: String, user: String, pass: String) {
        prefs(context).edit()
            .putString(KEY_USER_PREFIX + profileId, user)
            .putString(KEY_PASS_PREFIX + profileId, pass)
            .apply()
    }

    fun getUser(context: Context, profileId: String): String {
        return prefs(context).getString(KEY_USER_PREFIX + profileId, "") ?: ""
    }

    fun getPass(context: Context, profileId: String): String {
        return prefs(context).getString(KEY_PASS_PREFIX + profileId, "") ?: ""
    }

    fun clearCredentials(context: Context, profileId: String) {
        prefs(context).edit()
            .remove(KEY_USER_PREFIX + profileId)
            .remove(KEY_PASS_PREFIX + profileId)
            .apply()
    }

    fun clearAll(context: Context) {
        prefs(context).edit().clear().apply()
    }
}
