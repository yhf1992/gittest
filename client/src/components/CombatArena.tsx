import React from 'react';
import { Player } from 'xianxia-shared';
import './CombatArena.css';

interface CombatArenaProps {
  player: Player;
}

export function CombatArena({ player }: CombatArenaProps) {
  return (
    <div className="combat-arena">
      <h2>Combat Arena</h2>
      <p>Battle interface coming soon...</p>
      <div className="placeholder-content">
        <p>Prepare for battle!</p>
        <p>Current HP: {player.currentHp}/{player.maxHp}</p>
        <p>Attack Power: {player.attack}</p>
      </div>
    </div>
  );
}