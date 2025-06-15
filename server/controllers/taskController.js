import Task from "../models/Task.js"
import TaskActivity from "../models/TaskActivity.js"
import User from "../models/User.js"
import PDFDocument from "pdfkit"
import mongoose from "mongoose"

// Helper function to log activity
const logActivity = async (taskId, userId, action, details = {}, comment = null) => {
  try {
    await TaskActivity.create({
      taskId,
      userId,
      action,
      details,
      comment,
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}

// FIXED: Helper function to add permission context to tasks
const addPermissionContext = (tasks, currentUserId) => {
  if (!Array.isArray(tasks)) {
    tasks = [tasks]
  }

  console.log("addPermissionContext called with currentUserId:", currentUserId)

  return tasks.map((task) => {
    const taskObj = task.toObject ? task.toObject() : task

    // Handle userId comparison - check if it's populated or just an ObjectId
    let taskOwnerId
    if (taskObj.userId && typeof taskObj.userId === "object" && taskObj.userId._id) {
      // userId is populated
      taskOwnerId = taskObj.userId._id.toString()
    } else if (taskObj.userId) {
      // userId is just an ObjectId
      taskOwnerId = taskObj.userId.toString()
    }

    console.log("Permission Debug for task:", {
      taskId: taskObj._id?.toString(),
      taskTitle: taskObj.title,
      currentUserId: currentUserId,
      taskOwnerId: taskOwnerId,
      userIdType: typeof taskObj.userId,
      userIdValue: taskObj.userId,
      isEqual: taskOwnerId === currentUserId,
    })

    // FIXED: Ensure proper string comparison
    const isOwner = taskOwnerId === currentUserId.toString()
    let userPermission = "none"

    if (isOwner) {
      userPermission = "owner"
      console.log("✅ User is OWNER of task:", taskObj.title)
    } else {
      // Check if user is in sharedWith array
      const shareInfo = taskObj.sharedWith?.find((share) => {
        let shareUserId
        if (share.userId && typeof share.userId === "object" && share.userId._id) {
          shareUserId = share.userId._id.toString()
        } else if (share.userId) {
          shareUserId = share.userId.toString()
        }
        return shareUserId === currentUserId.toString()
      })
      if (shareInfo) {
        userPermission = shareInfo.permission
        console.log("✅ User has shared permission:", shareInfo.permission)
      } else {
        console.log("❌ User has no permission for task:", taskObj.title)
      }
    }

    console.log("Final permissions for task:", {
      taskId: taskObj._id?.toString(),
      taskTitle: taskObj.title,
      isOwner: isOwner,
      userPermission: userPermission,
    })

    return {
      ...taskObj,
      isOwner,
      userPermission,
    }
  })
}

// @desc    Get all tasks
export const getAllTasks = async (req, res) => {
  const { status, priority, page = 1, limit = 50, search, sortBy = "position", sortOrder = "asc" } = req.query

  try {
    console.log("getAllTasks called for user:", req.user.id)

    // Build query for owned tasks
    const ownedQuery = { userId: new mongoose.Types.ObjectId(req.user.id) }
    if (status) ownedQuery.status = status
    if (priority) ownedQuery.priority = priority
    if (search) {
      ownedQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    // Build query for shared tasks
    const sharedQuery = {
      "sharedWith.userId": new mongoose.Types.ObjectId(req.user.id),
      userId: { $ne: new mongoose.Types.ObjectId(req.user.id) }, // Exclude owned tasks
    }
    if (status) sharedQuery.status = status
    if (priority) sharedQuery.priority = priority
    if (search) {
      sharedQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    const sort = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get both owned and shared tasks with proper population
    const [ownedTasks, sharedTasks, totalOwned, totalShared] = await Promise.all([
      Task.find(ownedQuery)
        .populate("userId", "name email")
        .populate("sharedWith.userId", "name email")
        .populate("sharedWith.sharedBy", "name email")
        .populate("assignedTo", "name email")
        .sort(sort)
        .skip(skip)
        .limit(Number.parseInt(limit)),
      Task.find(sharedQuery)
        .populate("userId", "name email")
        .populate("sharedWith.userId", "name email")
        .populate("sharedWith.sharedBy", "name email")
        .populate("assignedTo", "name email")
        .sort(sort),
      Task.countDocuments(ownedQuery),
      Task.countDocuments(sharedQuery),
    ])

    console.log("Found tasks:", {
      ownedCount: ownedTasks.length,
      sharedCount: sharedTasks.length,
      firstOwnedTask: ownedTasks[0]
        ? {
            id: ownedTasks[0]._id,
            title: ownedTasks[0].title,
            userId: ownedTasks[0].userId,
          }
        : null,
    })

    // Combine and add permission context
    const allTasks = [...ownedTasks, ...sharedTasks]
    const tasksWithPermissions = addPermissionContext(allTasks, req.user.id)

    console.log(
      "Tasks with permissions:",
      tasksWithPermissions.map((t) => ({
        id: t._id,
        title: t.title,
        isOwner: t.isOwner,
        userPermission: t.userPermission,
      })),
    )

    const totalTasks = totalOwned + totalShared
    const totalPages = Math.ceil(totalTasks / Number.parseInt(limit))
    const hasNextPage = Number.parseInt(page) < totalPages
    const hasPrevPage = Number.parseInt(page) > 1

    res.json({
      success: true,
      data: {
        tasks: tasksWithPermissions,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalTasks,
          hasNextPage,
          hasPrevPage,
          limit: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get tasks error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    })
  }
}

// @desc    Get task statistics
export const getTaskStats = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)

  try {
    // Get owned tasks stats
    const ownedStats = await Task.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "pending"] },
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$dueDate", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
          },
          mediumPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] },
          },
          lowPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] },
          },
          shared: {
            $sum: { $cond: [{ $eq: ["$isShared", true] }, 1, 0] },
          },
          assigned: {
            $sum: { $cond: [{ $ne: ["$assignedTo", null] }, 1, 0] },
          },
        },
      },
    ])

    // Get shared tasks count
    const sharedWithMeCount = await Task.countDocuments({
      "sharedWith.userId": userId,
      userId: { $ne: userId },
    })

    const result = ownedStats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      shared: 0,
      assigned: 0,
    }

    // Add shared with me count
    result.sharedWithMe = sharedWithMeCount

    res.json({
      success: true,
      data: { stats: result },
    })
  } catch (error) {
    console.error("Get stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    })
  }
}

// @desc    Get single task
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      $or: [
        { userId: new mongoose.Types.ObjectId(req.user.id) },
        { "sharedWith.userId": new mongoose.Types.ObjectId(req.user.id) },
      ],
      _id: req.params.id,
    })
      .populate("userId", "name email")
      .populate("sharedWith.userId", "name email")
      .populate("assignedTo", "name email")

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    const [taskWithPermissions] = addPermissionContext([task], req.user.id)

    res.json({
      success: true,
      data: { task: taskWithPermissions },
    })
  } catch (error) {
    console.error("Get task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
    })
  }
}

// @desc    Create new task
export const createTask = async (req, res) => {
  const { title, description, priority, dueDate, tags, shareWith } = req.body

  try {
    console.log("Creating task for user:", req.user.id)

    const task = new Task({
      title,
      description,
      priority: priority || "medium",
      dueDate: dueDate || null,
      tags: tags || [],
      userId: new mongoose.Types.ObjectId(req.user.id),
    })

    await task.save()
    console.log("Task created with ID:", task._id, "for user:", task.userId)

    // Handle sharing if provided
    if (shareWith && shareWith.length > 0) {
      const emails = shareWith.map((s) => s.email)
      const users = await User.find({ email: { $in: emails } })

      for (const shareInfo of shareWith) {
        const user = users.find((u) => u.email === shareInfo.email)
        if (user) {
          task.sharedWith.push({
            userId: user._id,
            permission: shareInfo.permission || "view",
            sharedBy: new mongoose.Types.ObjectId(req.user.id),
            sharedAt: new Date(),
          })
        }
      }

      if (task.sharedWith.length > 0) {
        task.isShared = true
        await task.save()

        // Log sharing activity with correct data structure
        await logActivity(task._id, req.user.id, "shared", {
          sharedWith: shareWith.map((s) => ({
            email: s.email,
            permission: s.permission || "view",
          })),
          count: shareWith.length,
        })
      }
    }

    // Populate the task before sending response
    await task.populate([
      { path: "userId", select: "name email" },
      { path: "sharedWith.userId", select: "name email" },
      { path: "sharedWith.sharedBy", select: "name email" },
    ])

    console.log("Task after population:", {
      id: task._id,
      title: task.title,
      userId: task.userId,
      userIdType: typeof task.userId,
    })

    // Add permission context to the created task
    const [taskWithPermissions] = addPermissionContext([task], req.user.id)

    console.log("Task with permissions:", {
      id: taskWithPermissions._id,
      title: taskWithPermissions.title,
      isOwner: taskWithPermissions.isOwner,
      userPermission: taskWithPermissions.userPermission,
    })

    // Log creation activity
    await logActivity(task._id, req.user.id, "created", {
      title: task.title,
      priority: task.priority,
    })

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { task: taskWithPermissions },
    })
  } catch (error) {
    console.error("Create task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create task",
    })
  }
}

// @desc    Update task
export const updateTask = async (req, res) => {
  const { title, description, status, priority, dueDate, tags } = req.body

  try {
    console.log("🔄 Update task called for task:", req.params.id, "by user:", req.user.id)
    console.log("🔄 User ID type:", typeof req.user.id, "Value:", req.user.id)

    const task = await Task.findOne({
      $or: [
        { userId: new mongoose.Types.ObjectId(req.user.id) },
        { "sharedWith.userId": new mongoose.Types.ObjectId(req.user.id) },
      ],
      _id: req.params.id,
    })

    if (!task) {
      console.log("❌ Task not found for update")
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    console.log("📋 Task found for update:", {
      taskId: task._id,
      taskTitle: task.title,
      taskUserId: task.userId,
      taskUserIdType: typeof task.userId,
      currentUserId: req.user.id,
      currentUserIdType: typeof req.user.id,
    })

    // FIXED: Check permissions with proper string conversion
    const taskOwnerIdString = task.userId.toString()
    const currentUserIdString = req.user.id.toString()
    const isOwner = taskOwnerIdString === currentUserIdString

    console.log("👑 Owner check for update:", {
      taskOwnerIdString: taskOwnerIdString,
      currentUserIdString: currentUserIdString,
      isOwner: isOwner,
      comparison: `"${taskOwnerIdString}" === "${currentUserIdString}"`,
    })

    const shareInfo = task.sharedWith?.find((share) => {
      const shareUserIdString = share.userId.toString()
      const matches = shareUserIdString === currentUserIdString
      console.log("🔍 Checking share:", {
        shareUserIdString: shareUserIdString,
        currentUserIdString: currentUserIdString,
        matches: matches,
        permission: share.permission,
      })
      return matches
    })

    console.log("🤝 Share info check for update:", {
      sharedWith: task.sharedWith?.map((s) => ({
        userId: s.userId.toString(),
        permission: s.permission,
      })),
      shareInfo: shareInfo,
    })

    const canEdit = isOwner || shareInfo?.permission === "edit"
    console.log("✏️ Permission result for update:", {
      isOwner: isOwner,
      sharePermission: shareInfo?.permission,
      canEdit: canEdit,
    })

    if (!canEdit) {
      console.log("🚫 Permission denied for update")
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit this task",
      })
    }

    console.log("✅ Permission granted for update, proceeding...")

    // Prevent editing completed tasks (except for status changes via toggle)
    if (task.status === "completed" && !req.body.allowCompletedEdit) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit completed tasks. Please mark as pending first if you need to make changes.",
      })
    }

    const changes = {}
    if (title !== undefined && title !== task.title) {
      changes.title = { from: task.title, to: title }
      task.title = title
    }
    if (description !== undefined && description !== task.description) {
      changes.description = { from: task.description, to: description }
      task.description = description
    }
    if (status !== undefined && status !== task.status) {
      changes.status = { from: task.status, to: status }
      task.status = status
      // Set completion timestamp when marking as completed
      if (status === "completed" && task.status !== "completed") {
        task.completedAt = new Date()
      } else if (status === "pending") {
        task.completedAt = null
      }
    }
    if (priority !== undefined && priority !== task.priority) {
      changes.priority = { from: task.priority, to: priority }
      task.priority = priority
    }
    if (dueDate !== undefined && dueDate !== task.dueDate) {
      changes.dueDate = { from: task.dueDate, to: dueDate }
      task.dueDate = dueDate
    }
    if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(task.tags)) {
      changes.tags = { from: task.tags, to: tags }
      task.tags = tags
    }

    await task.save()

    // Populate the task
    await task.populate([
      { path: "userId", select: "name email" },
      { path: "sharedWith.userId", select: "name email" },
      { path: "sharedWith.sharedBy", select: "name email" },
    ])

    // Add permission context
    const [taskWithPermissions] = addPermissionContext([task], req.user.id)

    // Log update activity if there were changes
    if (Object.keys(changes).length > 0) {
      await logActivity(task._id, req.user.id, "updated", changes)
    }

    console.log("🎉 Task update completed successfully")

    res.json({
      success: true,
      message: "Task updated successfully",
      data: { task: taskWithPermissions },
    })
  } catch (error) {
    console.error("❌ Update task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update task",
    })
  }
}

// @desc    Toggle task status
export const toggleTaskStatus = async (req, res) => {
  try {
    console.log("🔄 Toggle task status called for task:", req.params.id, "by user:", req.user.id)
    console.log("🔄 User ID type:", typeof req.user.id, "Value:", req.user.id)

    const task = await Task.findOne({
      $or: [
        { userId: new mongoose.Types.ObjectId(req.user.id) },
        { "sharedWith.userId": new mongoose.Types.ObjectId(req.user.id) },
      ],
      _id: req.params.id,
    })

    if (!task) {
      console.log("❌ Task not found for toggle")
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    console.log("📋 Task found for toggle:", {
      taskId: task._id,
      taskTitle: task.title,
      taskUserId: task.userId,
      taskUserIdType: typeof task.userId,
      currentUserId: req.user.id,
      currentUserIdType: typeof req.user.id,
    })

    // FIXED: Check permissions with proper string conversion
    const taskOwnerIdString = task.userId.toString()
    const currentUserIdString = req.user.id.toString()
    const isOwner = taskOwnerIdString === currentUserIdString

    console.log("👑 Owner check for toggle:", {
      taskOwnerIdString: taskOwnerIdString,
      currentUserIdString: currentUserIdString,
      isOwner: isOwner,
      comparison: `"${taskOwnerIdString}" === "${currentUserIdString}"`,
    })

    const shareInfo = task.sharedWith?.find((share) => {
      const shareUserIdString = share.userId.toString()
      const matches = shareUserIdString === currentUserIdString
      console.log("🔍 Checking share for toggle:", {
        shareUserIdString: shareUserIdString,
        currentUserIdString: currentUserIdString,
        matches: matches,
        permission: share.permission,
      })
      return matches
    })

    console.log("🤝 Share info check for toggle:", {
      sharedWith: task.sharedWith?.map((s) => ({
        userId: s.userId.toString(),
        permission: s.permission,
      })),
      shareInfo: shareInfo,
    })

    const canEdit = isOwner || shareInfo?.permission === "edit"
    console.log("✏️ Permission result for toggle:", {
      isOwner: isOwner,
      sharePermission: shareInfo?.permission,
      canEdit: canEdit,
    })

    if (!canEdit) {
      console.log("🚫 Permission denied for toggle")
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit this task",
      })
    }

    console.log("✅ Permission granted for toggle, proceeding...")

    const previousStatus = task.status
    task.status = task.status === "completed" ? "pending" : "completed"

    // Set completion timestamp
    if (task.status === "completed" && previousStatus !== "completed") {
      task.completedAt = new Date()
    } else if (task.status === "pending") {
      task.completedAt = null
    }

    await task.save()

    // Populate the task
    await task.populate([
      { path: "userId", select: "name email" },
      { path: "sharedWith.userId", select: "name email" },
      { path: "sharedWith.sharedBy", select: "name email" },
    ])

    // Add permission context
    const [taskWithPermissions] = addPermissionContext([task], req.user.id)

    // Log activity
    await logActivity(task._id, req.user.id, task.status === "completed" ? "completed" : "reopened", {
      from: previousStatus,
      to: task.status,
    })

    console.log("🎉 Task toggle completed successfully")

    res.json({
      success: true,
      message: `Task marked as ${task.status}`,
      data: { task: taskWithPermissions },
    })
  } catch (error) {
    console.error("❌ Toggle task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to toggle task status",
    })
  }
}

// @desc    Delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id), // Only owner can delete
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to delete it",
      })
    }

    await Task.findByIdAndDelete(req.params.id)

    // Log deletion activity
    await logActivity(task._id, req.user.id, "deleted", {
      title: task.title,
    })

    res.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error("Delete task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    })
  }
}

// @desc    Export tasks as CSV
export const exportTasksCSV = async (req, res) => {
  const { status, priority, search } = req.query

  try {
    const query = { userId: new mongoose.Types.ObjectId(req.user.id) }
    if (status) query.status = status
    if (priority) query.priority = priority
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean()

    // Generate CSV content
    const csvHeaders = ["Title", "Description", "Status", "Priority", "Due Date", "Tags", "Created At", "Completed At"]

    const csvRows = tasks.map((task) => [
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || "").replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      `"${(task.tags || []).join(", ")}"`,
      new Date(task.createdAt).toISOString(),
      task.completedAt ? new Date(task.completedAt).toISOString() : "",
    ])

    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n")

    res.setHeader("Content-Type", "text/csv")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tasks-export-${new Date().toISOString().split("T")[0]}.csv"`,
    )
    res.send(csvContent)
  } catch (error) {
    console.error("Export CSV error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export tasks",
    })
  }
}

// @desc    Export tasks as PDF
export const exportTasksPDF = async (req, res) => {
  const { status, priority, search } = req.query

  try {
    const query = { userId: new mongoose.Types.ObjectId(req.user.id) }
    if (status) query.status = status
    if (priority) query.priority = priority
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean()

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: "A4" })

    // Set response headers
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tasks-export-${new Date().toISOString().split("T")[0]}.pdf"`,
    )

    // Pipe PDF to response
    doc.pipe(res)

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, options = {}) => {
      const words = text.split(" ")
      let line = ""
      let currentY = y

      for (const word of words) {
        const testLine = line + word + " "
        const testWidth = doc.widthOfString(testLine, options)

        if (testWidth > maxWidth && line !== "") {
          doc.text(line.trim(), x, currentY, options)
          line = word + " "
          currentY += options.lineGap || 15
        } else {
          line = testLine
        }
      }

      if (line.trim() !== "") {
        doc.text(line.trim(), x, currentY, options)
        currentY += options.lineGap || 15
      }

      return currentY
    }

    // PDF Header
    doc.fontSize(24).font("Helvetica-Bold")
    doc.text("Task Management Export", 50, 50)

    doc.fontSize(12).font("Helvetica")
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 85)
    doc.text(`Total Tasks: ${tasks.length}`, 50, 100)

    // Add filters info if any
    const filtersText = []
    if (status) filtersText.push(`Status: ${status}`)
    if (priority) filtersText.push(`Priority: ${priority}`)
    if (search) filtersText.push(`Search: "${search}"`)

    if (filtersText.length > 0) {
      doc.text(`Filters Applied: ${filtersText.join(", ")}`, 50, 115)
    }

    // Draw a line separator
    doc.moveTo(50, 140).lineTo(550, 140).stroke()

    let yPosition = 160

    // Priority colors mapping
    const priorityColors = {
      high: "#EF4444",
      medium: "#F59E0B",
      low: "#10B981",
    }

    const statusColors = {
      completed: "#10B981",
      pending: "#3B82F6",
    }

    // Add tasks
    tasks.forEach((task, index) => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage()
        yPosition = 50
      }

      // Task number and title
      doc.fontSize(14).font("Helvetica-Bold")
      doc.fillColor("#1F2937")
      yPosition = addWrappedText(`${index + 1}. ${task.title}`, 50, yPosition, 500, { lineGap: 18 })
      yPosition += 5

      // Status and Priority badges
      doc.fontSize(10).font("Helvetica")

      // Status badge
      doc.fillColor(statusColors[task.status])
      doc.rect(50, yPosition, 60, 16).fill()
      doc.fillColor("white")
      doc.text(task.status.toUpperCase(), 55, yPosition + 3)

      // Priority badge
      doc.fillColor(priorityColors[task.priority])
      doc.rect(120, yPosition, 80, 16).fill()
      doc.fillColor("white")
      doc.text(`${task.priority.toUpperCase()} PRIORITY`, 125, yPosition + 3)

      yPosition += 25

      // Description
      if (task.description) {
        doc.fontSize(11).font("Helvetica").fillColor("#4B5563")
        yPosition = addWrappedText(task.description, 50, yPosition, 500, { lineGap: 14 })
        yPosition += 5
      }

      // Metadata
      doc.fontSize(9).font("Helvetica").fillColor("#6B7280")

      const metadata = []
      metadata.push(`Created: ${new Date(task.createdAt).toLocaleDateString()}`)

      if (task.dueDate) {
        const isOverdue = new Date(task.dueDate) < new Date() && task.status === "pending"
        metadata.push(`Due: ${new Date(task.dueDate).toLocaleDateString()}${isOverdue ? " (OVERDUE)" : ""}`)
      }

      if (task.completedAt) {
        metadata.push(`Completed: ${new Date(task.completedAt).toLocaleDateString()}`)
      }

      doc.text(metadata.join(" | "), 50, yPosition)
      yPosition += 15

      // Tags
      if (task.tags && task.tags.length > 0) {
        doc.fontSize(9).font("Helvetica").fillColor("#7C3AED")
        doc.text(`Tags: ${task.tags.join(", ")}`, 50, yPosition)
        yPosition += 15
      }

      // Separator line
      doc.strokeColor("#E5E7EB").lineWidth(0.5)
      doc
        .moveTo(50, yPosition + 5)
        .lineTo(550, yPosition + 5)
        .stroke()
      yPosition += 20
    })

    // Add footer
    const pageCount = doc.bufferedPageRange().count
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i)
      doc.fontSize(8).font("Helvetica").fillColor("#9CA3AF")
      doc.text(`Page ${i + 1} of ${pageCount} - Task Management System`, 50, doc.page.height - 50, {
        align: "center",
        width: doc.page.width - 100,
      })
    }

    // Finalize PDF
    doc.end()
  } catch (error) {
    console.error("Export PDF error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export tasks",
    })
  }
}

// @desc    Reorder tasks
export const reorderTasks = async (req, res) => {
  const { taskIds } = req.body // Array of task IDs in new order
  const userId = new mongoose.Types.ObjectId(req.user.id)

  try {
    // Verify all tasks belong to user or are shared with edit permission
    const tasks = await Task.find({
      _id: { $in: taskIds },
      userId: userId, // Only owner can reorder
    })

    if (tasks.length !== taskIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some tasks not found or you don't have permission",
      })
    }

    // Update positions
    const updatePromises = taskIds.map((taskId, index) =>
      Task.findByIdAndUpdate(taskId, { position: index }, { new: true }),
    )

    await Promise.all(updatePromises)

    // Log activity for reordering
    if (tasks.length > 0) {
      await logActivity(tasks[0]._id, req.user.id, "reordered", {
        taskCount: taskIds.length,
      })
    }

    res.json({
      success: true,
      message: "Tasks reordered successfully",
    })
  } catch (error) {
    console.error("Reorder error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to reorder tasks",
    })
  }
}

// @desc    Share task with users
export const shareTask = async (req, res) => {
  const { userEmails, permission = "view" } = req.body
  const userId = new mongoose.Types.ObjectId(req.user.id)

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: userId, // Only owner can share
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to share it",
      })
    }

    // Find users by email
    const users = await User.find({ email: { $in: userEmails } })
    const foundEmails = users.map((user) => user.email)
    const notFoundEmails = userEmails.filter((email) => !foundEmails.includes(email))

    if (notFoundEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Users not found: ${notFoundEmails.join(", ")}`,
      })
    }

    // Add users to shared list (avoid duplicates)
    const newShares = []
    for (const user of users) {
      const existingShare = task.sharedWith.find((share) => share.userId.toString() === user._id.toString())
      if (!existingShare) {
        task.sharedWith.push({
          userId: user._id,
          permission,
          sharedBy: userId,
          sharedAt: new Date(),
        })
        newShares.push(user)
      }
    }

    task.isShared = true
    await task.save()

    // Log activity with correct data structure
    await logActivity(task._id, req.user.id, "shared", {
      sharedWith: newShares.map((user) => ({
        name: user.name,
        email: user.email,
        permission: permission,
      })),
      permission: permission,
      count: newShares.length,
    })

    res.json({
      success: true,
      message: `Task shared with ${newShares.length} user(s)`,
      data: {
        sharedWith: newShares.map((user) => ({
          name: user.name,
          email: user.email,
          permission,
        })),
      },
    })
  } catch (error) {
    console.error("Share task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to share task",
    })
  }
}

// @desc    Unshare task
export const unshareTask = async (req, res) => {
  const { userEmail } = req.body
  const userId = new mongoose.Types.ObjectId(req.user.id)

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: userId, // Only owner can unshare
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to unshare it",
      })
    }

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      })
    }

    // Remove user from shared list
    task.sharedWith = task.sharedWith.filter((share) => share.userId.toString() !== user._id.toString())

    // Update isShared flag
    task.isShared = task.sharedWith.length > 0

    await task.save()

    // Log activity
    await logActivity(task._id, req.user.id, "unshared", {
      unsharedWith: { name: user.name, email: user.email },
    })

    res.json({
      success: true,
      message: "Task unshared successfully",
    })
  } catch (error) {
    console.error("Unshare task error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to unshare task",
    })
  }
}

// @desc    Get task activity
export const getTaskActivity = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id)

  try {
    // Check if user has access to the task
    const task = await Task.findOne({
      $or: [{ userId: userId }, { "sharedWith.userId": userId }],
      _id: req.params.id,
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    const activities = await TaskActivity.find({ taskId: req.params.id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({
      success: true,
      data: { activities },
    })
  } catch (error) {
    console.error("Get activity error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch task activity",
    })
  }
}

// @desc    Add comment to task
export const addTaskComment = async (req, res) => {
  const { comment } = req.body
  const userId = new mongoose.Types.ObjectId(req.user.id)

  try {
    console.log("🔄 Add comment called for task:", req.params.id, "by user:", req.user.id)
    console.log("🔄 User ID type:", typeof req.user.id, "Value:", req.user.id)

    const task = await Task.findOne({
      $or: [{ userId: userId }, { "sharedWith.userId": userId }],
      _id: req.params.id,
    })

    if (!task) {
      console.log("❌ Task not found for comment")
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    console.log("📋 Task found for comment:", {
      taskId: task._id,
      taskTitle: task.title,
      taskUserId: task.userId,
      currentUserId: req.user.id,
    })

    // FIXED: Check permissions with proper string conversion
    const taskOwnerIdString = task.userId.toString()
    const currentUserIdString = req.user.id.toString()
    const isOwner = taskOwnerIdString === currentUserIdString

    console.log("👑 Owner check for comment:", {
      taskOwnerIdString: taskOwnerIdString,
      currentUserIdString: currentUserIdString,
      isOwner: isOwner,
      comparison: `"${taskOwnerIdString}" === "${currentUserIdString}"`,
    })

    const shareInfo = task.sharedWith?.find((share) => {
      const shareUserIdString = share.userId.toString()
      const matches = shareUserIdString === currentUserIdString
      console.log("🔍 Checking share for comment:", {
        shareUserIdString: shareUserIdString,
        currentUserIdString: currentUserIdString,
        matches: matches,
        permission: share.permission,
      })
      return matches
    })

    console.log("🤝 Share info check for comment:", {
      sharedWith: task.sharedWith?.map((s) => ({
        userId: s.userId.toString(),
        permission: s.permission,
      })),
      shareInfo: shareInfo,
    })

    const canComment = isOwner || shareInfo?.permission === "edit"
    console.log("💬 Permission result for comment:", {
      isOwner: isOwner,
      sharePermission: shareInfo?.permission,
      canComment: canComment,
    })

    if (!canComment) {
      console.log("🚫 Permission denied for comment")
      return res.status(403).json({
        success: false,
        message: "You don't have permission to comment on this task",
      })
    }

    console.log("✅ Permission granted for comment, proceeding...")

    // Log comment activity
    await logActivity(task._id, req.user.id, "commented", {}, comment)

    console.log("🎉 Comment added successfully")

    res.json({
      success: true,
      message: "Comment added successfully",
    })
  } catch (error) {
    console.error("❌ Add comment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    })
  }
}
