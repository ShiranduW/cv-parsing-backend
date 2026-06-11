const Candidate = require('../models/candidate.js')

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

module.exports = { saveCandidate }