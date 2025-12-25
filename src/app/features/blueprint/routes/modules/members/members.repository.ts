import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  CollectionReference,
  DocumentData,
  Timestamp
} from '@angular/fire/firestore';
import { BlueprintMemberType, OwnerType, getAllowedMemberTypes } from '@core';

import { CreateMemberRequest, Member, MemberDocument, UpdateMemberRequest } from './members.model';

@Injectable({ providedIn: 'root' })
export class MembersRepository {
  private readonly firestore = inject(Firestore);
  private getMembersCollection(blueprintId: string): CollectionReference<DocumentData> {
    return collection(this.firestore, 'blueprints', blueprintId, 'members');
  }

  private getMemberDoc(blueprintId: string, memberId: string) {
    return doc(this.firestore, 'blueprints', blueprintId, 'members', memberId);
  }

  async findByBlueprint(blueprintId: string): Promise<Member[]> {
    try {
      const snapshot = await getDocs(this.getMembersCollection(blueprintId));
      return snapshot.docs.map(docSnap => this.toEntity(docSnap.data() as MemberDocument, docSnap.id));
    } catch (error) {
      throw error;
    }
  }

  async addMember(request: CreateMemberRequest): Promise<Member> {
    this.validateMemberType(request.blueprintOwnerType as OwnerType, request.memberType, request.isExternal);

    try {
      const docRef = await addDoc(this.getMembersCollection(request.blueprintId), {
        accountId: request.accountId,
        accountName: request.accountName ?? null,
        memberType: request.memberType,
        role: request.role,
        businessRole: request.businessRole ?? null,
        isExternal: request.isExternal,
        permissions: request.permissions ?? null,
        grantedBy: request.grantedBy,
        grantedAt: Timestamp.now()
      });

      const snapshot = await getDoc(docRef);
      return this.toEntity(snapshot.data() as MemberDocument, docRef.id);
    } catch (error) {
      throw error;
    }
  }

  async updateMember(blueprintId: string, memberId: string, payload: UpdateMemberRequest): Promise<void> {
    try {
      await updateDoc(this.getMemberDoc(blueprintId, memberId), payload as DocumentData);
    } catch (error) {
      throw error;
    }
  }

  async removeMember(blueprintId: string, memberId: string): Promise<void> {
    try {
      await deleteDoc(this.getMemberDoc(blueprintId, memberId));
    } catch (error) {
      throw error;
    }
  }

  private validateMemberType(ownerType: OwnerType, memberType: BlueprintMemberType, isExternal: boolean): void {
    const allowed = getAllowedMemberTypes(ownerType);
    if (!allowed.includes(memberType)) {
      const error = new Error(`不允許的成員類型：${memberType}`);
      throw error;
    }

    if (memberType === BlueprintMemberType.TEAM && isExternal) {
      const error = new Error('團隊成員不能標記為外部成員');
      throw error;
    }
    if (memberType === BlueprintMemberType.PARTNER && !isExternal) {
      const error = new Error('夥伴成員必須標記為外部成員');
      throw error;
    }
  }

  private toEntity(data: MemberDocument, id: string): Member {
    return {
      id,
      blueprintId: data.blueprintId,
      accountId: data.accountId,
      accountName: data.accountName ?? undefined,
      memberType: data.memberType,
      role: data.role,
      businessRole: data.businessRole ?? undefined,
      isExternal: data.isExternal,
      permissions: data.permissions ?? undefined,
      grantedBy: data.grantedBy ?? undefined,
      grantedAt: this.toDate(data.grantedAt)
    };
  }

  private toDate(value: Date | Timestamp): Date {
    if (value instanceof Timestamp) return value.toDate();
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe?.toDate === 'function') return maybe.toDate();
    return new Date(value);
  }
}
