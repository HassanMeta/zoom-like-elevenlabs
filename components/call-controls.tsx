"use client"

import { Button } from "@/components/ui/button"
import { Mic, MicOff, Phone } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"

interface CallControlsProps {
  audioEnabled: boolean
  toggleAudio: () => void
  endCall: () => void
}

export function CallControls({ audioEnabled, toggleAudio, endCall }: CallControlsProps) {
  const [isEndingCall, setIsEndingCall] = useState(false)

  // Handle end call with state to prevent multiple clicks
  const handleEndCall = () => {
    if (isEndingCall) return // Prevent multiple clicks

    setIsEndingCall(true)
    console.log("🔄 [CallControls] End call button clicked, disabling button")

    // Call the provided endCall function
    endCall()
  }

  return (
    <TooltipProvider>
      <div className="flex gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={audioEnabled ? "outline" : "secondary"}
              size="icon"
              className="h-10 w-10 rounded-full shadow-sm"
              onClick={toggleAudio}
              disabled={isEndingCall}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{audioEnabled ? "Mute microphone" : "Unmute microphone"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="h-10 w-10 rounded-full shadow-sm"
              onClick={handleEndCall}
              disabled={isEndingCall}
            >
              <Phone className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>End interview</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

