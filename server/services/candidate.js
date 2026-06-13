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

// 1. Implement vector search in MongoDB -Find similar CVs.
const vectorSearch = async (queryEmbedding) => {
  const results = await Candidate.aggregate([
    // 1.1 Find similar embeddings.
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding', // look in this field
        queryVector: queryEmbedding, // compare against this
        numCandidates: 20, // // consider top 20
        limit: 3 // // return only top 3
      }
    },
    // 1.2 Pick which fields to return.
    {
      $project: {
        name: 1,
        email: 1,
        parsed: 1,
        cv_text: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ])
  return results
}

module.exports = { saveCandidate, vectorSearch }