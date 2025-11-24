import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';
import { StatusEffectType } from '../../types/combat';

describe('StatusBadge', () => {
  it('renders stun status', () => {
    render(<StatusBadge statusType={StatusEffectType.STUN} />);
    expect(screen.getByText('Stunned')).toBeInTheDocument();
  });

  it('renders DoT status', () => {
    render(<StatusBadge statusType={StatusEffectType.DOT} />);
    expect(screen.getByText('Burn')).toBeInTheDocument();
  });

  it('renders defense debuff status', () => {
    render(<StatusBadge statusType={StatusEffectType.DEFENSE_DEBUFF} />);
    expect(screen.getByText('Weakened')).toBeInTheDocument();
  });

  it('renders attack buff status', () => {
    render(<StatusBadge statusType={StatusEffectType.ATTACK_BUFF} />);
    expect(screen.getByText('Empowered')).toBeInTheDocument();
  });

  it('renders defense buff status', () => {
    render(<StatusBadge statusType={StatusEffectType.DEFENSE_BUFF} />);
    expect(screen.getByText('Fortified')).toBeInTheDocument();
  });

  it('renders heal over time status', () => {
    render(<StatusBadge statusType={StatusEffectType.HEAL_OVER_TIME} />);
    expect(screen.getByText('Regenerating')).toBeInTheDocument();
  });

  it('displays duration when provided', () => {
    render(<StatusBadge statusType={StatusEffectType.STUN} duration={3} />);
    expect(screen.getByText('3t')).toBeInTheDocument();
  });

  it('displays value when provided', () => {
    render(<StatusBadge statusType={StatusEffectType.DOT} value={50} />);
    expect(screen.getByText('+50')).toBeInTheDocument();
  });

  it('displays negative value correctly', () => {
    render(<StatusBadge statusType={StatusEffectType.DEFENSE_DEBUFF} value={-20} />);
    expect(screen.getByText('-20')).toBeInTheDocument();
  });

  it('applies size variant classes', () => {
    const { container: smallContainer } = render(
      <StatusBadge statusType={StatusEffectType.STUN} size="sm" />
    );
    expect(smallContainer.querySelector('.status-badge-sm')).toBeInTheDocument();

    const { container: largeContainer } = render(
      <StatusBadge statusType={StatusEffectType.STUN} size="lg" />
    );
    expect(largeContainer.querySelector('.status-badge-lg')).toBeInTheDocument();
  });

  it('hides details when showDetails is false', () => {
    render(
      <StatusBadge 
        statusType={StatusEffectType.STUN} 
        duration={3} 
        showDetails={false} 
      />
    );
    expect(screen.queryByText('Stunned')).not.toBeInTheDocument();
    expect(screen.queryByText('3t')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatusBadge statusType={StatusEffectType.STUN} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('sets data-status-type attribute', () => {
    const { container } = render(<StatusBadge statusType={StatusEffectType.DOT} />);
    const badge = container.querySelector('[data-status-type="dot"]');
    expect(badge).toBeInTheDocument();
  });

  it('sets title with all info', () => {
    const { container } = render(
      <StatusBadge statusType={StatusEffectType.STUN} duration={3} value={10} />
    );
    const badge = container.querySelector('.status-badge');
    expect(badge).toHaveAttribute('title', expect.stringContaining('Stunned'));
    expect(badge).toHaveAttribute('title', expect.stringContaining('3 turns'));
  });
});
