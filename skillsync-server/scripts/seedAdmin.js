import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { connectDB } from '../src/config/db.js';

async function seed() {
  await connectDB();

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    // Promote to admin if they exist but aren't already
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`👑 Promoted existing user ${ADMIN_EMAIL} to admin.`);
    } else {
      console.log(`✅ Admin ${ADMIN_EMAIL} already exists.`);
    }
  } else {
    const admin = await User.create({
      name: ADMIN_NAME || 'SkillSync Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`🎉 Created admin: ${admin.email} (id: ${admin._id})`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});