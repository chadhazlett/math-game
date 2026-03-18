// Adaptive question selection: wrong answers come back more often,
// while still exploring all pairs.

export interface ProblemWeight {
  key: string;
  weight: number;       // current sampling weight
  correctCount: number;
  wrongCount: number;
  lastSeen: number;     // timestamp
}

export interface AdaptiveState {
  weights: Record<string, ProblemWeight>;
}

const BASE_WEIGHT = 1.0;
const ERROR_BOOST = 3.0;       // multiply weight by this on wrong answer
const CORRECT_DECAY = 0.7;     // multiply weight by this on correct answer
const MIN_WEIGHT = 0.15;       // floor so everything has a chance
const RECENCY_BOOST_MS = 60000; // boost unseen problems after 60s

export function initAdaptiveState(keys: string[]): AdaptiveState {
  const weights: Record<string, ProblemWeight> = {};
  for (const key of keys) {
    weights[key] = {
      key,
      weight: BASE_WEIGHT,
      correctCount: 0,
      wrongCount: 0,
      lastSeen: 0,
    };
  }
  return { weights };
}

export function updateWeight(
  state: AdaptiveState,
  key: string,
  correct: boolean
): AdaptiveState {
  const w = state.weights[key];
  if (!w) return state;

  const updated = { ...w, lastSeen: Date.now() };

  if (correct) {
    updated.correctCount += 1;
    updated.weight = Math.max(MIN_WEIGHT, w.weight * CORRECT_DECAY);
  } else {
    updated.wrongCount += 1;
    updated.weight = w.weight * ERROR_BOOST;
  }

  return {
    weights: { ...state.weights, [key]: updated },
  };
}

export function selectProblem(
  state: AdaptiveState,
  lastKey?: string
): string {
  const now = Date.now();
  const entries = Object.values(state.weights);

  // compute effective weights with recency boost
  const effective = entries.map((w) => {
    let ew = w.weight;
    // boost problems not seen recently
    if (w.lastSeen > 0) {
      const elapsed = now - w.lastSeen;
      if (elapsed > RECENCY_BOOST_MS) {
        ew += 0.3 * Math.min(elapsed / RECENCY_BOOST_MS, 5);
      }
    } else {
      // never seen — give a small exploration boost
      ew += 0.5;
    }
    return { key: w.key, ew };
  });

  // don't repeat the same problem consecutively
  const candidates = lastKey
    ? effective.filter((e) => e.key !== lastKey)
    : effective;

  const pool = candidates.length > 0 ? candidates : effective;

  // weighted random selection
  const totalWeight = pool.reduce((sum, e) => sum + e.ew, 0);
  let r = Math.random() * totalWeight;

  for (const e of pool) {
    r -= e.ew;
    if (r <= 0) return e.key;
  }

  return pool[pool.length - 1].key;
}

// Merge saved adaptive state with possibly new keys (if maxNum changed)
export function mergeAdaptiveState(
  saved: AdaptiveState | null,
  allKeys: string[]
): AdaptiveState {
  if (!saved) return initAdaptiveState(allKeys);

  const weights: Record<string, ProblemWeight> = {};
  for (const key of allKeys) {
    weights[key] = saved.weights[key] || {
      key,
      weight: BASE_WEIGHT,
      correctCount: 0,
      wrongCount: 0,
      lastSeen: 0,
    };
  }
  return { weights };
}
