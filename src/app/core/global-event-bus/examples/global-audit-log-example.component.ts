/**
 * Global Audit Log Integration Example
 *
 * 展示 Phase 7B Global Audit Log 系統的完整整合範例
 * - 模擬各種審計事件
 * - 展示即時統計儀表板
 * - 查詢與過濾功能
 * - 審查工作流程
 *
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { EVENT_BUS } from '../constants/event-bus-tokens';

// Import domain events for simulation
import { BlueprintCreatedEvent } from '../domain-events/blueprint-events';
import { TaskCreatedEvent, TaskCompletedEvent, TaskDeletedEvent } from '../domain-events/task-events';
import { UserCreatedEvent, UserUpdatedEvent } from '../domain-events/user-events';
import { IEventBus } from '../interfaces/event-bus.interface';
import { AuditLevel, AuditCategory, AuditEvent, AuditEventQuery } from '../models/audit-event.model';
import { AuditCollectorService } from '../services/audit-collector.service';
import { AuditLogService } from '../services/audit-log.service';

@Component({
  selector: 'app-global-audit-log-example',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="global-audit-log-demo">
      <h1>🔍 Phase 7B: Global Audit Log System Demo</h1>
      <p class="subtitle">統一審計日誌系統 - 完整合規追蹤與查詢</p>

      <!-- Event Simulation Panel -->
      <div class="simulation-panel">
        <h2>📝 Event Simulation</h2>
        <div class="button-grid">
          <button (click)="simulateDataAccess()">📖 Simulate Data Access</button>
          <button (click)="simulateDataModification()">✏️ Simulate Data Modification</button>
          <button (click)="simulateAuthEvent()">🔐 Simulate Auth Event</button>
          <button (click)="simulateSecurityEvent()">⚠️ Simulate Security Event</button>
          <button (click)="simulateHighRiskOperation()">🚨 Simulate High Risk Op</button>
          <button (click)="simulateConfigChange()">⚙️ Simulate Config Change</button>
          <button (click)="simulateBulkOperations()">🔁 Simulate Bulk Operations</button>
          <button (click)="clearAuditLogs()">🗑️ Clear All Logs</button>
        </div>
      </div>

      <!-- Global Statistics Dashboard -->
      <div class="statistics-grid">
        <div class="stat-card">
          <div class="stat-value">{{ statistics().totalEvents }}</div>
          <div class="stat-label">Total Events</div>
        </div>

        <div class="stat-card info">
          <div class="stat-value">{{ statistics().byLevel.INFO }}</div>
          <div class="stat-label">INFO Events</div>
        </div>

        <div class="stat-card warning">
          <div class="stat-value">{{ statistics().byLevel.WARNING }}</div>
          <div class="stat-label">WARNING Events</div>
        </div>

        <div class="stat-card error">
          <div class="stat-value">{{ statistics().byLevel.ERROR }}</div>
          <div class="stat-label">ERROR Events</div>
        </div>

        <div class="stat-card critical">
          <div class="stat-value">{{ statistics().byLevel.CRITICAL }}</div>
          <div class="stat-label">CRITICAL Events</div>
        </div>

        <div class="stat-card success">
          <div class="stat-value">{{ statistics().successCount }}</div>
          <div class="stat-label">Successful</div>
        </div>

        <div class="stat-card failure">
          <div class="stat-value">{{ statistics().failureCount }}</div>
          <div class="stat-label">Failed</div>
        </div>

        <div class="stat-card review-pending">
          <div class="stat-value">{{ statistics().requiresReviewCount }}</div>
          <div class="stat-label">Requires Review</div>
        </div>

        <div class="stat-card reviewed">
          <div class="stat-value">{{ statistics().reviewedCount }}</div>
          <div class="stat-label">Reviewed</div>
        </div>
      </div>

      <!-- Category Statistics -->
      <div class="category-stats">
        <h2>📊 Audit Events by Category</h2>
        <div class="category-grid">
          <div class="category-item">
            <span class="category-name">Authentication</span>
            <span class="category-count">{{ statistics().byCategory.AUTHENTICATION }}</span>
          </div>
          <div class="category-item">
            <span class="category-name">Authorization</span>
            <span class="category-count">{{ statistics().byCategory.AUTHORIZATION }}</span>
          </div>
          <div class="category-item">
            <span class="category-name">Data Access</span>
            <span class="category-count">{{ statistics().byCategory.DATA_ACCESS }}</span>
          </div>
          <div class="category-item">
            <span class="category-name">Data Modification</span>
            <span class="category-count">{{ statistics().byCategory.DATA_MODIFICATION }}</span>
          </div>
          <div class="category-item">
            <span class="category-name">Security</span>
            <span class="category-count">{{ statistics().byCategory.SECURITY }}</span>
          </div>
          <div class="category-item">
            <span class="category-name">System Config</span>
            <span class="category-count">{{ statistics().byCategory.SYSTEM_CONFIGURATION }}</span>
          </div>
          <div class="category-item">
            <span class="category-name">Compliance</span>
            <span class="category-count">{{ statistics().byCategory.COMPLIANCE }}</span>
          </div>
          <div class="category-item">
            <span class="category-name">Business Op</span>
            <span class="category-count">{{ statistics().byCategory.BUSINESS_OPERATION }}</span>
          </div>
        </div>
      </div>

      <!-- Events Requiring Review -->
      <div class="review-section" *ngIf="eventsRequiringReview().length > 0">
        <h2>⚡ Events Requiring Review ({{ eventsRequiringReview().length }})</h2>
        <div class="events-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Category</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let event of eventsRequiringReview().slice(0, 10)" [class]="'level-' + event.level.toLowerCase()">
                <td>{{ formatTime(event.timestamp) }}</td>
                <td
                  ><span class="badge" [class]="'badge-' + event.level.toLowerCase()">{{ event.level }}</span></td
                >
                <td>{{ formatCategory(event.category) }}</td>
                <td>{{ event.actor }}</td>
                <td>{{ event.action }}</td>
                <td>{{ event.resourceType }}/{{ event.resourceId }}</td>
                <td
                  ><span class="badge" [class]="'badge-' + event.result">{{ event.result }}</span></td
                >
                <td>
                  <button class="btn-small" (click)="markAsReviewed(event.id)">✓ Review</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Audit Events -->
      <div class="recent-events-section">
        <h2>📋 Recent Audit Events (Last 20)</h2>
        <div class="events-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Category</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Result</th>
                <th>Review Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let event of recentEvents().slice(0, 20)" [class]="'level-' + event.level.toLowerCase()">
                <td>{{ formatTime(event.timestamp) }}</td>
                <td
                  ><span class="badge" [class]="'badge-' + event.level.toLowerCase()">{{ event.level }}</span></td
                >
                <td>{{ formatCategory(event.category) }}</td>
                <td>{{ event.actor }}</td>
                <td>{{ event.action }}</td>
                <td>{{ event.resourceType }}/{{ event.resourceId }}</td>
                <td
                  ><span class="badge" [class]="'badge-' + event.result">{{ event.result }}</span></td
                >
                <td>
                  <span *ngIf="event.reviewed" class="reviewed">✓ Reviewed</span>
                  <span *ngIf="!event.reviewed && event.requiresReview" class="needs-review">⚠️ Needs Review</span>
                  <span *ngIf="!event.reviewed && !event.requiresReview" class="no-review">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Query & Export Tools -->
      <div class="tools-section">
        <h2>🔧 Query & Export Tools</h2>
        <div class="tool-buttons">
          <button (click)="queryByLevel('CRITICAL')">🚨 Critical Events</button>
          <button (click)="queryByLevel('ERROR')">❌ Error Events</button>
          <button (click)="queryByCategory('SECURITY')">🔒 Security Events</button>
          <button (click)="queryByCategory('DATA_MODIFICATION')">✏️ Data Modifications</button>
          <button (click)="exportToJSON()">📥 Export JSON</button>
        </div>

        <div class="query-result" *ngIf="queryResult().length > 0">
          <h3>Query Result: {{ queryResult().length }} events</h3>
          <pre>{{ formatJSON(queryResult().slice(0, 3)) }}</pre>
        </div>
      </div>

      <div class="info-box">
        <h3>ℹ️ Phase 7B Features</h3>
        <ul>
          <li>✅ Unified audit event model with comprehensive metadata</li>
          <li>✅ Automatic categorization (8 categories)</li>
          <li>✅ Signal-based real-time statistics</li>
          <li>✅ Smart review flagging for high-risk operations</li>
          <li>✅ Multi-level audit logging (INFO/WARNING/ERROR/CRITICAL)</li>
          <li>✅ Query and filtering capabilities</li>
          <li>✅ Export functionality (JSON)</li>
          <li>⏳ Firestore persistence (Phase 7C)</li>
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .global-audit-log-demo {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        color: #1a1a1a;
      }
      .subtitle {
        font-size: 1.1rem;
        color: #666;
        margin-bottom: 2rem;
      }
      h2 {
        font-size: 1.5rem;
        margin: 1.5rem 0 1rem;
        color: #333;
      }

      .simulation-panel {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 2rem;
      }

      .button-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
      }

      button {
        padding: 12px 20px;
        border: none;
        border-radius: 6px;
        background: #0066cc;
        color: white;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s;
      }

      button:hover {
        background: #0052a3;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
      }

      button:active {
        transform: translateY(0);
      }

      .statistics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-align: center;
        border-left: 4px solid #0066cc;
      }

      .stat-card.info {
        border-left-color: #17a2b8;
      }
      .stat-card.warning {
        border-left-color: #ffc107;
      }
      .stat-card.error {
        border-left-color: #ff6b6b;
      }
      .stat-card.critical {
        border-left-color: #dc3545;
      }
      .stat-card.success {
        border-left-color: #28a745;
      }
      .stat-card.failure {
        border-left-color: #dc3545;
      }
      .stat-card.review-pending {
        border-left-color: #ff9800;
      }
      .stat-card.reviewed {
        border-left-color: #4caf50;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #333;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 0.9rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .category-stats {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }

      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
      }

      .category-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 15px;
        background: #f8f9fa;
        border-radius: 4px;
      }

      .category-name {
        font-weight: 500;
        color: #333;
      }

      .category-count {
        font-weight: bold;
        color: #0066cc;
      }

      .review-section,
      .recent-events-section,
      .tools-section {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }

      .events-table {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }

      thead {
        background: #f8f9fa;
      }

      th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #dee2e6;
      }

      td {
        padding: 10px 12px;
        border-bottom: 1px solid #f0f0f0;
      }

      tbody tr:hover {
        background: #f8f9fa;
      }

      tbody tr.level-warning {
        background: #fff3cd;
      }

      tbody tr.level-error {
        background: #f8d7da;
      }

      tbody tr.level-critical {
        background: #f5c6cb;
        font-weight: 500;
      }

      .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .badge-info {
        background: #d1ecf1;
        color: #0c5460;
      }
      .badge-warning {
        background: #fff3cd;
        color: #856404;
      }
      .badge-error {
        background: #f8d7da;
        color: #721c24;
      }
      .badge-critical {
        background: #f5c6cb;
        color: #721c24;
      }
      .badge-success {
        background: #d4edda;
        color: #155724;
      }
      .badge-failure {
        background: #f8d7da;
        color: #721c24;
      }
      .badge-partial {
        background: #ffeaa7;
        color: #856404;
      }

      .reviewed {
        color: #28a745;
        font-weight: 600;
      }
      .needs-review {
        color: #ff9800;
        font-weight: 600;
      }
      .no-review {
        color: #999;
      }

      .btn-small {
        padding: 4px 12px;
        font-size: 0.85rem;
        background: #28a745;
      }

      .btn-small:hover {
        background: #218838;
      }

      .tool-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }

      .tool-buttons button {
        padding: 8px 16px;
        font-size: 0.9rem;
      }

      .query-result {
        margin-top: 1rem;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 4px;
      }

      .query-result h3 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 1rem;
      }

      .query-result pre {
        background: white;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .info-box {
        background: #e7f3ff;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #0066cc;
      }

      .info-box h3 {
        margin-top: 0;
        color: #0066cc;
      }

      .info-box ul {
        margin: 0;
        padding-left: 20px;
      }

      .info-box li {
        margin-bottom: 8px;
        line-height: 1.6;
      }
    `
  ]
})
export class GlobalAuditLogExampleComponent implements OnInit {
  private auditLogService = inject(AuditLogService);
  private auditCollector = inject(AuditCollectorService);
  private eventBus = inject(EVENT_BUS);

  // Computed signals from AuditLogService
  readonly statistics = computed(() => this.auditLogService.statistics());
  readonly recentEvents = computed(() => this.auditLogService.recentEvents());
  readonly eventsRequiringReview = computed(() => this.auditLogService.eventsRequiringReview());

  // Query result
  readonly queryResult = signal<AuditEvent[]>([]);

  ngOnInit(): void {
    console.log('[GlobalAuditLogExample] Component initialized');
  }

  // === Event Simulation Methods ===

  async simulateDataAccess(): Promise<void> {
    await this.auditCollector.recordDataAccess(
      `event-${Date.now()}`,
      'task.read',
      'user-123',
      'Read Task',
      'task',
      'task-456',
      'tenant-789',
      {
        level: AuditLevel.INFO,
        metadata: { queryType: 'single', cacheHit: false }
      }
    );
    console.log('✅ Simulated Data Access event');
  }

  async simulateDataModification(): Promise<void> {
    await this.auditCollector.recordDataModification(
      `event-${Date.now()}`,
      'task.updated',
      'user-123',
      'Update Task',
      'task',
      'task-456',
      {
        before: { status: 'pending', priority: 'medium' },
        after: { status: 'completed', priority: 'high' },
        modifiedFields: ['status', 'priority'],
        summary: 'Task status changed to completed and priority elevated'
      },
      'tenant-789',
      {
        level: AuditLevel.INFO
      }
    );
    console.log('✅ Simulated Data Modification event');
  }

  async simulateAuthEvent(): Promise<void> {
    await this.auditCollector.recordAuth(`event-${Date.now()}`, 'auth.user.login', 'user-123', 'User Login', {
      level: AuditLevel.INFO,
      metadata: { provider: 'email', mfaUsed: true },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...'
    });
    console.log('✅ Simulated Auth event');
  }

  async simulateSecurityEvent(): Promise<void> {
    await this.auditCollector.recordSecurityEvent(
      `event-${Date.now()}`,
      'security.suspicious.activity',
      'user-999',
      'Multiple Failed Login Attempts',
      'User attempted to login 5 times from different IPs within 2 minutes',
      AuditLevel.WARNING,
      {
        metadata: {
          failedAttempts: 5,
          ips: ['192.168.1.1', '192.168.1.2', '10.0.0.1'],
          timeWindow: '2 minutes'
        },
        ipAddress: '192.168.1.1'
      }
    );
    console.log('✅ Simulated Security event');
  }

  async simulateHighRiskOperation(): Promise<void> {
    await this.auditCollector.recordDataModification(
      `event-${Date.now()}`,
      'task.deleted',
      'user-admin',
      'Delete Task',
      'task',
      'task-critical-001',
      {
        before: { id: 'task-critical-001', title: 'Critical System Task', status: 'in-progress' },
        summary: 'Permanent deletion of critical system task'
      },
      'tenant-789',
      {
        level: AuditLevel.CRITICAL,
        requiresReview: true,
        metadata: { deletionType: 'hard', reason: 'admin request' }
      }
    );
    console.log('✅ Simulated High Risk Operation');
  }

  async simulateConfigChange(): Promise<void> {
    await this.auditCollector.recordConfigChange(
      `event-${Date.now()}`,
      'config.system.updated',
      'admin-user',
      'Update System Configuration',
      'security.mfa.requirement',
      {
        before: { required: false, grace_period_days: 0 },
        after: { required: true, grace_period_days: 30 },
        modifiedFields: ['required', 'grace_period_days'],
        summary: 'Enabled mandatory MFA for all users with 30-day grace period'
      },
      {
        level: AuditLevel.WARNING,
        metadata: { affectedUsers: 1250, rolloutDate: '2025-01-01' }
      }
    );
    console.log('✅ Simulated Config Change');
  }

  async simulateBulkOperations(): Promise<void> {
    const operations = [this.simulateDataAccess(), this.simulateDataModification(), this.simulateAuthEvent()];

    await Promise.all(operations);
    console.log('✅ Simulated Bulk Operations (3 events)');
  }

  clearAuditLogs(): void {
    if (confirm('⚠️ Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      this.auditLogService.clearAll();
      this.queryResult.set([]);
      console.log('🗑️ All audit logs cleared');
    }
  }

  // === Query Methods ===

  queryByLevel(level: string): void {
    const query: AuditEventQuery = {
      level: level as AuditLevel
    };
    const results = this.auditLogService.queryEvents(query);
    this.queryResult.set(results);
    console.log(`🔍 Query: Level=${level}, Results=${results.length}`);
  }

  queryByCategory(category: string): void {
    const query: AuditEventQuery = {
      category: category as AuditCategory
    };
    const results = this.auditLogService.queryEvents(query);
    this.queryResult.set(results);
    console.log(`🔍 Query: Category=${category}, Results=${results.length}`);
  }

  exportToJSON(): void {
    const json = this.auditLogService.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('📥 Audit logs exported to JSON');
  }

  markAsReviewed(eventId: string): void {
    this.auditLogService.markAsReviewed(eventId, 'reviewer-123', 'Reviewed and approved');
    console.log(`✓ Event ${eventId} marked as reviewed`);
  }

  // === Utility Methods ===

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatCategory(category: AuditCategory): string {
    return category.replace(/_/g, ' ');
  }

  formatJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}
