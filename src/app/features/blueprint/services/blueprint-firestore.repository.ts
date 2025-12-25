import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import type { Blueprint, CreateBlueprintRequest, UpdateBlueprintRequest } from '@core/blueprint/domain/types/blueprint/blueprint.types';
import { BlueprintStatus } from '@core/blueprint/domain/types/blueprint/blueprint-status.enum';
import { ModuleType } from '@core/blueprint/domain/types';
import { OwnerType } from '@core/blueprint/domain/types/blueprint/owner-type.enum';

import { COLLECTION_NAMES } from '../../../firebase/constants/collection-names.const';
import { buildConverter } from '../../../firebase/utils/firestore-converter.util';
import { toDateOrNull } from '../../../firebase/utils/timestamp.util';

@Injectable({ providedIn: 'root' })
export class BlueprintFirestoreRepository {
  private readonly firestore = inject(Firestore);

  private readonly collectionRef = collection(this.firestore, COLLECTION_NAMES.BLUEPRINTS).withConverter(
    buildConverter<Blueprint>(
      data => ({
        id: (data['id'] as string) ?? '',
        name: data['name'] as string,
        slug: data['slug'] as string,
        description: (data['description'] as string) ?? undefined,
        coverUrl: (data['coverUrl'] as string) ?? undefined,
        ownerId: data['ownerId'] as string,
        ownerType: data['ownerType'] as OwnerType,
        isPublic: Boolean(data['isPublic']),
        status: (data['status'] as BlueprintStatus) ?? BlueprintStatus.ACTIVE,
        enabledModules: ((data['enabledModules'] as ModuleType[]) ?? []) as ModuleType[],
        metadata: (data['metadata'] as Record<string, unknown>) ?? {},
        createdBy: data['createdBy'] as string,
        createdAt: toDateOrNull(data['createdAt']) ?? new Date(),
        updatedAt: toDateOrNull(data['updatedAt']) ?? new Date(),
        deletedAt: toDateOrNull(data['deletedAt']) ?? null,
      }),
      value => ({
        ...value,
        description: value.description ?? null,
        coverUrl: value.coverUrl ?? null,
        metadata: value.metadata ?? {},
        enabledModules: value.enabledModules ?? [],
        createdAt: value.createdAt instanceof Date ? Timestamp.fromDate(value.createdAt) : value.createdAt,
        updatedAt: value.updatedAt instanceof Date ? Timestamp.fromDate(value.updatedAt) : value.updatedAt,
        deletedAt: value.deletedAt
          ? value.deletedAt instanceof Date
            ? Timestamp.fromDate(value.deletedAt)
            : value.deletedAt
          : null,
      }),
    ),
  );

  async getById(id: string): Promise<Blueprint | null> {
    const snapshot = await getDoc(doc(this.collectionRef, id));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return { ...data, id: snapshot.id };
  }

  async getByOwner(ownerType: OwnerType, ownerId: string): Promise<Blueprint[]> {
    const q = query(
      this.collectionRef,
      where('ownerType', '==', ownerType),
      where('ownerId', '==', ownerId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id }));
  }

  async create(payload: CreateBlueprintRequest): Promise<Blueprint> {
    const draft: Blueprint = {
      id: '',
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      coverUrl: payload.coverUrl,
      ownerId: payload.ownerId,
      ownerType: payload.ownerType,
      isPublic: payload.isPublic ?? false,
      status: BlueprintStatus.ACTIVE,
      enabledModules: (payload.enabledModules ?? []) as ModuleType[],
      metadata: payload.metadata ?? {},
      createdBy: payload.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const docRef = await addDoc(this.collectionRef, draft);
    const created = await getDoc(doc(this.collectionRef, docRef.id));
    if (!created.exists()) {
      return { ...draft, id: docRef.id };
    }
    return { ...created.data(), id: created.id };
  }

  async update(id: string, updates: UpdateBlueprintRequest): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  async delete(id: string): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), {
      deletedAt: Timestamp.now(),
      status: BlueprintStatus.ARCHIVED,
      updatedAt: Timestamp.now(),
    });
  }
}
