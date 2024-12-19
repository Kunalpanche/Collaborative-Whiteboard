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
  
  export default function Whiteboard() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [tool, setTool] = useState('pencil')
    const [color, setColor] = useState('#000000')
    const [size, setSize] = useState(2)
    const [isClient, setIsClient] = useState(false)
  
    useEffect(() => {
      setIsClient(true)
      const newSocket = io('http://localhost:3001')
      setSocket(newSocket)
  
      return () => {
        newSocket.close()
      }
    }, [])
  
    useEffect(() => {
      if (!socket) return
  
      socket.on('draw', (point: Point) => {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!context || !canvas) return
  
        if (point.tool === 'eraser') {
          context.globalCompositeOperation = 'destination-out'
        } else {
          context.globalCompositeOperation = 'source-over'
        }
  
        context.beginPath()
        context.arc(point.x, point.y, point.size, 0, Math.PI * 2)
        context.fillStyle = point.color
        context.fill()
      })
    }, [socket])
  
    const startDrawing = (e: React.MouseEvent) => {
      setIsDrawing(true)
      draw(e)
    }
  
    const stopDrawing = () => {
      setIsDrawing(false)
    }
  
    const draw = (e: React.MouseEvent) => {
      if (!isDrawing || !socket) return
  
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!context || !canvas) return
  
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
  
      const point = { x, y, color, size, tool }
      socket.emit('draw', point)
  
      if (tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out'
      } else {
        context.globalCompositeOperation = 'source-over'
      }
  
      context.beginPath()
      context.arc(x, y, size, 0, Math.PI * 2)
      context.fillStyle = color
      context.fill()
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

