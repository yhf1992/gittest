import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { authService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get fresh profile data
        const profile = await authService.getProfile();
        setProfileData(profile);
      } catch (err) {
        setError(err.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'fight':
        navigate('/monster-selection');
        break;
      case 'equipment':
        navigate('/equipment');
        break;
      case 'dungeon':
        navigate('/dungeons');
        break;
      default:
        break;
    }
  };

  const calculateExperienceProgress = () => {
    if (!profileData?.character) return 0;
    
    const exp = profileData.character.experience || 0;
    const level = profileData.character.level || 1;
    
    // Simple formula: 100 * level^2 experience needed for next level
    const expForCurrentLevel = 100 * Math.pow(level - 1, 2);
    const expForNextLevel = 100 * Math.pow(level, 2);
    const progress = ((exp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  };

  const getExperienceText = () => {
    if (!profileData?.character) return '0 / 100 EXP';
    
    const exp = profileData.character.experience || 0;
    const level = profileData.character.level || 1;
    const expForCurrentLevel = 100 * Math.pow(level - 1, 2);
    const expForNextLevel = 100 * Math.pow(level, 2);
    
    return `${exp - expForCurrentLevel} / ${expForNextLevel - expForCurrentLevel} EXP`;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="header">
          <h1>仙侠 Combat Engine</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
        <div className="main-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  const displayUser = profileData?.user || user;
  const character = profileData?.character;

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>仙侠 Combat Engine</h1>
        <div className="header-actions">
          <span>Welcome, {displayUser?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* User Information Section */}
        <section className="user-info">
          <div className="user-header">
            <h2 className="user-title">{character?.name || displayUser?.username}</h2>
            <div className="cultivation-level">
              {character?.cultivation_level || displayUser?.cultivation_level || '练气'}
            </div>
          </div>

          {/* Character Stats */}
          {character && (
            <>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Level</div>
                  <div className="stat-value">{character.level}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">HP</div>
                  <div className="stat-value">{character.max_hp}</div>
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
                <div className="stat-item">
                  <div className="stat-label">Class</div>
                  <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                    {character.character_class}
                  </div>
                </div>
              </div>

              {/* Experience Bar */}
              <div className="experience-bar">
                <div className="experience-label">Cultivation Progress</div>
                <div className="experience-progress">
                  <div 
                    className="experience-fill" 
                    style={{ width: `${calculateExperienceProgress()}%` }}
                  ></div>
                  <div className="experience-text">{getExperienceText()}</div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Quick Actions Section */}
        <section className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('fight')}
            >
              ⚔️ Fight Monster
            </button>
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('equipment')}
            >
              🛡️ View Equipment
            </button>
            <button 
              className="action-btn"
              onClick={() => handleQuickAction('dungeon')}
            >
              🏛️ Enter Dungeon
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;