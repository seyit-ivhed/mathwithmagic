import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/useAuth';
import { AccountCreationStep } from './AccountCreationStep';
import { CheckoutOverlay } from './CheckoutOverlay';
import { CheckoutMusic } from './CheckoutMusic';
import { FormCloseButton } from '../../../components/ui/FormCloseButton';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { CheckCircle2 } from 'lucide-react';
import { analyticsService } from '../../../services/analytics.service';
import { LegalModal, type LegalDocumentType } from '../../legal/LegalModal';
import styles from './CheckoutPage.module.css';

export const CheckoutPage: React.FC = () => {
    // NOTE: This page is intentionally isolated from the main SPA routing to prevent
    // Stripe cookies/scripts from persisting in the main game application.
    // We use window.location.href instead of useNavigate to ensure a clean environment context.

    const { t } = useTranslation();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [showSuccess, setShowSuccess] = useState(false);
    const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);
    const [checkoutKey, setCheckoutKey] = useState(0);

    const isAnonymous = !isAuthenticated;
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

    const handleRestart = () => {
        // Remount CheckoutOverlay to re-run create-payment-intent,
        // which will detect the existing successful Stripe payment and self-heal.
        setCheckoutKey(prev => prev + 1);
    };

    if (authLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>{t('common.loading', 'Loading...')}</p>
            </div>
        );
    }

    return (
        <>
            <div className={styles.container}>
                <CheckoutMusic />
                <FormCloseButton onClick={handleBackToGame} className={styles.closeButton} />

                <main className={styles.main}>
                    {showSuccess ? (
                        <div className={styles.successScreen} data-testid="success-screen">
                            <div className={styles.successIconContainer}>
                                <CheckCircle2 size={80} />
                            </div>
                            <h2 className={styles.successTitle}>{t('premium.store.success_title')}</h2>
                            <p className={styles.successDescription}>
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
                        <div className={styles.accountCreationContainer}>
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
                        <div className={styles.premiumCheckout}>

                            <CheckoutOverlay
                                key={checkoutKey}
                                contentPackId="premium_base"
                                onSuccess={handleSuccess}
                                onCancel={handleBackToGame}
                                onRestart={handleRestart}
                                price={t('premium.store.price', '59 SEK')}
                            />
                        </div>
                    )}
                </main>

                <footer className={styles.legalFooter}>
                    <button
                        className={styles.legalLink}
                        onClick={() => setLegalModal('privacy')}
                        data-testid="checkout-privacy-link"
                    >
                        {t('legal.privacy_policy', 'Privacy Policy')}
                    </button>
                    <span className={styles.legalSep}>|</span>
                    <button
                        className={styles.legalLink}
                        onClick={() => setLegalModal('terms')}
                        data-testid="checkout-terms-link"
                    >
                        {t('legal.terms_of_service', 'Terms of Service')}
                    </button>
                </footer>
            </div>

            {legalModal && (
                <LegalModal type={legalModal} onClose={() => setLegalModal(null)} onOpenPrivacy={() => setLegalModal('privacy')} />
            )}
        </>
    );
};
