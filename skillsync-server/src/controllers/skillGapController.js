import { analyzeSkillGap, analyzeJobMatch } from '../services/skillGapAI.js';

export async function getSkillGap(req, res, next) {
  try {
    const targetRole = req.user.targetRole || 'Software Engineer';
    const analysis = await analyzeSkillGap(req.user._id, targetRole);
    
    res.json({
      targetRole,
      ...analysis,
      hasResume: !!analysis.skills?.length
    });
  } catch (err) {
    next(err);
  }
}

export async function analyzeWithJob(req, res, next) {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription?.trim()) {
      return res.status(400).json({ error: 'Job description is required' });
    }
    
    const jobMatch = await analyzeJobMatch(req.user._id, jobDescription);
    res.json(jobMatch);
  } catch (err) {
    next(err);
  }
}