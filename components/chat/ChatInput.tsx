'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, MicOff, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setMessage(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }
  }, [])

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
      setHasPermission(true)
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setHasPermission(false)
      return false
    }
  }

  const startRecording = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.')
      return
    }

    if (hasPermission === null) {
      const granted = await requestMicrophonePermission()
      if (!granted) {
        alert('Microphone permission is required for voice input.')
        return
      }
    }

    if (hasPermission === false) {
      alert('Please enable microphone permission in your browser settings.')
      return
    }

    try {
      recognitionRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a legal question..."
          className="w-full min-h-[40px] max-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          disabled={isLoading}
        />
        <div className="absolute right-2 bottom-2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={isLoading}
          >
            <Paperclip className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            className={`h-6 w-6 ${isRecording ? 'animate-pulse' : ''}`}
            disabled={isLoading}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? <Square className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || isLoading}
        className="h-10 w-10"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
