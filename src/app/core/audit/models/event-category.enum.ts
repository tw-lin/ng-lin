/**
 * Event Category Enum
 * 
 * Defines 11 top-level categories for audit events aligned with GitHub Master System.
 * Used by the Classification Engine (Layer 4) for automatic event categorization.
 * 
 * @see docs/⭐️/audit-layers/LAYER_4_CLASSIFICATION_ENGINE.md
 * @see docs/⭐️/audit-schemas/SCHEMA_REGISTRY.md
 */
export enum AuditCategory {
  /**
   * Authentication events (login, logout, MFA, session management)
   * Examples: user.login, user.logout, session.expired
   */
  AUTHENTICATION = 'AUTHENTICATION',
  
  /**
   * Authorization events (permission checks, role assignments, access denials)
   * Examples: user.permission.granted, user.permission.denied, role.assigned
   */
  AUTHORIZATION = 'AUTHORIZATION',
  
  /**
   * User-initiated actions (UI interactions, API calls, command execution)
   * Examples: task.created, blueprint.updated, file.uploaded
   */
  USER_ACTION = 'USER_ACTION',
  
  /**
   * Data access events (read operations, queries, data retrieval)
   * Examples: data.read, query.executed, report.generated
   */
  DATA_ACCESS = 'DATA_ACCESS',
  
  /**
   * Data modification events (create, update, delete operations)
   * Examples: record.created, record.updated, record.deleted
   */
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  
  /**
   * System-level events (startup, shutdown, configuration changes)
   * Examples: system.started, config.changed, service.restarted
   */
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  
  /**
   * AI decision events (architectural decisions, refactoring, code generation)
   * Novel category for AI transparency and accountability
   * Examples: ai.decision.architectural, ai.code.generated, ai.refactoring.suggested
   */
  AI_DECISION = 'AI_DECISION',
  
  /**
   * Security incidents (intrusion attempts, policy violations, anomalies)
   * Examples: intrusion.detected, policy.violated, anomaly.detected
   */
  SECURITY_INCIDENT = 'SECURITY_INCIDENT',
  
  /**
   * Compliance events (GDPR, HIPAA, SOC2, audit trail requirements)
   * Examples: gdpr.data.access, hipaa.phi.accessed, soc2.audit.triggered
   */
  COMPLIANCE_EVENT = 'COMPLIANCE_EVENT',
  
  /**
   * Performance issues (slow queries, resource exhaustion, timeouts)
   * Examples: query.slow, memory.exhausted, timeout.occurred
   */
  PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE',
  
  /**
   * Errors and exceptions (application errors, system failures, crashes)
   * Examples: exception.thrown, service.failed, database.connection.lost
   */
  ERROR_EXCEPTION = 'ERROR_EXCEPTION'
}
