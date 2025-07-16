import { MatchResultsTracker } from "@/components/match-results-tracker"
import { Toaster } from "@/components/ui/sonner"
import Image from "next/image"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-md">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Image src="/favicon.ico" alt="Paddle Match Logo" width={32} height={32} className="rounded-sm" />
        <h1 className="text-2xl font-bold text-center">Paddle Match Results</h1>
      </div>
      <MatchResultsTracker />
      <Toaster />
    </main>
  )
}
