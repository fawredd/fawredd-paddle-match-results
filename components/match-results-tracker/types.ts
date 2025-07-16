export type Player = {
  name: string
  sets: {
    won: number
    lost: number
    sum: number
    team: boolean
  }[]
  total: number
}

export type MatchResults = {
  players: Player[]
  lastUpdated: number // Timestamp for data integrity
  version: string // For future compatibility
  teamHistory: number[][][] // Track team combinations across sets
}