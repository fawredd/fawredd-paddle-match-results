import { MatchResultsTracker } from "@/components/match-results-tracker"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6">Paddle Match Results</h1>
      <MatchResultsTracker />
    </main>
  )
}
