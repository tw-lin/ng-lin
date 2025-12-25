import { NotificationType } from '../types';

export interface NotificationPayload {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  description?: string;
  datetime?: Date | string;
  read?: boolean;
  link?: string;
  extra?: string;
  avatar?: string;
}
