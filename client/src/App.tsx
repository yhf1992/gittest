import React, { useState, useEffect } from 'react';
import { GameDashboard } from './components/GameDashboard';
import { CultivationProgress } from './components/CultivationProgress';
import { EquipmentRack } from './components/EquipmentRack';
import { CombatArena } from './components/CombatArena';
import { DungeonExplorer } from './components/DungeonExplorer';
import { Player, GameUtils } from 'xianxia-shared';
import './styles/theme.css';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading player data
    const loadPlayer = async () => {
      try {
        // In a real app, this would be an API call
        const mockPlayer: Player = {
          id: 'player-1',
          username: 'Cultivation Master',
          email: 'master@xianxia.com',
          level: 5,
          experience: BigInt(75000),
          cultivationTierId: 'tier-5',
          currentHp: 850,
          maxHp: 1000,
          currentMp: 120,
          maxMp: 150,
          attack: 250,
          defense: 180,
          speed: 95,
          critRate: 0.25,
          critDamage: 1.5,
          gold: BigInt(50000),
          spiritStones: BigInt(500),
          createdAt: new Date(),
          updatedAt: new Date(),
          cultivationTier: {
            id: 'tier-5',
            name: 'Golden Core',
            description: 'The path to immortality begins',
            level: 5,
            minExp: BigInt(60000),
            maxHp: 1000,
            maxMp: 150,
            attack: 200,
            defense: 150,
            speed: 80,
            multiplier: 1.25,
            createdAt: new Date(),
          },
        };
        setPlayer(mockPlayer);
      } catch (error) {
        console.error('Failed to load player:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1 className="loading-title">修炼中...</h1>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
          <p className="loading-subtitle">Cultivating your spiritual energy</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="error-screen">
        <h1>Failed to load player data</h1>
        <p>Please refresh the page to try again.</p>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <GameDashboard player={player} onPlayerUpdate={setPlayer} />;
      case 'cultivation':
        return <CultivationProgress player={player} />;
      case 'equipment':
        return <EquipmentRack player={player} />;
      case 'combat':
        return <CombatArena player={player} />;
      case 'dungeons':
        return <DungeonExplorer player={player} />;
      default:
        return <GameDashboard player={player} onPlayerUpdate={setPlayer} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="game-title">仙途</h1>
            <p className="game-subtitle">Xian Tian Journey</p>
          </div>
          <div className="player-info">
            <div className="player-name">{player.username}</div>
            <div className="player-level">Level {player.level}</div>
            <div className="player-resources">
              <span className="gold-icon">💰 {GameUtils.formatLargeNumber(player.gold)}</span>
              <span className="spirit-icon">💎 {GameUtils.formatLargeNumber(player.spiritStones)}</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">🏠</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'cultivation' ? 'active' : ''}`}
            onClick={() => setActiveTab('cultivation')}
          >
            <span className="nav-icon">⚡</span>
            <span>Cultivation</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'equipment' ? 'active' : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            <span className="nav-icon">⚔️</span>
            <span>Equipment</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'combat' ? 'active' : ''}`}
            onClick={() => setActiveTab('combat')}
          >
            <span className="nav-icon">⚔️</span>
            <span>Combat</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'dungeons' ? 'active' : ''}`}
            onClick={() => setActiveTab('dungeons')}
          >
            <span className="nav-icon">🏛️</span>
            <span>Dungeons</span>
          </button>
        </div>
      </nav>

      <main className="app-main">
        <div className="content-container">
          {renderActiveTab()}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2024 Xianxia Cultivation Game</p>
          <p>Forge your path to immortality</p>
        </div>
      </footer>
    </div>
  );
}

export default App;