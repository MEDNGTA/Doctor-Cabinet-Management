import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page with login link for non-authenticated user', () => {
  render(<App />);
  const headings = screen.getAllByRole('heading', { level: 1 });
  expect(headings.some((h) => /doctor cabinet management/i.test(h.textContent))).toBe(true);
  const loginLinks = screen.getAllByRole('link', { name: /login/i });
  expect(loginLinks.length).toBeGreaterThan(0);
});
