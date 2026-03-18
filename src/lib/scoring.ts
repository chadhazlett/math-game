// Scoring: track response times, compute p80 with error penalties

export interface AttemptRecord {
  key: string;
  correct: boolean;
  responseTimeMs: number;  // actual time taken (or penalty time if wrong)
  timestamp: number;
}

const ERROR_PENALTY_MS = 10000; // 10s penalty for wrong answers

export function effectiveTime(attempt: AttemptRecord): number {
  return attempt.correct ? attempt.responseTimeMs : ERROR_PENALTY_MS;
}

export function computePercentile(times: number[], p: number): number {
  if (times.length === 0) return 0;
  const sorted = [...times].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function computeP80(attempts: AttemptRecord[]): number {
  const times = attempts.map(effectiveTime);
  return computePercentile(times, 80);
}

export function computeSessionStats(attempts: AttemptRecord[]) {
  const correct = attempts.filter((a) => a.correct).length;
  const total = attempts.length;
  const times = attempts.map(effectiveTime);
  const p80 = computePercentile(times, 80);
  const median = computePercentile(times, 50);
  const streak = currentStreak(attempts);

  return {
    correct,
    total,
    accuracy: total > 0 ? correct / total : 0,
    p80,
    median,
    streak,
    times,
  };
}

function currentStreak(attempts: AttemptRecord[]): number {
  let streak = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].correct) streak++;
    else break;
  }
  return streak;
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
