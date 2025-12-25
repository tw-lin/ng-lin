import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS, createAsyncArrayState } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

import { Member } from '../../members.model';
import { MembersService } from '../../members.service';

/**
 * Member List Component
 * 成員列表元件 - 顯示和管理藍圖成員列表
 *
 * Features:
 * - Display members list with table
 * - Add new member
 * - Update member role
 * - Remove member
 *
 * Part of Members Module - Feature-based architecture
 * ✅ High Cohesion: Focused on member list display and management
 * ✅ Low Coupling: Communicates via clear interfaces
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-member-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="成員管理" [nzExtra]="extra">
      <ng-template #extra>
        <button nz-button nzType="primary" (click)="addMember()">
          <span nz-icon nzType="user-add"></span>
          新增成員
        </button>
      </ng-template>

      @if (membersState.loading()) {
        <nz-spin nzSimple></nz-spin>
      } @else if (membersState.error()) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="'載入失敗'"
          [nzDescription]="membersState.error()?.message || '無法載入成員列表'"
          class="mb-md"
        />
      } @else {
        <st #st [data]="membersState.data() || []" [columns]="columns" [page]="{ show: false }"></st>
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class MemberListComponent implements OnInit {
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(ModalHelper);
  private readonly membersService = inject(MembersService);

  // Input: blueprint ID and owner type (required for member validation)
  blueprintId = input.required<string>();
  blueprintOwnerType = input.required<string>(); // 'user' or 'organization'

  // ✅ Modern Pattern: Use AsyncState for unified state management
  readonly membersState = createAsyncArrayState<Member>([]);

  // Table columns
  columns: STColumn[] = [
    {
      title: '成員 ID',
      index: 'accountId',
      width: '200px'
    },
    {
      title: '成員類型',
      index: 'memberType',
      width: '100px',
      format: (item: Member) => {
        const type = item.memberType;
        return type === 'user' ? '用戶' : type === 'team' ? '團隊' : type === 'partner' ? '夥伴' : type;
      }
    },
    {
      title: '角色',
      index: 'role',
      width: '120px',
      type: 'badge',
      badge: {
        viewer: { text: '檢視者', color: 'default' },
        contributor: { text: '貢獻者', color: 'processing' },
        maintainer: { text: '維護者', color: 'success' }
      }
    },
    {
      title: '業務角色',
      index: 'businessRole',
      width: '150px',
      format: (item: Member) => this.getBusinessRoleName(item.businessRole),
      default: '-'
    },
    {
      title: '外部成員',
      index: 'isExternal',
      width: '100px',
      type: 'yn'
    },
    {
      title: '授予時間',
      index: 'grantedAt',
      type: 'date',
      width: '150px'
    },
    {
      title: '操作',
      width: '180px',
      buttons: [
        {
          text: '編輯',
          type: 'link',
          click: (record: any) => this.editMember(record)
        },
        {
          text: '移除',
          type: 'del',
          pop: {
            title: '確定要移除此成員嗎?',
            okType: 'danger'
          },
          click: (record: any) => this.removeMember(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadMembers();
  }

  /**
   * Load members
   * 載入成員列表
   * ✅ Using AsyncState for automatic state management
   */
  private async loadMembers(): Promise<void> {
    try {
      const members = await this.membersService.list(this.blueprintId());
      await this.membersState.load(Promise.resolve(members));
    } catch (error) {
      this.message.error('載入成員失敗');
    }
  }

  /**
   * Get business role display name
   * 取得業務角色顯示名稱
   */
  private getBusinessRoleName(role?: string): string {
    if (!role) return '-';

    const roleMap: Record<string, string> = {
      project_manager: '專案經理',
      site_supervisor: '工地主任',
      engineer: '工程師',
      quality_inspector: '品管人員',
      architect: '建築師',
      contractor: '承包商',
      client: '業主'
    };

    return roleMap[role] || role;
  }

  /**
   * Add new member
   * 新增成員
   */
  async addMember(): Promise<void> {
    const { MemberFormModalComponent } = await import('../member-form/member-form-modal.component');
    this.modal
      .createStatic(
        MemberFormModalComponent,
        {
          blueprintId: this.blueprintId(),
          blueprintOwnerType: this.blueprintOwnerType()
        },
        { size: 'md' }
      )
      .subscribe(result => {
        if (result) {
          this.loadMembers();
        }
      });
  }

  /**
   * Edit member role/permissions
   * 編輯成員角色/權限
   */
  async editMember(record: any): Promise<void> {
    const member = record as Member;
    const { MemberFormModalComponent } = await import('../member-form/member-form-modal.component');
    this.modal
      .createStatic(
        MemberFormModalComponent,
        {
          blueprintId: this.blueprintId(),
          blueprintOwnerType: this.blueprintOwnerType(),
          member
        },
        { size: 'md' }
      )
      .subscribe(result => {
        if (result) {
          this.loadMembers();
        }
      });
  }

  /**
   * Remove member
   * 移除成員
   */
  async removeMember(record: any): Promise<void> {
    const member = record as Member;

    try {
      await this.membersService.removeMember(this.blueprintId(), member.id);
      this.message.success('成員已移除');
      this.loadMembers();
    } catch (error) {
      this.message.error('移除成員失敗');
    }
  }
}
