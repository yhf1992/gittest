import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { dungeonService } from '../services/api';
import './DungeonRun.css';

const DungeonRun = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { run, dungeon, character, inventory } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentFloor, setCurrentFloor] = useState(1);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [combatLogs, setCombatLogs] = useState([]);
  const [playerStats, setPlayerStats] = useState({
    current_hp: character?.current_hp || character?.max_hp || 100,
    max_hp: character?.max_hp || 100,
    attack: character?.attack || 20,
    defense: character?.defense || 15,
    speed: character?.speed || 10
  });
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);

  const startFloor = useCallback(async (floorNumber) => {
    try {
      setLoading(true);
      setError('');

      // Generate enemy for this floor
      const enemy = generateEnemyForFloor(floorNumber);
      setCurrentEnemy(enemy);

      // Simulate combat
      const combatResult = simulateCombat(character, enemy, floorNumber);
      
      // Add combat log
      const log = {
        floor: floorNumber,
        enemy: enemy.name,
        result: combatResult.winner === character.character_id ? 'victory' : 'defeat',
        details: combatResult
      };

      setCombatLogs(prev => [...prev, log]);

      // Update player stats after combat
      if (combatResult.winner === character.character_id) {
        // Player won - reduce HP based on damage taken
        const damageTaken = combatResult.player_damage || 0;
        setPlayerStats(prev => ({
          ...prev,
          current_hp: Math.max(1, prev.current_hp - damageTaken)
        }));

        // Check if this was the last floor
        if (floorNumber >= dungeon.floors) {
          setIsCompleted(true);
        } else {
          // Move to next floor after a delay
          setTimeout(() => {
            setCurrentFloor(floorNumber + 1);
            startFloor(floorNumber + 1);
          }, 2000);
        }
      } else {
        // Player was defeated
        setIsDefeated(true);
        setPlayerStats(prev => ({
          ...prev,
          current_hp: 0
        }));
      }

    } catch (err) {
      setError(err.message || 'Failed to process floor');
    } finally {
      setLoading(false);
    }
  }, [character, dungeon.floors]);

  useEffect(() => {
    if (run && dungeon && character) {
      // Start first floor
      startFloor(1);
    }
  }, [run, dungeon, character, startFloor]);

  const generateEnemyForFloor = (floorNumber) => {
    // Simple enemy generation based on floor
    const enemyTypes = [
      { name: 'Goblin Scout', hp: 30, attack: 8, defense: 5, speed: 8 },
      { name: 'Orc Warrior', hp: 50, attack: 12, defense: 8, speed: 10 },
      { name: 'Fire Mage', hp: 40, attack: 15, defense: 6, speed: 12 },
      { name: 'Shadow Assassin', hp: 45, attack: 18, defense: 8, speed: 15 },
      { name: 'Dragon Knight', hp: 80, attack: 25, defense: 15, speed: 10 }
    ];

    // Scale enemy based on floor
    const baseEnemy = enemyTypes[Math.min(floorNumber - 1, enemyTypes.length - 1)];
    const scale = 1 + (floorNumber * 0.1);

    return {
      name: baseEnemy.name,
      max_hp: Math.floor(baseEnemy.hp * scale),
      current_hp: Math.floor(baseEnemy.hp * scale),
      attack: Math.floor(baseEnemy.attack * scale),
      defense: Math.floor(baseEnemy.defense * scale),
      speed: Math.floor(baseEnemy.speed * scale)
    };
  };

  const simulateCombat = (player, enemy, floorNumber) => {
    // Simple combat simulation
    const playerDamage = Math.max(1, player.attack - Math.floor(enemy.defense * 0.5));
    const enemyDamage = Math.max(1, enemy.attack - Math.floor(player.defense * 0.5));

    // Simulate rounds
    let playerHp = player.current_hp;
    let enemyHp = enemy.current_hp;
    let rounds = 0;
    const maxRounds = 50;

    while (playerHp > 0 && enemyHp > 0 && rounds < maxRounds) {
      // Determine who attacks first based on speed
      if (player.speed >= enemy.speed) {
        enemyHp -= playerDamage;
        if (enemyHp > 0) {
          playerHp -= enemyDamage;
        }
      } else {
        playerHp -= enemyDamage;
        if (playerHp > 0) {
          enemyHp -= playerDamage;
        }
      }
      rounds++;
    }

    return {
      winner: playerHp > 0 ? player.character_id : 'enemy',
      player_hp: Math.max(0, playerHp),
      opponent_hp: Math.max(0, enemyHp),
      rounds: rounds,
      player_damage: player.max_hp - Math.max(0, playerHp),
      opponent_damage: enemy.max_hp - Math.max(0, enemyHp)
    };
  };

  const handleCompleteDungeon = async () => {
    try {
      setLoading(true);
      
      // Complete dungeon run
      const completionResult = await dungeonService.completeDungeon(
        run.run_id,
        run.player_id,
        inventory,
        currentFloor - 1 // Floors completed
      );

      // Navigate to completion page
      navigate('/dungeon-completion', {
        state: {
          run: completionResult.run,
          dungeon: dungeon,
          rewards: completionResult.run.rewards_earned || [],
          currency: completionResult.run.currency_earned || 0,
          completed: completionResult.run.completed,
          floorsCompleted: currentFloor - 1
        }
      });
    } catch (err) {
      setError(err.error || 'Failed to complete dungeon');
    } finally {
      setLoading(false);
    }
  };

  const handleAbandonDungeon = async () => {
    try {
      setLoading(true);
      
      // Complete with partial progress
      await dungeonService.completeDungeon(
        run.run_id,
        run.player_id,
        inventory,
        currentFloor - 1
      );

      // Navigate back to dungeon selection
      navigate('/dungeons');
    } catch (err) {
      setError(err.error || 'Failed to abandon dungeon');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return ((currentFloor - 1) / dungeon.floors) * 100;
  };

  const getFloorStatus = (floorNumber) => {
    if (floorNumber < currentFloor) return 'completed';
    if (floorNumber === currentFloor) return 'current';
    return 'locked';
  };

  if (error && !loading) {
    return (
      <div className="dungeon-run-container">
        <button onClick={() => navigate('/dungeons')} className="back-btn">
          ← Back to Dungeons
        </button>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!run || !dungeon || !character) {
    return (
      <div className="dungeon-run-container">
        <button onClick={() => navigate('/dungeons')} className="back-btn">
          ← Back to Dungeons
        </button>
        <div className="error-message">Missing dungeon data</div>
      </div>
    );
  }

  return (
    <div className="dungeon-run-container">
      <button onClick={() => navigate('/dungeons')} className="back-btn">
        ← Back to Dungeons
      </button>

      <header className="header">
        <h1>🏛️ {dungeon.name}</h1>
      </header>

      <div className="run-info">
        <div className="run-header">
          <div className="dungeon-name">Floor {currentFloor} of {dungeon.floors}</div>
          <div className="difficulty-badge">{dungeon.difficulty}</div>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            >
              {Math.floor(getProgressPercentage())}%
            </div>
          </div>

          <div className="floors-grid">
            {Array.from({ length: dungeon.floors }, (_, i) => i + 1).map(floor => (
              <div 
                key={floor} 
                className={`floor-item ${getFloorStatus(floor)}`}
              >
                <div className="floor-number">{floor}</div>
                <div className="floor-status">
                  {getFloorStatus(floor) === 'completed' ? '✓' : 
                   getFloorStatus(floor) === 'current' ? '⚔️' : '🔒'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}

      {!loading && currentEnemy && (
        <div className="character-status">
          <div className="status-card player">
            <div className="status-title player">🛡️ {character.name}</div>
            {playerStats && (
              <div className="status-stats">
                <div className="stat">
                  <div className="stat-label">HP</div>
                  <div className="stat-value">{playerStats.current_hp}/{playerStats.max_hp}</div>
                  <div className="health-bar">
                    <div 
                      className="health-fill player" 
                      style={{ width: `${(playerStats.current_hp / playerStats.max_hp) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">Attack</div>
                  <div className="stat-value">{playerStats.attack}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Defense</div>
                  <div className="stat-value">{playerStats.defense}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Speed</div>
                  <div className="stat-value">{playerStats.speed}</div>
                </div>
              </div>
            )}
          </div>

          <div className="status-card enemy">
            <div className="status-title enemy">⚔️ {currentEnemy.name}</div>
            <div className="status-stats">
              <div className="stat">
                <div className="stat-label">HP</div>
                <div className="stat-value">{currentEnemy.current_hp}/{currentEnemy.max_hp}</div>
                <div className="health-bar">
                  <div 
                    className="health-fill" 
                    style={{ width: `${(currentEnemy.current_hp / currentEnemy.max_hp) * 100}%` }}
                  />
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Attack</div>
                <div className="stat-value">{currentEnemy.attack}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Defense</div>
                <div className="stat-value">{currentEnemy.defense}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Speed</div>
                <div className="stat-value">{currentEnemy.speed}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {combatLogs.length > 0 && (
        <div className="combat-section">
          <div className="combat-header">⚔️ Combat Log</div>
          <div className="combat-logs">
            {combatLogs.map((log, index) => (
              <div key={index} className={`combat-log ${log.result}`}>
                <div className="combat-log-header">
                  Floor {log.floor} - {log.result === 'victory' ? 'Victory!' : 'Defeat!'}
                </div>
                <div className="combat-log-details">
                  Fought {log.enemy} - {log.details.rounds} rounds
                  {log.result === 'victory' 
                    ? ` - Damage taken: ${log.details.player_damage}`
                    : ` - Damage dealt: ${log.details.opponent_damage}`
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isCompleted || isDefeated) && (
        <div className="action-buttons">
          <button 
            className="btn btn-success" 
            onClick={handleCompleteDungeon}
            disabled={loading}
          >
            🏆 Complete Dungeon
          </button>
          {isDefeated && (
            <button 
              className="btn btn-warning" 
              onClick={handleAbandonDungeon}
              disabled={loading}
            >
              🏃 Abandon Run
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DungeonRun;