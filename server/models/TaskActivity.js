import mongoose from "mongoose"

const taskActivitySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "completed",
        "reopened",
        "shared",
        "unshared",
        "assigned",
        "unassigned",
        "commented",
        "deleted",
        "reordered",
      ],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
taskActivitySchema.index({ taskId: 1, createdAt: -1 })
taskActivitySchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model("TaskActivity", taskActivitySchema)
