// main.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/tasksRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startNotificationScheduler } from './services/notificationScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─────── Connect to DB ───────
connectDB();

// ─────── Middleware ───────
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Enhanced CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
)

// Handle preflight requests
app.options("*", cors())

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────── Routes ───────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// ─────── Health Check ───────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Task Management API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─────── 404 & Error Handling ───────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorHandler);

// ─────── Start Server ───────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start background jobs
  startNotificationScheduler();
});

export default app;
