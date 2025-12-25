import { Provider, EnvironmentProviders } from '@angular/core';
import { provideAnalytics, getAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { provideAppCheck, initializeAppCheck, ReCaptchaEnterpriseProvider } from '@angular/fire/app-check';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import {
  provideFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore
} from '@angular/fire/firestore';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { providePerformance, getPerformance } from '@angular/fire/performance';
import { provideRemoteConfig, getRemoteConfig } from '@angular/fire/remote-config';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideVertexAI, getVertexAI } from '@angular/fire/vertexai';

import { firebaseAppOptions, firebaseRecaptchaSiteKey } from './firebase.config';

/**
 * @angular/fire provider bundle.
 * Order matters: App + App Check first, then dependent services.
 */
export const firebaseProviders: Array<Provider | EnvironmentProviders> = [
  provideFirebaseApp(() => initializeApp(firebaseAppOptions)),
  provideAppCheck(() =>
    initializeAppCheck(getApp(), {
      provider: new ReCaptchaEnterpriseProvider(firebaseRecaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    })
  ),
  provideAnalytics(() => getAnalytics()),
  ScreenTrackingService,
  UserTrackingService,
  provideAuth(() => getAuth()),
  provideFirestore(
    (): Firestore =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      })
  ),
  provideDatabase(() => getDatabase()),
  provideFunctions(() => getFunctions(getApp(), 'asia-east1')),
  provideMessaging(() => getMessaging()),
  providePerformance(() => getPerformance()),
  provideStorage(() => getStorage()),
  provideRemoteConfig(() => getRemoteConfig()),
  // TODO: migrate to Firebase AI SDK when stable (getVertexAI deprecated)
  provideVertexAI(() => getVertexAI())
];
