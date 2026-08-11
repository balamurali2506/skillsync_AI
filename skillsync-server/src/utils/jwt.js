import jwt from 'jsonwebtoken';

export function signToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('❌ FATAL: JWT_SECRET is missing from your .env file!');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('❌ FATAL: JWT_SECRET is missing from your .env file!');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
}