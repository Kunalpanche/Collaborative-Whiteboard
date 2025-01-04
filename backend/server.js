import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'

// Initialize Express app
const app = express()
app.use(cors())
const httpServer = createServer(app)
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const io = new Server(httpServer, {
cors: {
origin: FRONTEND_URL,
methods: ["GET", "POST"]
}
})

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/whiteboard')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err))

// Create Whiteboard Schema
const whiteboardSchema = new mongoose.Schema({
name: String,
points: [{
x: Number,
y: Number,
color: String,
size: Number,
tool: String
}]
})

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema)

// Socket.IO connection handling
io.on('connection', (socket) => {
console.log('User connected:', socket.id)

socket.on('draw', async (point) => {
// Broadcast the drawing point to all other clients
socket.broadcast.emit('draw', point)

// Save the point to MongoDB (you might want to batch these for performance)
try {
await Whiteboard.updateOne(
  { name: 'default' },
  { $push: { points: point } },
  { upsert: true }
)
} catch (error) {
console.error('Error saving point:', error)
}
})

socket.on('disconnect', () => {
console.log('User disconnected:', socket.id)
})
})

// Start the server

httpServer.listen(PORT, () => {
console.log(`Server running on port ${PORT}`)
})

