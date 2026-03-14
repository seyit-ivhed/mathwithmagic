import React, { useEffect, useState, useRef } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentService } from '../../../services/payment.service';
import { CheckoutForm } from './CheckoutForm';
import { FormCloseButton } from '../../../components/ui/FormCloseButton';
import { useTranslation } from 'react-i18next';
import styles from './CheckoutOverlay.module.css';

interface CheckoutOverlayProps {
    contentPackId: string;
    onSuccess: () => void;
    onCancel: () => void;
    onRestart: () => void;
    price: string;
}

export const CheckoutOverlay: React.FC<CheckoutOverlayProps> = ({
    contentPackId,
    onSuccess,
    onCancel,
    onRestart,
    price
}) => {
    const { t } = useTranslation();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const lastFetchedIdRef = useRef<string | null>(null);
    const stripePromise = PaymentService.getStripe();

    useEffect(() => {
        // Prevent duplicate fetches for the same content pack
        // This is especially important in React 18 StrictMode (Dev) which runs effects twice
        if (lastFetchedIdRef.current === contentPackId) return;

        lastFetchedIdRef.current = contentPackId;
        PaymentService.createPaymentIntent(contentPackId)
            .then(data => {
                if (data.alreadyOwned) {
                    onSuccess();
                    return;
                }
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    throw new Error('No client secret returned');
                }
            })
            .catch(err => {
                console.error('Failed to create payment intent:', err);
                lastFetchedIdRef.current = null; // Reset on error to allow retry
                setError(t('premium.store.error_loading_payment', 'Failed to initialize payment. Please try again.'));
            });
    }, [contentPackId, onSuccess, t]);

    if (error) {
        return (
            <div className={styles.errorState} data-testid="checkout-error-state">
                <p>{error}</p>
                <button onClick={onCancel}>{t('common.back', 'Back')}</button>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>{t('premium.store.loading_payment', 'Securing payment portal...')}</p>
            </div>
        );
    }

    // Stripe Elements render in an iframe and cannot access CSS variables directly.
    // We read the variable from the root here to bridge it into the Stripe options.
    const brandAccent = typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--color-brand-accent').trim() || '#ffa502'
        : '#ffa502';

    const options = {
        clientSecret,
        appearance: {
            theme: 'night' as const,
            variables: {
                colorPrimary: brandAccent,
                colorBackground: '#000000',
                colorText: '#ffffff',
                colorTextSecondary: '#e2e8f0',
                colorDanger: '#ff4757',
                fontFamily: 'Fredoka, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '12px',
            },
            rules: {
                '.Input': {
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${brandAccent}33`, // Adding 20% opacity (33 hex)
                },
                '.Input:focus': {
                    border: `1px solid ${brandAccent}`,
                    boxShadow: `0 0 15px ${brandAccent}33`,
                },
                '.Tab': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${brandAccent}33`,
                    color: '#e2e8f0',
                },
                '.Tab:hover': {
                    border: `1px solid ${brandAccent}`,
                    backgroundColor: `${brandAccent}14`, // 8% opacity
                    color: '#ffffff',
                },
                '.Tab--selected': {
                    backgroundColor: `${brandAccent}26`, // 15% opacity
                    borderColor: brandAccent,
                    color: '#ffffff',
                    borderWidth: '2px',
                    boxShadow: `0 0 10px ${brandAccent}1a`, // 10% opacity
                },
                '.TabLabel--selected': {
                    color: '#ffffff',
                    fontWeight: '600',
                },
                '.TabIcon': {
                    fill: '#e2e8f0',
                },
                '.TabIcon--selected': {
                    fill: brandAccent,
                }
            }
        },
    };

    return (
        <div className={styles.container} data-testid="checkout-overlay">
            <FormCloseButton onClick={onCancel} />
            <Elements key={clientSecret} stripe={stripePromise} options={options}>
                <CheckoutForm contentPackId={contentPackId} onSuccess={onSuccess} onCancel={onCancel} onRestart={onRestart} price={price} />
            </Elements>
        </div>
    );
};
