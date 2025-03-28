"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  sender: "human" | "ai"
  text: string
  timestamp: Date
}

interface TranscriptViewProps {
  transcript: Message[]
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const prevTranscriptLength = useRef(transcript.length)

  // Auto-scroll to the bottom when new messages arrive if user was already at bottom
  useEffect(() => {
    if (transcript.length > prevTranscriptLength.current) {
      if (isAtBottom && scrollAreaRef.current) {
        // Small delay to ensure DOM has updated
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = 0
          }
        }, 50)
      } else {
        // If not at bottom, increment new message count
        setNewMessageCount((prev) => prev + (transcript.length - prevTranscriptLength.current))
      }
    }

    prevTranscriptLength.current = transcript.length
  }, [transcript, isAtBottom])

  // Track scroll position to determine if user is at bottom
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      // For newest-first display, we're at "bottom" when scrollTop is 0
      setIsAtBottom(scrollAreaRef.current.scrollTop === 0)

      // If user manually scrolled to top, reset new message count
      if (scrollAreaRef.current.scrollTop === 0) {
        setNewMessageCount(0)
      }
    }
  }

  // Scroll to top (newest messages) function
  const scrollToNewest = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
      setIsAtBottom(true)
      setNewMessageCount(0)
    }
  }

  if (transcript.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center p-4">
        <div className="text-muted-foreground">
          <p>No transcript available yet.</p>
          <p className="text-sm">The interview transcript will appear here.</p>
        </div>
      </div>
    )
  }

  // Create a reversed copy of the transcript array to show newest first
  const reversedTranscript = [...transcript].reverse()

  return (
    <div className="relative h-full w-full">
      <ScrollArea className="h-full w-full p-4" ref={scrollAreaRef} onScrollCapture={handleScroll}>
        <div className="space-y-4 pt-4">
          {reversedTranscript.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "human" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === "human"
                    ? "bg-primary/10 text-foreground border border-primary/20"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <div className="mb-1 text-xs font-medium">
                  {message.sender === "human" ? "Candidate" : "AI Interviewer"} • {formatTime(message.timestamp)}
                </div>
                <p>{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* New messages indicator */}
      {!isAtBottom && newMessageCount > 0 && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-4 right-4 z-10 shadow-md flex items-center gap-1"
          onClick={scrollToNewest}
        >
          <ChevronDown className="h-4 w-4" />
          {newMessageCount} new message{newMessageCount > 1 ? "s" : ""}
        </Button>
      )}
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

