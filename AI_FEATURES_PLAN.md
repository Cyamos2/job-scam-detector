# AI Features Plan - Job Scam Detector

## Information Gathered

### Current Architecture:
1. **Client (React Native/Expo)**:
   - `src/lib/scoring.ts` - Regex-based scam detection rules
   - `src/lib/explain.ts` - Basic flag explanations
   - `src/components/VerifyCard.tsx` - Domain/company verification
   - `src/screens/ReportDetailScreen.tsx` - Report display

2. **Server (Express)**:
   - `/api/v1/verify` - Domain age, HTTPS, LinkedIn checks
   - `/api/v1/patterns` - Repeat pattern detection in DB
   - `/api/v1/whois` - WHOIS domain lookup
   - `/api/v1/ocr` - Text extraction from images

### Legitimate Sources for Scam Context:
1. **FTC (Federal Trade Commission)** - scamadvisor.com, ftc.gov
2. **BBB (Better Business Bureau)** - bbb.org scam tracking
3. **FBI IC3** - ic3.gov - Internet crime reports
4. **O*NET** - onetonline.org - Legitimate job characteristics
5. **US Department of Labor** - dol.gov - Valid wage data

---

## Plan: Add AI-Powered Scam Context Features

### Phase 1: Data Layer (Server)

#### 1.1 Create Scam Context API Route
**File:** `server/src/routes/scamContext.ts`

New endpoint: `GET /api/v1/scam-context?type=<type>&value=<value>`

Returns:
- FTC scam warnings for job type
- BBB alerts for company
- IC3 statistics for scam type
- Legitimate job characteristics from O*NET
- Valid salary ranges from DOL

#### 1.2 Create Scam Knowledge Database
**File:** `server/data/scamKnowledge.ts`

Structured data from legitimate sources:
- Common scam job types
- Red flag patterns
- Legitimate salary ranges by role
- Industry-specific warnings

### Phase 2: Client Enhancement

#### 2.1 Expand Scoring Types
**File:** `src/lib/scoring.ts`

Add new result types:
```typescript
export type ScamContext = {
  ftcWarnings?: string[];
  bbbAlert?: string | null;
  ic3Stats?: { year: number; reports: number; losses: number };
  legitSalary?: { min: number; max: number; source: string };
  jobCharacteristics?: string[];
};
```

#### 2.2 Create AI Explanation Service
**File:** `src/lib/scamContext.ts`

Client-side service to fetch and display contextual information:
- Fetch scam context from server
- Generate human-readable explanations
- Provide actionable recommendations

#### 2.3 Update Report Detail Screen
**File:** `src/screens/ReportDetailScreen.tsx`

Add new sections:
- "What to know about this type of job"
- "Reported scams of this type"
- "Legitimate salary range"
- "How to verify this opportunity"

### Phase 3: Legitimate Source Integration

#### 3.1 FTC Integration
- Fetch current scam warnings by job category
- Display relevant consumer alerts

#### 3.2 O*NET Integration  
- Validate job characteristics (remote-friendly vs not)
- Get legitimate job requirements
- Industry classification verification

#### 3.3 Salary Data
- Reference DOL Bureau of Labor Statistics
- Display realistic salary ranges by role/location
- Flag unrealistic pay promises

---

## Files to Edit/Create

### New Files:
1. `server/src/routes/scamContext.ts` - New API route
2. `server/data/scamKnowledge.ts` - Scam knowledge base
3. `src/lib/scamContext.ts` - Client-side context service

### Modified Files:
1. `src/lib/scoring.ts` - Add context types
2. `src/lib/db.ts` - Add scamContext API method
3. `src/screens/ReportDetailScreen.tsx` - Add context UI
4. `server/src/index.ts` - Register new route

---

## Follow-up Steps

1. **Install dependencies** (if needed):
   - Check if server needs additional packages

2. **Test the implementation**:
   - Verify API endpoints work
   - Test client integration
   - Check UI displays correctly

3. **Future enhancements** (out of scope):
   - Machine learning model for pattern detection
   - Real-time FTC API integration
   - Community-reported scam database

