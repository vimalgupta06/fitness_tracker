import User from '../models/User.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';

// @desc  Register a new user
// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 'Email already registered', 400);

    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, { user, accessToken, refreshToken }, 'Registered successfully', 201);
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// @desc  Login user
// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }
    if (!user.isActive) return sendError(res, 'Account is deactivated', 401);

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, { user, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// @desc  Refresh access token
// @route POST /api/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 'Refresh token required', 400);

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user._id);
    user.refreshToken = newRefresh;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, { accessToken, refreshToken: newRefresh }, 'Token refreshed');
  } catch (err) {
    sendError(res, 'Invalid or expired refresh token', 401);
  }
};

// @desc  Logout user
// @route POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    sendSuccess(res, {}, 'Logged out successfully');
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// @desc  Get current user
// @route GET /api/auth/me
export const getMe = async (req, res) => {
  sendSuccess(res, { user: req.user }, 'User fetched');
};
