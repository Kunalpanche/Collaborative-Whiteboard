'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from './ui/button'
import { Pencil, Square, Circle, Eraser } from 'lucide-react'
import { UserNameModal } from './UserNameModal'

interface DrawingData {
  type: 'stroke' | 'shape'
  x: number
  y: number
  endX?: number
  endY?: number
  color: string
  size: number
  tool: string
  userName: string
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState('pencil')
  const [color, setColor] = useState('#FFFFFF')
  const [size, setSize] = useState(2)
  const [userName, setUserName] = useState<string | null>(null)
  const [startPoint, setStartPoint] = useState<DrawingData | null>(null)
  const [tempCanvas, setTempCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (userName) {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const newSocket = io(BACKEND_URL, {
        path: '/api/socket.io',
      })
      setSocket(newSocket)

      // Create temporary canvas for shape preview
      const temp = document.createElement('canvas')
      temp.width = 800
      temp.height = 600
      setTempCanvas(temp)

      return () => {
        newSocket.close()
      }
    }
  }, [userName])

  useEffect(() => {
    if (!socket) return

    socket.on('draw', (data: DrawingData) => {
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!context || !canvas) return

      drawOnCanvas(context, data)
    })

    return () => {
      socket.off('draw')
    }
  }, [socket])

  const startDrawing = (e: React.MouseEvent) => {
    if (!userName) return

    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const drawingData: DrawingData = {
      type: tool === 'pencil' || tool === 'eraser' ? 'stroke' : 'shape',
      x,
      y,
      color,
      size,
      tool,
      userName
    }

    setStartPoint(drawingData)

    if (tool === 'pencil' || tool === 'eraser') {
      draw(e)
    }
  }

  const stopDrawing = () => {
    if (!isDrawing || !startPoint) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (tool === 'square' || tool === 'circle') {
      const context = canvas.getContext('2d')
      if (!context) return

      const drawingData: DrawingData = {
        ...startPoint,
        endX: startPoint.x,
        endY: startPoint.y
      }
      
      // Draw final shape
      drawOnCanvas(context, drawingData)
      socket?.emit('draw', drawingData)
    }

    setIsDrawing(false)
    setStartPoint(null)
  }

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !socket || !startPoint || !userName) return

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    if (tool === 'pencil' || tool === 'eraser') {
      const drawingData: DrawingData = {
        ...startPoint,
        endX: currentX,
        endY: currentY
      }

      socket.emit('draw', drawingData)
      drawOnCanvas(context, drawingData)
      
      // Update start point for next segment
      setStartPoint({
        ...drawingData,
        x: currentX,
        y: currentY
      })
    } else if (tempCanvas) {
      // Preview shape on temporary canvas
      const tempContext = tempCanvas.getContext('2d')
      if (!tempContext) return

      tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      const drawingData: DrawingData = {
        ...startPoint,
        endX: currentX,
        endY: currentY
      }

      drawOnCanvas(tempContext, drawingData)
      
      // Copy temp canvas to main canvas
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(tempCanvas, 0, 0)
    }
  }

  const drawOnCanvas = (context: CanvasRenderingContext2D, data: DrawingData) => {
    const { x, y, endX, endY, color, size, tool, userName, type } = data

    context.strokeStyle = color
    context.fillStyle = color
    context.lineWidth = size
    context.lineCap = 'round'
    context.lineJoin = 'round'

    if (tool === 'eraser') {
      context.globalCompositeOperation = 'destination-out'
      context.strokeStyle = '#000000'
    } else {
      context.globalCompositeOperation = 'source-over'
    }

    switch (tool) {
      case 'pencil':
      case 'eraser':
        if (endX !== undefined && endY !== undefined) {
          context.beginPath()
          context.moveTo(x, y)
          context.lineTo(endX, endY)
          context.stroke()
          
          // Only draw username at the start of a stroke
          if (type === 'stroke' && x === endX && y === endY) {
            context.globalCompositeOperation = 'source-over'
            context.fillStyle = color
            context.font = '12px Arial'
            context.fillText(userName, x, y - 5)
          }
        }
        break
      case 'square':
        if (endX !== undefined && endY !== undefined) {
          context.beginPath()
          const width = endX - x
          const height = endY - y
          context.rect(x, y, width, height)
          context.stroke()
          
          // Draw username once for shapes
          if (type === 'shape') {
            context.globalCompositeOperation = 'source-over'
            context.fillStyle = color
            context.font = '12px Arial'
            context.fillText(userName, x, y - 5)
          }
        }
        break
      case 'circle':
        if (endX !== undefined && endY !== undefined) {
          context.beginPath()
          const radiusX = Math.abs(endX - x) / 2
          const radiusY = Math.abs(endY - y) / 2
          const centerX = x + (endX - x) / 2
          const centerY = y + (endY - y) / 2
          context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          context.stroke()
          
          // Draw username once for shapes
          if (type === 'shape') {
            context.globalCompositeOperation = 'source-over'
            context.fillStyle = color
            context.font = '12px Arial'
            context.fillText(userName, x, y - 5)
          }
        }
        break
    }
  }

  if (!userName) {
    return <UserNameModal onSubmit={setUserName} />
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
      <div className="bg-black p-4 rounded-lg">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 rounded-lg"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
        />
      </div>
    </div>
  )
}

