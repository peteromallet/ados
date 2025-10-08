import { Suspense } from 'react'
import { Hero } from '@/components/Hero'

export default function Home() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-black" />}>
      <Hero />
    </Suspense>
  )
}

