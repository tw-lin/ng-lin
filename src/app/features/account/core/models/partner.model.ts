import { PartnerRole, PartnerType } from '../types';

export interface Partner {
  id: string;
  name: string;
  organization_id: string;
  type?: PartnerType;
  description?: string;
  company_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface PartnerMember {
  id: string;
  partner_id: string;
  user_id: string;
  role: PartnerRole;
  joined_at?: string | Date;
}
