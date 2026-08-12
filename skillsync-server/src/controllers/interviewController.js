import Interview from '../models/Interview.js';
import Resume from '../models/Resume.js';
import { generateQuestion, evaluateAnswer, buildReport } from '../services/interviewAI.js';

function resumeContext(resume) {
  if (!resume) return {};
  return {
    resumeSkills: (resume.extractedSkills || []).join(', '),
    resumeText: (resume.rawText || '').slice(0, 5000),
  };
}

// POST /api/interviews/start
export async function start(req, res, next) {
  try {
    const {
      targetRole, interviewType = 'Mixed', difficulty = 'Medium',
      durationMinutes = 15, questionCount = 6, jobDescription = '', focus = '',
    } = req.body;

    const count = Math.max(3, Math.min(12, Number(questionCount) || 6));
    const duration = Math.max(5, Math.min(60, Number(durationMinutes) || 15));

    // 🔑 Each user's MOST RECENT uploaded resume powers the questions
    const resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    const baseDifficulty = { Easy: 2, Medium: 3, Hard: 4 }[difficulty] || 3;

    const interview = await Interview.create({
      user: req.user._id,
      targetRole: targetRole || req.user.targetRole || 'Software Engineer',
      interviewType, difficulty, durationMinutes: duration, questionCount: count,
      jobDescription: String(jobDescription).slice(0, 8000), focus,
      resumeId: resume?._id,
      currentDifficulty: baseDifficulty,
      startedAt: new Date(),
    });

    const first = await generateQuestion({
      ...resumeContext(resume),
      targetRole: interview.targetRole, interviewType, difficulty, focus,
      currentDifficulty: baseDifficulty,
    });

    interview.questions.push({
      question: first.question, questionType: first.questionType,
      difficulty: first.difficulty, speakText: first.speakText,
    });
    await interview.save();

    res.status(201).json({
      interviewId: interview._id,
      question: first,
      resumeUsed: resume ? { fileName: resume.fileName, skills: resume.extractedSkills } : null,
    });
  } catch (err) { next(err); }
}

// POST /api/interviews/:id/answer
export async function answer(req, res, next) {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.status !== 'active') return res.status(400).json({ error: 'Interview is not active' });

    const { answer: answerText, answerDuration = 0, fillerWords = [] } = req.body;
    if (!answerText?.trim()) return res.status(400).json({ error: 'Answer is required' });

    const resume = interview.resumeId ? await Resume.findById(interview.resumeId) : null;
    const current = interview.questions[interview.questions.length - 1];

    current.answer = String(answerText).slice(0, 6000);
    current.answerDuration = Number(answerDuration) || 0;
    current.fillerWords = Array.isArray(fillerWords) ? fillerWords.slice(0, 10) : [];

    // Evaluate this answer
    const evalResult = await evaluateAnswer({
      question: current.question, answer: current.answer, questionType: current.questionType,
    });
    current.evaluation = evalResult.evaluation;
    current.wentWell = evalResult.wentWell;
    current.improve = evalResult.improve;
    current.idealStructure = evalResult.idealStructure;
    current.recommendedAnswer = evalResult.recommendedAnswer;

    // Adaptive difficulty
    const score = evalResult.evaluation.overall;
    if (score >= 75) interview.currentDifficulty = Math.min(5, interview.currentDifficulty + 1);
    else if (score < 45) interview.currentDifficulty = Math.max(1, interview.currentDifficulty - 1);

    // Done?
    const elapsedMin = (Date.now() - new Date(interview.startedAt).getTime()) / 60000;
    const done = interview.questions.length >= interview.questionCount || elapsedMin >= interview.durationMinutes;

    let nextQuestion = null;
    if (!done) {
      const lastAnswered = current;
      nextQuestion = await generateQuestion({
        ...resumeContext(resume),
        targetRole: interview.targetRole, interviewType: interview.interviewType,
        difficulty: interview.difficulty, focus: interview.focus,
        jobDescription: interview.jobDescription,
        currentDifficulty: interview.currentDifficulty,
        history: { question: lastAnswered.question, answer: lastAnswered.answer?.slice(0, 600), overall: score },
      });
      interview.questions.push({
        question: nextQuestion.question, questionType: nextQuestion.questionType,
        difficulty: nextQuestion.difficulty, speakText: nextQuestion.speakText,
      });
    }

    await interview.save();
    res.json({ evaluation: evalResult.evaluation, done, next: nextQuestion });
  } catch (err) { next(err); }
}

// POST /api/interviews/:id/end  → final report
export async function end(req, res, next) {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    interview.status = 'completed';
    interview.completedAt = new Date();

    const report = await buildReport(interview);
    Object.assign(interview, {
      overallScore: report.overallScore, readinessLevel: report.readinessLevel,
      categoryScores: report.categoryScores, communicationAnalysis: report.communicationAnalysis,
      strengths: report.strengths, weaknesses: report.weaknesses,
      improvementPlan: report.improvementPlan, coachingSummary: report.coachingSummary,
      practicePlan: report.practicePlan,
    });
    await interview.save();

    res.json(report);
  } catch (err) { next(err); }
}

// GET /api/interviews
export async function list(req, res, next) {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(20)
      .select('targetRole interviewType overallScore readinessLevel status createdAt questionCount');
    res.json({ interviews });
  } catch (err) { next(err); }
}

// GET /api/interviews/:id/report
export async function getReport(req, res, next) {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json(interview);
  } catch (err) { next(err); }
}