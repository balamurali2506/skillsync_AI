// src/services/dashboardAI.js
import OpenAI from 'openai';

const groq = process.env.GROQ_API_KEY ? new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
}) : null;

function safeJSONParse(content) {
  try { return JSON.parse(content); }
  catch {
    try { return JSON.parse(content.replace(/```json/gi, '').replace(/```/g, '').trim()); }
    catch { return null; }
  }
}

export async function generateDailyPlan(metrics, targetRole) {
  if (!groq) {
    return [
      { task: 'Upload your resume', time: '5 mins', focus: 'Get your baseline ATS score', module: '/resume' },
      { task: 'Start a mock interview', time: '15 mins', focus: 'Practice behavioral questions', module: '/interview' },
    ];
  }

  const prompt = `User target role: ${targetRole || 'Software Engineer'}.
Current metrics (null means not assessed yet):
Resume: ${metrics.resume}, Interview: ${metrics.interview}, Communication: ${metrics.communication}, Technical: ${metrics.technicalSkills}, Coding: ${metrics.coding}.

Generate a "Today's Career Plan" with exactly 3 actionable tasks to improve their weakest areas. 
Return strict JSON array: [{"task": string, "time": string (e.g. '15 mins'), "focus": string, "module": string (one of: /resume, /interview, /coding, /skills, /courses)}]`;

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', temperature: 0.6, max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: 'You are a career coach. Return JSON with key "plan" containing the array.' }, { role: 'user', content: prompt }],
  });
  
  const data = safeJSONParse(res.choices[0].message.content);
  return data?.plan || [];
}

export async function generateInsight(metrics, readiness, targetRole) {
  if (!groq || !readiness.hasData) return null;

  const prompt = `Metrics: Resume ${metrics.resume}, Interview ${metrics.interview}, Tech ${metrics.technicalSkills}, Comm ${metrics.communication}. Overall Readiness: ${readiness.overall}%. Target: ${targetRole}.
Write ONE concise, encouraging paragraph (max 40 words) explaining their biggest opportunity for improvement based on these numbers. Do not use quotes.`;

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', temperature: 0.7, max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.choices[0].message.content;
}