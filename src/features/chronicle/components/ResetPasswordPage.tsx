import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../services/supabase.service';
import { analyticsService } from '../../../services/analytics.service';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import styles from './ResetPasswordPage.module.css';

const TOKEN_PROCESSING_TIMEOUT_MS = 1500;
const MIN_PASSWORD_LENGTH = 6;

export const ResetPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { updatePassword } = useAuth();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true);
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsValidSession(true);
            } else {
                setTimeout(() => {
                    setIsValidSession((prev) => prev ?? false);
                }, TOKEN_PROCESSING_TIMEOUT_MS);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(t('reset_password.errors.weak_password'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('reset_password.errors.passwords_dont_match'));
            return;
        }

        setLoading(true);
        try {
            await updatePassword(newPassword);
            analyticsService.trackEvent('password_reset_succeeded');
            setSuccess(true);
        } catch (err: unknown) {
            console.error('Failed to update password:', err);
            analyticsService.trackEvent('password_reset_update_failed');
            setError(t('reset_password.errors.generic'));
        } finally {
            setLoading(false);
        }
    };

    if (isValidSession === null) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.card}>
                    <Loader2 className={styles.spinner} size={32} />
                </div>
            </div>
        );
    }

    if (isValidSession === false) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.card}>
                    <header className={styles.pageHeader}>
                        <h2 className={styles.pageTitle}>{t('reset_password.title')}</h2>
                        <div className={styles.divider} />
                    </header>
                    <div className={styles.errorAlert} data-testid="reset-password-invalid-link">
                        <AlertCircle size={14} />
                        <span>{t('reset_password.errors.invalid_link')}</span>
                    </div>
                    <PrimaryButton onClick={() => navigate('/chronicle/forgot-password')} data-testid="reset-password-request-new-link-btn">
                        {t('forgot_password.submit_btn')}
                    </PrimaryButton>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <header className={styles.pageHeader}>
                    <h2 className={styles.pageTitle}>{t('reset_password.title')}</h2>
                    <div className={styles.divider} />
                </header>

                {success ? (
                    <div className={styles.successSection} data-testid="reset-password-success">
                        <CheckCircle size={32} className={styles.successIcon} />
                        <h3 className={styles.successTitle}>{t('reset_password.success_title')}</h3>
                        <p className={styles.successMessage}>{t('reset_password.success_message')}</p>
                        <PrimaryButton
                            onClick={() => navigate('/chronicle/login')}
                            data-testid="reset-password-go-to-login-btn"
                        >
                            {t('reset_password.go_to_login')}
                        </PrimaryButton>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form} data-testid="reset-password-form">
                        <div className={styles.inputGroup}>
                            <label htmlFor="new-password">
                                <Lock size={14} />
                                {t('reset_password.new_password_label')}
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t('reset_password.new_password_placeholder')}
                                required
                                disabled={loading}
                                data-testid="reset-password-new-input"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirm-password">
                                <Lock size={14} />
                                {t('reset_password.confirm_password_label')}
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('reset_password.confirm_password_placeholder')}
                                required
                                disabled={loading}
                                data-testid="reset-password-confirm-input"
                            />
                        </div>

                        {error && (
                            <div className={styles.errorAlert} data-testid="reset-password-error-alert">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <PrimaryButton
                            type="submit"
                            disabled={loading}
                            data-testid="reset-password-submit-btn"
                        >
                            {loading ? <Loader2 className={styles.spinner} /> : t('reset_password.submit_btn')}
                        </PrimaryButton>
                    </form>
                )}
            </div>
        </div>
    );
};
