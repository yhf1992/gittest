import React, { useState, useEffect } from 'react';
import { Player } from 'xianxia-shared';
import { gameApi } from '../api/gameApi';
import './DungeonExplorer.css';

interface DungeonExplorerProps {
  player: Player;
  onPlayerUpdate?: (player: Player) => void;
}

interface Dungeon {
  id: string;
  name: string;
  description?: string;
  difficulty: string;
  minLevel: number;
  goldReward: bigint;
  expReward: bigint;
  completionTime?: number;
  energyCost: number;
}

export function DungeonExplorer({ player, onPlayerUpdate }: DungeonExplorerProps) {
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [exploring, setExploring] = useState(false);
  const [dungeonResult, setDungeonResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDungeons = async () => {
      try {
        const allDungeons = await gameApi.getDungeons();
        setDungeons(allDungeons);
        if (allDungeons && allDungeons.length > 0) {
          setSelectedDungeon(allDungeons[0]!);
        }
      } catch (error) {
        console.error('Failed to load dungeons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDungeons();
  }, []);

  const handleEnterDungeon = async () => {
    if (!selectedDungeon) return;

    if (player.level < selectedDungeon.minLevel) {
      alert(`You need to be level ${selectedDungeon.minLevel} or higher to enter this dungeon.`);
      return;
    }

    setExploring(true);
    setDungeonResult(null);

    try {
      // Simulate dungeon exploration with random completion time
      const baseTime = selectedDungeon.completionTime || 30;
      const variance = Math.random() * 20 - 10; // ±10% variance
      const actualTime = Math.max(1, Math.round(baseTime + variance));

      const result = await gameApi.completeDungeon(player.id, selectedDungeon.id, actualTime);

      setDungeonResult(result);

      // Refresh player data
      if (onPlayerUpdate) {
        try {
          const players = await gameApi.getPlayers();
          const updatedPlayer = players.find(p => p.id === player.id);
          if (updatedPlayer) {
            onPlayerUpdate(updatedPlayer);
          }
        } catch {
          // Silently fail
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Dungeon error';
      alert(`Dungeon exploration failed: ${errorMsg}`);
    } finally {
      setExploring(false);
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colors: { [key: string]: string } = {
      EASY: '#4caf50',
      NORMAL: '#2196f3',
      HARD: '#ff9800',
      EXPERT: '#f44336',
      NIGHTMARE: '#9c27b0',
    };
    return colors[difficulty] || '#999';
  };

  if (loading) {
    return (
      <div className="dungeon-explorer">
        <h2>Loading Dungeons...</h2>
      </div>
    );
  }

  return (
    <div className="dungeon-explorer">
      <h2>🏛️ Dungeon Explorer</h2>

      <div className="explorer-container">
        {/* Dungeon List */}
        <section className="dungeon-list-section">
          <h3>Available Dungeons</h3>
          <div className="dungeon-list">
            {dungeons.map(dungeon => (
              <button
                key={dungeon.id}
                className={`dungeon-card ${selectedDungeon?.id === dungeon.id ? 'active' : ''}`}
                onClick={() => setSelectedDungeon(dungeon)}
                disabled={exploring}
              >
                <div className="dungeon-name">{dungeon.name}</div>
                <div className="dungeon-difficulty" style={{ color: getDifficultyColor(dungeon.difficulty) }}>
                  {dungeon.difficulty}
                </div>
                <div className="dungeon-level">Lv {dungeon.minLevel}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Dungeon Details */}
        {selectedDungeon && (
          <section className="dungeon-details">
            <h3>{selectedDungeon.name}</h3>
            <p className="description">{selectedDungeon.description}</p>

            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Difficulty:</span>
                <span
                  className="value"
                  style={{ color: getDifficultyColor(selectedDungeon.difficulty) }}
                >
                  {selectedDungeon.difficulty}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Minimum Level:</span>
                <span className="value">{selectedDungeon.minLevel}</span>
              </div>
              <div className="detail-item">
                <span className="label">Gold Reward:</span>
                <span className="value">💰 {String(selectedDungeon.goldReward)}</span>
              </div>
              <div className="detail-item">
                <span className="label">EXP Reward:</span>
                <span className="value">⭐ {String(selectedDungeon.expReward)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Energy Cost:</span>
                <span className="value">{selectedDungeon.energyCost}</span>
              </div>
              <div className="detail-item">
                <span className="label">Completion Time:</span>
                <span className="value">⏱️ {selectedDungeon.completionTime || '?'} min</span>
              </div>
            </div>

            <div className="player-status">
              <div className="status-item">
                <span className="label">Your Level:</span>
                <span className={`value ${player.level >= selectedDungeon.minLevel ? 'ok' : 'warning'}`}>
                  {player.level}
                  {player.level < selectedDungeon.minLevel && ' ❌'}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Your HP:</span>
                <span className="value">{player.currentHp}/{player.maxHp}</span>
              </div>
            </div>

            <button
              className="enter-btn"
              onClick={handleEnterDungeon}
              disabled={exploring || player.level < selectedDungeon.minLevel || player.currentHp <= 0}
            >
              {exploring ? '⏳ Exploring...' : '🚪 Enter Dungeon'}
            </button>
          </section>
        )}

        {/* Result */}
        {dungeonResult && (
          <section className="dungeon-result">
            <h3>Dungeon Complete!</h3>
            <div className="result-content">
              <div className="result-item">
                <span className="label">Stars Earned:</span>
                <span className="value">⭐ {dungeonResult.stars}/3</span>
              </div>
              <div className="result-item">
                <span className="label">Gold Earned:</span>
                <span className="value">💰 {dungeonResult.goldEarned}</span>
              </div>
              <div className="result-item">
                <span className="label">EXP Earned:</span>
                <span className="value">✨ {dungeonResult.expEarned}</span>
              </div>
              <p className="message">{dungeonResult.message}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
