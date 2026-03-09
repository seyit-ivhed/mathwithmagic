import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { supabase } from '../../../services/supabase.service';
import { pollUntil } from '../../../utils/poll-until';
import { analyticsService } from '../../../services/analytics.service';
import './Premium.css';

interface CheckoutFormProps {
    contentPackId: string;
    onSuccess: () => void;
    onCancel: () => void;
    price: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ contentPackId, onSuccess, onCancel, price }) => {
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [paymentSucceeded, setPaymentSucceeded] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [withdrawalConsent, setWithdrawalConsent] = useState(false);

    const verifyEntitlement = async (): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Poll for up to 30 seconds — high latency on edge functions is expected during redeploys
        return pollUntil(
            async () => {
                const { data: entitlement } = await supabase
                    .from('player_entitlements')
                    .select('id')
                    .eq('player_id', user.id)
                    .eq('content_pack_id', contentPackId)
                    .maybeSingle();
                return !!entitlement;
            },
            { intervalMs: 2000, timeoutMs: 30000 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        analyticsService.trackEvent('payment_submitted', {
            content_pack_id: contentPackId,
        });

        try {
            // Get current user email for billing details (required because we hide the email field)
            const { data: { user } } = await supabase.auth.getUser();

            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/premium-success`,
                    payment_method_data: {
                        billing_details: {
                            email: user?.email || '',
                        }
                    }
                },
                redirect: 'if_required',
            });

            if (error) {
                console.error('Stripe confirmPayment error:', error);
                analyticsService.trackEvent('payment_failed');
                setErrorMessage(error.message || t('premium.store.payment_failed'));
                setIsProcessing(false);
            } else if (paymentIntent) {
                if (paymentIntent.status === 'succeeded') {
                    setIsVerifying(true);

                    const verified = await verifyEntitlement();
                    if (verified) {
                        analyticsService.trackEvent('payment_succeeded', {
                            content_pack_id: contentPackId,
                        });
                        onSuccess();
                    } else {
                        analyticsService.trackEvent('payment_verification_timeout');
                        console.warn('Verification timed out, but payment succeeded.');
                        setErrorMessage(t('premium.store.verification_timeout', 'Payment succeeded, but we are still processing your access. It will appear in your account shortly.'));
                        setIsProcessing(false);
                        setIsVerifying(false);
                        setPaymentSucceeded(true);
                    }
                } else {
                    console.warn('Payment intent status is not succeeded:', paymentIntent.status);
                    setIsProcessing(false);
                }
            } else {
                console.warn('No error and no paymentIntent returned from Stripe');
                setIsProcessing(false);
            }
        } catch (err: unknown) {
            console.error('Submission error:', err);
            analyticsService.trackEvent('payment_failed');
            setErrorMessage(t('premium.store.payment_failed'));
            setIsProcessing(false);
            setIsVerifying(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="checkout-form" data-testid="checkout-form">
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="spinner"></div>
                    <div className="processing-text">
                        {isVerifying
                            ? t('premium.store.verifying_access', 'Verifying your new content...')
                            : t('premium.store.processing_payment', 'Securing your adventure...')}
                    </div>
                </div>
            )}

            <PaymentElement options={{
                layout: 'tabs',
                fields: {
                    billingDetails: {
                        email: 'never'
                    },
                },
                wallets: {
                    applePay: 'never',
                    googlePay: 'never',
                    // This is the most direct way to disable Stripe Link in the UI
                    // even if it's technically enabled in the dashboard.
                    link: 'never'
                }
            }} />

            {errorMessage && <div className="payment-error" data-testid="payment-error">{errorMessage}</div>}

            <div className="checkout-actions">
                <p className="stripe-disclosure">
                    {t('checkout.stripe_disclosure', 'Payment is processed securely by Stripe. Outlean AB does not store your payment details.')}
                </p>

                <label className="withdrawal-waiver" data-testid="withdrawal-waiver-label">
                    <input
                        type="checkbox"
                        checked={withdrawalConsent}
                        onChange={(e) => setWithdrawalConsent(e.target.checked)}
                        disabled={isProcessing}
                        data-testid="withdrawal-consent-checkbox"
                    />
                    <span>
                        {t('checkout.withdrawal_waiver', 'I understand that by accessing the purchased content immediately, I waive my 14-day right of withdrawal under EU consumer law.')}
                    </span>
                </label>

                <div className="price-display-simple">
                    {t('premium.store.total_amount', 'Total Amount')}: <span className="price-value">{price}</span>
                </div>
                <PrimaryButton
                    type="submit"
                    variant="gold"
                    radiate={true}
                    disabled={isProcessing || !stripe || !elements || paymentSucceeded || !withdrawalConsent}
                    style={{ width: '100%' }}
                    data-testid="checkout-submit"
                >
                    {isProcessing ? t('common.processing', 'Processing...') : t('premium.store.buy_now')}
                </PrimaryButton>
                <button
                    type="button"
                    className="cancel-button-link"
                    onClick={onCancel}
                    disabled={isProcessing}
                >
                    {t('common.cancel', 'Cancel')}
                </button>
            </div>
        </form>
    );
};
