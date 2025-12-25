/**
 * Location Selector Component
 * 地點選擇器組件
 */

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { ALL_COUNTIES } from '../../core/config/constants';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-select
      [ngModel]="selectedLocation()"
      (ngModelChange)="onLocationChange($event)"
      nzPlaceHolder="請選擇縣市"
      nzShowSearch
      [nzSize]="'large'"
      style="width: 200px"
    >
      @for (county of counties; track county) {
        <nz-option [nzLabel]="county" [nzValue]="county" />
      }
    </nz-select>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `
  ]
})
export class LocationSelectorComponent {
  /** 當前選中的地點 */
  selectedLocation = input<string>('臺北市');

  /** 地點變更事件 */
  locationChange = output<string>();

  /** 縣市列表 */
  counties = ALL_COUNTIES;

  /**
   * 處理地點變更
   */
  onLocationChange(location: string): void {
    this.locationChange.emit(location);
  }
}
