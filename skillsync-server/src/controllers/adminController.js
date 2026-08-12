import User from '../models/User.js';
import Resume from '../models/Resume.js';
import Interview from '../models/Interview.js';
import CodingActivity from '../models/CodingActivity.js';
import Course from '../models/Course.js';

export async function getDashboard(req, res, next) {
  try {
    const [
      totalUsers,
      activeUsers,
      totalResumes,
      totalInterviews,
      totalProblems,
      totalCourses
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      Resume.countDocuments(),
      Interview.countDocuments({ status: 'completed' }),
      CodingActivity.countDocuments(),
      Course.countDocuments({ status: 'completed' })
    ]);

    const resumes = await Resume.find().select('atsScore');
    const interviews = await Interview.find({ status: 'completed' }).select('overallScore');

    const avgResumeScore = resumes.length ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length) : 0;
    const avgInterviewScore = interviews.length ? Math.round(interviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / interviews.length) : 0;

    const avgReadiness = Math.round((avgResumeScore + avgInterviewScore) / 2);

    res.json({
      totalUsers,
      activeUsers,
      totalResumes,
      totalInterviews,
      totalProblems,
      totalCourses,
      avgResumeScore,
      avgInterviewScore,
      avgReadiness,
      systemHealth: {
        api: 'Healthy',
        database: 'Healthy',
        ai: process.env.GROQ_API_KEY ? 'Healthy' : 'Warning: No API key',
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { targetRole: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    // Enrich with latest scores
    const enriched = await Promise.all(users.map(async (user) => {
      const [latestResume, latestInterview] = await Promise.all([
        Resume.findOne({ user: user._id }).sort({ createdAt: -1 }).select('atsScore'),
        Interview.findOne({ user: user._id, status: 'completed' }).sort({ completedAt: -1 }).select('overallScore')
      ]);
      return {
        ...user.toObject(),
        resumeScore: latestResume?.atsScore || null,
        interviewScore: latestInterview?.overallScore || null
      };
    }));

    res.json({
      users: enriched,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getResumeAnalytics(req, res, next) {
  try {
    const resumes = await Resume.find().select('atsScore breakdown extractedSkills');
    
    const scores = resumes.map(r => r.atsScore).filter(Boolean);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const maxScore = Math.max(...scores, 0);
    const minScore = Math.min(...scores, 100);

    // Common missing skills (inverse of extracted)
    const skillCounts = {};
    resumes.forEach(r => {
      (r.extractedSkills || []).forEach(s => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    res.json({
      totalResumes: resumes.length,
      avgScore,
      maxScore,
      minScore,
      topSkills,
      scoreDistribution: {
        excellent: scores.filter(s => s >= 85).length,
        good: scores.filter(s => s >= 70 && s < 85).length,
        average: scores.filter(s => s >= 50 && s < 70).length,
        needsWork: scores.filter(s => s < 50).length
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getInterviewAnalytics(req, res, next) {
  try {
    const interviews = await Interview.find({ status: 'completed' }).select('overallScore categoryScores');
    
    const scores = interviews.map(i => i.overallScore).filter(Boolean);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const categoryAverages = {};
    if (interviews.length > 0) {
      const categories = ['technical', 'communication', 'confidence', 'problemSolving'];
      categories.forEach(cat => {
        const catScores = interviews.map(i => i.categoryScores?.[cat]).filter(Boolean);
        categoryAverages[cat] = catScores.length ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length) : 0;
      });
    }

    res.json({
      totalInterviews: interviews.length,
      avgScore,
      categoryAverages,
      scoreDistribution: {
        excellent: scores.filter(s => s >= 85).length,
        good: scores.filter(s => s >= 70 && s < 85).length,
        average: scores.filter(s => s >= 50 && s < 70).length,
        needsWork: scores.filter(s => s < 50).length
      }
    });
  } catch (err) {
    next(err);
  }
}