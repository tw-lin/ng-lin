import { Timestamp } from '@angular/fire/firestore';
import { BlueprintMemberType, BlueprintRole } from '@core';

export interface Member {
  id: string;
  blueprintId: string;
  accountId: string;
  accountName?: string;
  memberType: BlueprintMemberType;
  role: BlueprintRole;
  businessRole?: string;
  isExternal: boolean;
  permissions?: Record<string, boolean>;
  grantedBy?: string;
  grantedAt: Date;
}

export type MemberDocument = Omit<Member, 'id' | 'grantedAt'> & {
  grantedAt: Date | Timestamp;
};

export interface CreateMemberRequest {
  blueprintId: string;
  blueprintOwnerType: string;
  accountId: string;
  accountName?: string;
  memberType: BlueprintMemberType;
  role: BlueprintRole;
  businessRole?: string | null;
  isExternal: boolean;
  grantedBy: string;
  permissions?: Record<string, boolean>;
}

export interface UpdateMemberRequest {
  role?: BlueprintRole;
  businessRole?: string | null;
  isExternal?: boolean;
  permissions?: Record<string, boolean>;
}
