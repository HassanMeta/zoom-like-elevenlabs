"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useConversation as useElevenLabsConversation } from "@11labs/react"
import { fetchFromBlob } from "@/app/actions/blob-storage"

// Define the Message type
interface Message {
  id: string
  sender: "human" | "ai"
  text: string
  timestamp: Date
}

// Define the ChatContext type
interface ChatContext {
  firstName: string
  companyName: string
  name: string
}

// Safe function to get data from localStorage
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error)
    return null
  }
}

export function useConversation() {
  const isInitializedRef = useRef(false)
  const [transcript, setTranscript] = useState<Message[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [agentId, setAgentId] = useState(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "")
  const [agentEndedCall, setAgentEndedCall] = useState(false)

  // Track the last message to detect interview conclusion
  const lastMessageRef = useRef<string>("")

  // Use refs to store conversation state
  const conversationIdRef = useRef<string | null>(null)

  // Initialize the ElevenLabs conversation hook
  const conversation = useElevenLabsConversation({
    onConnect: () => {
      console.log("✅ [ElevenLabs] Connected to ElevenLabs")
    },
    onDisconnect: () => {
      console.log("🔄 [ElevenLabs] Disconnected from ElevenLabs")

      // Check if this was an agent-initiated disconnect
      const lastMessage = lastMessageRef.current.toLowerCase()
      const conclusionPhrases = [
        "thank you for your time",
        "have a great day",
        "interview is complete",
        "interview has concluded",
        "that concludes our interview",
        "thank you for interviewing",
      ]

      // Check if the last message contains any conclusion phrases
      const isAgentEndedCall = conclusionPhrases.some((phrase) => lastMessage.includes(phrase))

      if (isAgentEndedCall) {
        console.log("🤖 [ElevenLabs] Agent ended the call")
        setAgentEndedCall(true)
      }

      setIsCallActive(false)
    },
    onMessage: (message) => {
      // Add detailed logging to understand message structure
      console.group("📩 [ElevenLabs] Message Details")
      console.log("Raw message:", JSON.stringify(message, null, 2))
      console.log("Message type:", message.type)
      console.log("Content property:", message.content)
      console.log("Message property:", message.message)
      console.log("Source property:", message.source)
      console.groupEnd()

      console.log("📩 [ElevenLabs] Message received:", message)

      // Check for special system messages
      if (message.type === "speaking_started") {
        setIsSpeaking(true)
        return
      } else if (message.type === "speaking_finished") {
        setIsSpeaking(false)
        return
      } else if (message.type === "AGENT_ENDING_CALL" || (message.message && message.message === "AGENT_ENDING_CALL")) {
        console.log("🤖 [ElevenLabs] Agent sent end call signal")
        setAgentEndedCall(true)
        return
      }

      // Handle regular messages based on source
      if (message.source) {
        const newMessage: Message = {
          id: Date.now().toString(),
          sender: message.source === "ai" ? "ai" : "human",
          text: message.message || "",
          timestamp: new Date(),
        }

        setTranscript((prev) => [...prev, newMessage])

        // If it's an AI message, store it for conclusion detection
        if (message.source === "ai") {
          lastMessageRef.current = message.message || ""
        }
      }
    },
    onError: (error) => {
      console.error("❌ [ElevenLabs] Error:", error)
      setError(`ElevenLabs error: ${error.message || "Unknown error"}`)
    },
  })

  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log("🔍 ElevenLabs conversation hook initialized (first time only)")
      isInitializedRef.current = true
    } else {
      console.log("♻️ ElevenLabs conversation hook reused")
    }
  }, [])

  // Check if we're in the browser
  useEffect(() => {
    setIsMounted(true)
    console.log("🔄 [ElevenLabs] Hook initialized")
  }, [])

  // Load the Gemini response from Blob or localStorage
  useEffect(() => {
    if (!isMounted) return

    const loadGeminiResponse = async () => {
      try {
        console.log("🔄 [ElevenLabs] Loading interview data...")

        // First, check if we have a Blob URL
        const blobUrl = getLocalStorageItem("geminiResponseUrl")

        if (blobUrl) {
          console.log(`✅ [ElevenLabs] Found Blob URL: ${blobUrl}`)
          setIsLoading(false)
          return
        }

        // Fallback to localStorage
        const localStorageResponse = getLocalStorageItem("geminiResponse")

        if (localStorageResponse) {
          console.log(`✅ [ElevenLabs] Found response in localStorage`)
          setIsLoading(false)
          return
        }

        // If we get here, we couldn't load the response
        console.error("❌ [ElevenLabs] Could not load interview data")
        setError("Failed to load interview data. Please return to setup.")
        setIsLoading(false)
      } catch (error) {
        console.error("❌ [ElevenLabs] Error loading interview data:", error)
        setError("An error occurred while loading interview data.")
        setIsLoading(false)
      }
    }

    loadGeminiResponse()
  }, [isMounted])

  // Persist transcript to localStorage
  useEffect(() => {
    if (!isMounted || transcript.length === 0) return

    try {
      localStorage.setItem("interview-transcript", JSON.stringify(transcript))
      console.log(`💾 [ElevenLabs] Saved transcript (${transcript.length} messages)`)
    } catch (error) {
      console.error("❌ [ElevenLabs] Failed to save transcript:", error)
    }
  }, [transcript, isMounted])

  // Load saved transcript on initialization
  useEffect(() => {
    if (!isMounted) return

    try {
      const savedTranscript = localStorage.getItem("interview-transcript")
      if (savedTranscript) {
        const parsed = JSON.parse(savedTranscript)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Convert string dates back to Date objects
          const processedTranscript = parsed.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))

          console.log(`📂 [ElevenLabs] Loaded saved transcript (${processedTranscript.length} messages)`)
          setTranscript(processedTranscript)
        }
      }
    } catch (error) {
      console.error("❌ [ElevenLabs] Failed to load saved transcript:", error)
    }
  }, [isMounted])

  // Start the call
  const startCall = useCallback(
    async (context: ChatContext) => {
      console.log("🔄 [ElevenLabs] Starting call...")

      // Don't start if not mounted or already active or agent ended call
      if (!isMounted) {
        console.warn("⚠️ [ElevenLabs] Not mounted yet, cannot start call")
        return ""
      }

      // Don't start if already active
      if (isCallActive) {
        console.warn("⚠️ [ElevenLabs] Call already active, not starting another")
        return conversationIdRef.current || ""
      }

      // Don't start if agent ended the call
      if (agentEndedCall) {
        console.warn("⚠️ [ElevenLabs] Agent ended the call, not starting another")
        return ""
      }

      try {
        // Request microphone access first
        await navigator.mediaDevices.getUserMedia({ audio: true })

        setIsCallActive(true)
        console.log("🚀 [ElevenLabs] Starting ElevenLabs conversation session...")

        // Log the context data
        console.log(`📊 [ElevenLabs] Context data:`)
        console.log(`- candidateName: ${context.firstName}`)
        console.log(`- hiringCompanyName: ${context.companyName}`)

        // Get the Gemini response directly
        let systemInstruction = ""

        // First try to get from Blob
        const blobUrl = getLocalStorageItem("geminiResponseUrl")
        if (blobUrl) {
          const result = await fetchFromBlob(blobUrl)
          if (result.success) {
            systemInstruction = result.content
          }
        }

        // Fallback to localStorage
        if (!systemInstruction) {
          const localStorageResponse = getLocalStorageItem("geminiResponse")
          if (localStorageResponse) {
            systemInstruction = localStorageResponse
          }
        }

        if (!systemInstruction) {
          throw new Error("Could not load interview instructions")
        }

        // Start the conversation session with ElevenLabs
        const convId = await conversation.startSession({
          agentId,
          dynamicVariables: {
            systemInstruction, // The Gemini-generated interview instructions
            candidateName: context.firstName, // From the form
            hiringCompanyName: context.companyName, // From the form
          },
        })

        conversationIdRef.current = convId
        console.log(`✅ [ElevenLabs] Conversation started with ID: ${convId}`)

        return convId
      } catch (error) {
        console.error("❌ [ElevenLabs] Failed to start conversation:", error)
        setIsCallActive(false)
        setError(`Failed to start the interview: ${error}`)
        return ""
      }
    },
    [isMounted, conversation, agentId, isCallActive, agentEndedCall],
  )

  // Update the endCall function to be more robust
  const endCall = useCallback(() => {
    console.log("🔄 [ElevenLabs] Ending call...")

    if (!isMounted) {
      console.warn("⚠️ [ElevenLabs] Not mounted yet, cannot end call")
      return
    }

    try {
      // Check if conversation is connected before ending
      if (conversation.status === "connected") {
        console.log("🔄 [ElevenLabs] Calling endSession on active conversation")

        // Try to end the session
        try {
          conversation.endSession()
          console.log("✅ [ElevenLabs] Successfully called endSession")
        } catch (endSessionError) {
          console.error("❌ [ElevenLabs] Error in endSession:", endSessionError)
        }
      } else {
        console.log("ℹ️ [ElevenLabs] No active conversation to end (status: " + conversation.status + ")")
      }

      // Always reset local state regardless of connection status
      setIsCallActive(false)
      conversationIdRef.current = null
      console.log("✅ [ElevenLabs] Call ended and state reset")
    } catch (error) {
      console.error("❌ [ElevenLabs] Error ending call:", error)
      // Still reset state even if there's an error
      setIsCallActive(false)
      conversationIdRef.current = null
    }
  }, [isMounted, conversation])

  // Toggle microphone (real implementation)
  const toggleMicrophone = useCallback(() => {
    console.log("🎤 [ElevenLabs] Toggle microphone functionality")
    // The ElevenLabs SDK handles microphone toggling internally
  }, [])

  // Reset the agent ended call state
  const resetAgentEndedCall = useCallback(() => {
    setAgentEndedCall(false)
  }, [])

  return {
    transcript,
    isSpeaking,
    isCallActive,
    isLoading,
    error,
    agentEndedCall,
    startCall,
    endCall,
    toggleMicrophone,
    resetAgentEndedCall,
  }
}

