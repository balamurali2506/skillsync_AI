import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:    { type: String, required: true },
  provider: { type: String, default: 'Coursera' },
  skill:    { type: String, default: '' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  status:   { type: String, enum: ['active', 'completed'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);