import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../LoginPage';
import * as AuthContextModule from '../../context/AuthContext';
import { ApiError } from '../../utils/api';

describe('LoginPage Registration Flow — Live Error Mapping & General Box Handling', () => {
  let mockRegister;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRegister = vi.fn();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: vi.fn(),
      register: mockRegister,
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
      isLoading: false,
    });
  });

  const renderRegisterRoute = () => {
    return render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('1. maps {phone_number: ["Enter a valid phone number."]} to Mobile input and leaves general box clean', async () => {
    mockRegister.mockRejectedValueOnce(
      new ApiError('Bad Request', 400, { phone_number: ['Enter a valid phone number.'] })
    );

    renderRegisterRoute();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. aarav_sharma/i), { target: { value: 'aarav_sharma' } });
    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), { target: { value: 'aarav@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/9876543210/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByPlaceholderText(/Min\. 8 chars/i), { target: { value: 'validPassword123' } });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'validPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      const mobileError = screen.getByText('Enter a valid phone number.');
      expect(mobileError).toBeInTheDocument();
      expect(mobileError.id).toBe('mobile-error');
    });

    // Verify raw key "phone_number:" or "non_field_errors:" is never present in UI
    expect(document.body.textContent).not.toContain('phone_number:');
    expect(document.body.textContent).not.toContain('non_field_errors:');
    expect(document.getElementById('register-general-error')).toBeNull();
  });

  it('2. maps {username: ["A user with that username already exists."]} to Username input and leaves general box clean', async () => {
    mockRegister.mockRejectedValueOnce(
      new ApiError('Bad Request', 400, { username: ['A user with that username already exists.'] })
    );

    renderRegisterRoute();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. aarav_sharma/i), { target: { value: 'existing_user' } });
    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Min\. 8 chars/i), { target: { value: 'validPassword123' } });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'validPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      const usernameError = screen.getByText('A user with that username already exists.');
      expect(usernameError).toBeInTheDocument();
      expect(usernameError.id).toBe('username-error');
    });

    expect(document.getElementById('register-general-error')).toBeNull();
  });

  it('3. maps legacy backend {non_field_errors: ["Enter a valid phone number."]} directly to Mobile input', async () => {
    mockRegister.mockRejectedValueOnce(
      new ApiError('Bad Request', 400, { non_field_errors: ['Enter a valid phone number.'] })
    );

    renderRegisterRoute();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. aarav_sharma/i), { target: { value: 'aarav_sharma' } });
    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), { target: { value: 'aarav@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/9876543210/i), { target: { value: '8800776338' } });
    fireEvent.change(screen.getByPlaceholderText(/Min\. 8 chars/i), { target: { value: 'validPassword123' } });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'validPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      const mobileError = screen.getByText('Enter a valid phone number.');
      expect(mobileError).toBeInTheDocument();
      expect(mobileError.id).toBe('mobile-error');
    });

    expect(document.body.textContent).not.toContain('non_field_errors:');
    expect(document.getElementById('register-general-error')).toBeNull();
  });

  it('4. displays genuine general non_field_errors in general banner box without raw key', async () => {
    mockRegister.mockRejectedValueOnce(
      new ApiError('Bad Request', 400, { non_field_errors: ['New account registration is currently paused for platform maintenance.'] })
    );

    renderRegisterRoute();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. aarav_sharma/i), { target: { value: 'aarav_sharma' } });
    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), { target: { value: 'aarav@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Min\. 8 chars/i), { target: { value: 'validPassword123' } });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'validPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      const generalBanner = document.getElementById('register-general-error');
      expect(generalBanner).toBeInTheDocument();
      expect(generalBanner.textContent).toBe('New account registration is currently paused for platform maintenance.');
    });

    expect(document.body.textContent).not.toContain('non_field_errors:');
  });

  it('5. displays detail error in general banner box without raw key', async () => {
    mockRegister.mockRejectedValueOnce(
      new ApiError('Bad Request', 400, { detail: 'Too many registration requests from this network. Please wait a few minutes.' })
    );

    renderRegisterRoute();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. aarav_sharma/i), { target: { value: 'aarav_sharma' } });
    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), { target: { value: 'aarav@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Min\. 8 chars/i), { target: { value: 'validPassword123' } });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'validPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      const generalBanner = document.getElementById('register-general-error');
      expect(generalBanner).toBeInTheDocument();
      expect(generalBanner.textContent).toBe('Too many registration requests from this network. Please wait a few minutes.');
    });

    expect(document.body.textContent).not.toContain('detail:');
  });
});
