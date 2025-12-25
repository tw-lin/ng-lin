import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, getDocs, DocumentData, Timestamp } from '@angular/fire/firestore';

import { TaskModel } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksRepository {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'tasks';

  async findByBlueprintId(blueprintId: string): Promise<TaskModel[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('blueprint_id', '==', blueprintId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
  }

  private toEntity(data: DocumentData, id: string): TaskModel {
    return {
      id,
      blueprintId: data['blueprint_id'] ?? data['blueprintId'] ?? '',
      title: data['title'] ?? '',
      status: data['status'],
      createdAt: this.toDate(data['created_at']),
      updatedAt: this.toDate(data['updated_at'])
    };
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
  }
}
