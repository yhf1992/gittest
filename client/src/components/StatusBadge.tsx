import { StatusEffectType } from '../types/combat';
import './StatusBadge.css';

interface StatusBadgeProps {
  statusType: StatusEffectType;
  value?: number;
  duration?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const statusConfig: Record<StatusEffectType, { label: string; icon: string }> = {
  [StatusEffectType.STUN]: { label: 'Stunned', icon: '⚡' },
  [StatusEffectType.DOT]: { label: 'Burn', icon: '🔥' },
  [StatusEffectType.DEFENSE_DEBUFF]: { label: 'Weakened', icon: '🛡️' },
  [StatusEffectType.MULTI_HIT]: { label: 'Multi-Hit', icon: '⚔️' },
  [StatusEffectType.ATTACK_BUFF]: { label: 'Empowered', icon: '💪' },
  [StatusEffectType.DEFENSE_BUFF]: { label: 'Fortified', icon: '🛡️' },
  [StatusEffectType.HEAL_OVER_TIME]: { label: 'Regenerating', icon: '💚' },
};

export function StatusBadge({ 
  statusType, 
  value, 
  duration, 
  size = 'md',
  showDetails = true,
  className = '' 
}: StatusBadgeProps) {
  const config = statusConfig[statusType];
  
  return (
    <div 
      className={`status-badge status-${statusType} status-badge-${size} ${className}`}
      data-status-type={statusType}
      title={`${config.label}${duration ? ` (${duration} turns)` : ''}${value ? ` - ${value}` : ''}`}
    >
      <span className="status-icon">{config.icon}</span>
      {showDetails && (
        <div className="status-details">
          <span className="status-label">{config.label}</span>
          {duration !== undefined && (
            <span className="status-duration">{duration}t</span>
          )}
          {value !== undefined && (
            <span className="status-value">{value > 0 ? `+${value}` : value}</span>
          )}
        </div>
      )}
    </div>
  );
}
