"use client"

import { useState, useCallback } from "react"

interface UseVoiceProps {
  onTranscript?: (transcript: string) => void
  onError?: (error: string) => void
}

export function useVoice({ onTranscript, onError }: UseVoiceProps = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      onError?.("Speech recognition not supported in this browser")
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript("")
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          setTranscript(transcriptSegment)
          onTranscript?.(transcriptSegment)
        } else {
          interimTranscript += transcriptSegment
        }
      }
    }

    recognition.onerror = (event: any) => {
      onError?.(event.error)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [onTranscript, onError])

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) {
        onError?.("Speech synthesis not supported in this browser")
        return
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    },
    [onError],
  )

  return {
    isListening,
    transcript,
    isSpeaking,
    startListening,
    speak,
  }
}
