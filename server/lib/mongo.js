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

// 1. Defining Candidate Schema.
// defines what a candidate document looks like
const candidateSchema = new mongoose.Schema({
  // form data
  name:  { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },

  // parsed CV data from Gemini
  parsed: {
    personal_info:  { type: Object, default: {} },
    education:      { type: Array,  default: [] },
    qualifications: { type: Array,  default: [] },
    projects:       { type: Array,  default: [] },
  },

  // raw text extracted by pdf2json
  // used by RAG to send context to Gemini
  cv_text: { type: String, required: true },

  // 768 numbers representing meaning of CV
  // used for vector similarity search
  embedding: { type: [Number], required: true },

  // when this was submitted
  createdAt: { type: Date, default: Date.now }
})

// 2. Converting Candidate Schema to a Mongoose Model.
// This is how we can use Mongoose to interact with MongoDB.
// Model means "collection" in MongoDB.
// Candidate is Class. because of that we do capitalize first letter.

// Mongoose automatically ('candidates') converts:
// 1. lowercases it  → 'candidate'
// 2. pluralizes it  → 'candidates'
// 3. uses that as collection name in MongoDB. 
const Candidate = mongoose.model('Candidate', candidateSchema)

// 4. Save a candidate to MongoDB.
// Function 1 — save a candidate to MongoDB
const saveCandidate = async (data) => {
  // create a new Candidate document.
  // data is an object with name, email, phone, parsed, cv_text, embedding. This is from the submit route.
  // 4.1. creates the object in MEMORY only.
  const candidate = new Candidate(data)
  // NOW sends to MongoDB.
  // 4.2. actually writes to database.
  await candidate.save()
  return candidate
}

module.exports = { connectDB, saveCandidate }