const mongoose = require('mongoose')

// 3. Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err)
    process.exit(1) // stop server if DB connection fails
  }
}

module.exports = { connectDB }