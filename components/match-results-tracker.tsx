"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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
}

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
}

export function MatchResultsTracker() {
  const [results, setResults] = useState<MatchResults>(INITIAL_STATE)
  const [activeTab, setActiveTab] = useState("set1")

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem("paddleMatchResults")
    if (savedResults) {
      setResults(JSON.parse(savedResults))
    }
  }, [])

  // Save data to localStorage whenever results change
  useEffect(() => {
    localStorage.setItem("paddleMatchResults", JSON.stringify(results))
  }, [results])

  const handleNameChange = (index: number, name: string) => {
    const newResults = { ...results }
    newResults.players[index].name = name
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
    // Fix: Use isNaN to check if the value is not a number, rather than relying on falsy check
    const numValue = value === "" ? 0 : Number.isNaN(Number.parseInt(value)) ? 0 : Number.parseInt(value)

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
    if (confirm("Are you sure you want to reset all results?")) {
      setResults(INITIAL_STATE)
      localStorage.removeItem("paddleMatchResults")
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

  return (
    <div className="space-y-6">
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
                <div className="grid grid-cols-5 gap-2 mb-2 text-center text-sm font-medium">
                  <div>Player</div>
                  <div>Won</div>
                  <div>Lost</div>
                  <div>Sum</div>
                  <div>Team</div>
                </div>

                {/* First player row - editable */}
                <div className="grid grid-cols-5 gap-2 mb-3 items-center bg-slate-50 p-2 rounded-md">
                  <div>
                    <Input
                      type="text"
                      value={results.players[0].name}
                      onChange={(e) => handleNameChange(0, e.target.value)}
                      placeholder="Player 1"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={results.players[0].sets[setIndex].won.toString()}
                      onChange={(e) => handleFirstPlayerScoreChange(setIndex, "won", e.target.value)}
                      className="h-9 text-center"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={results.players[0].sets[setIndex].lost.toString()}
                      onChange={(e) => handleFirstPlayerScoreChange(setIndex, "lost", e.target.value)}
                      className="h-9 text-center"
                    />
                  </div>
                  <div className="flex justify-center items-center">
                    <span className="text-lg font-semibold">{results.players[0].sets[setIndex].sum}</span>
                  </div>
                  <div className="flex justify-center">
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
                    <div key={playerIndex} className="grid grid-cols-5 gap-2 mb-3 items-center">
                      <div>
                        <Input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleNameChange(playerIndex, e.target.value)}
                          placeholder={`Player ${playerIndex + 1}`}
                          className="h-9"
                        />
                      </div>
                      <div className="flex justify-center items-center">
                        <span className="text-lg">{player.sets[setIndex].won}</span>
                      </div>
                      <div className="flex justify-center items-center">
                        <span className="text-lg">{player.sets[setIndex].lost}</span>
                      </div>
                      <div className="flex justify-center items-center">
                        <span className="text-lg font-semibold">{player.sets[setIndex].sum}</span>
                      </div>
                      <div className="flex justify-center">
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
                  <div className="font-medium">{player.name || `Player ${index + 1}`}</div>
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

              <Button variant="destructive" className="w-full mt-6" onClick={resetResults}>
                Reset All Results
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
