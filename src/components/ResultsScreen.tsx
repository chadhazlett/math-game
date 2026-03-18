import { computeSessionStats, formatTime } from '../lib/scoring';
import type { AttemptRecord } from '../lib/scoring';
import { parseProblemKey } from '../lib/problems';

interface Props {
  attempts: AttemptRecord[];
  bestP80: number | null;
  playerAvatar: string;
  onPlayAgain: () => void;
  onShowScoreboard: () => void;
  onBack: () => void;
}

export function ResultsScreen({ attempts, bestP80, playerAvatar, onPlayAgain, onShowScoreboard, onBack }: Props) {
  const stats = computeSessionStats(attempts);
  const isNewBest = bestP80 !== null && stats.p80 < bestP80;

  // Find the hardest problems (wrong or slowest)
  const wrongOnes = attempts.filter((a) => !a.correct);
  const slowest = [...attempts]
    .filter((a) => a.correct)
    .sort((a, b) => b.responseTimeMs - a.responseTimeMs)
    .slice(0, 3);

  return (
    <div className="screen results-screen">
      <div className="results-header">
        <span className="result-avatar">{playerAvatar}</span>
        <h2>{isNewBest ? '🏆 New Personal Best!' : 'Great Job!'}</h2>
      </div>

      <div className="results-grid">
        <div className="result-card">
          <span className="result-label">Score</span>
          <span className="result-value">{stats.correct}/{stats.total}</span>
        </div>
        <div className="result-card">
          <span className="result-label">Accuracy</span>
          <span className="result-value">{Math.round(stats.accuracy * 100)}%</span>
        </div>
        <div className={`result-card ${isNewBest ? 'highlight' : ''}`}>
          <span className="result-label">P80 Time</span>
          <span className="result-value">{formatTime(stats.p80)}</span>
          {bestP80 !== null && !isNewBest && (
            <span className="result-sub">Best: {formatTime(bestP80)}</span>
          )}
        </div>
        <div className="result-card">
          <span className="result-label">Median</span>
          <span className="result-value">{formatTime(stats.median)}</span>
        </div>
      </div>

      {wrongOnes.length > 0 && (
        <div className="trouble-spots">
          <h3>Keep Practicing</h3>
          <div className="trouble-list">
            {wrongOnes.map((a, i) => {
              const { a: numA, b: numB } = parseProblemKey(a.key);
              return (
                <span key={i} className="trouble-item">
                  {numA}×{numB}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {slowest.length > 0 && (
        <div className="trouble-spots">
          <h3>Slowest (correct)</h3>
          <div className="trouble-list">
            {slowest.map((a, i) => {
              const { a: numA, b: numB } = parseProblemKey(a.key);
              return (
                <span key={i} className="trouble-item">
                  {numA}×{numB} ({formatTime(a.responseTimeMs)})
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="btn-row">
        <button className="btn btn-primary btn-large pulse" onClick={onPlayAgain}>
          Play Again! 🎯
        </button>
        <button className="btn btn-secondary" onClick={onShowScoreboard}>
          🏆 High Scores
        </button>
        <button className="btn btn-secondary" onClick={onBack}>
          Settings
        </button>
      </div>
    </div>
  );
}
