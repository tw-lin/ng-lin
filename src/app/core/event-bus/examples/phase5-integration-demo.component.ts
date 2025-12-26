/**
 * Phase 5 Integration Example
 * 
 * Demonstrates domain integration with all consumers working together.
 * 
 * @module Examples/Phase5Integration
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InMemoryEventBus } from '../implementations/in-memory/in-memory-event-bus';
import {
  TaskCreatedEvent,
  TaskAssignedEvent,
  TaskCompletedEvent,
  UserRegisteredEvent,
  BlueprintCreatedEvent,
  Task,
  User,
  Blueprint
} from '../domain-events';
import {
  NotificationConsumer,
  ActivityFeedConsumer,
  AnalyticsConsumer,
  AuditLogConsumer,
  SearchIndexConsumer
} from '../consumers';

/**
 * Phase 5 Integration Demo Component
 * 
 * Shows how domain events flow through all consumers:
 * 1. Event is published by service
 * 2. All subscribed consumers handle it
 * 3. Each consumer performs its specific task
 * 4. UI updates reactively via Signals
 */
@Component({
  selector: 'app-phase5-integration-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-container">
      <h1>Phase 5: Domain Integration Demo</h1>
      
      <!-- Actions -->
      <section class="actions">
        <h2>Actions</h2>
        <button (click)="createSampleTask()">Create Task</button>
        <button (click)="completeTask()">Complete Task</button>
        <button (click)="registerUser()">Register User</button>
        <button (click)="createBlueprint()">Create Blueprint</button>
      </section>
      
      <!-- Analytics Dashboard -->
      <section class="analytics">
        <h2>Analytics (Live)</h2>
        <div class="metrics">
          <div class="metric">
            <label>Total Events:</label>
            <value>{{ analytics.metrics().totalEvents }}</value>
          </div>
          <div class="metric">
            <label>Tasks Created:</label>
            <value>{{ analytics.metrics().taskMetrics.created }}</value>
          </div>
          <div class="metric">
            <label>Tasks Completed:</label>
            <value>{{ analytics.metrics().taskMetrics.completed }}</value>
          </div>
          <div class="metric">
            <label>Completion Rate:</label>
            <value>{{ analytics.getTaskCompletionRate() }}%</value>
          </div>
        </div>
        
        <h3>Top Event Types</h3>
        <ul>
          @for (item of analytics.topEventTypes(); track item.eventType) {
            <li>{{ item.eventType }}: {{ item.count }}</li>
          }
        </ul>
      </section>
      
      <!-- Activity Feed -->
      <section class="activity-feed">
        <h2>Activity Feed (Recent 10)</h2>
        <ul>
          @for (activity of recentActivities(); track activity.id) {
            <li>
              <span class="timestamp">{{ activity.timestamp | date:'short' }}</span>
              <span class="description">{{ activity.description }}</span>
            </li>
          }
        </ul>
      </section>
      
      <!-- Audit Log -->
      <section class="audit-log">
        <h2>Audit Log (Last 5)</h2>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
            </tr>
          </thead>
          <tbody>
            @for (log of recentAuditLogs(); track log.id) {
              <tr>
                <td>{{ log.timestamp | date:'short' }}</td>
                <td>{{ log.userId }}</td>
                <td>{{ log.action }}</td>
                <td>{{ log.resource }}:{{ log.resourceId }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
      
      <!-- Search Index -->
      <section class="search">
        <h2>Search Index</h2>
        <div class="search-stats">
          <div>Total Documents: {{ searchIndexer.getTotalDocuments() }}</div>
          <div>Tasks: {{ searchIndexer.getDocumentCountByType().task }}</div>
          <div>Blueprints: {{ searchIndexer.getDocumentCountByType().blueprint }}</div>
        </div>
        
        <div class="search-box">
          <input 
            #searchInput
            type="text" 
            placeholder="Search..." 
            (input)="performSearch(searchInput.value)"
          />
        </div>
        
        <ul class="search-results">
          @for (result of searchResults(); track result.id) {
            <li>
              <strong>{{ result.title }}</strong>
              <span class="type">{{ result.type }}</span>
              @if (result.description) {
                <p>{{ result.description }}</p>
              }
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    .actions button {
      margin: 5px;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .actions button:hover {
      background: #0056b3;
    }
    
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    
    .metric {
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .metric label {
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }
    
    .metric value {
      font-size: 24px;
      color: #007bff;
    }
    
    ul {
      list-style: none;
      padding: 0;
    }
    
    li {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
    
    .search-box input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    
    .search-results {
      margin-top: 20px;
    }
    
    .search-results .type {
      margin-left: 10px;
      padding: 3px 8px;
      background: #007bff;
      color: white;
      border-radius: 3px;
      font-size: 12px;
    }
  `]
})
export class Phase5IntegrationDemoComponent implements OnInit {
  private eventBus = inject(InMemoryEventBus);
  
  // Inject all consumers
  readonly notification = inject(NotificationConsumer);
  readonly activityFeed = inject(ActivityFeedConsumer);
  readonly analytics = inject(AnalyticsConsumer);
  readonly auditLog = inject(AuditLogConsumer);
  readonly searchIndexer = inject(SearchIndexConsumer);
  
  // Component state
  private taskCounter = signal(0);
  private currentTaskId = signal<string | null>(null);
  searchResults = signal<any[]>([]);
  
  // Computed values
  recentActivities = computed(() => {
    return this.activityFeed.activities().slice(0, 10);
  });
  
  recentAuditLogs = computed(() => {
    return this.auditLog.auditLogs().slice(-5).reverse();
  });
  
  async ngOnInit(): Promise<void> {
    console.log('[Phase5Demo] Initializing consumers...');
    
    // Initialize all consumers
    await Promise.all([
      this.notification.initialize(),
      this.activityFeed.initialize(),
      this.analytics.initialize(),
      this.auditLog.initialize(),
      this.searchIndexer.initialize()
    ]);
    
    console.log('[Phase5Demo] All consumers initialized ✓');
  }
  
  /**
   * Create a sample task
   */
  async createSampleTask(): Promise<void> {
    const taskId = `task-${this.taskCounter() + 1}`;
    this.taskCounter.update(c => c + 1);
    this.currentTaskId.set(taskId);
    
    const task: Task = {
      id: taskId,
      title: `Sample Task ${this.taskCounter()}`,
      description: `This is a demo task created at ${new Date().toLocaleTimeString()}`,
      status: 'pending',
      blueprintId: 'blueprint-demo',
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: 'medium',
      tags: ['demo', 'sample']
    };
    
    const event = new TaskCreatedEvent({
      task,
      userId: 'demo-user-1'
    });
    
    await this.eventBus.publish(event);
    console.log('[Phase5Demo] Task created:', taskId);
  }
  
  /**
   * Complete the current task
   */
  async completeTask(): Promise<void> {
    const taskId = this.currentTaskId();
    if (!taskId) {
      alert('Create a task first!');
      return;
    }
    
    const event = new TaskCompletedEvent({
      taskId,
      completedAt: new Date(),
      userId: 'demo-user-1'
    });
    
    await this.eventBus.publish(event);
    console.log('[Phase5Demo] Task completed:', taskId);
  }
  
  /**
   * Register a new user
   */
  async registerUser(): Promise<void> {
    const userId = `user-${Date.now()}`;
    
    const user: User = {
      id: userId,
      email: `${userId}@example.com`,
      displayName: `Demo User ${userId.slice(-4)}`,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const event = new UserRegisteredEvent({
      user,
      provider: 'email'
    });
    
    await this.eventBus.publish(event);
    console.log('[Phase5Demo] User registered:', userId);
  }
  
  /**
   * Create a new blueprint
   */
  async createBlueprint(): Promise<void> {
    const blueprintId = `blueprint-${Date.now()}`;
    
    const blueprint: Blueprint = {
      id: blueprintId,
      name: `Demo Blueprint ${blueprintId.slice(-4)}`,
      description: 'A sample blueprint for testing',
      ownerType: 'user',
      ownerId: 'demo-user-1',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const event = new BlueprintCreatedEvent({
      blueprint,
      userId: 'demo-user-1'
    });
    
    await this.eventBus.publish(event);
    console.log('[Phase5Demo] Blueprint created:', blueprintId);
  }
  
  /**
   * Perform search
   */
  performSearch(query: string): void {
    if (!query || query.length < 2) {
      this.searchResults.set([]);
      return;
    }
    
    const results = this.searchIndexer.search(query);
    this.searchResults.set(results);
    console.log('[Phase5Demo] Search results:', results.length);
  }
}
