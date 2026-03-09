import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { useAuth } from '../../../context/useAuth';
import { supabase } from '../../../services/supabase.service';
import { validateAccountCreationForm, performAccountConversion } from '../utils/account-creation.utils';
import { analyticsService } from '../../../services/analytics.service';
import { ConsentCheckboxes } from './ConsentCheckboxes';
import type { LegalDocumentType } from '../../legal/LegalModal';

interface AccountCreationStepProps {
    onSuccess: () => void;
}

export const AccountCreationStep: React.FC<AccountCreationStepProps> = ({
    onSuccess
}) => {
    const { t: translation } = useTranslation();
    const { refreshSession, signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'create' | 'signin'>('create');
    const [showSignInLink, setShowSignInLink] = useState(false);

    // Consent checkboxes (create mode only)
    const [ageConsent, setAgeConsent] = useState(false);
    const [termsConsent, setTermsConsent] = useState(false);
    const [productUpdates, setProductUpdates] = useState(false);
    const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);

    const isCreateSubmitEnabled = mode === 'create'
        ? ageConsent && termsConsent && !loading
        : !loading;

    const hasTrackedViewRef = useRef(false);
    useEffect(() => {
        if (hasTrackedViewRef.current) return;
        hasTrackedViewRef.current = true;
        analyticsService.trackEvent('account_creation_viewed');
    }, []);


    const switchToSignIn = () => {
        setMode('signin');
        setError(null);
        setShowSignInLink(false);
        setConfirmEmail('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'signin') {
            if (!email || !email.includes('@')) {
                setError(translation('premium.store.account.errors.invalid_email'));
                return;
            }
            if (!password) {
                setError(translation('premium.store.account.errors.password_required'));
                return;
            }

            setLoading(true);
            try {
                await signIn(email, password);
                analyticsService.trackEvent('account_signed_in');
                onSuccess();
            } catch {
                analyticsService.trackEvent('sign_in_failed');
                setError(translation('premium.store.account.errors.sign_in_failed'));
            } finally {
                setLoading(false);
            }
            return;
        }

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
                productUpdateConsent: productUpdates,
                refreshSession,
                translation,
                supabaseClient: supabase
            });

            if (result.success) {
                analyticsService.trackEvent('account_created');
                onSuccess();
            } else if (result.error) {
                analyticsService.trackEvent('account_creation_failed');
                setShowSignInLink(!!result.emailAlreadyExists);
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

                <h3 className="account-title">
                    {mode === 'signin'
                        ? translation('premium.store.account.sign_in_title')
                        : translation('premium.store.account.title')}
                </h3>
                <p className="account-subtitle">
                    {mode === 'signin'
                        ? translation('premium.store.account.sign_in_subtitle')
                        : translation('premium.store.account.subtitle')}
                </p>

                <form onSubmit={handleSubmit} className="account-form" data-testid="account-creation-form" noValidate>
                    <div className="input-group">
                        <label htmlFor="account-email">
                            <Mail size={16} />
                            {translation('premium.store.account.email_label')}
                        </label>
                        <input
                            id="account-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={translation('premium.store.account.email_placeholder')}
                            required
                            disabled={loading}
                            data-testid="email-input"
                        />
                    </div>

                    {mode === 'create' && (
                        <div className="input-group">
                            <label htmlFor="account-confirm-email">
                                <Mail size={16} />
                                {translation('premium.store.account.confirm_email_label')}
                            </label>
                            <input
                                id="account-confirm-email"
                                type="email"
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                                placeholder={translation('premium.store.account.email_placeholder')}
                                required
                                disabled={loading}
                                data-testid="confirm-email-input"
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="account-password">
                            <Lock size={16} />
                            {translation('premium.store.account.password_label')}
                        </label>
                        <input
                            id="account-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={translation('premium.store.account.password_placeholder')}
                            required
                            disabled={loading}
                            data-testid="password-input"
                        />
                    </div>

                    {mode === 'create' && (
                        <ConsentCheckboxes
                            ageConsent={ageConsent}
                            termsConsent={termsConsent}
                            productUpdates={productUpdates}
                            disabled={loading}
                            onAgeConsentChange={setAgeConsent}
                            onTermsConsentChange={setTermsConsent}
                            onProductUpdatesChange={setProductUpdates}
                            legalModal={legalModal}
                            onOpenLegalModal={setLegalModal}
                            onCloseLegalModal={() => setLegalModal(null)}
                        />
                    )}

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
                                {mode === 'create' && showSignInLink && (
                                    <button
                                        type="button"
                                        className="sign-in-link"
                                        onClick={switchToSignIn}
                                        data-testid="switch-to-signin"
                                        aria-label={translation('premium.store.account.sign_in_instead_aria')}
                                    >
                                        {translation('premium.store.account.sign_in_instead')}
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="account-actions single-action">
                        <PrimaryButton
                            type="submit"
                            variant="gold"
                            radiate={true}
                            disabled={!isCreateSubmitEnabled}
                            data-testid="account-creation-submit"
                        >
                            {loading
                                ? <Loader2 className="spinner" />
                                : mode === 'signin'
                                    ? translation('premium.store.account.sign_in_btn')
                                    : translation('premium.store.account.continue_btn')}
                        </PrimaryButton>
                    </div>
                </form>
            </motion.div>
        );
};
