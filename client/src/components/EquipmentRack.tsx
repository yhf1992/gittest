import React from 'react';
import { Player } from 'xianxia-shared';
import './EquipmentRack.css';

interface EquipmentRackProps {
  player: Player;
}

export function EquipmentRack({ player }: EquipmentRackProps) {
  return (
    <div className="equipment-rack">
      <h2>Equipment Rack</h2>
      <p>Equipment management interface coming soon...</p>
      <div className="placeholder-content">
        <p>Equipment slots will be displayed here</p>
      </div>
    </div>
  );
}