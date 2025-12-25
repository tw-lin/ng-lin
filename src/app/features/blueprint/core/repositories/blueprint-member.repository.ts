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
  where,
  query,
  CollectionReference,
  DocumentReference,
  Timestamp
} from '@angular/fire/firestore';
import { BlueprintMember, BlueprintMemberType, OwnerType, isValidMemberTypeForOwner } from '@core';
import { Observable, from, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlueprintMemberRepository {
  private readonly firestore = inject(Firestore);

  private getMembersCollectionRef(blueprintId: string): CollectionReference {
    return collection(this.firestore, 'blueprints', blueprintId, 'members');
  }

  private getMemberDocRef(blueprintId: string, memberId: string): DocumentReference {
    return doc(this.firestore, 'blueprints', blueprintId, 'members', memberId);
  }

  private toMember(data: any, id: string): BlueprintMember {
    return {
      id,
      ...data,
      grantedAt: data.grantedAt instanceof Timestamp ? data.grantedAt.toDate() : data.grantedAt
    };
  }

  /**
   * Find all members of a blueprint
   * 查詢藍圖的所有成員
   */
  findByBlueprint(blueprintId: string): Observable<BlueprintMember[]> {
    return from(getDocs(this.getMembersCollectionRef(blueprintId))).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toMember(docSnap.data(), docSnap.id)))
    );
  }

  /**
   * Find members by member type
   * 依成員類型查詢成員
   *
   * @param blueprintId - Blueprint ID
   * @param memberType - Member type to filter by
   */
  findByMemberType(blueprintId: string, memberType: BlueprintMemberType): Observable<BlueprintMember[]> {
    const q = query(this.getMembersCollectionRef(blueprintId), where('memberType', '==', memberType));

    return from(getDocs(q)).pipe(map(snapshot => snapshot.docs.map(docSnap => this.toMember(docSnap.data(), docSnap.id))));
  }

  /**
   * Add a member to a blueprint with validation
   * 新增成員至藍圖（包含驗證）
   *
   * @param blueprintId - Blueprint ID
   * @param blueprintOwnerType - Blueprint owner type (for validation)
   * @param member - Member data to add
   * @returns Promise resolving to the created member
   * @throws Error if member type is not allowed for the blueprint owner type
   */
  async addMember(
    blueprintId: string,
    blueprintOwnerType: OwnerType,
    member: Omit<BlueprintMember, 'id' | 'grantedAt'>
  ): Promise<BlueprintMember> {
    // Validate member type is allowed for this owner type
    if (!isValidMemberTypeForOwner(blueprintOwnerType, member.memberType)) {
      const errorMsg = blueprintOwnerType === OwnerType.USER ? '個人藍圖只能新增用戶成員' : `不允許的成員類型：${member.memberType}`;
      throw new Error(errorMsg);
    }

    // Validate isExternal flag matches member type
    const expectedExternal = member.memberType === BlueprintMemberType.PARTNER;
    if (member.memberType === BlueprintMemberType.TEAM && member.isExternal) {
      const errorMsg = '團隊成員不能標記為外部成員';
      throw new Error(errorMsg);
    }

    if (member.memberType === BlueprintMemberType.PARTNER && !member.isExternal) {
      const errorMsg = '夥伴成員必須標記為外部成員';
      throw new Error(errorMsg);
    }

    try {
      const docRef = await addDoc(this.getMembersCollectionRef(blueprintId), {
        ...member,
        grantedAt: Timestamp.now()
      });

      const docSnap = await getDoc(docRef);
      return this.toMember(docSnap.data(), docRef.id);
    } catch (error) {
      throw error;
    }
  }

  async updateMember(blueprintId: string, memberId: string, data: Partial<BlueprintMember>): Promise<void> {
    try {
      await updateDoc(this.getMemberDocRef(blueprintId, memberId), data);
    } catch (error) {
      throw error;
    }
  }

  async removeMember(blueprintId: string, memberId: string): Promise<void> {
    try {
      await deleteDoc(this.getMemberDocRef(blueprintId, memberId));
    } catch (error) {
      throw error;
    }
  }
}
