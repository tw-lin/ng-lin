import { Injectable, inject } from '@angular/core';
import { LogFirestoreRepository } from '@core/account/repositories/log-firestore.repository';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/blueprint/domain/types/log/log.types';

import { CreateDiaryRequest, Diary, DiaryPhoto, UpdateDiaryRequest } from './diary.model';

@Injectable({ providedIn: 'root' })
export class DiaryRepository {
  private readonly logRepo = inject(LogFirestoreRepository);
  async findByBlueprint(blueprintId: string): Promise<Diary[]> {
    void blueprintId;
    return [];
  }

  async findById(id: string): Promise<Diary | null> {
    void id;
    return null;
  }

  async create(request: CreateDiaryRequest): Promise<Diary> {
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      blueprintId: request.blueprintId,
      date: request.date,
      title: request.title,
      description: request.description,
      workHours: request.workHours,
      workers: request.workers,
      equipment: request.equipment,
      weather: request.weather,
      temperature: request.temperature,
      photos: [],
      creatorId: request.creatorId,
      createdAt: now,
      updatedAt: now
    };
  }

  async update(id: string, request: UpdateDiaryRequest): Promise<void> {
    void id;
    void request;
    return;
  }

  async delete(id: string): Promise<void> {
    void id;
    return;
  }

  async uploadPhoto(logId: string, file: File, caption?: string): Promise<DiaryPhoto> {
    void logId;
    void file;
    return {
      id: crypto.randomUUID(),
      url: '',
      publicUrl: '',
      caption,
      uploadedAt: new Date()
    };
  }

  async deletePhoto(logId: string, photoId: string): Promise<void> {
    void logId;
    void photoId;
    return;
  }
}
