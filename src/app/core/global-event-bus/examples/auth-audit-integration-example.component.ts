/**
 * Auth & Audit Integration Example
 *
 * 展示如何整合 Global Event Bus 與 Identity & Auth 系統
 * - 發布認證事件
 * - 自動審計記錄
 * - 即時統計與監控
 * - 異常檢測與告警
 *
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { Component, signal, computed, inject, OnInit } from '@angular/core';

import { EVENT_BUS } from '../constants/event-bus-tokens';
import {
  UserLoginEvent,
  UserLogoutEvent,
  PasswordChangedEvent,
  MFAEnabledEvent,
  MFADisabledEvent,
  TokenRefreshedEvent,
  SessionExpiredEvent,
  PermissionChangedEvent,
  RoleChangedEvent,
  LoginFailedEvent,
  EmailVerifiedEvent
} from '../domain-events/auth-events';
import { IEventBus } from '../interfaces/event-bus.interface';
import { AuditLevel, AuditCategory } from '../models/auth-audit-event.model';
import { AuthAuditService } from '../services/auth-audit.service';
import { PermissionAuditService } from '../services/permission-audit.service';

/**
 * Auth Audit Integration Demo Component
 *
 * 用途:
 * 1. 展示認證事件發布
 * 2. 即時審計統計展示
 * 3. 權限變更追蹤
 * 4. 異常事件監控
 */
@Component({
  selector: 'app-auth-audit-demo',
  standalone: true,
  template: `
    <div class="auth-audit-demo">
      <h1>Auth & Audit Integration Demo</h1>

      <!-- Event Publishing Section -->
      <section class="event-publisher">
        <h2>發布認證事件</h2>

        <div class="button-group">
          <button (click)="simulateLogin()">模擬登入</button>
          <button (click)="simulateLogout()">模擬登出</button>
          <button (click)="simulateLoginFailure()">模擬登入失敗</button>
          <button (click)="simulatePasswordChange()">模擬密碼變更</button>
          <button (click)="simulateMFAEnable()">模擬 MFA 啟用</button>
          <button (click)="simulateMFADisable()">模擬 MFA 停用</button>
          <button (click)="simulatePermissionChange()">模擬權限變更</button>
          <button (click)="simulateRoleChange()">模擬角色變更</button>
        </div>
      </section>

      <!-- Auth Audit Statistics -->
      <section class="auth-stats">
        <h2>認證審計統計</h2>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">總事件數</div>
            <div class="stat-value">{{ authStatistics().totalEvents }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">成功登入</div>
            <div class="stat-value success">{{ authStatistics().successfulLogins }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">失敗登入</div>
            <div class="stat-value error">{{ authStatistics().failedLogins }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">登出次數</div>
            <div class="stat-value">{{ authStatistics().logouts }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">密碼變更</div>
            <div class="stat-value">{{ authStatistics().passwordChanges }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">MFA 啟用</div>
            <div class="stat-value">{{ authStatistics().mfaEnabled }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">MFA 停用</div>
            <div class="stat-value warning">{{ authStatistics().mfaDisabled }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">需要審查</div>
            <div class="stat-value critical">{{ authStatistics().requiresReview }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">嚴重事件</div>
            <div class="stat-value critical">{{ authStatistics().criticalEvents }}</div>
          </div>
        </div>
      </section>

      <!-- Permission Audit Statistics -->
      <section class="permission-stats">
        <h2>權限審計統計</h2>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">總事件數</div>
            <div class="stat-value">{{ permissionStatistics().totalEvents }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">權限授予</div>
            <div class="stat-value success">{{ permissionStatistics().permissionsGranted }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">權限撤銷</div>
            <div class="stat-value warning">{{ permissionStatistics().permissionsRevoked }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">角色分配</div>
            <div class="stat-value success">{{ permissionStatistics().rolesAssigned }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">角色移除</div>
            <div class="stat-value warning">{{ permissionStatistics().rolesUnassigned }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">需要審查</div>
            <div class="stat-value critical">{{ permissionStatistics().requiresReview }}</div>
          </div>
        </div>
      </section>

      <!-- Recent Auth Events -->
      <section class="recent-events">
        <h2>最近的認證事件 (最新 10 筆)</h2>

        <table>
          <thead>
            <tr>
              <th>時間</th>
              <th>類型</th>
              <th>用戶</th>
              <th>級別</th>
              <th>描述</th>
              <th>審查</th>
            </tr>
          </thead>
          <tbody>
            @for (event of recentAuthEvents(); track event.id) {
              <tr [class]="event.level.toLowerCase()">
                <td>{{ formatTime(event.timestamp) }}</td>
                <td>{{ event.category }}</td>
                <td>{{ event.userEmail }}</td>
                <td>{{ event.level }}</td>
                <td>{{ event.description }}</td>
                <td>{{ event.requiresReview ? '⚠️ 是' : '-' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <!-- Recent Permission Events -->
      <section class="recent-permissions">
        <h2>最近的權限變更 (最新 10 筆)</h2>

        <table>
          <thead>
            <tr>
              <th>時間</th>
              <th>目標用戶</th>
              <th>操作</th>
              <th>資源</th>
              <th>執行者</th>
              <th>審查</th>
            </tr>
          </thead>
          <tbody>
            @for (event of recentPermissionEvents(); track event.id) {
              <tr [class]="event.level.toLowerCase()">
                <td>{{ formatTime(event.timestamp) }}</td>
                <td>{{ event.targetUserEmail }}</td>
                <td>{{ event.actionType }}</td>
                <td>{{ event.resourceType }}</td>
                <td>{{ event.executorId }}</td>
                <td>{{ event.requiresReview ? '⚠️ 是' : '-' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [
    `
      .auth-audit-demo {
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      h1 {
        color: #333;
        border-bottom: 2px solid #0078d4;
        padding-bottom: 10px;
      }

      h2 {
        color: #555;
        margin-top: 30px;
      }

      .button-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 20px 0;
      }

      button {
        padding: 10px 20px;
        background: #0078d4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }

      button:hover {
        background: #005a9e;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }

      .stat-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .stat-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #333;
      }

      .stat-value.success {
        color: #28a745;
      }

      .stat-value.warning {
        color: #ffc107;
      }

      .stat-value.error,
      .stat-value.critical {
        color: #dc3545;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      th {
        background: #f8f9fa;
        padding: 12px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #dee2e6;
      }

      td {
        padding: 10px 12px;
        border-bottom: 1px solid #dee2e6;
      }

      tr:hover {
        background: #f8f9fa;
      }

      tr.warning {
        background: #fff3cd;
      }

      tr.critical,
      tr.error {
        background: #f8d7da;
      }
    `
  ]
})
export class AuthAuditDemoComponent implements OnInit {
  private eventBus = inject(EVENT_BUS);
  private authAuditService = inject(AuthAuditService);
  private permissionAuditService = inject(PermissionAuditService);

  // ========================================
  // Signals
  // ========================================

  /** Auth 統計 */
  authStatistics = computed(() => this.authAuditService.statistics());

  /** Permission 統計 */
  permissionStatistics = computed(() => this.permissionAuditService.statistics());

  /** 最近的認證事件 */
  recentAuthEvents = computed(() => this.authAuditService.recentEvents().slice(0, 10));

  /** 最近的權限事件 */
  recentPermissionEvents = computed(() => this.permissionAuditService.recentEvents().slice(0, 10));

  // ========================================
  // Lifecycle
  // ========================================

  ngOnInit(): void {
    console.log('[AuthAuditDemoComponent] Initialized');
    console.log('Auth Audit Service statistics:', this.authStatistics());
    console.log('Permission Audit Service statistics:', this.permissionStatistics());
  }

  // ========================================
  // Event Simulation Methods
  // ========================================

  /**
   * 模擬用戶登入
   */
  async simulateLogin(): Promise<void> {
    const event = new UserLoginEvent({
      userId: 'user-123',
      email: 'demo@example.com',
      displayName: 'Demo User',
      provider: 'email',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      tenantId: 'tenant-1',
      sessionId: `session-${Date.now()}`,
      isFirstLogin: false,
      mfaEnabled: true,
      loginAt: new Date()
    });

    await this.eventBus.publish(event);
    console.log('[Demo] User login event published');
  }

  /**
   * 模擬用戶登出
   */
  async simulateLogout(): Promise<void> {
    const event = new UserLogoutEvent({
      userId: 'user-123',
      email: 'demo@example.com',
      sessionId: `session-${Date.now()}`,
      tenantId: 'tenant-1',
      reason: 'manual',
      logoutAt: new Date(),
      sessionDuration: 3600
    });

    await this.eventBus.publish(event);
    console.log('[Demo] User logout event published');
  }

  /**
   * 模擬登入失敗
   */
  async simulateLoginFailure(): Promise<void> {
    const event = new LoginFailedEvent({
      email: 'hacker@malicious.com',
      reason: 'invalid_credentials',
      ipAddress: '10.0.0.50',
      userAgent: 'Suspicious Bot',
      tenantId: 'tenant-1',
      consecutiveFailures: 5,
      accountLocked: true,
      failedAt: new Date()
    });

    await this.eventBus.publish(event);
    console.log('[Demo] Login failed event published');
  }

  /**
   * 模擬密碼變更
   */
  async simulatePasswordChange(): Promise<void> {
    const event = new PasswordChangedEvent({
      userId: 'user-123',
      email: 'demo@example.com',
      changeType: 'user_initiated',
      forceChangeOnNextLogin: false,
      ipAddress: '192.168.1.100',
      tenantId: 'tenant-1',
      changedAt: new Date()
    });

    await this.eventBus.publish(event);
    console.log('[Demo] Password changed event published');
  }

  /**
   * 模擬 MFA 啟用
   */
  async simulateMFAEnable(): Promise<void> {
    const event = new MFAEnabledEvent({
      userId: 'user-123',
      email: 'demo@example.com',
      method: 'totp',
      backupCodesGenerated: 10,
      tenantId: 'tenant-1',
      enabledAt: new Date()
    });

    await this.eventBus.publish(event);
    console.log('[Demo] MFA enabled event published');
  }

  /**
   * 模擬 MFA 停用
   */
  async simulateMFADisable(): Promise<void> {
    const event = new MFADisabledEvent({
      userId: 'user-123',
      email: 'demo@example.com',
      reason: 'user_request',
      previousMethod: 'totp',
      tenantId: 'tenant-1',
      disabledAt: new Date()
    });

    await this.eventBus.publish(event);
    console.log('[Demo] MFA disabled event published');
  }

  /**
   * 模擬權限變更
   */
  async simulatePermissionChange(): Promise<void> {
    const event = new PermissionChangedEvent({
      userId: 'user-456',
      email: 'member@example.com',
      tenantId: 'tenant-1',
      changeType: 'grant',
      resourceType: 'blueprint',
      resourceId: 'blueprint-789',
      previousPermissions: ['read'],
      newPermissions: ['read', 'write', 'delete'],
      executedBy: 'admin-123',
      reason: 'Promoted to blueprint admin',
      changedAt: new Date()
    });

    await this.eventBus.publish(event);
    console.log('[Demo] Permission changed event published');
  }

  /**
   * 模擬角色變更
   */
  async simulateRoleChange(): Promise<void> {
    const event = new RoleChangedEvent({
      userId: 'user-456',
      email: 'member@example.com',
      tenantId: 'tenant-1',
      changeType: 'assign',
      previousRoles: ['member'],
      newRoles: ['member', 'admin'],
      executedBy: 'owner-123',
      reason: 'User promoted to admin',
      changedAt: new Date()
    });

    await this.eventBus.publish(event);
    console.log('[Demo] Role changed event published');
  }

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * 格式化時間戳
   */
  formatTime(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW');
  }
}
