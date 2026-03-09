import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/useAuth';
import { Mail, ChevronLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import styles from '../../ChronicleBook.module.css';
import { PrimaryButton } from '../../../../components/ui/PrimaryButton';
import { analyticsService } from '../../../../services/analytics.service';

interface BookForgotPasswordProps {
    onBack: () => void;
}

export const BookForgotPassword: React.FC<BookForgotPasswordProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const { resetPasswordForEmail } = useAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const redirectTo = `${window.location.origin}/reset-password`;
            await resetPasswordForEmail(email, redirectTo);
            setSubmitted(true);
            analyticsService.trackEvent('password_reset_requested');
        } catch (err: unknown) {
            console.error('Failed to send reset email:', err);
            setError(t('forgot_password.error_generic'));
            analyticsService.trackEvent('password_reset_failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPageContent}>
            <header className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>{t('forgot_password.title')}</h2>
                <div className={styles.divider} />
            </header>

            {submitted ? (
                <div className={styles.forgotPasswordSuccess} data-testid="forgot-password-success">
                    <CheckCircle size={32} className={styles.successIcon} />
                    <h3 className={styles.successTitle}>{t('forgot_password.success_title')}</h3>
                    <p className={styles.successMessage}>{t('forgot_password.success_message')}</p>
                </div>
            ) : (
                <>
                    <p className={styles.forgotPasswordSubtitle}>{t('forgot_password.subtitle')}</p>
                    <form onSubmit={handleSubmit} className={styles.loginForm} data-testid="forgot-password-form">
                        <div className={styles.inputGroup}>
                            <label htmlFor="forgot-email">
                                <Mail size={14} />
                                {t('forgot_password.email_label')}
                            </label>
                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('forgot_password.email_placeholder')}
                                required
                                disabled={loading}
                                data-testid="forgot-password-email-input"
                            />
                        </div>

                        {error && (
                            <div className={styles.errorAlert} data-testid="forgot-password-error-alert">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <PrimaryButton
                            type="submit"
                            disabled={loading}
                            data-testid="forgot-password-submit-btn"
                        >
                            {loading ? <Loader2 className={styles.spinner} /> : t('forgot_password.submit_btn')}
                        </PrimaryButton>
                    </form>
                </>
            )}

            <button
                className={styles.backBtn}
                onClick={onBack}
                data-testid="forgot-password-back-btn"
            >
                <ChevronLeft size={16} />
                <span>{t('common.back')}</span>
            </button>
        </div>
    );
};
