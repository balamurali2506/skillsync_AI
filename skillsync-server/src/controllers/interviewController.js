import Interview from '../models/Interview.js';
import { buildContext, generateOpening, processTurn, generateFinalReport } from '../services/interviewEngine.js';

export async function start(req, res, next) {
  try {
    const { targetRole, company, interviewType, mode, difficulty, durationMinutes, jobDescription } = req.body;
    const { resumeContext, resumeId } = await buildContext(req.user._id, targetRole, jobDescription);

    const interview = await Interview.create({
      user: req.user._id, 
      targetRole, 
      company, 
      interviewType: interviewType || 'Mixed', 
      mode: mode || 'MOCK_INTERVIEW', 
      difficulty: difficulty || 'Medium',
      durationMinutes: durationMinutes || 15, 
      jobDescription, 
      resumeId, 
      resumeContext,
      status: 'active', 
      startedAt: new Date()
    });

    // CRITICAL: Pass userId as FIRST argument
    const openingText = await generateOpening(req.user._id, interview, resumeContext);
    
    interview.messages.push({ speaker: 'ai', text: openingText, action: 'OPENING' });
    await interview.save();

    res.status(201).json({ interviewId: interview._id, openingText });
  } catch (err) { 
    console.error('Start interview error:', err);
    next(err); 
  }
}

export async function respond(req, res, next) {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview || interview.status !== 'active') return res.status(400).json({ error: 'Interview not active' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Empty answer' });

    interview.messages.push({ speaker: 'candidate', text });
    interview.turnCount += 1;

    // Get AI response (guaranteed to return a valid object now)
    const aiResponse = await processTurn(interview, text);

    interview.messages.push({ 
      speaker: 'ai', text: aiResponse.spokenResponse || "Let's move on.", 
      action: aiResponse.action || 'NEXT_QUESTION', topic: aiResponse.topic || 'General' 
    });
    
    if (aiResponse.topic) interview.currentTopic = aiResponse.topic;
    if (aiResponse.topic && !interview.topicsCovered.includes(aiResponse.topic)) {
      interview.topicsCovered.push(aiResponse.topic);
    }

    // Safely save to transcript
    interview.transcript.push({
      question: interview.messages[interview.messages.length - 2]?.text || '',
      answer: text,
      evaluation: aiResponse.evaluation || { technical: 50, communication: 50, confidence: 50, relevance: 50, depth: 50 },
      feedback: aiResponse.internalFeedback || ''
    });

    await interview.save();

    res.json({
      spokenText: aiResponse.spokenResponse || "Let's move on.",
      action: aiResponse.action || 'NEXT_QUESTION',
      topic: aiResponse.topic || 'General',
      turnCount: interview.turnCount
    });
  } catch (err) { 
    console.error('Respond error:', err);
    next(err); 
  }
}

export async function end(req, res, next) {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Not found' });

    interview.status = 'completed';
    interview.completedAt = new Date();

    const report = await generateFinalReport(interview);
    
    interview.overallScore = report.overallScore || 0;
    interview.categoryScores = report.categoryScores || {};
    interview.strengths = report.strengths || [];
    interview.weaknesses = report.weaknesses || [];
    interview.skillGaps = report.skillGaps || [];
    interview.recommendations = report.recommendations || [];
    interview.aiCoachSummary = report.aiCoachSummary || '';

    await interview.save();
    res.json(interview);
  } catch (err) { next(err); }
}

export async function history(req, res, next) {
  try {
    const interviews = await Interview.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: -1 }).limit(10)
      .select('targetRole company interviewType overallScore categoryScores completedAt');
    res.json({ interviews });
  } catch (err) { next(err); }
}