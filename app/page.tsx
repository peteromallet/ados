import { Suspense } from 'react'
import { Hero } from '@/components/Hero'

// Use ISR for instant page loads
export const revalidate = 60

export default function Home() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-black" />}>
      <Hero />
    </Suspense>
  )
}

