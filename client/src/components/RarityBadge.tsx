import { ItemRarity } from '../types/combat';
import './RarityBadge.css';

interface RarityBadgeProps {
  rarity: ItemRarity;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const rarityLabels: Record<ItemRarity, string> = {
  [ItemRarity.COMMON]: 'Common',
  [ItemRarity.UNCOMMON]: 'Uncommon',
  [ItemRarity.RARE]: 'Rare',
  [ItemRarity.EPIC]: 'Epic',
  [ItemRarity.LEGENDARY]: 'Legendary',
};

export function RarityBadge({ 
  rarity, 
  size = 'md', 
  showLabel = true,
  className = '' 
}: RarityBadgeProps) {
  return (
    <span 
      className={`rarity-badge rarity-${rarity} rarity-badge-${size} ${className}`}
      data-rarity={rarity}
    >
      {showLabel && rarityLabels[rarity]}
    </span>
  );
}
