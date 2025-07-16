// src/lib/match-logic.ts

import { NUM_SETS, NUM_PLAYERS, APP_VERSION } from "../../lib/constants";
import { MatchResults, Player } from "@/components/match-results-tracker/types";

/**
 * @description Sanitizes a string to prevent basic HTML injection.
 * @param {string} input - The string to sanitize.
 * @returns {string} The sanitized string.
 */
export const sanitizeInput = (input: string): string => {
  // This is a basic sanitizer. For security-critical apps, use a library like DOMPurify.
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
};

/**
 * @description Ensures the results data from storage or import is complete and migrates old formats.
 * @param {Partial<MatchResults>} data - The potentially incomplete data.
 * @returns {MatchResults} The validated and completed data object.
 */
export const ensureDataIntegrity = (
  data: Partial<MatchResults>
): MatchResults => {
  // Basic validation
  if (
    !data ||
    !data.players ||
    !Array.isArray(data.players) ||
    data.players.length !== NUM_PLAYERS
  ) {
    throw new Error("Invalid data structure.");
  }

  const migratedData: MatchResults = {
    players: data.players,
    version: data.version || APP_VERSION,
    lastUpdated: Date.now(),
    teamHistory: data.teamHistory || Array.from({ length: NUM_SETS }, () => []),
  };

  // If team history was missing, build it from existing team data
  if (!data.teamHistory) {
    for (let setIndex = 0; setIndex < NUM_SETS; setIndex++) {
      const teamMembers = migratedData.players
        .map((player, playerIndex) => ({
          playerIndex,
          isTeam: player.sets[setIndex].team,
        }))
        .filter((item) => item.isTeam)
        .map((item) => item.playerIndex);

      if (teamMembers.length === 2) {
        migratedData.teamHistory[setIndex] = teamMembers.sort((a, b) => a - b);
      }
    }
  }
  return migratedData;
};

/**
 * @description Recalculates the total score for each player.
 * @param {Player[]} players - The array of players.
 * @returns {Player[]} The players array with updated totals.
 */
export const recalculatePlayerTotals = (players: Player[]): Player[] => {
  return players.map((player) => ({
    ...player,
    total: player.sets.reduce((total, set) => total + set.sum, 0),
  }));
};

/**
 * @description Calculates scores for a set based on team assignments and the first player's score.
 * @param {Player[]} players - The array of players.
 * @param {number} setIndex - The index of the set to calculate.
 * @returns {Player[]} The players array with updated set scores.
 */
export const calculateSetScores = (
  players: Player[],
  setIndex: number
): Player[] => {
  const newPlayers = JSON.parse(JSON.stringify(players)); // Deep copy to avoid mutation
  const teamCount = newPlayers.filter(
    (p: Player) => p.sets[setIndex].team
  ).length;

  // If teams aren't fully set (not 2 players), reset scores for others
  if (teamCount !== 2) {
    for (let i = 1; i < NUM_PLAYERS; i++) {
      newPlayers[i].sets[setIndex] = {
        won: 0,
        lost: 0,
        sum: 0,
        team: newPlayers[i].sets[setIndex].team,
      };
    }
    return newPlayers;
  }

  const firstPlayer = newPlayers[0];
  const { won: firstPlayerWon, lost: firstPlayerLost } =
    firstPlayer.sets[setIndex];
  const isFirstPlayerInTeam = firstPlayer.sets[setIndex].team;

  // Set scores for all other players
  for (let i = 1; i < NUM_PLAYERS; i++) {
    const player = newPlayers[i];
    const isOnSameTeam = player.sets[setIndex].team === isFirstPlayerInTeam;

    if (isOnSameTeam) {
      player.sets[setIndex].won = firstPlayerWon;
      player.sets[setIndex].lost = firstPlayerLost;
    } else {
      player.sets[setIndex].won = firstPlayerLost;
      player.sets[setIndex].lost = firstPlayerWon;
    }
    player.sets[setIndex].sum =
      player.sets[setIndex].won - player.sets[setIndex].lost;
  }

  return newPlayers;
};
