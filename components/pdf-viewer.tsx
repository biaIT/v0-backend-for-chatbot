"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"

interface PDFViewerProps {
  documentId: string
  filename: string
  onClose: () => void
}

export function PDFViewer({ documentId, filename, onClose }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-white">{filename}</h3>
            <p className="text-xs text-slate-400">Page {currentPage}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-slate-700/50 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="text-slate-300 hover:bg-slate-600"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-300 min-w-12 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="text-slate-300 hover:bg-slate-600"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="text-slate-300 hover:bg-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-300">Page {currentPage}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              className="text-slate-300 hover:bg-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center">
          <div
            className="bg-white rounded shadow-lg"
            style={{
              width: "100%",
              maxWidth: `${zoom}%`,
              aspectRatio: "8.5 / 11",
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              PDF Preview - Page {currentPage}
              <br />
              (Full PDF rendering requires pdf.js library)
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
