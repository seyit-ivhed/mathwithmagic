import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePasswordSettings } from './ChangePasswordSettings';
import * as useAuthHook from '../../hooks/useAuth';
import type { Session, User } from '@supabase/supabase-js';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en' },
    }),
}));

const mockResetPasswordForEmail = vi.fn();

const mockUser = {
    email: 'test@example.com',
    is_anonymous: false,
} as unknown as User;

describe('ChangePasswordSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
            user: mockUser,
            session: {} as Session,
            isAuthenticated: true,
            loading: false,
            signIn: vi.fn(),
            signInAnonymously: vi.fn(),
            refreshSession: vi.fn(),
            resetPasswordForEmail: mockResetPasswordForEmail,
            updatePassword: vi.fn(),
        });
    });

    it('renders the change password button', () => {
        render(<ChangePasswordSettings />);
        expect(screen.getByTestId('change-password-btn')).toBeDefined();
    });

    it('calls resetPasswordForEmail with the user email on click', async () => {
        mockResetPasswordForEmail.mockResolvedValueOnce(undefined);
        render(<ChangePasswordSettings />);

        fireEvent.click(screen.getByTestId('change-password-btn'));

        await waitFor(() => {
            expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
                'test@example.com',
                expect.stringContaining('/reset-password')
            );
        });
    });

    it('shows success message after email is sent', async () => {
        mockResetPasswordForEmail.mockResolvedValueOnce(undefined);
        render(<ChangePasswordSettings />);

        fireEvent.click(screen.getByTestId('change-password-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('change-password-success')).toBeDefined();
        });
    });

    it('shows error message when resetPasswordForEmail fails', async () => {
        mockResetPasswordForEmail.mockRejectedValueOnce(new Error('network error'));
        render(<ChangePasswordSettings />);

        fireEvent.click(screen.getByTestId('change-password-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('change-password-error')).toBeDefined();
        });
    });

    it('does nothing when user has no email', async () => {
        vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
            user: { ...mockUser, email: undefined } as unknown as User,
            session: {} as Session,
            isAuthenticated: true,
            loading: false,
            signIn: vi.fn(),
            signInAnonymously: vi.fn(),
            refreshSession: vi.fn(),
            resetPasswordForEmail: mockResetPasswordForEmail,
            updatePassword: vi.fn(),
        });

        render(<ChangePasswordSettings />);
        fireEvent.click(screen.getByTestId('change-password-btn'));

        await waitFor(() => {
            expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
        });
    });
});
