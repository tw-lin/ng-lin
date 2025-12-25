import { Injectable, computed, inject, signal } from '@angular/core';

import { AuditLogsService, AuditEventType, AuditCategory, AuditSeverity, ActorType, AuditStatus } from '../audit-logs';
import { CreateDiaryRequest, Diary, UpdateDiaryRequest } from './diary.model';
import { DiaryRepository } from './diary.repository';

@Injectable({ providedIn: 'root' })
export class DiaryService {
  private readonly repository = inject(DiaryRepository);
  private readonly audit = inject(AuditLogsService);
  private readonly _diaries = signal<Diary[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly diaries = this._diaries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalCount = computed(() => this._diaries().length);
  readonly totalPhotos = computed(() => this._diaries().reduce((sum, log) => sum + (log.photos?.length || 0), 0));
  readonly thisMonthCount = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return this._diaries().filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    }).length;
  });
  readonly todayCount = computed(() => {
    const today = new Date().toDateString();
    return this._diaries().filter(log => new Date(log.date).toDateString() === today).length;
  });

  async loadDiaries(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const logs = await this.repository.findByBlueprint(blueprintId);
      this._diaries.set(logs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load diaries';
      this._error.set(message);
      // Error logging removed
    } finally {
      this._loading.set(false);
    }
  }

  async create(request: CreateDiaryRequest): Promise<Diary> {
    try {
      const created = await this.repository.create(request);
      this._diaries.update(list => [created, ...list]);
      await this.recordAudit(
        request.blueprintId,
        AuditEventType.LOG_CREATED,
        request.creatorId,
        created.id,
        `日誌已建立: ${created.title}`
      );
      return created;
    } catch (error) {
      // Error logging removed
      throw error;
    }
  }

  async update(blueprintId: string, id: string, request: UpdateDiaryRequest): Promise<Diary> {
    try {
      await this.repository.update(id, request);
      const updated = await this.repository.findById(id);
      if (!updated) {
        throw new Error(`日誌更新後無法找到 (ID: ${id})。請重新整理頁面。`);
      }
      this._diaries.update(list => list.map(item => (item.id === id ? updated : item)));
      return updated;
    } catch (error) {
      // Error logging removed
      throw error;
    }
  }

  async delete(blueprintId: string, id: string): Promise<void> {
    try {
      await this.repository.delete(id);
      this._diaries.update(list => list.filter(item => item.id !== id));
    } catch (error) {
      // Error logging removed
      throw error;
    }
  }

  async uploadPhoto(blueprintId: string, diaryId: string, file: File, caption?: string): Promise<string> {
    try {
      const photo = await this.repository.uploadPhoto(diaryId, file, caption);
      this._diaries.update(list => list.map(item => (item.id === diaryId ? { ...item, photos: [...item.photos, photo] } : item)));
      return photo.id;
    } catch (error) {
      // Error logging removed
      throw error;
    }
  }

  async deletePhoto(blueprintId: string, diaryId: string, photoId: string): Promise<void> {
    try {
      await this.repository.deletePhoto(diaryId, photoId);
      this._diaries.update(list =>
        list.map(item => (item.id === diaryId ? { ...item, photos: item.photos.filter(p => p.id !== photoId) } : item))
      );
    } catch (error) {
      // Error logging removed
      throw error;
    }
  }

  private async recordAudit(
    blueprintId: string,
    eventType: AuditEventType,
    actorId: string,
    resourceId: string,
    message: string
  ): Promise<void> {
    try {
      await this.audit.recordLog({
        blueprintId,
        eventType,
        category: AuditCategory.DATA,
        severity: AuditSeverity.INFO,
        actorId,
        actorType: ActorType.USER,
        resourceType: 'log',
        resourceId,
        action: '施工日誌',
        message,
        status: AuditStatus.SUCCESS
      });
    } catch (error) {}
  }
}
