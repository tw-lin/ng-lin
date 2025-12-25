import { Component, inject, OnInit } from '@angular/core';
import { FirebaseService } from '@core/services/firebase.service';
import { FriendService } from '@core/services/friend.service';
import { FriendStore } from '@core/state/stores/friend.store';
import { SHARED_IMPORTS } from '@shared';

import { FriendCardComponent } from '../components/friend-card.component';

@Component({
  selector: 'app-friends-page',
  standalone: true,
  imports: [SHARED_IMPORTS, FriendCardComponent],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      <div class="friends-list">
        @for (rel of relations(); track rel.id) {
          <app-friend-card [relation]="rel" (accept)="handleAccept($event)" (remove)="handleRemove($event)" />
        }
      </div>
    }
  `
})
export class FriendsPageComponent implements OnInit {
  private store = inject(FriendStore);
  private service = inject(FriendService);
  private firebase = inject(FirebaseService);

  relations = this.store.relations;
  loading = this.store.loading;

  async ngOnInit(): Promise<void> {
    this.store.setLoading(true);
    try {
      const items = await this.service.listForCurrentUser();
      this.store.setRelations(items);
    } finally {
      this.store.setLoading(false);
    }
  }

  async handleAccept(id: string): Promise<void> {
    const uid = this.firebase.getCurrentUserId();
    if (!uid) return;
    await this.service.acceptRequest(id, uid);
    // optimistic update: mark as accepted in store
    const rels = this.store.relations();
    const updated = rels.map(r => (r.id === id ? { ...r, status: 'accepted' } : r));
    this.store.setRelations(updated);
  }

  async handleRemove(id: string): Promise<void> {
    const uid = this.firebase.getCurrentUserId();
    if (!uid) return;
    await this.service.removeFriend(id, uid);
    this.store.setRelations(this.store.relations().filter(r => r.id !== id));
  }
}

export default FriendsPageComponent;
