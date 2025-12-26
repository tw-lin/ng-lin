/**
 * Audit Event Repository
 * 
 * 審計事件儲存庫
 * - Firestore persistence for audit events with multi-tier storage strategy
 * - Integrates with ClassificationEngineService for automatic event classification
 * - Follows existing repository patterns (direct @angular/fire injection)
 * - Supports Hot/Warm/Cold tier lifecycle management
 * - Tenant-aware with security rules enforcement
 * 
 * Storage Strategy:
 * - HOT Tier (7 days): Fast queries, composite indexes, recent events
 * - WARM Tier (90 days): Reduced indexes, occasional queries
 * - COLD Tier (7 years): Cloud Storage + BigQuery, compliance archival
 * 
 * Integration Strategy:
 * - REUSES: Existing repository pattern (no FirestoreBaseRepository wrapper)
 * - EXTENDS: Existing AuditEvent model with classification metadata
 * - INTEGRATES: ClassificationEngineService for automatic categorization
 * 
 * Follows: docs/⭐️/🤖AI_Character_Profile_Impl.md (Firebase-native, minimal code)
 * Follows: docs/⭐️/🧠AI_Behavior_Guidelines.md (No Firestore wrapper)
 * 
 * @author Audit System Team
 * @version 1.0.0 - Storage Layer (Layer 5)
 */

import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  Firestore,
  QueryConstraint,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { AuditEvent, AuditLevel, AuditCategory } from '../../global-event-bus/models/audit-event.model';
import { ClassificationEngineService, ClassifiedAuditEvent } from '../services/classification-engine.service';

/**
 * Storage Tier Enum
 * 儲存層級（熱/溫/冷）
 */
export enum StorageTier {
  /** 熱儲存 (7 days) - 快速查詢 */
  HOT = 'HOT',
  /** 溫儲存 (90 days) - 偶爾查詢 */
  WARM = 'WARM',
  /** 冷儲存 (7 years) - 合規歸檔 */
  COLD = 'COLD'
}

/**
 * Audit Event Query Options
 * 審計事件查詢選項
 */
export interface AuditEventQueryOptions {
  /** 租戶 ID */
  tenantId?: string;
  /** 執行者 */
  actor?: string;
  /** 資源類型 */
  resourceType?: string;
  /** 資源 ID */
  resourceId?: string;
  /** 審計級別 */
  level?: AuditLevel;
  /** 審計類別 */
  category?: AuditCategory;
  /** 操作結果 */
  result?: 'success' | 'failure' | 'partial';
  /** 時間範圍 - 開始 */
  startTime?: Date;
  /** 時間範圍 - 結束 */
  endTime?: Date;
  /** 儲存層級 */
  tier?: StorageTier;
  /** 分頁限制 */
  limit?: number;
}

/**
 * Firestore Document for Audit Event
 * Firestore 審計事件文檔格式
 */
interface AuditEventDocument extends Omit<AuditEvent, 'timestamp' | 'reviewedAt'> {
  timestamp: Timestamp;
  reviewedAt?: Timestamp;
  // Classification metadata
  riskScore?: number;
  autoReviewRequired?: boolean;
  complianceTags?: string[];
  aiGenerated?: boolean;
  operationType?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';
  // Storage tier metadata
  tier: StorageTier;
  tierMigratedAt?: Timestamp;
}

@Injectable({ providedIn: 'root' })
export class AuditEventRepository {
  private readonly firestore = inject(Firestore);
  private readonly classificationEngine = inject(ClassificationEngineService);
  
  /** Hot tier collection (7 days retention) */
  private readonly hotCollectionRef = collection(this.firestore, 'audit_events_hot');
  
  /** Warm tier collection (90 days retention) */
  private readonly warmCollectionRef = collection(this.firestore, 'audit_events_warm');
  
  /**
   * Create audit event with automatic classification
   * 創建審計事件（自動分類）
   * 
   * @param event - Base audit event
   * @returns Created audit event with classification metadata
   */
  async create(event: AuditEvent): Promise<ClassifiedAuditEvent> {
    // Automatic classification
    const classified = this.classificationEngine.classify(event);
    
    // Convert to Firestore document format
    const document: AuditEventDocument = {
      ...classified,
      timestamp: Timestamp.fromDate(classified.timestamp),
      reviewedAt: classified.reviewedAt ? Timestamp.fromDate(classified.reviewedAt) : undefined,
      tier: StorageTier.HOT, // New events start in HOT tier
      tierMigratedAt: undefined
    };
    
    // Save to HOT tier collection
    const docRef = await addDoc(this.hotCollectionRef, document);
    
    // Return with Firestore-generated ID
    return {
      ...classified,
      id: docRef.id
    };
  }
  
  /**
   * Batch create audit events
   * 批次創建審計事件
   * 
   * @param events - Array of audit events
   * @returns Array of created events with classification
   */
  async createBatch(events: AuditEvent[]): Promise<ClassifiedAuditEvent[]> {
    // Classify all events in batch
    const classified = this.classificationEngine.classifyBatch(events);
    
    // Create all events (could be optimized with batch writes)
    const created: ClassifiedAuditEvent[] = [];
    for (const event of classified) {
      const document: AuditEventDocument = {
        ...event,
        timestamp: Timestamp.fromDate(event.timestamp),
        reviewedAt: event.reviewedAt ? Timestamp.fromDate(event.reviewedAt) : undefined,
        tier: StorageTier.HOT,
        tierMigratedAt: undefined
      };
      
      const docRef = await addDoc(this.hotCollectionRef, document);
      created.push({ ...event, id: docRef.id });
    }
    
    return created;
  }
  
  /**
   * Get audit event by ID
   * 根據 ID 取得審計事件
   * 
   * @param id - Audit event ID
   * @param tier - Storage tier to search (default: HOT)
   * @returns Audit event or null if not found
   */
  async getById(id: string, tier: StorageTier = StorageTier.HOT): Promise<ClassifiedAuditEvent | null> {
    const collectionRef = tier === StorageTier.HOT ? this.hotCollectionRef : this.warmCollectionRef;
    const docRef = doc(collectionRef, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      // Try other tier if not found
      if (tier === StorageTier.HOT) {
        return this.getById(id, StorageTier.WARM);
      }
      return null;
    }
    
    return this.documentToClassifiedEvent(snapshot.data() as AuditEventDocument, snapshot.id);
  }
  
  /**
   * Query audit events
   * 查詢審計事件
   * 
   * @param options - Query options
   * @returns Array of audit events matching criteria
   */
  async query(options: AuditEventQueryOptions): Promise<ClassifiedAuditEvent[]> {
    const tier = options.tier || StorageTier.HOT;
    const collectionRef = tier === StorageTier.HOT ? this.hotCollectionRef : this.warmCollectionRef;
    
    // Build query constraints
    const constraints: QueryConstraint[] = [];
    
    if (options.tenantId) {
      constraints.push(where('tenantId', '==', options.tenantId));
    }
    
    if (options.actor) {
      constraints.push(where('actor', '==', options.actor));
    }
    
    if (options.resourceType) {
      constraints.push(where('resourceType', '==', options.resourceType));
    }
    
    if (options.resourceId) {
      constraints.push(where('resourceId', '==', options.resourceId));
    }
    
    if (options.level) {
      constraints.push(where('level', '==', options.level));
    }
    
    if (options.category) {
      constraints.push(where('category', '==', options.category));
    }
    
    if (options.result) {
      constraints.push(where('result', '==', options.result));
    }
    
    if (options.startTime) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(options.startTime)));
    }
    
    if (options.endTime) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(options.endTime)));
    }
    
    // Add default ordering by timestamp desc
    constraints.push(orderBy('timestamp', 'desc'));
    
    // Add limit if specified
    if (options.limit) {
      constraints.push(firestoreLimit(options.limit));
    }
    
    // Execute query
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => 
      this.documentToClassifiedEvent(docSnap.data() as AuditEventDocument, docSnap.id)
    );
  }
  
  /**
   * Update audit event (e.g., mark as reviewed)
   * 更新審計事件（如：標記為已審查）
   * 
   * @param id - Audit event ID
   * @param updates - Partial audit event updates
   * @param tier - Storage tier (default: HOT)
   */
  async update(id: string, updates: Partial<AuditEvent>, tier: StorageTier = StorageTier.HOT): Promise<void> {
    const collectionRef = tier === StorageTier.HOT ? this.hotCollectionRef : this.warmCollectionRef;
    const docRef = doc(collectionRef, id);
    
    // Convert Date fields to Timestamp
    const firestoreUpdates: Record<string, unknown> = { ...updates };
    if (updates.reviewedAt) {
      firestoreUpdates['reviewedAt'] = Timestamp.fromDate(updates.reviewedAt);
    }
    
    await updateDoc(docRef, firestoreUpdates);
  }
  
  /**
   * Migrate event to different storage tier
   * 遷移事件到不同儲存層級
   * 
   * @param id - Audit event ID
   * @param fromTier - Source tier
   * @param toTier - Destination tier
   */
  async migrateTier(id: string, fromTier: StorageTier, toTier: StorageTier): Promise<void> {
    // Get event from source tier
    const event = await this.getById(id, fromTier);
    if (!event) {
      throw new Error(`Audit event ${id} not found in ${fromTier} tier`);
    }
    
    // Add to destination tier
    const destCollectionRef = toTier === StorageTier.HOT ? this.hotCollectionRef : this.warmCollectionRef;
    const document: AuditEventDocument = {
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp),
      reviewedAt: event.reviewedAt ? Timestamp.fromDate(event.reviewedAt) : undefined,
      tier: toTier,
      tierMigratedAt: Timestamp.now()
    };
    
    await addDoc(destCollectionRef, document);
    
    // Delete from source tier
    const srcCollectionRef = fromTier === StorageTier.HOT ? this.hotCollectionRef : this.warmCollectionRef;
    await deleteDoc(doc(srcCollectionRef, id));
  }
  
  /**
   * Get risk statistics for audit events
   * 取得審計事件的風險統計
   * 
   * @param options - Query options
   * @returns Risk statistics
   */
  async getRiskStatistics(options: AuditEventQueryOptions): Promise<{
    averageRisk: number;
    highRiskCount: number;
    criticalCount: number;
    reviewRequiredCount: number;
  }> {
    const events = await this.query(options);
    return this.classificationEngine.getRiskStatistics(events);
  }
  
  /**
   * Convert Firestore document to ClassifiedAuditEvent
   * 將 Firestore 文檔轉換為分類審計事件
   */
  private documentToClassifiedEvent(document: AuditEventDocument, id: string): ClassifiedAuditEvent {
    return {
      ...document,
      id,
      timestamp: document.timestamp.toDate(),
      reviewedAt: document.reviewedAt?.toDate(),
      riskScore: document.riskScore || 0,
      autoReviewRequired: document.autoReviewRequired || false,
      complianceTags: document.complianceTags || [],
      aiGenerated: document.aiGenerated,
      operationType: document.operationType
    };
  }
}
