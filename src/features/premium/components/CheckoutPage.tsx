import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';
import { AccountCreationStep } from './AccountCreationStep';
import { CheckoutOverlay } from './CheckoutOverlay';
import { CheckoutMusic } from './CheckoutMusic';
import { FormCloseButton } from '../../../components/ui/FormCloseButton';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { CheckCircle2 } from 'lucide-react';
import { analyticsService } from '../../../services/analytics.service';
import { LegalModal, type LegalDocumentType } from '../../legal/LegalModal';
import './Premium.css';

export const CheckoutPage: React.FC = () => {
    // NOTE: This page is intentionally isolated from the main SPA routing to prevent 
    // Stripe cookies/scripts from persisting in the main game application.
    // We use window.location.href instead of useNavigate to ensure a clean environment context.

    const { t } = useTranslation();
    const { user, loading: authLoading } = useAuth();
    const [showSuccess, setShowSuccess] = useState(false);
    const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);

    const isAnonymous = user?.is_anonymous ?? true;
    const checkoutViewedFired = useRef(false);

    useEffect(() => {
        if (!authLoading && !isAnonymous && !checkoutViewedFired.current) {
            checkoutViewedFired.current = true;
            analyticsService.trackEvent('checkout_viewed');
        }
    }, [authLoading, isAnonymous]);

    const handleBackToGame = () => {
        window.location.href = '/';
    };

    const handleSuccess = () => {
        setShowSuccess(true);
    };

    if (authLoading) {
        return (
            <div className="checkout-page-loading">
                <div className="spinner"></div>
                <p>{t('common.loading', 'Loading...')}</p>
            </div>
        );
    }

    return (
        <>
            <div className="checkout-page-container">
                <CheckoutMusic />
                <FormCloseButton onClick={handleBackToGame} />

                <main className="checkout-main">
                    {showSuccess ? (
                        <div className="success-screen" data-testid="success-screen">
                            <div className="success-icon-container">
                                <CheckCircle2 size={80} />
                            </div>
                            <h2 className="premium-title">{t('premium.store.success_title')}</h2>
                            <p className="success-description">
                                {t('premium.store.success_message')}
                            </p>
                            <PrimaryButton
                                variant="gold"
                                radiate={true}
                                onClick={handleBackToGame}
                                style={{ marginTop: '2rem' }}
                            >
                                {t('adventure.back', 'Back to Journey')}
                            </PrimaryButton>
                        </div>
                    ) : isAnonymous ? (
                        <div className="account-creation-container">
                            <AccountCreationStep
                                onSuccess={() => {
                                    // Fire checkout_viewed here to guarantee it comes after
                                    // account_created. Guard with the ref because the auth-state
                                    // change (isAnonymous → false) can fire the useEffect above
                                    // before performAccountConversion resolves, causing both paths
                                    // to fire otherwise.
                                    if (!checkoutViewedFired.current) {
                                        checkoutViewedFired.current = true;
                                        analyticsService.trackEvent('checkout_viewed');
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="premium-checkout">

                            <CheckoutOverlay
                                contentPackId="premium_base"
                                onSuccess={handleSuccess}
                                onCancel={handleBackToGame}
                                price={t('premium.store.price', '59 SEK')}
                            />
                        </div>
                    )}
                </main>

                <footer className="checkout-legal-footer">
                    <button
                        className="checkout-legal-link"
                        onClick={() => setLegalModal('privacy')}
                        data-testid="checkout-privacy-link"
                    >
                        {t('legal.privacy_policy', 'Privacy Policy')}
                    </button>
                    <span className="checkout-legal-sep">|</span>
                    <button
                        className="checkout-legal-link"
                        onClick={() => setLegalModal('terms')}
                        data-testid="checkout-terms-link"
                    >
                        {t('legal.terms_of_service', 'Terms of Service')}
                    </button>
                </footer>
            </div>

            {legalModal && (
                <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
            )}
        </>
    );
};
