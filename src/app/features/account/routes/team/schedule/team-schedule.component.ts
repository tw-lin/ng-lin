import { ChangeDetectionStrategy, Component, signal, computed, inject, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

interface TeamScheduleEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'standup' | 'review' | 'planning' | 'other';
  participants: string[];
}

@Component({
  selector: 'app-team-schedule',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'團隊排程'" [content]="headerContent">
      <ng-template #extra>
        <button nz-button nzType="primary" (click)="showAddModal()">
          <span nz-icon nzType="plus"></span>
          新增排程
        </button>
      </ng-template>
    </page-header>

    <ng-template #headerContent>
      <div class="header-desc">
        <span nz-icon nzType="team" nzTheme="outline" class="mr-xs"></span>
        協調團隊會議與活動安排
      </div>
    </ng-template>

    <nz-card [nzBordered]="false">
      <nz-calendar [(ngModel)]="selectedDate" [nzDateCell]="dateCellTpl" (nzSelectChange)="onDateSelect($event)"></nz-calendar>

      <ng-template #dateCellTpl let-date>
        <div class="date-cell">
          @for (event of getEventsForDate(date); track event.id) {
            <div
              class="event-badge"
              [class.event-standup]="event.type === 'standup'"
              [class.event-review]="event.type === 'review'"
              [class.event-planning]="event.type === 'planning'"
              nz-tooltip
              [nzTooltipTitle]="event.title + ' - ' + event.time"
            >
              {{ event.time }}
            </div>
          }
        </div>
      </ng-template>
    </nz-card>

    @if (selectedDateEvents().length > 0) {
      <nz-card [nzTitle]="'選中日期的排程 - ' + (selectedDate | date: 'yyyy/MM/dd')" class="mt-lg">
        <nz-list [nzDataSource]="selectedDateEvents()" [nzRenderItem]="eventItem">
          <ng-template #eventItem let-event>
            <nz-list-item [nzActions]="[editAction, deleteAction]">
              <ng-template #editAction>
                <a (click)="editEvent(event)">編輯</a>
              </ng-template>
              <ng-template #deleteAction>
                <a (click)="deleteEvent(event)" class="text-error">刪除</a>
              </ng-template>

              <nz-list-item-meta>
                <ng-template #nzTitle>
                  <div class="event-title">
                    <span nz-icon [nzType]="getEventIcon(event.type)" nzTheme="outline" class="mr-sm"></span>
                    <strong>{{ event.title }}</strong>
                    <nz-tag [nzColor]="getEventColor(event.type)" class="ml-sm">
                      {{ getEventTypeText(event.type) }}
                    </nz-tag>
                    <span class="event-time ml-sm">{{ event.time }}</span>
                  </div>
                </ng-template>
                <ng-template #nzDescription>
                  <div class="event-participants">
                    <span nz-icon nzType="user" nzTheme="outline" class="mr-xs"></span>
                    參與者: {{ event.participants.join(', ') }}
                  </div>
                </ng-template>
              </nz-list-item-meta>
            </nz-list-item>
          </ng-template>
        </nz-list>
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
            <nz-form-label [nzRequired]="true">排程標題</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="editingEvent().title" name="title" placeholder="輸入排程標題" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">類型</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="editingEvent().type" name="type" nzPlaceHolder="選擇類型">
                <nz-option nzValue="standup" nzLabel="每日站會"></nz-option>
                <nz-option nzValue="review" nzLabel="代碼審查"></nz-option>
                <nz-option nzValue="planning" nzLabel="計劃會議"></nz-option>
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
            <nz-form-label [nzRequired]="true">時間</nz-form-label>
            <nz-form-control>
              <nz-time-picker
                [(ngModel)]="editingEvent().date"
                name="time"
                nzFormat="HH:mm"
                nzPlaceHolder="選擇時間"
                class="w-full"
              ></nz-time-picker>
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
        flex-direction: column;
        gap: 4px;
        padding: 4px 0;
      }

      .event-badge {
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
        background: #1f2937;
        color: #e5e7eb;
        text-align: center;
      }

      .event-standup {
        background: #1e3a8a;
      }

      .event-review {
        background: #0d9488;
      }

      .event-planning {
        background: #f59e0b;
      }

      .event-title {
        display: flex;
        align-items: center;
        font-size: 15px;
      }

      .event-time {
        color: #9ca3af;
        font-size: 14px;
      }

      .event-participants {
        color: #6b7280;
        font-size: 13px;
        margin-top: 8px;
      }

      .text-error {
        color: #ef4444;
      }
    `
  ]
})
export class TeamScheduleComponent implements OnInit {
  private message = inject(NzMessageService);

  // State signals
  loading = signal(false);
  saving = signal(false);
  modalVisible = signal(false);
  selectedDate = new Date();
  selectedDateValue = new Date(); // For template binding
  events = signal<TeamScheduleEvent[]>([]);
  editingEvent = signal<Partial<TeamScheduleEvent>>({
    title: '',
    type: 'standup',
    date: new Date(),
    participants: []
  });

  // Computed signals
  selectedDateEvents = computed(() => {
    const date = this.selectedDate;
    return this.events().filter(
      e => e.date.getFullYear() === date.getFullYear() && e.date.getMonth() === date.getMonth() && e.date.getDate() === date.getDate()
    );
  });

  modalTitle = computed(() => (this.editingEvent().id ? '編輯排程' : '新增排程'));

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    // Mock data
    this.events.set([
      {
        id: '1',
        title: '每日站會',
        date: new Date(),
        time: '09:30',
        type: 'standup',
        participants: ['全體成員']
      },
      {
        id: '2',
        title: '代碼審查',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        time: '14:00',
        type: 'review',
        participants: ['前端組', '後端組']
      },
      {
        id: '3',
        title: 'Sprint 計劃會議',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        time: '10:00',
        type: 'planning',
        participants: ['Scrum Master', 'Product Owner', '開發團隊']
      }
    ]);
  }

  getEventsForDate(date: Date): TeamScheduleEvent[] {
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
      type: 'standup',
      date: this.selectedDate,
      participants: []
    });
    this.modalVisible.set(true);
  }

  editEvent(event: TeamScheduleEvent): void {
    this.editingEvent.set({ ...event });
    this.modalVisible.set(true);
  }

  deleteEvent(event: TeamScheduleEvent): void {
    this.events.update(events => events.filter(e => e.id !== event.id));
    this.message.success('已刪除排程');
  }

  handleCancel(): void {
    this.modalVisible.set(false);
  }

  handleOk(): void {
    const event = this.editingEvent();

    if (!event.title?.trim()) {
      this.message.error('請輸入排程標題');
      return;
    }

    this.saving.set(true);

    setTimeout(() => {
      if (event.id) {
        this.events.update(events =>
          events.map(e => {
            if (e.id === event.id) {
              const date = event.date!;
              return {
                ...e,
                ...event,
                time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
              } as TeamScheduleEvent;
            }
            return e;
          })
        );
        this.message.success('已更新排程');
      } else {
        const date = event.date!;
        const newEvent: TeamScheduleEvent = {
          ...event,
          id: Date.now().toString(),
          time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        } as TeamScheduleEvent;
        this.events.update(events => [...events, newEvent]);
        this.message.success('已新增排程');
      }

      this.saving.set(false);
      this.modalVisible.set(false);
    }, 500);
  }

  getEventColor(type: string): string {
    const colors = {
      standup: 'blue',
      review: 'green',
      planning: 'orange',
      other: 'default'
    };
    return colors[type as keyof typeof colors] || 'default';
  }

  getEventIcon(type: string): string {
    const icons = {
      standup: 'coffee',
      review: 'eye',
      planning: 'calendar',
      other: 'info-circle'
    };
    return icons[type as keyof typeof icons] || 'info-circle';
  }

  getEventTypeText(type: string): string {
    const texts = {
      standup: '每日站會',
      review: '代碼審查',
      planning: '計劃會議',
      other: '其他'
    };
    return texts[type as keyof typeof texts] || '';
  }
}
