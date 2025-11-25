import React from 'react';
import { Player } from 'xianxia-shared';
import './DungeonExplorer.css';

interface DungeonExplorerProps {
  player: Player;
}

export function DungeonExplorer({ player }: DungeonExplorerProps) {
  return (
    <div className="dungeon-explorer">
      <h2>Dungeon Explorer</h2>
      <p>Dungeon exploration interface coming soon...</p>
      <div className="placeholder-content">
        <p>Available dungeons will appear here</p>
        <p>Your level: {player.level}</p>
      </div>
    </div>
  );
}