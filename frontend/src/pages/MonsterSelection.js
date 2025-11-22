import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { combatService } from '../services/api';
import './MonsterSelection.css';

const MonsterSelection = () => {
  const navigate = useNavigate();
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonster, setSelectedMonster] = useState(null);

  useEffect(() => {
    loadMonsters();
  }, []);

  const loadMonsters = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await combatService.getMonsters();
      setMonsters(data.monsters || []);
    } catch (err) {
      setError(err.error || 'Failed to load monsters');
    } finally {
      setLoading(false);
    }
  };

  const handleMonsterSelect = (monster) => {
    setSelectedMonster(monster);
  };

  const handleStartCombat = () => {
    if (selectedMonster) {
      navigate('/combat', { state: { monster: selectedMonster } });
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      tier_1: '#6b7280',
      tier_2: '#3b82f6',
      tier_3: '#8b5cf6',
      tier_4: '#ef4444',
    };
    return colors[tier] || '#6b7280';
  };

  const getTierLabel = (tier) => {
    const labels = {
      tier_1: 'Common',
      tier_2: 'Elite',
      tier_3: 'Mini-Boss',
      tier_4: 'Boss',
    };
    return labels[tier] || 'Unknown';
  };

  const getElementIcon = (element) => {
    const icons = {
      fire: '🔥',
      water: '💧',
      earth: '🗿',
      wind: '💨',
      neutral: '⚪',
    };
    return icons[element] || '⚪';
  };

  if (loading) {
    return (
      <div className="monster-selection-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="monster-selection-container">
      <header className="monster-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Select Your Opponent</h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="monster-grid">
        {monsters.map((monster) => (
          <div
            key={monster.monster_id}
            className={`monster-card ${selectedMonster?.monster_id === monster.monster_id ? 'selected' : ''}`}
            onClick={() => handleMonsterSelect(monster)}
          >
            <div className="monster-card-header">
              <h3 className="monster-name">{monster.name}</h3>
              <span
                className="monster-tier"
                style={{ backgroundColor: getTierColor(monster.tier) }}
              >
                {getTierLabel(monster.tier)}
              </span>
            </div>

            <div className="monster-info">
              <div className="monster-level">Level {monster.level}</div>
              <div className="monster-element">
                {getElementIcon(monster.element)} {monster.element}
              </div>
            </div>

            <p className="monster-description">{monster.description}</p>

            <div className="monster-stats">
              <div className="stat">
                <span className="stat-label">HP</span>
                <span className="stat-value">{monster.max_hp}</span>
              </div>
              <div className="stat">
                <span className="stat-label">ATK</span>
                <span className="stat-value">{monster.attack}</span>
              </div>
              <div className="stat">
                <span className="stat-label">DEF</span>
                <span className="stat-value">{monster.defense}</span>
              </div>
              <div className="stat">
                <span className="stat-label">SPD</span>
                <span className="stat-value">{monster.speed}</span>
              </div>
            </div>

            <div className="loot-preview">
              <h4>Loot Preview</h4>
              <div className="loot-currency">{monster.loot_preview.currency}</div>
              <div className="loot-items">
                {monster.loot_preview.items.map((item, idx) => (
                  <span key={idx} className="loot-item">{item}</span>
                ))}
              </div>
              <div className="loot-chance">Drop Chance: {monster.loot_preview.drop_chance}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedMonster && (
        <div className="combat-start-section">
          <button className="start-combat-btn" onClick={handleStartCombat}>
            Start Combat with {selectedMonster.name}
          </button>
        </div>
      )}
    </div>
  );
};

export default MonsterSelection;
