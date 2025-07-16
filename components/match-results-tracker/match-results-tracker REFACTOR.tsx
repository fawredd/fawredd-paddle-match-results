"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useMatchTracker } from "./useMatchTracker" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowDown, ArrowUp, Download, Minus, Upload } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { InstallButton } from "../install-button"
import { NUM_SETS } from "@/lib/constants"

export function MatchResultsTracker() {
  const [activeTab, setActiveTab] = useState("set1")
  
  const {
    results,
    isLoading,
    handleNameChange,
    handleTeamChange,
    handleFirstPlayerScoreChange,
    resetResults,
  } = useMatchTracker()

  /**
   * @description Memoized calculation to check if teams are valid across all sets.
   * @returns {boolean} True if all sets have exactly 2 players per team.
   */
  const areTeamsValid = useMemo(() => {
    for (let setIndex = 0; setIndex < NUM_SETS; setIndex++) {
      const teamCount = results.players.filter((player) => player.sets[setIndex].team).length
      if (teamCount !== 2) {
        return false
      }
    }
    return true
  }, [results.players])

  /**
   * @description Memoized calculation for player rankings and tie detection.
   */
  const rankingsAndTies = useMemo(() => {
    const defaultReturn = {
      sortedPlayers: [...results.players],
      rankings: null,
      hasWinnerTie: false,
      hasLoserTie: false,
      winnerTiedPlayers: [],
      loserTiedPlayers: [],
    }

    // Don't calculate if teams are invalid or names are missing
    if (!areTeamsValid || !results.players.every((p) => p.name)) {
      return defaultReturn
    }

    const sorted = [...results.players].sort((a, b) => b.total - a.total)

    const hasWinnerTie = sorted[0].total === sorted[1].total
    const winnerTiedPlayers = hasWinnerTie ? sorted.filter((p) => p.total === sorted[0].total).map((p) => p.name) : []

    const hasLoserTie = sorted[2].total === sorted[3].total
    const loserTiedPlayers = hasLoserTie ? sorted.filter((p) => p.total === sorted[3].total).map((p) => p.name) : []

    const finalRankings =
      !hasWinnerTie && !hasLoserTie
        ? {
            moveUp: sorted[0],
            stayOne: sorted[1],
            stayTwo: sorted[2],
            moveDown: sorted[3],
          }
        : null

    return {
      sortedPlayers: sorted,
      rankings: finalRankings,
      hasWinnerTie,
      hasLoserTie,
      winnerTiedPlayers,
      loserTiedPlayers,
    }
  }, [results.players, areTeamsValid])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2 mb-2">
        <InstallButton />
        <ShareButton url="" text="Share" />
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
                    <li>Other players\' scores will be calculated automatically</li>
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
                      <div key={index} className="grid grid-cols-2 gap-2 mb-3 items-center">
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