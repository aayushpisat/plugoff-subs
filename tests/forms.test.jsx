import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../src/features/contact/components/ContactForm.jsx';
import { LoginForm } from '../src/features/account/components/LoginForm.jsx';
import { useAuthActions } from '../src/features/account/hooks/useAuthActions.js';
import { CheckoutButton } from '../src/features/cart/components/CheckoutButton.jsx';
import { CartProvider } from '../src/core/context/CartContext.jsx';
import { SecurityProvider } from '../src/core/context/SecurityContext.jsx';
import { apiClient, parseRetryAfter } from '../src/core/api/client.js';

const Providers = ({ children }) => <SecurityProvider><CartProvider>{children}</CartProvider></SecurityProvider>;
const Auth = () => {
  const { currentUser, handleLogin, authErrors, isLoading } = useAuthActions();
  return currentUser ? <p>Signed in as {currentUser.name}</p> : <LoginForm onLogin={handleLogin} errors={authErrors} isLoading={isLoading} />;
};
beforeEach(() => { vi.restoreAllMocks(); vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('unavailable')); });

async function fillContact() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('YOUR NAME'), 'Test User');
  await user.type(screen.getByLabelText('EMAIL', { exact: true }), 'test@example.com');
  await user.type(screen.getByLabelText('TELL US ABOUT IT'), 'This is a test message.');
  await user.click(screen.getByRole('button', { name: /SEND IT OUR WAY/ }));
}
describe('real service confirmation is required', () => {
  test('contact failure is reported without showing success or clearing the message', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('offline'));
    render(<Providers><ContactForm /></Providers>);
    await fillContact();
    await screen.findByText('Your message could not be sent. Please try again later.');
    expect(screen.getByLabelText('TELL US ABOUT IT').value).toBe('This is a test message.');
    expect(screen.queryByText(/Message Sent/i)).toBeNull();
  });
  test('contact only clears after an explicit service confirmation', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true } });
    render(<Providers><ContactForm /></Providers>);
    await fillContact();
    await waitFor(() => expect(screen.getByLabelText('TELL US ABOUT IT').value).toBe(''));
    expect(apiClient.post).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ message: 'This is a test message.' }));
  });
  test('a forged stored identity cannot sign in; failed authentication stays signed out', async () => {
    localStorage.setItem('auth_user', JSON.stringify({ name: 'Forged Administrator', role: 'admin' }));
    localStorage.setItem('auth_token', 'forged-token');
    vi.spyOn(apiClient, 'post').mockRejectedValue({ response: { status: 401 } });
    render(<Providers><Auth /></Providers>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Account Email/), 'test@example.com');
    await user.type(screen.getByLabelText(/Password/), 'anything-really');
    await user.click(screen.getByRole('button', { name: 'Sign In to Account' }));
    await screen.findByText('Invalid email or password.');
    expect(screen.queryByText(/Signed in as/)).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
  test('successful login uses the server user and stores no bearer token', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { user: { name: 'Test User', email: 'test@example.com' }, token: 'must-not-be-stored' } });
    render(<Providers><Auth /></Providers>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Account Email/), 'test@example.com');
    await user.type(screen.getByLabelText(/Password/), 'valid-passphrase');
    await user.click(screen.getByRole('button', { name: 'Sign In to Account' }));
    await screen.findByText('Signed in as Test User');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });
  test('checkout failure preserves the cart and never sends browser-controlled prices', async () => {
    localStorage.setItem('plugoff_cart_v1', JSON.stringify([{ id: 'course', productId: 'digital-detox-course', title: 'Course', price: 1, quantity: 2, freebies: ['Book'] }]));
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('unavailable'));
    render(<Providers><CheckoutButton /></Providers>);
    await userEvent.setup().click(screen.getByRole('button', { name: /Secure Checkout/ }));
    await screen.findByRole('alert');
    expect(JSON.parse(localStorage.getItem('plugoff_cart_v1'))).toHaveLength(1);
    expect(apiClient.post).toHaveBeenCalledWith('/api/checkout', { items: [{ productId: 'digital-detox-course', quantity: 2, freebies: ['Book'] }] });
    expect(screen.queryByText('Order Confirmed')).toBeNull();
  });
  test('an unconfirmed order does not empty the cart', async () => {
    localStorage.setItem('plugoff_cart_v1', JSON.stringify([{ id: 'course', productId: 'course', title: 'Course', price: 99, quantity: 1 }]));
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { orderId: 'pending', status: 'pending' } });
    render(<Providers><CheckoutButton /></Providers>);
    await userEvent.setup().click(screen.getByRole('button', { name: /Secure Checkout/ }));
    await screen.findByRole('alert');
    expect(JSON.parse(localStorage.getItem('plugoff_cart_v1'))).toHaveLength(1);
  });
});

test('Retry-After supports seconds, HTTP dates, invalid input and safe bounds', () => {
  expect(parseRetryAfter('45')).toBe(45);
  expect(parseRetryAfter('broken')).toBe(30);
  expect(parseRetryAfter('99999')).toBe(3600);
  expect(parseRetryAfter('Thu, 01 Jan 2026 00:01:00 GMT', Date.parse('2026-01-01T00:00:00Z'))).toBe(60);
});
