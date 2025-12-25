export enum ContextType {
  USER = 'user',
  ORGANIZATION = 'organization',
  TEAM = 'team',
  PARTNER = 'partner',
  BOT = 'bot'
}

export enum TeamRole {
  LEADER = 'leader',
  MEMBER = 'member'
}

export enum PartnerRole {
  ADMIN = 'admin',
  MEMBER = 'member'
}

export enum PartnerType {
  SUPPLIER = 'supplier',
  CONTRACTOR = 'contractor',
  SUBCONTRACTOR = 'subcontractor',
  CONSULTANT = 'consultant',
  CLIENT = 'client',
  OTHER = 'other'
}

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined'
}

export enum BusinessRole {
  PROJECT_MANAGER = 'project_manager',
  SITE_SUPERVISOR = 'site_supervisor',
  ENGINEER = 'engineer',
  QUALITY_INSPECTOR = 'quality_inspector',
  ARCHITECT = 'architect',
  CONTRACTOR = 'contractor',
  CLIENT = 'client'
}

export enum NotificationType {
  NOTICE = 'notice',
  MESSAGE = 'message',
  ALERT = 'alert'
}
