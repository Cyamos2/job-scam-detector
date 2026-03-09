# File Audit Report - Job Scam Detector (Scamicide)

**Date:** 2024
**Project:** Scamicide - Job Scam Detection App
**Total Source Files:** 86 TypeScript/TSX files

---

## Project Overview

The project is a **React Native/Expo mobile application** with an **Express.js backend** for job scam detection. The app analyzes job postings to identify potential scam indicators.

### Directory Structure

| Directory | Purpose | File Count |
|-----------|---------|------------|
| `src/` | React Native client app | ~50 files |
| `server/` | Express.js API server | ~20 files |
| `android/` | Android native project | - |
| `ios/` | iOS native project | - |
| `scripts/` | Build/deploy scripts | 2 files |
| Root | Config files | ~15 files |

---

## Files Inventory

### Documentation (Root)
| File | Purpose |
|------|---------|
| `README.md` | Project documentation |
| `TODO.md` | Original todo list |
| `CODE_AUDIT.md` | Previous code audit findings |
| `AUDIT_FIXES_TODO.md` | Fixes tracking |
| `AI_COMPANY_VERIFICATION_TODO.md` | AI feature implementation |
| `AI_FEATURES_PLAN.md` | AI features planning |
| `ANDROID_PLAN.md` | Android-specific planning |
| `DEPLOYMENT.md` | Deployment guide |
| `FINALIZATION_TODO.md` | Finalization tasks |

### Configuration Files (Root)
| File | Purpose |
|------|---------|
| `app.json` | Expo app configuration |
| `package.json` | Client dependencies |
| `tsconfig.json` | TypeScript config |
| `babel.config.js` | Babel config |
| `metro.config.js` | Metro bundler config |
| `eas.json` | EAS build profiles |
| `index.ts` | App entry point |

### Server Configuration
| File | Purpose |
|------|---------|
| `server/package.json` | Server dependencies |
| `server/tsconfig.json` | Server TypeScript config |
| `server/prisma/schema.prisma` | Database schema |
| `server/.env.example` | Server env template |

### Client Source Files (`src/`)

#### Components (`src/components/`)
| File | Purpose |
|------|---------|
| `AppButton.tsx` | Reusable button component |
| `AppTextInput.tsx` | Text input component |
| `Chip.tsx` | Chip/tag component |
| `Collapsible.tsx` | Collapsible section |
| `ColorfulDemo.tsx` | Demo component |
| `EditJobModal.tsx` | Job editing modal |
| `FilterBar.tsx` | Filter UI |
| `ImageViewer.tsx` | Image viewer with gestures |
| `JobRow.tsx` | Job list item |
| `RiskMeter.tsx` | Risk visualization |
| `RowItem.tsx` | Generic row |
| `ScoreBadge.tsx` | Risk score badge |
| `Screen.tsx` | Screen wrapper |
| `UndoBar.tsx` | Undo action bar |
| `VerifyCard.tsx` | Verification results |

#### Screens (`src/screens/`)
| File | Purpose |
|------|---------|
| `HomeScreen.tsx` | Main home screen |
| `DatabaseScreen.tsx` | Job database list |
| `ReportDetailScreen.tsx` | Job detail/report |
| `AddContentScreen.tsx` | Add new job |
| `SettingsScreen.tsx` | App settings |

#### Hooks (`src/hooks/`)
| File | Purpose |
|------|---------|
| `useJobs.tsx` | Job state management |
| `useSettings.tsx` | Settings management |
| `usePersistedState.ts` | State persistence |

#### Library (`src/lib/`)
| File | Purpose |
|------|---------|
| `db.ts` | API client (CRITICAL - all API calls) |
| `api.ts` | API surface types |
| `scoring.ts` | Risk scoring logic |
| `ocr.ts` | OCR text extraction |
| `scamContext.ts` | Scam context data |
| `urlTools.ts` | URL parsing utilities |
| `domainAge.ts` | Domain age lookup |
| `analytics.ts` | Analytics tracking |
| `crashReporting.ts` | Sentry integration |
| `events.ts` | Event handling |
| `explain.ts` | Explanation utilities |
| `html.ts` | HTML parsing |
| `riskRules.ts` | Risk rules definitions |

#### Navigation (`src/navigation/`)
| File | Purpose |
|------|---------|
| `RootNavigator.tsx` | Root navigation |
| `HomeStack.tsx` | Home stack navigator |
| `DatabaseStack.tsx` | Database stack navigator |
| `SettingsStack.tsx` | Settings stack navigator |
| `useTabs.tsx` | Tab navigation |
| `types.ts` | Navigation types |
| `goTo.ts` | Navigation utilities |

#### Store (`src/store/`)
| File | Purpose |
|------|---------|
| `savedItems.tsx` | Saved items store |
| `persist.ts` | Persistence utilities |

#### Theme (`src/theme/`)
| File | Purpose |
|------|---------|
| `colors.ts` | Color definitions |
| `index.ts` | Theme exports |
| `useColors.ts` | Color hook |

#### Types (`src/types/`)
| File | Purpose |
|------|---------|
| `shims.d.ts` | Type shims |
| `shims-mlkit.d.ts` | ML Kit shims |

### Server Source Files (`server/src/`)

#### Routes (`server/src/routes/`)
| File | Purpose |
|------|---------|
| `jobs.ts` | Job CRUD API |
| `verify.ts` | Company verification |
| `whois.ts` | WHOIS lookup |
| `ocr.ts` | OCR processing |
| `patterns.ts` | Pattern matching |
| `scamContext.ts` | Scam context API |
| `aiVerify.ts` | AI verification |

#### Middleware (`server/src/middleware/`)
| File | Purpose |
|------|---------|
| `errorHandler.ts` | Error handling |
| `rateLimiter.ts` | Rate limiting |
| `security.ts` | Security headers |

#### Utils (`server/src/utils/`)
| File | Purpose |
|------|---------|
| `validation.ts` | Zod schemas |
| `logger.ts` | Logging utilities |

#### Other (`server/src/`)
| File | Purpose |
|------|---------|
| `index.ts` | Express app entry |
| `prisma.ts` | Database client |
| `data/scamKnowledge.ts` | Scam knowledge base |
| `seed/seed.ts` | Database seeder |

---

## Issues Found

### 1. Duplicate TODO/Migration Files ⚠️

Multiple planning/migration files exist that could be consolidated:

- `TODO.md`
- `CODE_AUDIT.md`
- `AUDIT_FIXES_TODO.md`
- `FINALIZATION_TODO.md`
- `AI_COMPANY_VERIFICATION_TODO.md`
- `IMPLEMENTATION_TODO.md`
- `AI_FEATURES_PLAN.md`
- `ANDROID_PLAN.md`

**Recommendation:** Consolidate into a single `PROJECT_STATUS.md` or archive completed items.

### 2. Type Safety Issues ⚠️

**`as any` usage found in 43 locations:**

- **Client (`src/lib/`):** 16 occurrences
  - `ocr.ts` - Multiple response type casts
  - `api.ts` - Type assertions for sync
  - `scoring.ts` - WHOIS response handling
  
- **Server (`server/src/`):** 13 occurrences
  - `index.ts` - Sentry integration
  - `routes/jobs.ts` - Prisma queries
  - `middleware/` - Request type extensions

**Recommendation:** Add proper type definitions to reduce `any` casts.

### 3. Duplicate SUSPICIOUS_TLDS Sets ⚠️

Two different TLD lists exist:

| File | TLDs |
|------|------|
| `src/lib/scoring.ts` | top, xyz, icu, click, rest, pw, work, loan, zip, cam, cfd, kim, mom, gq, ml, ... |
| `server/src/routes/verify.ts` | zip, mov, xyz, top, click, link, gq, tk, ml, cf, ga, icu, work, monster, ... |

**Recommendation:** Create a shared constants file:
```typescript
// shared/suspiciousTlds.ts
export const SUSPICIOUS_TLDS = new Set([...]);
```

### 4. Unused Configuration File

`declarations.d.ts` - Appears unused or could be consolidated with other type files.

### 5. Build Artifacts Included

The following should be in `.gitignore` or removed:
- `dist/` (server compiled files)
- `.expo/` (Expo cache)

---

## Previous Audit Status (From CODE_AUDIT.md)

The existing code audit identified issues that have been **mostly fixed**:

### ✅ Completed Fixes
| Issue | Status |
|-------|--------|
| API path mismatch (`/api/v1` prefix) | Fixed |
| Missing validation fields (`location`, `recruiterEmail`) | Fixed |
| OCR response handling | Fixed |
| Mobile platform detection | Fixed |
| WHOIS response handling | Fixed |

### 📋 Remaining Items
| Issue | Priority |
|-------|----------|
| Duplicate SUSPICIOUS_TLDS | Medium |
| Type safety (`as any` casts) | Low |
| Demo OCR fallback hardcoded | Low |

---

## Recommendations

### High Priority
1. **Consolidate planning files** - Reduce confusion by having single source of truth
2. **Create shared constants** - Unify `SUSPICIOUS_TLDS` between client/server

### Medium Priority
3. **Type safety improvements** - Replace `any` casts with proper types
4. **Add integration tests** - Verify API contracts

### Low Priority
5. **Clean up build artifacts** - Ensure `dist/` is gitignored
6. **Archive completed TODOs** - Move done items to `ARCHIVE.md`

---

## File Statistics

| Category | Count |
|----------|-------|
| Total TypeScript/TSX | 86 |
| React Components | 15 |
| Screens | 5 |
| Hooks | 3 |
| Library modules | 13 |
| Server routes | 7 |
| Navigation files | 7 |
| Configuration files | 15 |

---

## Conclusion

The project is well-structured with a clear separation between:
- **Client** (React Native/Expo)
- **Server** (Express.js)
- **Native** (Android/iOS)

The codebase is mature and previous critical issues have been resolved. The main areas for improvement are:
1. Consolidating duplicate planning/documentation files
2. Unifying shared constants (SUSPICIOUS_TLDS)
3. Reducing `any` type casts for better type safety

