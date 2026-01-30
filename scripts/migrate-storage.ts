import admin from 'firebase-admin'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import axios from 'axios'

// Load environment variables
config()
config({ path: '.env.firebase' })

// Initialize Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
})

const bucket = admin.storage().bucket()

interface StorageMigrationStats {
    bucket: string
    filesProcessed: number
    filesSuccess: number
    filesFailed: number
    totalBytes: number
}

/**
 * List all files in a Supabase Storage bucket
 */
async function listSupabaseFiles(bucketName: string): Promise<any[]> {
    try {
        const { data, error } = await supabase.storage.from(bucketName).list()

        if (error) {
            console.error(`❌ Error listing files in ${bucketName}:`, error.message)
            return []
        }

        return data || []
    } catch (err: any) {
        console.error(`❌ Exception listing files in ${bucketName}:`, err.message)
        return []
    }
}

/**
 * Download file from Supabase Storage
 */
async function downloadFromSupabase(bucketName: string, filePath: string): Promise<Buffer | null> {
    try {
        const { data, error } = await supabase.storage.from(bucketName).download(filePath)

        if (error) {
            console.error(`❌ Error downloading ${filePath}:`, error.message)
            return null
        }

        // Convert Blob to Buffer
        const arrayBuffer = await data.arrayBuffer()
        return Buffer.from(arrayBuffer)
    } catch (err: any) {
        console.error(`❌ Exception downloading ${filePath}:`, err.message)
        return null
    }
}

/**
 * Upload file to Firebase Storage
 */
async function uploadToFirebase(
    filePath: string,
    buffer: Buffer,
    metadata?: any
): Promise<boolean> {
    try {
        const file = bucket.file(filePath)

        await file.save(buffer, {
            metadata: {
                ...metadata,
                _migratedFrom: 'supabase',
                _migratedAt: new Date().toISOString(),
            },
        })

        console.log(`✅ Uploaded: ${filePath}`)
        return true
    } catch (err: any) {
        console.error(`❌ Error uploading ${filePath}:`, err.message)
        return false
    }
}

/**
 * Migrate a single bucket
 */
async function migrateBucket(bucketName: string, targetPrefix: string): Promise<StorageMigrationStats> {
    console.log(`\n📦 Migrating bucket: ${bucketName} → ${targetPrefix}\n`)

    const stats: StorageMigrationStats = {
        bucket: bucketName,
        filesProcessed: 0,
        filesSuccess: 0,
        filesFailed: 0,
        totalBytes: 0,
    }

    // List files
    const files = await listSupabaseFiles(bucketName)

    if (files.length === 0) {
        console.log(`⏭️  Bucket ${bucketName} is empty, skipping...`)
        return stats
    }

    console.log(`Found ${files.length} files in ${bucketName}`)

    // Migrate each file
    for (const file of files) {
        stats.filesProcessed++

        const sourceFilePath = file.name
        const targetFilePath = `${targetPrefix}/${sourceFilePath}`

        console.log(`📥 Downloading: ${sourceFilePath}`)

        // Download from Supabase
        const buffer = await downloadFromSupabase(bucketName, sourceFilePath)

        if (!buffer) {
            stats.filesFailed++
            continue
        }

        stats.totalBytes += buffer.length

        // Upload to Firebase
        const success = await uploadToFirebase(targetFilePath, buffer, {
            contentType: file.metadata?.mimetype || 'application/octet-stream',
            cacheControl: 'public, max-age=31536000',
        })

        if (success) {
            stats.filesSuccess++
        } else {
            stats.filesFailed++
        }
    }

    return stats
}

/**
 * Main storage migration function
 */
async function migrateStorage() {
    console.log('🚀 Starting Firebase Storage migration...\n')

    const startTime = Date.now()
    const allStats: StorageMigrationStats[] = []

    // Define buckets to migrate
    const buckets = [
        { supabase: 'medical-documents', firebase: 'medical-documents' },
        { supabase: 'profile-avatars', firebase: 'profile-avatars' },
        { supabase: 'prescriptions', firebase: 'prescriptions' },
    ]

    for (const { supabase: supabaseBucket, firebase: firebaseBucket } of buckets) {
        const stats = await migrateBucket(supabaseBucket, firebaseBucket)
        allStats.push(stats)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 STORAGE MIGRATION SUMMARY')
    console.log('='.repeat(60))

    const totalFiles = allStats.reduce((sum, s) => sum + s.filesProcessed, 0)
    const totalSuccess = allStats.reduce((sum, s) => sum + s.filesSuccess, 0)
    const totalFailed = allStats.reduce((sum, s) => sum + s.filesFailed, 0)
    const totalBytes = allStats.reduce((sum, s) => sum + s.totalBytes, 0)

    console.log(`Total files processed: ${totalFiles}`)
    console.log(`Successful: ${totalSuccess}`)
    console.log(`Failed: ${totalFailed}`)
    console.log(`Total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
    console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`)
    console.log('='.repeat(60))

    // Save summary
    const summaryPath = path.join(process.cwd(), 'migration-data', '_storage_migration_summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify({
        migrationDate: new Date().toISOString(),
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        stats: allStats,
        totalFiles,
        totalSuccess,
        totalFailed,
        totalBytes,
    }, null, 2))

    console.log(`\n📄 Summary saved to: ${summaryPath}\n`)

    if (totalFailed > 0) {
        console.error('⚠️  Some files failed to migrate. Check errors above.')
        process.exit(1)
    }

    if (totalFiles === 0) {
        console.log('ℹ️  No files to migrate (buckets are empty)')
    } else {
        console.log('✅ Storage migration completed successfully!')
    }
}

// Run migration
migrateStorage()
    .then(() => {
        console.log('\n🎉 Storage migration finished!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Fatal error during storage migration:', error)
        process.exit(1)
    })
