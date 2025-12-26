/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from 'firebase-functions';
import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
console.log(onRequest, logger); // 暫時引用，編譯不報錯
// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// ========================================
// Audit Lifecycle Management
// ========================================

/**
 * Automated audit event tier migration
 * 
 * Implements multi-tier storage lifecycle:
 * - HOT tier (7 days): Firestore audit_events_hot collection
 * - WARM tier (90 days): Firestore audit_events_warm collection
 * - COLD tier (7 years): Cloud Storage + BigQuery archival
 * 
 * Scheduled: Daily at 2:00 AM UTC
 * 
 * @see src/audit/audit-tier-migration.ts
 */
export { migrateAuditTiers } from './audit/audit-tier-migration';
