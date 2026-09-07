package com.jozmoz.privatebrowser.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(entities = [Profile::class], version = 2, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun profileDao(): ProfileDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "private_browser_db"
                )
                    .addMigrations(MIGRATION_1_2)
                    .addCallback(MigrationCallback(context.applicationContext))
                    .build()
                INSTANCE = instance
                instance
            }
        }

        /**
         * Schema is unchanged (v1 columns retained so old rows read back);
         * [Profile.proxyUser] / [Profile.proxyPass] are deprecated and must no
         * longer be written by new code. The version bump records that intent.
         */
        val MIGRATION_1_2 = object : androidx.room.migration.Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                // No structural change: credentials move out of Room lazily via
                // MigrationCallback, which copies them into the encrypted store
                // and then wipes the plaintext columns.
            }
        }

        private class MigrationCallback(private val appContext: Context) : RoomDatabase.Callback() {
            override fun onOpen(db: SupportSQLiteDatabase) {
                super.onOpen(db)
                CoroutineScope(Dispatchers.IO).launch {
                    runCatching {
                        val cursor = db.query("SELECT id, proxyUser, proxyPass FROM profiles")
                        val moved = mutableListOf<String>()
                        cursor.use {
                            val idIdx = it.getColumnIndexOrThrow("id")
                            val userIdx = it.getColumnIndexOrThrow("proxyUser")
                            val passIdx = it.getColumnIndexOrThrow("proxyPass")
                            while (it.moveToNext()) {
                                val id = it.getString(idIdx) ?: continue
                                val user = it.getString(userIdx) ?: ""
                                val pass = it.getString(passIdx) ?: ""
                                if (user.isNotEmpty() || pass.isNotEmpty()) {
                                    ProxyCredentialStore.saveCredentials(appContext, id, user, pass)
                                    moved.add(id)
                                }
                            }
                        }
                        if (moved.isNotEmpty()) {
                            db.beginTransaction()
                            try {
                                for (id in moved) {
                                    db.execSQL(
                                        "UPDATE profiles SET proxyUser = '', proxyPass = '' WHERE id = ?",
                                        arrayOf<Any>(id)
                                    )
                                }
                                db.setTransactionSuccessful()
                            } finally {
                                db.endTransaction()
                            }
                        }
                    }
                }
            }
        }
    }
}
