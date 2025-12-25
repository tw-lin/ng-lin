import { Injectable, inject } from '@angular/core';
import { AuthFacade, LoggerService, BlueprintRole } from '@core';
import { BlueprintMemberRepository } from '@core/blueprint/repositories';
import { Observable, map, of } from 'rxjs';

/**
 * Permission Service
 * 權限服務 - 客戶端權限檢查
 *
 * Provides client-side permission checking for UI elements.
 * Note: Database-level security is enforced by Firestore Security Rules.
 *
 * Following Occam's Razor: Simple, focused permission checks.
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly auth = inject(AuthFacade);
  private readonly memberRepository = inject(BlueprintMemberRepository);
  private readonly logger = inject(LoggerService);

  // Cache for blueprint permissions
  private permissionCache = new Map<string, { permissions: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if current user can read blueprint
   * 檢查當前使用者是否可讀取藍圖
   */
  canReadBlueprint(blueprintId: string): Observable<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      return of(false);
    }

    // Check cache first
    const cached = this.getFromCache(blueprintId);
    if (cached) {
      return of(cached.permissions.canRead || false);
    }

    // Query member permissions
    return this.memberRepository.findByBlueprint(blueprintId).pipe(
      map(members => {
        const member = members.find(m => m.accountId === user.uid);
        const canRead = !!member; // Any member can read

        // Cache result
        this.cachePermissions(blueprintId, { canRead });

        return canRead;
      })
    );
  }

  /**
   * Check if current user can edit blueprint
   * 檢查當前使用者是否可編輯藍圖
   */
  canEditBlueprint(blueprintId: string): Observable<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      return of(false);
    }

    const cached = this.getFromCache(blueprintId);
    if (cached) {
      return of(cached.permissions.canEdit || false);
    }

    return this.memberRepository.findByBlueprint(blueprintId).pipe(
      map(members => {
        const member = members.find(m => m.accountId === user.uid);
        const canEdit = member && (member.role === BlueprintRole.MAINTAINER || member.role === BlueprintRole.CONTRIBUTOR);

        this.cachePermissions(blueprintId, { canEdit });

        return !!canEdit;
      })
    );
  }

  /**
   * Check if current user can delete blueprint
   * 檢查當前使用者是否可刪除藍圖
   */
  canDeleteBlueprint(blueprintId: string): Observable<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      return of(false);
    }

    const cached = this.getFromCache(blueprintId);
    if (cached) {
      return of(cached.permissions.canDelete || false);
    }

    return this.memberRepository.findByBlueprint(blueprintId).pipe(
      map(members => {
        const member = members.find(m => m.accountId === user.uid);
        const canDelete = member && member.role === BlueprintRole.MAINTAINER;

        this.cachePermissions(blueprintId, { canDelete });

        return !!canDelete;
      })
    );
  }

  /**
   * Check if current user can manage members
   * 檢查當前使用者是否可管理成員
   */
  canManageMembers(blueprintId: string): Observable<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      return of(false);
    }

    const cached = this.getFromCache(blueprintId);
    if (cached) {
      return of(cached.permissions.canManageMembers || false);
    }

    return this.memberRepository.findByBlueprint(blueprintId).pipe(
      map(members => {
        const member = members.find(m => m.accountId === user.uid);
        const canManageMembers = member && member.role === BlueprintRole.MAINTAINER;

        this.cachePermissions(blueprintId, { canManageMembers });

        return !!canManageMembers;
      })
    );
  }

  /**
   * Check if current user can manage settings
   * 檢查當前使用者是否可管理設定
   */
  canManageSettings(blueprintId: string): Observable<boolean> {
    return this.canManageMembers(blueprintId); // Same permission level
  }

  /**
   * Get all permissions for blueprint
   * 取得藍圖的所有權限
   */
  getBlueprintPermissions(blueprintId: string): Observable<{
    canRead: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageMembers: boolean;
    canManageSettings: boolean;
  }> {
    const user = this.auth.currentUser;
    if (!user) {
      return of({
        canRead: false,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canManageSettings: false
      });
    }

    // Check cache
    const cached = this.getFromCache(blueprintId);
    if (cached && cached.permissions.canRead !== undefined) {
      return of(cached.permissions);
    }

    // Query member permissions
    return this.memberRepository.findByBlueprint(blueprintId).pipe(
      map(members => {
        const member = members.find(m => m.accountId === user.uid);

        if (!member) {
          const permissions = {
            canRead: false,
            canEdit: false,
            canDelete: false,
            canManageMembers: false,
            canManageSettings: false
          };
          this.cachePermissions(blueprintId, permissions);
          return permissions;
        }

        const permissions = {
          canRead: true,
          canEdit: member.role === BlueprintRole.MAINTAINER || member.role === BlueprintRole.CONTRIBUTOR,
          canDelete: member.role === BlueprintRole.MAINTAINER,
          canManageMembers: member.role === BlueprintRole.MAINTAINER,
          canManageSettings: member.role === BlueprintRole.MAINTAINER
        };

        this.cachePermissions(blueprintId, permissions);
        this.logger.debug('[PermissionService]', `Permissions for ${blueprintId}:`, permissions);

        return permissions;
      })
    );
  }

  /**
   * Clear permission cache
   * 清除權限快取
   */
  clearCache(blueprintId?: string): void {
    if (blueprintId) {
      this.permissionCache.delete(blueprintId);
      this.logger.debug('[PermissionService]', `Cleared cache for ${blueprintId}`);
    } else {
      this.permissionCache.clear();
      this.logger.debug('[PermissionService]', 'Cleared all permission cache');
    }
  }

  /**
   * Get from cache
   * 從快取取得
   */
  private getFromCache(blueprintId: string): { permissions: any; timestamp: number } | null {
    const cached = this.permissionCache.get(blueprintId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    return null;
  }

  /**
   * Cache permissions
   * 快取權限
   */
  private cachePermissions(blueprintId: string, permissions: any): void {
    this.permissionCache.set(blueprintId, {
      permissions,
      timestamp: Date.now()
    });
  }
}
