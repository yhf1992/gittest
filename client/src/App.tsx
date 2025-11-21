import { useState, useEffect } from 'react';
import { HealthResponse, ApiResponse } from '@xianxia/shared';

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data: ApiResponse<HealthResponse> = await response.json();
        
        if (data.success && data.data) {
          setHealth(data.data);
        } else {
          setError(data.error || 'Failed to fetch health status');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Xianxia Mini-RPG</h1>
        <p>A mystical journey awaits...</p>
        
        <div className="card">
          <h2>Server Status</h2>
          {loading && <p>Checking server status...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {health && (
            <div>
              <p>Status: <span style={{ color: health.status === 'ok' ? 'green' : 'red' }}>{health.status}</span></p>
              <p>Version: {health.version}</p>
              <p>Uptime: {Math.floor(health.uptime)}s</p>
              <p>Timestamp: {new Date(health.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Game Features</h3>
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            <li>Character creation and progression</li>
            <li>Turn-based combat system</li>
            <li>Experience and leveling</li>
            <li>Equipment and items</li>
            <li>Quest system</li>
          </ul>
        </div>

        <button 
          onClick={() => window.location.reload()}
          style={{ marginTop: '1rem' }}
        >
          Refresh Status
        </button>
      </header>
    </div>
  );
}

export default App;