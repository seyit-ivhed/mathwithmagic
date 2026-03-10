import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/useAuth';
import { Mail, Lock, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import styles from '../../ChronicleBook.module.css';
import { PrimaryButton } from '../../../../components/ui/PrimaryButton';
import { analyticsService } from '../../../../services/analytics.service';

interface BookLoginProps {
    onBack: () => void;
    onSuccess: () => void;
    onForgotPassword: () => void;
}

export const BookLogin: React.FC<BookLoginProps> = ({ onBack, onSuccess, onForgotPassword }) => {
    const { t } = useTranslation();
    const { signIn } = useAuth();

    // Login Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
            onSuccess();
        } catch (err: unknown) {
            console.error('Failed to sign in:', err);
            setError(t('login.invalid_credentials'));
            analyticsService.trackEvent('login_failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPageContent}>


            <header className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>{t('login.member_access')}</h2>
                <div className={styles.divider} />
            </header>

            <form onSubmit={handleLogInSubmit} className={styles.loginForm} data-testid="login-form">
                <div className={styles.inputGroup}>
                    <label htmlFor="email">
                        <Mail size={14} />
                        {t('login.email_label')}
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('login.email_placeholder')}
                        required
                        disabled={loading}
                        data-testid="login-email-input"
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="password">
                        <Lock size={14} />
                        {t('login.password_label')}
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('login.password_placeholder')}
                        required
                        disabled={loading}
                        data-testid="login-password-input"
                    />
                </div>

                {error && (
                    <div className={styles.errorAlert} data-testid="login-error-alert">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                <PrimaryButton
                    type="submit"
                    disabled={loading}
                    data-testid="login-submit-btn"
                >
                    {loading ? <Loader2 className={styles.spinner} /> : t('login.open_journal')}
                </PrimaryButton>

                <button
                    type="button"
                    className={styles.forgotPasswordLink}
                    onClick={onForgotPassword}
                    data-testid="login-forgot-password-btn"
                >
                    {t('login.forgot_password')}
                </button>
            </form>

            <button
                className={styles.backBtn}
                onClick={onBack}
                data-testid="login-back-btn"
            >
                <ChevronLeft size={16} />
                <span>{t('common.back')}</span>
            </button>
        </div>
    );
};
