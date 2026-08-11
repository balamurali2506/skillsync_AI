export function errorHandler(err, req, res, next) {
  console.error('❌', err);

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ errors: messages });
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}