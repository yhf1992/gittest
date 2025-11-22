import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MonsterSelection from './pages/MonsterSelection';
import CombatViewer from './pages/CombatViewer';
import EquipmentManager from './pages/EquipmentManager';
import DungeonSelection from './pages/DungeonSelection';
import DungeonRun from './pages/DungeonRun';
import DungeonCompletion from './pages/DungeonCompletion';
import './App.css';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/monster-selection" 
              element={
                <ProtectedRoute>
                  <MonsterSelection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/combat" 
              element={
                <ProtectedRoute>
                  <CombatViewer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/equipment" 
              element={
                <ProtectedRoute>
                  <EquipmentManager />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/dungeons" 
              element={
                <ProtectedRoute>
                  <DungeonSelection />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/dungeon-run" 
              element={
                <ProtectedRoute>
                  <DungeonRun />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/dungeon-completion" 
              element={
                <ProtectedRoute>
                  <DungeonCompletion />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;