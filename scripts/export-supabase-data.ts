import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env
config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface ExportStats {
    table: string
    count: number
    success: boolean
    error?: string
}

const EXPORT_DIR = path.join(process.cwd(), 'migration-data')

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true })
}

/**
 * Export data from a Supabase table to JSON file
 */
async function exportTable(tableName: string): Promise<ExportStats> {
    console.log(`📦 Exporting ${tableName}...`)

    try {
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })

        if (error) {
            console.error(`❌ Error exporting ${tableName}:`, error.message)
            return { table: tableName, count: 0, success: false, error: error.message }
        }

        const filePath = path.join(EXPORT_DIR, `${tableName}.json`)
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

        console.log(`✅ Exported ${count} records from ${tableName}`)
        return { table: tableName, count: count || 0, success: true }

    } catch (err: any) {
        console.error(`❌ Exception exporting ${tableName}:`, err.message)
        return { table: tableName, count: 0, success: false, error: err.message }
    }
}

/**
 * Main export function - exports all tables in dependency order
 */
async function exportAllData() {
    console.log('🚀 Starting Supabase data export...\n')

    const startTime = Date.now()
    const stats: ExportStats[] = []

    // Export tables in dependency order (respecting foreign keys)
    const tables = [
        // Core user data
        'profiles',
        'user_profiles',
        'subscriptions',

        // Medications & Schedules
        'items',
        'schedules',
        'dose_instances',
        'stock',
        'alarms',

        // Medication Interactions
        'medication_interactions',
        'user_interaction_alerts',

        // Health documents
        'categorias_saude',
        'documentos_saude',
        'compartilhamentos_doc',
        'medical_exams',
        'medical_shares',

        // Health data
        'health_history',
        'health_insights',
        'consultas_medicas',
        'exames_laboratoriais',
        'valores_exames',
        'sinais_vitais',
        'eventos_saude',
        'weight_logs',
        'side_effects_log',
        'vaccination_records',

        // Referral system
        'referrals',
        'referral_rewards',
        'referral_goals',
        'referral_fraud_logs',
        'referral_discounts',

        // Caregivers & Sharing
        'caregivers',
        'caregiver_links',
        'document_shares',
        'consultation_cards',

        // Affiliates
        'affiliates',
        'affiliate_events',

        // Notifications
        'notification_preferences',
        'notification_metrics',
        'notification_logs',
        'local_reminders',
        'push_subscriptions',

        // Features & Audit
        'feature_flags',
        'audit_logs',
        'consents',
        'premium_emails',
        'app_metrics',
    ]

    for (const table of tables) {
        const stat = await exportTable(table)
        stats.push(stat)
    }

    // Generate summary report
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    const totalRecords = stats.reduce((sum, s) => sum + s.count, 0)
    const successCount = stats.filter(s => s.success).length
    const failCount = stats.filter(s => !s.success).length

    console.log('\n' + '='.repeat(60))
    console.log('📊 EXPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total tables: ${tables.length}`)
    console.log(`Successful: ${successCount}`)
    console.log(`Failed: ${failCount}`)
    console.log(`Total records: ${totalRecords.toLocaleString()}`)
    console.log(`Duration: ${duration}s`)
    console.log('='.repeat(60))

    // Save summary
    const summaryPath = path.join(EXPORT_DIR, '_export_summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify({
        exportDate: new Date().toISOString(),
        duration: `${duration}s`,
        stats,
        totalRecords,
        successCount,
        failCount,
    }, null, 2))

    console.log(`\n📄 Summary saved to: ${summaryPath}`)
    console.log(`📁 Data exported to: ${EXPORT_DIR}\n`)

    if (failCount > 0) {
        console.error('⚠️  Some tables failed to export. Check errors above.')
        process.exit(1)
    }

    console.log('✅ Export completed successfully!')
}

// Run export
exportAllData().catch((error) => {
    console.error('💥 Fatal error during export:', error)
    process.exit(1)
})
