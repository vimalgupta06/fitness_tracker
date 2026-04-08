import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive', 401);
    }
    req.user = user;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(res, 'You do not have permission to perform this action', 403);
  }
  next();
};
