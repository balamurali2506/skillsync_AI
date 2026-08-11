import mongoose from 'mongoose';

const codingProblemSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:      { type: String, required: [true, 'Problem title is required'], trim: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    platform:   { type: String, default: 'LeetCode', trim: true },
    notes:      String,
    solvedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('CodingProblem', codingProblemSchema);