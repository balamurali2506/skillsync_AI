import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  speaker: { type: String, enum: ['ai', 'candidate'], required: true },
  text: String,
  timestamp: { type: Date, default: Date.now },
  topic: String,
  action: String, // e.g., 'FOLLOW_UP', 'NEXT_QUESTION'
}, { _id: false });

const evaluationSchema = new mongoose.Schema({
  technical: Number, communication: Number, confidence: Number,
  problemSolving: Number, relevance: Number, depth: Number, overall: Number
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetRole: String,
  company: String,
  interviewType: { type: String, default: 'Mixed' }, // Technical, Behavioral, HR, System Design, Mixed
  mode: { type: String, default: 'MOCK_INTERVIEW' }, // PRACTICE, COACHING, MOCK_INTERVIEW, ASSESSMENT
  difficulty: { type: String, default: 'Intermediate' },
  durationMinutes: { type: Number, default: 15 },
  jobDescription: String,
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  resumeContext: String, // Summarized resume text to save tokens
  
  status: { type: String, enum: ['setup', 'active', 'completed', 'aborted'], default: 'setup' },
  startedAt: Date,
  completedAt: Date,
  
  // Conversation & State
  messages: [messageSchema],
  currentTopic: String,
  topicsCovered: [String],
  turnCount: { type: Number, default: 0 },
  
  // Final Scores (Matches Dashboard/SkillGap expectations)
  overallScore: Number,
  categoryScores: {
    technical: Number, communication: Number, confidence: Number,
    problemSolving: Number, behavioral: Number, roleKnowledge: Number
  },
  strengths: [String],
  weaknesses: [String],
  skillGaps: [String], // Fed back to Skill Gap engine
  recommendations: [String],
  aiCoachSummary: String,
  
  // Transcript for review
  transcript: [{ question: String, answer: String, evaluation: evaluationSchema, feedback: String, improvedAnswer: String }]
}, { timestamps: true });

export default mongoose.model('Interview', interviewSchema);