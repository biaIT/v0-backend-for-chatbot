"use client"

import type { ReactNode } from "react"
import Link from "next/link"

interface MessageRendererProps {
  content: string
}

export function MessageRenderer({ content }: MessageRendererProps) {
  const parseContent = (text: string): ReactNode[] => {
    const parts: ReactNode[] = []
    let lastIndex = 0

    // URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g
    let match

    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      parts.push(
        <Link
          key={match.index}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {match[0]}
        </Link>,
      )
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  return (
    <div className="space-y-2 whitespace-pre-wrap">
      {content.split("\n\n").map((paragraph, idx) => {
        // Code blocks
        if (paragraph.startsWith("```")) {
          return (
            <pre key={idx} className="bg-slate-900 p-2 rounded text-xs overflow-x-auto border border-slate-600">
              <code>{paragraph.replace(/```/g, "")}</code>
            </pre>
          )
        }

        // Lists
        if (paragraph.startsWith("•") || paragraph.startsWith("-")) {
          return (
            <ul key={idx} className="list-disc list-inside space-y-1">
              {paragraph.split("\n").map((line, lineIdx) => (
                <li key={lineIdx} className="text-slate-100">
                  {parseContent(line.replace(/^[•-]\s*/, ""))}
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={idx} className="text-slate-100">
            {parseContent(paragraph)}
          </p>
        )
      })}
    </div>
  )
}
