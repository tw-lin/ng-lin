import { environment } from '@env/environment';
import { FirebaseOptions } from 'firebase/app';

/**
 * Centralized Firebase app options (environment-driven).
 * Keep SDK initialization inside DI via @angular/fire providers.
 */
export const firebaseAppOptions: FirebaseOptions = environment['firebase'] as FirebaseOptions;

export const firebaseRecaptchaSiteKey = environment['recaptchaSiteKey'] as string;
