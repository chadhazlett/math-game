// Persistent high score table (localStorage)

export interface ScoreEntry {
  playerName: string;
  avatar: string;
  p80: number;
  accuracy: number;
  totalProblems: number;
  maxNum: number;
  date: string; // ISO string
}

const STORAGE_KEY = 'mathgame_scores';
const MAX_ENTRIES = 50;

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const scores = loadScores();
  scores.push(entry);
  scores.sort((a, b) => a.p80 - b.p80); // best (lowest) P80 first
  const trimmed = scores.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function getRank(scores: ScoreEntry[], p80: number): number {
  return scores.filter((s) => s.p80 < p80).length + 1;
}
