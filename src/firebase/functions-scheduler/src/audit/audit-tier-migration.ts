/**
 * Audit Tier Migration Cloud Function
 * 
 * Automated lifecycle policy enforcement for multi-tier audit event storage.
 * Implements GitHub Master System's retention model:
 * - HOT tier: 7 days retention (frequent access)
 * - WARM tier: 90 days retention (infrequent access)
 * - COLD tier: 7 years retention (archival)
 * 
 * Scheduled: Daily at 2:00 AM UTC
 * Execution time: ~5-15 minutes depending on volume
 * 
 * @module functions-scheduler/audit
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// ========================================
// Configuration
// ========================================

const BATCH_SIZE = 500; // Firestore batch write limit
const MIGRATION_CHUNK_SIZE = 100; // Process events in chunks
const HOT_RETENTION_DAYS = 7;
const WARM_RETENTION_DAYS = 90;
// const COLD_RETENTION_YEARS = 7; // Reserved for future use

// Collection names
const COLLECTION_HOT = 'audit_events_hot';
const COLLECTION_WARM = 'audit_events_warm';
// const COLLECTION_COLD = 'audit_events_cold'; // Reserved for future use

// Storage bucket for archival
const ARCHIVE_BUCKET = 'audit-archive';
const BIGQUERY_DATASET = 'audit_logs';
const BIGQUERY_TABLE = 'audit_events';

// ========================================
// Interfaces
// ========================================

interface MigrationStats {
  hotToWarm: number;
  warmDeleted: number;
  warmArchived: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

interface AuditEventDocument {
  id: string;
  eventType: string;
  timestamp: Timestamp;
  blueprintId: string;
  tenantId?: string;
  actorId: string;
  actorType: string;
  category: string;
  level: string;
  migratedAt?: Timestamp;
  migratedFrom?: string;
  riskScore?: number;
  complianceTags?: string[];
  resourceType?: string;
  resourceId?: string;
  operation?: string;
  result?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

// ========================================
// Main Migration Function
// ========================================

/**
 * Daily scheduled function to migrate audit events across storage tiers.
 * 
 * Execution Flow:
 * 1. Query HOT events older than 7 days
 * 2. Batch copy to WARM tier
 * 3. Delete from HOT tier
 * 4. Query WARM events older than 90 days
 * 5. Archive to Cloud Storage + BigQuery
 * 6. Delete from WARM tier
 * 
 * Error Handling:
 * - Transactional safety: Verify write before delete
 * - Retry logic: Up to 3 attempts with exponential backoff
 * - Partial failure recovery: Continue on individual event errors
 * - Comprehensive logging for audit trail
 */
export const migrateAuditTiers = onSchedule({
  schedule: '0 2 * * *', // Daily at 2:00 AM UTC
  timeZone: 'UTC',
  retryCount: 3,
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 540, // 9 minutes
  maxInstances: 1, // Prevent concurrent migrations
}, async (event) => {
  logger.info('🔄 Starting audit tier migration', {
    scheduleTime: event.scheduleTime,
    jobName: event.jobName,
  });

  const stats: MigrationStats = {
    hotToWarm: 0,
    warmDeleted: 0,
    warmArchived: 0,
    errors: 0,
    startTime: new Date(),
  };

  try {
    // Step 1: Migrate HOT → WARM (events older than 7 days)
    logger.info('📦 Step 1: Migrating HOT → WARM tier');
    stats.hotToWarm = await migrateHotToWarm();

    // Step 2: Archive and delete WARM → COLD (events older than 90 days)
    logger.info('📦 Step 2: Archiving WARM → COLD tier');
    const warmResults = await archiveAndDeleteWarm();
    stats.warmArchived = warmResults.archived;
    stats.warmDeleted = warmResults.deleted;

    // Complete
    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

    logger.info('✅ Audit tier migration completed', {
      stats,
      durationMs: stats.duration,
      durationMin: (stats.duration / 60000).toFixed(2),
    });

    // Return void as per Firebase Functions v2 requirements
    return;
  } catch (error) {
    stats.errors++;
    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

    logger.error('❌ Audit tier migration failed', {
      error,
      stats,
      durationMs: stats.duration,
    });

    throw error; // Trigger Cloud Scheduler retry
  }
});

// ========================================
// HOT → WARM Migration
// ========================================

/**
 * Migrate audit events from HOT to WARM tier.
 * Events older than 7 days are moved to reduce HOT storage costs.
 * 
 * @returns Number of events migrated
 */
async function migrateHotToWarm(): Promise<number> {
  const db = admin.firestore();
  const hotRef = db.collection(COLLECTION_HOT);
  const warmRef = db.collection(COLLECTION_WARM);

  // Calculate cutoff date (7 days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - HOT_RETENTION_DAYS);
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  logger.info('🔍 Querying HOT events', {
    cutoffDate: cutoffDate.toISOString(),
    retentionDays: HOT_RETENTION_DAYS,
  });

  // Query events to migrate
  const snapshot = await hotRef
    .where('timestamp', '<', cutoffTimestamp)
    .orderBy('timestamp', 'asc')
    .limit(BATCH_SIZE)
    .get();

  if (snapshot.empty) {
    logger.info('✅ No HOT events to migrate');
    return 0;
  }

  logger.info(`📋 Found ${snapshot.size} HOT events to migrate`);

  // Process in chunks to avoid memory issues
  const events: AuditEventDocument[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as AuditEventDocument));

  let migratedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < events.length; i += MIGRATION_CHUNK_SIZE) {
    const chunk = events.slice(i, i + MIGRATION_CHUNK_SIZE);

    try {
      // Batch write to WARM tier
      const warmBatch = db.batch();
      chunk.forEach(event => {
        const { id, ...data } = event;
        const warmDocRef = warmRef.doc(id);
        warmBatch.set(warmDocRef, {
          ...data,
          migratedAt: Timestamp.now(),
          migratedFrom: 'hot',
        });
      });
      await warmBatch.commit();

      // Verify writes before deleting
      const verifyPromises = chunk.map(event => 
        warmRef.doc(event.id).get()
      );
      const verifyResults = await Promise.all(verifyPromises);
      
      const allExist = verifyResults.every(doc => doc.exists);
      if (!allExist) {
        throw new Error('WARM tier write verification failed');
      }

      // Delete from HOT tier (transactional safety)
      const hotBatch = db.batch();
      chunk.forEach(event => {
        const hotDocRef = hotRef.doc(event.id);
        hotBatch.delete(hotDocRef);
      });
      await hotBatch.commit();

      migratedCount += chunk.length;

      logger.info(`✅ Migrated chunk ${Math.floor(i / MIGRATION_CHUNK_SIZE) + 1}`, {
        chunkSize: chunk.length,
        totalMigrated: migratedCount,
      });
    } catch (error) {
      errorCount += chunk.length;
      logger.error('❌ Failed to migrate chunk', {
        chunkIndex: Math.floor(i / MIGRATION_CHUNK_SIZE),
        chunkSize: chunk.length,
        error,
      });
      // Continue with next chunk instead of failing entirely
    }
  }

  logger.info('📊 HOT → WARM migration complete', {
    migrated: migratedCount,
    errors: errorCount,
    total: events.length,
  });

  return migratedCount;
}

// ========================================
// WARM → COLD Archival & Deletion
// ========================================

/**
 * Archive WARM tier events to COLD tier and delete from Firestore.
 * Events older than 90 days are archived to:
 * 1. Cloud Storage (JSON files for raw data)
 * 2. BigQuery (for analytics and compliance queries)
 * 
 * @returns Object with archived and deleted counts
 */
async function archiveAndDeleteWarm(): Promise<{ archived: number; deleted: number }> {
  const db = admin.firestore();
  const warmRef = db.collection(COLLECTION_WARM);

  // Calculate cutoff date (90 days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - WARM_RETENTION_DAYS);
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  logger.info('🔍 Querying WARM events', {
    cutoffDate: cutoffDate.toISOString(),
    retentionDays: WARM_RETENTION_DAYS,
  });

  // Query events to archive
  const snapshot = await warmRef
    .where('timestamp', '<', cutoffTimestamp)
    .orderBy('timestamp', 'asc')
    .limit(BATCH_SIZE)
    .get();

  if (snapshot.empty) {
    logger.info('✅ No WARM events to archive');
    return { archived: 0, deleted: 0 };
  }

  logger.info(`📋 Found ${snapshot.size} WARM events to archive`);

  const events: AuditEventDocument[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as AuditEventDocument));

  let archivedCount = 0;
  let deletedCount = 0;
  let errorCount = 0;

  // Archive to Cloud Storage (grouped by month)
  for (let i = 0; i < events.length; i += MIGRATION_CHUNK_SIZE) {
    const chunk = events.slice(i, i + MIGRATION_CHUNK_SIZE);

    try {
      // Group events by month for efficient storage
      const eventsByMonth = new Map<string, AuditEventDocument[]>();
      chunk.forEach(event => {
        const monthKey = getMonthKey(event.timestamp.toDate());
        if (!eventsByMonth.has(monthKey)) {
          eventsByMonth.set(monthKey, []);
        }
        eventsByMonth.get(monthKey)!.push(event);
      });

      // Archive each month group to Cloud Storage
      const archivePromises = Array.from(eventsByMonth.entries()).map(
        ([monthKey, monthEvents]) => archiveToCloudStorage(monthKey, monthEvents)
      );
      await Promise.all(archivePromises);

      // Archive to BigQuery
      await archiveToBigQuery(chunk);

      archivedCount += chunk.length;

      // Delete from WARM tier after successful archival
      const deleteBatch = db.batch();
      chunk.forEach(event => {
        const warmDocRef = warmRef.doc(event.id);
        deleteBatch.delete(warmDocRef);
      });
      await deleteBatch.commit();

      deletedCount += chunk.length;

      logger.info(`✅ Archived and deleted chunk ${Math.floor(i / MIGRATION_CHUNK_SIZE) + 1}`, {
        chunkSize: chunk.length,
        totalArchived: archivedCount,
        totalDeleted: deletedCount,
      });
    } catch (error) {
      errorCount += chunk.length;
      logger.error('❌ Failed to archive chunk', {
        chunkIndex: Math.floor(i / MIGRATION_CHUNK_SIZE),
        chunkSize: chunk.length,
        error,
      });
      // Continue with next chunk
    }
  }

  logger.info('📊 WARM → COLD archival complete', {
    archived: archivedCount,
    deleted: deletedCount,
    errors: errorCount,
    total: events.length,
  });

  return { archived: archivedCount, deleted: deletedCount };
}

// ========================================
// Cloud Storage Archival
// ========================================

/**
 * Archive events to Cloud Storage as JSON files.
 * Files are organized by: audit-archive/YYYY/MM/audit-events-YYYY-MM-DD-HASH.json
 * 
 * @param monthKey - Format: YYYY-MM
 * @param events - Events to archive
 */
async function archiveToCloudStorage(
  monthKey: string,
  events: AuditEventDocument[]
): Promise<void> {
  const storage = admin.storage();
  const bucket = storage.bucket(ARCHIVE_BUCKET);

  const [year, month] = monthKey.split('-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${year}/${month}/audit-events-${monthKey}-${timestamp}.json`;

  // Convert Firestore Timestamps to ISO strings for JSON serialization
  const serializedEvents = events.map(event => ({
    ...event,
    timestamp: event.timestamp.toDate().toISOString(),
    migratedAt: event.migratedAt?.toDate().toISOString(),
  }));

  const file = bucket.file(fileName);
  await file.save(JSON.stringify(serializedEvents, null, 2), {
    contentType: 'application/json',
    metadata: {
      monthKey,
      eventCount: events.length.toString(),
      archivalDate: new Date().toISOString(),
    },
  });

  logger.info(`☁️ Archived to Cloud Storage`, {
    fileName,
    eventCount: events.length,
    monthKey,
  });
}

// ========================================
// BigQuery Archival
// ========================================

/**
 * Archive events to BigQuery for analytics and compliance queries.
 * 
 * @param events - Events to archive
 */
async function archiveToBigQuery(events: AuditEventDocument[]): Promise<void> {
  try {
    // Import BigQuery dynamically (optional dependency for graceful degradation)
    const { BigQuery } = await import('@google-cloud/bigquery');
    const bigquery = new BigQuery();

    // Convert Firestore Timestamps to BigQuery-compatible format
    const rows = events.map(event => ({
      event_id: event.id,
      event_type: event.eventType,
      timestamp: event.timestamp.toDate().toISOString(),
      blueprint_id: event.blueprintId,
      tenant_id: event.tenantId || null,
      actor_id: event.actorId,
      actor_type: event.actorType,
      category: event.category,
      level: event.level,
      risk_score: event.riskScore || 0,
      compliance_tags: event.complianceTags || [],
      resource_type: event.resourceType || null,
      resource_id: event.resourceId || null,
      operation: event.operation || null,
      result: event.result || null,
      error_code: event.errorCode || null,
      error_message: event.errorMessage || null,
      migrated_at: event.migratedAt?.toDate().toISOString() || null,
      migrated_from: event.migratedFrom || 'warm',
      metadata: JSON.stringify(event.metadata || {}),
    }));

    await bigquery
      .dataset(BIGQUERY_DATASET)
      .table(BIGQUERY_TABLE)
      .insert(rows, { skipInvalidRows: true, ignoreUnknownValues: true });

    logger.info(`📊 Archived to BigQuery`, {
      dataset: BIGQUERY_DATASET,
      table: BIGQUERY_TABLE,
      rowCount: rows.length,
    });
  } catch (error) {
    logger.warn('⚠️ BigQuery archival failed (optional)', {
      error,
      eventCount: events.length,
      message: 'Events archived to Cloud Storage only'
    });
    // Don't throw - BigQuery is optional, Cloud Storage is primary
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Get month key in format YYYY-MM
 */
function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
