import { Router } from 'express';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

// OpenAI API setup
async function getOpenAIClient() {
  const OpenAI = (await import('openai')).default;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface VerifyRequest {
  company: string;
  url?: string;
  recruiterEmail?: string;
  jobTitle?: string;
  notes?: string;
}

interface AIVerdict {
  verdict: 'legit' | 'suspicious' | 'scam';
  confidence: number;
  reasoning: string;
  checks: {
    companyExists: boolean | null;
    validDomain: boolean | null;
    legitimateCareerPage: boolean | null;
    matchWithKnownScams: boolean | null;
    properContactMethods: boolean | null;
    realisticCompensation: boolean | null;
  };
  redFlags: string[];
  positiveSigns: string[];
  sourcesChecked: string[];
}

/**
 * POST /api/v1/ai-verify
 * 
 * Uses OpenAI GPT-4 to verify if a company/job is legitimate
 */
router.post('/', asyncHandler(async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new OperationalError('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.', 503);
  }

  const { company, url, recruiterEmail, jobTitle, notes } = req.body as VerifyRequest;

  if (!company) {
    throw new OperationalError('Company name is required', 400);
  }

  // Build the prompt for OpenAI
  const prompt = buildVerificationPrompt({
    company,
    url,
    recruiterEmail,
    jobTitle,
    notes
  });

  try {
    const openai = await getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a job scam detection expert. Analyze company and job information to determine if it's legitimate or a scam. 
          
Provide your verdict in JSON format with these fields:
- verdict: "legit" | "suspicious" | "scam"
- confidence: number between 0 and 1
- reasoning: explanation of your decision
- checks: object with boolean or null values for:
  - companyExists
  - validDomain
  - legitimateCareerPage
  - matchWithKnownScams
  - properContactMethods
  - realisticCompensation
- redFlags: array of specific red flags found
- positiveSigns: array of positive indicators
- sourcesChecked: array of sources you would check

Be thorough and evidence-based. When uncertain, err on the side of caution.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content) as AIVerdict;

    // Validate the response
    if (!parsed.verdict || !['legit', 'suspicious', 'scam'].includes(parsed.verdict)) {
      throw new Error('Invalid verdict in AI response');
    }

    logger.info('AI verification performed', {
      company,
      verdict: parsed.verdict,
      confidence: parsed.confidence
    });

    res.json({
      success: true,
      data: {
        ...parsed,
        company,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    // If it's an OpenAI error
    if (error && typeof error === 'object' && 'status' in error) {
      const openaiError = error as { status: number; message?: string };
      if (openaiError.status === 401) {
        throw new OperationalError('Invalid OpenAI API key', 503);
      }
      if (openaiError.status === 429) {
        throw new OperationalError('OpenAI rate limit exceeded. Please try again later.', 429);
      }
    }
    
    logger.error('AI verification failed', { error: String(error) });
    throw new OperationalError('AI verification failed', 500);
  }
}));

/**
 * Build verification prompt from job details
 */
function buildVerificationPrompt(data: {
  company: string;
  url?: string;
  recruiterEmail?: string;
  jobTitle?: string;
  notes?: string;
}): string {
  let prompt = `Analyze the following job opportunity:\n\n`;
  
  prompt += `Company Name: ${data.company}\n`;
  
  if (data.jobTitle) {
    prompt += `Job Title: ${data.jobTitle}\n`;
  }
  
  if (data.url) {
    prompt += `Job URL: ${data.url}\n`;
  }
  
  if (data.recruiterEmail) {
    prompt += `Recruiter Email: ${data.recruiterEmail}\n`;
  }
  
  if (data.notes) {
    prompt += `Additional Notes: ${data.notes}\n`;
  }
  
  prompt += `\nPlease provide a detailed analysis determining if this is a legitimate job opportunity or a scam.`;
  
  return prompt;
}

export default router;

