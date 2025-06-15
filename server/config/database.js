// config/database.js
import mongoose from 'mongoose';

let isConnected = false; // Global connection flag

const connectDB = async () => {
  if (isConnected) {
    return; // Use existing connection
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error; // Don't use process.exit in serverless!
  }
};

export default connectDB;
