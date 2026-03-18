// Persistent high score table — Firestore (shared) + localStorage (cache/fallback)

import { db, firebaseEnabled } from './firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

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
const COLLECTION = 'scores';

// --- localStorage (cache / offline fallback) ---

function loadLocal(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(scores: ScoreEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

// --- Firestore ---

async function loadFirestore(): Promise<ScoreEntry[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('p80', 'asc'),
      limit(MAX_ENTRIES)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ScoreEntry);
  } catch (err) {
    console.warn('Firestore read failed, using local cache:', err);
    return [];
  }
}

async function saveFirestore(entry: ScoreEntry): Promise<boolean> {
  if (!db) return false;
  try {
    await addDoc(collection(db, COLLECTION), entry);
    return true;
  } catch (err) {
    console.warn('Firestore write failed:', err);
    return false;
  }
}

// --- Public API ---

/** Load scores: tries Firestore first, falls back to localStorage */
export async function loadScores(): Promise<ScoreEntry[]> {
  if (firebaseEnabled) {
    const remote = await loadFirestore();
    if (remote.length > 0) {
      saveLocal(remote); // cache locally
      return remote;
    }
  }
  return loadLocal();
}

/** Synchronous load from cache (for initial render before async completes) */
export function loadScoresSync(): ScoreEntry[] {
  return loadLocal();
}

/** Save a score: writes to Firestore + local cache */
export async function saveScore(entry: ScoreEntry): Promise<ScoreEntry[]> {
  // Always save locally
  const local = loadLocal();
  local.push(entry);
  local.sort((a, b) => a.p80 - b.p80);
  const trimmed = local.slice(0, MAX_ENTRIES);
  saveLocal(trimmed);

  // Write to Firestore in background
  if (firebaseEnabled) {
    await saveFirestore(entry);
  }

  return trimmed;
}

export function getRank(scores: ScoreEntry[], p80: number): number {
  return scores.filter((s) => s.p80 < p80).length + 1;
}
