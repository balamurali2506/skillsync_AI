import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.js';
import Resume from '../models/Resume.js';

// ============================================================
// Gemini-Only AI Client
// ============================================================

export async function getAIClient(userId) {
  const user = await User.findById(userId);
  const apiKey = user?.aiPreferences?.geminiKey?.trim();

  if (!apiKey) {
    console.warn(`User ${userId} has no Gemini key configured.`);
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
  
  return { 
    client: { 
      chat: { 
        completions: { 
          create: async ({ messages, response_format, temperature, max_tokens }) => {
            try {
              const systemMsg = messages.find(m => m.role === 'system');
              const userMsgs = messages.filter(m => m.role !== 'system');
              
              // Build generation config
              const generationConfig = {};
              
              // Handle JSON mode properly for Gemini
              if (response_format?.type === 'json_object') {
                generationConfig.responseMimeType = "application/json";
              }
              
              if (temperature !== undefined) {
                generationConfig.temperature = temperature;
              }
              
              if (max_tokens !== undefined) {
                generationConfig.maxOutputTokens = max_tokens;
              }
              
              console.log('🔧 Gemini generationConfig:', generationConfig);
              
              const result = await geminiModel.generateContent({
                contents: userMsgs.map(m => ({ 
                  role: m.role === 'assistant' ? 'model' : 'user', 
                  parts: [{ text: m.content }] 
                })),
                systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
                generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined
              });
              
              const responseText = result.response.text();
              console.log('✅ Gemini response length:', responseText.length);
              
              return { 
                choices: [{ 
                  message: { content: responseText } 
                }] 
              };
            } catch (error) {
              console.error('❌ Gemini API error:', error.message);
              console.error('Full error:', error);
              throw error;
            }
          }
        }
      }
    },
    model: 'gemini-3.6-flash',
    provider: 'gemini',
    apiKey
  };
}

// ============================================================
// Bulletproof JSON Parser (handles all Gemini formats)
// ============================================================

const safeParse = (str) => {
  if (!str) return null;
  
  // Try direct parse
  try { return JSON.parse(str); } catch {}
  
  // Remove markdown code blocks
  try {
    const cleaned = str.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {}
  
  // Try to find JSON object in the string
  try {
    const match = str.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  
  console.error('Failed to parse Gemini response:', str.substring(0, 200));
  return null;
};

// ============================================================
// Build Context
// ============================================================

export async function buildContext(userId, targetRole, jobDescription) {
  const resume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
  let resumeContext = "No resume provided.";
  if (resume) {
    resumeContext = `Skills: ${(resume.extractedSkills || []).join(', ')}. Raw text excerpt: ${(resume.rawText || '').slice(0, 1500)}`;
  }
  return { resumeContext, resumeId: resume?._id, jobDescription: jobDescription || "None provided." };
}

// ============================================================
// Generate Opening
// ============================================================

export async function generateOpening(userId, config, resumeContext) {
  const aiConfig = await getAIClient(userId);
  if (!aiConfig) return "Hello. I am your AI interviewer. Let's begin. Tell me about yourself.";

  try {
    const { client } = aiConfig;
    const systemPrompt = "You are a strict, professional AI interviewer. Return ONLY valid JSON.";
    const userPrompt = `Role: ${config.targetRole}. Generate a brief professional opening (max 3 sentences) and ask the first question. Return JSON: { "spokenText": "your opening and first question here" }`;
    
    const res = await client.chat.completions.create({
      model: 'gemini-3.6-flash',
      temperature: 0.6,
      max_tokens: 150,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const parsed = safeParse(res.choices[0].message.content);
    return parsed?.spokenText || "Welcome. Let's begin with your background.";
  } catch (err) {
    console.error('AI opening error:', err);
    return "Welcome. Let's begin with your background.";
  }
}

// ============================================================
// Process Turn (Strict Interviewer)
// ============================================================

export async function processTurn(interview, candidateAnswer) {
  const aiConfig = await getAIClient(interview.user);
  if (!aiConfig) return mockFallback();

  const recentHistory = interview.messages.slice(-4).map(m => `${m.speaker}: ${m.text}`).join('\n');

  const systemPrompt = `You are a strict, professional technical interviewer. 
RULES: 
1. Short/vague answers (under 15 words) get VERY LOW scores (0-30).
2. Heavily penalize filler words (uh, um, ahh, hmm, like, basically).
3. Decide action: FOLLOW_UP (probe deeper), NEXT_QUESTION (move to new topic), or CONCLUDE (end interview).
4. If candidate makes vague claims, ask HOW, WHY, or request specific EXAMPLES.
5. Never say "Great answer!" - be neutral and challenging.
6. Return ONLY valid JSON.

CONFIG: Role: ${interview.targetRole}, Turn: ${interview.turnCount}
HISTORY:
${recentHistory}

Return JSON with EXACTLY this structure:
{
  "evaluation": {
    "technical": 0-100,
    "communication": 0-100,
    "confidence": 0-100,
    "relevance": 0-100,
    "depth": 0-100
  },
  "action": "FOLLOW_UP" or "NEXT_QUESTION" or "CONCLUDE",
  "spokenResponse": "Your next question or follow-up (max 50 words)",
  "topic": "current technical topic being discussed",
  "internalFeedback": "Brief harsh feedback for the final report"
}`;

  try {
    const { client } = aiConfig;
    const res = await client.chat.completions.create({
      model: 'gemini-3.6-flash',
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `CANDIDATE ANSWER: "${candidateAnswer}"` }
      ]
    });

    const parsed = safeParse(res.choices[0].message.content);
    if (parsed && parsed.spokenResponse) return parsed;
  } catch (err) {
    console.error('AI processTurn error:', err);
  }
  
  return mockFallback();
}

// ============================================================
// Generate Final Report
// ============================================================

export async function generateFinalReport(interview) {
  const aiConfig = await getAIClient(interview.user);
  if (!aiConfig) return generateFallbackReport();

  const transcriptSummary = interview.transcript.map((t, i) =>
    `Q${i+1}: ${t.question}\nA: ${t.answer}\nScores: Tech ${t.evaluation?.technical || 0}, Comm ${t.evaluation?.communication || 0}`
  ).join('\n\n');

  const systemPrompt = `Generate a strict, professional final interview evaluation report.
Be harsh but fair. Do not sugarcoat poor performance.
Return ONLY valid JSON with this exact structure:
{
  "overallScore": 0-100,
  "categoryScores": {
    "technical": 0-100,
    "communication": 0-100,
    "confidence": 0-100,
    "problemSolving": 0-100,
    "behavioral": 0-100,
    "roleKnowledge": 0-100
  },
  "strengths": ["array of 2-3 specific strengths"],
  "weaknesses": ["array of 2-3 specific weaknesses"],
  "skillGaps": ["array of missing technical skills"],
  "recommendations": ["array of 2-3 actionable practice items"],
  "aiCoachSummary": "3-sentence professional summary of performance"
}`;

  try {
    const { client } = aiConfig;
    const res = await client.chat.completions.create({
      model: 'gemini-3.6-flash',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Target Role: ${interview.targetRole}\n\nTRANSCRIPT:\n${transcriptSummary}` }
      ]
    });

    const parsed = safeParse(res.choices[0].message.content);
    if (parsed && parsed.overallScore !== undefined) return parsed;
  } catch (err) {
    console.error('AI final report error:', err);
  }

  return generateFallbackReport();
}

// ============================================================
// Fallbacks
// ============================================================

function mockFallback() {
  return {
    evaluation: { technical: 20, communication: 15, confidence: 20, relevance: 30, depth: 10 },
    action: "FOLLOW_UP",
    spokenResponse: "That answer was far too brief and lacked any technical depth. Can you elaborate on what you actually did?",
    topic: "General Experience",
    internalFeedback: "Fallback used: Answer was too short."
  };
}

function generateFallbackReport() {
  return {
    overallScore: 40,
    categoryScores: {
      technical: 40, communication: 40, confidence: 40,
      problemSolving: 40, behavioral: 40, roleKnowledge: 40
    },
    strengths: ["Participation"],
    weaknesses: ["Provide more detailed answers"],
    skillGaps: [],
    recommendations: ["Practice elaborating on technical concepts"],
    aiCoachSummary: "AI analysis was unavailable, but keep practicing detailed responses."
  };
}