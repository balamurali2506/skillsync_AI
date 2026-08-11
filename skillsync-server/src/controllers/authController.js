import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('targetRole').optional().isString(),
  body('university').optional().trim().isString(),
  body('graduationYear').optional().isInt({ min: 2020, max: 2035 }),
  body('experienceLevel').optional().isString(),
  body('currentSkills').optional().isArray(),
];

// 👇 THIS IS THE EXPORT NODE IS LOOKING FOR
export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

export async function register(req, res, next) {
  try {
    handleValidation(req, res, async () => {
      const {
        name, email, password,
        targetRole, university, graduationYear, experienceLevel, currentSkills,
      } = req.body;

      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const user = await User.create({
        name, email, password,
        targetRole, university, graduationYear, experienceLevel,
        currentSkills: currentSkills || [],
      });

      const token = signToken({ id: user._id, role: user.role });

      res.status(201).json({
        token,
        user: {
          id: user._id, name: user.name, email: user.email, role: user.role,
          targetRole: user.targetRole, university: user.university,
          graduationYear: user.graduationYear, experienceLevel: user.experienceLevel,
        },
      });
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    handleValidation(req, res, async () => {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = signToken({ id: user._id, role: user.role });
      res.json({
        token,
        user: {
          id: user._id, name: user.name, email: user.email, role: user.role,
          targetRole: user.targetRole, university: user.university,
          graduationYear: user.graduationYear, experienceLevel: user.experienceLevel,
        },
      });
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}