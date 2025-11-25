import React from 'react';
import { Player } from 'xianxia-shared';
import './CultivationProgress.css';

interface CultivationProgressProps {
  player: Player;
}

export function CultivationProgress({ player }: CultivationProgressProps) {
  return (
    <div className="cultivation-progress">
      <h2>Cultivation Progress</h2>
      <p>Detailed cultivation interface coming soon...</p>
      <div className="placeholder-content">
        <p>Current Level: {player.level}</p>
        <p>Experience: {player.experience.toString()}</p>
      </div>
    </div>
  );
}