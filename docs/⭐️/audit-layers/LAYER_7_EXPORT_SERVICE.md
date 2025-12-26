# Layer 7: Export Service (JSON/CSV/PDF Reports)

> **Purpose**: Export audit data in multiple formats (JSON, CSV, PDF) with customizable templates for compliance reports, executive summaries, and detailed audit trails.

## Overview

Layer 7 is the **export layer** that transforms query results into formatted reports for stakeholders. It supports 3 output formats and 8 pre-built report templates.

## Export Formats

### 1. JSON Export (Structured Data)

```typescript
export interface JSONExportOptions {
  format: 'json';
  pretty?: boolean;  // Pretty-print with indentation
  includeMetadata?: boolean;  // Include export metadata
  compression?: 'gzip' | 'none';
}

// Example usage
const options: JSONExportOptions = {
  format: 'json',
  pretty: true,
  includeMetadata: true,
  compression: 'none'
};

const file = await auditExportService.export(events, options);
// Result: audit_export_2025-12-26.json
```

**Output Format**:
```json
{
  "metadata": {
    "exportDate": "2025-12-26T01:00:00Z",
    "exportedBy": "user-123",
    "eventCount": 1250,
    "timeRange": {
      "start": "2025-12-01T00:00:00Z",
      "end": "2025-12-26T23:59:59Z"
    }
  },
  "events": [
    {
      "type": "user.action.task.created",
      "timestamp": "2025-12-15T10:30:00Z",
      "actor": "user-123",
      "actorType": "user",
      "blueprintId": "bp-456",
      "data": {
        "taskId": "task-789",
        "title": "Install plumbing"
      },
      "category": "user_action",
      "severity": "medium",
      "operation": "create",
      "entityType": "task"
    }
  ]
}
```

### 2. CSV Export (Tabular Data)

```typescript
export interface CSVExportOptions {
  format: 'csv';
  delimiter?: string;  // Default: ','
  includeHeaders?: boolean;  // Default: true
  flattenNested?: boolean;  // Flatten nested objects
  columns?: string[];  // Select specific columns
}

// Example usage
const options: CSVExportOptions = {
  format: 'csv',
  delimiter: ',',
  includeHeaders: true,
  flattenNested: true,
  columns: ['timestamp', 'actor', 'type', 'category', 'severity', 'operation']
};

const file = await auditExportService.export(events, options);
// Result: audit_export_2025-12-26.csv
```

**Output Format**:
```csv
timestamp,actor,type,category,severity,operation,data.taskId,data.title
2025-12-15T10:30:00Z,user-123,user.action.task.created,user_action,medium,create,task-789,Install plumbing
2025-12-16T14:15:00Z,user-456,user.action.task.updated,user_action,medium,update,task-789,Install plumbing
```

### 3. PDF Export (Formatted Reports)

```typescript
export interface PDFExportOptions {
  format: 'pdf';
  template: 'compliance' | 'executive' | 'detailed' | 'timeline' | 'actor' | 'entity' | 'security' | 'custom';
  includeCharts?: boolean;  // Include visualization charts
  includeSummary?: boolean;  // Include executive summary
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  customTemplate?: string;  // Custom HTML template
}

// Example usage
const options: PDFExportOptions = {
  format: 'pdf',
  template: 'compliance',
  includeCharts: true,
  includeSummary: true,
  pageSize: 'A4',
  orientation: 'portrait'
};

const file = await auditExportService.export(events, options);
// Result: audit_export_2025-12-26.pdf
```

## Pre-built Report Templates

### 1. Compliance Report Template

```typescript
// GDPR, HIPAA, SOC2, ISO27001 compliance reports
export interface ComplianceReportTemplate {
  title: string;
  complianceTags: ComplianceTag[];
  sections: Array<{
    title: string;
    content: string;
    events: ClassifiedAuditEvent[];
    charts?: ChartConfig[];
  }>;
  summary: {
    totalEvents: number;
    violations: number;
    complianceScore: number;  // 0-100
    recommendations: string[];
  };
}

// Example: GDPR Compliance Report
const report = await auditExportService.generateComplianceReport({
  complianceTags: [ComplianceTag.GDPR],
  startTime: new Date('2025-12-01'),
  endTime: new Date('2025-12-26'),
  blueprintId: 'bp-456'
});

// PDF Output includes:
// - Executive Summary
// - Data Access Logs (Article 30)
// - Consent Management (Article 7)
// - Data Portability Requests (Article 20)
// - Breach Notifications (Article 33)
// - Data Deletion Requests (Article 17)
```

### 2. Executive Summary Template

```typescript
export interface ExecutiveSummaryTemplate {
  title: string;
  period: { start: Date; end: Date };
  metrics: {
    totalEvents: number;
    securityIncidents: number;
    complianceViolations: number;
    userActions: number;
    aiDecisions: number;
  };
  topActors: Array<{ actor: string; eventCount: number }>;
  topCategories: Array<{ category: AuditEventCategory; eventCount: number }>;
  trends: {
    dailyAverage: number;
    peakDay: string;
    peakHour: number;
  };
  recommendations: string[];
}

// Example: Monthly Executive Summary
const report = await auditExportService.generateExecutiveSummary({
  startTime: new Date('2025-12-01'),
  endTime: new Date('2025-12-31'),
  blueprintId: 'bp-456'
});
```

### 3. Detailed Audit Trail Template

```typescript
// Chronological event listing with full details
export interface DetailedAuditTrailTemplate {
  title: string;
  entityType: AuditEntityType;
  entityId: string;
  events: ClassifiedAuditEvent[];
  timeline: Array<{
    timestamp: string;
    actor: string;
    operation: AuditOperation;
    changes: ChangeRecord[];
  }>;
}

// Example: Task Audit Trail
const report = await auditExportService.generateDetailedAuditTrail({
  entityType: AuditEntityType.TASK,
  entityId: 'task-789'
});
```

### 4. Timeline Report Template

```typescript
// Visual timeline with event markers
export interface TimelineReportTemplate {
  title: string;
  startTime: Date;
  endTime: Date;
  events: ClassifiedAuditEvent[];
  visualization: {
    timelineChart: ChartData;
    categoryBreakdown: ChartData;
    severityDistribution: ChartData;
  };
}
```

### 5. Actor Activity Report Template

```typescript
// User/team/partner activity summary
export interface ActorActivityTemplate {
  actorId: string;
  actorType: string;
  period: { start: Date; end: Date };
  activitySummary: {
    totalActions: number;
    byCategory: Record<AuditEventCategory, number>;
    byOperation: Record<AuditOperation, number>;
    mostActiveHours: number[];
  };
  events: ClassifiedAuditEvent[];
}
```

### 6. Entity Change History Template

```typescript
// Complete change history for a specific entity
export interface EntityChangeHistoryTemplate {
  entityType: AuditEntityType;
  entityId: string;
  changes: ChangeRecord[];
  visualDiff: {
    before: any;
    after: any;
    diff: DiffLine[];
  };
}
```

### 7. Security Incident Report Template

```typescript
// Security-focused report with threat analysis
export interface SecurityIncidentTemplate {
  incidentId: string;
  severity: AuditSeverity;
  category: 'breach' | 'unauthorized_access' | 'permission_violation' | 'anomaly';
  timeline: ClassifiedAuditEvent[];
  impactAnalysis: {
    affectedEntities: string[];
    potentialDamage: string;
    mitigationSteps: string[];
  };
}
```

### 8. AI Decision Audit Template

```typescript
// AI-specific audit with decision rationale
export interface AIDecisionAuditTemplate {
  period: { start: Date; end: Date };
  decisions: Array<{
    timestamp: string;
    decisionType: string;
    options: any[];
    selected: string;
    reasoning: string;
    confidence: number;
    guidelinesChecked: string[];
  }>;
  complianceSummary: {
    totalDecisions: number;
    guidelineViolations: number;
    averageConfidence: number;
  };
}
```

## Export Service Implementation

```typescript
// src/app/core/audit/export/audit-export.service.ts

@Injectable({ providedIn: 'root' })
export class AuditExportService {
  private queryService = inject(AuditQueryService);
  private logger = inject(LoggerService);

  /**
   * Export audit events in specified format
   */
  async export(
    events: ClassifiedAuditEvent[],
    options: JSONExportOptions | CSVExportOptions | PDFExportOptions
  ): Promise<Blob> {
    switch (options.format) {
      case 'json':
        return this.exportJSON(events, options);
      case 'csv':
        return this.exportCSV(events, options);
      case 'pdf':
        return this.exportPDF(events, options);
      default:
        throw new Error(`Unsupported export format: ${options['format']}`);
    }
  }

  /**
   * Export to JSON
   */
  private exportJSON(
    events: ClassifiedAuditEvent[],
    options: JSONExportOptions
  ): Blob {
    const data: any = { events };

    if (options.includeMetadata) {
      data.metadata = {
        exportDate: new Date().toISOString(),
        eventCount: events.length,
        timeRange: this.getTimeRange(events)
      };
    }

    const json = options.pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    if (options.compression === 'gzip') {
      // Implement gzip compression
      // For browser, consider using pako library
      throw new Error('GZIP compression not yet implemented');
    }

    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Export to CSV
   */
  private exportCSV(
    events: ClassifiedAuditEvent[],
    options: CSVExportOptions
  ): Blob {
    const delimiter = options.delimiter || ',';
    const columns = options.columns || this.getDefaultColumns();

    // Build CSV rows
    const rows: string[] = [];

    // Header row
    if (options.includeHeaders) {
      rows.push(columns.join(delimiter));
    }

    // Data rows
    for (const event of events) {
      const values = columns.map(col => {
        const value = this.getNestedValue(event, col);
        return this.escapeCsvValue(value, delimiter);
      });
      rows.push(values.join(delimiter));
    }

    const csv = rows.join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }

  /**
   * Export to PDF
   */
  private async exportPDF(
    events: ClassifiedAuditEvent[],
    options: PDFExportOptions
  ): Promise<Blob> {
    // Generate HTML from template
    const html = await this.generateHTMLFromTemplate(events, options);

    // Convert HTML to PDF
    // For browser, consider using jsPDF or html2pdf.js
    // For server, use Cloud Functions with Puppeteer
    
    // Placeholder: Return HTML as PDF
    return new Blob([html], { type: 'application/pdf' });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(query: {
    complianceTags: ComplianceTag[];
    startTime: Date;
    endTime: Date;
    blueprintId?: string;
  }): Promise<Blob> {
    // Query compliance events
    const events = await this.queryService.queryCompliance({
      ...query,
      includeViolations: true,
      groupBy: 'severity'
    });

    // Build compliance report
    const report = this.buildComplianceReport(events, query);

    // Export as PDF
    return this.exportPDF(report.events, {
      format: 'pdf',
      template: 'compliance',
      includeCharts: true,
      includeSummary: true,
      pageSize: 'A4',
      orientation: 'portrait'
    });
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(query: {
    startTime: Date;
    endTime: Date;
    blueprintId?: string;
  }): Promise<Blob> {
    // Query all events in period
    const events = await this.queryService.queryTimeline({
      startTime: query.startTime,
      endTime: query.endTime,
      blueprintId: query.blueprintId
    });

    // Build executive summary
    const summary = this.buildExecutiveSummary(events, query);

    // Export as PDF
    return this.exportPDF(events, {
      format: 'pdf',
      template: 'executive',
      includeCharts: true,
      includeSummary: true,
      pageSize: 'A4',
      orientation: 'landscape'
    });
  }

  /**
   * Generate detailed audit trail
   */
  async generateDetailedAuditTrail(query: {
    entityType: AuditEntityType;
    entityId: string;
  }): Promise<Blob> {
    // Query entity events
    const events = await this.queryService.queryByEntity({
      entityType: query.entityType,
      entityId: query.entityId
    });

    // Export as PDF
    return this.exportPDF(events, {
      format: 'pdf',
      template: 'detailed',
      includeCharts: false,
      includeSummary: true,
      pageSize: 'A4',
      orientation: 'portrait'
    });
  }

  // Helper methods
  private getTimeRange(events: ClassifiedAuditEvent[]): { start: string; end: string } {
    if (events.length === 0) {
      return { start: '', end: '' };
    }

    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    return {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString()
    };
  }

  private getDefaultColumns(): string[] {
    return [
      'timestamp',
      'actor',
      'actorType',
      'type',
      'category',
      'severity',
      'operation',
      'entityType',
      'entityId',
      'blueprintId'
    ];
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  private escapeCsvValue(value: any, delimiter: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);

    // Escape if contains delimiter, quote, or newline
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  private async generateHTMLFromTemplate(
    events: ClassifiedAuditEvent[],
    options: PDFExportOptions
  ): Promise<string> {
    // Load template
    const template = this.loadTemplate(options.template);

    // Render template with data
    const html = this.renderTemplate(template, {
      events,
      options,
      metadata: {
        exportDate: new Date().toISOString(),
        eventCount: events.length
      }
    });

    return html;
  }

  private loadTemplate(templateName: string): string {
    // Load HTML template from assets or inline
    // For now, return basic template
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audit Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          {{content}}
        </body>
      </html>
    `;
  }

  private renderTemplate(template: string, data: any): string {
    // Simple template rendering
    // For production, consider using a templating engine like Handlebars
    return template.replace('{{content}}', this.generateContent(data));
  }

  private generateContent(data: any): string {
    const { events, metadata } = data;

    let html = `
      <h1>Audit Report</h1>
      <p>Export Date: ${metadata.exportDate}</p>
      <p>Total Events: ${metadata.eventCount}</p>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Actor</th>
            <th>Type</th>
            <th>Category</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const event of events) {
      html += `
        <tr>
          <td>${event.timestamp}</td>
          <td>${event.actor}</td>
          <td>${event.type}</td>
          <td>${event.category}</td>
          <td>${event.severity}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
    `;

    return html;
  }

  private buildComplianceReport(events: any, query: any): any {
    // Build structured compliance report
    // Implementation omitted for brevity
    return { events };
  }

  private buildExecutiveSummary(events: ClassifiedAuditEvent[], query: any): any {
    // Build executive summary
    // Implementation omitted for brevity
    return { events };
  }
}
```

## Cloud Function for Server-Side PDF Generation

```typescript
// functions/src/audit-export.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';

export const generatePDFReport = functions.https.onCall(async (data, context) => {
  // Authenticate user
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { html, options } = data;

  // Launch headless browser
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set HTML content
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Generate PDF
  const pdf = await page.pdf({
    format: options.pageSize || 'A4',
    orientation: options.orientation || 'portrait',
    printBackground: true
  });

  await browser.close();

  // Upload to Cloud Storage
  const bucket = admin.storage().bucket();
  const filename = `audit_reports/${context.auth.uid}/${Date.now()}.pdf`;
  const file = bucket.file(filename);

  await file.save(pdf, {
    contentType: 'application/pdf',
    metadata: {
      metadata: {
        generatedBy: context.auth.uid,
        generatedAt: new Date().toISOString()
      }
    }
  });

  // Return download URL
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });

  return { downloadUrl: url };
});
```

## Success Criteria

✅ **Format Support**: JSON, CSV, PDF exports working
✅ **Template Library**: 8 pre-built templates available
✅ **Performance**: <5s for JSON/CSV, <30s for PDF (1000 events)
✅ **Quality**: Professional PDF reports with charts
✅ **Compliance**: GDPR, HIPAA, SOC2, ISO27001 reports
✅ **Customization**: Support for custom templates

## Related Documentation

- [Layer 6: Query Service](./LAYER_6_QUERY_SERVICE.md) - Query audit data
- [Layer 8: Review Workflow](./LAYER_8_REVIEW_WORKFLOW.md) - Report review process
- [Compliance Framework](../BEHAVIORAL_COMPLIANCE_FRAMEWORK.md) - Compliance requirements

---

**Status**: Design Complete, Implementation 0%
**Next Steps**: Implement AuditExportService with PDF generation
**Owner**: Audit System Team
**Last Updated**: 2025-12-26
