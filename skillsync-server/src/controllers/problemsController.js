import { body, validationResult } from 'express-validator';
import CodingProblem from '../models/CodingProblem.js';

export const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']),
];

export async function list(req, res, next) {
  try {
    // Only the logged-in user's problems — enforced by JWT middleware upstream
    const problems = await CodingProblem.find({ user: req.user._id })
      .sort({ solvedAt: -1 })
      .limit(50);
    res.json(problems);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const problem = await CodingProblem.create({
      user: req.user._id,
      title: req.body.title,
      difficulty: req.body.difficulty,
      platform: req.body.platform || 'LeetCode',
      notes: req.body.notes,
    });

    res.status(201).json(problem);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    // Ensure user can only delete their own problem
    const result = await CodingProblem.deleteOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}