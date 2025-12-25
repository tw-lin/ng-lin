import { InvitationStatus, OrganizationRole } from '../types';

export interface Organization {
  id: string;
  name: string;
  creator_id?: string;
  created_by?: string;
  logo_url?: string;
  description?: string | null;
  is_discoverable?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  status?: InvitationStatus;
  joined_at?: string | Date;
}
