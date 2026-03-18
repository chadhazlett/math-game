import { formatTime } from '../lib/scoring';
import type { ScoreEntry } from '../lib/scoreboard';

interface Props {
  scores: ScoreEntry[];
  highlightP80?: number; // highlight the row matching this p80 (just-scored)
  onClose: () => void;
}

export function Scoreboard({ scores, highlightP80, onClose }: Props) {
  return (
    <div className="screen scoreboard-screen">
      <h1 className="scoreboard-title">
        <span className="trophy">🏆</span> High Scores
      </h1>

      {scores.length === 0 ? (
        <div className="scoreboard-empty">
          <p>No scores yet!</p>
          <p>Play a round to get on the board.</p>
        </div>
      ) : (
        <div className="scoreboard-table">
          <div className="scoreboard-header-row">
            <span className="sb-rank">#</span>
            <span className="sb-player">Player</span>
            <span className="sb-p80">P80</span>
            <span className="sb-acc">Acc</span>
            <span className="sb-max">Max</span>
            <span className="sb-date">Date</span>
          </div>
          <div className="scoreboard-body">
            {scores.slice(0, 20).map((s, i) => {
              const isHighlight = highlightP80 !== undefined && s.p80 === highlightP80;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <div
                  key={i}
                  className={`scoreboard-row ${isHighlight ? 'highlight-row' : ''} ${i < 3 ? 'top-three' : ''}`}
                >
                  <span className="sb-rank">
                    {medal || i + 1}
                  </span>
                  <span className="sb-player">
                    <span className="sb-avatar">{s.avatar}</span>
                    {s.playerName}
                  </span>
                  <span className="sb-p80">{formatTime(s.p80)}</span>
                  <span className="sb-acc">{Math.round(s.accuracy * 100)}%</span>
                  <span className="sb-max">×{s.maxNum}</span>
                  <span className="sb-date">
                    {new Date(s.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={onClose}>
        Back
      </button>
    </div>
  );
}
