import { ChangeDetectionStrategy, Component, signal, computed, inject, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  type: 'meeting' | 'task' | 'milestone' | 'other';
  description?: string;
  participants?: string[];
}

@Component({
  selector: 'app-organization-schedule',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'組織排程'" [content]="headerContent">
      <ng-template #extra>
        <button nz-button nzType="primary" (click)="showAddModal()">
          <span nz-icon nzType="plus"></span>
          新增事件
        </button>
      </ng-template>
    </page-header>

    <ng-template #headerContent>
      <div class="header-desc">
        <span nz-icon nzType="calendar" nzTheme="outline" class="mr-xs"></span>
        統籌組織活動與里程碑規劃
      </div>
    </ng-template>

    <nz-card [nzBordered]="false">
      <nz-calendar
        [(ngModel)]="selectedDateValue"
        [(nzMode)]="mode"
        [nzDateCell]="dateCellTpl"
        (nzSelectChange)="onDateSelect($event)"
      ></nz-calendar>

      <ng-template #dateCellTpl let-date>
        <div class="date-cell">
          @for (event of getEventsForDate(date); track event.id) {
            <div
              class="event-dot"
              [class.event-meeting]="event.type === 'meeting'"
              [class.event-task]="event.type === 'task'"
              [class.event-milestone]="event.type === 'milestone'"
              nz-tooltip
              [nzTooltipTitle]="event.title"
            ></div>
          }
        </div>
      </ng-template>
    </nz-card>

    <!-- Events list for selected date -->
    @if (selectedDateEvents().length > 0) {
      <nz-card [nzTitle]="'選中日期的事件 - ' + (selectedDate | date: 'yyyy/MM/dd')" class="mt-lg">
        <nz-timeline>
          @for (event of selectedDateEvents(); track event.id) {
            <nz-timeline-item [nzColor]="getEventColor(event.type)">
              <div class="event-item">
                <div class="event-title">
                  <span nz-icon [nzType]="getEventIcon(event.type)" nzTheme="outline" class="mr-sm"></span>
                  <strong>{{ event.title }}</strong>
                  <nz-tag [nzColor]="getEventColor(event.type)" class="ml-sm">
                    {{ getEventTypeText(event.type) }}
                  </nz-tag>
                </div>
                @if (event.description) {
                  <div class="event-desc">{{ event.description }}</div>
                }
                @if (event.participants && event.participants.length > 0) {
                  <div class="event-participants">
                    <span nz-icon nzType="team" nzTheme="outline" class="mr-xs"></span>
                    {{ event.participants.length }} 位參與者
                  </div>
                }
                <div class="event-actions">
                  <a (click)="editEvent(event)">編輯</a>
                  <nz-divider nzType="vertical"></nz-divider>
                  <a (click)="deleteEvent(event)" class="text-error">刪除</a>
                </div>
              </div>
            </nz-timeline-item>
          }
        </nz-timeline>
      </nz-card>
    }

    <!-- Add/Edit Modal -->
    <nz-modal
      [nzVisible]="modalVisible()"
      [nzTitle]="modalTitle()"
      (nzOnCancel)="handleCancel()"
      (nzOnOk)="handleOk()"
      (nzVisibleChange)="modalVisible.set($event)"
      [nzOkLoading]="saving()"
    >
      <ng-container *nzModalContent>
        <form nz-form [nzLayout]="'vertical'">
          <nz-form-item>
            <nz-form-label [nzRequired]="true">事件標題</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="editingEvent().title" name="title" placeholder="輸入事件標題" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">事件類型</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="editingEvent().type" name="type" nzPlaceHolder="選擇事件類型">
                <nz-option nzValue="meeting" nzLabel="會議"></nz-option>
                <nz-option nzValue="task" nzLabel="任務"></nz-option>
                <nz-option nzValue="milestone" nzLabel="里程碑"></nz-option>
                <nz-option nzValue="other" nzLabel="其他"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">日期</nz-form-label>
            <nz-form-control>
              <nz-date-picker [(ngModel)]="editingEvent().date" name="date" nzPlaceHolder="選擇日期" class="w-full"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="editingEvent().description"
                name="description"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                placeholder="輸入事件描述（選填）"
              ></textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>
  `,
  styles: [
    `
      .header-desc {
        color: #9ca3af;
        font-size: 14px;
      }

      .date-cell {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        padding: 4px 0;
      }

      .event-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #64748b;
      }

      .event-meeting {
        background: #1e3a8a;
      }

      .event-task {
        background: #0d9488;
      }

      .event-milestone {
        background: #f59e0b;
      }

      .event-item {
        padding: 8px 0;
      }

      .event-title {
        display: flex;
        align-items: center;
        font-size: 15px;
        margin-bottom: 8px;
      }

      .event-desc {
        color: #9ca3af;
        margin-bottom: 8px;
      }

      .event-participants {
        color: #6b7280;
        font-size: 13px;
        margin-bottom: 8px;
      }

      .event-actions a {
        margin-right: 8px;
      }

      .text-error {
        color: #ef4444;
      }
    `
  ]
})
export class OrganizationScheduleComponent implements OnInit {
  private message = inject(NzMessageService);

  // State signals
  loading = signal(false);
  saving = signal(false);
  modalVisible = signal(false);
  selectedDate = new Date();
  selectedDateValue = new Date(); // For template binding
  mode: 'month' | 'year' = 'month';
  events = signal<ScheduleEvent[]>([]);
  editingEvent = signal<Partial<ScheduleEvent>>({
    title: '',
    type: 'meeting',
    date: new Date()
  });

  // Computed signals
  selectedDateEvents = computed(() => {
    const date = this.selectedDate;
    return this.events().filter(
      e => e.date.getFullYear() === date.getFullYear() && e.date.getMonth() === date.getMonth() && e.date.getDate() === date.getDate()
    );
  });

  modalTitle = computed(() => (this.editingEvent().id ? '編輯事件' : '新增事件'));

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    // Mock data
    this.events.set([
      {
        id: '1',
        title: '季度業務審查會議',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        type: 'meeting',
        description: '審查本季度業務成果',
        participants: ['張三', '李四', '王五']
      },
      {
        id: '2',
        title: '專案里程碑檢查',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        type: 'milestone',
        description: '核心功能開發完成'
      },
      {
        id: '3',
        title: '技術分享會',
        date: new Date(),
        type: 'other',
        participants: ['全體工程師']
      }
    ]);
  }

  getEventsForDate(date: Date): ScheduleEvent[] {
    return this.events().filter(
      e => e.date.getFullYear() === date.getFullYear() && e.date.getMonth() === date.getMonth() && e.date.getDate() === date.getDate()
    );
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    this.selectedDateValue = date;
  }

  showAddModal(): void {
    this.editingEvent.set({
      title: '',
      type: 'meeting',
      date: this.selectedDate
    });
    this.modalVisible.set(true);
  }

  editEvent(event: ScheduleEvent): void {
    this.editingEvent.set({ ...event });
    this.modalVisible.set(true);
  }

  deleteEvent(event: ScheduleEvent): void {
    this.events.update(events => events.filter(e => e.id !== event.id));
    this.message.success('已刪除事件');
  }

  handleCancel(): void {
    this.modalVisible.set(false);
  }

  handleOk(): void {
    const event = this.editingEvent();

    if (!event.title?.trim()) {
      this.message.error('請輸入事件標題');
      return;
    }

    this.saving.set(true);

    setTimeout(() => {
      if (event.id) {
        this.events.update(events => events.map(e => (e.id === event.id ? ({ ...e, ...event } as ScheduleEvent) : e)));
        this.message.success('已更新事件');
      } else {
        const newEvent: ScheduleEvent = {
          ...event,
          id: Date.now().toString()
        } as ScheduleEvent;
        this.events.update(events => [...events, newEvent]);
        this.message.success('已新增事件');
      }

      this.saving.set(false);
      this.modalVisible.set(false);
    }, 500);
  }

  getEventColor(type: string): string {
    const colors = {
      meeting: 'blue',
      task: 'green',
      milestone: 'orange',
      other: 'default'
    };
    return colors[type as keyof typeof colors] || 'default';
  }

  getEventIcon(type: string): string {
    const icons = {
      meeting: 'team',
      task: 'check-circle',
      milestone: 'flag',
      other: 'info-circle'
    };
    return icons[type as keyof typeof icons] || 'info-circle';
  }

  getEventTypeText(type: string): string {
    const texts = {
      meeting: '會議',
      task: '任務',
      milestone: '里程碑',
      other: '其他'
    };
    return texts[type as keyof typeof texts] || '';
  }
}
