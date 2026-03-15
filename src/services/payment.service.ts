import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase.service';

export function formatDisplayPrice(amountCents: number, currency: string): string {
    return `${amountCents / 100} ${currency}`;
}

/**
 * Service to handle Stripe payment interactions and Edge Function calls.
 */
export class PaymentService {
    private static stripePromise: Promise<Stripe | null> | null = null;

    /**
     * Get or initialize the Stripe instance.
     * Uses the VITE_STRIPE_PUBLISHABLE_KEY from environment variables.
     */
    static getStripe() {
        if (!this.stripePromise) {
            const publicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
            if (!publicKey) {
                console.warn('VITE_STRIPE_PUBLISHABLE_KEY is not defined in .env');
            }
            this.stripePromise = loadStripe(publicKey || '');
        }
        return this.stripePromise;
    }

    /**
     * Create a Payment Intent via Supabase Edge Function.
     * @param contentPackId The ID of the content pack to purchase (e.g., 'premium_base')
     * @returns The client secret to initialize Stripe Elements, an alreadyOwned status, and the display price.
     */
    static async createPaymentIntent(contentPackId: string): Promise<{ clientSecret?: string, alreadyOwned?: boolean, displayPrice?: string }> {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
            body: { contentPackId },
        });

        if (error) {
            console.error('Error invoking create-payment-intent:', error);
            throw error;
        }

        return data;
    }

    /**
     * Fetch the current display price for a content pack directly from the database.
     * @param contentPackId The ID of the content pack (e.g., 'premium_base')
     * @returns Formatted price string (e.g., '59 SEK') or null if not found.
     */
    static async getContentPackPrice(contentPackId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('content_pack_prices')
            .select('amount_cents, currency')
            .eq('content_pack_id', contentPackId)
            .eq('currency', 'SEK')
            .single();

        if (error || !data) {
            console.error('Error fetching content pack price:', error);
            return null;
        }

        return formatDisplayPrice(data.amount_cents, data.currency);
    }

    /**
     * Verify a payment server-side by checking Stripe directly.
     * Used as a fallback when the webhook has not yet processed a successful payment.
     * If Stripe confirms the payment succeeded, the server grants the entitlement immediately.
     * @param contentPackId The ID of the content pack to verify (e.g., 'premium_base')
     * @returns verified: true if entitlement was granted, false with status if still pending.
     */
    static async verifyPayment(contentPackId: string): Promise<{ verified: boolean; status?: string }> {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { contentPackId },
        });

        if (error) {
            console.error('Error invoking verify-payment:', error);
            throw error;
        }

        return data;
    }
}
