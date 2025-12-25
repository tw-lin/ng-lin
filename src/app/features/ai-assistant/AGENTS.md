# AI Assistant Feature – AGENTS

> **📍 Location**: `src/app/features/ai-assistant/` - AI-powered assistant  
> **👆 Parent**: [`../AGENTS.md`](../AGENTS.md) - Features layer  
> **⚠️ CRITICAL**: AI calls ONLY via Firebase Cloud Functions (functions-ai)

## Scope
AI Assistant feature (`src/app/features/ai-assistant/`) providing AI-powered assistance for document analysis, task suggestions, quality checks, and content generation. UI layer only.

## Purpose
Enable users to interact with AI capabilities while maintaining security and cost control. All AI processing happens server-side via Cloud Functions. Frontend handles only UI and result display.

## Constraints (Must NOT)
- ❌ Call Vertex AI or OpenAI APIs directly from frontend
- ❌ Expose API keys in client code
- ❌ Implement AI logic in frontend (use Cloud Functions)
- ❌ Use constructor injection (use `inject()`)
- ❌ Store AI responses without user consent

## Allowed Content
- ✅ AI assistant UI components
- ✅ Chat interface components
- ✅ Document upload for AI processing
- ✅ Result display components
- ✅ Loading states for AI operations
- ✅ Call Cloud Functions (functions-ai, functions-ai-document)
- ✅ AI-specific routing
- ✅ Data access layer for AI results

## Structure
```
ai-assistant/
├── data-access/              # Firebase Functions calls
├── features/                 # Sub-features
├── pages/                    # AI assistant pages
├── routing/                  # AI routing
└── services/                 # AI service wrappers
```

## Dependencies
**Depends on**: Firebase Cloud Functions, `core/services/`, `firebase/`  
**Used by**: `routes/` (lazy loaded), `features/blueprint/`

## Key Rules
1. **Backend AI only**: All AI operations via Cloud Functions
2. **No direct API calls**: Never call Vertex AI/OpenAI from frontend
3. **Use signals**: State management with Angular Signals
4. **Standalone components**: No NgModules
5. **Use inject()**: No constructor injection
6. **Cost awareness**: Implement usage limits and user feedback
7. **Error handling**: Graceful degradation when AI unavailable

## Agent Chain Integration
**Priority**: P2 (Enhancement feature, not core)  
**Depends on**: Architecture Agent (P0) for AI integration design  
**Triggers**: Security Agent (P2) for API key protection  
**Triggers**: Performance Agent (P2) for cost optimization

## Related
- `../../firebase/AGENTS.md` - Cloud Functions configuration
- `../blueprint/AGENTS.md` - Blueprint AI features
- `../../core/AGENTS.md` - Infrastructure services

---
Version: 1.2.0 | Updated: 2025-12-25 | Status: Active
