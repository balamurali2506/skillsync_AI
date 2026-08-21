import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import problemsRoutes from './routes/problems.js';
import resumesRoutes from './routes/resumes.js';
import chatRoutes from './routes/chat.js';
import interviewsRoutes from './routes/interviews.js';
import { errorHandler } from './middleware/errorHandler.js';
import dashboardRoutes from './routes/dashboard.js';
import skillsRoutes from './routes/skills.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Bulletproof CORS for Vercel
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://skillsyncai-henna.vercel.app', // Hardcoded fallback for your live frontend
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean); // Removes undefined/null values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      // Temporarily allow all in development, or strictly block in production
      callback(null, true); 
    }
  },
  credentials: true,
}));

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { error: 'Too many attempts, please try again later' },
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/interviews', interviewsRoutes);  // adaptive voice interview
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);