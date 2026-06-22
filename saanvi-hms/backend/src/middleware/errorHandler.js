// Catches anything thrown or passed to next(err) in route handlers
// and returns a consistent JSON error shape instead of an HTML stack trace.
function errorHandler(err, req, res, next) {
  console.error(err);

  // Sequelize validation errors (e.g. invalid email, missing required field)
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed', errors: messages });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Something went wrong on the server',
  });
}

// Catches requests to routes that don't exist.
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
