import type { PlayerData } from '../hooks/usePlayerStore';

interface Props {
  player: PlayerData;
  onUpdateSettings: (settings: Partial<PlayerData['settings']>) => void;
  onStart: () => void;
  onLogout: () => void;
}

export function SettingsScreen({ player, onUpdateSettings, onStart, onLogout }: Props) {
  const s = player.settings;

  return (
    <div className="screen settings-screen">
      <div className="settings-header">
        <span className="player-avatar-lg">{player.avatar}</span>
        <h2>Hi, {player.name}!</h2>
        {player.bestP80 !== null && (
          <p className="best-score">
            Your best P80: <strong>{(player.bestP80 / 1000).toFixed(1)}s</strong>
          </p>
        )}
      </div>

      <div className="settings-form">
        <div className="setting-row">
          <label>Max Number</label>
          <div className="slider-group">
            <input
              type="range"
              min={2}
              max={20}
              value={s.maxNum}
              onChange={(e) => onUpdateSettings({ maxNum: parseInt(e.target.value) })}
            />
            <span className="slider-value">{s.maxNum}</span>
          </div>
          <span className="setting-hint">Practice 1×1 through {s.maxNum}×{s.maxNum}</span>
        </div>

        <div className="setting-row">
          <label>Session Mode</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${s.sessionMode === 'count' ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ sessionMode: 'count' })}
            >
              Fixed Count
            </button>
            <button
              className={`toggle-btn ${s.sessionMode === 'timed' ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ sessionMode: 'timed' })}
            >
              Timed
            </button>
          </div>
        </div>

        {s.sessionMode === 'count' ? (
          <div className="setting-row">
            <label>Problems per round</label>
            <div className="slider-group">
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={s.sessionCount}
                onChange={(e) => onUpdateSettings({ sessionCount: parseInt(e.target.value) })}
              />
              <span className="slider-value">{s.sessionCount}</span>
            </div>
          </div>
        ) : (
          <div className="setting-row">
            <label>Minutes</label>
            <div className="slider-group">
              <input
                type="range"
                min={1}
                max={5}
                value={s.sessionMinutes}
                onChange={(e) => onUpdateSettings({ sessionMinutes: parseInt(e.target.value) })}
              />
              <span className="slider-value">{s.sessionMinutes} min</span>
            </div>
          </div>
        )}

        <div className="setting-row">
          <label>Sound</label>
          <button
            className={`toggle-btn sound-toggle ${s.soundOn ? 'active' : ''}`}
            onClick={() => onUpdateSettings({ soundOn: !s.soundOn })}
          >
            {s.soundOn ? '🔊 On' : '🔇 Off'}
          </button>
        </div>
      </div>

      <button className="btn btn-primary btn-large pulse" onClick={onStart}>
        Start! 🎯
      </button>

      <button className="btn btn-link" onClick={onLogout}>
        Switch Player
      </button>
    </div>
  );
}
