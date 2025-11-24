import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RarityBadge } from '../RarityBadge';
import { ItemRarity } from '../../types/combat';

describe('RarityBadge', () => {
  it('renders with common rarity', () => {
    render(<RarityBadge rarity={ItemRarity.COMMON} />);
    expect(screen.getByText('Common')).toBeInTheDocument();
  });

  it('renders with uncommon rarity', () => {
    render(<RarityBadge rarity={ItemRarity.UNCOMMON} />);
    expect(screen.getByText('Uncommon')).toBeInTheDocument();
  });

  it('renders with rare rarity', () => {
    render(<RarityBadge rarity={ItemRarity.RARE} />);
    expect(screen.getByText('Rare')).toBeInTheDocument();
  });

  it('renders with epic rarity', () => {
    render(<RarityBadge rarity={ItemRarity.EPIC} />);
    expect(screen.getByText('Epic')).toBeInTheDocument();
  });

  it('renders with legendary rarity', () => {
    render(<RarityBadge rarity={ItemRarity.LEGENDARY} />);
    expect(screen.getByText('Legendary')).toBeInTheDocument();
  });

  it('applies correct CSS class for rarity', () => {
    const { container } = render(<RarityBadge rarity={ItemRarity.LEGENDARY} />);
    expect(container.querySelector('.rarity-legendary')).toBeInTheDocument();
  });

  it('applies size variant classes', () => {
    const { container: smallContainer } = render(
      <RarityBadge rarity={ItemRarity.COMMON} size="sm" />
    );
    expect(smallContainer.querySelector('.rarity-badge-sm')).toBeInTheDocument();

    const { container: largeContainer } = render(
      <RarityBadge rarity={ItemRarity.COMMON} size="lg" />
    );
    expect(largeContainer.querySelector('.rarity-badge-lg')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<RarityBadge rarity={ItemRarity.EPIC} showLabel={false} />);
    expect(screen.queryByText('Epic')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <RarityBadge rarity={ItemRarity.RARE} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('sets data-rarity attribute', () => {
    const { container } = render(<RarityBadge rarity={ItemRarity.EPIC} />);
    const badge = container.querySelector('[data-rarity="epic"]');
    expect(badge).toBeInTheDocument();
  });
});
