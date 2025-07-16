"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowDown, ArrowUp, Download, Minus, Upload } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { InstallButton } from "./install-button"
import ShareButton from "./share-button"

type Player = {
  name: string
  sets: {
    won: number
    lost: number
    sum: number
    team: boolean
  }[]
  total: number
}

type MatchResults = {
  players: Player[]
  lastUpdated: number // Timestamp for data integrity
  version: string // For future compatibility
  teamHistory: number[][][] // Track team combinations across sets
}

const APP_VERSION = "1.0.0"
const STORAGE_KEY = "paddleMatchResults"

const INITIAL_STATE: MatchResults = {
  players: [
    {
      name: "Player1",
      sets: [
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
      ],
      total: 0,
    },
    {
      name: "Player2",
      sets: [
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
      ],
      total: 0,
    },
    {
      name: "Player3",
      sets: [
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
      ],
      total: 0,
    },
    {
      name: "Player4",
      sets: [
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
      ],
      total: 0,
    },
  ],
  lastUpdated: Date.now(),
  version: APP_VERSION,
  teamHistory: [[], [], []], // One empty array for each set
}

// Helper function to sanitize input
const sanitizeInput = (input: string): string => {
  // Basic sanitization to prevent XSS
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
}

// Helper function to validate numeric input
const validateNumericInput = (value: string): number => {
  // Ensure value is a non-negative integer
  const num = Number.parseInt(value, 10)
  if (isNaN(num) || num < 0) {
    return 0
  }
  return num
}

// Helper function to check if two arrays have the same elements (regardless of order)
const haveSameElements = (arr1: number[], arr2: number[]): boolean => {
  if (arr1.length !== arr2.length) return false
  const sorted1 = [...arr1].sort()
  const sorted2 = [...arr2].sort()
  return sorted1.every((val, idx) => val === sorted2[idx])
}

export function MatchResultsTracker() {
  const [results, setResults] = useState<MatchResults>(INITIAL_STATE)
  const [activeTab, setActiveTab] = useState("set1")
  const [isLoading, setIsLoading] = useState(true)
  const [hasTie, setHasTie] = useState<{
    hasWinnerTie: boolean
    hasLoserTie: boolean
    winnerTiedPlayers: string[]
    loserTiedPlayers: string[]
  }>({
    hasWinnerTie: false,
    hasLoserTie: false,
    winnerTiedPlayers: [],
    loserTiedPlayers: [],
  })

  // Load data from localStorage on component mount with error handling
  useEffect(() => {
    try {
      setIsLoading(true)
      const savedResults = localStorage.getItem(STORAGE_KEY)

      if (savedResults) {
        const parsedResults = JSON.parse(savedResults) as MatchResults

        // Validate the data structure
        if (
          parsedResults &&
          parsedResults.players &&
          Array.isArray(parsedResults.players) &&
          parsedResults.players.length === 4
        ) {
          // Add any missing fields from newer versions
          if (!parsedResults.version) {
            parsedResults.version = APP_VERSION
          }
          if (!parsedResults.lastUpdated) {
            parsedResults.lastUpdated = Date.now()
          }
          if (!parsedResults.teamHistory) {
            // Initialize team history based on current team assignments
            const teamHistory: number[][][] = [[], [], []]
            for (let setIndex = 0; setIndex < 3; setIndex++) {
              const teamMembers = parsedResults.players
                .map((player, playerIndex) => ({ playerIndex, isTeam: player.sets[setIndex].team }))
                .filter((item) => item.isTeam)
                .map((item) => item.playerIndex)

              if (teamMembers.length === 2) {
                teamHistory[setIndex] = [teamMembers]
              }
            }
            parsedResults.teamHistory = teamHistory
          }

          setResults(parsedResults)
        } else {
          // Invalid data structure, use initial state
          console.warn("Invalid data structure in localStorage, using default")
          setResults(INITIAL_STATE)
        }
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
      toast.error("Error loading saved data",{
        description: "Your previous match data couldn't be loaded. Starting with fresh data.",
      })
      setResults(INITIAL_STATE)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save data to localStorage whenever results change
  useEffect(() => {
    if (isLoading) return // Skip initial load

    try {
      // Update timestamp before saving
      const updatedResults = {
        ...results,
        lastUpdated: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults))
    } catch (error) {
      console.error("Error saving data to localStorage:", error)
      toast.error("Error saving data",{
        description: "Your match data couldn't be saved to local storage.",
      })
    }
  }, [results, isLoading])

  // Check for ties when results change
  useEffect(() => {
    if (isLoading) return

    // Only check for ties if all players have names and teams are valid
    if (!results.players.every((player) => player.name) || !areTeamsValid()) {
      setHasTie({
        hasWinnerTie: false,
        hasLoserTie: false,
        winnerTiedPlayers: [],
        loserTiedPlayers: [],
      })
      return
    }

    // Create a copy of players with their indices for sorting
    const playersWithIndices = results.players.map((player, index) => ({
      ...player,
      index,
    }))

    // Sort players by total in descending order (highest to lowest)
    const sortedPlayers = [...playersWithIndices].sort((a, b) => b.total - a.total)

    // Check for tie at the top (winners)
    const hasWinnerTie = sortedPlayers[0].total === sortedPlayers[1].total
    const winnerTiedPlayers = hasWinnerTie
      ? sortedPlayers.filter((player) => player.total === sortedPlayers[0].total).map((player) => player.name)
      : []

    // Check for tie at the bottom (losers)
    const hasLoserTie = sortedPlayers[2].total === sortedPlayers[3].total
    const loserTiedPlayers = hasLoserTie
      ? sortedPlayers.filter((player) => player.total === sortedPlayers[3].total).map((player) => player.name)
      : []

    // Update tie state
    setHasTie({
      hasWinnerTie,
      hasLoserTie,
      winnerTiedPlayers,
      loserTiedPlayers,
    })

    // Log for debugging
    console.log("Tie check:", {
      hasWinnerTie,
      hasLoserTie,
      winnerTiedPlayers,
      loserTiedPlayers,
      sortedPlayers: sortedPlayers.map((p) => ({ name: p.name, total: p.total })),
    })
  }, [results, isLoading])

  const handleNameChange = (index: number, name: string) => {
    const sanitizedName = sanitizeInput(name)
    const newResults = { ...results }
    newResults.players[index].name = sanitizedName
    setResults(newResults)
  }

  const handleTeamChange = (playerIndex: number, setIndex: number, isChecked: boolean) => {
    const newResults = { ...results }
    // If unchecking, just update and recalculate
    if (!isChecked) {
      // Update the team status
      newResults.players[playerIndex].sets[setIndex].team = false

      // Update team history
      newResults.teamHistory[setIndex] = newResults.teamHistory[setIndex].filter((idx) => idx !== playerIndex)

      // Auto-calculate scores based on team assignments
      calculateScores(newResults, setIndex)

      // Recalculate totals for all players
      recalculateTotals(newResults)

      setResults(newResults)
      return
    }

    // Count how many teams are already checked in this set
    const currentTeamCount = newResults.players.filter(
      (player, idx) => idx !== playerIndex && player.sets[setIndex].team,
    ).length

    // If trying to check a third checkbox, prevent it
    if (currentTeamCount >= 2) {
      toast.error("Team limit reached",{
        description: "Only 2 players can be on a team. Uncheck one player first.",
      })
      return
    }

    // If this is the second player being checked, we need to check for team repetition
    if (currentTeamCount === 1) {
      // Find the other player who is already checked
      const otherPlayerIndex = newResults.players.findIndex(
        (player, idx) => idx !== playerIndex && player.sets[setIndex].team,
      )

      // Create the potential new team
      const newTeam = [playerIndex, otherPlayerIndex].sort()

      // Check if this team combination has been used in previous sets -- THIS NEEDS TO BE FIXED. ALL SETS SHOULD BE CHECKED NOT PREVIOUS ONLY.
      for (let i = 0; i < 3; i++) {
        if (i !== setIndex){
          const previousTeam = newResults.teamHistory[i]
          if (previousTeam.length === 2 && haveSameElements(previousTeam, newTeam)) {
            toast.warning("Team already used",{
              description:
                "This team combination has already been used in a previous set. Please select different players.",
            })
            return
          }
        }
      }

      // Update team history for this set
      newResults.teamHistory[setIndex] = newTeam
    } else if (currentTeamCount === 0) {
      // This is the first player being checked for this set
      newResults.teamHistory[setIndex] = [playerIndex]
    }

    // Update the team status
    newResults.players[playerIndex].sets[setIndex].team = true

    // Auto-calculate scores based on team assignments
    calculateScores(newResults, setIndex)

    // Recalculate totals for all players
    recalculateTotals(newResults)

    setResults(newResults)
  }

  const handleFirstPlayerScoreChange = (setIndex: number, field: "won" | "lost", value: string) => {
    const newResults = { ...results }

    // Clear the input value first to avoid concatenation issues on mobile
    const numValue = value === "" ? 0 : Number.parseInt(value.replace(/^0+/, ""), 10) || 0

    // Update first player's score
    newResults.players[0].sets[setIndex][field] = numValue

    // Calculate sum for first player
    const won = newResults.players[0].sets[setIndex].won
    const lost = newResults.players[0].sets[setIndex].lost
    newResults.players[0].sets[setIndex].sum = won - lost

    // Auto-calculate scores for other players based on team assignments
    calculateScores(newResults, setIndex)

    // Recalculate totals for all players
    recalculateTotals(newResults)

    setResults(newResults)
  }

  const calculateScores = (results: MatchResults, setIndex: number) => {
    // Count team assignments for this set
    const teamCount = results.players.filter((player) => player.sets[setIndex].team).length

    // Only calculate scores if exactly 2 players are on a team
    if (teamCount !== 2) {
      // Reset scores for all players except the first one
      for (let i = 1; i < results.players.length; i++) {
        results.players[i].sets[setIndex].won = 0
        results.players[i].sets[setIndex].lost = 0
        results.players[i].sets[setIndex].sum = 0
      }
      return
    }

    const firstPlayer = results.players[0]
    const firstPlayerWon = firstPlayer.sets[setIndex].won
    const firstPlayerLost = firstPlayer.sets[setIndex].lost
    const firstPlayerTeam = firstPlayer.sets[setIndex].team

    // Determine which players are on the same team as the first player
    for (let i = 1; i < results.players.length; i++) {
      const player = results.players[i]
      const isOnSameTeam = player.sets[setIndex].team === firstPlayerTeam

      if (isOnSameTeam) {
        // Same team as first player, so same scores
        player.sets[setIndex].won = firstPlayerWon
        player.sets[setIndex].lost = firstPlayerLost
      } else {
        // Opposite team, so reverse scores
        player.sets[setIndex].won = firstPlayerLost
        player.sets[setIndex].lost = firstPlayerWon
      }

      // Calculate sum
      player.sets[setIndex].sum = player.sets[setIndex].won - player.sets[setIndex].lost
    }
  }

  const recalculateTotals = (results: MatchResults) => {
    for (let i = 0; i < results.players.length; i++) {
      results.players[i].total = results.players[i].sets.reduce((total, set) => total + set.sum, 0)
    }
  }

  const resetResults = () => {
    if (confirm("Are you sure you want to reset all results? This action cannot be undone.")) {
      setResults(INITIAL_STATE)
      try {
        localStorage.removeItem(STORAGE_KEY)
        setResults(INITIAL_STATE)
        toast.success("Data reset successful",{
          description: "All match data has been cleared.",
        })
      } catch (error) {
        console.error("Error clearing localStorage:", error)
        toast.error("Error clearing data",{
          description: "There was a problem clearing your data.",
        })
      }
    }
  }


  // Determine player rankings
  const getPlayerRankings = () => {
    if (!results.players.every((player) => player.name)) {
      return null
    }

    // Sort players by total in descending order (highest to lowest)
    const sortedPlayers = [...results.players].sort((a, b) => b.total - a.total)

    return {
      moveUp: sortedPlayers[0],
      stayOne: sortedPlayers[1],
      stayTwo: sortedPlayers[2],
      moveDown: sortedPlayers[3],
    }
  }

  const rankings = getPlayerRankings()

  // Check if exactly 2 team checkboxes are checked for each set
  const areTeamsValid = () => {
    for (let setIndex = 0; setIndex < 3; setIndex++) {
      const teamCount = results.players.filter((player) => player.sets[setIndex].team).length
      if (teamCount !== 2) {
        return false
      }
    }
    return true
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2 mb-2">
        <InstallButton />
        <ShareButton url={`https://v0-paddle-match-results.vercel.app/`}/>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="set1">Set 1</TabsTrigger>
          <TabsTrigger value="set2">Set 2</TabsTrigger>
          <TabsTrigger value="set3">Set 3</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {[0, 1, 2].map((setIndex) => (
          <TabsContent key={`set${setIndex + 1}`} value={`set${setIndex + 1}`}>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Set {setIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-2 mb-2 text-center text-sm font-medium">
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2">Won</div>
                  <div className="col-span-2">Lost</div>
                  <div className="col-span-2">Sum</div>
                  <div className="col-span-2">Team</div>
                </div>

                {/* First player row - editable */}
                <div className="grid grid-cols-12 gap-2 mb-3 items-center bg-slate-50 p-2 rounded-md">
                  <div className="col-span-4">
                    <Input
                      type="text"
                      value={results.players[0].name}
                      onChange={(e) => handleNameChange(0, e.target.value)}
                      placeholder="Player 1"
                      className="h-9 text-black bg-white font-medium"
                      maxLength={20}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        results.players[0].sets[setIndex].won === 0
                          ? ""
                          : results.players[0].sets[setIndex].won.toString()
                      }
                      onChange={(e) => handleFirstPlayerScoreChange(setIndex, "won", e.target.value)}
                      className="h-9 text-center text-black bg-white font-medium"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        results.players[0].sets[setIndex].lost === 0
                          ? ""
                          : results.players[0].sets[setIndex].lost.toString()
                      }
                      onChange={(e) => handleFirstPlayerScoreChange(setIndex, "lost", e.target.value)}
                      className="h-9 text-center text-black bg-white font-medium"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center items-center">
                    <span className="text-lg font-semibold">{results.players[0].sets[setIndex].sum}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Checkbox
                      checked={results.players[0].sets[setIndex].team}
                      onCheckedChange={(checked) => handleTeamChange(0, setIndex, checked === true)}
                      id={`team-0-${setIndex}`}
                    />
                  </div>
                </div>

                {/* Other player rows - only name and team are editable */}
                {results.players.slice(1).map((player, idx) => {
                  const playerIndex = idx + 1
                  return (
                    <div key={playerIndex} className="grid grid-cols-12 gap-2 mb-3 items-center">
                      <div className="col-span-4">
                        <Input
                          key={`InputPlayer${playerIndex + 1}`}
                          type="text"
                          value={player.name}
                          onChange={(e) => handleNameChange(playerIndex, e.target.value)}
                          placeholder={`Player ${playerIndex + 1}`}
                          className="h-9 text-black bg-white font-medium"
                          maxLength={20}
                        />
                      </div>
                      <div className="col-span-2 flex justify-center items-center">
                        <span className="text-lg font-medium">{player.sets[setIndex].won}</span>
                      </div>
                      <div className="col-span-2 flex justify-center items-center">
                        <span className="text-lg font-medium">{player.sets[setIndex].lost}</span>
                      </div>
                      <div className="col-span-2 flex justify-center items-center">
                        <span className="text-lg font-semibold">{player.sets[setIndex].sum}</span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <Checkbox
                          checked={player.sets[setIndex].team}
                          onCheckedChange={(checked) => handleTeamChange(playerIndex, setIndex, checked === true)}
                          id={`team-${playerIndex}-${setIndex}`}
                        />
                      </div>
                    </div>
                  )
                })}

                {/* Team selection status */}
                <div className="mt-4 p-2 rounded-md bg-slate-100">
                  <p className="text-sm font-medium">
                    Team Status: {results.players.filter((p) => p.sets[setIndex].team).length} of 2 selected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {results.players.filter((p) => p.sets[setIndex].team).length === 2
                      ? "✓ Teams are properly set"
                      : "⚠️ Exactly 2 players must be on a team"}
                  </p>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Instructions:</p>
                  <ol className="list-decimal pl-5 space-y-1 mt-1">
                    <li>Enter all player names</li>
                    <li>Check the team checkbox for exactly 2 players</li>
                    <li>Enter won/lost games for Player 1 only</li>
                    <li>Other players{`\'`} scores will be calculated automatically</li>
                    <li>The same team combination cannot be repeated across sets</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Final Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!areTeamsValid() ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    Please select exactly 2 players for each team in all sets to see results.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4 text-center text-sm font-medium">
                    <div>Player</div>
                    <div>Total</div>
                  </div>

                  {/* Display players sorted by total in descending order */}
                  {results.players
                    .slice()
                    .sort((a, b) => b.total - a.total)
                    .map((player, index) => (
                      <div key={`result${index}`} className="grid grid-cols-2 gap-2 mb-3 items-center">
                        <div className="font-medium text-base">{player.name || `Player ${index + 1}`}</div>
                        <div className="text-center text-lg font-semibold">{player.total}</div>
                      </div>
                    ))}

                  {/* Tiebreaker alerts */}
                  {(hasTie.hasWinnerTie || hasTie.hasLoserTie) && (
                    <Alert className="mt-6 bg-yellow-50 border-yellow-200">
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-bold">Tiebreaker Needed!</p>

                          {hasTie.hasWinnerTie && (
                            <div className="mb-2">
                              <p className="font-medium">Winner Tie:</p>
                              <p>
                                There is a tie for the winner position between: {hasTie.winnerTiedPlayers.join(", ")}
                              </p>
                              <p className="text-sm mt-1">Please play one more set to determine the winner.</p>
                            </div>
                          )}

                          {hasTie.hasLoserTie && (
                            <div>
                              <p className="font-medium">Loser Tie:</p>
                              <p>There is a tie for the loser position between: {hasTie.loserTiedPlayers.join(", ")}</p>
                              <p className="text-sm mt-1">Please play one more set to determine the loser.</p>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  {!rankings && (
                    <Alert className="mt-6" variant={"destructive"}>
                      <AlertDescription>
                        <p className="text-sm">
                          Please ensure all players have names and teams are properly set in all sets to see rankings.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                  {rankings && !hasTie.hasWinnerTie && !hasTie.hasLoserTie && (
                    <Alert className="mt-6">
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ArrowUp className="text-green-500" />
                            <span>
                              <strong>{rankings.moveUp.name}</strong> moves up
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Minus className="text-gray-500" />
                            <span>
                              <strong>{rankings.stayOne.name}</strong> stays
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Minus className="text-gray-500" />
                            <span>
                              <strong>{rankings.stayTwo.name}</strong> stays
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowDown className="text-red-500" />
                            <span>
                              <strong>{rankings.moveDown.name}</strong> moves down
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                  )}
                </>
              )}

              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-2">
                  Last updated: {new Date(results.lastUpdated).toLocaleString()}
                </p>
                <Button variant="destructive" className="w-full" onClick={resetResults}>
                  Reset All Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
