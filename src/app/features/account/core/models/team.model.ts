import { TeamRole } from '../types';

export interface Team {
  id: string;
  name: string;
  organization_id: string;
  description?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at?: string | Date;
}
