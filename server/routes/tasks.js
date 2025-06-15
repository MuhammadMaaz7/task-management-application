import express from 'express';
import Task from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  taskQueryValidation,
  handleValidationErrors
} from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/tasks
// @desc    Get all tasks for authenticated user
// @access  Private
router.get('/',
  taskQueryValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { status, priority, page = 1, limit = 50, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query = { userId: req.user.id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const [tasks, totalTasks] = await Promise.all([
      Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalTasks / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTasks,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  })
);

// @route   GET /api/tasks/stats
// @desc    Get task statistics for authenticated user
// @access  Private
router.get('/stats',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const stats = await Task.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'pending'] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$dueDate', null] }
                  ]
                },
                1,
                0
              ]
            }
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          mediumPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
          },
          lowPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0
    };

    res.json({
      success: true,
      data: { stats: result }
    });
  })
);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id',
  taskIdValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  })
);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/',
  createTaskValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, tags } = req.body;

    const task = new Task({
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      userId: req.user.id
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  })
);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id',
  updateTaskValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { title, description, status, priority, dueDate, tags } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  })
);

// @route   PATCH /api/tasks/:id/toggle
// @desc    Toggle task completion status
// @access  Private
router.patch('/:id/toggle',
  taskIdValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.status = task.status === 'completed' ? 'pending' : 'completed';
    await task.save();

    res.json({
      success: true,
      message: `Task marked as ${task.status}`,
      data: { task }
    });
  })
);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id',
  taskIdValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  })
);

export default router;