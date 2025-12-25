import { Injectable } from '@angular/core';

import { CreateLogRequest, Log, UpdateLogRequest } from '@core/blueprint/domain/types/log/log.types';

@Injectable({
  providedIn: 'root'
})
export class LogFirestoreRepository {
  async findByBlueprint(_blueprintId: string): Promise<Log[]> {
    return [];
  }

  async findById(_id: string): Promise<Log | null> {
    return null;
  }

  async create(_request: CreateLogRequest): Promise<Log> {
    const log: Log = {
      id: crypto.randomUUID(),
      blueprintId: _request.blueprintId,
      title: _request.title,
      content: _request.content,
      createdAt: new Date(),
      createdBy: 'system'
    };
    return log;
  }

  async update(_id: string, _request: UpdateLogRequest): Promise<void> {
    return;
  }

  async delete(_id: string): Promise<void> {
    return;
  }

  async uploadPhoto(_logId: string, _file: File, _caption?: string): Promise<Log> {
    return {
      id: crypto.randomUUID(),
      blueprintId: _logId,
      title: _caption || 'photo',
      createdAt: new Date(),
      createdBy: 'system'
    };
  }

  async deletePhoto(_logId: string, _photoId: string): Promise<void> {
    return;
  }
}
