/**
 * Storage Tier Enum
 * 
 * Defines 3-tier storage strategy for audit events with automatic lifecycle management.
 * Aligns with GitHub's Hot/Warm/Cold storage model for cost optimization.
 * 
 * Tier Strategy:
 * - HOT: Recent events (0-7 days) in Firestore for fast queries
 * - WARM: Mid-term events (8-90 days) in Firestore with reduced indexes
 * - COLD: Long-term events (91+ days) in Cloud Storage + BigQuery for compliance
 * 
 * @see docs/⭐️/audit-layers/LAYER_5_STORAGE_TIERS.md
 * @see docs/⭐️/AUDIT_SYSTEM_IMPLEMENTATION_ROADMAP.md
 */
export enum StorageTier {
  /**
   * HOT Tier
   * - Retention: 7 days
   * - Collection: audit_events_hot
   * - Query Performance: Fast (composite indexes)
   * - Storage Cost: High (Firestore)
   * - Use Cases: Real-time monitoring, dashboards, recent activity
   */
  HOT = 'HOT',
  
  /**
   * WARM Tier
   * - Retention: 90 days
   * - Collection: audit_events_warm
   * - Query Performance: Moderate (basic indexes)
   * - Storage Cost: Medium (Firestore)
   * - Use Cases: Compliance queries, historical analysis, audit reports
   */
  WARM = 'WARM',
  
  /**
   * COLD Tier
   * - Retention: 7 years (GDPR, HIPAA, SOC2 requirements)
   * - Storage: Cloud Storage + BigQuery
   * - Query Performance: Slow (batch queries)
   * - Storage Cost: Low (Cloud Storage)
   * - Use Cases: Legal holds, regulatory compliance, long-term archival
   */
  COLD = 'COLD'
}

/**
 * Tier Retention Policies
 * Defines retention periods and migration rules for each tier
 */
export const TIER_RETENTION_POLICIES = {
  HOT: {
    retentionDays: 7,
    autoMigrateTo: StorageTier.WARM,
    firestoreCollection: 'audit_events_hot'
  },
  WARM: {
    retentionDays: 90,
    autoMigrateTo: StorageTier.COLD,
    firestoreCollection: 'audit_events_warm'
  },
  COLD: {
    retentionDays: 2555, // 7 years
    autoMigrateTo: null, // Terminal tier
    cloudStorageBucket: 'audit-events-cold',
    bigQueryDataset: 'audit_archive'
  }
} as const;

/**
 * Helper function to get Firestore collection name from tier
 */
export function getCollectionName(tier: StorageTier): string {
  switch (tier) {
    case StorageTier.HOT:
      return TIER_RETENTION_POLICIES.HOT.firestoreCollection;
    case StorageTier.WARM:
      return TIER_RETENTION_POLICIES.WARM.firestoreCollection;
    case StorageTier.COLD:
      throw new Error('COLD tier uses Cloud Storage, not Firestore collections');
    default:
      throw new Error(`Unknown storage tier: ${tier}`);
  }
}

/**
 * Helper function to get next tier for migration
 */
export function getNextTier(tier: StorageTier): StorageTier | null {
  switch (tier) {
    case StorageTier.HOT:
      return TIER_RETENTION_POLICIES.HOT.autoMigrateTo;
    case StorageTier.WARM:
      return TIER_RETENTION_POLICIES.WARM.autoMigrateTo;
    case StorageTier.COLD:
      return TIER_RETENTION_POLICIES.COLD.autoMigrateTo;
    default:
      throw new Error(`Unknown storage tier: ${tier}`);
  }
}
