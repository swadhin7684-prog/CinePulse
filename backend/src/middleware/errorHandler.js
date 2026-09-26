import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Caught]', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token. Please log in again.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token has expired. Please log in again.';
    statusCode = 401;
  }

  // Firestore / Google Cloud GRPC error codes
  if (err.code === 5 || err.code === 'NOT_FOUND') {
    message = 'Requested resource not found in database.';
    statusCode = 404;
  }

  if (err.code === 6 || err.code === 'ALREADY_EXISTS') {
    message = 'Resource already exists in database.';
    statusCode = 400;
  }

  return sendError(res, message, statusCode);
};
