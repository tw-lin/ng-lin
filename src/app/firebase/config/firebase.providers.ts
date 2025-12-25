/**
 * Firebase Services Provider Configuration
 * 
 * @module firebase.providers
 * @description
 * Centralized Firebase service initialization for the ng-lin application.
 * Provides all Firebase modules using @angular/fire 20+ with direct service injection.
 * 
 * Architecture Compliance:
 * - Direct @angular/fire service injection (NO wrapper services)
 * - Follows .github/copilot-instructions.md rule #2: Never create FirebaseService wrapper
 * - Services are injected directly into repositories and services via inject()
 * 
 * Firebase Services Provided:
 * 1. **Firebase App** - Core Firebase initialization
 * 2. **App Check** - ReCaptcha Enterprise for abuse prevention
 * 3. **Analytics** - User behavior tracking (Screen + User tracking)
 * 4. **Authentication** - Firebase Auth for user identity
 * 5. **Firestore** - NoSQL database with offline persistence (multi-tab support)
 * 6. **Realtime Database** - Legacy real-time data sync
 * 7. **Cloud Functions** - Serverless compute (asia-east1 region)
 * 8. **Cloud Messaging (FCM)** - Push notifications
 * 9. **Performance Monitoring** - App performance metrics
 * 10. **Cloud Storage** - File storage and retrieval
 * 11. **Remote Config** - Feature flags and remote configuration
 * 12. **Vertex AI** - Google AI/ML services (Gemini API)
 * 
 * Firestore Configuration:
 * - Persistent local cache enabled
 * - Multi-tab synchronization support
 * - Offline-first architecture
 * 
 * Region Configuration:
 * - Cloud Functions: asia-east1 (Taiwan/Hong Kong)
 * - Firestore: Default (firebase.config.ts)
 * - Storage: Default (firebase.config.ts)
 * 
 * @see {@link ./firebase.config.ts} for Firebase project configuration
 * @see {@link docs/⭐️/🧠AI_Behavior_Guidelines.md} for Firebase constraints
 * @see {@link .github/copilot-instructions.md} for architecture rules
 */

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
