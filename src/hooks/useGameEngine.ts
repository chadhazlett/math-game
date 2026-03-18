import { useState, useCallback, useRef } from 'react';
import { mergeAdaptiveState, selectProblem, updateWeight } from '../lib/adaptive';
import type { AdaptiveState } from '../lib/adaptive';
import { generateFromKey, multiplicationGenerator } from '../lib/problems';
import type { Problem } from '../lib/problems';
import type { AttemptRecord } from '../lib/scoring';

export interface GameConfig {
  maxNum: number;
  problemType: string;
  sessionMode: 'count' | 'timed';
  sessionCount: number;
  sessionMinutes: number;
}

export interface GameState {
  currentProblem: Problem | null;
  attempts: AttemptRecord[];
  problemStartTime: number;
  isFinished: boolean;
  lastCorrect: boolean | null;
  lastAnswer: number | null;
  streak: number;
}

export function useGameEngine(
  config: GameConfig,
  savedAdaptiveState: AdaptiveState | null,
  onSaveAdaptive: (state: AdaptiveState) => void
) {
  const allKeys = multiplicationGenerator.allKeys(config.maxNum);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>(
    () => mergeAdaptiveState(savedAdaptiveState, allKeys)
  );
  const [gameState, setGameState] = useState<GameState>({
    currentProblem: null,
    attempts: [],
    problemStartTime: 0,
    isFinished: false,
    lastCorrect: null,
    lastAnswer: null,
    streak: 0,
  });
  const [isStarted, setIsStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyRef = useRef<string | undefined>(undefined);

  const nextProblem = useCallback((state: AdaptiveState) => {
    const key = selectProblem(state, lastKeyRef.current);
    lastKeyRef.current = key;
    const problem = generateFromKey(key);
    setGameState((prev) => ({
      ...prev,
      currentProblem: problem,
      problemStartTime: Date.now(),
      lastCorrect: null,
      lastAnswer: null,
    }));
  }, []);

  const startGame = useCallback(() => {
    const freshState = mergeAdaptiveState(savedAdaptiveState, allKeys);
    setAdaptiveState(freshState);
    setIsStarted(true);
    setGameState({
      currentProblem: null,
      attempts: [],
      problemStartTime: 0,
      isFinished: false,
      lastCorrect: null,
      lastAnswer: null,
      streak: 0,
    });

    // start first problem
    const key = selectProblem(freshState, undefined);
    lastKeyRef.current = key;
    const problem = generateFromKey(key);
    setGameState({
      currentProblem: problem,
      attempts: [],
      problemStartTime: Date.now(),
      isFinished: false,
      lastCorrect: null,
      lastAnswer: null,
      streak: 0,
    });

    // set timer for timed mode
    if (config.sessionMode === 'timed') {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setGameState((prev) => ({ ...prev, isFinished: true }));
      }, config.sessionMinutes * 60 * 1000);
    }
  }, [config, savedAdaptiveState, allKeys]);

  const submitAnswer = useCallback((answer: number) => {
    setGameState((prev) => {
      if (!prev.currentProblem || prev.isFinished) return prev;

      const correct = answer === prev.currentProblem.answer;
      const responseTimeMs = Date.now() - prev.problemStartTime;

      const attempt: AttemptRecord = {
        key: prev.currentProblem.key,
        correct,
        responseTimeMs,
        timestamp: Date.now(),
      };

      const newAttempts = [...prev.attempts, attempt];
      const newStreak = correct ? prev.streak + 1 : 0;

      // check if session is done (count mode)
      const isFinished =
        config.sessionMode === 'count' && newAttempts.length >= config.sessionCount;

      return {
        ...prev,
        attempts: newAttempts,
        lastCorrect: correct,
        lastAnswer: answer,
        streak: newStreak,
        isFinished,
      };
    });

    // update adaptive state
    setAdaptiveState((prev) => {
      if (!gameState.currentProblem) return prev;
      const correct = answer === gameState.currentProblem.answer;
      const updated = updateWeight(prev, gameState.currentProblem.key, correct);
      onSaveAdaptive(updated);
      return updated;
    });
  }, [gameState.currentProblem, config, onSaveAdaptive]);

  const advance = useCallback(() => {
    if (gameState.isFinished) return;
    nextProblem(adaptiveState);
  }, [gameState.isFinished, adaptiveState, nextProblem]);

  const endGame = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState((prev) => ({ ...prev, isFinished: true }));
  }, []);

  return {
    gameState,
    isStarted,
    startGame,
    submitAnswer,
    advance,
    endGame,
    adaptiveState,
  };
}
