# Layer 8: Review Workflow (Compliance Review Process)

> **Purpose**: Provide structured workflow for reviewing audit events, compliance reports, and security incidents with multi-stage approval process.

## Overview

Layer 8 is the **review layer** that enables human oversight of audit data through a 4-stage workflow: Submission → Review → Approval → Archive. It ensures compliance requirements are met and anomalies are addressed.

## Review Workflow Stages

### Stage 1: Submission
**Purpose**: Create review tasks for compliance reports, security incidents, or anomaly alerts.

```typescript
export interface ReviewSubmission {
  id: string;
  type: 'compliance_report' | 'security_incident' | 'anomaly_alert' | 'audit_trail' | 'ai_decision';
  title: string;
  description: string;
  blueprintId?: string;
  submittedBy: string;
  submittedAt: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: Date;
  
  // Reference to source data
  eventIds?: string[];
  reportId?: string;
  queryParams?: any;
  
  // Attachments
  attachments: Array<{
    filename: string;
    url: string;
    format: 'json' | 'csv' | 'pdf';
  }>;
  
  // Current stage
  stage: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'archived';
  
  // Workflow metadata
  workflow: {
    assignedTo?: string;
    reviewStartedAt?: Date;
    reviewCompletedAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    rejectedBy?: string;
    rejectedAt?: Date;
    rejectionReason?: string;
  };
}
```

**Triggers for Auto-Submission**:
- Compliance report generated (quarterly, annual)
- Security incident detected (critical severity)
- Anomaly detection threshold exceeded
- Manual submission by auditor

### Stage 2: Review
**Purpose**: Assigned reviewer examines the submission and events.

```typescript
export interface ReviewTask {
  submissionId: string;
  assignedTo: string;
  assignedAt: Date;
  dueDate: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Review progress
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  
  // Review checklist
  checklist: Array<{
    id: string;
    item: string;
    completed: boolean;
    notes?: string;
  }>;
  
  // Reviewer notes
  notes: string;
  
  // Findings
  findings: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
    eventIds?: string[];
  }>;
  
  // Decision
  decision: 'approve' | 'reject' | 'request_changes';
  decisionReason?: string;
}
```

**Review Checklist Examples**:

**For Compliance Reports**:
- [ ] All required events are included
- [ ] No gaps in event coverage
- [ ] Compliance tags are accurate
- [ ] Violations are documented
- [ ] Remediation plans are included
- [ ] Report meets regulatory standards

**For Security Incidents**:
- [ ] Incident timeline is accurate
- [ ] Root cause identified
- [ ] Impact assessment completed
- [ ] Mitigation steps documented
- [ ] Lessons learned recorded
- [ ] Stakeholders notified

**For Anomaly Alerts**:
- [ ] Anomaly is confirmed (not false positive)
- [ ] Severity level is appropriate
- [ ] Root cause investigated
- [ ] Corrective actions identified
- [ ] Follow-up monitoring planned

### Stage 3: Approval
**Purpose**: Final approval or rejection by authorized approver.

```typescript
export interface ReviewApproval {
  submissionId: string;
  reviewTaskId: string;
  approver: string;
  approvedAt: Date;
  decision: 'approved' | 'rejected' | 'conditional';
  
  // Approval conditions (if conditional)
  conditions?: Array<{
    description: string;
    dueDate: Date;
    responsible: string;
  }>;
  
  // Approval notes
  notes: string;
  
  // Digital signature (if required)
  signature?: {
    signedBy: string;
    signedAt: Date;
    signatureData: string; // Base64 encoded signature
  };
  
  // Next steps
  nextSteps?: string[];
}
```

### Stage 4: Archive
**Purpose**: Archive approved reviews for long-term retention.

```typescript
export interface ArchivedReview {
  submissionId: string;
  archivedAt: Date;
  archivedBy: string;
  retentionPeriod: number; // Days
  deleteAfter: Date;
  
  // Archive location
  storage: {
    bucket: string;
    path: string;
    encrypted: boolean;
  };
  
  // Audit trail
  auditTrail: Array<{
    timestamp: Date;
    actor: string;
    action: string;
    notes?: string;
  }>;
}
```

## Review Workflow Service

```typescript
// src/app/core/audit/review/audit-review.service.ts

@Injectable({ providedIn: 'root' })
export class AuditReviewService {
  private firestore = inject(Firestore);
  private logger = inject(LoggerService);
  private notificationService = inject(NotificationService);

  /**
   * Submit a review request
   */
  async submitReview(submission: Omit<ReviewSubmission, 'id'>): Promise<ReviewSubmission> {
    const id = this.generateReviewId();
    
    const review: ReviewSubmission = {
      id,
      ...submission,
      stage: 'submitted',
      submittedAt: new Date(),
      workflow: {}
    };

    // Save to Firestore
    await addDoc(collection(this.firestore, 'audit_reviews'), review);

    // Notify assigned reviewer (if pre-assigned)
    if (submission.workflow?.assignedTo) {
      await this.notificationService.send({
        recipient: submission.workflow.assignedTo,
        type: 'review_assigned',
        subject: `New Review: ${submission.title}`,
        message: `You have been assigned a new review with ${submission.priority} priority.`,
        link: `/audit/reviews/${id}`
      });
    }

    this.logger.info('Review submitted', { id, type: submission.type, priority: submission.priority });

    return review;
  }

  /**
   * Assign review to reviewer
   */
  async assignReview(submissionId: string, assignedTo: string, dueDate: Date): Promise<ReviewTask> {
    const submission = await this.getSubmission(submissionId);

    const task: ReviewTask = {
      submissionId,
      assignedTo,
      assignedAt: new Date(),
      dueDate,
      priority: submission.priority,
      status: 'pending',
      checklist: this.getChecklistForType(submission.type),
      notes: '',
      findings: [],
      decision: 'approve'
    };

    // Update submission stage
    await updateDoc(doc(this.firestore, 'audit_reviews', submissionId), {
      stage: 'in_review',
      'workflow.assignedTo': assignedTo,
      'workflow.reviewStartedAt': new Date()
    });

    // Save task
    await addDoc(collection(this.firestore, 'audit_review_tasks'), task);

    // Notify reviewer
    await this.notificationService.send({
      recipient: assignedTo,
      type: 'review_assigned',
      subject: `Review Assigned: ${submission.title}`,
      message: `You have been assigned to review "${submission.title}". Due: ${dueDate.toLocaleDateString()}`,
      link: `/audit/reviews/${submissionId}`
    });

    this.logger.info('Review assigned', { submissionId, assignedTo, dueDate });

    return task;
  }

  /**
   * Update review task
   */
  async updateReviewTask(taskId: string, updates: Partial<ReviewTask>): Promise<void> {
    await updateDoc(doc(this.firestore, 'audit_review_tasks', taskId), updates);
    
    this.logger.info('Review task updated', { taskId, updates });
  }

  /**
   * Complete review task
   */
  async completeReviewTask(
    taskId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    decisionReason: string
  ): Promise<void> {
    const task = await this.getReviewTask(taskId);

    // Update task
    await updateDoc(doc(this.firestore, 'audit_review_tasks', taskId), {
      status: 'completed',
      completedAt: new Date(),
      decision,
      decisionReason
    });

    // Update submission
    const newStage = decision === 'approve' ? 'approved' : 'rejected';
    await updateDoc(doc(this.firestore, 'audit_reviews', task.submissionId), {
      stage: newStage,
      'workflow.reviewCompletedAt': new Date(),
      ...(decision === 'approve' && {
        'workflow.approvedBy': task.assignedTo,
        'workflow.approvedAt': new Date()
      }),
      ...(decision === 'reject' && {
        'workflow.rejectedBy': task.assignedTo,
        'workflow.rejectedAt': new Date(),
        'workflow.rejectionReason': decisionReason
      })
    });

    // Notify submitter
    const submission = await this.getSubmission(task.submissionId);
    await this.notificationService.send({
      recipient: submission.submittedBy,
      type: decision === 'approve' ? 'review_approved' : 'review_rejected',
      subject: `Review ${decision === 'approve' ? 'Approved' : 'Rejected'}: ${submission.title}`,
      message: decisionReason,
      link: `/audit/reviews/${task.submissionId}`
    });

    this.logger.info('Review task completed', { taskId, decision });

    // If approved, proceed to archival
    if (decision === 'approve') {
      await this.archiveReview(task.submissionId);
    }
  }

  /**
   * Archive approved review
   */
  async archiveReview(submissionId: string): Promise<ArchivedReview> {
    const submission = await this.getSubmission(submissionId);

    const archived: ArchivedReview = {
      submissionId,
      archivedAt: new Date(),
      archivedBy: submission.workflow.approvedBy!,
      retentionPeriod: this.getRetentionPeriod(submission.type),
      deleteAfter: new Date(Date.now() + this.getRetentionPeriod(submission.type) * 24 * 60 * 60 * 1000),
      storage: {
        bucket: 'audit-archives',
        path: `${submission.type}/${submissionId}.json`,
        encrypted: true
      },
      auditTrail: [
        {
          timestamp: submission.submittedAt,
          actor: submission.submittedBy,
          action: 'submitted'
        },
        {
          timestamp: submission.workflow.reviewStartedAt!,
          actor: submission.workflow.assignedTo!,
          action: 'review_started'
        },
        {
          timestamp: submission.workflow.approvedAt!,
          actor: submission.workflow.approvedBy!,
          action: 'approved'
        },
        {
          timestamp: new Date(),
          actor: submission.workflow.approvedBy!,
          action: 'archived'
        }
      ]
    };

    // Update submission stage
    await updateDoc(doc(this.firestore, 'audit_reviews', submissionId), {
      stage: 'archived'
    });

    // Save archive record
    await addDoc(collection(this.firestore, 'audit_review_archives'), archived);

    // Export and upload to Cloud Storage
    await this.exportToStorage(submission, archived);

    this.logger.info('Review archived', { submissionId });

    return archived;
  }

  /**
   * Get submission by ID
   */
  private async getSubmission(id: string): Promise<ReviewSubmission> {
    const docRef = doc(this.firestore, 'audit_reviews', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Review submission not found: ${id}`);
    }

    return snapshot.data() as ReviewSubmission;
  }

  /**
   * Get review task by ID
   */
  private async getReviewTask(id: string): Promise<ReviewTask> {
    const docRef = doc(this.firestore, 'audit_review_tasks', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Review task not found: ${id}`);
    }

    return snapshot.data() as ReviewTask;
  }

  /**
   * Get checklist for review type
   */
  private getChecklistForType(type: ReviewSubmission['type']): ReviewTask['checklist'] {
    switch (type) {
      case 'compliance_report':
        return [
          { id: 'c1', item: 'All required events are included', completed: false },
          { id: 'c2', item: 'No gaps in event coverage', completed: false },
          { id: 'c3', item: 'Compliance tags are accurate', completed: false },
          { id: 'c4', item: 'Violations are documented', completed: false },
          { id: 'c5', item: 'Remediation plans are included', completed: false },
          { id: 'c6', item: 'Report meets regulatory standards', completed: false }
        ];
      
      case 'security_incident':
        return [
          { id: 's1', item: 'Incident timeline is accurate', completed: false },
          { id: 's2', item: 'Root cause identified', completed: false },
          { id: 's3', item: 'Impact assessment completed', completed: false },
          { id: 's4', item: 'Mitigation steps documented', completed: false },
          { id: 's5', item: 'Lessons learned recorded', completed: false },
          { id: 's6', item: 'Stakeholders notified', completed: false }
        ];
      
      case 'anomaly_alert':
        return [
          { id: 'a1', item: 'Anomaly is confirmed (not false positive)', completed: false },
          { id: 'a2', item: 'Severity level is appropriate', completed: false },
          { id: 'a3', item: 'Root cause investigated', completed: false },
          { id: 'a4', item: 'Corrective actions identified', completed: false },
          { id: 'a5', item: 'Follow-up monitoring planned', completed: false }
        ];
      
      default:
        return [];
    }
  }

  /**
   * Get retention period for review type (days)
   */
  private getRetentionPeriod(type: ReviewSubmission['type']): number {
    switch (type) {
      case 'compliance_report': return 2555; // 7 years
      case 'security_incident': return 2555; // 7 years
      case 'anomaly_alert': return 365; // 1 year
      case 'audit_trail': return 365; // 1 year
      case 'ai_decision': return 365; // 1 year
      default: return 365;
    }
  }

  /**
   * Export review to Cloud Storage
   */
  private async exportToStorage(
    submission: ReviewSubmission,
    archived: ArchivedReview
  ): Promise<void> {
    // Export submission and related data to JSON
    const exportData = {
      submission,
      archived,
      timestamp: new Date().toISOString()
    };

    // Upload to Cloud Storage
    // Implementation depends on storage service
    this.logger.info('Review exported to storage', {
      submissionId: submission.id,
      path: archived.storage.path
    });
  }

  private generateReviewId(): string {
    return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Review Dashboard Components

### 1. Review List Component

```typescript
@Component({
  selector: 'app-audit-review-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="review-list">
      <nz-table [nzData]="reviews()" [nzLoading]="loading()">
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Stage</th>
            <th>Submitted</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (review of reviews(); track review.id) {
            <tr>
              <td>{{ review.type }}</td>
              <td>{{ review.title }}</td>
              <td><nz-tag [nzColor]="getPriorityColor(review.priority)">{{ review.priority }}</nz-tag></td>
              <td><nz-tag [nzColor]="getStageColor(review.stage)">{{ review.stage }}</nz-tag></td>
              <td>{{ review.submittedAt | date }}</td>
              <td>{{ review.dueDate | date }}</td>
              <td>
                <button nz-button nzType="link" (click)="openReview(review)">View</button>
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
    </div>
  `
})
export class AuditReviewListComponent {
  private reviewService = inject(AuditReviewService);
  
  loading = signal(false);
  reviews = signal<ReviewSubmission[]>([]);
  
  ngOnInit(): void {
    this.loadReviews();
  }
  
  async loadReviews(): Promise<void> {
    this.loading.set(true);
    try {
      // Load reviews from Firestore
      const reviews = await this.reviewService.getMyReviews();
      this.reviews.set(reviews);
    } finally {
      this.loading.set(false);
    }
  }
  
  openReview(review: ReviewSubmission): void {
    // Navigate to review detail
  }
  
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  }
  
  getStageColor(stage: string): string {
    switch (stage) {
      case 'submitted': return 'blue';
      case 'in_review': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'archived': return 'default';
      default: return 'default';
    }
  }
}
```

### 2. Review Detail Component

```typescript
@Component({
  selector: 'app-audit-review-detail',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="review-detail">
      <h2>{{ submission().title }}</h2>
      
      <nz-descriptions nzBordered>
        <nz-descriptions-item nzTitle="Type">{{ submission().type }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Priority">{{ submission().priority }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Stage">{{ submission().stage }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Submitted By">{{ submission().submittedBy }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Submitted At">{{ submission().submittedAt | date }}</nz-descriptions-item>
      </nz-descriptions>
      
      <h3>Checklist</h3>
      <nz-list [nzDataSource]="task().checklist" nzBordered>
        <nz-list-item *ngFor="let item of task().checklist">
          <label nz-checkbox [(ngModel)]="item.completed">{{ item.item }}</label>
        </nz-list-item>
      </nz-list>
      
      <h3>Notes</h3>
      <textarea nz-input [(ngModel)]="task().notes" [nzAutosize]="{ minRows: 4 }"></textarea>
      
      <div class="actions">
        <button nz-button nzType="primary" (click)="approve()">Approve</button>
        <button nz-button nzType="default" (click)="reject()">Reject</button>
        <button nz-button nzType="default" (click)="requestChanges()">Request Changes</button>
      </div>
    </div>
  `
})
export class AuditReviewDetailComponent {
  private reviewService = inject(AuditReviewService);
  private route = inject(ActivatedRoute);
  
  submission = signal<ReviewSubmission>({} as any);
  task = signal<ReviewTask>({} as any);
  
  ngOnInit(): void {
    const submissionId = this.route.snapshot.paramMap.get('id');
    if (submissionId) {
      this.loadReview(submissionId);
    }
  }
  
  async loadReview(submissionId: string): Promise<void> {
    const [submission, task] = await Promise.all([
      this.reviewService.getSubmission(submissionId),
      this.reviewService.getReviewTaskForSubmission(submissionId)
    ]);
    
    this.submission.set(submission);
    this.task.set(task);
  }
  
  async approve(): Promise<void> {
    await this.reviewService.completeReviewTask(
      this.task().submissionId,
      'approve',
      'Review completed successfully'
    );
  }
  
  async reject(): Promise<void> {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      await this.reviewService.completeReviewTask(
        this.task().submissionId,
        'reject',
        reason
      );
    }
  }
  
  async requestChanges(): Promise<void> {
    const changes = prompt('Requested changes:');
    if (changes) {
      await this.reviewService.completeReviewTask(
        this.task().submissionId,
        'request_changes',
        changes
      );
    }
  }
}
```

## Success Criteria

✅ **Workflow Stages**: 4-stage review workflow implemented
✅ **Automation**: Auto-submission for critical events
✅ **Checklists**: Type-specific review checklists
✅ **Notifications**: Email/in-app notifications for assignments
✅ **Audit Trail**: Complete audit trail for all reviews
✅ **Archival**: Automatic archival with retention policies

## Related Documentation

- [Layer 7: Export Service](./LAYER_7_EXPORT_SERVICE.md) - Report generation
- [Compliance Framework](../BEHAVIORAL_COMPLIANCE_FRAMEWORK.md) - Compliance requirements
- [Integration Map](../audit-architecture/INTEGRATION_MAP.md) - Layer integration

---

**Status**: Design Complete, Implementation 0%
**Next Steps**: Implement AuditReviewService and review UI components
**Owner**: Audit System Team
**Last Updated**: 2025-12-26
