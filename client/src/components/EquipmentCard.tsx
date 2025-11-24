import { Equipment, EquipmentSlot } from '../types/combat';
import { RarityBadge } from './RarityBadge';
import './EquipmentCard.css';

interface EquipmentCardProps {
  equipment: Equipment;
  onClick?: () => void;
  isEquipped?: boolean;
  showActions?: boolean;
  onEquip?: () => void;
  onUnequip?: () => void;
  className?: string;
}

const slotIcons: Record<EquipmentSlot, string> = {
  [EquipmentSlot.WEAPON]: '⚔️',
  [EquipmentSlot.ARMOR]: '🛡️',
  [EquipmentSlot.ACCESSORY]: '💍',
};

export function EquipmentCard({ 
  equipment, 
  onClick,
  isEquipped = false,
  showActions = true,
  onEquip,
  onUnequip,
  className = '' 
}: EquipmentCardProps) {
  const slotIcon = slotIcons[equipment.slot];
  const hasStats = equipment.attack || equipment.defense || equipment.hp || equipment.speed;

  return (
    <div 
      className={`equipment-card equipment-rarity-${equipment.rarity} ${isEquipped ? 'equipped' : ''} ${className}`}
      onClick={onClick}
      data-equipment-id={equipment.id}
    >
      <div className="equipment-header">
        <div className="equipment-title-section">
          <span className="equipment-slot-icon">{slotIcon}</span>
          <div className="equipment-title-group">
            <h3 className="equipment-name">{equipment.name}</h3>
            <span className="equipment-level">Level {equipment.level}</span>
          </div>
        </div>
        <RarityBadge rarity={equipment.rarity} size="sm" />
      </div>

      {hasStats && (
        <div className="equipment-stats">
          {equipment.attack !== undefined && equipment.attack > 0 && (
            <div className="equipment-stat">
              <span className="stat-icon">⚔️</span>
              <span className="stat-label">ATK</span>
              <span className="stat-value">+{equipment.attack}</span>
            </div>
          )}
          {equipment.defense !== undefined && equipment.defense > 0 && (
            <div className="equipment-stat">
              <span className="stat-icon">🛡️</span>
              <span className="stat-label">DEF</span>
              <span className="stat-value">+{equipment.defense}</span>
            </div>
          )}
          {equipment.hp !== undefined && equipment.hp > 0 && (
            <div className="equipment-stat">
              <span className="stat-icon">❤️</span>
              <span className="stat-label">HP</span>
              <span className="stat-value">+{equipment.hp}</span>
            </div>
          )}
          {equipment.speed !== undefined && equipment.speed > 0 && (
            <div className="equipment-stat">
              <span className="stat-icon">⚡</span>
              <span className="stat-label">SPD</span>
              <span className="stat-value">+{equipment.speed}</span>
            </div>
          )}
        </div>
      )}

      {equipment.special_effect && (
        <div className="equipment-special-effect">
          <span className="special-effect-icon">✨</span>
          <p className="special-effect-text">{equipment.special_effect}</p>
        </div>
      )}

      {showActions && (
        <div className="equipment-actions">
          {isEquipped ? (
            <button 
              className="equipment-action-btn unequip-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUnequip?.();
              }}
            >
              Unequip
            </button>
          ) : (
            <button 
              className="equipment-action-btn equip-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEquip?.();
              }}
            >
              Equip
            </button>
          )}
        </div>
      )}

      {isEquipped && (
        <div className="equipped-indicator">
          <span>⚡ Equipped</span>
        </div>
      )}
    </div>
  );
}
