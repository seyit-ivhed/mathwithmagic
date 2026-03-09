import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase.service';
import { useAuth } from '../../context/useAuth';
import sectionStyles from '../../components/settings/SettingsSection.module.css';
import styles from './MarketingPreferencesSettings.module.css';

export const MarketingPreferencesSettings: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [consent, setConsent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        supabase
            .from('player_profiles')
            .select('product_update_consent')
            .eq('id', user.id)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error('Failed to load marketing preferences:', error);
                    return;
                }
                if (data) {
                    setConsent(data.product_update_consent ?? false);
                }
            });
    }, [user?.id]);

    const handleChange = async (checked: boolean) => {
        if (!user?.id) {
            console.error('Cannot update marketing preferences: user ID is missing');
            return;
        }

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        const { error } = await supabase
            .from('player_profiles')
            .upsert({ id: user.id, product_update_consent: checked }, { onConflict: 'id' });

        if (error) {
            console.error('Failed to save marketing preferences:', error);
            setSaveError(t('marketing_preferences.save_error', 'Something went wrong. Please try again.'));
        } else {
            setConsent(checked);
            setSaveSuccess(true);
        }
        setSaving(false);
    };

    return (
        <div className={sectionStyles.settingsSection} data-testid="marketing-preferences-settings">
            <h4 className={sectionStyles.sectionTitle}>
                {t('marketing_preferences.section_title', 'Notifications')}
            </h4>

            <label className={styles.consentLabel} data-testid="marketing-consent-label">
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => handleChange(e.target.checked)}
                    disabled={saving}
                    data-testid="marketing-consent-checkbox"
                />
                <span>{t('marketing_preferences.label', 'Notify me about new adventures and game updates. You can unsubscribe at any time.')}</span>
            </label>

            {saveSuccess && (
                <p className={styles.successMessage} data-testid="marketing-preferences-success">
                    {t('marketing_preferences.save_success', 'Preferences saved.')}
                </p>
            )}

            {saveError && (
                <p className={styles.errorMessage} data-testid="marketing-preferences-error">
                    {saveError}
                </p>
            )}
        </div>
    );
};
