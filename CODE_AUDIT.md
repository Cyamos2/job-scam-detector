# Code Audit Plan - Job Scam Detector

## Executive Summary

After analyzing the codebase, I've identified several issues causing errors in the application. The most critical issue is an **API path mismatch** between the client and server.

---

## Critical Issues (Must Fix)

### 1. API Path Mismatch in Client (CRITICAL)
**File:** `src/lib/db.ts`

The client-side API calls are missing the `/api/v1` prefix, causing 404 errors.

| Current Path | Correct Path |
|--------------|--------------|
| `/jobs` | `/api/v1/jobs` |
| `/verify` | `/api/v1/verify` |
| `/whois` | `/api/v1/whois` |
| `/ocr` | `/api/v1/ocr` |
| `/patterns` | `/api/v1/patterns` |

**Evidence from logs:**
```
Client error Route GET /whois?domain=brightwavedigital.example not found
```

### 2. Missing Validation Schema Fields
**File:** `server/src/utils/validation.ts`

The `jobCreateSchema` and `jobUpdateSchema` are missing `location` and `recruiterEmail` fields, but:
- The Prisma schema includes them
- The client sends them
- This causes validation failures when creating jobs

---

## High Priority Issues

### 3. Missing Environment Configuration in Client
**File:** `src/lib/db.ts`

The API base URL defaults to `http://127.0.0.1:3000` which won't work on:
- Android emulators (needs `10.0.2.2:3000`)
- iOS simulators (needs `localhost:3000`)
- Physical devices

### 4. WHOIS Error Handling is Confusing
**File:** `server/src/routes/whois.ts`

When WHOIS lookup fails, it returns a 200 success response with error details instead of properly indicating failure. This confuses clients.

---

## Medium Priority Issues

### 5. Duplicate SUSPICIOUS_TLDS Sets
- `src/lib/scoring.ts` - has one set of TLDs
- `server/src/routes/verify.ts` - has a different set of TLDs

These should be unified and shared.

### 6. Type Safety Issues
Multiple `any` type casts throughout the code:
- `src/lib/ocr.ts` - multiple `as any` casts
- `src/lib/scoring.ts` - type assertions

### 7. OCR Response Type Mismatch
**Files:** `src/lib/db.ts` ↔ `server/src/routes/ocr.ts`

The client expects `{ text: string; confidence: number | null }` but the server returns `{ success: true, data: { text, confidence, ... } }`.

---

## Low Priority Issues

### 8. Demo OCR Fallback is Hardcoded
**File:** `src/lib/ocr.ts`

The demo fallback returns a placeholder message instead of extracting any meaningful text.

### 9. Unused Imports
Some files may have unused imports (not verified in this audit).

---

## Testing Recommendations

1. **API Integration Tests**: Verify all endpoints respond correctly with the `/api/v1` prefix
2. **Job Creation Flow**: Test creating a job with all fields (including location, recruiterEmail)
3. **WHOIS Fallback**: Verify behavior when WHOIS service is unavailable
4. **OCR Flow**: Test both ML Kit and server-side OCR paths

---

## Files to Edit

1. `src/lib/db.ts` - Fix API paths and response handling
2. `server/src/utils/validation.ts` - Add missing schema fields
3. `src/lib/ocr.ts` - Fix response type handling
4. `server/src/routes/whois.ts` - Improve error handling

