function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً.';
  let details = null;

  // Enhanced error logging for production debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  console.error(`Message: ${err.message}`);
  if (err.code) console.error(`Code: ${err.code}`);
  if (err.meta) console.error(`Meta:`, err.meta);
  console.error(`Stack:`, err.stack);

  // Handle Prisma Specific Errors
  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'هذا الكود أو الاسم مستخدم من قبل، يرجى كتابة قيمة أخرى غير مكررة.';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'هذا العنصر غير موجود، ربما تم حذفه مسبقاً.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
