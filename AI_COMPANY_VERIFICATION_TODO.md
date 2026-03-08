# AI Company Verification Implementation

## Overview
Add OpenAI-powered company verification to give a final verdict if a job is legit or a scam.

## Setup Required

### Environment Variables
Add to your `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from: https://platform.openai.com/api-keys

## Files Created/Modified

### 1. New: Server Route
**File:** `server/src/routes/aiVerify.ts`
- New endpoint: `POST /api/v1/ai-verify`
- Takes company name, URL, recruiter email, job title
- Uses OpenAI GPT-4 to analyze and return verdict
- Returns: verdict (legit/scam/suspicious), confidence, reasoning, sources checked

### 2. Modified: Server Index
**File:** `server/src/index.ts`
- Registered new route `/api/v1/ai-verify`

### 3. Modified: Client DB
**File:** `src/lib/db.ts`
- Added `aiVerify` API method

## API Request/Response

### Request:
```json
{
  "company": "Google",
  "url": "https://careers.google.com/jobs/...",
  "recruiterEmail": "recruiter@google.com",
  "jobTitle": "Software Engineer"
}
```

### Response:
```json
{
  "verdict": "legit",
  "confidence": 0.92,
  "reasoning": "Google is a well-known Fortune 500 company...",
  "checks": {
    "companyExists": true,
    "validDomain": true,
    "legitimateCareerPage": true,
    "matchWithKnownScams": false,
    "properContactMethods": true,
    "realisticCompensation": true
  },
  "redFlags": [],
  "positiveSigns": ["Fortune 500 company", "Official domain", "Known hiring practices"],
  "sourcesChecked": ["Company website", "LinkedIn", "Glassdoor"]
}
```

## Usage in Client App
```typescript
import api from './lib/db';

const result = await api.aiVerify({
  company: "Google",
  url: "https://careers.google.com/jobs/123",
  recruiterEmail: "recruiter@google.com",
  jobTitle: "Software Engineer"
});

console.log(result.data.verdict); // "legit" | "suspicious" | "scam"
console.log(result.data.confidence); // 0.0 - 1.0
console.log(result.data.reasoning); // Explanation
```

