/**
 * Tenant Context Service - Unified Workspace & Tenant Management
 *
 * Primary service for workspace management with built-in multi-tenant isolation
 * Replaces WorkspaceContextService with enhanced tenant-first architecture
 *
 * Manages workspace context (user, organization, team, partner, bot) with automatic tenant isolation
 *
 * Architecture:
 * - RxJS Pipeline: Handles ALL async operations (data loading, HTTP requests)
 * - Signals: Manages sync state only (context type, context ID, tenant ID)
 * - Computed: Derived state (labels, icons, mappings, tenant metadata)
 * - Effects: Side effects only (sync to SettingsService, persistence)
 *
 * Tenant Isolation (Primary Purpose):
 * - User Context: tenant_id = user.uid (personal workspace)
 * - Organization Context: tenant_id = organization.id (organization workspace)
 * - Team Context: tenant_id = team.organization_id (team's parent organization)
 * - Partner Context: tenant_id = partner.organization_id (partner's organization)
 * - Bot Context: tenant_id = bot.organization_id (bot's organization)
 *
 * Follows Angular 20 best practices:
 * - "RxJS for Async, Signals for Sync"
 * - switchMap for async operations in pipelines
 * - shareReplay(1) to prevent duplicate requests
 * - toSignal to convert Observable to Signal at the end
 * - Keep effects "thin and focused" - no async operations
 *
 * Follows: docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md (Part V - Phase 1 - Task 1.2)
 *
 * @module core/global-event-bus/services
 * @version 2.0.0 - Unified workspace & tenant management (replaced WorkspaceContextService)
 */

import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContextType, Account, Organization, Team, Partner, Bot, AuthFacade } from '@core';
import { OrganizationRepository, TeamRepository, PartnerRepository } from '@core/repositories';
import { FirebaseService } from '@core/services/firebase.service';
import { SettingsService } from '@delon/theme';
import { combineLatest, of, switchMap, map, shareReplay, catchError, BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'workspace_context';

/**
 * Workspace Interface
 * Represents a complete workspace with user and all accessible entities
 */
export interface Workspace {
  user: Account | null;
  organizations: Organization[];
  teams: Team[];
  partners: Partner[];
  bots: Bot[];
}

/**
 * Tenant Metadata
 * Provides additional context about the current tenant for audit system
 */
export interface TenantMetadata {
  tenantId: string;
  tenantType: ContextType;
  tenantName: string;
  ownerId?: string; // For Organization/Team/Partner/Bot
  parentOrgId?: string; // For Team/Partner/Bot
}

@Injectable({
  providedIn: 'root'
})
export class TenantContextService {
  private readonly auth = inject(AuthFacade);
  private readonly organizationRepo = inject(OrganizationRepository);
  private readonly teamRepo = inject(TeamRepository);
  private readonly partnerRepo = inject(PartnerRepository);
  private readonly settingsService = inject(SettingsService);
  private readonly firebaseService = inject(FirebaseService);

  // ============================================================================
  // RxJS Pipeline: Handle ALL async operations
  // ============================================================================

  /**
   * Reload trigger - use BehaviorSubject to manually trigger data reload
   */
  private readonly reloadTrigger$ = new BehaviorSubject<void>(undefined);

  /**
   * Main data pipeline using RxJS operators (Angular 20 best practice)
   * - switchMap: Automatically cancels previous requests
   * - combineLatest: Load multiple resources in parallel
   * - shareReplay(1): Cache result, prevent duplicate requests
   * - catchError: Handle errors gracefully
   */
  private readonly userData$ = combineLatest([this.auth.user$, this.reloadTrigger$]).pipe(
    switchMap(([user]) => {
      if (!user) {
        console.log('[TenantContextService] 👤 No user authenticated');
        return of({ user: null, organizations: [], teams: [], partners: [], bots: [] });
      }

      console.log('[TenantContextService] 👤 User authenticated:', user.email);

      // Convert Firebase user to Account
      const account: Account = {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || user.email || '使用者',
        email: user.email || '',
        avatar_url: user.photoURL,
        created_at: new Date().toISOString()
      };

      // Load organizations for this user
      return this.organizationRepo.findByCreator(user.uid).pipe(
        switchMap(organizations => {
          console.log('[TenantContextService] ✅ Organizations loaded:', organizations.length);

          if (organizations.length === 0) {
            return of({ user: account, organizations: [], teams: [], partners: [], bots: [] });
          }

          // Load teams and partners for all organizations in parallel
          const teamObservables = organizations.map(org => this.teamRepo.findByOrganization(org.id));
          const partnerObservables = organizations.map(org => this.partnerRepo.findByOrganization(org.id));

          return combineLatest([combineLatest(teamObservables), combineLatest(partnerObservables)]).pipe(
            map(([teamArrays, partnerArrays]) => {
              const allTeams = teamArrays.flat();
              const allPartners = partnerArrays.flat();
              console.log('[TenantContextService] ✅ Teams loaded:', allTeams.length);
              console.log('[TenantContextService] ✅ Partners loaded:', allPartners.length);
              return {
                user: account,
                organizations,
                teams: allTeams,
                partners: allPartners,
                bots: [] as Bot[] // Bots not yet implemented
              };
            })
          );
        }),
        catchError(error => {
          console.error('[TenantContextService] ❌ Error loading user data:', error);
          // Return partial data on error (user info is still valid)
          return of({ user: account, organizations: [], teams: [], partners: [], bots: [] });
        })
      );
    }),
    shareReplay(1) // Cache result, prevent duplicate requests
  );

  // ============================================================================
  // Signals: Manage sync state only
  // ============================================================================

  /**
   * Convert Observable to Signal (only at the end of pipeline)
   * This is the Angular 20 recommended pattern: RxJS for async, Signals for sync
   */
  private readonly _userData = toSignal(this.userData$, {
    initialValue: { user: null, organizations: [], teams: [], partners: [], bots: [] }
  });

  // Context state (sync, can be directly modified)
  private readonly _contextType = signal<ContextType>(ContextType.USER);
  private readonly _contextId = signal<string | null>(null);
  private readonly _switching = signal<boolean>(false);

  // ============================================================================
  // Public Readonly Signals (Computed from userData)
  // ============================================================================

  readonly currentUser = computed(() => this._userData().user);
  readonly organizations = computed(() => this._userData().organizations);
  readonly teams = computed(() => this._userData().teams);
  readonly partners = computed(() => this._userData().partners);
  readonly bots = computed(() => this._userData().bots);

  readonly contextType = this._contextType.asReadonly();
  readonly contextId = this._contextId.asReadonly();
  readonly switching = this._switching.asReadonly();

  // Loading states (derived from userData state)
  readonly isLoadingData = computed(() => {
    const data = this._userData();
    // If user exists but no organizations loaded yet, we're loading
    return !!data.user && data.organizations.length === 0 && data.teams.length === 0;
  });

  // ============================================================================
  // Computed Signals: Derived state (pure logic, no side effects)
  // ============================================================================

  /** Is user authenticated? */
  readonly isAuthenticated = computed(() => !!this.currentUser());

  /** Context label (displayed in UI) */
  readonly contextLabel = computed(() => {
    const type = this.contextType();
    const id = this.contextId();
    const user = this.currentUser();

    // Handle USER context early loading state
    if (type === ContextType.USER) {
      if (!user) return '載入中...';
      return user.name;
    }

    switch (type) {
      case ContextType.ORGANIZATION: {
        const org = this.organizations().find(o => o.id === id);
        return org?.name || '組織';
      }
      case ContextType.TEAM: {
        const team = this.teams().find(t => t.id === id);
        return team?.name || '團隊';
      }
      case ContextType.PARTNER: {
        const partner = this.partners().find(p => p.id === id);
        return partner?.name || '夥伴';
      }
      case ContextType.BOT: {
        const bot = this.bots().find(b => b.id === id);
        return bot?.name || '機器人';
      }
      default:
        return '個人帳戶';
    }
  });

  /** Context icon (displayed in UI) */
  readonly contextIcon = computed(() => {
    const iconMap = {
      [ContextType.USER]: 'user',
      [ContextType.ORGANIZATION]: 'team',
      [ContextType.TEAM]: 'usergroup-add',
      [ContextType.PARTNER]: 'solution',
      [ContextType.BOT]: 'robot'
    };
    return iconMap[this.contextType()] || 'user';
  });

  /** Teams grouped by organization */
  readonly teamsByOrganization = computed(() => {
    const teams = this.teams();
    const orgs = this.organizations();
    const map = new Map<string, Team[]>();

    orgs.forEach(org => map.set(org.id, []));
    teams.forEach(team => {
      const orgId = team.organization_id;
      if (orgId && map.has(orgId)) {
        map.get(orgId)!.push(team);
      }
    });

    return map;
  });

  /** Partners grouped by organization */
  readonly partnersByOrganization = computed(() => {
    const partners = this.partners();
    const orgs = this.organizations();
    const map = new Map<string, Partner[]>();

    orgs.forEach(org => map.set(org.id, []));
    partners.forEach(partner => {
      const orgId = partner.organization_id;
      if (orgId && map.has(orgId)) {
        map.get(orgId)!.push(partner);
      }
    });

    return map;
  });

  // ============================================================================
  // Tenant Isolation: Computed Signals for Multi-Tenant Audit System
  // ============================================================================

  /**
   * Current Tenant ID
   * Extracted from workspace context (User/Organization/Team/Partner/Bot)
   *
   * Tenant ID Mapping:
   * - User: user.uid
   * - Organization: organization.id
   * - Team: team.organization_id (parent organization)
   * - Partner: partner.organization_id (parent organization)
   * - Bot: bot.organization_id (parent organization)
   */
  readonly currentTenantId = computed(() => {
    const contextType = this.contextType();
    const contextId = this.contextId();

    if (!contextType || !contextId) {
      // Fallback to current user if no workspace context
      const user = this.currentUser();
      return user?.uid ?? null;
    }

    switch (contextType) {
      case ContextType.USER:
        return contextId; // user.uid

      case ContextType.ORGANIZATION:
        return contextId; // organization.id

      case ContextType.TEAM: {
        // Team belongs to an organization, use organization_id as tenant
        const team = this.teams().find(t => t.id === contextId);
        return team?.organization_id ?? null;
      }

      case ContextType.PARTNER: {
        // Partner belongs to an organization, use organization_id as tenant
        const partner = this.partners().find(p => p.id === contextId);
        return partner?.organization_id ?? null;
      }

      case ContextType.BOT: {
        // Bot belongs to an organization, use organization_id as tenant
        const bot = this.bots().find(b => b.id === contextId);
        return (bot as any)?.organization_id ?? null;
      }

      default:
        return null;
    }
  });

  /**
   * Is Superadmin
   * Superadmins can access all tenants (cross-tenant queries)
   *
   * TODO: Integrate with actual role/permission system
   * For now, check custom claim 'role' === 'superadmin' from Firebase Auth
   */
  readonly isSuperAdmin = computed(() => {
    const user = this.firebaseService.getCurrentUser();
    if (!user) return false;

    // Check custom claims (requires Firebase Admin SDK to set)
    const customClaims = (user as any).reloadUserInfo?.customAttributes;
    if (customClaims) {
      try {
        const claims = JSON.parse(customClaims);
        return claims.role === 'superadmin' || claims.is_superadmin === true;
      } catch {
        return false;
      }
    }

    return false;
  });

  /**
   * Tenant Metadata
   * Provides additional context about the current tenant for audit system
   */
  readonly tenantMetadata = computed((): TenantMetadata | null => {
    const tenantId = this.currentTenantId();
    const tenantType = this.contextType();

    if (!tenantId || !tenantType) return null;

    switch (tenantType) {
      case ContextType.USER: {
        const user = this.currentUser();
        return user
          ? {
              tenantId,
              tenantType,
              tenantName: user.name || user.email || 'User'
            }
          : null;
      }

      case ContextType.ORGANIZATION: {
        const org = this.organizations().find(o => o.id === tenantId);
        return org
          ? {
              tenantId,
              tenantType,
              tenantName: org.name,
              ownerId: org.created_by || org.creator_id
            }
          : null;
      }

      case ContextType.TEAM: {
        const contextId = this.contextId();
        const team = this.teams().find(t => t.id === contextId);
        return team
          ? {
              tenantId, // organization_id
              tenantType,
              tenantName: team.name,
              parentOrgId: team.organization_id
            }
          : null;
      }

      case ContextType.PARTNER: {
        const contextId = this.contextId();
        const partner = this.partners().find(p => p.id === contextId);
        return partner
          ? {
              tenantId, // organization_id
              tenantType,
              tenantName: partner.name,
              parentOrgId: partner.organization_id
            }
          : null;
      }

      case ContextType.BOT: {
        const contextId = this.contextId();
        const bot = this.bots().find(b => b.id === contextId);
        return bot
          ? {
              tenantId, // organization_id
              tenantType,
              tenantName: bot.name,
              parentOrgId: (bot as any).organization_id
            }
          : null;
      }

      default:
        return null;
    }
  });

  /**
   * Current Workspace
   * Complete workspace data (for backward compatibility)
   */
  readonly currentWorkspace = computed((): Workspace => {
    return {
      user: this.currentUser(),
      organizations: this.organizations(),
      teams: this.teams(),
      partners: this.partners(),
      bots: this.bots()
    };
  });

  // ============================================================================
  // Tenant Isolation: Validation Methods
  // ============================================================================

  /**
   * Ensure Tenant ID Exists
   * Throws error if no tenant context is available
   *
   * Use this before any audit operation to ensure tenant isolation
   */
  ensureTenantId(): string {
    const tenantId = this.currentTenantId();
    if (!tenantId) {
      throw new Error('[TenantContextService] No tenant context available. ' + 'User must be authenticated and have a workspace context.');
    }
    return tenantId;
  }

  /**
   * Get Tenant ID or Throw
   * Alias for ensureTenantId()
   */
  getTenantIdOrThrow(): string {
    return this.ensureTenantId();
  }

  /**
   * Has Tenant Context
   * Check if tenant context is available (non-throwing)
   */
  hasTenantContext(): boolean {
    return this.currentTenantId() !== null;
  }

  // ============================================================================
  // Effects: Side effects only (sync to SettingsService, persistence)
  // ============================================================================

  constructor() {
    /**
     * Effect #1: Sync to SettingsService for ng-alain components
     * This is a "thin and focused" effect - only syncing state
     * No async operations, no HTTP requests
     */
    effect(() => {
      const user = this.currentUser();
      const type = this.contextType();
      const id = this.contextId();

      if (!user) {
        // Clear SettingsService when no user
        this.settingsService.setUser({
          name: '未登入',
          email: '',
          avatar: './assets/tmp/img/avatar.jpg'
        });
        return;
      }

      // Determine avatar and name based on context
      let avatarUrl = user.avatar_url;
      let name = user.name;

      if (type === ContextType.ORGANIZATION) {
        const org = this.organizations().find(o => o.id === id);
        if (org) {
          avatarUrl = org.logo_url || avatarUrl;
          name = org.name;
        }
      } else if (type === ContextType.TEAM) {
        const team = this.teams().find(t => t.id === id);
        if (team) {
          const parentOrg = this.organizations().find(o => o.id === team.organization_id);
          avatarUrl = parentOrg?.logo_url || avatarUrl;
          name = team.name;
        }
      } else if (type === ContextType.PARTNER) {
        const partner = this.partners().find(p => p.id === id);
        if (partner) {
          const parentOrg = this.organizations().find(o => o.id === partner.organization_id);
          avatarUrl = parentOrg?.logo_url || avatarUrl;
          name = partner.name;
        }
      }

      // Sync to SettingsService (single source of truth for ng-alain)
      this.settingsService.setUser({
        name,
        email: user.email,
        avatar: avatarUrl || './assets/tmp/img/avatar.jpg'
      });
    });

    /**
     * Effect #2: Auto-restore context on initial load
     * Runs once when user data is first loaded
     */
    effect(() => {
      const user = this.currentUser();

      // Only restore context when user is first loaded
      if (user && this.contextType() === ContextType.USER && !this.contextId()) {
        console.log('[TenantContextService] 🔄 Auto-restoring context...');
        this.restoreContext();
      }
    });
  }

  // ============================================================================
  // Context Switching: Pure sync operations
  // ============================================================================

  /**
   * Switch to user context
   */
  switchToUser(userId: string): void {
    this.switchContext(ContextType.USER, userId);
  }

  /**
   * Switch to organization context
   */
  switchToOrganization(organizationId: string): void {
    this.switchContext(ContextType.ORGANIZATION, organizationId);
  }

  /**
   * Switch to team context
   */
  switchToTeam(teamId: string): void {
    this.switchContext(ContextType.TEAM, teamId);
  }

  /**
   * Switch to partner context
   */
  switchToPartner(partnerId: string): void {
    this.switchContext(ContextType.PARTNER, partnerId);
  }

  /**
   * Switch to bot context
   */
  switchToBot(botId: string): void {
    this.switchContext(ContextType.BOT, botId);
  }

  /**
   * Switch context (internal method)
   * Pure sync operation - just updates signals
   */
  switchContext(type: ContextType, id: string | null): void {
    console.log('[TenantContextService] 🔀 Switching context:', { type, id });
    this._switching.set(true);

    this._contextType.set(type);
    this._contextId.set(id);

    this.persistContext();
    this._switching.set(false);

    console.log('[TenantContextService] ✅ Context switched successfully');
  }

  // ============================================================================
  // Data Management: Manual operations (for dynamic updates)
  // ============================================================================

  /**
   * Add organization to the list
   * Useful when user creates a new organization
   */
  addOrganization(org: Organization): void {
    const current = this._userData();
    const organizations = current.organizations;

    // Check if already exists to avoid duplicates
    if (!organizations.find(o => o.id === org.id)) {
      // Note: We can't directly mutate _userData since it's from toSignal
      // This is a limitation - ideally organizations should be a separate signal
      // For now, we'll reload data
      console.log('[TenantContextService] ⚠️ Organization added, reloading data...');
      this.reloadData();
    }
  }

  /**
   * Remove organization from the list
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeOrganization(_orgId: string): void {
    console.log('[TenantContextService] ⚠️ Organization removed, reloading data...');
    this.reloadData();
  }

  /**
   * Add team to the list
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addTeam(_team: Team): void {
    console.log('[TenantContextService] ⚠️ Team added, reloading data...');
    this.reloadData();
  }

  /**
   * Remove team from the list
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeTeam(_teamId: string): void {
    console.log('[TenantContextService] ⚠️ Team removed, reloading data...');
    this.reloadData();
  }

  /**
   * Add partner to the list
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addPartner(_partner: Partner): void {
    console.log('[TenantContextService] ⚠️ Partner added, reloading data...');
    this.reloadData();
  }

  /**
   * Remove partner from the list
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removePartner(_partnerId: string): void {
    console.log('[TenantContextService] ⚠️ Partner removed, reloading data...');
    this.reloadData();
  }

  /**
   * Reload data from Firebase
   * Forces the userData$ pipeline to re-execute by emitting on reloadTrigger$
   */
  reloadData(): void {
    console.log('[TenantContextService] 🔄 Triggering data reload...');
    this.reloadTrigger$.next();
  }

  /**
   * Get teams for a specific organization
   */
  getTeamsForOrg(orgId: string): Team[] {
    return this.teamsByOrganization().get(orgId) || [];
  }

  /**
   * Get partners for a specific organization
   */
  getPartnersForOrg(orgId: string): Partner[] {
    return this.partnersByOrganization().get(orgId) || [];
  }

  // ============================================================================
  // Persistence: localStorage operations
  // ============================================================================

  /**
   * Restore context from localStorage
   */
  private restoreContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('[TenantContextService] 💾 Restoring context from localStorage:', saved);

      if (saved) {
        const { type, id } = JSON.parse(saved);
        this._contextType.set(type);
        this._contextId.set(id);
        console.log('[TenantContextService] ✅ Context restored:', { type, id });
      } else {
        // Default to user context
        const userId = this.currentUser()?.id;
        if (userId) {
          this.switchToUser(userId);
        }
      }
    } catch (error) {
      console.error('[TenantContextService] ❌ Failed to restore context:', error);
    }
  }

  /**
   * Persist context to localStorage
   */
  private persistContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const state = {
        type: this.contextType(),
        id: this.contextId()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('[TenantContextService] 💾 Context persisted:', state);
    } catch (error) {
      console.error('[TenantContextService] ❌ Failed to persist context:', error);
    }
  }
}
