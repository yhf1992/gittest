import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { authService, dungeonService } from '../services/api';
import './DungeonSelection.css';

const DungeonSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dungeons, setDungeons] = useState([]);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load profile data and dungeons in parallel
        const [profile, dungeonsData] = await Promise.all([
          authService.getProfile(),
          dungeonService.getDungeons()
        ]);
        
        setProfileData(profile);
        setDungeons(dungeonsData.dungeons || []);
      } catch (err) {
        setError(err.error || 'Failed to load dungeon data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEnterDungeon = async (dungeon) => {
    try {
      // Check if player can enter dungeon
      const character = profileData?.character;
      if (!character) {
        setError('Character data not found');
        return;
      }

      // Create basic inventory structure
      const inventory = {
        player_id: user.id || profileData.user.id,
        currency: profileData.currency || 0,
        equipment: {},
        inventory: []
      };

      // Enter dungeon
      const result = await dungeonService.enterDungeon(
        user.id || profileData.user.id,
        dungeon.dungeon_id,
        character,
        inventory
      );

      // Navigate to dungeon run page with run data
      navigate('/dungeon-run', { 
        state: { 
          run: result.run,
          dungeon: dungeon,
          character: character,
          inventory: result.inventory
        } 
      });
    } catch (err) {
      setError(err.error || 'Failed to enter dungeon');
    }
  };

  const getDifficultyClass = (difficulty) => {
    return `difficulty-${difficulty.toLowerCase()}`;
  };

  const getDungeonStatus = (dungeon) => {
    const character = profileData?.character;
    if (!character) return { status: 'locked', message: 'Character data required' };

    // Check level requirement
    if (character.level < dungeon.level_requirement) {
      return { 
        status: 'locked', 
        message: `Requires level ${dungeon.level_requirement}` 
      };
    }

    // Check entry cost
    const currency = profileData.currency || 0;
    if (currency < dungeon.entry_cost) {
      return { 
        status: 'locked', 
        message: `Requires ${dungeon.entry_cost} gold` 
      };
    }

    // Check daily attempts (simplified - would need backend data)
    return { 
      status: 'available', 
      message: 'Ready to enter' 
    };
  };

  if (loading) {
    return (
      <div className="dungeon-selection-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dungeon-selection-container">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const character = profileData?.character;
  const displayUser = profileData?.user || user;

  return (
    <div className="dungeon-selection-container">
      <button onClick={() => navigate('/dashboard')} className="back-btn">
        ← Back to Dashboard
      </button>

      <header className="header">
        <h1>🏛️ Dungeon Selection</h1>
        <p>Choose your challenge and test your strength</p>
      </header>

      {/* Player Information */}
      <section className="player-info">
        <h2>Welcome, {displayUser?.username}</h2>
        {character && (
          <div className="player-stats">
            <div className="stat-item">
              <div className="stat-label">Level</div>
              <div className="stat-value">{character.level}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Class</div>
              <div className="stat-value">{character.character_class}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Gold</div>
              <div className="stat-value">{profileData.currency || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Attack</div>
              <div className="stat-value">{character.attack}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Defense</div>
              <div className="stat-value">{character.defense}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Speed</div>
              <div className="stat-value">{character.speed}</div>
            </div>
          </div>
        )}
      </section>

      {/* Dungeons Grid */}
      <div className="dungeons-grid">
        {dungeons.map((dungeon) => {
          const status = getDungeonStatus(dungeon);
          const canEnter = status.status === 'available';

          return (
            <div key={dungeon.dungeon_id} className="dungeon-card">
              <div className="dungeon-header">
                <h3 className="dungeon-name">{dungeon.name}</h3>
                <span className={`dungeon-difficulty ${getDifficultyClass(dungeon.difficulty)}`}>
                  {dungeon.difficulty}
                </span>
              </div>

              <p className="dungeon-description">{dungeon.description}</p>

              <div className="dungeon-details">
                <div className="detail-item">
                  <span className="detail-icon">⚔️</span>
                  <div>
                    <div className="detail-label">Level Req</div>
                    <div className="detail-value">{dungeon.level_requirement}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">💰</span>
                  <div>
                    <div className="detail-label">Entry Cost</div>
                    <div className="detail-value">{dungeon.entry_cost} gold</div>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🏰</span>
                  <div>
                    <div className="detail-label">Floors</div>
                    <div className="detail-value">{dungeon.floors}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">⭐</span>
                  <div>
                    <div className="detail-label">Daily Attempts</div>
                    <div className="detail-value">{dungeon.daily_reset_count}</div>
                  </div>
                </div>
              </div>

              <div className={`dungeon-status status-${status.status}`}>
                {status.message}
              </div>

              <button
                className="enter-btn"
                onClick={() => handleEnterDungeon(dungeon)}
                disabled={!canEnter}
              >
                {canEnter ? 'Enter Dungeon' : 'Locked'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DungeonSelection;