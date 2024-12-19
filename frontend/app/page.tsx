import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const Whiteboard = dynamic(() => import("./components/Whiteboard"), {
  loading: () => <p>Loading...</p>,
})

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Collaborative Whiteboard</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <Whiteboard />
      </Suspense>
    </main>
  )
}

