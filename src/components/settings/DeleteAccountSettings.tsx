import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import { analyticsService } from '../../services/analytics.service';
import { clearAppStorage } from '../../utils/app-storage';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { PrimaryButton } from '../ui/PrimaryButton';
import sectionStyles from './SettingsSection.module.css';
import styles from './DeleteAccountSettings.module.css';

const CONFIRM_DELAY_SECONDS = 5;

export const DeleteAccountSettings: React.FC = () => {
    const { t } = useTranslation();
    const { deleteAccount } = useAuth();

    const [confirming, setConfirming] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startCountdown = () => {
        setCountdown(CONFIRM_DELAY_SECONDS);
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleRequestDelete = () => {
        setConfirming(true);
        setAcknowledged(false);
        setPassword('');
        setError(null);
        setCountdown(0);
    };

    const handleAcknowledge = (checked: boolean) => {
        setAcknowledged(checked);
        if (checked) {
            startCountdown();
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setCountdown(0);
        }
    };

    const handleCancelDelete = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setConfirming(false);
        setAcknowledged(false);
        setPassword('');
        setError(null);
        setCountdown(0);
    };

    const handleConfirmDelete = async () => {
        if (!password) {
            setError(t('delete_account.password_required', 'Please enter your password to confirm.'));
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await analyticsService.trackEvent('account_deletion_triggered');
            await deleteAccount(password);
            clearAppStorage();
            window.location.href = '/farewell';
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
                        <div>
                            <p className={styles.warningTitle}>
                                {t('delete_account.warning_title', 'This action is permanent and cannot be undone.')}
                            </p>
                            <ul className={styles.warningList}>
                                <li>{t('delete_account.warning_premium', 'Any premium content you have purchased will not be recoverable.')}</li>
                                <li>{t('delete_account.warning_account', 'Your account and login credentials will be permanently removed.')}</li>
                                <li>{t('delete_account.warning_progress', 'All your game progress will be lost forever.')}</li>
                            </ul>
                        </div>
                    </div>

                    <label className={styles.acknowledgeLabel} data-testid="delete-account-acknowledge">
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            onChange={(e) => handleAcknowledge(e.target.checked)}
                            disabled={loading}
                            className={styles.acknowledgeCheckbox}
                        />
                        <span>{t('delete_account.acknowledge', 'I understand the consequences and want to proceed')}</span>
                    </label>

                    {acknowledged && (
                        <>
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
                                disabled={loading || countdown > 0}
                                data-testid="delete-account-confirm-btn"
                                className={styles.confirmButton}
                            >
                                {loading
                                    ? <Loader2 size={14} className={styles.spinner} />
                                    : countdown > 0
                                        ? t('delete_account.confirm_button_wait', 'Wait {{seconds}}s...', { seconds: countdown })
                                        : t('delete_account.confirm_button', 'Yes, permanently delete my account')}
                            </PrimaryButton>
                        </>
                    )}

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
