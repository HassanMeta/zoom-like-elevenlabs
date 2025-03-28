"use client"

import { cn } from "@/lib/utils"
import { User } from "lucide-react"

interface AudioVisualizationProps {
  isSpeaking: boolean
  className?: string
}

export function AudioVisualization({ isSpeaking, className }: AudioVisualizationProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-8 h-8 rounded-full",
        isSpeaking ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      <User className="h-4 w-4" />
      {isSpeaking && (
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
      )}
    </div>
  )
}

