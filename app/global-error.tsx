"use client"

import { useEffect } from "react"

export default function GlobalError({
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
    <html>
      <body className="bg-[#0A0A0A]">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-2xl font-bold text-white">Critical Error</h2>
            <p className="text-zinc-400">Something went seriously wrong.</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
