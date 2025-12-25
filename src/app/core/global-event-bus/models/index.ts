export * from './base-event';
export * from './event-metadata';
export * from './event-envelope';
export * from './subscription';
// Export audit event model first (canonical source for AuditLevel and AuditCategory)
export * from './audit-event.model'; // Phase 7B: Global Audit Event Model
// Re-export auth and permission models
export type {
  AuthAuditEvent,
  LoginAuditEvent,
  LogoutAuditEvent,
  LoginFailedAuditEvent,
  PasswordChangedAuditEvent,
  MFAEnabledAuditEvent,
  MFADisabledAuditEvent,
  TokenRefreshedAuditEvent,
  SessionExpiredAuditEvent,
  EmailVerifiedAuditEvent
} from './auth-audit-event.model';
export type {
  PermissionAuditEvent,
  PermissionGrantedAuditEvent,
  PermissionRevokedAuditEvent,
  PermissionUpdatedAuditEvent,
  RoleAssignedAuditEvent,
  RoleUnassignedAuditEvent,
  RoleUpdatedAuditEvent,
  PermissionChangeDiff
} from './permission-audit-event.model';
export { PermissionActionType, RoleActionType } from './permission-audit-event.model';
export { AuthAuditEventBuilder } from './auth-audit-event.model';
export { PermissionAuditEventBuilder } from './permission-audit-event.model';
