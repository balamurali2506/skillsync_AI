import mongoose from 'mongoose';

const codingActivitySchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:      { type: String, required: true, trim: true },
  platform:   { type: String, enum: ['LeetCode', 'CodeChef', 'HackerRank', 'GeeksforGeeks', 'Other'], default: 'LeetCode' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  topic:      { type: String, trim: true, default: 'General' },
  minutes:    { type: Number, min: 1, max: 600, default: 30 },
  solvedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('CodingActivity', codingActivitySchema);