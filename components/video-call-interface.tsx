"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoOff, Clock, Mic, AlertCircle, Loader2, CheckCircle } from "lucide-react"
import { AudioVisualization } from "@/components/audio-visualization"
import { TranscriptView } from "@/components/transcript-view"
import { useRouter } from "next/navigation"
import { useConversation } from "@/hooks/use-conversation"
import { CallControls } from "@/components/call-controls"
import { useMobile } from "@/hooks/use-mobile"
import { Day0Logo } from "@/components/day0-logo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

// Safe localStorage access function
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error)
    return null
  }
}

// Component for displaying loading state
function LoadingState({ message = "Initializing Interview" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mb-4 mx-auto text-primary" />
        <h2 className="text-xl font-medium mb-2">{message}</h2>
        <p className="text-muted-foreground">Please wait while we set up your interview session...</p>
      </div>
    </div>
  )
}

// Component for displaying error state
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <Alert variant="destructive" className="max-w-md mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button onClick={onRetry}>Return to Setup</Button>
    </div>
  )
}

// Component for displaying call ended state
function CallEndedState({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold">Interview Completed</h2>
        <p className="text-muted-foreground">
          The AI interviewer has concluded the interview. Thank you for your participation.
        </p>
        <Button onClick={onReturn} className="w-full">
          Return to Home
        </Button>
      </div>
    </div>
  )
}

export function VideoCallInterface() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [candidateSpeaking, setCandidateSpeaking] = useState(false)
  const [candidateName, setCandidateName] = useState("Candidate")
  const isMobile = useMobile()
  const [interviewTime, setInterviewTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [chatContext, setChatContext] = useState<any>(null)
  const [cameraInitialized, setCameraInitialized] = useState(false)
  const [isCallEnding, setIsCallEnding] = useState(false)

  // Get conversation hook
  const {
    transcript,
    isSpeaking,
    isCallActive,
    isLoading: conversationLoading,
    error: conversationError,
    agentEndedCall,
    startCall,
    endCall,
    toggleMicrophone,
    resetAgentEndedCall,
  } = useConversation()

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    console.log("✅ [VideoCall] Component mounted")
  }, [])

  // Load chat context from localStorage
  useEffect(() => {
    if (!isMounted) return

    try {
      const chatContextStr = getLocalStorageItem("chatContext")

      if (!chatContextStr) {
        console.error("❌ [VideoCall] Missing chat context in localStorage")
        setError("Missing interview data. Please return to the setup page.")
        setIsLoading(false)
        return
      }

      // Get candidate name from context
      const context = JSON.parse(chatContextStr)
      setChatContext(context)

      if (context.name) {
        setCandidateName(context.name)
      }
    } catch (e) {
      console.error("❌ [VideoCall] Error loading chat context:", e)
      setError("Failed to load interview data. Please return to setup.")
      setIsLoading(false)
    }
  }, [isMounted])

  // Initialize camera
  useEffect(() => {
    if (!isMounted || isCallEnding) return

    const initCamera = async () => {
      try {
        // First try to get both video and audio
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })

          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch((e) => console.error("❌ [VideoCall] Error playing video:", e))
            }
          }

          setCameraInitialized(true)
        } catch (error) {
          console.error("❌ [VideoCall] Error accessing camera and microphone:", error)

          // Fallback to just audio if video fails
          try {
            await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            })

            setVideoEnabled(false)
            setCameraInitialized(true)
          } catch (audioError) {
            console.error("❌ [VideoCall] Error accessing audio:", audioError)
            setVideoEnabled(false)
            setCameraInitialized(true) // Still mark as initialized so we can proceed
          }
        }
      } catch (error) {
        console.error("❌ [VideoCall] Error in camera initialization:", error)
        setVideoEnabled(false)
        setCameraInitialized(true) // Still mark as initialized so we can proceed
      }
    }

    initCamera()
  }, [isMounted, isCallEnding])

  // Start the call when context is loaded and camera is initialized
  useEffect(() => {
    // Don't start if not mounted, missing context, camera not initialized, or call is ending
    if (!isMounted || !chatContext || !cameraInitialized || isCallEnding || agentEndedCall) {
      console.log("⚠️ [VideoCall] Skipping call start due to conditions not met", {
        isMounted,
        hasContext: !!chatContext,
        cameraInitialized,
        isCallEnding,
        agentEndedCall,
      })
      return
    }

    // Add a flag to prevent multiple call starts
    let isStartingCall = false

    const startInterview = async () => {
      // Skip if already starting or ending
      if (isStartingCall || isCallEnding) return

      try {
        isStartingCall = true
        console.log("🚀 [VideoCall] Starting call with ElevenLabs...")
        await startCall(chatContext)
        setIsLoading(false)
      } catch (error) {
        console.error("❌ [VideoCall] Error starting call:", error)
        setError("Failed to start the interview. Please try again.")
        setIsLoading(false)
      }
    }

    startInterview()

    // Cleanup function
    return () => {
      console.log("🧹 [VideoCall] Cleaning up call start effect")
      isStartingCall = false
    }
  }, [isMounted, chatContext, cameraInitialized, startCall, isCallEnding, agentEndedCall])

  // Start interview timer and simulate candidate speaking
  useEffect(() => {
    if (!isMounted || isLoading || isCallEnding || agentEndedCall) return

    // Interview timer
    const timer = setInterval(() => {
      setInterviewTime((prev) => prev + 1)
    }, 1000)

    // Simulate candidate speaking (for demo purposes)
    const speakingSimulator = setInterval(() => {
      // Randomly toggle speaking state every 3-7 seconds
      if (Math.random() > 0.7) {
        setCandidateSpeaking((prev) => !prev)
      }
    }, 3000)

    return () => {
      clearInterval(timer)
      clearInterval(speakingSimulator)
    }
  }, [isMounted, isLoading, isCallEnding, agentEndedCall])

  // Check for conversation errors
  useEffect(() => {
    if (conversationError && !error) {
      setError(conversationError)
      setIsLoading(false)
    }
  }, [conversationError, error])

  // Cleanup camera when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Handle ending the call
  const handleEndCall = useCallback(() => {
    console.log("🔴 [VideoCall] Ending call")
    setIsCallEnding(true)

    try {
      // End the call
      endCall()

      // Stop all media tracks
      if (videoRef.current?.srcObject instanceof MediaStream) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => {
          track.stop()
        })
        videoRef.current.srcObject = null
      }

      // Clear camera initialization state
      setCameraInitialized(false)

      // Navigate away immediately without timeout
      router.push("/")
    } catch (error) {
      console.error("❌ [VideoCall] Error ending call:", error)
      // Still navigate away even if there's an error
      router.push("/")
    }
  }, [endCall, router])

  // Handle returning to setup
  const handleReturnToSetup = useCallback(() => {
    router.push("/onboarding")
  }, [router])

  // Handle returning to home after agent ends call
  const handleReturnToHome = useCallback(() => {
    // Reset the agent ended call state
    resetAgentEndedCall()

    // Stop all media tracks
    if (videoRef.current?.srcObject instanceof MediaStream) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => {
        track.stop()
      })
      videoRef.current.srcObject = null
    }

    // Navigate to home
    router.push("/")
  }, [resetAgentEndedCall, router])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    setAudioEnabled(!audioEnabled)
    toggleMicrophone()
  }, [audioEnabled, toggleMicrophone])

  // Format interview time as mm:ss
  const formatTime = useCallback(() => {
    const minutes = Math.floor(interviewTime / 60)
    const seconds = interviewTime % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [interviewTime])

  // Don't render anything during SSR
  if (!isMounted) {
    return null
  }

  // Show error state
  if (error) {
    return <ErrorState message={error} onRetry={handleReturnToSetup} />
  }

  // Show call ended state if agent ended the call
  if (agentEndedCall) {
    return <CallEndedState onReturn={handleReturnToHome} />
  }

  // Show loading state
  if (isLoading || conversationLoading || isCallEnding) {
    return <LoadingState message={isCallEnding ? "Ending Interview..." : "Initializing Interview"} />
  }

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Header - fixed height */}
      <div className="flex items-center justify-between p-4 border-b shrink-0 bg-card shadow-sm">
        <Day0Logo />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-white bg-red-600 px-3 py-1 rounded-md shadow-sm">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{formatTime()}</span>
          </div>
          <div className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-md">
            Interview in progress
          </div>
        </div>
      </div>

      {/* Main content - takes remaining height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 flex-1 min-h-0 overflow-hidden">
        {/* Human video section */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col shadow-md">
          <CardContent className="p-0 relative flex-1 min-h-0 flex items-center justify-center bg-black">
            {videoEnabled ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />

                {/* Candidate name and speaking indicator overlay */}
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                      {candidateName
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </div>
                    <span className="text-white font-medium">{candidateName}</span>
                  </div>

                  {candidateSpeaking && (
                    <div className="flex items-center gap-2 bg-white/20 px-2 py-1 rounded-full">
                      <div className="relative h-4 w-4">
                        <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse"></div>
                        <Mic className="relative h-4 w-4 text-white" />
                      </div>
                      <span className="text-white text-xs">Speaking</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <VideoOff className="h-16 w-16 mb-2" />
                <p>Camera is turned off</p>
              </div>
            )}

            {/* Controls overlay */}
            <div className={`absolute bottom-${isMobile ? "4" : "6"} left-0 right-0 flex justify-center`}>
              <div className={isMobile ? "" : "bg-black/40 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg"}>
                <CallControls audioEnabled={audioEnabled} toggleAudio={toggleAudio} endCall={handleEndCall} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI and controls section */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Tabs section - takes remaining height */}
          <Tabs defaultValue="transcript" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="grid grid-cols-2 shrink-0">
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="info">Interview Info</TabsTrigger>
            </TabsList>
            <TabsContent value="transcript" className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <Card className="flex-1 overflow-hidden flex flex-col min-h-0 shadow-md">
                <TranscriptView transcript={transcript} />
              </Card>
            </TabsContent>
            <TabsContent value="info" className="overflow-auto">
              <Card className="p-4 shadow-md">
                <h3 className="font-medium mb-2">About this interview</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This interview is being conducted by our AI assistant to assess candidate qualifications.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="font-medium">Senior Developer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Model:</span>
                    <span>ElevenLabs Professional</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recording:</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* AI interviewer info */}
          <Card className="shrink-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AudioVisualization isSpeaking={isSpeaking} />
                  <h3 className="font-medium">AI Interviewer</h3>
                </div>
                {isSpeaking && (
                  <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Speaking</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

