import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          return !value || value >= new Date();
        },
        message: 'Due date cannot be in the past',
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters'],
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // Notifications
    notificationSent: {
      type: String,
      enum: ['tomorrow', 'today'],
      default: null,
    },
    lastOverdueNotification: {
      type: Date,
      default: null,
    },

    // Drag and drop ordering
    position: {
      type: Number,
      default: 0,
    },

    // Task sharing
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        permission: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],

    // Task assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function () {
  return (
    this.dueDate &&
    this.dueDate < new Date() &&
    this.status === 'pending'
  );
});

// Middleware to auto-update completedAt
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status === 'pending') {
      this.completedAt = null;
    }
  }
  next();
});

// Indexes
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ userId: 1, position: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ 'sharedWith.userId': 1 });
taskSchema.index({ assignedTo: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
