import { sendError } from '../utils/response.js';

export const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missing = [];
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return sendError(res, `Missing required field(s): ${missing.join(', ')}`, 400);
    }

    next();
  };
};
