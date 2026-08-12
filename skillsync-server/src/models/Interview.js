import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  technicalAccuracy: Number, relevance: Number, completeness: Number,
  communication: Number, confidence: Number, problemSolving: Number,
  depth: Number, overall: Number,
}, { _id: false });

const questionSchema = new mongoose.Schema({
  question: String, questionType: String, difficulty: Number, speakText: String,
  answer: String, answerDuration: Number, fillerWords: [String],
  evaluation: evaluationSchema,
  wentWell: [String], improve: [String],
  idealStructure: String, recommendedAnswer: String,
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetRole: String,
  interviewType: { type: String, default: 'Mixed' },
  difficulty: { type: String, default: 'Medium' },
  durationMinutes: { type: Number, default: 15 },
  questionCount: { type: Number, default: 6 },
  jobDescription: String,
  focus: String,
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  status: { type: String, enum: ['active', 'completed', 'aborted'], default: 'active' },
  startedAt: Date, completedAt: Date,
  currentDifficulty: { type: Number, default: 3 },
  questions: [questionSchema],
  overallScore: Number,
  readinessLevel: String,
  categoryScores: {
    technical: Number, communication: Number, confidence: Number,
    problemSolving: Number, behavioral: Number, roleKnowledge: Number,
  },
  communicationAnalysis: {
    clarity: Number, conciseness: Number, confidence: Number,
    fillerWords: [String], averageAnswerDuration: Number,
  },
  strengths: [String], weaknesses: [String],
  improvementPlan: [{ priority: String, problem: String, whyItMatters: String, howToImprove: String, example: String }],
  coachingSummary: String,
  practicePlan: [String],
}, { timestamps: true });

export default mongoose.model('Interview', interviewSchema);