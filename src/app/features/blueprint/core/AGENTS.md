# Blueprint Core Agent (concise)

**Scope**: `src/app/core/blueprint` only holds domain/container/context/events/validation that are platform-level and UI-agnostic.

## Keep in core/blueprint
- Container + lifecycle + module registry + resource provider
- Domain/context/events/errors/interfaces/enums
- Validation/dependency rules that are backend-agnostic

## Move out / avoid
- Firestore-facing repositories/services/stores/models for blueprint data → **features/blueprint** (front-end data-plane)
- Any UI/process flows or feature-level state
- Direct Firebase SDK access; if infra is needed, wrap with @angular/fire in a dedicated adapter

## Interaction rule
Routes/components → `features/blueprint` service/store → (optionally) core domain APIs. Core must not import features.

## Minimal guardrails
- Use `inject()`; avoid constructor DI
- Keep files small, single responsibility
- No token/session logic here (auth stays in core/auth)

## Related
- `../../features/blueprint/AGENTS.md` for feature-layer guidance
- `../AGENTS.md` for core constitution
