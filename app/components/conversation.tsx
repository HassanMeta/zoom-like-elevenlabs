"use client"

import { useConversation } from "@11labs/react"
import { useCallback, useState, useRef, useEffect } from "react"
import { UserIcon, Clock, Mic, MicOff, Phone } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Define a type for our messages
type Message = {
  source: "ai" | "user"
  message: string
  timestamp: Date
  isStreaming?: boolean
  displayedText?: string
}

type Employee = {
  ECN: string
  Employee_Name: string
  Department: string
  Band_Level: string
  agent_brief?: string
  monthly_goals?: {
    Goal_ID: string
    Month: string
    Goal_name: string
    Goal_Type: string
    Strategic_Objective: string
    Strategic_Tag: string
    KPI_Contribution: string
    Goal_Category: string
    Goal_Weight: number
    Completion_Status: string
    Notes: string
  }[]
  Monthly_Review_Comments?: {
    Month: string
    Performance_Review: string
    Proposed_Key_Result: string
  }[]
}

type ConversationProps = {
  selectedEmployee?: Employee | null
}

export function Conversation({ selectedEmployee }: ConversationProps) {
  // Add state to store conversation messages
  const [messages, setMessages] = useState<Message[]>([])
  // Add a ref for the messages container
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  // Add state for call timer
  const [callTime, setCallTime] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // Add ref for streaming interval
  const streamingRef = useRef<NodeJS.Timeout | null>(null)

  // Modify the auto-scrolling effect
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      // Scroll the container to the bottom
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  // Add effect for call timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setCallTime((prevTime) => prevTime + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timerActive])

  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        clearInterval(streamingRef.current)
      }
    }
  }, [])

  // Function to simulate text streaming
  const streamText = useCallback((messageIndex: number, fullText: string) => {
    let charIndex = 0
    const streamingSpeed = 30 // milliseconds per character

    if (streamingRef.current) {
      clearInterval(streamingRef.current)
    }

    streamingRef.current = setInterval(() => {
      if (charIndex <= fullText.length) {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages]
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            displayedText: fullText.substring(0, charIndex),
            isStreaming: charIndex < fullText.length,
          }
          return updatedMessages
        })
        charIndex++
      } else {
        if (streamingRef.current) {
          clearInterval(streamingRef.current)
          streamingRef.current = null
        }
      }
    }, streamingSpeed)
  }, [])

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected")
      setTimerActive(true)
      setCallTime(0)
    },
    onDisconnect: () => {
      console.log("Disconnected")
      setTimerActive(false)

      // Add a message indicating the conversation has ended
      const newMessage = {
        source: "ai",
        message: "Conversation ended.",
        timestamp: new Date(),
        isStreaming: true,
        displayedText: "",
      }

      setMessages((prev) => {
        const newIndex = prev.length
        const updatedMessages = [...prev, newMessage]

        // Start streaming after the state update
        setTimeout(() => streamText(newIndex, "Conversation ended."), 0)

        return updatedMessages
      })
    },
    onMessage: (message) => {
      console.log("Message:", message)

      // Parse the message and add it to our messages state with timestamp
      if (typeof message === "string") {
        try {
          // Try to parse if it's a JSON string
          const parsedMessage = JSON.parse(message)
          const newMessage = {
            ...parsedMessage,
            timestamp: new Date(),
            isStreaming: parsedMessage.source === "ai",
            displayedText: parsedMessage.source === "ai" ? "" : parsedMessage.message,
          }

          setMessages((prev) => {
            const newIndex = prev.length
            const updatedMessages = [...prev, newMessage]

            // Start streaming after the state update if it's an AI message
            if (parsedMessage.source === "ai") {
              setTimeout(() => streamText(newIndex, parsedMessage.message), 0)
            }

            return updatedMessages
          })
        } catch {
          // If not JSON, treat as a simple message from AI
          const newMessage = {
            source: "ai",
            message,
            timestamp: new Date(),
            isStreaming: true,
            displayedText: "",
          }

          setMessages((prev) => {
            const newIndex = prev.length
            const updatedMessages = [...prev, newMessage]

            // Start streaming after the state update
            setTimeout(() => streamText(newIndex, message), 0)

            return updatedMessages
          })
        }
      } else if (typeof message === "object") {
        // If it's already an object, add it directly with timestamp
        const msgObj = message as Message
        const newMessage = {
          ...msgObj,
          timestamp: new Date(),
          isStreaming: msgObj.source === "ai",
          displayedText: msgObj.source === "ai" ? "" : msgObj.message,
        }

        setMessages((prev) => {
          const newIndex = prev.length
          const updatedMessages = [...prev, newMessage]

          // Start streaming after the state update if it's an AI message
          if (msgObj.source === "ai") {
            setTimeout(() => streamText(newIndex, msgObj.message), 0)
          }

          return updatedMessages
        })
      }
    },
    onError: (error) => console.error("Error:", error),
  })

  const startConversation = useCallback(async () => {
    if (!selectedEmployee) return

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Clear previous messages when starting a new conversation
      setMessages([])

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
        dynamicVariables: {
          candidateInformation: selectedEmployee.agent_brief,
        },
      })
    } catch (error) {
      console.error("Failed to start conversation:", error)
    }
  }, [conversation, selectedEmployee])

  const stopConversation = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  // If no employee is selected, show a message
  if (!selectedEmployee) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-gray-100 p-8 rounded-lg text-center max-w-md">
          <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No Employee Selected</h3>
          <p className="text-gray-500">Please select an employee from the list on the left to start a conversation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {conversation.status === "connected" ? (
              <div className="flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full">
                <Phone className="w-4 h-4 mr-1.5" />
                <span className="font-medium text-sm">{formatTime(callTime)}</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <Clock className="w-4 h-4 mr-1.5" />
                <span className="font-mono">{formatTime(callTime)}</span>
              </div>
            )}
          </div>

          {conversation.status === "connected" && (
            <div className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full">
              {conversation.isSpeaking ? (
                <span className="text-xs font-medium">AI Speaking</span>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-medium">Listening</span>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={conversation.status === "connected" ? stopConversation : startConversation}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              conversation.status === "connected"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            } transition-colors`}
            disabled={conversation.status === "connecting"}
          >
            {conversation.status === "connecting" ? (
              "Connecting..."
            ) : conversation.status === "connected" ? (
              <>
                <MicOff className="w-4 h-4 mr-1.5" />
                End Conversation
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-1.5" />
                Start Conversation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conversation display */}
      <div className="w-full border border-gray-200 rounded-lg bg-white">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Your conversation will appear here</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="conversation-transcript" className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center">
                  <span className="text-base font-medium text-gray-900">Conversation Transcript</span>
                  {conversation.isSpeaking && (
                    <div className="ml-2 flex items-center">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                      </span>
                      <span className="ml-2 text-xs text-orange-600 font-medium">Audio Playing</span>
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div ref={messagesContainerRef} className="p-4 max-h-96 overflow-y-auto border-t border-gray-200">
                  <div className="flex flex-col gap-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg max-w-[80%] ${
                          msg.source === "ai" ? "bg-gray-100 self-start" : "bg-orange-100 self-end"
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1 text-gray-700">
                          {msg.source === "ai" ? "AI Assistant" : "You"}
                        </p>
                        <p className="whitespace-pre-wrap text-gray-800">
                          {msg.source === "ai" ? msg.displayedText : msg.message}
                          {msg.isStreaming && (
                            <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-500 animate-pulse"></span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  )
}

