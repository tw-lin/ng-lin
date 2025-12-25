export interface Account {
  id: string;
  uid?: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  is_discoverable?: boolean;
  created_at?: string | Date;
  metadata?: Record<string, unknown>;
}
