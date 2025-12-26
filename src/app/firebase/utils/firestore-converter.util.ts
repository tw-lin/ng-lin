import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from '@angular/fire/firestore';

/**
 * Build a typed Firestore converter from mapper functions.
 *
 * Keep this helper pure; callers supply the mapping logic.
 */
export const buildConverter = <T>(
  fromFirestore: (data: DocumentData) => T,
  toFirestore: (value: T) => DocumentData
): FirestoreDataConverter<T> => ({
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>) => fromFirestore(snapshot.data()),
  toFirestore
});
