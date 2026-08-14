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
  
  const prompt = `You are a strict, professional, and neutral AI interviewer. 
  Role: ${config.targetRole}. Company: ${config.company || 'Unknown'}. Type: ${config.interviewType}.
  Resume Context: ${resumeContext}
  
  Generate a brief, professional opening statement (max 3 sentences). Introduce yourself, state the interview type, and ask the first question. 
  Return JSON: { "spokenText": "..." }`;

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', temperature: 0.6, max_tokens: 150,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }]
  });
  return safeParse(res.choices[0].message.content)?.spokenText || "Welcome. Let's begin with your background.";
}

// THE STRICT ENGINE
export async function processTurn(interview, candidateAnswer) {
  if (!groq) return mockFallback();

  const recentHistory = interview.messages.slice(-4).map(m => `${m.speaker}: ${m.text}`).join('\n');
  
  const systemPrompt = `You are a strict, professional, and highly critical technical interviewer. You do NOT give participation trophies.
  
  STRICT SCORING RULES:
  1. If the candidate's answer is extremely short (under 15 words), vague, irrelevant, or just "I don't know", you MUST give VERY LOW scores (0-30 out of 100) and provide harsh, direct feedback.
  2. Heavily penalize the use of filler words like "uh", "um", "ahh", "mmm", "hmm", "like", "basically", "you know". If they use them, drop the communication and confidence scores significantly.
  3. Listen to the candidate's answer. Evaluate it internally.
  4. Decide action: "FOLLOW_UP" (probe deeper), "NEXT_QUESTION" (move on), or "CONCLUDE" (end if enough turns passed).
  5. If candidate makes a vague claim, ask "HOW" or "WHY" or ask for an "EXAMPLE".
  6. Never say "Great answer!" or use excessive encouragement. Be neutral and slightly challenging.
  7. Do not reveal your scoring.
  
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
    "spokenResponse": "The exact text you will speak. If their answer was terrible, professionally call them out (e.g., 'That was far too brief and lacked any technical depth. Can you elaborate?').",
    "topic": "current topic being discussed",
    "internalFeedback": "Harsh, direct note on what was bad. e.g. 'Answer was only 5 words. Heavy use of filler words. Zero technical depth.'"
  }`;

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', temperature: 0.5, max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: systemPrompt }]
  });

  return safeParse(res.choices[0].message.content) || mockFallback();
}

export async function generateFinalReport(interview) {
  if (!groq) return { 
    overallScore: 20, categoryScores: { technical: 20, communication: 15, confidence: 20, problemSolving: 20, behavioral: 20, roleKnowledge: 20 },
    strengths: ["None demonstrated"], weaknesses: ["Lack of effort", "Extremely short answers"], skillGaps: [], recommendations: ["Practice giving complete answers"], aiCoachSummary: "Performance was extremely poor." 
  };

  const transcriptSummary = interview.transcript.map((t, i) => 
    `Q${i+1}: ${t.question}\nA: ${t.answer}\nScores: Tech ${t.evaluation?.technical || 0}, Comm ${t.evaluation?.communication || 0}, Conf ${t.evaluation?.confidence || 0}`
  ).join('\n\n');

  const prompt = `Generate a strict, professional final interview evaluation report based on this transcript. Do not sugarcoat poor performance.
  Target Role: ${interview.targetRole}
  
  TRANSCRIPT:
  ${transcriptSummary}
  
  Return strict JSON:
  {
    "overallScore": 0-100,
    "categoryScores": { "technical": 0-100, "communication": 0-100, "confidence": 0-100, "problemSolving": 0-100, "behavioral": 0-100, "roleKnowledge": 0-100 },
    "strengths": ["array of 3 specific strengths, if any. If performance was poor, state 'None demonstrated'"],
    "weaknesses": ["array of 3 specific weaknesses, e.g., 'Overuse of filler words', 'Lack of technical depth'"],
    "skillGaps": ["array of missing skills detected during interview"],
    "recommendations": ["array of 3 harsh but actionable practice items"],
    "aiCoachSummary": "A 3-sentence professional, direct summary of their performance. If they performed poorly, tell them they are not interview-ready and need significant practice."
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
    evaluation: { technical: 20, communication: 15, confidence: 20, relevance: 30, depth: 10 },
    action: "FOLLOW_UP", topic: "General Experience",
    spokenResponse: "That answer was far too brief and lacked any technical depth. Can you elaborate on what you actually did?",
    internalFeedback: "Mock fallback: Answer was too short."
  };
}