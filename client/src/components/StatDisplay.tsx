import './StatDisplay.css';

interface StatDisplayProps {
  label: string;
  value: number;
  maxValue?: number;
  icon?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showPercentage?: boolean;
  color?: string;
  className?: string;
}

const statIcons: Record<string, string> = {
  hp: '❤️',
  attack: '⚔️',
  defense: '🛡️',
  speed: '⚡',
  level: '⭐',
  experience: '✨',
  mana: '💧',
  stamina: '💪',
};

export function StatDisplay({ 
  label, 
  value, 
  maxValue,
  icon,
  variant = 'default',
  showPercentage = false,
  color,
  className = '' 
}: StatDisplayProps) {
  const normalizedLabel = label.toLowerCase();
  const displayIcon = icon || statIcons[normalizedLabel] || '📊';
  const percentage = maxValue ? Math.round((value / maxValue) * 100) : 0;

  return (
    <div 
      className={`stat-display stat-display-${variant} ${className}`}
      data-stat-label={normalizedLabel}
      style={color ? { '--stat-color': color } as React.CSSProperties : undefined}
    >
      <span className="stat-icon">{displayIcon}</span>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <div className="stat-value-container">
          <span className="stat-value">
            {value}
            {maxValue && <span className="stat-max">/{maxValue}</span>}
          </span>
          {showPercentage && maxValue && (
            <span className="stat-percentage">({percentage}%)</span>
          )}
        </div>
        {variant === 'detailed' && maxValue && (
          <div className="stat-bar">
            <div 
              className="stat-bar-fill" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
