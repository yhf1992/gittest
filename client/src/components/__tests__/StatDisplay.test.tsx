import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatDisplay } from '../StatDisplay';

describe('StatDisplay', () => {
  it('renders stat label and value', () => {
    render(<StatDisplay label="Attack" value={100} />);
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with max value', () => {
    render(<StatDisplay label="HP" value={80} maxValue={100} />);
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('displays percentage when showPercentage is true', () => {
    render(<StatDisplay label="HP" value={75} maxValue={100} showPercentage />);
    expect(screen.getByText('(75%)')).toBeInTheDocument();
  });

  it('uses default icon for known stats', () => {
    const { container } = render(<StatDisplay label="HP" value={100} />);
    expect(container.querySelector('.stat-icon')).toHaveTextContent('❤️');
  });

  it('uses custom icon when provided', () => {
    const { container } = render(<StatDisplay label="Custom" value={50} icon="🎯" />);
    expect(container.querySelector('.stat-icon')).toHaveTextContent('🎯');
  });

  it('applies variant classes', () => {
    const { container: compactContainer } = render(
      <StatDisplay label="Attack" value={100} variant="compact" />
    );
    expect(compactContainer.querySelector('.stat-display-compact')).toBeInTheDocument();

    const { container: detailedContainer } = render(
      <StatDisplay label="Attack" value={100} variant="detailed" />
    );
    expect(detailedContainer.querySelector('.stat-display-detailed')).toBeInTheDocument();
  });

  it('shows progress bar in detailed variant with max value', () => {
    const { container } = render(
      <StatDisplay label="HP" value={60} maxValue={100} variant="detailed" />
    );
    const progressBar = container.querySelector('.stat-bar-fill');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  it('applies custom color via CSS variable', () => {
    const { container } = render(
      <StatDisplay label="Mana" value={50} color="#3498db" />
    );
    const display = container.querySelector('.stat-display');
    expect(display).toHaveStyle({ '--stat-color': '#3498db' });
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatDisplay label="Speed" value={75} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('sets data-stat-label attribute', () => {
    const { container } = render(<StatDisplay label="Defense" value={50} />);
    const display = container.querySelector('[data-stat-label="defense"]');
    expect(display).toBeInTheDocument();
  });

  it('normalizes label to lowercase for data attribute', () => {
    const { container } = render(<StatDisplay label="Attack Power" value={100} />);
    const display = container.querySelector('[data-stat-label="attack power"]');
    expect(display).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(<StatDisplay label="HP" value={33} maxValue={100} showPercentage />);
    expect(screen.getByText('(33%)')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    render(<StatDisplay label="HP" value={0} maxValue={100} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('uses fallback icon for unknown stats', () => {
    const { container } = render(<StatDisplay label="Unknown" value={50} />);
    expect(container.querySelector('.stat-icon')).toHaveTextContent('📊');
  });
});
