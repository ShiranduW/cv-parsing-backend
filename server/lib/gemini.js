const { GoogleGenerativeAI } = require('@google/generative-ai')

// ---------1. Create client with API key ---------
// initialize Gemini with API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// helper — wait for ms milliseconds
// used for retry delay
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ─────────────────────────────────────────
// Function 1 — parse CV text into structured JSON
// ─────────────────────────────────────────
const parseCV = async (cvText, retries = 3) => {
  try {
    // ---------2. Get a model ---------
    // gemini-2.5-flash — free tier, fast, good for extraction
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
      You are a CV parser. Extract information from the CV text below.

      Return ONLY a valid JSON object with exactly this structure.
      No explanation. No markdown. No extra text. Just raw JSON.

      {
        "personal_info": {
          "name": "full name or empty string",
          "email": "email or empty string",
          "phone": "phone number or empty string",
          "location": "city or country or empty string",
          "linkedin": "linkedin url or empty string",
          "github": "github url or empty string"
        },
        "education": [
          {
            "degree": "degree name",
            "institution": "university or school name",
            "year": "graduation year or empty string",
            "gpa": "gpa if mentioned or empty string"
          }
        ],
        "qualifications": [
          {
            "name": "certification or skill name",
            "issuer": "who gave this or empty string",
            "year": "year or empty string"
          }
        ],
        "projects": [
          {
            "title": "project name",
            "description": "what the project does",
            "technologies": ["tech1", "tech2"]
          }
        ]
      }

      CV Text:
      ${cvText}
    `
    // ---------3. Call generateContent ---------
    const result = await model.generateContent(prompt)
    // console.log(JSON.stringify(result, null, 2))
    // ---------4. Get text from result ---------
    const responseText = result.response.text()

    // Gemini sometimes wraps JSON in markdown code blocks
    // ```json { ... } ```
    // strip those markers before parsing
    const cleaned = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    // parse cleaned string into real JavaScript object
    const parsed = JSON.parse(cleaned)

    return parsed

  } catch (err) {
    // 429 means rate limited — too many requests
    // wait 10 seconds and try again
    if (err.status === 429 && retries > 0) {
      console.log(`Rate limited. Waiting 10s. Retries left: ${retries}`)
      await wait(10000)
      return parseCV(cvText, retries - 1)
    }

    // if JSON parse failed — Gemini returned non-JSON
    // log what it returned so you can debug
    if (err instanceof SyntaxError) {
      console.error('Gemini returned invalid JSON')
      throw new Error('CV parsing failed — invalid response from Gemini')
    }

    // any other error — just throw it
    throw err
  }
}

// ─────────────────────────────────────────
// Function 2 — generate embedding from CV text
// ─────────────────────────────────────────
const generateEmbedding = async (cvText, retries = 3) => {
  try {
    // ---------2.2. Get a model ---------
    // text-embedding-004 — Gemini free embedding model
    // converts text into 768 numbers representing meaning
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

    // ---------2.3. Call generateContent ---------
    // embeddings work best on shorter text
    // slice to first 2000 characters — captures the important parts
    // sending the full CV wastes tokens
    const result = await model.embedContent(cvText.slice(0, 2000))

    // ---------2.4. Get text from result ---------
    // result.embedding.values is the array of 768 numbers
    return result.embedding.values

  } catch (err) {
    // same retry logic for rate limiting
    if (err.status === 429 && retries > 0) {
      console.log(`Embedding rate limited. Waiting 10s. Retries left: ${retries}`)
      await wait(10000)
      return generateEmbedding(cvText, retries - 1)
    }
    throw err
  }
}

// Export both functions.
module.exports = { parseCV, generateEmbedding }