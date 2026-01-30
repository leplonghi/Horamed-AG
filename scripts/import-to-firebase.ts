import admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.firebase' })

// Initialize Firebase Admin SDK with Service Account
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service Account file not found!')
    console.error('📖 Please follow the guide: FIREBASE_SERVICE_ACCOUNT_GUIDE.md')
    process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
})

const db = admin.firestore()

interface ImportStats {
    collection: string
    count: number
    success: boolean
    error?: string
}

const EXPORT_DIR = path.join(process.cwd(), 'migration-data')

/**
 * Import data from JSON file to Firestore collection
 */
async function importCollection(
    fileName: string,
    collectionPath: string,
    transform?: (data: any) => any
): Promise<ImportStats> {
    console.log(`📥 Importing ${fileName} to ${collectionPath}...`)

    try {
        const filePath = path.join(EXPORT_DIR, `${fileName}.json`)

        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Skipping ${fileName} (file not found)`)
            return { collection: fileName, count: 0, success: true }
        }

        const rawData = fs.readFileSync(filePath, 'utf-8')
        const data = JSON.parse(rawData)

        if (!Array.isArray(data) || data.length === 0) {
            console.log(`⏭️  Skipping ${fileName} (empty)`)
            return { collection: fileName, count: 0, success: true }
        }

        // Batch writes (max 500 per batch)
        const batchSize = 500
        let imported = 0

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = db.batch()
            const chunk = data.slice(i, i + batchSize)

            for (const item of chunk) {
                const transformedItem = transform ? transform(item) : item
                const docId = transformedItem.id || admin.firestore().collection('_').doc().id
                const docRef = db.collection(collectionPath).doc(docId)

                // Remove 'id' from data if it exists (Firestore uses doc ID)
                const { id, ...dataWithoutId } = transformedItem

                batch.set(docRef, {
                    ...dataWithoutId,
                    _importedAt: admin.firestore.FieldValue.serverTimestamp(),
                })
                imported++
            }

            await batch.commit()
        }

        console.log(`✅ Imported ${imported} documents to ${collectionPath}`)
        return { collection: fileName, count: imported, success: true }

    } catch (err: any) {
        console.error(`❌ Error importing ${fileName}:`, err.message)
        return { collection: fileName, count: 0, success: false, error: err.message }
    }
}

/**
 * Transform Supabase timestamps to Firestore timestamps
 */
function transformTimestamps(data: any): any {
    const transformed = { ...data }

    // Common timestamp fields
    const timestampFields = [
        'created_at', 'updated_at', 'deleted_at',
        'scheduled_for', 'taken_at', 'skipped_at',
        'expires_at', 'activated_at', 'completed_at',
        'uploaded_at', 'shared_at', 'acknowledged_at',
        'dismissed_at', 'granted_at', 'claimed_at',
        'onboarding_completed_at', 'trial_ends_at',
        'cpf_verified_at', 'email_verified_at',
    ]

    for (const field of timestampFields) {
        if (transformed[field]) {
            transformed[field] = admin.firestore.Timestamp.fromDate(new Date(transformed[field]))
        }
    }

    return transformed
}

/**
 * Main import function
 */
async function importAllData() {
    console.log('🚀 Starting Firebase data import...\n')

    const startTime = Date.now()
    const stats: ImportStats[] = []

    // Import global collections (reference data)
    console.log('📚 Importing global reference data...\n')

    stats.push(await importCollection(
        'medication_interactions',
        'medicationInteractions',
        transformTimestamps
    ))

    stats.push(await importCollection(
        'categorias_saude',
        'healthCategories',
        transformTimestamps
    ))

    stats.push(await importCollection(
        'feature_flags',
        'featureFlags',
        transformTimestamps
    ))

    // Note: User-specific data will be imported when we have actual users
    // For now, we're just importing the reference/global data

    console.log('\n📊 Import Summary\n')
    console.log('='.repeat(60))

    const totalImported = stats.reduce((sum, s) => sum + s.count, 0)
    const successCount = stats.filter(s => s.success).length
    const failCount = stats.filter(s => !s.success).length

    console.log(`Total collections: ${stats.length}`)
    console.log(`Successful: ${successCount}`)
    console.log(`Failed: ${failCount}`)
    console.log(`Total documents: ${totalImported}`)
    console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`)
    console.log('='.repeat(60))

    // Save import summary
    const summaryPath = path.join(EXPORT_DIR, '_import_summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify({
        importDate: new Date().toISOString(),
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        stats,
        totalImported,
        successCount,
        failCount,
    }, null, 2))

    console.log(`\n📄 Summary saved to: ${summaryPath}\n`)

    if (failCount > 0) {
        console.error('⚠️  Some collections failed to import. Check errors above.')
        process.exit(1)
    }

    console.log('✅ Import completed successfully!')

    // Verify data
    console.log('\n🔍 Verifying imported data...\n')
    await verifyImport()
}

/**
 * Verify imported data
 */
async function verifyImport() {
    try {
        // Check medication interactions
        const interactionsSnap = await db.collection('medicationInteractions').limit(1).get()
        console.log(`✅ Medication Interactions: ${interactionsSnap.size > 0 ? 'OK' : 'EMPTY'}`)

        // Check health categories
        const categoriesSnap = await db.collection('healthCategories').limit(1).get()
        console.log(`✅ Health Categories: ${categoriesSnap.size > 0 ? 'OK' : 'EMPTY'}`)

        // Check feature flags
        const flagsSnap = await db.collection('featureFlags').limit(1).get()
        console.log(`✅ Feature Flags: ${flagsSnap.size > 0 ? 'OK' : 'EMPTY'}`)

        console.log('\n✅ Verification complete!')

    } catch (err: any) {
        console.error('❌ Verification failed:', err.message)
    }
}

// Run import
importAllData()
    .then(() => {
        console.log('\n🎉 Migration to Firebase completed!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Fatal error during import:', error)
        process.exit(1)
    })
