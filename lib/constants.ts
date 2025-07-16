// src/lib/constants.ts
import type {
  Player,
  MatchResults,
} from "@/components/match-results-tracker/types";

export const APP_VERSION = "1.0.0";
export const STORAGE_KEY = "paddleMatchResults";
export const NUM_PLAYERS = 4;
export const NUM_SETS = 3;

/**
 * @description Generates the initial state for the match results tracker.
 * @returns {MatchResults} The initial state object.
 */
export const createInitialState = (): MatchResults => ({
  players: Array.from({ length: NUM_PLAYERS }, () => ({
    name: "",
    sets: Array.from({ length: NUM_SETS }, () => ({
      won: 0,
      lost: 0,
      sum: 0,
      team: false,
    })),
    total: 0,
  })),
  teamHistory: Array.from({ length: NUM_SETS }, () => []),
  lastUpdated: Date.now(),
  version: APP_VERSION,
});
