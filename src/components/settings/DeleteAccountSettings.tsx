import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import { analyticsService } from '../../services/analytics.service';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { PrimaryButton } from '../ui/PrimaryButton';
import sectionStyles from './SettingsSection.module.css';
import styles from './DeleteAccountSettings.module.css';

export const DeleteAccountSettings: React.FC = () => {
    const { t } = useTranslation();
    const { deleteAccount } = useAuth();

    const [confirming, setConfirming] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequestDelete = () => {
        setConfirming(true);
        setPassword('');
        setError(null);
    };

    const handleCancelDelete = () => {
        setConfirming(false);
        setPassword('');
        setError(null);
    };

    const handleConfirmDelete = async () => {
        if (!password) {
            setError(t('delete_account.password_required', 'Please enter your password to confirm.'));
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await deleteAccount(password);
            analyticsService.trackEvent('account_deleted');
        } catch (err: unknown) {
            console.error('Account deletion failed:', err);
            analyticsService.trackEvent('account_delete_failed');
            const message = err instanceof Error ? err.message : '';
            if (message === 'Incorrect password') {
                setError(t('delete_account.wrong_password', 'Incorrect password. Please try again.'));
            } else {
                setError(t('delete_account.error_generic', 'Something went wrong. Please try again or contact support.'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={sectionStyles.settingsSection} data-testid="delete-account-settings">
            <h4 className={sectionStyles.sectionTitle}>
                {t('delete_account.section_title', 'Account')}
            </h4>

            {!confirming ? (
                <button
                    className={styles.deleteButton}
                    onClick={handleRequestDelete}
                    data-testid="delete-account-btn"
                >
                    <Trash2 size={14} />
                    {t('delete_account.button', 'Delete my account')}
                </button>
            ) : (
                <div className={styles.confirmationBox} data-testid="delete-account-confirmation">
                    <div className={styles.warningMessage}>
                        <AlertTriangle size={16} className={styles.warningIcon} />
                        <span>{t('delete_account.warning', 'This will permanently delete your account and all associated game data. This action cannot be undone.')}</span>
                    </div>

                    <div className={styles.passwordField}>
                        <label htmlFor="delete-account-password" className={styles.passwordLabel}>
                            {t('delete_account.password_label', 'Confirm with your password')}
                        </label>
                        <input
                            id="delete-account-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('delete_account.password_placeholder', 'Your password')}
                            disabled={loading}
                            className={styles.passwordInput}
                            data-testid="delete-account-password-input"
                        />
                    </div>

                    {error && (
                        <div className={styles.errorMessage} data-testid="delete-account-error">
                            {error}
                        </div>
                    )}

                    <PrimaryButton
                        onClick={handleConfirmDelete}
                        disabled={loading}
                        data-testid="delete-account-confirm-btn"
                        className={styles.confirmButton}
                    >
                        {loading
                            ? <Loader2 size={14} className={styles.spinner} />
                            : t('delete_account.confirm_button', 'Yes, permanently delete my account')}
                    </PrimaryButton>

                    <button
                        className={styles.cancelButton}
                        onClick={handleCancelDelete}
                        disabled={loading}
                        data-testid="delete-account-cancel-btn"
                    >
                        {t('delete_account.cancel_button', 'Cancel')}
                    </button>
                </div>
            )}
        </div>
    );
};
