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
  try {
    const prompt = `You are a strict, professional AI interviewer. Role: ${config.targetRole}. Generate a brief opening (max 3 sentences) and ask the first question. Return JSON: { "spokenText": "..." }`;
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', temperature: 0.6, max_tokens: 150,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    });
    return safeParse(res.choices[0].message.content)?.spokenText || "Welcome. Let's begin with your background.";
  } catch (err) {
    console.error('Groq opening error:', err);
    return "Welcome. Let's begin with your background.";
  }
}

export async function processTurn(interview, candidateAnswer) {
  const recentHistory = interview.messages.slice(-4).map(m => `${m.speaker}: ${m.text}`).join('\n');
  
  const systemPrompt = `You are a strict, professional technical interviewer. 
  RULES: 1. Short/vague answers get VERY LOW scores (0-30). 2. Penalize filler words (uh, um, ahh). 3. Decide action: FOLLOW_UP, NEXT_QUESTION, or CONCLUDE.
  CONFIG: Role: ${interview.targetRole}, Turn: ${interview.turnCount}
  HISTORY:\n${recentHistory}\n
  CANDIDATE: "${candidateAnswer}"
  Return JSON: { "evaluation": {"technical":0-100,"communication":0-100,"confidence":0-100,"relevance":0-100,"depth":0-100}, "action":"FOLLOW_UP|NEXT_QUESTION|CONCLUDE", "spokenResponse":"...", "topic":"...", "internalFeedback":"..." }`;

  try {
    if (!groq) throw new Error('No Groq');
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', temperature: 0.5, max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: systemPrompt }]
    });
    const parsed = safeParse(res.choices[0].message.content);
    if (parsed) return parsed;
  } catch (err) {
    console.error('Groq processTurn error:', err);
  }
  
  return mockFallback();
}

export async function generateFinalReport(interview) {
  const transcriptSummary = interview.transcript.map((t, i) => 
    `Q${i+1}: ${t.question}\nA: ${t.answer}\nScores: Tech ${t.evaluation?.technical || 0}, Comm ${t.evaluation?.communication || 0}`
  ).join('\n\n');

  try {
    if (!groq) throw new Error('No Groq');
    const prompt = `Generate strict final report. Target: ${interview.targetRole}. Transcript:\n${transcriptSummary}\nReturn JSON: {"overallScore":0-100, "categoryScores":{"technical":0,"communication":0,"confidence":0,"problemSolving":0,"behavioral":0,"roleKnowledge":0}, "strengths":[], "weaknesses":[], "skillGaps":[], "recommendations":[], "aiCoachSummary":"..."}`;
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', temperature: 0.3, max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    });
    const parsed = safeParse(res.choices[0].message.content);
    if (parsed) return parsed;
  } catch (err) {
    console.error('Groq final report error:', err);
  }

  return { overallScore: 40, categoryScores: { technical: 40, communication: 40, confidence: 40, problemSolving: 40, behavioral: 40, roleKnowledge: 40 }, strengths: ["Participation"], weaknesses: ["Provide more detailed answers"], skillGaps: [], recommendations: ["Practice elaborating"], aiCoachSummary: "AI analysis was unavailable, but keep practicing detailed responses." };
}

function mockFallback() {
  return {
    evaluation: { technical: 20, communication: 15, confidence: 20, relevance: 30, depth: 10 },
    action: "FOLLOW_UP", 
    spokenResponse: "That answer was far too brief and lacked any technical depth. Can you elaborate on what you actually did?",
    topic: "General Experience",
    internalFeedback: "Fallback used: Answer was too short."
  };
}