/**
 * Standard API Response Utilities
 */

export const sendSuccess = (res, data = {}, statusCode = 200, meta = null) => {
  const responsePayload = {
    success: true,
    data,
  };
  if (meta) {
    responsePayload.meta = meta;
  }
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const responsePayload = {
    success: false,
    message,
  };
  if (errors) {
    responsePayload.errors = errors;
  }
  return res.status(statusCode).json(responsePayload);
};
