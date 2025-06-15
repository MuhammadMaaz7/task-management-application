import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  registerValidation,
  loginValidation,
  handleValidationErrors
} from '../middleware/validation.js';

import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser
} from '../controllers/authController.js';

const router = express.Router();

// @route   POST /api/auth/register
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  asyncHandler(registerUser)
);

// @route   POST /api/auth/login
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  asyncHandler(loginUser)
);

// @route   GET /api/auth/profile
router.get('/profile', authenticate, asyncHandler(getUserProfile));

// @route   PUT /api/auth/profile
router.put('/profile', authenticate, asyncHandler(updateUserProfile));

// @route   POST /api/auth/logout
router.post('/logout', authenticate, logoutUser);

export default router;