# Exception Module

異常頁面模組 - 提供錯誤頁面展示

## Structure

- `pages/` - Exception page components
  - `exception.component.ts` - Generic exception page (404, 403, 500)
  - `trigger.component.ts` - Exception trigger page
- `routing/` - Route configuration

## Routes

- `/exception/403` - Forbidden page
- `/exception/404` - Not found page
- `/exception/500` - Server error page
- `/exception/trigger` - Exception trigger page
