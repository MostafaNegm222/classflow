// Central error handler: controllers forward failures here with next(err).
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message: err.message || "Something went wrong" });
}

module.exports = errorHandler;
