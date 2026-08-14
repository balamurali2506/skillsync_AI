import OpenAI from 'openai';
import Resume from '../models/Resume.js';

const groq = process.env.GROQ_API_KEY ? new OpenAI({
  apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1'
}) : null;

const safeParse = (str) => {
  try { return JSON.parse(str); } catch {
    try { return JSON.parse(str.replace(/```json/gi, '').replace(/```/g, '').trim()); } catch { return null; }
  }
};

// Summarize context to keep token usage low and fast
export async function buildContext(userId, targetRole, jobDescription) {
  const resume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
  let resumeContext = "No resume provided.";
  if (resume) {
    resumeContext = `Skills: ${(resume.extractedSkills || []).join(', ')}. Raw text excerpt: ${(resume.rawText || '').slice(0, 1500)}`;
  }
  return { resumeContext, resumeId: resume?._id, jobDescription: jobDescription || "None provided." };
}

export async function generateOpening(config, resumeContext) {
  if (!groq) return "Hello. I am your AI interviewer. Let's begin. Tell me about yourself.";
  
  const prompt = `You are a professional, calm, and neutral AI interviewer. 
  Role: ${config.targetRole}. Company: ${config.company || 'Unknown'}. Type: ${config.interviewType}.
  Resume Context: ${resumeContext}
  
  Generate a brief, professional opening statement (max 3 sentences). Introduce yourself, state the interview type, and ask the first question (usually "Tell me about yourself" or a resume-specific icebreaker). 
  Return JSON: { "spokenText": "..." }`;

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', temperature: 0.6, max_tokens: 150,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }]
  });
  return safeParse(res.choices[0].message.content)?.spokenText || "Welcome. Let's begin with your background.";
}

export async function processTurn(interview, candidateAnswer) {
  if (!groq) return mockFallback();

  // Keep only last 4 messages to save tokens + speed
  const recentHistory = interview.messages.slice(-4).map(m => `${m.speaker}: ${m.text}`).join('\n');
  
  const systemPrompt = `You are an expert technical interviewer. You are professional, calm, and slightly challenging.
  RULES:
  1. Listen to the candidate's answer. Evaluate it internally.
  2. Decide action: "FOLLOW_UP" (probe deeper into current claim), "NEXT_QUESTION" (move to new topic), or "CONCLUDE" (end interview).
  3. If candidate makes a vague claim, ask "HOW" or "WHY" or ask for an "EXAMPLE".
  4. If candidate says "I don't know", give a small hint or move on. Do not give the answer.
  5. Never say "Great answer!" or use excessive encouragement. Be neutral.
  6. Do not reveal your scoring.
  
  INTERVIEW CONFIG:
  Role: ${interview.targetRole} | Type: ${interview.interviewType} | Difficulty: ${interview.difficulty}
  Company: ${interview.company || 'General'}
  Resume Context: ${interview.resumeContext}
  Job Description: ${interview.jobDescription}
  Topics Covered: ${interview.topicsCovered.join(', ') || 'None yet'}
  Turn Count: ${interview.turnCount} / Target: ~${interview.durationMinutes * 2} turns
  
  RECENT CONVERSATION:
  ${recentHistory}
  
  CANDIDATE LATEST ANSWER: "${candidateAnswer}"
  
  Return strict JSON:
  {
    "evaluation": { "technical": 0-100, "communication": 0-100, "confidence": 0-100, "relevance": 0-100, "depth": 0-100 },
    "action": "FOLLOW_UP" | "NEXT_QUESTION" | "CONCLUDE",
    "followUpType": "WHY" | "HOW" | "EXAMPLE" | "TRADEOFF" | null,
    "spokenResponse": "The exact text you will speak to the candidate.",
    "topic": "current topic being discussed",
    "internalFeedback": "Brief note on what was good/bad for the final report."
  }`;

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', temperature: 0.5, max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: systemPrompt }]
  });

  return safeParse(res.choices[0].message.content) || mockFallback();
}

export async function generateFinalReport(interview) {
  if (!groq) return { summary: "Good effort.", strengths: ["Participation"], weaknesses: ["Practice more"], recommendations: ["Keep practicing."] };

  const transcriptSummary = interview.transcript.map((t, i) => 
    `Q${i+1}: ${t.question}\nA: ${t.answer}\nScore: ${t.evaluation?.overall || 0}`
  ).join('\n\n');

  const prompt = `Generate a final interview evaluation report based on this transcript.
  Target Role: ${interview.targetRole}
  
  TRANSCRIPT:
  ${transcriptSummary}
  
  Return strict JSON:
  {
    "overallScore": 0-100,
    "categoryScores": { "technical": 0-100, "communication": 0-100, "confidence": 0-100, "problemSolving": 0-100, "behavioral": 0-100, "roleKnowledge": 0-100 },
    "strengths": ["array of 3 specific strengths"],
    "weaknesses": ["array of 3 specific weaknesses"],
    "skillGaps": ["array of missing skills detected during interview"],
    "recommendations": ["array of 3 actionable practice items"],
    "aiCoachSummary": "A 3-sentence professional summary of their performance and what to focus on next."
  }`;

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', temperature: 0.3, max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }]
  });

  return safeParse(res.choices[0].message.content);
}

function mockFallback() {
  return {
    evaluation: { technical: 70, communication: 75, confidence: 70, relevance: 80, depth: 65 },
    action: "NEXT_QUESTION", topic: "General Experience",
    spokenResponse: "I see. Let's move on to another topic. Can you describe a challenging project you've worked on?",
    internalFeedback: "Mock fallback used."
  };
}