import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple test to verify Login component can be imported
describe('Login Component Import', () => {
  it('should be able to import Login component', async () => {
    const Login = (await import('../Login')).default;
    expect(typeof Login).toBe('function');
  });
});