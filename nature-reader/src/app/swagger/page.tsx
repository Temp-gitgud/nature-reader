'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to prevent SSR (Server-Side Rendering) issues in Next.js
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function Page() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-zinc-800 dark:text-zinc-100 text-center">
          Nature Reader API Playground
        </h1>
        <div className="bg-white dark:bg-white rounded-xl shadow-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <SwaggerUI url="/api/openapi" />
        </div>
      </div>
    </div>
  )
}
