import { Component, input, output } from '@angular/core';
import { FriendRelation } from '@core/domain/models/friend.model';

@Component({
  selector: 'app-friend-card',
  standalone: true,
  template: `
    <nz-card class="friend-card">
      <div class="meta">
        <strong>{{ relation().requesterId === currentUserId ? relation().recipientId : relation().requesterId }}</strong>
        <span class="status">{{ relation().status }}</span>
      </div>
      <div class="actions">
        <button *ngIf="relation().status === 'pending'" (click)="onAccept()">Accept</button>
        <button (click)="onRemove()">Remove</button>
      </div>
    </nz-card>
  `
})
export class FriendCardComponent {
  relation = input.required<FriendRelation>();
  readonly accept = output<string>();
  readonly remove = output<string>();

  // placeholder for template binding
  currentUserId = 'me';

  onAccept(): void {
    this.accept.emit(this.relation().id);
  }

  onRemove(): void {
    this.remove.emit(this.relation().id);
  }
}

export default FriendCardComponent;
