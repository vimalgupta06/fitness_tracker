import { Router } from 'express';
import {
	getAllUsers,
	getUserById,
	updateProfile,
	deleteUser,
	getDashboard,
	updateDashboard,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.use(protect); // All routes below require auth

router.get('/dashboard', getDashboard);
router.put('/dashboard', updateDashboard);
router.get('/', restrictTo('admin'), getAllUsers);
router.get('/:id', getUserById);
router.put('/profile', updateProfile);
router.delete('/:id', restrictTo('admin'), deleteUser);

export default router;
