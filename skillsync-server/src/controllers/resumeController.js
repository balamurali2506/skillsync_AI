import multer from 'multer';
import Resume from '../models/Resume.js';
import { extractText } from 'unpdf';
import { getAIClient } from '../services/interviewEngine.js';
import { GoogleGenerativeAI } from '@google/generative-ai'; 

// ============================================================
// 1. MULTER CONFIGURATION
// ============================================================

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// ============================================================
// 2. HELPER FUNCTIONS
// ============================================================

function clampScore(value) {
  const score = Number(value);
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function cleanArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
}

function cleanObjectScores(object = {}) {
  return {
    keywords: clampScore(object.keywords),
    formatting: clampScore(object.formatting),
    impact: clampScore(object.impact),
    experience: clampScore(object.experience),
    skills: clampScore(object.skills),
    projects: clampScore(object.projects),
    education: clampScore(object.education),
  };
}

function safeJSONParse(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    const cleaned = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error('AI returned invalid JSON');
    }
  }
}

// ============================================================
// 3. ANALYZE RESUME
// ============================================================

export async function analyze(req, res, next) {
  try {
    // Validate upload
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF resume uploaded' });
    }

    // Extract PDF text
    const uint8Buffer = new Uint8Array(req.file.buffer);
    const result = await extractText(uint8Buffer, { mergePages: true });
    const rawText = Array.isArray(result.text) ? result.text.join('\n') : (result.text || '');
    const extractedText = rawText.trim();

    if (!extractedText) {
      return res.status(400).json({
        error: 'Could not extract text from this PDF. Please upload a text-based resume PDF.',
      });
    }

    const text = extractedText.slice(0, 18000);
    const jobDescription = req.body?.jobDescription
      ? String(req.body.jobDescription).slice(0, 10000)
      : '';

    let analysis;

    // Get AI client
    const aiConfig = await getAIClient(req.user._id);

    if (aiConfig) {
      const { client, model } = aiConfig;

      const systemPrompt = `
You are SkillSync AI, an expert ATS resume analyzer, technical recruiter, career coach, and resume optimization specialist.

Your job is to perform a professional-level resume audit.

You MUST analyze ONLY the information contained in the resume.
Do not invent companies, degrees, technologies, job titles, achievements, certifications, or experience that are not present.

Be especially careful with student and fresher resumes.

Evaluate the resume from three perspectives:
1. ATS SYSTEM
2. TECHNICAL RECRUITER
3. HUMAN RECRUITER

Return ONLY valid JSON. Do not use Markdown. Do not wrap the JSON in code fences.
Every score must be an integer from 0 to 100.
`;

      const userPrompt = `
Analyze the following resume.

========================
RESUME
========================

${text}

========================
JOB DESCRIPTION
========================

${jobDescription || 'No specific job description provided.'}

========================
REQUIRED OUTPUT
========================

Return JSON with EXACTLY this structure:

{
  "atsScore": 0,
  "breakdown": {
    "keywords": 0,
    "formatting": 0,
    "impact": 0,
    "experience": 0,
    "skills": 0,
    "projects": 0,
    "education": 0
  },
  "candidateProfile": {
    "name": "",
    "targetRole": "",
    "experienceLevel": "",
    "careerField": "",
    "yearsOfExperience": 0
  },
  "contactAnalysis": {
    "email": true,
    "phone": true,
    "linkedin": true,
    "github": true,
    "portfolio": true
  },
  "sectionAnalysis": {
    "summary": { "present": true, "score": 0, "feedback": "" },
    "skills": { "present": true, "score": 0, "feedback": "" },
    "experience": { "present": true, "score": 0, "feedback": "" },
    "projects": { "present": true, "score": 0, "feedback": "" },
    "education": { "present": true, "score": 0, "feedback": "" },
    "certifications": { "present": true, "score": 0, "feedback": "" }
  },
  "extractedSkills": [],
  "technicalSkills": [],
  "softSkills": [],
  "matchedKeywords": [],
  "missingKeywords": [],
  "actionVerbsFound": [],
  "recommendedActionVerbs": [],
  "quantifiedAchievements": [],
  "missingQuantification": [],
  "experienceAnalysis": [],
  "projectAnalysis": [],
  "educationAnalysis": { "strengths": [], "suggestions": [] },
  "strengths": [],
  "weaknesses": [],
  "criticalIssues": [],
  "quickWins": [],
  "atsWarnings": [],
  "improvementPlan": [],
  "rewriteSuggestions": [],
  "jobMatch": {
    "matchScore": 0,
    "matchingSkills": [],
    "missingSkills": [],
    "matchingKeywords": [],
    "missingKeywords": [],
    "recommendation": ""
  },
  "careerRecommendations": [],
  "recruiterSummary": "",
  "feedback": []
}`;

      const response = await client.chat.completions.create({
        model,
        temperature: 0.15,
        max_tokens: 7000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response received from AI');
      }

      analysis = safeJSONParse(content);
    } else {
      // Smart Mock Fallback
      console.log('⚠️ No AI client available — using Smart Mock fallback.');
      const baseScore = Math.min(95, Math.max(40, Math.floor(text.length / 20) + 40));

      analysis = {
        atsScore: baseScore,
        breakdown: {
          keywords: Math.max(0, baseScore - 5),
          formatting: Math.min(100, baseScore + 3),
          impact: Math.max(0, baseScore - 8),
          experience: baseScore,
          skills: baseScore,
          projects: baseScore,
          education: baseScore,
        },
        candidateProfile: {
          name: '',
          targetRole: '',
          experienceLevel: 'Student / Fresher',
          careerField: 'Software Development',
          yearsOfExperience: 0,
        },
        contactAnalysis: {
          email: true,
          phone: true,
          linkedin: false,
          github: false,
          portfolio: false,
        },
        sectionAnalysis: {},
        extractedSkills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Git'],
        technicalSkills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Git'],
        softSkills: [],
        matchedKeywords: [],
        missingKeywords: [],
        actionVerbsFound: ['Developed', 'Created', 'Implemented'],
        recommendedActionVerbs: ['Engineered', 'Optimized', 'Designed', 'Implemented', 'Automated'],
        quantifiedAchievements: [],
        missingQuantification: [
          'Add measurable results to major projects.',
          'Add performance or efficiency improvements where applicable.',
        ],
        experienceAnalysis: [],
        projectAnalysis: [],
        educationAnalysis: { strengths: [], suggestions: [] },
        strengths: [
          'Resume contains technical skills.',
          'Resume appears suitable for ATS parsing.',
          'Projects can provide useful evidence of technical ability.',
        ],
        weaknesses: [
          'Some achievements may lack measurable results.',
          'Job-specific keyword optimization may be limited.',
        ],
        criticalIssues: [],
        quickWins: [
          'Add measurable project outcomes.',
          'Add GitHub and LinkedIn links if available.',
          'Tailor keywords to the target job description.',
        ],
        atsWarnings: [],
        improvementPlan: [
          {
            priority: 'HIGH',
            issue: 'Add measurable achievements',
            whyItMatters: 'Recruiters can understand your impact more quickly.',
            howToFix: 'Add genuine numbers, percentages, users, time saved, or performance improvements.',
            example: 'Improved page load performance by 30% using code splitting.',
          },
        ],
        rewriteSuggestions: [],
        jobMatch: {
          matchScore: 0,
          matchingSkills: [],
          missingSkills: [],
          matchingKeywords: [],
          missingKeywords: [],
          recommendation: 'Provide a job description for detailed job matching.',
        },
        careerRecommendations: [
          'Continue building practical projects.',
          'Strengthen problem-solving and data structures skills.',
          'Tailor your resume for each target role.',
        ],
        recruiterSummary:
          'The resume demonstrates technical potential but can be strengthened with measurable achievements and stronger job-specific keyword alignment.',
        feedback: [
          'Add measurable results to your strongest achievements.',
          'Tailor technical keywords to the target job.',
          'Include relevant GitHub, LinkedIn, or portfolio links.',
          'Use strong action verbs at the beginning of bullet points.',
          'Keep project descriptions focused on problem, technology, and outcome.',
        ],
      };
    }

    // Normalize AI Response
    analysis.atsScore = clampScore(analysis.atsScore);
    analysis.breakdown = cleanObjectScores(analysis.breakdown);
    analysis.extractedSkills = cleanArray(analysis.extractedSkills);
    analysis.technicalSkills = cleanArray(analysis.technicalSkills);
    analysis.softSkills = cleanArray(analysis.softSkills);
    analysis.matchedKeywords = cleanArray(analysis.matchedKeywords);
    analysis.missingKeywords = cleanArray(analysis.missingKeywords);
    analysis.actionVerbsFound = cleanArray(analysis.actionVerbsFound);
    analysis.recommendedActionVerbs = cleanArray(analysis.recommendedActionVerbs);
    analysis.strengths = cleanArray(analysis.strengths);
    analysis.weaknesses = cleanArray(analysis.weaknesses);
    analysis.criticalIssues = cleanArray(analysis.criticalIssues);
    analysis.quickWins = cleanArray(analysis.quickWins);
    analysis.atsWarnings = cleanArray(analysis.atsWarnings);
    analysis.careerRecommendations = cleanArray(analysis.careerRecommendations);
    analysis.feedback = cleanArray(analysis.feedback).slice(0, 5);

    // Save to MongoDB
    const resume = await Resume.create({
      user: req.user._id,
      fileName: req.file.originalname,
      atsScore: analysis.atsScore,
      breakdown: analysis.breakdown,
      extractedSkills: analysis.extractedSkills,
      feedback: analysis.feedback,
      rawText: text,
      analysis,
    });

    return res.status(201).json({
      success: true,
      message: 'Resume analyzed successfully',
      resume,
      analysis,
    });
  } catch (err) {
    console.error('❌ Resume analysis error:', err);
    next(err);
  }
}

// ============================================================
// 4. LIST USER RESUMES
// ============================================================

export async function list(req, res, next) {
  try {
    const resumes = await Resume.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: resumes.length,
      resumes,
    });
  } catch (err) {
    console.error('❌ Resume list error:', err);
    next(err);
  }
}