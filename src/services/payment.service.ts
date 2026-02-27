import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase.service';

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
     * @returns The client secret to initialize Stripe Elements or an alreadyOwned status.
     */
    static async createPaymentIntent(contentPackId: string): Promise<{ clientSecret?: string, alreadyOwned?: boolean }> {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
            body: { contentPackId },
        });

        if (error) {
            console.error('Error invoking create-payment-intent:', error);
            throw error;
        }

        return data;
    }
}
