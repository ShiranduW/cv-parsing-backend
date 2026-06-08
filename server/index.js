// 1. Load lbraries.
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

// 2. load .env variables.
dotenv.config()

// 3. Load route fils - Node.js opens routes/submit.js and runs it.
// submitRoute now holds that router object.
const submitRoute = require('./routes/submit')

// 4. create server object.
const app = express()

// 5. allow React (localhost:5173) to talk to this server
app.use(cors({
  origin: 'http://localhost:5173'
}))

// 6. automatically converts REQUEST BODY COME FROM REACT into a real JavaScript object.
app.use(express.json())

// 7. Connect routes to server.
// Telling the server what to do when do this.
app.use('/api/submit', submitRoute)

// test route — confirm server is running.
// Like send a response to the client.
// Open localhost:5000 in my browser and see if it says "Server is running".
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

// Use the PORT from .env if it exists, otherwise use 5000
const PORT = process.env.PORT || 5000

// Opens port 5000 on your computer and starts accepting incoming requests.
// This callback function runs once when the server is ready.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})