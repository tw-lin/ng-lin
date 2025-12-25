/**
 * Finance Models - Simple payment and invoice tracking
 *
 * @module FinanceModels
 * @author GigHub Development Team
 * @date 2025-12-13
 */

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export interface FinanceRecord {
  id: string;
  blueprintId: string;
  type: 'payment' | 'invoice' | 'budget';
  title: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  dueDate?: Date;
  paidDate?: Date;
  description?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFinanceData {
  blueprintId: string;
  type: 'payment' | 'invoice' | 'budget';
  title: string;
  amount: number;
  currency: string;
  dueDate?: Date;
  description?: string;
  createdBy: string;
}

export interface UpdateFinanceData {
  title?: string;
  amount?: number;
  status?: PaymentStatus;
  dueDate?: Date;
  paidDate?: Date;
  description?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export interface FinanceQueryOptions {
  type?: 'payment' | 'invoice' | 'budget';
  status?: PaymentStatus;
  limit?: number;
}
