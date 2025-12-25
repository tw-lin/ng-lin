# firebase-fcm (Data Access)

This module encapsulates **Firebase Cloud Messaging (FCM)** integration
for client-side push notification capabilities.

## Responsibility

- Request notification permission
- Retrieve and refresh FCM tokens
- Listen for foreground messages

This module **does NOT**:
- Send notifications
- Define notification content or logic
- Track analytics events

## Typical Capabilities

- Permission handling
- Device token retrieval
- Foreground message stream

## Public API Shape (Conceptual)

- `requestPermission()`
- `getToken()`
- `onMessage$ : Observable<MessagePayload>`

## Architectural Notes

- Notification **sending** belongs to backend / Cloud Functions
- This module only represents the **client endpoint**
- Token persistence strategy should be decided at a higher layer

## Dependencies

- Firebase Messaging SDK
- RxJS

## Usage Guidance

Use from:
- App initialization flows
- Notification facades
- User settings (opt-in / opt-out)

Do not mix with UI or backend orchestration logic.
