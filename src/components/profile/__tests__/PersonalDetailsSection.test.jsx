import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonalDetailsSection from '../PersonalDetailsSection';

describe('PersonalDetailsSection — Profile Save & Validation Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    date_of_birth: '1992-04-23',
    gender: 'female',
    preferred_language: 'ml',
    preferred_language_display: 'Malayalam (മലയാളം)',
  };

  it('1. renders saved values in read-only mode and enters edit mode with valid options', () => {
    render(
      <PersonalDetailsSection 
        profileData={mockProfile} 
        userProfile={mockProfile} 
        onUpdateProfile={vi.fn()} 
      />
    );

    // Read-only view
    expect(screen.getByText('23 Apr 1992')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Malayalam (മലയാളം)')).toBeInTheDocument();

    // Click Edit
    fireEvent.click(screen.getByRole('button', { name: /edit details/i }));

    // Inputs are rendered
    const dobInput = screen.getByLabelText(/date of birth/i);
    expect(dobInput).toHaveValue('1992-04-23');
    expect(dobInput).toHaveAttribute('min', '1900-01-01');

    const genderSelect = screen.getByLabelText(/gender/i);
    expect(genderSelect).toHaveValue('female');
    expect(screen.queryByText('Non-binary')).not.toBeInTheDocument();

    const langSelect = screen.getByLabelText(/preferred language/i);
    expect(langSelect).toHaveValue('ml');
    expect(screen.queryByText(/english \(uk\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/irish/i)).not.toBeInTheDocument();
  });

  it('2. executes success path: calls onUpdateProfile, leaves edit mode, and shows success banner', async () => {
    const onUpdateMock = vi.fn().mockResolvedValue({
      ...mockProfile,
      date_of_birth: '1990-01-15',
      gender: 'male',
      preferred_language: 'hi',
      preferred_language_display: 'Hindi (हिन्दी)'
    });

    render(
      <PersonalDetailsSection 
        profileData={mockProfile} 
        userProfile={mockProfile} 
        onUpdateProfile={onUpdateMock} 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit details/i }));

    const dobInput = screen.getByLabelText(/date of birth/i);
    fireEvent.change(dobInput, { target: { value: '1990-01-15' } });

    const genderSelect = screen.getByLabelText(/gender/i);
    fireEvent.change(genderSelect, { target: { value: 'male' } });

    const langSelect = screen.getByLabelText(/preferred language/i);
    fireEvent.change(langSelect, { target: { value: 'hi' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onUpdateMock).toHaveBeenCalledWith({
        date_of_birth: '1990-01-15',
        gender: 'male',
        preferred_language: 'hi'
      });
    });

    // Exits edit mode and shows success banner
    expect(await screen.findByText('Profile changes saved successfully!')).toBeInTheDocument();
    expect(screen.getByText('15 Jan 1990')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Hindi (हिन्दी)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit details/i })).toBeInTheDocument();
  });

  it('3. executes 400 error path: stays in edit mode, shows field errors, and shows NO success banner', async () => {
    const errorObj = new Error('Bad Request');
    errorObj.status = 400;
    errorObj.data = {
      date_of_birth: ['Date of birth cannot be in the future.'],
      gender: ['"invalid" is not a valid choice.']
    };

    const onUpdateMock = vi.fn().mockRejectedValue(errorObj);

    render(
      <PersonalDetailsSection 
        profileData={mockProfile} 
        userProfile={mockProfile} 
        onUpdateProfile={onUpdateMock} 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit details/i }));

    const dobInput = screen.getByLabelText(/date of birth/i);
    fireEvent.change(dobInput, { target: { value: '2099-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onUpdateMock).toHaveBeenCalled();
    });

    // Stays in edit mode
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    // NO success banner
    expect(screen.queryByText('Profile changes saved successfully!')).not.toBeInTheDocument();

    // Field errors are shown directly under inputs without raw keys
    expect(screen.getByText('Date of birth cannot be in the future.')).toBeInTheDocument();
    expect(screen.getByText('"invalid" is not a valid choice.')).toBeInTheDocument();

    // Typing in field clears error
    fireEvent.change(dobInput, { target: { value: '1995-05-15' } });
    expect(screen.queryByText('Date of birth cannot be in the future.')).not.toBeInTheDocument();
  });

  it('4. executes failure with server network error: stays in edit mode and shows general error banner', async () => {
    const onUpdateMock = vi.fn().mockRejectedValue(new Error('Connection refused'));

    render(
      <PersonalDetailsSection 
        profileData={mockProfile} 
        userProfile={mockProfile} 
        onUpdateProfile={onUpdateMock} 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit details/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onUpdateMock).toHaveBeenCalled();
    });

    // Stays in edit mode
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    // Shows general error
    expect(screen.getByText('Connection refused')).toBeInTheDocument();

    // NO success banner
    expect(screen.queryByText('Profile changes saved successfully!')).not.toBeInTheDocument();
  });

  it('5. allows clearing date of birth, gender, and language to empty values', async () => {
    const onUpdateMock = vi.fn().mockResolvedValue({
      ...mockProfile,
      date_of_birth: null,
      gender: '',
      preferred_language: '',
      preferred_language_display: ''
    });

    render(
      <PersonalDetailsSection 
        profileData={mockProfile} 
        userProfile={mockProfile} 
        onUpdateProfile={onUpdateMock} 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit details/i }));

    const dobInput = screen.getByLabelText(/date of birth/i);
    fireEvent.change(dobInput, { target: { value: '' } });

    const genderSelect = screen.getByLabelText(/gender/i);
    fireEvent.change(genderSelect, { target: { value: '' } });

    const langSelect = screen.getByLabelText(/preferred language/i);
    fireEvent.change(langSelect, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onUpdateMock).toHaveBeenCalledWith({
        date_of_birth: '',
        gender: '',
        preferred_language: ''
      });
    });

    expect(await screen.findByText('Profile changes saved successfully!')).toBeInTheDocument();
    // Read-only shows "Not set"
    const notSetBadges = screen.getAllByText('Not set');
    expect(notSetBadges.length).toBeGreaterThanOrEqual(3);
  });
});
