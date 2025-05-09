"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowDown, ArrowUp, Download, Minus, Upload } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { InstallButton } from "./install-button"

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
}

const APP_VERSION = "1.0.0"
const STORAGE_KEY = "paddleMatchResults"

const INITIAL_STATE: MatchResults = {
  players: [
    {
      name: "",
      sets: [
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
      ],
      total: 0,
    },
    {
      name: "",
      sets: [
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
      ],
      total: 0,
    },
    {
      name: "",
      sets: [
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
        { won: 0, lost: 0, sum: 0, team: false },
      ],
      total: 0,
    },
    {
      name: "",
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

export function MatchResultsTracker() {
  const [results, setResults] = useState<MatchResults>(INITIAL_STATE)
  const [activeTab, setActiveTab] = useState("set1")
  const [isLoading, setIsLoading] = useState(true)

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

          setResults(parsedResults)
        } else {
          // Invalid data structure, use initial state
          console.warn("Invalid data structure in localStorage, using default")
          setResults(INITIAL_STATE)
        }
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
      toast({
        title: "Error loading saved data",
        description: "Your previous match data couldn't be loaded. Starting with fresh data.",
        variant: "destructive",
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
      toast({
        title: "Error saving data",
        description: "Your match data couldn't be saved to local storage.",
        variant: "destructive",
      })
    }
  }, [results, isLoading])

  const handleNameChange = (index: number, name: string) => {
    const sanitizedName = sanitizeInput(name)
    const newResults = { ...results }
    newResults.players[index].name = sanitizedName
    setResults(newResults)
  }

  const handleTeamChange = (playerIndex: number, setIndex: number, isTeam: boolean) => {
    const newResults = { ...results }
    newResults.players[playerIndex].sets[setIndex].team = isTeam

    // Auto-calculate scores based on team assignments
    calculateScores(newResults, setIndex)

    // Recalculate totals for all players
    recalculateTotals(newResults)

    setResults(newResults)
  }

  const handleFirstPlayerScoreChange = (setIndex: number, field: "won" | "lost", value: string) => {
    const newResults = { ...results }
    const numValue = validateNumericInput(value)

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
        toast({
          title: "Data reset successful",
          description: "All match data has been cleared.",
        })
      } catch (error) {
        console.error("Error clearing localStorage:", error)
        toast({
          title: "Error clearing data",
          description: "There was a problem clearing your data.",
          variant: "destructive",
        })
      }
    }
  }

  // Export data to a file
  const exportData = () => {
    try {
      const dataStr = JSON.stringify(results, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileDefaultName = `paddle-match-results-${new Date().toISOString().slice(0, 10)}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast({
        title: "Export successful",
        description: "Your match data has been exported to a file.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export failed",
        description: "There was a problem exporting your data.",
        variant: "destructive",
      })
    }
  }

  // Import data from a file
  const importData = () => {
    try {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"

      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement
        if (!target.files?.length) return

        const file = target.files[0]
        const reader = new FileReader()

        reader.onload = (event) => {
          try {
            const content = event.target?.result as string
            const importedData = JSON.parse(content) as MatchResults

            // Validate imported data
            if (
              !importedData ||
              !importedData.players ||
              !Array.isArray(importedData.players) ||
              importedData.players.length !== 4
            ) {
              throw new Error("Invalid data format")
            }

            // Update with current version and timestamp
            importedData.version = APP_VERSION
            importedData.lastUpdated = Date.now()

            setResults(importedData)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(importedData))

            toast({
              title: "Import successful",
              description: "Your match data has been imported.",
            })
          } catch (error) {
            console.error("Error parsing imported file:", error)
            toast({
              title: "Import failed",
              description: "The selected file contains invalid data.",
              variant: "destructive",
            })
          }
        }

        reader.readAsText(file)
      }

      input.click()
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        title: "Import failed",
        description: "There was a problem importing your data.",
        variant: "destructive",
      })
    }
  }

  // Determine player rankings
  const getPlayerRankings = () => {
    if (!results.players.every((player) => player.name)) {
      return null
    }

    const sortedPlayers = [...results.players].sort((a, b) => b.total - a.total)

    return {
      moveUp: sortedPlayers[0],
      stayOne: sortedPlayers[1],
      stayTwo: sortedPlayers[2],
      moveDown: sortedPlayers[3],
    }
  }

  const rankings = getPlayerRankings()

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Backup</span>
          </Button>
          <Button variant="outline" size="sm" onClick={importData} className="flex items-center gap-1">
            <Upload className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Restore</span>
          </Button>
        </div>
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
                      type="number"
                      min="0"
                      max="99"
                      value={results.players[0].sets[setIndex].won.toString()}
                      onChange={(e) => handleFirstPlayerScoreChange(setIndex, "won", e.target.value)}
                      className="h-9 text-center text-black bg-white font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={results.players[0].sets[setIndex].lost.toString()}
                      onChange={(e) => handleFirstPlayerScoreChange(setIndex, "lost", e.target.value)}
                      className="h-9 text-center text-black bg-white font-medium"
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

                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Instructions:</p>
                  <ol className="list-decimal pl-5 space-y-1 mt-1">
                    <li>Enter all player names</li>
                    <li>Check the team checkbox for players on the same team</li>
                    <li>Enter won/lost games for Player 1 only</li>
                    <li>Other players' scores will be calculated automatically</li>
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
              <div className="grid grid-cols-2 gap-2 mb-4 text-center text-sm font-medium">
                <div>Player</div>
                <div>Total</div>
              </div>
              {results.players.map((player, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 mb-3 items-center">
                  <div className="font-medium text-base">{player.name || `Player ${index + 1}`}</div>
                  <div className="text-center text-lg font-semibold">{player.total}</div>
                </div>
              ))}

              {rankings && (
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
