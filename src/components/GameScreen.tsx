import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { useSound } from '../hooks/useSound';
import { computeSessionStats, formatTime } from '../lib/scoring';
import { ResultsScreen } from './ResultsScreen';
import type { PlayerData } from '../hooks/usePlayerStore';
import type { AdaptiveState } from '../lib/adaptive';
import type { AttemptRecord } from '../lib/scoring';

interface Props {
  player: PlayerData;
  onSaveAdaptive: (state: AdaptiveState) => void;
  onSaveResults: (attempts: AttemptRecord[], p80: number) => void;
  onPlayAgain: () => void;
  onShowScoreboard: () => void;
  onBack: () => void;
}

const STREAK_MILESTONES = [5, 10, 15, 20, 30, 50];

export function GameScreen({ player, onSaveAdaptive, onSaveResults, onPlayAgain, onShowScoreboard, onBack }: Props) {
  const { settings } = player;
  const savedAdaptive = player.adaptiveState[settings.problemType] || null;

  const {
    gameState,
    isStarted,
    startGame,
    submitAnswer,
    advance,
    endGame,
  } = useGameEngine(
    {
      maxNum: settings.maxNum,
      problemType: settings.problemType,
      sessionMode: settings.sessionMode,
      sessionCount: settings.sessionCount,
      sessionMinutes: settings.sessionMinutes,
    },
    savedAdaptive,
    onSaveAdaptive
  );

  const playSound = useSound(settings.soundOn);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const particleId = useRef(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const gameStartTime = useRef(0);

  // Auto-start
  useEffect(() => {
    if (!isStarted) {
      startGame();
      gameStartTime.current = Date.now();
    }
  }, []);

  // Timer display for timed mode
  useEffect(() => {
    if (settings.sessionMode !== 'timed' || !isStarted || gameState.isFinished) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - gameStartTime.current;
      const remaining = Math.max(0, settings.sessionMinutes * 60 * 1000 - elapsed);
      setTimeLeft(remaining);
    }, 100);
    return () => clearInterval(interval);
  }, [isStarted, gameState.isFinished, settings]);

  // Focus input
  useEffect(() => {
    if (!gameState.isFinished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState.currentProblem, gameState.isFinished, feedback]);

  const spawnParticles = useCallback(() => {
    const emojis = ['⭐', '✨', '💫', '🌟', '🎉'];
    const newParticles = Array.from({ length: 6 }, () => ({
      id: particleId.current++,
      x: 40 + Math.random() * 20,
      y: 30 + Math.random() * 20,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 1000);
  }, []);

  const handleSubmit = useCallback(() => {
    const val = parseInt(input);
    if (isNaN(val)) return;

    submitAnswer(val);
    setInput('');

    const correct = val === gameState.currentProblem?.answer;

    if (correct) {
      setFeedback('correct');
      playSound('correct');
      spawnParticles();

      const newStreak = gameState.streak + 1;
      if (STREAK_MILESTONES.includes(newStreak)) {
        playSound('streak');
        setCelebration(`🔥 ${newStreak} in a row!`);
        setTimeout(() => setCelebration(null), 2000);
      }

      setTimeout(() => {
        setFeedback(null);
        advance();
      }, 400);
    } else {
      setFeedback('wrong');
      playSound('wrong');
      setShowAnswer(true);
      setTimeout(() => {
        setFeedback(null);
        setShowAnswer(false);
        advance();
      }, 2000);
    }
  }, [input, gameState, submitAnswer, advance, playSound, spawnParticles]);

  // Save results when finished
  useEffect(() => {
    if (gameState.isFinished && gameState.attempts.length > 0) {
      const stats = computeSessionStats(gameState.attempts);
      onSaveResults(gameState.attempts, stats.p80);
      if (player.bestP80 !== null && stats.p80 < player.bestP80) {
        playSound('personalBest');
      }
    }
  }, [gameState.isFinished]);

  if (gameState.isFinished) {
    return (
      <ResultsScreen
        attempts={gameState.attempts}
        bestP80={player.bestP80}
        playerAvatar={player.avatar}
        onPlayAgain={onPlayAgain}
        onShowScoreboard={onShowScoreboard}
        onBack={onBack}
      />
    );
  }

  if (!gameState.currentProblem) return null;

  const stats = computeSessionStats(gameState.attempts);

  return (
    <div className={`screen game-screen ${feedback || ''}`}>
      {/* Header stats */}
      <div className="game-header">
        <div className="stat">
          <span className="stat-label">Done</span>
          <span className="stat-value">
            {stats.total}
            {settings.sessionMode === 'count' ? `/${settings.sessionCount}` : ''}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">P80</span>
          <span className="stat-value">{stats.total > 2 ? formatTime(stats.p80) : '—'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">
            {stats.total > 0 ? `${Math.round(stats.accuracy * 100)}%` : '—'}
          </span>
        </div>
        {settings.sessionMode === 'timed' && timeLeft !== null && (
          <div className="stat timer">
            <span className="stat-label">Time</span>
            <span className="stat-value">{Math.ceil(timeLeft / 1000)}s</span>
          </div>
        )}
      </div>

      {/* Streak */}
      {stats.streak >= 3 && (
        <div className="streak-badge">
          🔥 {stats.streak}
        </div>
      )}

      {/* Celebration overlay */}
      {celebration && (
        <div className="celebration-overlay">{celebration}</div>
      )}

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Problem */}
      <div className={`problem-area ${feedback === 'correct' ? 'flash-green' : ''} ${feedback === 'wrong' ? 'shake' : ''}`}>
        <div className="problem-text">
          {gameState.currentProblem.question} = ?
        </div>

        {showAnswer && (
          <div className="correct-answer-reveal">
            {gameState.currentProblem.question} = {gameState.currentProblem.answer}
          </div>
        )}

        {!showAnswer && (
          <input
            ref={inputRef}
            className="answer-input"
            type="number"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            autoFocus
            disabled={!!feedback}
          />
        )}
      </div>

      <button className="btn btn-link quit-btn" onClick={endGame}>
        End Early
      </button>
    </div>
  );
}
