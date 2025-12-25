export interface DiaryPhoto {
  id: string;
  url: string;
  publicUrl?: string;
  caption?: string;
  uploadedAt: Date;
  size?: number;
  fileName?: string;
}

export interface Diary {
  id: string;
  blueprintId: string;
  date: Date;
  title: string;
  description?: string;
  workHours?: number;
  workers?: number;
  equipment?: string;
  weather?: string;
  temperature?: number | null;
  photos: DiaryPhoto[];
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateDiaryRequest {
  blueprintId: string;
  date: Date;
  title: string;
  description?: string;
  workHours?: number;
  workers?: number;
  equipment?: string;
  weather?: string;
  temperature?: number | null;
  creatorId: string;
}

export interface UpdateDiaryRequest {
  date?: Date;
  title?: string;
  description?: string;
  workHours?: number;
  workers?: number;
  equipment?: string;
  weather?: string;
  temperature?: number | null;
}
