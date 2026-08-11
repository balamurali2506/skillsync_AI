import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileName: { type: String, required: true },
  atsScore: { type: Number, min: 0, max: 100 },
  
  // Core breakdown metrics
  breakdown: {
    keywords: Number, formatting: Number, impact: Number,
    experience: Number, skills: Number, projects: Number, education: Number
  },
  
  extractedSkills: [String],
  feedback: [String],
  rawText: String, 
  
  // The massive rich JSON object from your Groq prompt
  analysis: { type: mongoose.Schema.Types.Mixed } 
}, { timestamps: true });

export default mongoose.model('Resume', resumeSchema);