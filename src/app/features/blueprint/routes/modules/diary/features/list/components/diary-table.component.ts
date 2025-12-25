/**
 * Diary Table Component
 * 日誌表格元件
 *
 * Displays diary entries in a table with actions
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, input, output } from '@angular/core';
import { STColumn, STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

import { Diary } from '../../../diary.model';

@Component({
  selector: 'app-diary-table',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <st
      [data]="diaries()"
      [columns]="columns"
      [page]="{ show: true, showSize: true }"
      [loading]="loading()"
      (change)="handleTableChange($event)"
    />
  `
})
export class DiaryTableComponent {
  diaries = input.required<Diary[]>();
  loading = input<boolean>(false);

  viewDiary = output<Diary>();
  editDiary = output<Diary>();
  deleteDiary = output<Diary>();
  tableChange = output<STChange>();

  columns: STColumn[] = [
    {
      title: '日期',
      index: 'date',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120,
      sort: {
        default: 'descend'
      }
    },
    {
      title: '標題',
      index: 'title',
      width: 200
    },
    {
      title: '描述',
      index: 'description',
      width: 300,
      format: (item: any) => item.description || '-'
    },
    {
      title: '工時',
      index: 'workHours',
      width: 80,
      format: (item: any) => (item.workHours ? `${item.workHours}h` : '-')
    },
    {
      title: '工人數',
      index: 'workers',
      width: 80,
      format: (item: any) => item.workers || '-'
    },
    {
      title: '天氣',
      index: 'weather',
      width: 100,
      format: (item: any) => item.weather || '-'
    },
    {
      title: '溫度',
      index: 'temperature',
      width: 80,
      format: (item: any) => (item.temperature ? `${item.temperature}°C` : '-')
    },
    {
      title: '照片',
      index: 'photos',
      width: 80,
      format: (item: any) => {
        const count = item.photos?.length || 0;
        return count > 0 ? `${count} 張` : '-';
      }
    },
    {
      title: '建立時間',
      index: 'createdAt',
      type: 'date',
      dateFormat: 'yyyy-MM-dd HH:mm',
      width: 150,
      sort: true
    },
    {
      title: '操作',
      width: 180,
      buttons: [
        {
          text: '查看',
          icon: 'eye',
          click: (record: any) => this.viewDiary.emit(record)
        },
        {
          text: '編輯',
          icon: 'edit',
          click: (record: any) => this.editDiary.emit(record)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確認刪除此日誌？',
            okType: 'danger'
          },
          click: (record: any) => this.deleteDiary.emit(record)
        }
      ]
    }
  ];

  handleTableChange(event: STChange): void {
    this.tableChange.emit(event);
  }
}
