"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-[#FAFAFA]">Something went wrong</h2>
        <p className="text-[#A1A1AA] max-w-md">
          An unexpected error occurred. Your data is safe and securely stored.
        </p>
        <Button onClick={reset} className="bg-[#A78BFA] hover:bg-[#8B5CF6]">
          Try Again
        </Button>
      </div>
    </div>
  )
}
