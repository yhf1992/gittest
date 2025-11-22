import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { combatService, authService } from '../services/api';
import './CombatViewer.css';

const CombatViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [combatLog, setCombatLog] = useState(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerCharacter, setPlayerCharacter] = useState(null);
  const [combatSpeed, setCombatSpeed] = useState(1000);
  const logEndRef = useRef(null);

  const monster = location.state?.monster;

  const loadPlayerAndStartCombat = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const profile = await authService.getProfile();
      const character = profile.character;
      setPlayerCharacter(character);

      const playerData = {
        character_id: character.character_id,
        name: character.name,
        character_class: character.character_class,
        level: character.level,
        max_hp: character.max_hp,
        attack: character.attack,
        defense: character.defense,
        speed: character.speed,
        element: character.element,
      };

      const opponentData = {
        character_id: monster.monster_id,
        name: monster.name,
        character_class: monster.character_class,
        level: monster.level,
        max_hp: monster.max_hp,
        attack: monster.attack,
        defense: monster.defense,
        speed: monster.speed,
        element: monster.element,
      };

      const result = await combatService.simulateCombat(playerData, opponentData);
      setCombatLog(result);
      setCurrentTurnIndex(-1);
    } catch (err) {
      setError(err.error || 'Failed to start combat');
    } finally {
      setLoading(false);
    }
  }, [monster]);

  useEffect(() => {
    if (!monster) {
      navigate('/monster-selection');
      return;
    }
    loadPlayerAndStartCombat();
  }, [monster, navigate, loadPlayerAndStartCombat]);

  useEffect(() => {
    if (isPlaying && currentTurnIndex < (combatLog?.turns?.length || 0) - 1) {
      const timer = setTimeout(() => {
        setCurrentTurnIndex((prev) => prev + 1);
        scrollToBottom();
      }, combatSpeed);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentTurnIndex >= (combatLog?.turns?.length || 0) - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentTurnIndex, combatLog, combatSpeed]);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePlay = () => {
    if (currentTurnIndex >= (combatLog?.turns?.length || 0) - 1) {
      setCurrentTurnIndex(-1);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setCurrentTurnIndex(-1);
    setIsPlaying(true);
  };

  const handleSpeedChange = (speed) => {
    setCombatSpeed(speed);
  };

  const getStatusEffectIcon = (effectType) => {
    const icons = {
      stun: '😵',
      dot: '🩸',
      defense_debuff: '🛡️💥',
      attack_buff: '⚔️✨',
      defense_buff: '🛡️✨',
      heal_over_time: '💚',
    };
    return icons[effectType] || '✨';
  };

  const getStatusEffectLabel = (effectType) => {
    const labels = {
      stun: 'Stunned',
      dot: 'Bleeding',
      defense_debuff: 'Defense Down',
      attack_buff: 'Attack Up',
      defense_buff: 'Defense Up',
      heal_over_time: 'Regenerating',
    };
    return labels[effectType] || effectType;
  };

  const renderAction = (action, turnNumber) => {
    const isPlayerAction = action.actor_id === playerCharacter?.character_id;
    
    return (
      <div key={`action-${turnNumber}-${action.actor_id}`} className={`combat-action ${isPlayerAction ? 'player-action' : 'enemy-action'}`}>
        <div className="action-header">
          <span className="actor-name">{isPlayerAction ? playerCharacter.name : monster.name}</span>
          <span className="action-type">{action.action_type}</span>
        </div>

        {action.is_miss ? (
          <div className="action-result miss">❌ MISS!</div>
        ) : (
          <>
            {action.damage_dealt > 0 && (
              <div className={`action-result damage ${action.is_crit ? 'critical' : ''}`}>
                {action.is_crit && <span className="crit-label">CRITICAL!</span>}
                <span className="damage-number">-{action.damage_dealt} HP</span>
              </div>
            )}

            {action.healing_done > 0 && (
              <div className="action-result healing">
                <span className="heal-number">+{action.healing_done} HP</span>
              </div>
            )}

            {action.multi_hit_count > 1 && (
              <div className="multi-hit">
                ⚡ {action.multi_hit_count}x HIT COMBO!
              </div>
            )}

            {action.status_effects_applied && action.status_effects_applied.length > 0 && (
              <div className="status-effects-applied">
                {action.status_effects_applied.map((effect, idx) => (
                  <span key={idx} className="status-effect">
                    {getStatusEffectIcon(effect.effect_type)} {getStatusEffectLabel(effect.effect_type)}
                  </span>
                ))}
              </div>
            )}

            {action.is_stun && (
              <div className="stun-indicator">
                😵 Target is STUNNED!
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderTurn = (turn, index) => {
    if (index > currentTurnIndex) return null;

    const isPlayerTurn = turn.actor_id === playerCharacter?.character_id;

    return (
      <div key={turn.turn_number} className={`combat-turn ${isPlayerTurn ? 'player-turn' : 'enemy-turn'} ${index === currentTurnIndex ? 'current-turn' : ''}`}>
        <div className="turn-header">
          <span className="turn-number">Turn {turn.turn_number}</span>
        </div>

        <div className="turn-content">
          {turn.actions.map((action) => renderAction(action, turn.turn_number))}

          <div className="character-status">
            <div className="player-status">
              <h4>{playerCharacter?.name}</h4>
              <div className="hp-bar">
                <div 
                  className="hp-fill player-hp" 
                  style={{ width: `${(turn.actor_status_after.current_hp / turn.actor_status_after.max_hp) * 100}%` }}
                ></div>
                <span className="hp-text">
                  {turn.actor_status_after.current_hp} / {turn.actor_status_after.max_hp}
                </span>
              </div>
              {turn.actor_status_after.status_effects && turn.actor_status_after.status_effects.length > 0 && (
                <div className="active-status-effects">
                  {turn.actor_status_after.status_effects.map((effect, idx) => (
                    <span key={idx} className="status-badge">
                      {getStatusEffectIcon(effect.effect_type)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="enemy-status">
              <h4>{monster?.name}</h4>
              <div className="hp-bar">
                <div 
                  className="hp-fill enemy-hp" 
                  style={{ width: `${(turn.target_status_after.current_hp / turn.target_status_after.max_hp) * 100}%` }}
                ></div>
                <span className="hp-text">
                  {turn.target_status_after.current_hp} / {turn.target_status_after.max_hp}
                </span>
              </div>
              {turn.target_status_after.status_effects && turn.target_status_after.status_effects.length > 0 && (
                <div className="active-status-effects">
                  {turn.target_status_after.status_effects.map((effect, idx) => (
                    <span key={idx} className="status-badge">
                      {getStatusEffectIcon(effect.effect_type)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinalResult = () => {
    if (!combatLog || currentTurnIndex < combatLog.turns.length - 1) return null;

    const isVictory = combatLog.winner_id === playerCharacter?.character_id;
    const expGained = isVictory ? Math.floor(monster.level * 10 * 1.5) : Math.floor(monster.level * 5);

    return (
      <div className={`combat-result ${isVictory ? 'victory' : 'defeat'}`}>
        <h2 className="result-title">{isVictory ? '🎉 VICTORY!' : '💀 DEFEAT'}</h2>
        <div className="result-details">
          <div className="result-item">
            <span className="result-label">Total Turns:</span>
            <span className="result-value">{combatLog.total_turns}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Experience Gained:</span>
            <span className="result-value exp">+{expGained} XP</span>
          </div>
          {isVictory && (
            <>
              <div className="result-item">
                <span className="result-label">Gold Earned:</span>
                <span className="result-value gold">{monster.loot_preview.currency}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Loot Dropped:</span>
                <div className="loot-list">
                  {monster.loot_preview.items.map((item, idx) => (
                    <span key={idx} className="loot-item">✨ {item}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (!monster) {
    return null;
  }

  if (loading) {
    return (
      <div className="combat-viewer-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Preparing for battle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="combat-viewer-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/monster-selection')} className="back-btn">
          Back to Monster Selection
        </button>
      </div>
    );
  }

  return (
    <div className="combat-viewer-container">
      <header className="combat-header">
        <button className="back-btn" onClick={() => navigate('/monster-selection')}>
          ← Back
        </button>
        <h1>Combat Arena</h1>
        <div className="combat-controls">
          <button 
            className="speed-btn" 
            onClick={() => handleSpeedChange(2000)}
            disabled={combatSpeed === 2000}
          >
            Slow
          </button>
          <button 
            className="speed-btn" 
            onClick={() => handleSpeedChange(1000)}
            disabled={combatSpeed === 1000}
          >
            Normal
          </button>
          <button 
            className="speed-btn" 
            onClick={() => handleSpeedChange(500)}
            disabled={combatSpeed === 500}
          >
            Fast
          </button>
        </div>
      </header>

      <div className="combat-arena">
        <div className="combatant player-combatant">
          <div className="combatant-avatar">👤</div>
          <h3>{playerCharacter?.name}</h3>
          <div className="combatant-level">Lv. {playerCharacter?.level}</div>
        </div>

        <div className="vs-indicator">⚔️</div>

        <div className="combatant enemy-combatant">
          <div className="combatant-avatar">👹</div>
          <h3>{monster?.name}</h3>
          <div className="combatant-level">Lv. {monster?.level}</div>
        </div>
      </div>

      <div className="combat-log">
        {combatLog?.turns && combatLog.turns.map((turn, index) => renderTurn(turn, index))}
        <div ref={logEndRef} />
      </div>

      {renderFinalResult()}

      <div className="combat-actions">
        {!isPlaying ? (
          <button className="control-btn play-btn" onClick={handlePlay}>
            {currentTurnIndex < 0 ? '▶️ Start Combat' : '▶️ Resume'}
          </button>
        ) : (
          <button className="control-btn pause-btn" onClick={handlePause}>
            ⏸️ Pause
          </button>
        )}
        
        <button 
          className="control-btn replay-btn" 
          onClick={handleReplay}
          disabled={!combatLog || combatLog.turns.length === 0}
        >
          🔄 Replay
        </button>
      </div>
    </div>
  );
};

export default CombatViewer;
