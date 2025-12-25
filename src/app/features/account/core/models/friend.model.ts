export interface FriendRelation {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'blocked';
}
