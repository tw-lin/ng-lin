/**
 * Organization Member Store
 * 
 * Three-Layer Architecture:
 * UI (Component) → State Management (Store) → Data Access (Repository)
 * 
 * This store manages organization member state and coordinates repository operations.
 */

import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { 
  OrganizationMemberRepository, 
  OrganizationInvitationRepository,
  NotificationRepository,
  AccountRepository 
} from '@core/repositories';
import { OrganizationMember, NotificationType, InvitationStatus } from '@core';

@Injectable({
  providedIn: 'root'
})
export class OrganizationMemberStore {
  private readonly memberRepository = inject(OrganizationMemberRepository);
  private readonly invitationRepository = inject(OrganizationInvitationRepository);
  private readonly notificationRepository = inject(NotificationRepository);
  private readonly accountRepository = inject(AccountRepository);

  // Private writable signals
  private readonly _members = signal<OrganizationMember[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<Error | null>(null);
  private readonly _inviteLoading = signal(false);
  private readonly _inviteError = signal<string | null>(null);

  // Public readonly signals
  readonly members = this._members.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly inviteLoading = this._inviteLoading.asReadonly();
  readonly inviteError = this._inviteError.asReadonly();

  /**
   * Load organization members from repository
   */
  async loadMembers(organizationId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const members = await firstValueFrom(this.memberRepository.findByOrganization(organizationId));
      this._members.set(members);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to load members');
      this._error.set(err);
      console.error('[OrganizationMemberStore] Failed to load members', error);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Send invitation to new member
   */
  async sendInvitation(organizationId: string, email: string, senderId: string): Promise<void> {
    this._inviteLoading.set(true);
    this._inviteError.set(null);

    try {
      // Create invitation record
      await this.invitationRepository.create({
        email,
        organization_id: organizationId,
        status: InvitationStatus.Pending,
        sent_at: new Date().toISOString(),
        sent_by: senderId
      });

      // Check if account exists and send notification
      const account = await this.accountRepository.findByEmail(email);
      
      if (account) {
        // Send notification to existing user
        await this.notificationRepository.create({
          type: NotificationType.OrganizationInvitation,
          recipient_id: account.id,
          title: '組織邀請',
          message: `您收到加入組織的邀請`,
          created_at: new Date().toISOString(),
          read: false
        });
      }

      // Send notification to sender
      await this.notificationRepository.create({
        type: NotificationType.System,
        recipient_id: senderId,
        title: '邀請已送出',
        message: `已向 ${email} 發送組織邀請`,
        created_at: new Date().toISOString(),
        read: false
      });

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : '邀請送出失敗，請稍後再試';
      this._inviteError.set(errorMsg);
      console.error('[OrganizationMemberStore] Failed to send invitation', error);
      throw error;
    } finally {
      this._inviteLoading.set(false);
    }
  }

  /**
   * Clear invitation error
   */
  clearInviteError(): void {
    this._inviteError.set(null);
  }

  /**
   * Reset store state
   */
  reset(): void {
    this._members.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._inviteLoading.set(false);
    this._inviteError.set(null);
  }
}
