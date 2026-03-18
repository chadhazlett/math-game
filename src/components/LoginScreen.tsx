import { useState } from 'react';
import { ALL_AVATARS, getRandomAvatar } from '../hooks/usePlayerStore';
import type { PlayerData } from '../hooks/usePlayerStore';

interface Props {
  playerList: Array<{ id: string } & PlayerData>;
  onSelect: (id: string) => void;
  onCreate: (name: string, avatar: string) => boolean;
  onDelete: (id: string) => void;
  onShowScoreboard: () => void;
}

export function LoginScreen({ playerList, onSelect, onCreate, onDelete, onShowScoreboard }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(getRandomAvatar());
  const [error, setError] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a name!');
      return;
    }
    const ok = onCreate(trimmed, avatar);
    if (!ok) {
      setError('That name is already taken!');
      return;
    }
    setShowCreate(false);
    setName('');
    setError('');
  };

  return (
    <div className="screen login-screen">
      <h1 className="title bounce-in">
        <span className="title-emoji">🧮</span> Math Champion!
      </h1>
      <p className="subtitle">Who's playing today?</p>

      {playerList.length > 0 && (
        <div className="player-list">
          {playerList.map((p) => (
            <div key={p.id} className="player-card" onClick={() => onSelect(p.id)}>
              <span className="player-avatar">{p.avatar}</span>
              <span className="player-name">{p.name}</span>
              {p.bestP80 !== null && (
                <span className="player-best">
                  Best: {(p.bestP80 / 1000).toFixed(1)}s
                </span>
              )}
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove ${p.name}?`)) onDelete(p.id);
                }}
                title="Remove player"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {!showCreate ? (
        <button className="btn btn-primary pulse" onClick={() => setShowCreate(true)}>
          + New Player
        </button>
      ) : (
        <div className="create-form slide-in">
          <div className="avatar-picker">
            {ALL_AVATARS.map((a) => (
              <button
                key={a}
                className={`avatar-btn ${a === avatar ? 'selected' : ''}`}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            className="name-input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            maxLength={20}
          />
          {error && <p className="error-text">{error}</p>}
          <div className="btn-row">
            <button className="btn btn-primary" onClick={handleCreate}>
              Let's Go! 🚀
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <button className="btn btn-link scoreboard-link" onClick={onShowScoreboard}>
        🏆 High Scores
      </button>
    </div>
  );
}
