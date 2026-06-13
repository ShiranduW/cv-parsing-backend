const express = require('express')
const { generateEmbedding } = require('../services/gemini.js')
const { vectorSearch } = require('../services/candidate.js')

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ message: 'Query is required' })
    }

    // step 1 — convert query to embedding
    console.log('Embedding query...')
    const queryEmbedding = await generateEmbedding(query)
    console.log('Query embedding length:', queryEmbedding.length)

    // step 2 — find similar CVs
    console.log('Searching candidates...')
    const matches = await vectorSearch(queryEmbedding)
    console.log('Matches found:', matches.length)

    // return matches only — no Gemini yet
    res.json({
      matches
    })

  } catch (err) {
    console.error('Search error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router