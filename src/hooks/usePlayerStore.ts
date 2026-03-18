import { useState, useCallback } from 'react';
import type { AdaptiveState } from '../lib/adaptive';
import type { AttemptRecord } from '../lib/scoring';

export interface PlayerData {
  name: string;
  avatar: string;
  settings: {
    maxNum: number;
    problemType: string;
    soundOn: boolean;
    sessionMode: 'count' | 'timed';
    sessionCount: number;   // number of problems if count mode
    sessionMinutes: number; // minutes if timed mode
  };
  adaptiveState: Record<string, AdaptiveState>; // keyed by problemType
  history: AttemptRecord[];
  bestP80: number | null;
}

const STORAGE_KEY = 'mathgame_players';
const AVATARS = ['🦊', '🐱', '🐶', '🦁', '🐸', '🐼', '🦄', '🐲', '🦋', '🐙', '🦖', '🐵'];

export function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export const ALL_AVATARS = AVATARS;

function loadPlayers(): Record<string, PlayerData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePlayers(players: Record<string, PlayerData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

function defaultPlayer(name: string, avatar: string): PlayerData {
  return {
    name,
    avatar,
    settings: {
      maxNum: 13,
      problemType: 'multiplication',
      soundOn: true,
      sessionMode: 'count',
      sessionCount: 20,
      sessionMinutes: 2,
    },
    adaptiveState: {},
    history: [],
    bestP80: null,
  };
}

export function usePlayerStore() {
  const [players, setPlayers] = useState<Record<string, PlayerData>>(loadPlayers);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const p = loadPlayers();
    setPlayers(p);
    return p;
  }, []);

  const createPlayer = useCallback((name: string, avatar: string) => {
    const p = loadPlayers();
    const id = name.toLowerCase().trim();
    if (p[id]) return false;
    p[id] = defaultPlayer(name, avatar);
    savePlayers(p);
    setPlayers(p);
    setCurrentPlayer(id);
    return true;
  }, []);

  const selectPlayer = useCallback((id: string) => {
    setCurrentPlayer(id);
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<PlayerData['settings']>) => {
      if (!currentPlayer) return;
      const p = loadPlayers();
      if (!p[currentPlayer]) return;
      p[currentPlayer].settings = { ...p[currentPlayer].settings, ...settings };
      savePlayers(p);
      setPlayers(p);
    },
    [currentPlayer]
  );

  const saveAdaptiveState = useCallback(
    (problemType: string, state: AdaptiveState) => {
      if (!currentPlayer) return;
      const p = loadPlayers();
      if (!p[currentPlayer]) return;
      p[currentPlayer].adaptiveState[problemType] = state;
      savePlayers(p);
    },
    [currentPlayer]
  );

  const saveSessionResults = useCallback(
    (attempts: AttemptRecord[], sessionP80: number) => {
      if (!currentPlayer) return;
      const p = loadPlayers();
      if (!p[currentPlayer]) return;
      p[currentPlayer].history = [
        ...p[currentPlayer].history,
        ...attempts,
      ];
      // keep only last 500 attempts to avoid localStorage bloat
      if (p[currentPlayer].history.length > 500) {
        p[currentPlayer].history = p[currentPlayer].history.slice(-500);
      }
      const best = p[currentPlayer].bestP80;
      if (best === null || sessionP80 < best) {
        p[currentPlayer].bestP80 = sessionP80;
      }
      savePlayers(p);
      setPlayers(p);
    },
    [currentPlayer]
  );

  const deletePlayer = useCallback((id: string) => {
    const p = loadPlayers();
    delete p[id];
    savePlayers(p);
    setPlayers(p);
    if (currentPlayer === id) setCurrentPlayer(null);
  }, [currentPlayer]);

  const player = currentPlayer ? players[currentPlayer] : null;

  return {
    players,
    playerList: Object.entries(players).map(([id, p]) => ({ id, ...p })),
    currentPlayer,
    player,
    createPlayer,
    selectPlayer,
    updateSettings,
    saveAdaptiveState,
    saveSessionResults,
    deletePlayer,
    refresh,
  };
}
