export function sendSuccess(res, statusCode, data) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendFailure(res, statusCode, code, message) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
