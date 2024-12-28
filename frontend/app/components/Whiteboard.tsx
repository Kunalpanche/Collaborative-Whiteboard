'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from './ui/button'
import { Pencil, Square, Circle, Eraser } from 'lucide-react'

interface Point {
  x: number
  y: number
  color: string
  size: number
  tool: string
}

interface Shape extends Point {
  endX: number
  endY: number
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState('pencil')
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(2)
  const [isClient, setIsClient] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)

  useEffect(() => {
    setIsClient(true)
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    const newSocket = io(BACKEND_URL, {
      path: '/api/socket.io',
    })
    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('draw', (data: Point | Shape) => {
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!context || !canvas) return

      if (data.tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out'
      } else {
        context.globalCompositeOperation = 'source-over'
      }

      context.strokeStyle = data.color
      context.lineWidth = data.size

      if (data.tool === 'pencil') {
        drawPencilStroke(context, data as Point)
      } else if (data.tool === 'square') {
        drawSquare(context, data as Shape)
      } else if (data.tool === 'circle') {
        drawCircle(context, data as Shape)
      }
    })
  }, [socket])

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setStartPoint({ x, y, color, size, tool })

    if (tool === 'pencil') {
      draw(e)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setStartPoint(null)
  }

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !socket || !startPoint) return

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'pencil') {
      const point: Point = { x, y, color, size, tool }
      socket.emit('draw', point)
      drawPencilStroke(context, point)
    } else if (tool === 'square' || tool === 'circle') {
      const shape: Shape = { ...startPoint, endX: x, endY: y }
      socket.emit('draw', shape)
      redrawCanvas(context, shape)
    }
  }

  const drawPencilStroke = (context: CanvasRenderingContext2D, point: Point) => {
    context.beginPath()
    context.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2)
    context.fillStyle = point.color
    context.fill()
  }

  const drawSquare = (context: CanvasRenderingContext2D, shape: Shape) => {
    context.beginPath()
    context.rect(shape.x, shape.y, shape.endX - shape.x, shape.endY - shape.y)
    context.stroke()
  }

  const drawCircle = (context: CanvasRenderingContext2D, shape: Shape) => {
    context.beginPath()
    const radiusX = Math.abs(shape.endX - shape.x) / 2
    const radiusY = Math.abs(shape.endY - shape.y) / 2
    const centerX = shape.x + radiusX
    const centerY = shape.y + radiusY
    context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
    context.stroke()
  }

  const redrawCanvas = (context: CanvasRenderingContext2D, shape: Shape) => {
    const canvas = canvasRef.current
    if (!canvas) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    if (shape.tool === 'square') {
      drawSquare(context, shape)
    } else if (shape.tool === 'circle') {
      drawCircle(context, shape)
    }
  }

  if (!isClient) {
    return null // or a loading indicator
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-2">
        <Button
          variant={tool === 'pencil' ? 'default' : 'outline'}
          onClick={() => setTool('pencil')}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Pencil
        </Button>
        <Button
          variant={tool === 'square' ? 'default' : 'outline'}
          onClick={() => setTool('square')}
        >
          <Square className="w-4 h-4 mr-2" />
          Square
        </Button>
        <Button
          variant={tool === 'circle' ? 'default' : 'outline'}
          onClick={() => setTool('circle')}
        >
          <Circle className="w-4 h-4 mr-2" />
          Circle
        </Button>
        <Button
          variant={tool === 'eraser' ? 'default' : 'outline'}
          onClick={() => setTool('eraser')}
        >
          <Eraser className="w-4 h-4 mr-2" />
          Eraser
        </Button>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-10"
        />
        <input
          type="range"
          min="1"
          max="20"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-32"
        />
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-300 rounded-lg"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
      />
    </div>
  )
}

