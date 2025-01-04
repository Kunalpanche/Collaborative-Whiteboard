import express from 'express'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'

const app = express()
app.use(cors())

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard'
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

const drawingSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  endX: Number,
  endY: Number,
  color: String,
  size: Number,
  tool: String,
  userName: String,
})

const whiteboardSchema = new mongoose.Schema({
  name: String,
  drawings: [drawingSchema]
})

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema)

const io = new Server({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('draw', async (data) => {
    socket.broadcast.emit('draw', data)

    try {
      await Whiteboard.updateOne(
        { name: 'default' },
        { $push: { drawings: data } },
        { upsert: true }
      )
    } catch (error) {
      console.error('Error saving drawing:', error)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

app.use((req, res) => {
  if (req.url === '/socket.io/') {
    res.end()
  } else {
    res.status(404).send('Not found')
  }
})

export default function handler(req, res) {
  if (!res.socket.server.io) {
    res.socket.server.io = io
  }
  res.end()
}

