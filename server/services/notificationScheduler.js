import cron from "node-cron"
import { sendDueDateNotifications } from "./emailService.js"

// Schedule notifications to run every day at 9:00 AM
export const startNotificationScheduler = () => {
  console.log("🚀 Starting notification scheduler...")

  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running scheduled notification check at", new Date().toLocaleString())
    await sendDueDateNotifications()
  })

  // Also run every 2 hours during business hours (9 AM to 6 PM) for more frequent checks
  cron.schedule("0 9-18/2 * * *", async () => {
    console.log("🔄 Running frequent notification check at", new Date().toLocaleString())
    await sendDueDateNotifications()
  })

  console.log("✅ Notification scheduler started successfully!")
  console.log("📅 Daily notifications: 9:00 AM")
  console.log("🔄 Frequent checks: Every 2 hours (9 AM - 6 PM)")

  // Run once immediately for testing
  if (process.env.NODE_ENV === "development") {
    console.log("🧪 Running initial notification check for development...")
    setTimeout(() => {
      sendDueDateNotifications()
    }, 5000) // Wait 5 seconds after startup
  }
}
