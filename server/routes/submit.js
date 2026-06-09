// 1. Load libraries.
const express = require('express')
const multer = require('multer')
// Got an error! , Because according to way imported pdfParse returns an object, not a function directly.
// Then try new package pdf2json.
const PDFParser = require('pdf2json')
const mammoth = require('mammoth')
// Import Gemini functions.
const { parseCV, generateEmbedding } = require('../lib/gemini')
const { saveCandidate } = require('../lib/mongo')

// 2. create router object.
// like a mini server for this file.
const router = express.Router()

// 3. Multer with memory storage — file stays in RAM as buffer, not written to disk.
// This runs at startup, not per request.
const storage = multer.memoryStorage()

//  Three rules:
// use memory storage,
// max 5MB,
// only PDF or DOCX.
// upload object is ready but not running yet. It runs later when a request comes in.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // only allow PDF and DOCX
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)  // accept file
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'))
    }
  }
})

// This is the function that runs when a request comes in.
// helper function — extracts raw text from buffer
// takes the file object from multer
// returns plain text string
const extractText = async (file) => {
  if (file.mimetype === 'application/pdf') {

    // pdf2json uses events, so we wrap it in a Promise
    return new Promise((resolve, reject) => {
      const parser = new PDFParser()

      // when parsing is done
      parser.on('pdfParser_dataReady', (data) => {
        // extract text from all pages
        const text = data.Pages
          .map(page =>
            page.Texts
              .map(t => decodeURIComponent(t.R[0].T))
              .join(' ')
          )
          .join('\n')
        resolve(text)
      })

      // when parsing fails
      parser.on('pdfParser_dataError', (err) => {
        reject(new Error(err.parserError))
      })

      // parse the buffer directly
      parser.parseBuffer(file.buffer)
    })

  } else {
    // mammoth reads DOCX buffer
    // extractRawText ignores formatting, just gets words
    const data = await mammoth.extractRawText({ buffer: file.buffer })
    return data.value
  }
}

// 4. Receive a POST request from React.
// There are two parts.
// one is the upload.single('cv') - this is a middleware function that runs when a request comes in.
// the other is the async (req, res) => {} function that runs when the request is received.
router.post('/', upload.single('cv'), async (req, res) => {
  try {
    // req.body has name, email, phone from the react form.
    const { name, email, phone } = req.body

    // req.file has the uploaded CV file
    const file = req.file

    // validation
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email and phone are required' })
    }

    if (!file) {
      return res.status(400).json({ message: 'CV file is required' })
    }

    // ── Step 1 — call the helper function to extract the text from the CV file ──
    console.log('Extracting text...')
    const cvText = await extractText(file)
    console.log('Text extracted. Length:', cvText.length)

    // ── Step 2 — parse CV with Gemini ──
    console.log('Parsing CV with Gemini...')
    const parsed = await parseCV(cvText)
    console.log('CV parsed successfully')

    // ── Step 3 — generate embedding from Gemini ──
    console.log('Generating embedding...')
    const embedding = await generateEmbedding(cvText)
    console.log('Embedding generated. Length:', embedding.length)

    // ── Step 4 — save to MongoDB ──
    console.log('Saving to MongoDB...')
    const candidate = await saveCandidate({
      name,
      email,
      phone,
      parsed,
      cv_text: cvText,
      embedding
    })
    console.log('Saved to MongoDB. ID:', candidate._id)

    // ── Step 5 — send success response ──
    res.json({
      message: 'CV submitted successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        parsed: candidate.parsed
      }
    })

  } catch (err) {
    console.error('Submit error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// Export the router object to be used by other files.
// Without this, the server would not know what to do when a request comes in.
module.exports = router