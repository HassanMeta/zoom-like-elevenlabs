"use client"

export const useConversation = () => {
  return {
    status: "disconnected",
    isSpeaking: false,
    startSession: async () => {},
    endSession: () => {},
  }
}

