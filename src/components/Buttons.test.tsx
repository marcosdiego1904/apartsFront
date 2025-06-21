import { render, screen } from '@testing-library/react';
import { Buttons } from './Buttons';
import { describe, it, expect } from 'vitest';

describe('Buttons component', () => {
  it('renders the button with the correct text', () => {
    render(<Buttons text="Click me" type="button" />);
    const buttonElement = screen.getByText(/Click me/i);
    expect(buttonElement).toBeInTheDocument();
  });

  it('renders the button with the correct type', () => {
    render(<Buttons text="Submit" type="submit" />);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveAttribute('type', 'submit');
  });
}); 