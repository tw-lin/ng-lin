export interface TaskModel {
  id: string;
  blueprintId: string;
  title: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
