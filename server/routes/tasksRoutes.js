import express from "express"
import { authenticate } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  taskQueryValidation,
  handleValidationErrors,
} from "../middleware/validation.js"

import {
  getAllTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  exportTasksCSV,
  exportTasksPDF,
  reorderTasks,
  shareTask,
  unshareTask,
  getTaskActivity,
  addTaskComment,
} from "../controllers/taskController.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// @route   GET /api/tasks
router.get("/", taskQueryValidation, handleValidationErrors, asyncHandler(getAllTasks))

// @route   GET /api/tasks/stats
router.get("/stats", asyncHandler(getTaskStats))

// @route   GET /api/tasks/export/csv
router.get("/export/csv", taskQueryValidation, handleValidationErrors, asyncHandler(exportTasksCSV))

// @route   GET /api/tasks/export/pdf
router.get("/export/pdf", taskQueryValidation, handleValidationErrors, asyncHandler(exportTasksPDF))

// @route   POST /api/tasks/reorder
router.post("/reorder", asyncHandler(reorderTasks))

// @route   GET /api/tasks/:id
router.get("/:id", taskIdValidation, handleValidationErrors, asyncHandler(getTaskById))

// @route   GET /api/tasks/:id/activity
router.get("/:id/activity", taskIdValidation, handleValidationErrors, asyncHandler(getTaskActivity))

// @route   POST /api/tasks
router.post("/", createTaskValidation, handleValidationErrors, asyncHandler(createTask))

// @route   PUT /api/tasks/:id
router.put("/:id", updateTaskValidation, handleValidationErrors, asyncHandler(updateTask))

// @route   POST /api/tasks/:id/share
router.post("/:id/share", taskIdValidation, handleValidationErrors, asyncHandler(shareTask))

// @route   POST /api/tasks/:id/unshare
router.post("/:id/unshare", taskIdValidation, handleValidationErrors, asyncHandler(unshareTask))

// @route   POST /api/tasks/:id/comment
router.post("/:id/comment", taskIdValidation, handleValidationErrors, asyncHandler(addTaskComment))

// @route   PATCH /api/tasks/:id/toggle
router.patch("/:id/toggle", taskIdValidation, handleValidationErrors, asyncHandler(toggleTaskStatus))

// @route   DELETE /api/tasks/:id
router.delete("/:id", taskIdValidation, handleValidationErrors, asyncHandler(deleteTask))

export default router
