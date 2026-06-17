"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Eraser } from "lucide-react"

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
}

export function SignatureCanvasComponent({ onSave }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = 200 * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `200px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, rect.width, 200)
    ctx.strokeStyle = "#0F172A"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  useEffect(() => {
    setupCanvas()
    window.addEventListener("resize", setupCanvas)
    return () => window.removeEventListener("resize", setupCanvas)
  }, [setupCanvas])

  const getCoords = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const point = getCoords(e, canvas)
    lastPoint.current = point

    // Draw a dot immediately so single clicks/taps are visible
    ctx.beginPath()
    ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fillStyle = ctx.strokeStyle as string
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const point = getCoords(e, canvas)

    if (lastPoint.current) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
    }

    lastPoint.current = point
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    lastPoint.current = null
  }

  const clearCanvas = () => {
    setupCanvas()
    setHasDrawn(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return
    const dataUrl = canvas.toDataURL("image/png")
    onSave(dataUrl)
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          className="w-full border rounded-md cursor-crosshair touch-none bg-white"
          style={{ height: "200px" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={clearCanvas}>
          <Eraser className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button type="button" onClick={handleSave} disabled={!hasDrawn}>
          Save Signature
        </Button>
      </div>
    </div>
  )
}