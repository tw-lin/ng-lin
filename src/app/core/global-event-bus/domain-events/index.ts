/**
 * Domain Events
 * 
 * Central export for all domain event definitions.
 * 
 * Export Order Matters:
 * - Auth events exported first (contains UserLoginEvent, UserLogoutEvent with rich auth context)
 * - User events exported after (lifecycle events only, auth events commented out to avoid conflicts)
 * 
 * @module DomainEvents
 */

// Auth Events (includes UserLoginEvent, UserLogoutEvent for authentication tracking)
export * from './auth-events';

// Task Events
export * from './task-events';

// User Events (UserLoginEvent/UserLogoutEvent deprecated - use auth-events versions)
export * from './user-events';

// Blueprint Events
export * from './blueprint-events';
