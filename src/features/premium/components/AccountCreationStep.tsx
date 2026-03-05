import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../services/supabase.service';
import { validateAccountCreationForm, performAccountConversion } from '../utils/account-creation.utils';

interface AccountCreationStepProps {
    onSuccess: () => void;
}

export const AccountCreationStep: React.FC<AccountCreationStepProps> = ({
    onSuccess
}) => {
    const { t: translation } = useTranslation();
    const { refreshSession } = useAuth();
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validationError = validateAccountCreationForm(email, confirmEmail, password, translation);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const result = await performAccountConversion({
                email,
                password,
                refreshSession,
                translation,
                supabaseClient: supabase
            });

            if (result.success) {
                onSuccess();
            } else if (result.error) {
                setError(result.error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="account-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
        >
            <div className="account-icon">
                <ShieldCheck size={48} />
            </div>

            <h3 className="account-title">{translation('premium.store.account.title')}</h3>
            <p className="account-subtitle">{translation('premium.store.account.subtitle')}</p>

            <form onSubmit={handleSubmit} className="account-form" data-testid="account-creation-form" noValidate>
                <div className="input-group">
                    <label>
                        <Mail size={16} />
                        {translation('premium.store.account.email_label')}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={translation('premium.store.account.email_placeholder')}
                        required
                        disabled={loading}
                        data-testid="email-input"
                    />
                </div>

                <div className="input-group">
                    <label>
                        <Mail size={16} />
                        {translation('premium.store.account.confirm_email_label')}
                    </label>
                    <input
                        type="email"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        placeholder={translation('premium.store.account.email_placeholder')}
                        required
                        disabled={loading}
                        data-testid="confirm-email-input"
                    />
                </div>

                <div className="input-group">
                    <label>
                        <Lock size={16} />
                        {translation('premium.store.account.password_label')}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={translation('premium.store.account.password_placeholder')}
                        required
                        disabled={loading}
                        data-testid="password-input"
                    />
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="form-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            data-testid="form-error"
                        >
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="account-actions single-action">
                    <PrimaryButton
                        type="submit"
                        variant="gold"
                        radiate={true}
                        disabled={loading}
                        data-testid="account-creation-submit"
                    >
                        {loading ? <Loader2 className="spinner" /> : translation('premium.store.account.continue_btn')}
                    </PrimaryButton>
                </div>
            </form>
        </motion.div>
    );
};
