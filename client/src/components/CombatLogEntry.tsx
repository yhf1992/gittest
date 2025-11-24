import { CombatAction } from '../types/combat';
import { StatusBadge } from './StatusBadge';
import './CombatLogEntry.css';

interface CombatLogEntryProps {
  action: CombatAction;
  variant?: 'default' | 'compact';
  className?: string;
}

const actionTypeConfig = {
  attack: { icon: '⚔️', color: '#e74c3c' },
  skill: { icon: '✨', color: '#9b59b6' },
  status: { icon: '🎯', color: '#3498db' },
  heal: { icon: '💚', color: '#2ecc71' },
};

export function CombatLogEntry({ 
  action, 
  variant = 'default',
  className = '' 
}: CombatLogEntryProps) {
  const config = actionTypeConfig[action.action_type];
  
  return (
    <div 
      className={`combat-log-entry combat-log-${variant} ${action.is_crit ? 'critical-hit' : ''} ${action.is_miss ? 'miss' : ''} ${className}`}
      data-turn={action.turn}
      data-action-type={action.action_type}
    >
      <div className="combat-log-header">
        <span className="combat-log-turn">Turn {action.turn}</span>
        <span 
          className="combat-log-type-icon"
          style={{ color: config.color }}
        >
          {config.icon}
        </span>
      </div>

      <div className="combat-log-content">
        <div className="combat-log-participants">
          <span className="participant attacker">{action.attacker_name}</span>
          <span className="combat-arrow">→</span>
          <span className="participant defender">{action.defender_name}</span>
        </div>

        <p className="combat-log-message">{action.message}</p>

        {action.damage !== undefined && action.damage > 0 && (
          <div className="combat-log-damage">
            {action.is_crit && <span className="crit-indicator">CRITICAL! </span>}
            <span className="damage-value">-{action.damage} HP</span>
          </div>
        )}

        {action.healing !== undefined && action.healing > 0 && (
          <div className="combat-log-healing">
            <span className="healing-value">+{action.healing} HP</span>
          </div>
        )}

        {action.is_miss && (
          <div className="combat-log-miss">
            <span className="miss-indicator">MISS!</span>
          </div>
        )}

        {action.status_effects_applied && action.status_effects_applied.length > 0 && (
          <div className="combat-log-statuses">
            {action.status_effects_applied.map((effect, index) => (
              <StatusBadge
                key={index}
                statusType={effect.effect_type}
                value={effect.value}
                duration={effect.duration}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
