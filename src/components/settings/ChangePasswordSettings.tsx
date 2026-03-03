import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { PrimaryButton } from '../ui/PrimaryButton';
import sectionStyles from './SettingsSection.module.css';
import styles from './ChangePasswordSettings.module.css';

export const ChangePasswordSettings: React.FC = () => {
    const { t } = useTranslation();
    const { resetPasswordForEmail, user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleChangePassword = async () => {
        if (!user?.email) {
            console.error('Cannot change password: user email is missing');
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const redirectTo = `${window.location.origin}/reset-password`;
            await resetPasswordForEmail(user.email, redirectTo);
            setSubmitted(true);
        } catch (err: unknown) {
            console.error('Failed to send password change email:', err);
            setError(t('change_password.error_generic'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={sectionStyles.settingsSection} data-testid="change-password-settings">
            <h4 className={sectionStyles.sectionTitle}>{t('change_password.title')}</h4>

            {submitted ? (
                <div className={styles.successMessage} data-testid="change-password-success">
                    <CheckCircle size={16} />
                    <span>{t('change_password.success_message')}</span>
                </div>
            ) : (
                <>
                    {error && (
                        <div className={styles.errorMessage} data-testid="change-password-error">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                    <PrimaryButton
                        onClick={handleChangePassword}
                        disabled={loading}
                        data-testid="change-password-btn"
                    >
                        {loading ? <Loader2 /> : t('change_password.submit_btn')}
                    </PrimaryButton>
                </>
            )}
        </div>
    );
};
