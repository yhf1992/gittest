import React, { useState } from 'react';
import { Player, GameUtils } from 'xianxia-shared';
import { StatDisplay } from './StatDisplay';
import { EquipmentCard } from './EquipmentCard';
import './GameDashboard.css';

interface GameDashboardProps {
  player: Player;
  onPlayerUpdate: (player: Player) => void;
}

export function GameDashboard({ player, onPlayerUpdate }: GameDashboardProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleCultivate = () => {
    setSelectedAction('cultivating');
    // Simulate cultivation
    setTimeout(() => {
      const updatedPlayer = {
        ...player,
        experience: player.experience + BigInt(100),
        currentMp: Math.max(0, player.currentMp - 10),
      };
      onPlayerUpdate(updatedPlayer);
      setSelectedAction(null);
    }, 2000);
  };

  const handleMeditate = () => {
    setSelectedAction('meditating');
    // Simulate meditation (restore HP/MP)
    setTimeout(() => {
      const updatedPlayer = {
        ...player,
        currentHp: Math.min(player.maxHp, player.currentHp + 50),
        currentMp: Math.min(player.maxMp, player.currentMp + 25),
      };
      onPlayerUpdate(updatedPlayer);
      setSelectedAction(null);
    }, 1500);
  };

  const cultivationLevel = GameUtils.getCultivationLevelName(player.level);
  const expProgress = player.cultivationTier 
    ? GameUtils.calculateExperienceProgress(
        player.experience,
        player.cultivationTier.minExp,
        player.cultivationTier.minExp + BigInt(50000) // Estimate max exp for current tier
      )
    : 0;

  return (
    <div className="game-dashboard">
      {/* Player Overview */}
      <section className="player-overview ancient-border">
        <div className="player-header">
          <div className="player-title">
            <h2>{player.username}</h2>
            <div className="cultivation-title">
              <span className="chinese-name">{cultivationLevel.chinese}</span>
              <span className="english-name">{cultivationLevel.english}</span>
            </div>
          </div>
          <div className="player-avatar">
            <div className="avatar-circle">
              <span className="avatar-level">{player.level}</span>
            </div>
          </div>
        </div>

        {/* Experience Progress */}
        <div className="experience-section">
          <div className="exp-header">
            <span>Cultivation Progress</span>
            <span className="exp-text">
              {GameUtils.formatLargeNumber(player.experience)} / {GameUtils.formatLargeNumber((player.cultivationTier?.minExp || BigInt(0)) + BigInt(50000))}
            </span>
          </div>
          <div className="exp-bar">
            <div 
              className="exp-fill" 
              style={{ width: `${expProgress}%` }}
            ></div>
          </div>
          <div className="exp-percentage">{expProgress.toFixed(1)}%</div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="stats-section">
        <h3 className="section-title">Character Stats</h3>
        <div className="stats-grid">
          <StatDisplay 
            label="HP" 
            value={player.currentHp} 
            maxValue={player.maxHp}
            variant="detailed"
            showPercentage
          />
          <StatDisplay 
            label="MP" 
            value={player.currentMp} 
            maxValue={player.maxMp}
            variant="detailed"
            showPercentage
          />
          <StatDisplay 
            label="Attack" 
            value={player.attack}
            variant="detailed"
          />
          <StatDisplay 
            label="Defense" 
            value={player.defense}
            variant="detailed"
          />
          <StatDisplay 
            label="Speed" 
            value={player.speed}
            variant="detailed"
          />
          <StatDisplay 
            label="Crit Rate" 
            value={Math.round(player.critRate * 100)}
            variant="detailed"
          />
        </div>
      </section>

      {/* Resources */}
      <section className="resources-section">
        <h3 className="section-title">Resources</h3>
        <div className="resources-grid">
          <div className="resource-card ancient-border">
            <div className="resource-icon gold-icon">💰</div>
            <div className="resource-info">
              <div className="resource-label">Gold</div>
              <div className="resource-value">{GameUtils.formatLargeNumber(player.gold)}</div>
            </div>
          </div>
          <div className="resource-card ancient-border">
            <div className="resource-icon spirit-icon">💎</div>
            <div className="resource-info">
              <div className="resource-label">Spirit Stones</div>
              <div className="resource-value">{GameUtils.formatLargeNumber(player.spiritStones)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="actions-section">
        <h3 className="section-title">Cultivation Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-btn cultivate-btn"
            onClick={handleCultivate}
            disabled={selectedAction !== null}
          >
            <div className="action-icon">⚡</div>
            <div className="action-content">
              <div className="action-title">Cultivate</div>
              <div className="action-desc">Gain experience, consume MP</div>
            </div>
            {selectedAction === 'cultivating' && (
              <div className="action-loading">Cultivating...</div>
            )}
          </button>

          <button 
            className="action-btn meditate-btn"
            onClick={handleMeditate}
            disabled={selectedAction !== null}
          >
            <div className="action-icon">🧘</div>
            <div className="action-content">
              <div className="action-title">Meditate</div>
              <div className="action-desc">Restore HP and MP</div>
            </div>
            {selectedAction === 'meditating' && (
              <div className="action-loading">Meditating...</div>
            )}
          </button>

          <button className="action-btn train-btn" disabled>
            <div className="action-icon">💪</div>
            <div className="action-content">
              <div className="action-title">Train</div>
              <div className="action-desc">Improve base stats</div>
            </div>
          </button>

          <button className="action-btn alchemy-btn" disabled>
            <div className="action-icon">⚗️</div>
            <div className="action-content">
              <div className="action-title">Alchemy</div>
              <div className="action-desc">Craft pills and potions</div>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Equipment */}
      {player.equipment && player.equipment.length > 0 && (
        <section className="equipment-section">
          <h3 className="section-title">Equipped Items</h3>
          <div className="equipment-grid">
            {player.equipment.slice(0, 4).map((equipped) => (
              <div key={equipped.id} className="equipped-item">
                {equipped.equipment && (
                  <EquipmentCard 
                    equipment={{
                      ...equipped.equipment,
                      rarity: equipped.equipment.rarity as any,
                      level: equipped.equipment.level,
                    } as any}
                    isEquipped={true}
                    showActions={false}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}