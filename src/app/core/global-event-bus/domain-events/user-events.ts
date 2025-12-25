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
  readonly eventType = 'user.registered' as const;

  constructor(payload: {
    user: User;
    provider: 'email' | 'google' | 'github' | 'anonymous';
  }) {
    super(payload, {
      aggregateId: payload.user.id,
      aggregateType: 'User',
      aggregateVersion: 1
    });
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
  readonly eventType = 'user.updated' as const;

  constructor(payload: {
    userId: string;
    changes: Partial<User>;
    previousValues: Partial<User>;
  }) {
    super(payload, {
      aggregateId: payload.userId,
      aggregateType: 'User'
    });
  }
}

/**
 * Event: User Login
 * 
 * Published when user successfully authenticates.
 */
export class UserLoginEvent extends DomainEvent<{
  userId: string;
  provider: string;
  ipAddress?: string;
  userAgent?: string;
}> {
  readonly eventType = 'user.login' as const;

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
  }
}

/**
 * Event: User Logout
 * 
 * Published when user logs out.
 */
export class UserLogoutEvent extends DomainEvent<{
  userId: string;
}> {
  readonly eventType = 'user.logout' as const;

  constructor(payload: { userId: string }) {
    super(payload, {
      aggregateId: payload.userId,
      aggregateType: 'User'
    });
  }
}

/**
 * Event: User Deleted
 * 
 * Published when user account is deleted.
 */
export class UserDeletedEvent extends DomainEvent<{
  userId: string;
  soft: boolean;
}> {
  readonly eventType = 'user.deleted' as const;

  constructor(payload: { userId: string; soft: boolean }) {
    super(payload, {
      aggregateId: payload.userId,
      aggregateType: 'User'
    });
  }
}
