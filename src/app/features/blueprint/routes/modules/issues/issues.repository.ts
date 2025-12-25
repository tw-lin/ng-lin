import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  DocumentData,
  Timestamp
} from '@angular/fire/firestore';

import { CreateIssueData, Issue, IssueDocument, IssueStatus, UpdateIssueData } from './issues.model';

@Injectable({ providedIn: 'root' })
export class IssuesRepository {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'issues';
  private readonly collectionRef = collection(this.firestore, this.collectionName);

  async listIssues(blueprintId: string): Promise<Issue[]> {
    const q = query(this.collectionRef, where('blueprintId', '==', blueprintId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(snap => this.toEntity(snap.data(), snap.id));
  }

  async createIssue(payload: CreateIssueData): Promise<Issue> {
    const now = new Date();
    const docData: IssueDocument = {
      blueprintId: payload.blueprintId,
      issueNumber: this.generateIssueNumber(),
      title: payload.title,
      description: payload.description,
      location: payload.location,
      severity: payload.severity,
      category: payload.category,
      responsibleParty: payload.responsibleParty,
      assignedTo: payload.assignedTo,
      status: 'open',
      source: payload.source ?? 'manual',
      createdBy: payload.createdBy,
      createdAt: now,
      updatedAt: now
    };
    const added = await addDoc(this.collectionRef, docData as DocumentData);
    return this.toEntity(docData as DocumentData, added.id);
  }

  async updateIssue(id: string, payload: UpdateIssueData): Promise<Issue> {
    const ref = doc(this.firestore, `${this.collectionName}/${id}`);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error('Issue not found');
    }
    const existing = this.toEntity(snapshot.data(), snapshot.id);
    const now = new Date();
    const updated: Issue = {
      ...existing,
      ...payload,
      updatedAt: now
    };
    await updateDoc(ref, this.toDocument(updated));
    return updated;
  }

  async deleteIssue(id: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionName}/${id}`);
    await deleteDoc(ref);
  }

  private toEntity(data: DocumentData, id: string): Issue {
    const docData = data as IssueDocument;
    return {
      id,
      blueprintId: docData.blueprintId,
      issueNumber: docData.issueNumber,
      title: docData.title,
      description: docData.description,
      location: docData.location,
      severity: docData.severity,
      category: docData.category,
      responsibleParty: docData.responsibleParty,
      assignedTo: docData.assignedTo,
      status: docData.status as IssueStatus,
      source: docData.source,
      createdBy: docData.createdBy,
      createdAt: this.toDate(docData.createdAt),
      updatedAt: this.toDate(docData.updatedAt)
    };
  }

  private toDocument(issue: Issue): DocumentData {
    return {
      blueprintId: issue.blueprintId,
      issueNumber: issue.issueNumber,
      title: issue.title,
      description: issue.description,
      location: issue.location,
      severity: issue.severity,
      category: issue.category,
      responsibleParty: issue.responsibleParty,
      assignedTo: issue.assignedTo ?? null,
      status: issue.status,
      source: issue.source,
      createdBy: issue.createdBy,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt
    };
  }

  private toDate(value: Date | Timestamp): Date {
    if (value instanceof Timestamp) return value.toDate();
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe?.toDate === 'function') return maybe.toDate();
    return new Date(value);
  }

  private generateIssueNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `ISS-${timestamp}`;
  }
}
