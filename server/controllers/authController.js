import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Register a new user
export const registerUser = async (req, res) => {
  const { email, password, name } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  const user = new User({
    email,
    password,
    name: name || email.split('@')[0]
  });

  await user.save();

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
};

// @desc    Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmailWithPassword(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  user.lastLogin = new Date();
  await user.save();

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
};

// @desc    Get current user profile
export const getUserProfile = async (req, res) => {
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
};

// @desc    Update user profile
export const updateUserProfile = async (req, res) => {
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
};

// @desc    Logout user
export const logoutUser = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};
