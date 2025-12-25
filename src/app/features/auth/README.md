# Auth Feature (features/auth)

Purpose: UI flow entrypoints (login, register, lock, register-result, callback) that trigger authentication through the **core** `AuthFacade`. This feature never stores or manages tokens; it only calls the facade.

Key rules
- Use `AuthFacade` from `@core/auth`; never import `@angular/fire/auth` or `@delon/auth` here.
- Pages live under `pages/`; routing is defined in `routes.ts` and lazy-loaded from `src/app/routes/routes.ts`.
- Keep responsibilities UI-only: form validation, navigation, and invoking facade methods.

Structure
```
features/auth/
  ├─ routes.ts                 # passport routes (login/register/lock/etc.)
  └─ pages/
     ├─ login/
     ├─ register/
     ├─ register-result/
     ├─ lock/
     └─ callback.component.ts
```
