"use client"

import { Suspense, useEffect, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

// Import the VideoCallInterface component with no SSR
const VideoCallInterface = dynamic(
  () => import("@/components/video-call-interface").then((mod) => mod.VideoCallInterface),
  {
    ssr: false,
    loading: () => <LoadingState />,
  },
)

function LoadingState() {
  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mb-4 mx-auto text-primary" />
        <h2 className="text-xl font-medium mb-2">Loading Interview</h2>
        <p className="text-muted-foreground">Please wait while we prepare your interview...</p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button onClick={onRetry} className="w-full">
          Return to Setup
        </Button>
      </div>
    </div>
  )
}

export default function CallPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("An unexpected error occurred.")

  // Only render the component after mounting on the client
  useEffect(() => {
    try {
      setMounted(true)

      // Check if we have the required data in localStorage
      if (typeof window !== "undefined") {
        const geminiResponseUrl = localStorage.getItem("geminiResponseUrl")
        const geminiResponse = localStorage.getItem("geminiResponse")
        const chatContext = localStorage.getItem("chatContext")

        if ((!geminiResponseUrl && !geminiResponse) || !chatContext) {
          setHasError(true)
          setErrorMessage("Missing interview data. Please return to the setup page.")
        }
      }

      // Add global error handler
      const errorHandler = (event: ErrorEvent) => {
        console.error("Caught global error:", event.error)
        setHasError(true)
        setErrorMessage("There was an error initializing the AI Interview. Please try again.")
      }

      window.addEventListener("error", errorHandler)

      return () => {
        window.removeEventListener("error", errorHandler)
      }
    } catch (error) {
      console.error("Error in call page:", error)
      setHasError(true)
    }
  }, [])

  const handleReturnToSetup = () => {
    router.push("/onboarding")
  }

  if (!mounted) {
    return <LoadingState />
  }

  if (hasError) {
    return <ErrorState message={errorMessage} onRetry={handleReturnToSetup} />
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-background">
      <Suspense fallback={<LoadingState />}>
        <VideoCallInterface />
      </Suspense>
    </div>
  )
}

