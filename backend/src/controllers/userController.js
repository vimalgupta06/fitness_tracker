import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

// @desc  Get all users (admin only)
// @route GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    sendSuccess(res, { users, count: users.length });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// @desc  Get user by ID
// @route GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, { user });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// @desc  Update current user profile
// @route PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );
    sendSuccess(res, { user }, 'Profile updated');
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// @desc  Get current user's fitness dashboard data
// @route GET /api/users/dashboard
export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('dashboard');
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, { dashboard: user.dashboard });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// @desc  Update current user's fitness dashboard data
// @route PUT /api/users/dashboard
export const updateDashboard = async (req, res) => {
  try {
    const {
      workoutDone,
      workoutGoal,
      food,
      sleepHours,
      heatmapData,
      tasks,
      completedDates,
      steps,
      targetSteps,
      activeMinutes,
      targetActiveMinutes,
      weightKg,
      heightCm,
      restingHeartRate,
      mood,
    } = req.body;

    const normalizedHeatmap = Array.isArray(heatmapData)
      ? heatmapData.slice(0, 28).map((value) => {
          const n = Number(value);
          if (Number.isNaN(n)) return 0;
          return Math.max(0, Math.min(4, Math.round(n)));
        })
      : undefined;

    const normalizedTasks = Array.isArray(tasks)
      ? tasks
          .filter((task) => task && typeof task.label === 'string' && task.label.trim())
          .slice(0, 100)
          .map((task) => ({
            label: task.label.trim(),
            done: Boolean(task.done),
          }))
      : undefined;

    const normalizedCompletedDates = Array.isArray(completedDates)
      ? [...new Set(
          completedDates
            .filter((value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
            .slice(0, 370)
        )]
      : undefined;

    const update = {
      ...(workoutDone !== undefined ? { 'dashboard.workoutDone': Math.max(0, Number(workoutDone) || 0) } : {}),
      ...(workoutGoal !== undefined
        ? { 'dashboard.workoutGoal': Math.max(1, Number(workoutGoal) || 1) }
        : {}),
      ...(sleepHours !== undefined ? { 'dashboard.sleepHours': Math.max(0, Number(sleepHours) || 0) } : {}),
      ...(food
        ? {
            'dashboard.food.calories': Math.max(0, Number(food.calories) || 0),
            'dashboard.food.target': Math.max(0, Number(food.target) || 0),
            'dashboard.food.protein': Math.max(0, Number(food.protein) || 0),
            'dashboard.food.water': Math.max(0, Number(food.water) || 0),
          }
        : {}),
      ...(normalizedHeatmap ? { 'dashboard.heatmapData': normalizedHeatmap } : {}),
      ...(normalizedTasks ? { 'dashboard.tasks': normalizedTasks } : {}),
      ...(normalizedCompletedDates ? { 'dashboard.completedDates': normalizedCompletedDates } : {}),
      ...(steps !== undefined ? { 'dashboard.steps': Math.max(0, Number(steps) || 0) } : {}),
      ...(targetSteps !== undefined ? { 'dashboard.targetSteps': Math.max(1, Number(targetSteps) || 1) } : {}),
      ...(activeMinutes !== undefined ? { 'dashboard.activeMinutes': Math.max(0, Number(activeMinutes) || 0) } : {}),
      ...(targetActiveMinutes !== undefined
        ? { 'dashboard.targetActiveMinutes': Math.max(1, Number(targetActiveMinutes) || 1) }
        : {}),
      ...(weightKg !== undefined ? { 'dashboard.weightKg': Math.max(0, Number(weightKg) || 0) } : {}),
      ...(heightCm !== undefined ? { 'dashboard.heightCm': Math.max(0, Number(heightCm) || 0) } : {}),
      ...(restingHeartRate !== undefined
        ? { 'dashboard.restingHeartRate': Math.max(0, Number(restingHeartRate) || 0) }
        : {}),
      ...(mood !== undefined ? { 'dashboard.mood': String(mood).slice(0, 40) } : {}),
    };

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true }).select(
      'dashboard'
    );

    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, { dashboard: user.dashboard }, 'Dashboard updated');
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// @desc  Delete user (admin only)
// @route DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, {}, 'User deleted');
  } catch (err) {
    sendError(res, err.message, 500);
  }
};
