import React, { useState, useEffect } from 'react';
import { Player } from 'xianxia-shared';
import { gameApi } from '../api/gameApi';
import './CombatArena.css';

interface CombatArenaProps {
  player: Player;
  onPlayerUpdate?: (player: Player) => void;
}

interface Monster {
  id: string;
  name: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
}

export function CombatArena({ player, onPlayerUpdate }: CombatArenaProps) {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [inBattle, setInBattle] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMonsters = async () => {
      try {
        const allMonsters = await gameApi.getMonsters();
        setMonsters(allMonsters.slice(0, 6)); // Load first 6 monsters
        if (allMonsters && allMonsters.length > 0) {
          setSelectedMonster(allMonsters[0]!);
        }
      } catch (error) {
        console.error('Failed to load monsters:', error);
        setBattleLog(prev => [...prev, 'Failed to load monsters']);
      } finally {
        setLoading(false);
      }
    };

    loadMonsters();
  }, []);

  const handleFight = async () => {
    if (!selectedMonster) return;

    setInBattle(true);
    setBattleLog([]);
    setBattleResult(null);

    try {
      setBattleLog(prev => [
        ...prev,
        `Battle started with ${selectedMonster.name}!`,
        `Your HP: ${player.currentHp}/${player.maxHp}`,
        `Monster HP: ${selectedMonster.hp}`,
        `---`,
      ]);

      const result = await gameApi.fightMonster(player.id, selectedMonster.id);

      if (result.success) {
        setBattleLog(prev => [
          ...prev,
          `💥 Victory! You defeated the ${selectedMonster.name}!`,
          `You gained ${result.expEarned} EXP`,
          `You gained ${result.goldEarned} Gold`,
          ...(result.itemsDropped.length > 0
            ? [`Loot: ${result.itemsDropped.map((item: any) => item.item?.name || 'Gold').join(', ')}`]
            : []),
        ]);

        setBattleResult(result);

        // Refresh player data
        if (onPlayerUpdate) {
          try {
            const players = await gameApi.getPlayers();
            const updatedPlayer = players.find(p => p.id === player.id);
            if (updatedPlayer) {
              onPlayerUpdate(updatedPlayer);
            }
          } catch {
            // Silently fail if can't refresh
          }
        }
      } else {
        setBattleLog(prev => [
          ...prev,
          `❌ Defeat! You were defeated by ${selectedMonster.name}...`,
          'Your HP dropped to 0',
        ]);
        setBattleResult({ success: false });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Battle error';
      setBattleLog(prev => [...prev, `⚠️ Battle error: ${errorMsg}`]);
    } finally {
      setInBattle(false);
    }
  };

  if (loading) {
    return (
      <div className="combat-arena">
        <h2>Loading Combat Arena...</h2>
      </div>
    );
  }

  return (
    <div className="combat-arena">
      <h2>⚔️ Combat Arena</h2>

      <div className="combat-container">
        {/* Monster Selection */}
        <section className="monster-selection">
          <h3>Select Monster</h3>
          <div className="monster-list">
            {monsters.map(monster => (
              <button
                key={monster.id}
                className={`monster-card ${selectedMonster?.id === monster.id ? 'active' : ''}`}
                onClick={() => setSelectedMonster(monster)}
                disabled={inBattle}
              >
                <div className="monster-name">{monster.name}</div>
                <div className="monster-level">Lv {monster.level}</div>
                <div className="monster-stats">HP: {monster.hp}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Battle Info */}
        {selectedMonster && (
          <section className="battle-info">
            <h3>Battle Info</h3>
            <div className="player-status">
              <div className="status-item">
                <span className="label">Your HP:</span>
                <span className="value">{player.currentHp}/{player.maxHp}</span>
              </div>
              <div className="status-item">
                <span className="label">Your Attack:</span>
                <span className="value">{player.attack}</span>
              </div>
              <div className="status-item">
                <span className="label">Your Defense:</span>
                <span className="value">{player.defense}</span>
              </div>
            </div>

            <div className="vs-separator">VS</div>

            <div className="monster-status">
              <div className="status-item">
                <span className="label">{selectedMonster.name} HP:</span>
                <span className="value">{selectedMonster.hp}</span>
              </div>
              <div className="status-item">
                <span className="label">{selectedMonster.name} Attack:</span>
                <span className="value">{selectedMonster.attack}</span>
              </div>
              <div className="status-item">
                <span className="label">{selectedMonster.name} Defense:</span>
                <span className="value">{selectedMonster.defense}</span>
              </div>
            </div>

            <button
              className="fight-btn"
              onClick={handleFight}
              disabled={inBattle || player.currentHp <= 0}
            >
              {inBattle ? 'Fighting...' : '⚡ Fight!'}
            </button>
          </section>
        )}

        {/* Battle Log */}
        <section className="battle-log">
          <h3>Battle Log</h3>
          <div className="log-content">
            {battleLog.length === 0 ? (
              <p className="empty">Select a monster and click Fight to begin!</p>
            ) : (
              battleLog.map((entry, idx) => (
                <div key={idx} className="log-entry">
                  {entry}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
