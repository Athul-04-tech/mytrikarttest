import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterStep from '../../components/auth/RegisterStep';

describe('RegisterStep — Field Error Mapping & Clean Presentation Suite', () => {
  it('1. labels Mobile Number as optional with no required asterisk', () => {
    render(
      <RegisterStep
        onRegister={vi.fn()}
        onGoToLogin={vi.fn()}
        isLoading={false}
        hasError={false}
        errorMessage=""
        fieldErrors={null}
      />
    );

    const mobileLabel = screen.getByText(/Mobile Number/i);
    expect(mobileLabel).toBeInTheDocument();
    expect(mobileLabel.textContent).toMatch(/optional/i);
    expect(mobileLabel.textContent).not.toContain('*');
  });

  it('2. maps duplicate username error directly under Username field and highlights the input', () => {
    const fieldErrors = {
      username: ['A user with that username already exists.']
    };

    render(
      <RegisterStep
        onRegister={vi.fn()}
        onGoToLogin={vi.fn()}
        isLoading={false}
        hasError={true}
        errorMessage=""
        fieldErrors={fieldErrors}
      />
    );

    const usernameInput = screen.getByPlaceholderText(/e\.g\. aarav_sharma/i);
    expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
    expect(usernameInput.className).toContain('border-[#D7263D]');

    const errorMsg = screen.getByText('A user with that username already exists.');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg.id).toBe('username-error');
    // Ensure general box is NOT shown when only field errors exist
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.getElementById('register-general-error')).toBeNull();
  });

  it('3. maps invalid phone number error directly under Mobile Number field with NO raw key prefix', () => {
    const fieldErrors = {
      phone_number: ['Enter a valid phone number.']
    };

    render(
      <RegisterStep
        onRegister={vi.fn()}
        onGoToLogin={vi.fn()}
        isLoading={false}
        hasError={true}
        errorMessage=""
        fieldErrors={fieldErrors}
      />
    );

    const mobileInput = screen.getByPlaceholderText(/9876543210/i);
    expect(mobileInput).toHaveAttribute('aria-invalid', 'true');
    expect(mobileInput.className).toContain('border-[#D7263D]');

    const errorMsg = screen.getByText('Enter a valid phone number.');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg.id).toBe('mobile-error');

    // Confirm that "non_field_errors:" or "phone_number:" is nowhere in the document text
    expect(document.body.textContent).not.toContain('non_field_errors:');
    expect(document.body.textContent).not.toContain('phone_number:');
  });

  it('4. maps phone error inside non_field_errors to Mobile Number field without raw prefix', () => {
    const fieldErrors = {
      non_field_errors: ['Enter a valid phone number.']
    };

    render(
      <RegisterStep
        onRegister={vi.fn()}
        onGoToLogin={vi.fn()}
        isLoading={false}
        hasError={true}
        errorMessage=""
        fieldErrors={fieldErrors}
      />
    );

    const errorMsg = screen.getByText('Enter a valid phone number.');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg.id).toBe('mobile-error');
    expect(document.body.textContent).not.toContain('non_field_errors:');
    expect(document.getElementById('register-general-error')).toBeNull();
  });

  it('5. surfaces mismatched passwords under Confirm Password field, not in general error box', () => {
    render(
      <RegisterStep
        onRegister={vi.fn()}
        onGoToLogin={vi.fn()}
        isLoading={false}
        hasError={false}
        errorMessage=""
        fieldErrors={null}
      />
    );

    // Fill valid username, email, password, but mismatched confirm password
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. aarav_sharma/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Min\. 8 chars/i), { target: { value: 'secretpass123' } });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'mismatchpass' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    const confirmPasswordInput = screen.getByPlaceholderText(/Re-enter password/i);
    expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'true');
    expect(confirmPasswordInput.className).toContain('border-[#D7263D]');

    const mismatchMsg = screen.getByText('Passwords do not match.');
    expect(mismatchMsg).toBeInTheDocument();
    expect(mismatchMsg.id).toBe('confirm-password-error');
    expect(document.getElementById('register-general-error')).toBeNull();
  });

  it('6. clears field error immediately when user edits that field', () => {
    const fieldErrors = {
      username: ['A user with that username already exists.'],
      phone_number: ['Enter a valid phone number.']
    };

    render(
      <RegisterStep
        onRegister={vi.fn()}
        onGoToLogin={vi.fn()}
        isLoading={false}
        hasError={true}
        errorMessage=""
        fieldErrors={fieldErrors}
      />
    );

    expect(screen.getByText('A user with that username already exists.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid phone number.')).toBeInTheDocument();

    // Type in username
    const usernameInput = screen.getByPlaceholderText(/e\.g\. aarav_sharma/i);
    fireEvent.change(usernameInput, { target: { value: 'new_unique_name' } });

    // Username error must be cleared
    expect(screen.queryByText('A user with that username already exists.')).not.toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('aria-invalid', 'false');

    // Phone error remains until phone is edited
    expect(screen.getByText('Enter a valid phone number.')).toBeInTheDocument();

    // Type in mobile
    const mobileInput = screen.getByPlaceholderText(/9876543210/i);
    fireEvent.change(mobileInput, { target: { value: '8800776338' } });

    // Phone error is cleared
    expect(screen.queryByText('Enter a valid phone number.')).not.toBeInTheDocument();
    expect(mobileInput).toHaveAttribute('aria-invalid', 'false');
  });

  it('7. displays general non-field errors in general box without raw key prefix', () => {
    render(
      <RegisterStep
        onRegister={vi.fn()}
        onGoToLogin={vi.fn()}
        isLoading={false}
        hasError={true}
        errorMessage="Registration service temporarily unavailable. Please try again shortly."
        fieldErrors={null}
      />
    );

    const banner = document.getElementById('register-general-error');
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toBe('Registration service temporarily unavailable. Please try again shortly.');
    expect(banner.textContent).not.toContain('detail:');
    expect(banner.textContent).not.toContain('non_field_errors:');
  });

  it('8. submits exact mobile number without adding +91 or altering customer input', () => {
    const mockRegister = vi.fn();
    render(
      <RegisterStep
        onRegister={mockRegister}
        onGoToLogin={vi.fn()}
        isLoading={false}
        hasError={false}
        errorMessage=""
        fieldErrors={null}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. aarav_sharma/i), { target: { value: 'cust_user' } });
    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), { target: { value: 'cust@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/9876543210/i), { target: { value: '8800776338' } });
    fireEvent.change(screen.getByPlaceholderText(/Min\. 8 chars/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
      username: 'cust_user',
      email: 'cust@example.com',
      mobile: '8800776338', // Untouched 10 digits — no +91 prepended
    }));
  });
});
