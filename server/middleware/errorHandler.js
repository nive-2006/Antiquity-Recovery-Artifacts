const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    errors: err.errors || null
  });
};

module.exports = errorHandler;
