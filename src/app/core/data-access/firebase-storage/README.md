# firebase-storage (Data Access)

This module provides access to **Firebase Cloud Storage**
for managing file and binary asset operations.

## Responsibility

- Upload files
- Download file URLs
- Delete stored assets

This module **does NOT**:
- Perform image processing
- Enforce access control (handled by Storage Rules)
- Manage metadata beyond basic file info

## Typical Capabilities

- File upload
- Download URL retrieval
- File deletion

## Public API Shape (Conceptual)

- `upload(path, file)`
- `getDownloadUrl(path)`
- `delete(path)`

## Architectural Notes

- Treated as a **binary data store**
- Metadata should live in Firestore when needed
- Upload orchestration belongs to feature or facade layers

## Dependencies

- Firebase Storage SDK

## Usage Guidance

Use from:
- Profile or asset-related features
- Media upload flows

Do not mix file uploads with business logic or backend coordination.
