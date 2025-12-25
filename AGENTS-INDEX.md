# AGENTS.md Index - Reference Guide

> **⚠️ Note**: This is a **reference document** for humans. AI agents should follow the navigation table in the root `/AGENTS.md` file, which is automatically loaded first.

**Purpose**: Provide a complete overview of all AGENTS.md files in the repository for documentation and maintenance purposes.

## 📋 Complete File List

All 29 AGENTS.md files in the GigHub repository:

| File Location Pattern | Read This AGENTS.md | Scope |
|----------------------|---------------------|-------|
| `src/app/core/**` | `src/app/core/AGENTS.md` | Infrastructure layer |
| `src/app/features/**` | `src/app/features/AGENTS.md` | Business features |
| `src/app/shared/**` | `src/app/shared/AGENTS.md` | Reusable UI |
| `src/app/layout/**` | `src/app/layout/AGENTS.md` | App chrome |
| `src/app/routes/**` | `src/app/routes/AGENTS.md` | Routing |
| `src/app/firebase/**` | `src/app/firebase/AGENTS.md` | Firebase config |
| `src/styles/**` | `src/styles/AGENTS.md` | Global styles |
| `src/environments/**` | `src/environments/AGENTS.md` | Environment config |

### Step 3: Check Specific Module (If Applicable)

#### Core Modules
| Module Path | AGENTS.md Location | Purpose |
|-------------|-------------------|---------|
| `core/blueprint/**` | `core/blueprint/AGENTS.md` | Blueprint domain |
| `core/net/**` | `core/net/AGENTS.md` | HTTP utilities |
| `core/auth/**` | `core/AGENTS.md` | Auth in core doc |
| `core/guards/**` | `core/AGENTS.md` | Guards in core doc |
| `core/services/**` | `core/AGENTS.md` | Core services |

#### Feature Modules
| Module Path | AGENTS.md Location | Purpose |
|-------------|-------------------|---------|
| `features/account/**` | `features/account/AGENTS.md` | Account feature |
| `features/blueprint/**` | `features/blueprint/AGENTS.md` | Blueprint feature |
| `features/exception/**` | `features/exception/AGENTS.md` | Error pages |
| `features/social/**` | `features/social/AGENTS.md` | Social features |

#### Account Sub-Features
| Sub-Feature Path | AGENTS.md Location | Purpose |
|-----------------|-------------------|---------|
| `account/dashboard/**` | `account/dashboard/AGENTS.md` | Dashboard widgets |
| `account/profile/**` | `account/profile/AGENTS.md` | Profile UI |
| `account/settings/**` | `account/settings/AGENTS.md` | Settings UI |
| `account/routes/**` | `account/routes/AGENTS.md` | Account routing |
| `account/routes/user/**` | `account/routes/user/AGENTS.md` | User routes |
| `account/routes/team/**` | `account/routes/team/AGENTS.md` | Team routes |
| `account/routes/organization/**` | `account/routes/organization/AGENTS.md` | Org routes |
| `account/routes/admin/**` | `account/routes/admin/AGENTS.md` | Admin routes |

#### Blueprint Sub-Features
| Sub-Feature Path | AGENTS.md Location | Purpose |
|-----------------|-------------------|---------|
| `blueprint/routes/**` | `blueprint/routes/AGENTS.md` | Blueprint routing |
| `blueprint/routes/modules/**` | `blueprint/routes/modules/AGENTS.md` | Module views |

#### Shared Services
| Service Path | AGENTS.md Location | Purpose |
|-------------|-------------------|---------|
| `shared/services/**` | `shared/services/AGENTS.md` | Business services |

## 🔍 Usage Examples

### Example 1: Editing a Blueprint Component
```
File: src/app/features/blueprint/components/blueprint-list.component.ts
                      ↓         ↓
                  features  blueprint

→ Read: src/app/features/blueprint/AGENTS.md
→ Then: src/app/features/AGENTS.md (for general feature rules)
→ Also: src/app/AGENTS.md (for app-level architecture)
```

### Example 2: Adding a Core Service
```
File: src/app/core/services/permission.service.ts
                   ↓        ↓
                 core   services

→ Read: src/app/core/AGENTS.md (includes services section)
→ Then: src/app/AGENTS.md (for core vs features distinction)
```

### Example 3: Creating Account Route
```
File: src/app/features/account/routes/user/user-profile.page.ts
                      ↓         ↓      ↓      ↓
                  features  account routes  user

→ Read: src/app/features/account/routes/user/AGENTS.md (most specific)
→ Then: src/app/features/account/routes/AGENTS.md (routing rules)
→ Then: src/app/features/account/AGENTS.md (account feature rules)
→ Also: src/app/features/AGENTS.md (general feature rules)
```

### Example 4: Updating Styles
```
File: src/styles/theme.less
           ↓
        styles

→ Read: src/styles/AGENTS.md
→ Then: src/AGENTS.md (for global constraints)
```

## 📋 Complete File Hierarchy

```
/AGENTS.md                                          # Repository root
└── src/AGENTS.md                                   # Source root
    ├── environments/AGENTS.md                      # Environment config
    ├── styles/AGENTS.md                            # Global styles
    └── app/AGENTS.md                               # App root
        ├── core/AGENTS.md                          # Infrastructure
        │   ├── blueprint/AGENTS.md                 # Blueprint domain
        │   └── net/AGENTS.md                       # HTTP utilities
        ├── features/AGENTS.md                      # Business features
        │   ├── account/AGENTS.md                   # Account feature
        │   │   ├── dashboard/AGENTS.md             # Dashboard
        │   │   ├── profile/AGENTS.md               # Profile
        │   │   ├── settings/AGENTS.md              # Settings
        │   │   └── routes/AGENTS.md                # Account routes
        │   │       ├── _shared/AGENTS.md           # Shared utilities
        │   │       ├── admin/AGENTS.md             # Admin routes
        │   │       ├── organization/AGENTS.md      # Org routes
        │   │       ├── team/AGENTS.md              # Team routes
        │   │       └── user/AGENTS.md              # User routes
        │   ├── blueprint/AGENTS.md                 # Blueprint feature
        │   │   └── routes/AGENTS.md                # Blueprint routes
        │   │       └── modules/AGENTS.md           # Module views
        │   ├── exception/AGENTS.md                 # Error pages
        │   └── social/AGENTS.md                    # Social features
        ├── firebase/AGENTS.md                      # Firebase config
        ├── layout/AGENTS.md                        # App layout
        ├── routes/AGENTS.md                        # Routing
        ├── shared/AGENTS.md                        # Shared UI
        │   └── services/AGENTS.md                  # Business services
        └── [future modules as needed]

```

## 🚀 Quick Start for AI Agents

**When you receive a task:**

1. **Identify the file path** you'll be working on
2. **Use the tables above** to find the most specific AGENTS.md
3. **Read from specific to general**:
   - Start with the most specific module AGENTS.md
   - Then read parent AGENTS.md files
   - Stop when you have enough context
4. **Follow the rules** from all applicable AGENTS.md files

## 📝 Notes

- **Most specific wins**: If multiple AGENTS.md files apply, the most specific takes precedence
- **Cumulative rules**: All parent AGENTS.md rules still apply
- **Read hierarchy**: Always read child → parent when in doubt
- **Missing AGENTS.md**: If no specific AGENTS.md exists, use the parent module's file

---
**Last Updated**: 2025-12-25  
**Maintained by**: GigHub Development Team
