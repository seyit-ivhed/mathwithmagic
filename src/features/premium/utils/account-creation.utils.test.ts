import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateAccountCreationForm, performAccountConversion, waitForSession } from './account-creation.utils';
import type { SupabaseClient, Session, User, AuthError } from '@supabase/supabase-js';

describe('account-creation.utils', () => {
    const translation = vi.fn((key) => key);

    describe('validateAccountCreationForm', () => {
        it('should return error for invalid email', () => {
            expect(validateAccountCreationForm('', '', 'password', translation)).toBe('premium.store.account.errors.invalid_email');
            expect(validateAccountCreationForm('invalid-email', 'invalid-email', 'password', translation)).toBe('premium.store.account.errors.invalid_email');
        });

        it('should return error if emails dont match', () => {
            expect(validateAccountCreationForm('test@test.com', 'other@test.com', 'password', translation)).toBe('premium.store.account.errors.emails_dont_match');
        });

        it('should return error for weak password', () => {
            expect(validateAccountCreationForm('test@test.com', 'test@test.com', '123', translation)).toBe('premium.store.account.errors.weak_password');
        });

        it('should return null if valid', () => {
            expect(validateAccountCreationForm('test@test.com', 'test@test.com', 'password', translation)).toBeNull();
        });
    });

    describe('performAccountConversion', () => {
        const refreshSession = vi.fn();
        const email = 'test@test.com';
        const password = 'password';

        let mockSupabaseClient: {
            auth: {
                getSession: ReturnType<typeof vi.fn>;
                signUp: ReturnType<typeof vi.fn>;
            };
            from: ReturnType<typeof vi.fn>;
        };

        beforeEach(() => {
            vi.clearAllMocks();
            vi.useFakeTimers();

            // Suppress console logs
            vi.spyOn(console, 'log').mockImplementation(() => {});
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.spyOn(console, 'error').mockImplementation(() => {});

            mockSupabaseClient = {
                auth: {
                    getSession: vi.fn(),
                    signUp: vi.fn(),
                },
                from: vi.fn(() => ({
                    upsert: vi.fn().mockResolvedValue({ error: null }),
                })),
            };
        });

        afterEach(() => {
            vi.useRealTimers();
            vi.restoreAllMocks();
        });

        it('should handle successful account creation', async () => {
            mockSupabaseClient.auth.getSession
                .mockResolvedValueOnce({ data: { session: null }, error: null })
                .mockResolvedValueOnce({ data: { session: { user: { id: '123', is_anonymous: false } } as unknown as Session }, error: null });

            mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
                data: { user: { id: '123' } as unknown as User, session: { user: { id: '123' } } as unknown as Session },
                error: null
            });

            const conversionPromise = performAccountConversion({
                email,
                password,
                refreshSession,
                translation,
                supabaseClient: mockSupabaseClient as unknown as SupabaseClient
            });

            // Advance timers to allow the polling interval to fire
            await vi.runAllTimersAsync();

            const result = await conversionPromise;

            expect(result.success).toBe(true);
            expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({ email, password });
            expect(refreshSession).toHaveBeenCalled();
        });

        it('should return session_timeout error when session never becomes non-anonymous', async () => {
            // Initial check returns no session; all subsequent polling calls also return no session
            mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

            mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
                data: { user: { id: '123' } as unknown as User, session: null },
                error: null
            });

            const conversionPromise = performAccountConversion({
                email,
                password,
                refreshSession,
                translation,
                supabaseClient: mockSupabaseClient as unknown as SupabaseClient
            });

            // Advance timers past the 8-second polling timeout
            await vi.runAllTimersAsync();

            const result = await conversionPromise;

            expect(result.success).toBe(false);
            expect(result.error).toBe('premium.store.account.errors.session_timeout');
        });

        it('should skip creation if user is already permanently authenticated', async () => {
            mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
                data: { session: { user: { id: '123', is_anonymous: false } } as unknown as Session },
                error: null
            });

            const result = await performAccountConversion({
                email,
                password,
                refreshSession,
                translation,
                supabaseClient: mockSupabaseClient as unknown as SupabaseClient
            });

            expect(result.success).toBe(true);
            expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
        });

        it('should return emailAlreadyExists error if email already registered', async () => {
            mockSupabaseClient.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });

            mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
                data: null,
                error: { message: 'User already registered', status: 422 } as unknown as AuthError
            });

            const result = await performAccountConversion({
                email,
                password,
                refreshSession,
                translation,
                supabaseClient: mockSupabaseClient as unknown as SupabaseClient
            });

            expect(result.success).toBe(false);
            expect(result.emailAlreadyExists).toBe(true);
            expect(result.error).toBe('premium.store.account.errors.already_exists');
        });

        it('should return generic error if sign up fails', async () => {
            mockSupabaseClient.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });

            mockSupabaseClient.auth.signUp.mockRejectedValueOnce(new Error('Network error'));

            const result = await performAccountConversion({
                email,
                password,
                refreshSession,
                translation,
                supabaseClient: mockSupabaseClient as unknown as SupabaseClient
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('premium.store.account.errors.generic');
        });
    });

    describe('waitForSession', () => {
        let mockClient: { auth: { getSession: ReturnType<typeof vi.fn> } };

        beforeEach(() => {
            vi.useFakeTimers();
            mockClient = { auth: { getSession: vi.fn() } };
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return true immediately when session is already non-anonymous', async () => {
            mockClient.auth.getSession.mockResolvedValueOnce({
                data: { session: { user: { id: '1', is_anonymous: false } } as unknown as Session }
            });

            const result = await waitForSession(mockClient as unknown as SupabaseClient);
            expect(result).toBe(true);
        });

        it('should return true after polling when session becomes non-anonymous', async () => {
            mockClient.auth.getSession
                .mockResolvedValueOnce({ data: { session: null } })
                .mockResolvedValueOnce({ data: { session: { user: { id: '1', is_anonymous: false } } as unknown as Session } });

            const promise = waitForSession(mockClient as unknown as SupabaseClient);
            await vi.runAllTimersAsync();

            expect(await promise).toBe(true);
            expect(mockClient.auth.getSession).toHaveBeenCalledTimes(2);
        });

        it('should return false after the timeout expires without a valid session', async () => {
            mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

            const promise = waitForSession(mockClient as unknown as SupabaseClient);
            await vi.runAllTimersAsync();

            expect(await promise).toBe(false);
        });
    });
});
