import express from 'express';
import User from '../models/User.js';
import { authenticate, generateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  registerValidation, 
  loginValidation, 
  handleValidationErrors 
} from '../middleware/validation.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  registerValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name: name || email.split('@')[0] // Use email prefix as default name
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        token
      }
    });
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  loginValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  })
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  })
);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          updatedAt: user.updatedAt
        }
      }
    });
  })
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout',
  authenticate,
  (req, res) => {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
);

export default router;