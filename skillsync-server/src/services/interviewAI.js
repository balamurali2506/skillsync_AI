import OpenAI from 'openai';
import { INTERVIEWER_SYSTEM, questionPrompt, evaluationPrompt, reportPrompt } from '../utils/interviewPrompts.js';

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : null;

function safeJSONParse(content) {
  try { return JSON.parse(content); }
  catch {
    try { return JSON.parse(content.replace(/```json/gi, '').replace(/```/g, '').trim()); }
    catch { throw new Error('AI returned invalid JSON'); }
  }
}

async function ask(messages, { temperature = 0.5, maxTokens = 1400 } = {}) {
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', temperature, max_tokens: maxTokens,
    response_format: { type: 'json_object' }, messages,
  });
  return safeJSONParse(res.choices[0].message.content);
}

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
const clean = (v) => (Array.isArray(v) ? v.filter(Boolean).map(String) : []);

// ── Dynamic question engine ──────────────────────────────────
export async function generateQuestion(ctx) {
  if (groq) {
    const data = await ask([
      { role: 'system', content: INTERVIEWER_SYSTEM },
      { role: 'user', content: questionPrompt(ctx) },
    ], { temperature: 0.8 });
    return {
      speakText: data.speakText || data.question,
      question: data.question || 'Tell me about yourself.',
      questionType: data.questionType || 'technical',
      difficulty: Math.max(1, Math.min(5, Number(data.difficulty) || ctx.currentDifficulty)),
    };
  }
  // Mock fallback
  const pools = {
    resume: `I see ${ctx.resumeSkills?.split(',')[0] || 'a skill'} on your resume. Walk me through a project where you used it.`,
    technical: 'Explain how you would design a simple URL shortener service.',
    behavioral: 'Tell me about a time you solved a difficult problem using the STAR method.',
    hr: 'Why are you interested in this role, and where do you see yourself in 3 years?',
  };
  const type = ctx.interviewType === 'Mixed'
    ? ['technical', 'resume', 'behavioral'][ctx.currentDifficulty % 3]
    : ctx.interviewType.toLowerCase();
  const q = pools[type] || pools.technical;
  return { speakText: q, question: q, questionType: type, difficulty: ctx.currentDifficulty };
}

// ── Answer evaluation ────────────────────────────────────────
export async function evaluateAnswer({ question, answer, questionType }) {
  if (groq) {
    const data = await ask([
      { role: 'system', content: INTERVIEWER_SYSTEM },
      { role: 'user', content: evaluationPrompt({ question, answer, questionType }) },
    ], { temperature: 0.3 });
    const ev = data.evaluation || {};
    return {
      evaluation: {
        technicalAccuracy: clamp(ev.technicalAccuracy), relevance: clamp(ev.relevance),
        completeness: clamp(ev.completeness), communication: clamp(ev.communication),
        confidence: clamp(ev.confidence), problemSolving: clamp(ev.problemSolving),
        depth: clamp(ev.depth), overall: clamp(ev.overall),
      },
      wentWell: clean(data.wentWell), improve: clean(data.improve),
      idealStructure: data.idealStructure || '', recommendedAnswer: data.recommendedAnswer || '',
      fillerWords: clean(data.fillerWords),
    };
  }
  const base = Math.min(90, 50 + Math.floor(answer.length / 50));
  return {
    evaluation: { technicalAccuracy: base, relevance: base, completeness: base - 5, communication: base, confidence: base - 3, problemSolving: base - 5, depth: base - 8, overall: base },
    wentWell: ['Clear delivery', 'Relevant examples'], improve: ['Add measurable outcomes', 'Structure with STAR'],
    idealStructure: 'Situation → Task → Action → Result', recommendedAnswer: 'Anchor claims with one concrete metric.',
    fillerWords: [],
  };
}

// ── Final report ─────────────────────────────────────────────
export async function buildReport(interview) {
  if (groq) {
    const data = await ask([
      { role: 'system', content: INTERVIEWER_SYSTEM },
      { role: 'user', content: reportPrompt(interview) },
    ], { temperature: 0.4, maxTokens: 2000 });

    const cs = data.categoryScores || {};
    return {
      overallScore: clamp(data.overallScore),
      readinessLevel: data.readinessLevel || 'Developing',
      categoryScores: {
        technical: clamp(cs.technical), communication: clamp(cs.communication),
        confidence: clamp(cs.confidence), problemSolving: clamp(cs.problemSolving),
        behavioral: clamp(cs.behavioral), roleKnowledge: clamp(cs.roleKnowledge),
      },
      communicationAnalysis: {
        clarity: clamp(data.communicationAnalysis?.clarity),
        conciseness: clamp(data.communicationAnalysis?.conciseness),
        confidence: clamp(data.communicationAnalysis?.confidence),
        fillerWords: clean(data.communicationAnalysis?.fillerWords),
        averageAnswerDuration: Number(data.communicationAnalysis?.averageAnswerDuration) || 0,
      },
      strengths: clean(data.strengths), weaknesses: clean(data.weaknesses),
      improvementPlan: clean(data.improvementPlan).map((p) => typeof p === 'string'
        ? { priority: 'MEDIUM', problem: p, whyItMatters: '', howToImprove: '', example: '' } : p),
      coachingSummary: data.coachingSummary || '',
      practicePlan: clean(data.practicePlan),
    };
  }
  const answered = interview.questions.filter((q) => q.evaluation);
  const avg = answered.length
    ? Math.round(answered.reduce((s, q) => s + (q.evaluation?.overall || 0), 0) / answered.length) : 0;
  return {
    overallScore: avg, readinessLevel: avg >= 80 ? 'Strong Candidate' : avg >= 60 ? 'Interview Ready' : 'Developing',
    categoryScores: { technical: avg, communication: avg, confidence: avg - 3, problemSolving: avg - 5, behavioral: avg, roleKnowledge: avg },
    communicationAnalysis: { clarity: avg, conciseness: avg, confidence: avg, fillerWords: [], averageAnswerDuration: 0 },
    strengths: ['Consistent answers', 'Good technical vocabulary'], weaknesses: ['Needs more quantified results'],
    improvementPlan: [{ priority: 'HIGH', problem: 'Quantify impact', whyItMatters: 'Recruiters scan for metrics', howToImprove: 'Add one number per bullet', example: 'Improved load time by 30%' }],
    coachingSummary: 'Solid foundation — sharpen examples with measurable outcomes.',
    practicePlan: ['Day 1: Fundamentals', 'Day 2: Project stories', 'Day 3: Behavioral STAR', 'Day 4: DSA', 'Day 5: Communication', 'Day 6: Mock interview', 'Day 7: Full simulation'],
  };
}