import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DropdownSelect } from '../dropdown-select';

const options = [
  { value: 'us', label: 'United States' },
  { value: 'ng', label: 'Nigeria' },
];

describe('DropdownSelect component', () => {
  it('renders label and helper text', () => {
    render(<DropdownSelect label="Country" helper="Choose your country" options={options} />);
    expect(screen.getByText('Country')).toBeTruthy();
    expect(screen.getByText('Choose your country')).toBeTruthy();
  });

  it('sets aria-describedby to helper id', () => {
    const { container } = render(<DropdownSelect id="country" label="Country" helper="Choose your country" options={options} />);
    const button = container.querySelector('#country');
    expect(button?.getAttribute('aria-describedby')).toBe('country-helper');
  });

  it('marks aria-invalid when state=error', () => {
    const { container } = render(<DropdownSelect id="country" label="Country" helper="Choose your country" options={options} state="error" />);
    const button = container.querySelector('#country[aria-invalid="true"]');
    expect(button).not.toBeNull();
  });

  it('applies valid and error border classes', () => {
  const { container, rerender } = render(<DropdownSelect id="country" options={options} />);
  let btn = container.querySelector('#country');
  // default should have border class
  expect(btn?.className).toMatch(/border/);

  rerender(<DropdownSelect id="country" options={options} state="error" />);
  btn = container.querySelector('#country[aria-invalid="true"]');
  expect(btn?.className).toMatch(/border-red-500/);

  rerender(<DropdownSelect id="country" options={options} state="valid" />);
  btn = container.querySelector('#country');
  expect(btn?.className).toMatch(/border-emerald-500/);
  });
});
