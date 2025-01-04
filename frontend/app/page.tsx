'use client'

import dynamic from 'next/dynamic'

const Whiteboard = dynamic(() => import("./components/Whiteboard"), {
  ssr: false,
  loading: () => <p>Loading whiteboard...</p>
})

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Collaborative Whiteboard</h1>
      <Whiteboard />
    </main>
  )
}

