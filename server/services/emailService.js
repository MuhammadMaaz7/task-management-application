import nodemailer from "nodemailer"
import Task from "../models/Task.js" // Declare the Task variable

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Email templates
const emailTemplates = {
  dueTomorrow: (task, user) => ({
    subject: `⏰ Task Due Tomorrow: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Task Due Tomorrow</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 22px;">${task.title}</h2>
          ${task.description ? `<p style="color: #666; font-size: 16px; line-height: 1.5;">${task.description}</p>` : ""}
          
          <div style="margin: 20px 0;">
            <span style="display: inline-block; background: ${
              task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#10b981"
            }; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              ${task.priority} Priority
            </span>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #fbbf24;">
            <strong style="color: #d97706;">Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 16px;">Don't forget to complete this task before the deadline!</p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>This is an automated reminder from your Task Management System.</p>
          <p>Stay organized, stay productive! 🚀</p>
        </div>
      </div>
    `,
  }),

  dueToday: (task, user) => ({
    subject: `🚨 Task Due Today: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Task Due Today</h1>
        </div>
        
        <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #92400e; margin-top: 0; font-size: 22px;">${task.title}</h2>
          ${task.description ? `<p style="color: #78350f; font-size: 16px; line-height: 1.5;">${task.description}</p>` : ""}
          
          <div style="margin: 20px 0;">
            <span style="display: inline-block; background: ${
              task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#10b981"
            }; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              ${task.priority} Priority
            </span>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <strong style="color: #d97706;">Due Date:</strong> Today - ${new Date(task.dueDate).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            )}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #92400e; font-size: 18px; font-weight: bold;">⚡ This task is due today! Time to take action!</p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>This is an automated reminder from your Task Management System.</p>
          <p>You've got this! 💪</p>
        </div>
      </div>
    `,
  }),

  overdue: (task, user) => ({
    subject: `🔴 Overdue Task: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔴 Overdue Task</h1>
        </div>
        
        <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin-top: 0; font-size: 22px;">${task.title}</h2>
          ${task.description ? `<p style="color: #7f1d1d; font-size: 16px; line-height: 1.5;">${task.description}</p>` : ""}
          
          <div style="margin: 20px 0;">
            <span style="display: inline-block; background: ${
              task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#10b981"
            }; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              ${task.priority} Priority
            </span>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
            <strong style="color: #dc2626;">Was Due:</strong> ${new Date(task.dueDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            <br>
            <strong style="color: #dc2626;">Days Overdue:</strong> ${Math.ceil(
              (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24),
            )}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #991b1b; font-size: 18px; font-weight: bold;">⚠️ This task is overdue. Please prioritize completing it!</p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>This is an automated reminder from your Task Management System.</p>
          <p>Better late than never! 🎯</p>
        </div>
      </div>
    `,
  }),
}

// Send email function
export const sendEmail = async (to, template, task, user) => {
  try {
    const transporter = createTransporter()
    const emailContent = emailTemplates[template](task, user)

    const mailOptions = {
      from: `"Task Management System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`Email sent successfully to ${to}:`, result.messageId)
    return result
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error)
    throw error
  }
}

// Send due date notifications
export const sendDueDateNotifications = async () => {
  try {
    console.log("🔍 Checking for tasks with upcoming due dates...")

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    // Find tasks due tomorrow
    const tasksDueTomorrow = await Task.find({
      status: "pending",
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow,
      },
      notificationSent: { $ne: "tomorrow" },
    }).populate("userId", "email name")

    // Find tasks due today
    const tasksDueToday = await Task.find({
      status: "pending",
      dueDate: {
        $gte: today,
        $lt: tomorrow,
      },
      notificationSent: { $ne: "today" },
    }).populate("userId", "email name")

    // Find overdue tasks (check once per day)
    const overdueTasks = await Task.find({
      status: "pending",
      dueDate: { $lt: today },
      $or: [{ notificationSent: { $exists: false } }, { lastOverdueNotification: { $lt: today } }],
    }).populate("userId", "email name")

    console.log(`📧 Found ${tasksDueTomorrow.length} tasks due tomorrow`)
    console.log(`📧 Found ${tasksDueToday.length} tasks due today`)
    console.log(`📧 Found ${overdueTasks.length} overdue tasks`)

    // Send tomorrow notifications
    for (const task of tasksDueTomorrow) {
      if (task.userId && task.userId.email) {
        try {
          await sendEmail(task.userId.email, "dueTomorrow", task, task.userId)
          await Task.findByIdAndUpdate(task._id, { notificationSent: "tomorrow" })
          console.log(`✅ Sent tomorrow notification for task: ${task.title}`)
        } catch (error) {
          console.error(`❌ Failed to send tomorrow notification for task ${task.title}:`, error)
        }
      }
    }

    // Send today notifications
    for (const task of tasksDueToday) {
      if (task.userId && task.userId.email) {
        try {
          await sendEmail(task.userId.email, "dueToday", task, task.userId)
          await Task.findByIdAndUpdate(task._id, { notificationSent: "today" })
          console.log(`✅ Sent today notification for task: ${task.title}`)
        } catch (error) {
          console.error(`❌ Failed to send today notification for task ${task.title}:`, error)
        }
      }
    }

    // Send overdue notifications
    for (const task of overdueTasks) {
      if (task.userId && task.userId.email) {
        try {
          await sendEmail(task.userId.email, "overdue", task, task.userId)
          await Task.findByIdAndUpdate(task._id, { lastOverdueNotification: new Date() })
          console.log(`✅ Sent overdue notification for task: ${task.title}`)
        } catch (error) {
          console.error(`❌ Failed to send overdue notification for task ${task.title}:`, error)
        }
      }
    }

    console.log("✨ Notification check completed!")
  } catch (error) {
    console.error("❌ Error in sendDueDateNotifications:", error)
  }
}
