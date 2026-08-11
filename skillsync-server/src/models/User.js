import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, 'Name is required'], trim: true },
    email:       {
      type: String, required: [true, 'Email is required'], unique: true,
      lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password:    { type: String, required: [true, 'Password is required'], minlength: 6 },
    role:        { type: String, enum: ['student', 'admin'], default: 'student' },

    // ── NEW: Profile fields for AI personalization ─────────
    targetRole: {
      type: String,
      enum: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Designer', 'DevOps', 'Other'],
    },
    university:      { type: String, trim: true },
    graduationYear:  { type: Number, min: 2020, max: 2035 },
    experienceLevel: {
      type: String,
      enum: ['Fresher', 'Intern', '1-2 years', '3-5 years', '5+ years'],
    },
    currentSkills:   [{ type: String, trim: true }],   // for skill gap + course recs
    // ──────────────────────────────────────────────────────

    streak:      { type: Number, default: 0 },
    lastActivity: Date,
  },
  { timestamps: true }
);

// ✅ NEW CODE
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);