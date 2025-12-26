/**
 * User Domain Events
 *
 * Defines all events related to user lifecycle and operations.
 *
 * @module DomainEvents/User
 */

import { DomainEvent } from '../models/base-event';

/**
 * User payload interface
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName?: string;
  readonly photoURL?: string;
  readonly role: 'admin' | 'user' | 'guest';
  readonly status: 'active' | 'suspended' | 'deleted';
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt?: Date;
}

/**
 * Event: User Registered
 *
 * Published when a new user registers in the system.
 */
export class UserRegisteredEvent extends DomainEvent<{
  user: User;
  provider: 'email' | 'google' | 'github' | 'anonymous';
}> {
  override readonly eventType = 'user.registered' as const;
  override readonly payload: {
    user: User;
    provider: 'email' | 'google' | 'github' | 'anonymous';
  };

  constructor(payload: { user: User; provider: 'email' | 'google' | 'github' | 'anonymous' }) {
    super(payload, {
      aggregateId: payload.user.id,
      aggregateType: 'User',
      aggregateVersion: 1
    });
    this.payload = payload;
  }
}

/**
 * Event: User Updated
 *
 * Published when user profile is updated.
 */
export class UserUpdatedEvent extends DomainEvent<{
  userId: string;
  changes: Partial<User>;
  previousValues: Partial<User>;
}> {
  override readonly eventType = 'user.updated' as const;
  override readonly payload: {
    userId: string;
    changes: Partial<User>;
    previousValues: Partial<User>;
  };

  constructor(payload: { userId: string; changes: Partial<User>; previousValues: Partial<User> }) {
    super(payload, {
      aggregateId: payload.userId,
      aggregateType: 'User'
    });
    this.payload = payload;
  }
}

/**
 * Event: User Login
 *
 * Published when user successfully authenticates.
 *
 * NOTE: This is a deprecated simplified version.
 * For detailed auth events with provider info, session tracking, and security metadata,
 * use UserLoginEvent from auth-events.ts (auth.user.login).
 *
 * @deprecated Use UserLoginEvent from auth-events.ts for authentication tracking
 */
// Commented out to avoid duplicate exports - use auth-events.ts version
/*
export class UserLoginEvent extends DomainEvent<{
  userId: string;
  provider: string;
  ipAddress?: string;
  userAgent?: string;
}> {
  override readonly eventType = 'user.login' as const;
  override readonly payload: {
    userId: string;
    provider: string;
    ipAddress?: string;
    userAgent?: string;
  };

  constructor(payload: {
    userId: string;
    provider: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    super(payload, {
      aggregateId: payload.userId,
      aggregateType: 'User'
    });
    this.payload = payload;
  }
}
*/

/**
 * Event: User Logout
 *
 * Published when user logs out.
 *
 * NOTE: This is a deprecated simplified version.
 * For detailed logout events with session duration and security context,
 * use UserLogoutEvent from auth-events.ts (auth.user.logout).
 *
 * @deprecated Use UserLogoutEvent from auth-events.ts for authentication tracking
 */
// Commented out to avoid duplicate exports - use auth-events.ts version
/*
export class UserLogoutEvent extends DomainEvent<{
  userId: string;
}> {
  override readonly eventType = 'user.logout' as const;
  override readonly payload: { userId: string };

  constructor(payload: { userId: string }) {
    super(payload, {
      aggregateId: payload.userId,
      aggregateType: 'User'
    });
    this.payload = payload;
  }
}
*/

/**
 * Event: User Deleted
 *
 * Published when user account is deleted.
 */
export class UserDeletedEvent extends DomainEvent<{
  userId: string;
  soft: boolean;
}> {
  override readonly eventType = 'user.deleted' as const;
  override readonly payload: { userId: string; soft: boolean };

  constructor(payload: { userId: string; soft: boolean }) {
    super(payload, {
      aggregateId: payload.userId,
      aggregateType: 'User'
    });
    this.payload = payload;
  }
}
