import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DungeonCompletion.css';

const DungeonCompletion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { run, dungeon, rewards = [], currency = 0, completed = false, floorsCompleted = 0 } = location.state || {};
  
  const getRarityClass = (rarity) => {
    return `rarity-${(rarity || 'common').toLowerCase()}`;
  };

  const getStatusClass = () => {
    if (completed) return 'status-success';
    if (floorsCompleted > 0) return 'status-partial';
    return 'status-failed';
  };

  const getStatusText = () => {
    if (completed) return '🏆 Dungeon Completed!';
    if (floorsCompleted > 0) return '⏸️ Partial Completion';
    return '💀 Dungeon Failed';
  };

  const getEquipmentStats = (equipment) => {
    const stats = [];
    if (equipment.attack_bonus && equipment.attack_bonus > 0) {
      stats.push(`+${equipment.attack_bonus} Attack`);
    }
    if (equipment.defense_bonus && equipment.defense_bonus > 0) {
      stats.push(`+${equipment.defense_bonus} Defense`);
    }
    if (equipment.hp_bonus && equipment.hp_bonus > 0) {
      stats.push(`+${equipment.hp_bonus} HP`);
    }
    if (equipment.speed_bonus && equipment.speed_bonus > 0) {
      stats.push(`+${equipment.speed_bonus} Speed`);
    }
    if (equipment.crit_chance_bonus && equipment.crit_chance_bonus > 0) {
      stats.push(`+${equipment.crit_chance_bonus}% Crit`);
    }
    return stats.join(', ') || 'No special stats';
  };

  const handleRunAgain = () => {
    // Navigate back to the same dungeon for another run
    navigate('/dungeons');
  };

  const handleViewInventory = () => {
    navigate('/equipment');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!run || !dungeon) {
    return (
      <div className="dungeon-completion-container">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <div className="error-message">Missing completion data</div>
      </div>
    );
  }

  return (
    <div className="dungeon-completion-container">
      <button onClick={() => navigate('/dashboard')} className="back-btn">
        ← Back to Dashboard
      </button>

      <header className="header">
        <h1>{dungeon.name}</h1>
        <div className={`completion-status ${getStatusClass()}`}>
          {getStatusText()}
        </div>
      </header>

      <div className="completion-summary">
        <div className="summary-header">Run Summary</div>
        <div className="summary-stats">
          <div className="stat-item">
            <div className="stat-label">Floors</div>
            <div className="stat-value">{floorsCompleted}/{dungeon.floors}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Difficulty</div>
            <div className="stat-value">{dungeon.difficulty}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Time</div>
            <div className="stat-value">
              {run.start_time && run.end_time 
                ? Math.floor((new Date(run.end_time) - new Date(run.start_time)) / 1000 / 60) + ' min'
                : 'Unknown'
              }
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Status</div>
            <div className="stat-value">{completed ? 'Victory' : floorsCompleted > 0 ? 'Partial' : 'Failed'}</div>
          </div>
        </div>
      </div>

      <div className="rewards-section">
        <div className="rewards-header">🎁 Rewards Earned</div>
        
        {currency > 0 && (
          <div className="currency-reward">
            <div>Gold Earned</div>
            <div className="currency-amount">💰 {currency}</div>
          </div>
        )}

        {rewards.length > 0 ? (
          <div className="equipment-rewards">
            {rewards.map((equipment, index) => (
              <div key={index} className="equipment-item">
                <div className="equipment-name">{equipment.name}</div>
                <div className="equipment-slot">{equipment.slot}</div>
                <span className={`equipment-rarity ${getRarityClass(equipment.rarity)}`}>
                  {equipment.rarity}
                </span>
                <div className="equipment-stats">
                  {getEquipmentStats(equipment)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-rewards">
            No equipment rewards earned this run
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="btn btn-success" onClick={handleRunAgain}>
          🔄 Run Again
        </button>
        <button className="btn btn-primary" onClick={handleViewInventory}>
          🎒 View Inventory
        </button>
        <button className="btn btn-warning" onClick={handleBackToDashboard}>
          🏠 Dashboard
        </button>
      </div>
    </div>
  );
};

export default DungeonCompletion;