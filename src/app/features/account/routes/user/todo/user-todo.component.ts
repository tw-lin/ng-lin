import { ChangeDetectionStrategy, Component, signal, computed, inject, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  createdAt: Date;
  category: string;
}

@Component({
  selector: 'app-user-todo',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'個人待辦'" [content]="headerContent">
      <ng-template #extra>
        <button nz-button nzType="primary" (click)="showAddModal()">
          <span nz-icon nzType="plus"></span>
          新增待辦
        </button>
      </ng-template>
    </page-header>

    <ng-template #headerContent>
      <div class="header-desc">
        <span nz-icon nzType="check-circle" nzTheme="outline" class="mr-xs"></span>
        管理個人任務，保持高效工作節奏
      </div>
    </ng-template>

    <nz-card [nzBordered]="false" class="todo-container">
      <!-- Filter tabs -->
      <nz-segmented
        [nzOptions]="filterOptions"
        [(ngModel)]="currentFilterValue"
        (ngModelChange)="onFilterChange()"
        class="mb-lg"
      ></nz-segmented>

      <!-- Stats cards -->
      <div nz-row [nzGutter]="16" class="mb-lg">
        <div nz-col [nzSpan]="6">
          <nz-statistic
            [nzValue]="stats().total"
            [nzTitle]="'總任務'"
            [nzPrefix]="totalIcon"
            [nzValueStyle]="{ color: '#e5e7eb' }"
          ></nz-statistic>
          <ng-template #totalIcon>
            <span nz-icon nzType="inbox" nzTheme="outline"></span>
          </ng-template>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-statistic
            [nzValue]="stats().pending"
            [nzTitle]="'待完成'"
            [nzPrefix]="pendingIcon"
            [nzValueStyle]="{ color: '#1e3a8a' }"
          ></nz-statistic>
          <ng-template #pendingIcon>
            <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
          </ng-template>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-statistic
            [nzValue]="stats().completed"
            [nzTitle]="'已完成'"
            [nzPrefix]="completedIcon"
            [nzValueStyle]="{ color: '#0d9488' }"
          ></nz-statistic>
          <ng-template #completedIcon>
            <span nz-icon nzType="check-circle" nzTheme="outline"></span>
          </ng-template>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-statistic
            [nzValue]="completionRate()"
            [nzSuffix]="'%'"
            [nzTitle]="'完成率'"
            [nzPrefix]="rateIcon"
            [nzValueStyle]="{ color: '#f59e0b' }"
          ></nz-statistic>
          <ng-template #rateIcon>
            <span nz-icon nzType="rise" nzTheme="outline"></span>
          </ng-template>
        </div>
      </div>

      <!-- Todo list -->
      <nz-list [nzDataSource]="filteredTodos()" [nzRenderItem]="todoItem" [nzLoading]="loading()">
        <ng-template #todoItem let-item>
          <nz-list-item [nzActions]="[editAction, deleteAction]">
            <ng-template #editAction>
              <a (click)="editTodo(item)">編輯</a>
            </ng-template>
            <ng-template #deleteAction>
              <a (click)="deleteTodo(item)" class="text-error">刪除</a>
            </ng-template>

            <nz-list-item-meta [nzAvatar]="priorityBadge">
              <ng-template #priorityBadge>
                <nz-badge [nzStatus]="getPriorityStatus(item.priority)" [nzText]="getPriorityText(item.priority)"></nz-badge>
              </ng-template>

              <ng-template #nzTitle>
                <div class="todo-title">
                  <label nz-checkbox [(ngModel)]="item.completed" (ngModelChange)="toggleComplete(item)" class="mr-sm"></label>
                  <span [class.completed]="item.completed">{{ item.title }}</span>
                  @if (item.dueDate) {
                    <nz-tag [nzColor]="isOverdue(item) ? 'error' : 'default'" class="ml-sm">
                      <span nz-icon nzType="calendar" nzTheme="outline"></span>
                      {{ item.dueDate | date: 'yyyy/MM/dd' }}
                    </nz-tag>
                  }
                </div>
              </ng-template>

              <ng-template #nzDescription>
                @if (item.description) {
                  <div class="todo-desc">{{ item.description }}</div>
                }
                <div class="todo-meta">
                  <nz-tag [nzColor]="'blue'">{{ item.category }}</nz-tag>
                  <span class="text-secondary"> 建立於 {{ item.createdAt | date: 'yyyy/MM/dd HH:mm' }} </span>
                </div>
              </ng-template>
            </nz-list-item-meta>
          </nz-list-item>
        </ng-template>
      </nz-list>

      <!-- Empty state -->
      @if (filteredTodos().length === 0 && !loading()) {
        <nz-empty [nzNotFoundContent]="emptyContent" [nzNotFoundImage]="'simple'" class="mt-xl"></nz-empty>
        <ng-template #emptyContent>
          <span>暫無待辦事項</span>
        </ng-template>
      }
    </nz-card>

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
            <nz-form-label [nzRequired]="true">標題</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="editingTodo().title" name="title" placeholder="輸入待辦事項標題" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                [(ngModel)]="editingTodo().description"
                name="description"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                placeholder="輸入詳細描述（選填）"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">優先級</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="editingTodo().priority" name="priority" nzPlaceHolder="選擇優先級">
                <nz-option nzValue="high" nzLabel="高"></nz-option>
                <nz-option nzValue="medium" nzLabel="中"></nz-option>
                <nz-option nzValue="low" nzLabel="低"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">分類</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="editingTodo().category" name="category" nzPlaceHolder="選擇分類">
                <nz-option nzValue="工作" nzLabel="工作"></nz-option>
                <nz-option nzValue="個人" nzLabel="個人"></nz-option>
                <nz-option nzValue="學習" nzLabel="學習"></nz-option>
                <nz-option nzValue="其他" nzLabel="其他"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>截止日期</nz-form-label>
            <nz-form-control>
              <nz-date-picker
                [(ngModel)]="editingTodo().dueDate"
                name="dueDate"
                nzPlaceHolder="選擇截止日期（選填）"
                class="w-full"
              ></nz-date-picker>
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

      .todo-container {
        min-height: 600px;
      }

      .todo-title {
        display: flex;
        align-items: center;
        font-size: 16px;
      }

      .todo-title .completed {
        text-decoration: line-through;
        opacity: 0.6;
      }

      .todo-desc {
        color: #9ca3af;
        margin-bottom: 8px;
      }

      .todo-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
      }

      .text-secondary {
        color: #6b7280;
        font-size: 12px;
      }

      .text-error {
        color: #ef4444;
      }

      ::ng-deep .ant-statistic-title {
        color: #9ca3af;
      }
    `
  ]
})
export class UserTodoComponent implements OnInit {
  private message = inject(NzMessageService);

  // State signals
  loading = signal(false);
  saving = signal(false);
  modalVisible = signal(false);
  currentFilter = signal<string>('全部');
  currentFilterValue = '全部'; // For template binding
  todos = signal<TodoItem[]>([]);
  editingTodo = signal<Partial<TodoItem>>({
    title: '',
    description: '',
    priority: 'medium',
    category: '工作',
    completed: false
  });

  // Filter options
  filterOptions = ['全部', '待完成', '已完成', '高優先級'];

  // Computed signals
  filteredTodos = computed(() => {
    const filter = this.currentFilter();
    const allTodos = this.todos();

    switch (filter) {
      case '待完成':
        return allTodos.filter(t => !t.completed);
      case '已完成':
        return allTodos.filter(t => t.completed);
      case '高優先級':
        return allTodos.filter(t => t.priority === 'high');
      default:
        return allTodos;
    }
  });

  stats = computed(() => {
    const allTodos = this.todos();
    const completed = allTodos.filter(t => t.completed).length;
    const total = allTodos.length;

    return {
      total,
      pending: total - completed,
      completed
    };
  });

  completionRate = computed(() => {
    const { total, completed } = this.stats();
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  });

  modalTitle = computed(() => (this.editingTodo().id ? '編輯待辦' : '新增待辦'));

  ngOnInit(): void {
    this.loadTodos();
  }

  loadTodos(): void {
    // TODO: Replace with actual service call
    this.loading.set(true);

    // Mock data
    setTimeout(() => {
      this.todos.set([
        {
          id: '1',
          title: '完成專案文檔',
          description: '撰寫技術架構文檔和 API 說明',
          completed: false,
          priority: 'high',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          category: '工作'
        },
        {
          id: '2',
          title: '代碼審查',
          description: '審查前端元件實現',
          completed: true,
          priority: 'medium',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          category: '工作'
        },
        {
          id: '3',
          title: '學習 Angular Signals',
          completed: false,
          priority: 'low',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          category: '學習'
        }
      ]);
      this.loading.set(false);
    }, 500);
  }

  onFilterChange(): void {
    this.currentFilter.set(this.currentFilterValue);
  }

  showAddModal(): void {
    this.editingTodo.set({
      title: '',
      description: '',
      priority: 'medium',
      category: '工作',
      completed: false
    });
    this.modalVisible.set(true);
  }

  editTodo(item: TodoItem): void {
    this.editingTodo.set({ ...item });
    this.modalVisible.set(true);
  }

  deleteTodo(item: TodoItem): void {
    this.todos.update(todos => todos.filter(t => t.id !== item.id));
    this.message.success('已刪除待辦事項');
  }

  toggleComplete(item: TodoItem): void {
    this.message.success(item.completed ? '已標記為完成' : '已標記為未完成');
  }

  handleCancel(): void {
    this.modalVisible.set(false);
  }

  handleOk(): void {
    const todo = this.editingTodo();

    if (!todo.title?.trim()) {
      this.message.error('請輸入標題');
      return;
    }

    this.saving.set(true);

    // TODO: Replace with actual service call
    setTimeout(() => {
      if (todo.id) {
        // Update existing
        this.todos.update(todos => todos.map(t => (t.id === todo.id ? ({ ...t, ...todo } as TodoItem) : t)));
        this.message.success('已更新待辦事項');
      } else {
        // Add new
        const newTodo: TodoItem = {
          ...todo,
          id: Date.now().toString(),
          createdAt: new Date()
        } as TodoItem;
        this.todos.update(todos => [newTodo, ...todos]);
        this.message.success('已新增待辦事項');
      }

      this.saving.set(false);
      this.modalVisible.set(false);
    }, 500);
  }

  getPriorityStatus(priority: string): 'success' | 'processing' | 'default' | 'error' | 'warning' {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  }

  getPriorityText(priority: string): string {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '';
    }
  }

  isOverdue(item: TodoItem): boolean {
    if (!item.dueDate || item.completed) return false;
    return new Date(item.dueDate) < new Date();
  }
}
