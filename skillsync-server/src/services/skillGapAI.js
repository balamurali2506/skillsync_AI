import OpenAI from 'openai';
import Resume from '../models/Resume.js';
import Interview from '../models/Interview.js';
import CodingActivity from '../models/CodingActivity.js';
import Course from '../models/Course.js';

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

const SKILL_CATEGORIES = {
  'Programming Languages': ['Java', 'Python', 'JavaScript', 'C++', 'C#', 'Go', 'Rust', 'TypeScript'],
  'Frontend': ['React', 'Angular', 'Vue', 'HTML', 'CSS', 'Next.js', 'Redux', 'Tailwind'],
  'Backend': ['Node.js', 'Spring Boot', 'Express', 'Django', 'FastAPI', 'REST APIs', 'GraphQL'],
  'Databases': ['MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Firebase', 'DynamoDB'],
  'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure', 'GCP', 'Terraform', 'Jenkins'],
  'Data/AI': ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn'],
  'CS Fundamentals': ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'OOP', 'System Design'],
  'Soft Skills': ['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Presentation', 'Time Management']
};

export async function analyzeSkillGap(userId, targetRole, jobDescription = '') {
  const [latestResume, interviews, codingActivities, courses] = await Promise.all([
    Resume.findOne({ user: userId }).sort({ createdAt: -1 }),
    Interview.find({ user: userId, status: 'completed' }).sort({ completedAt: -1 }).limit(5),
    CodingActivity.find({ user: userId }).sort({ solvedAt: -1 }).limit(50),
    Course.find({ user: userId }).sort({ createdAt: -1 })
  ]);

  const context = {
    targetRole,
    resumeText: latestResume?.rawText || '',
    extractedSkills: latestResume?.extractedSkills || [],
    interviewPerformance: interviews.map(i => ({
      score: i.overallScore,
      technical: i.categoryScores?.technical,
      communication: i.categoryScores?.communication
    })),
    codingTopics: codingActivities.map(c => c.topic),
    completedCourses: courses.filter(c => c.status === 'completed').map(c => c.skill),
    jobDescription
  };

  if (groq) {
    const prompt = `Analyze skill gaps for a ${targetRole} candidate.

CONTEXT:
Resume Skills: ${context.extractedSkills.join(', ')}
Resume Text: ${context.resumeText.slice(0, 3000)}
Interview Performance: ${JSON.stringify(context.interviewPerformance)}
Coding Topics: ${context.codingTopics.join(', ')}
Completed Courses: ${context.completedCourses.join(', ')}
${jobDescription ? `Job Description: ${jobDescription.slice(0, 2000)}` : ''}

SKILL CATEGORIES:
${JSON.stringify(SKILL_CATEGORIES)}

Analyze and return strict JSON:
{
  "skills": [
    {
      "skill": "string",
      "category": "string (from SKILL_CATEGORIES keys)",
      "currentLevel": 0-5 (0=not demonstrated, 1=beginner, 2=basic, 3=intermediate, 4=advanced, 5=expert),
      "targetLevel": 0-5,
      "matchPercentage": 0-100,
      "gapPercentage": 0-100,
      "importance": "CRITICAL|HIGH|MEDIUM|LOW",
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "evidence": ["array of strings explaining why this level was assigned"],
      "recommendation": "string - what to learn/do next"
    }
  ],
  "topGaps": [
    {
      "skill": "string",
      "reason": "string - why this is a critical gap",
      "currentLevel": 0-5,
      "targetLevel": 0-5,
      "action": "string - specific learning action"
    }
  ],
  "roadmap": [
    {
      "phase": 1,
      "title": "string",
      "skills": ["array"],
      "duration": "string (e.g. '7 days')",
      "prerequisites": ["array"]
    }
  ],
  "overallMatch": 0-100,
  "aiInsight": "string - 2-3 sentence career recommendation"
}

RULES:
- Never fabricate skills or evidence
- Only assign skill levels based on actual evidence from resume/interviews/coding
- Prioritize skills based on target role requirements
- CRITICAL priority = required for role and missing
- HIGH priority = highly relevant and weak
- Provide realistic learning durations
- Generate ordered roadmap with prerequisites`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a career skill intelligence engine. Analyze candidate skills against target role. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ]
      });
      return safeJSONParse(response.choices[0].message.content);
    } catch (err) {
      console.error('Groq skill analysis failed:', err);
    }
  }

  // Fallback: Basic heuristic analysis
  return generateFallbackAnalysis(context);
}

function generateFallbackAnalysis(context) {
  const have = new Set(context.extractedSkills.map(s => s.toLowerCase()));
  const allSkills = Object.values(SKILL_CATEGORIES).flat();
  
  const skills = allSkills.map(skill => {
    const hasSkill = have.has(skill.toLowerCase());
    const level = hasSkill ? 3 : 0;
    const target = context.targetRole === 'Software Engineer' ? 4 : 3;
    
    return {
      skill,
      category: Object.keys(SKILL_CATEGORIES).find(cat => SKILL_CATEGORIES[cat].includes(skill)),
      currentLevel: level,
      targetLevel: target,
      matchPercentage: hasSkill ? 75 : 0,
      gapPercentage: hasSkill ? 25 : 100,
      importance: hasSkill ? 'MEDIUM' : 'LOW',
      priority: hasSkill ? 'LOW' : 'MEDIUM',
      evidence: hasSkill ? ['Found in resume'] : ['No evidence found'],
      recommendation: hasSkill ? 'Strengthen with projects' : 'Learn fundamentals'
    };
  });

  return {
    skills,
    topGaps: skills.filter(s => !have.has(s.skill.toLowerCase())).slice(0, 5).map(s => ({
      skill: s.skill,
      reason: 'Required for target role',
      currentLevel: 0,
      targetLevel: 4,
      action: `Learn ${s.skill} fundamentals`
    })),
    roadmap: [
      { phase: 1, title: 'Core Skills', skills: ['JavaScript', 'React', 'Node.js'], duration: '14 days', prerequisites: [] },
      { phase: 2, title: 'Advanced Topics', skills: ['System Design', 'Docker'], duration: '21 days', prerequisites: ['Core Skills'] }
    ],
    overallMatch: Math.round((have.size / allSkills.length) * 100),
    aiInsight: 'Focus on building core technical skills first, then specialize based on your target role.'
  };
}

export async function analyzeJobMatch(userId, jobDescription) {
  if (!jobDescription?.trim()) return null;

  const latestResume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
  
  if (groq) {
    const prompt = `Analyze job match.

RESUME SKILLS: ${(latestResume?.extractedSkills || []).join(', ')}
JOB DESCRIPTION: ${jobDescription.slice(0, 3000)}

Return JSON:
{
  "overallMatch": 0-100,
  "requiredSkills": [
    {
      "skill": "string",
      "matched": true|false,
      "importance": "CRITICAL|HIGH|MEDIUM|LOW"
    }
  ],
  "matchedCount": number,
  "missingCount": number,
  "criticalMissing": ["array of critical missing skills"],
  "recommendation": "string"
}`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Analyze job description match. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ]
      });
      return safeJSONParse(response.choices[0].message.content);
    } catch (err) {
      console.error('Job match analysis failed:', err);
    }
  }

  return {
    overallMatch: 50,
    requiredSkills: [],
    matchedCount: 0,
    missingCount: 0,
    criticalMissing: [],
    recommendation: 'Upload a resume and provide a job description for detailed analysis.'
  };
}