import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CombatLogEntry } from '../CombatLogEntry';
import { CombatAction, StatusEffectType } from '../../types/combat';

const mockAttackAction: CombatAction = {
  turn: 1,
  attacker_id: 'char-1',
  attacker_name: 'Hero',
  defender_id: 'char-2',
  defender_name: 'Monster',
  action_type: 'attack',
  damage: 50,
  message: 'Hero attacks Monster for 50 damage',
};

describe('CombatLogEntry', () => {
  it('renders turn number', () => {
    render(<CombatLogEntry action={mockAttackAction} />);
    expect(screen.getByText('Turn 1')).toBeInTheDocument();
  });

  it('renders attacker and defender names', () => {
    render(<CombatLogEntry action={mockAttackAction} />);
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Monster')).toBeInTheDocument();
  });

  it('renders combat message', () => {
    render(<CombatLogEntry action={mockAttackAction} />);
    expect(screen.getByText('Hero attacks Monster for 50 damage')).toBeInTheDocument();
  });

  it('displays damage value', () => {
    render(<CombatLogEntry action={mockAttackAction} />);
    expect(screen.getByText('-50 HP')).toBeInTheDocument();
  });

  it('displays critical hit indicator', () => {
    const critAction: CombatAction = {
      ...mockAttackAction,
      is_crit: true,
    };
    render(<CombatLogEntry action={critAction} />);
    expect(screen.getByText('CRITICAL!')).toBeInTheDocument();
  });

  it('displays miss indicator', () => {
    const missAction: CombatAction = {
      ...mockAttackAction,
      damage: 0,
      is_miss: true,
      message: 'Hero misses Monster',
    };
    render(<CombatLogEntry action={missAction} />);
    expect(screen.getByText('MISS!')).toBeInTheDocument();
  });

  it('displays healing value', () => {
    const healAction: CombatAction = {
      ...mockAttackAction,
      action_type: 'heal',
      healing: 30,
      damage: undefined,
      message: 'Hero heals for 30 HP',
    };
    render(<CombatLogEntry action={healAction} />);
    expect(screen.getByText('+30 HP')).toBeInTheDocument();
  });

  it('renders status effects applied', () => {
    const statusAction: CombatAction = {
      ...mockAttackAction,
      status_effects_applied: [
        {
          effect_type: StatusEffectType.STUN,
          value: 0,
          duration: 2,
          source_character_id: 'char-1',
        },
      ],
    };
    render(<CombatLogEntry action={statusAction} />);
    expect(screen.getByText('Stunned')).toBeInTheDocument();
  });

  it('renders multiple status effects', () => {
    const multiStatusAction: CombatAction = {
      ...mockAttackAction,
      status_effects_applied: [
        {
          effect_type: StatusEffectType.STUN,
          value: 0,
          duration: 2,
          source_character_id: 'char-1',
        },
        {
          effect_type: StatusEffectType.DOT,
          value: 10,
          duration: 3,
          source_character_id: 'char-1',
        },
      ],
    };
    render(<CombatLogEntry action={multiStatusAction} />);
    expect(screen.getByText('Stunned')).toBeInTheDocument();
    expect(screen.getByText('Burn')).toBeInTheDocument();
  });

  it('applies action type data attribute', () => {
    const { container } = render(<CombatLogEntry action={mockAttackAction} />);
    const entry = container.querySelector('[data-action-type="attack"]');
    expect(entry).toBeInTheDocument();
  });

  it('applies turn data attribute', () => {
    const { container } = render(<CombatLogEntry action={mockAttackAction} />);
    const entry = container.querySelector('[data-turn="1"]');
    expect(entry).toBeInTheDocument();
  });

  it('applies critical-hit CSS class for crits', () => {
    const critAction: CombatAction = {
      ...mockAttackAction,
      is_crit: true,
    };
    const { container } = render(<CombatLogEntry action={critAction} />);
    expect(container.querySelector('.critical-hit')).toBeInTheDocument();
  });

  it('applies miss CSS class for misses', () => {
    const missAction: CombatAction = {
      ...mockAttackAction,
      is_miss: true,
    };
    const { container } = render(<CombatLogEntry action={missAction} />);
    expect(container.querySelector('.miss')).toBeInTheDocument();
  });

  it('applies compact variant class', () => {
    const { container } = render(
      <CombatLogEntry action={mockAttackAction} variant="compact" />
    );
    expect(container.querySelector('.combat-log-compact')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CombatLogEntry action={mockAttackAction} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders skill action with correct icon', () => {
    const skillAction: CombatAction = {
      ...mockAttackAction,
      action_type: 'skill',
    };
    render(<CombatLogEntry action={skillAction} />);
    const { container } = render(<CombatLogEntry action={skillAction} />);
    expect(container.querySelector('[data-action-type="skill"]')).toBeInTheDocument();
  });

  it('does not render damage when damage is undefined', () => {
    const noDamageAction: CombatAction = {
      ...mockAttackAction,
      damage: undefined,
    };
    render(<CombatLogEntry action={noDamageAction} />);
    expect(screen.queryByText(/-\d+ HP/)).not.toBeInTheDocument();
  });

  it('does not render damage when damage is 0', () => {
    const zeroDamageAction: CombatAction = {
      ...mockAttackAction,
      damage: 0,
    };
    render(<CombatLogEntry action={zeroDamageAction} />);
    expect(screen.queryByText(/-0 HP/)).not.toBeInTheDocument();
  });
});
