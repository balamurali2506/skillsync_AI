// src/controllers/dashboardController.js
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import Interview from '../models/Interview.js';
import { calculateReadiness, getReadinessLabel } from '../services/readinessService.js';
import { generateDailyPlan, generateInsight } from '../services/dashboardAI.js';

export async function getDashboard(req, res, next) {
  try {
    const userId = req.user._id;

    // 1. Parallel Database Fetch
    const [user, latestResume, latestInterview] = await Promise.all([
      User.findById(userId),
      Resume.findOne({ user: userId }).sort({ createdAt: -1 }),
      Interview.findOne({ user: userId, status: 'completed' }).sort({ completedAt: -1 })
    ]);

    // 2. Extract Metrics (null if not assessed)
    const metrics = {
      resume: latestResume?.atsScore || null,
      interview: latestInterview?.overallScore || null,
      communication: latestInterview?.categoryScores?.communication || null,
      technicalSkills: latestInterview?.categoryScores?.technical || null,
      coding: null, // Wire this when Coding Tracker backend is fully built
      projects: null
    };

    // 3. Calculate Readiness
    const readiness = calculateReadiness(metrics);
    readiness.label = getReadinessLabel(readiness.overall);

    // 4. AI Generation (Non-blocking if it fails)
    let dailyPlan = [];
    let aiInsight = null;
    try {
      [dailyPlan, aiInsight] = await Promise.all([
        generateDailyPlan(metrics, user.targetRole),
        generateInsight(metrics, readiness, user.targetRole)
      ]);
    } catch (e) {
      console.warn('AI insight generation failed, using fallback', e);
    }

    // 5. Return Unified Payload
    res.json({
      user: { name: user.name, targetRole: user.targetRole, streak: user.streak || 0 },
      readiness,
      resume: latestResume ? { score: latestResume.atsScore, fileName: latestResume.fileName, skills: latestResume.extractedSkills } : null,
      interview: latestInterview ? { score: latestInterview.overallScore, categories: latestInterview.categoryScores } : null,
      dailyPlan,
      aiInsight,
      coding: { streak: 0, solved: 0 }, // Placeholder
      achievements: [] // Placeholder
    });
  } catch (err) {
    next(err);
  }
}