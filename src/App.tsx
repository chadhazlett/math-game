import { useState, useCallback, useEffect } from 'react';
import { usePlayerStore } from './hooks/usePlayerStore';
import { loadScores, loadScoresSync, saveScore } from './lib/scoreboard';
import type { ScoreEntry } from './lib/scoreboard';
import { LoginScreen } from './components/LoginScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { GameScreen } from './components/GameScreen';
import { Scoreboard } from './components/Scoreboard';
import './styles/game.css';

type Screen = 'login' | 'settings' | 'game' | 'scoreboard';

function App() {
  const store = usePlayerStore();
  const [screen, setScreen] = useState<Screen>('login');
  const [gameKey, setGameKey] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>(loadScoresSync);
  const [lastP80, setLastP80] = useState<number | undefined>(undefined);
  const [returnTo, setReturnTo] = useState<Screen>('login');

  // Load shared scores from Firestore on mount
  useEffect(() => {
    loadScores().then(setScores);
  }, []);

  const handleSelectPlayer = (id: string) => {
    store.selectPlayer(id);
    setScreen('settings');
  };

  const handleCreatePlayer = (name: string, avatar: string) => {
    const ok = store.createPlayer(name, avatar);
    if (ok) setScreen('settings');
    return ok;
  };

  const handleLogout = () => {
    setScreen('login');
  };

  const handleStartGame = () => {
    setGameKey((k) => k + 1);
    setLastP80(undefined);
    setScreen('game');
  };

  const handleBackToSettings = () => {
    store.refresh();
    setScreen('settings');
  };

  const handleShowScoreboard = useCallback(async (from: Screen) => {
    setReturnTo(from);
    setScreen('scoreboard');
    // Refresh from Firestore
    const fresh = await loadScores();
    setScores(fresh);
  }, []);

  const handleCloseScoreboard = useCallback(() => {
    setScreen(returnTo);
  }, [returnTo]);

  if (screen === 'scoreboard') {
    return (
      <Scoreboard
        scores={scores}
        highlightP80={lastP80}
        onClose={handleCloseScoreboard}
      />
    );
  }

  if (screen === 'login' || !store.player) {
    return (
      <LoginScreen
        playerList={store.playerList}
        onSelect={handleSelectPlayer}
        onCreate={handleCreatePlayer}
        onDelete={store.deletePlayer}
        onShowScoreboard={() => handleShowScoreboard('login')}
      />
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        player={store.player}
        onUpdateSettings={store.updateSettings}
        onStart={handleStartGame}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <GameScreen
      key={gameKey}
      player={store.player}
      onSaveAdaptive={(state) =>
        store.saveAdaptiveState(store.player!.settings.problemType, state)
      }
      onSaveResults={async (attempts, p80) => {
        store.saveSessionResults(attempts, p80);
        const entry: ScoreEntry = {
          playerName: store.player!.name,
          avatar: store.player!.avatar,
          p80,
          accuracy: attempts.filter((a) => a.correct).length / attempts.length,
          totalProblems: attempts.length,
          maxNum: store.player!.settings.maxNum,
          date: new Date().toISOString(),
        };
        const updated = await saveScore(entry);
        setScores(updated);
        setLastP80(p80);
      }}
      onPlayAgain={handleStartGame}
      onShowScoreboard={() => handleShowScoreboard('game')}
      onBack={handleBackToSettings}
    />
  );
}

export default App;
