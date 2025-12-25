import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { Partner, PartnerMember } from '../models';
import { PartnerRepository } from '../repositories';
import { PartnerRole } from '../types';

@Injectable({
  providedIn: 'root'
})
export class PartnerStore {
  private readonly repository = inject(PartnerRepository);

  private readonly _partners = signal<Partner[]>([]);
  private readonly _members = signal<PartnerMember[]>([]);
  private readonly _loading = signal(false);

  readonly partners = this._partners.asReadonly();
  readonly loading = this._loading.asReadonly();

  getMemberCount(partnerId: string): number {
    return this._members().filter(m => m.partner_id === partnerId).length;
  }

  currentPartnerMembers(): PartnerMember[] {
    return this._members();
  }

  async loadPartners(organizationId: string): Promise<void> {
    this._loading.set(true);
    try {
      const partners = await firstValueFrom(this.repository.findByOrganization(organizationId));
      this._partners.set(partners ?? []);
    } catch (error: unknown) {
      console.error('[PartnerStore] Failed to load partners', error);
      this._partners.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  async createPartner(payload: Omit<Partner, 'id'>): Promise<Partner> {
    const partner: Partner = { ...payload, id: uuidv4(), created_at: payload.created_at ?? new Date().toISOString() };
    this._partners.update(list => [...list, partner]);
    return partner;
  }

  async updatePartner(id: string, payload: Partial<Partner>): Promise<void> {
    this._partners.update(list => list.map(partner => (partner.id === id ? { ...partner, ...payload } : partner)));
  }

  async deletePartner(id: string): Promise<void> {
    this._partners.update(list => list.filter(partner => partner.id !== id));
    this._members.update(list => list.filter(member => member.partner_id !== id));
  }

  async loadMembers(partnerId: string): Promise<void> {
    // Placeholder: no backend yet
    this._members.set(this._members().filter(m => m.partner_id === partnerId));
  }

  async addMember(partnerId: string, userId: string, role: PartnerRole): Promise<void> {
    const member: PartnerMember = {
      id: uuidv4(),
      partner_id: partnerId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString()
    };
    this._members.update(list => [...list, member]);
  }

  async updateMemberRole(memberId: string, partnerId: string, role: PartnerRole): Promise<void> {
    this._members.update(list =>
      list.map(member => (member.id === memberId && member.partner_id === partnerId ? { ...member, role } : member))
    );
  }

  async removeMember(memberId: string, partnerId: string): Promise<void> {
    this._members.update(list => list.filter(member => !(member.id === memberId && member.partner_id === partnerId)));
  }
}
