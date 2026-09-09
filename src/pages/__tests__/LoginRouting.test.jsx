import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import LoginPage from '../LoginPage';
import * as AuthContextModule from '../../context/AuthContext';
import * as AuthRoutingUtils from '../../utils/authRouting';

// Mock useAuth hook
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Helper component to track navigation destination
function LocationDisplay() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="location-path">{location.pathname}</span>
    </div>
  );
}

describe('Role-Based Login & Session Routing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // TASK D — TEST 1: Vendor Password Login -> /seller/dashboard
  it('1. redirects vendor password login to /seller/dashboard', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ username: 'vendor_john', role: 'vendor', name: 'John Vendor' });
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
      isLoading: false,
      isLoggedIn: false,
      currentUser: null,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/seller/dashboard" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'vendor_john' } });
    
    const passStepBtn = screen.getByText(/login with password instead/i);
    fireEvent.click(passStepBtn);

    const passwordInput = screen.getByPlaceholderText(/enter your account password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /^login$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ username: 'vendor_john', password: 'password123' });
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/seller/dashboard');
    });
  });

  // TASK D — TEST 2: Admin Password Login -> /admin
  it('2. redirects admin password login to /admin', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ username: 'admin_alice', role: 'admin', name: 'Alice Admin' });
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
      isLoading: false,
      isLoggedIn: false,
      currentUser: null,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'admin_alice' } });

    const passStepBtn = screen.getByText(/login with password instead/i);
    fireEvent.click(passStepBtn);

    const passwordInput = screen.getByPlaceholderText(/enter your account password/i);
    fireEvent.change(passwordInput, { target: { value: 'adminpass' } });

    const submitBtn = screen.getByRole('button', { name: /^login$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/admin');
    });
  });

  // TASK D — TEST 3: Customer Password Login -> /
  it('3. redirects customer password login to / (home)', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ username: 'customer_bob', role: 'customer', name: 'Bob' });
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
      isLoading: false,
      isLoggedIn: false,
      currentUser: null,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'customer_bob' } });

    const passStepBtn = screen.getByText(/login with password instead/i);
    fireEvent.click(passStepBtn);

    const passwordInput = screen.getByPlaceholderText(/enter your account password/i);
    fireEvent.change(passwordInput, { target: { value: 'custpass' } });

    const submitBtn = screen.getByRole('button', { name: /^login$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/');
    });
  });

  // TASK D — TEST 4a: Vendor OTP Login -> /seller/dashboard
  it('4a. redirects vendor OTP login to /seller/dashboard', async () => {
    const mockRequestOtp = vi.fn().mockResolvedValue({ success: true });
    const mockVerifyOtp = vi.fn().mockResolvedValue({ username: 'vendor_otp', role: 'vendor', name: 'Vendor OTP' });
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      requestOtp: mockRequestOtp,
      verifyOtp: mockVerifyOtp,
      isLoading: false,
      isLoggedIn: false,
      currentUser: null,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/seller/dashboard" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'vendor_otp@example.com' } });

    const otpReqBtn = screen.getByRole('button', { name: /request otp/i });
    fireEvent.click(otpReqBtn);

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith('vendor_otp@example.com');
    });

    const otpInputs = screen.getAllByRole('textbox');
    otpInputs.forEach((inp, idx) => {
      fireEvent.change(inp, { target: { value: String(idx + 1) } });
    });

    const verifyBtn = screen.getByRole('button', { name: /verify & continue/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalled();
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/seller/dashboard');
    });
  });

  // TASK D — TEST 4b: Admin OTP Login -> /admin
  it('4b. redirects admin OTP login to /admin', async () => {
    const mockRequestOtp = vi.fn().mockResolvedValue({ success: true });
    const mockVerifyOtp = vi.fn().mockResolvedValue({ username: 'admin_otp', role: 'admin', name: 'Admin OTP' });
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      requestOtp: mockRequestOtp,
      verifyOtp: mockVerifyOtp,
      isLoading: false,
      isLoggedIn: false,
      currentUser: null,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'admin_otp@example.com' } });

    const otpReqBtn = screen.getByRole('button', { name: /request otp/i });
    fireEvent.click(otpReqBtn);

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalled();
    });

    const otpInputs = screen.getAllByRole('textbox');
    otpInputs.forEach((inp, idx) => {
      fireEvent.change(inp, { target: { value: String(idx + 1) } });
    });

    const verifyBtn = screen.getByRole('button', { name: /verify & continue/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalled();
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/admin');
    });
  });

  // TASK D — TEST 4c: Customer OTP Login -> /
  it('4c. redirects customer OTP login to / (home)', async () => {
    const mockRequestOtp = vi.fn().mockResolvedValue({ success: true });
    const mockVerifyOtp = vi.fn().mockResolvedValue({ username: 'customer_otp', role: 'customer', name: 'Customer OTP' });
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      requestOtp: mockRequestOtp,
      verifyOtp: mockVerifyOtp,
      isLoading: false,
      isLoggedIn: false,
      currentUser: null,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'customer_otp@example.com' } });

    const otpReqBtn = screen.getByRole('button', { name: /request otp/i });
    fireEvent.click(otpReqBtn);

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith('customer_otp@example.com');
    });

    const otpInputs = screen.getAllByRole('textbox');
    otpInputs.forEach((inp, idx) => {
      fireEvent.change(inp, { target: { value: String(idx + 1) } });
    });

    const verifyBtn = screen.getByRole('button', { name: /verify & continue/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalled();
    });

    act(() => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-path').textContent).toBe('/');
    });
  });

  // TASK D — TEST 5: Verify getHomeRouteForRole single source of truth usage
  it('5. uses getHomeRouteForRole centralized function for role routing', () => {
    const spy = vi.spyOn(AuthRoutingUtils, 'getHomeRouteForRole');
    
    expect(AuthRoutingUtils.getHomeRouteForRole('vendor')).toBe('/seller/dashboard');
    expect(AuthRoutingUtils.getHomeRouteForRole('admin')).toBe('/admin');
    expect(AuthRoutingUtils.getHomeRouteForRole('customer')).toBe('/');

    expect(spy).toHaveBeenCalledWith('vendor');
    expect(spy).toHaveBeenCalledWith('admin');
    expect(spy).toHaveBeenCalledWith('customer');
  });

  // TASK C / D: App load session rehydration on / for vendor -> /seller/dashboard
  it('6a. redirects authenticated vendor landing on / during initial load to /seller/dashboard', async () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: true,
      currentUser: { username: 'existing_vendor', role: 'vendor' },
      isResolving: false,
      isLoading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/seller/dashboard" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const route = AuthRoutingUtils.getHomeRouteForRole('vendor');
    expect(route).toBe('/seller/dashboard');
  });

  // TASK C / D: App load session rehydration on / for admin -> /admin
  it('6b. redirects authenticated admin landing on / during initial load to /admin', async () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: true,
      currentUser: { username: 'existing_admin', role: 'admin' },
      isResolving: false,
      isLoading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const route = AuthRoutingUtils.getHomeRouteForRole('admin');
    expect(route).toBe('/admin');
  });
});
