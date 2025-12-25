import { ChangeDetectionStrategy, Component, signal, computed, inject, OnInit } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  capacity: number;
  currentStock: number;
  manager: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface MaterialItem {
  id: string;
  name: string;
  category: 'construction' | 'electrical' | 'plumbing' | 'finishing' | 'other';
  quantity: number;
  unit: string;
  locationId: string;
  locationName: string;
  minStock: number;
  status: 'sufficient' | 'low' | 'critical';
  lastUpdated: Date;
}

@Component({
  selector: 'app-organization-repository',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'倉儲'" [content]="headerContent">
      <ng-template #extra>
        <button nz-button (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
        <button nz-button (click)="showLocationModal()" class="ml-sm">
          <span nz-icon nzType="environment"></span>
          倉庫管理
        </button>
        <button nz-button nzType="primary" (click)="showAddMaterialModal()" class="ml-sm">
          <span nz-icon nzType="plus"></span>
          新增物料
        </button>
      </ng-template>
    </page-header>

    <ng-template #headerContent>
      <div class="header-desc">
        <span nz-icon nzType="gold" nzTheme="outline" class="mr-xs"></span>
        管理多地點倉儲與庫存
      </div>
    </ng-template>

    <!-- Warehouse locations summary -->
    <div nz-row [nzGutter]="16" class="mb-lg">
      @for (location of locations(); track location.id) {
        <div nz-col [nzSpan]="6">
          <nz-card [nzBordered]="false" class="location-card">
            <div class="location-header">
              <h4>
                <span nz-icon nzType="environment" nzTheme="outline" class="mr-xs"></span>
                {{ location.name }}
              </h4>
              <nz-badge [nzStatus]="getLocationStatus(location.status)" [nzText]="getLocationStatusText(location.status)"></nz-badge>
            </div>
            <div class="location-info">
              <p class="text-secondary">{{ location.address }}</p>
              <nz-progress
                [nzPercent]="(location.currentStock / location.capacity) * 100"
                [nzStatus]="getCapacityStatus(location)"
                [nzShowInfo]="false"
              ></nz-progress>
              <div class="location-stats">
                <span>庫存: {{ location.currentStock }} / {{ location.capacity }}</span>
                <span class="text-secondary">管理員: {{ location.manager }}</span>
              </div>
            </div>
          </nz-card>
        </div>
      }
    </div>

    <nz-card [nzBordered]="false" [nzTitle]="'物料清單'">
      <!-- Filter tabs -->
      <nz-space class="mb-lg">
        <nz-select
          *nzSpaceItem
          [(ngModel)]="selectedLocationValue"
          (ngModelChange)="onLocationChange()"
          nzPlaceHolder="選擇倉庫地點"
          style="width: 200px"
        >
          <nz-option nzValue="all" nzLabel="全部地點"></nz-option>
          @for (location of locations(); track location.id) {
            <nz-option [nzValue]="location.id" [nzLabel]="location.name"></nz-option>
          }
        </nz-select>

        <nz-radio-group *nzSpaceItem [(ngModel)]="currentCategoryValue" (ngModelChange)="onCategoryChange()">
          <label nz-radio-button nzValue="all">全部類別</label>
          <label nz-radio-button nzValue="construction">建材</label>
          <label nz-radio-button nzValue="electrical">電氣</label>
          <label nz-radio-button nzValue="plumbing">水電</label>
          <label nz-radio-button nzValue="finishing">裝修</label>
          <label nz-radio-button nzValue="other">其他</label>
        </nz-radio-group>

        <nz-radio-group *nzSpaceItem [(ngModel)]="currentStatusValue" (ngModelChange)="onStatusChange()">
          <label nz-radio-button nzValue="all">全部狀態</label>
          <label nz-radio-button nzValue="sufficient">充足</label>
          <label nz-radio-button nzValue="low">偏低</label>
          <label nz-radio-button nzValue="critical">緊急</label>
        </nz-radio-group>
      </nz-space>

      <!-- Table -->
      <st [data]="filteredMaterials()" [columns]="columns" [loading]="loading()" [page]="{ show: true, showSize: true }"></st>
    </nz-card>

    <!-- Add/Edit Material Modal -->
    <nz-modal
      [nzVisible]="materialModalVisible()"
      [nzTitle]="materialModalTitle()"
      (nzOnCancel)="handleMaterialCancel()"
      (nzOnOk)="handleMaterialOk()"
      (nzVisibleChange)="materialModalVisible.set($event)"
      [nzOkLoading]="saving()"
      [nzWidth]="600"
    >
      <ng-container *nzModalContent>
        <form nz-form [nzLayout]="'vertical'">
          <nz-form-item>
            <nz-form-label [nzRequired]="true">物料名稱</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="editingMaterial().name" name="name" placeholder="輸入物料名稱" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">類別</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="editingMaterial().category" name="category" nzPlaceHolder="選擇類別" class="w-full">
                <nz-option nzValue="construction" nzLabel="建材"></nz-option>
                <nz-option nzValue="electrical" nzLabel="電氣"></nz-option>
                <nz-option nzValue="plumbing" nzLabel="水電"></nz-option>
                <nz-option nzValue="finishing" nzLabel="裝修"></nz-option>
                <nz-option nzValue="other" nzLabel="其他"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">數量</nz-form-label>
                <nz-form-control>
                  <nz-input-number
                    [(ngModel)]="editingMaterial().quantity"
                    name="quantity"
                    [nzMin]="0"
                    [nzStep]="1"
                    class="w-full"
                  ></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </div>

            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label [nzRequired]="true">單位</nz-form-label>
                <nz-form-control>
                  <nz-select [(ngModel)]="editingMaterial().unit" name="unit" nzPlaceHolder="選擇單位" class="w-full">
                    <nz-option nzValue="件" nzLabel="件"></nz-option>
                    <nz-option nzValue="箱" nzLabel="箱"></nz-option>
                    <nz-option nzValue="噸" nzLabel="噸"></nz-option>
                    <nz-option nzValue="米" nzLabel="米"></nz-option>
                    <nz-option nzValue="平方米" nzLabel="平方米"></nz-option>
                    <nz-option nzValue="立方米" nzLabel="立方米"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">存放地點</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="editingMaterial().locationId" name="locationId" nzPlaceHolder="選擇倉庫地點" class="w-full">
                @for (location of locations(); track location.id) {
                  <nz-option [nzValue]="location.id" [nzLabel]="location.name"></nz-option>
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzRequired]="true">最低庫存</nz-form-label>
            <nz-form-control>
              <nz-input-number
                [(ngModel)]="editingMaterial().minStock"
                name="minStock"
                [nzMin]="0"
                [nzStep]="1"
                class="w-full"
              ></nz-input-number>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>

    <!-- Location Management Modal -->
    <nz-modal
      [nzVisible]="locationModalVisible()"
      [nzTitle]="'倉庫地點管理'"
      (nzOnCancel)="handleLocationCancel()"
      (nzVisibleChange)="locationModalVisible.set($event)"
      [nzFooter]="null"
      [nzWidth]="800"
    >
      <ng-container *nzModalContent>
        <button nz-button nzType="primary" (click)="showAddLocationModal()" class="mb-md">
          <span nz-icon nzType="plus"></span>
          新增地點
        </button>

        <nz-list [nzDataSource]="locations()" [nzRenderItem]="locationItem">
          <ng-template #locationItem let-location>
            <nz-list-item [nzActions]="[editLocationAction, deleteLocationAction]">
              <ng-template #editLocationAction>
                <a (click)="editLocation(location)">編輯</a>
              </ng-template>
              <ng-template #deleteLocationAction>
                <a (click)="deleteLocation(location)" class="text-error">刪除</a>
              </ng-template>

              <nz-list-item-meta>
                <ng-template #nzTitle>
                  <div class="location-title">
                    <span nz-icon nzType="environment" nzTheme="outline" class="mr-sm"></span>
                    <strong>{{ location.name }}</strong>
                    <nz-badge
                      [nzStatus]="getLocationStatus(location.status)"
                      [nzText]="getLocationStatusText(location.status)"
                      class="ml-sm"
                    ></nz-badge>
                  </div>
                </ng-template>
                <ng-template #nzDescription>
                  <div class="location-details">
                    <p>地址: {{ location.address }}</p>
                    <p>容量: {{ location.currentStock }} / {{ location.capacity }}</p>
                    <p>管理員: {{ location.manager }}</p>
                  </div>
                </ng-template>
              </nz-list-item-meta>
            </nz-list-item>
          </ng-template>
        </nz-list>
      </ng-container>
    </nz-modal>
  `,
  styles: [
    `
      .header-desc {
        color: #9ca3af;
        font-size: 14px;
      }

      .location-card {
        height: 100%;
        background: #0f172a;
      }

      .location-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .location-header h4 {
        margin: 0;
        font-size: 16px;
        color: #e5e7eb;
      }

      .location-info {
        font-size: 13px;
      }

      .location-stats {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 12px;
      }

      .text-secondary {
        color: #6b7280;
      }

      .location-title {
        display: flex;
        align-items: center;
      }

      .location-details p {
        margin: 4px 0;
        color: #9ca3af;
      }

      .text-error {
        color: #ef4444;
      }

      ::ng-deep .ant-progress-line {
        margin-top: 8px;
        margin-bottom: 8px;
      }
    `
  ]
})
export class OrganizationRepositoryComponent implements OnInit {
  private message = inject(NzMessageService);

  // State signals
  loading = signal(false);
  saving = signal(false);
  materialModalVisible = signal(false);
  locationModalVisible = signal(false);

  selectedLocation = signal<string>('all');
  selectedLocationValue = 'all';

  currentCategory = signal<string>('all');
  currentCategoryValue = 'all';

  currentStatus = signal<string>('all');
  currentStatusValue = 'all';

  locations = signal<WarehouseLocation[]>([]);
  materials = signal<MaterialItem[]>([]);

  editingMaterial = signal<Partial<MaterialItem>>({
    name: '',
    category: 'construction',
    quantity: 0,
    unit: '件',
    minStock: 0
  });

  // Table columns
  columns: STColumn[] = [
    {
      title: '物料名稱',
      index: 'name',
      width: '20%'
    },
    {
      title: '類別',
      index: 'category',
      type: 'badge',
      badge: {
        construction: { text: '建材', color: 'processing' },
        electrical: { text: '電氣', color: 'warning' },
        plumbing: { text: '水電', color: 'success' },
        finishing: { text: '裝修', color: 'default' },
        other: { text: '其他', color: 'default' }
      },
      width: '10%'
    },
    {
      title: '數量',
      index: 'quantity',
      render: 'quantity',
      width: '10%'
    },
    {
      title: '單位',
      index: 'unit',
      width: '8%'
    },
    {
      title: '存放地點',
      index: 'locationName',
      width: '15%'
    },
    {
      title: '庫存狀態',
      index: 'status',
      type: 'badge',
      badge: {
        sufficient: { text: '充足', color: 'success' },
        low: { text: '偏低', color: 'warning' },
        critical: { text: '緊急', color: 'error' }
      },
      width: '10%'
    },
    {
      title: '最低庫存',
      index: 'minStock',
      width: '10%'
    },
    {
      title: '更新時間',
      index: 'lastUpdated',
      type: 'date',
      dateFormat: 'yyyy/MM/dd HH:mm',
      width: '12%'
    },
    {
      title: '操作',
      buttons: [
        {
          text: '編輯',
          icon: 'edit',
          click: (record: MaterialItem) => this.editMaterial(record)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確定要刪除嗎？',
            okType: 'danger'
          },
          click: (record: MaterialItem) => this.deleteMaterial(record)
        }
      ],
      width: '15%'
    }
  ];

  // Computed signals
  filteredMaterials = computed(() => {
    const location = this.selectedLocation();
    const category = this.currentCategory();
    const status = this.currentStatus();
    let allMaterials = this.materials();

    if (location !== 'all') {
      allMaterials = allMaterials.filter(m => m.locationId === location);
    }

    if (category !== 'all') {
      allMaterials = allMaterials.filter(m => m.category === category);
    }

    if (status !== 'all') {
      allMaterials = allMaterials.filter(m => m.status === status);
    }

    return allMaterials;
  });

  materialModalTitle = computed(() => (this.editingMaterial().id ? '編輯物料' : '新增物料'));

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Mock data for locations
    setTimeout(() => {
      this.locations.set([
        {
          id: '1',
          name: '北區倉庫',
          address: '台北市內湖區工業路100號',
          capacity: 1000,
          currentStock: 750,
          manager: '張三',
          status: 'active'
        },
        {
          id: '2',
          name: '中區倉庫',
          address: '台中市西屯區工業區88號',
          capacity: 800,
          currentStock: 650,
          manager: '李四',
          status: 'active'
        },
        {
          id: '3',
          name: '南區倉庫',
          address: '高雄市前鎮區臨海路66號',
          capacity: 1200,
          currentStock: 400,
          manager: '王五',
          status: 'maintenance'
        }
      ]);

      // Mock data for materials
      this.materials.set([
        {
          id: '1',
          name: '水泥',
          category: 'construction',
          quantity: 500,
          unit: '噸',
          locationId: '1',
          locationName: '北區倉庫',
          minStock: 100,
          status: 'sufficient',
          lastUpdated: new Date()
        },
        {
          id: '2',
          name: '鋼筋',
          category: 'construction',
          quantity: 80,
          unit: '噸',
          locationId: '1',
          locationName: '北區倉庫',
          minStock: 100,
          status: 'low',
          lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: '電線',
          category: 'electrical',
          quantity: 20,
          unit: '米',
          locationId: '2',
          locationName: '中區倉庫',
          minStock: 50,
          status: 'critical',
          lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          name: 'PVC管',
          category: 'plumbing',
          quantity: 300,
          unit: '米',
          locationId: '2',
          locationName: '中區倉庫',
          minStock: 100,
          status: 'sufficient',
          lastUpdated: new Date()
        },
        {
          id: '5',
          name: '油漆',
          category: 'finishing',
          quantity: 150,
          unit: '箱',
          locationId: '3',
          locationName: '南區倉庫',
          minStock: 50,
          status: 'sufficient',
          lastUpdated: new Date()
        }
      ]);

      this.loading.set(false);
    }, 500);
  }

  onLocationChange(): void {
    this.selectedLocation.set(this.selectedLocationValue);
  }

  onCategoryChange(): void {
    this.currentCategory.set(this.currentCategoryValue);
  }

  onStatusChange(): void {
    this.currentStatus.set(this.currentStatusValue);
  }

  refresh(): void {
    this.loadData();
    this.message.info('已重新整理');
  }

  showLocationModal(): void {
    this.locationModalVisible.set(true);
  }

  showAddMaterialModal(): void {
    this.editingMaterial.set({
      name: '',
      category: 'construction',
      quantity: 0,
      unit: '件',
      minStock: 0,
      locationId: this.locations()[0]?.id
    });
    this.materialModalVisible.set(true);
  }

  showAddLocationModal(): void {
    this.message.info('新增地點功能開發中');
  }

  editMaterial(material: MaterialItem): void {
    this.editingMaterial.set({ ...material });
    this.materialModalVisible.set(true);
  }

  deleteMaterial(material: MaterialItem): void {
    this.materials.update(materials => materials.filter(m => m.id !== material.id));
    this.message.success('已刪除物料');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  editLocation(_location: WarehouseLocation): void {
    this.message.info('編輯地點功能開發中');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteLocation(_location: WarehouseLocation): void {
    this.message.info('刪除地點功能開發中');
  }

  handleMaterialCancel(): void {
    this.materialModalVisible.set(false);
  }

  handleMaterialOk(): void {
    const material = this.editingMaterial();

    if (!material.name?.trim()) {
      this.message.error('請輸入物料名稱');
      return;
    }

    if (!material.locationId) {
      this.message.error('請選擇存放地點');
      return;
    }

    this.saving.set(true);

    setTimeout(() => {
      const location = this.locations().find(l => l.id === material.locationId);
      const quantity = material.quantity || 0;
      const minStock = material.minStock || 0;

      let status: 'sufficient' | 'low' | 'critical' = 'sufficient';
      if (quantity < minStock * 0.5) {
        status = 'critical';
      } else if (quantity < minStock) {
        status = 'low';
      }

      if (material.id) {
        // Update existing
        this.materials.update(materials =>
          materials.map(m =>
            m.id === material.id
              ? ({
                  ...m,
                  ...material,
                  locationName: location?.name || '',
                  status,
                  lastUpdated: new Date()
                } as MaterialItem)
              : m
          )
        );
        this.message.success('已更新物料');
      } else {
        // Add new
        const newMaterial: MaterialItem = {
          ...material,
          id: Date.now().toString(),
          locationName: location?.name || '',
          status,
          lastUpdated: new Date()
        } as MaterialItem;
        this.materials.update(materials => [newMaterial, ...materials]);
        this.message.success('已新增物料');
      }

      this.saving.set(false);
      this.materialModalVisible.set(false);
    }, 500);
  }

  handleLocationCancel(): void {
    this.locationModalVisible.set(false);
  }

  getLocationStatus(status: string): 'success' | 'processing' | 'default' | 'error' | 'warning' {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  }

  getLocationStatusText(status: string): string {
    switch (status) {
      case 'active':
        return '運作中';
      case 'maintenance':
        return '維護中';
      case 'inactive':
        return '停用';
      default:
        return '';
    }
  }

  getCapacityStatus(location: WarehouseLocation): 'success' | 'normal' | 'exception' {
    const usage = (location.currentStock / location.capacity) * 100;
    if (usage >= 90) return 'exception';
    if (usage >= 70) return 'normal';
    return 'success';
  }
}
