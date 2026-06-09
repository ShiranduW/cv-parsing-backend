require('dotenv').config()
const { parseCV, generateEmbedding } = require('./lib/gemini')

const sampleCV = `
  John Doe
  john@email.com | 0712345678 | Colombo, Sri Lanka
  github.com/johndoe

  Education
  BSc Computer Science — University of Moratuwa — 2023

  Projects
  E-commerce Platform
  Built a full stack shopping app using React and Node.js
  Technologies: React, Node.js, MongoDB

  Qualifications
  AWS Cloud Practitioner — 2023
  React Certification — Udemy — 2022

  Skills
  JavaScript, React, Node.js, MongoDB, Docker
`

const run = async () => {
  console.log('Testing parseCV...\n')
  const parsed = await parseCV(sampleCV)
  console.log(JSON.stringify(parsed, null, 2))

  console.log('\nTesting generateEmbedding...')
  const embedding = await generateEmbedding(sampleCV)
  console.log('Embedding length:', embedding.length)
  console.log('First 5 numbers:', embedding.slice(0, 5))
}

run()
