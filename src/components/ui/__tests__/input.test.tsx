import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Input } from '../input';

describe('Input component', () => {
  it('renders helper text and label', () => {
    render(<Input label="Email" helper="Must be a valid email" />);
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Must be a valid email')).toBeTruthy();
  });

  it('shows valid icon when state=valid', () => {
    render(<Input label="Name" state="valid" />);
    expect(screen.getByText('Name')).toBeTruthy();
  });

  it('shows error styling when state=error', () => {
    render(<Input label="Business" state="error" helper="Required" />);
    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('renders password visibility toggle and toggles type', async () => {
    const user = userEvent.setup();
  render(<Input label="Password" type="password" />);
    const toggle = screen.getByRole('button', { name: /show password/i });
    expect(toggle).toBeTruthy();
    const input = screen.getByLabelText('Password') as HTMLInputElement;
  expect(input.type).toBe('password');
  await user.click(toggle);
  expect(input.type).toBe('text');
  // button label should now indicate hide
  expect(toggle.getAttribute('aria-label')).toBe('Hide password');
  });
});
