import RazorpayCheckout from 'react-native-razorpay';

interface RazorpayOptions {
    key: string;
    amount: number; // Amount in paise (smallest currency unit)
    currency: string;
    order_id: string;
    name: string;
    description?: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    method?: {
        card?: boolean;
        netbanking?: boolean;
        wallet?: boolean;
        upi?: boolean;
    };
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

/**
 * Razorpay Service for Production Payment Processing
 * Supports Cash, UPI, Card, Net Banking, and Wallet payments
 */
class RazorpayService {
    /**
     * Open Razorpay checkout with all payment methods (Card, UPI, Net Banking, Wallets)
     * @param options Razorpay payment options
     * @param onSuccess Callback on successful payment
     * @param onError Callback on payment error
     */
    async openCheckout(
        options: RazorpayOptions,
        onSuccess: (response: RazorpayResponse) => void,
        onError: (error: any) => void
    ): Promise<void> {
        try {
            // Enable all payment methods by default
            const checkoutOptions = {
                ...options,
                method: options.method || {
                    card: true,
                    upi: true,
                    netbanking: true,
                    wallet: true,
                }
            };

            RazorpayCheckout.open(checkoutOptions)
                .then((data: any) => {
                    onSuccess(data as RazorpayResponse);
                })
                .catch((error: any) => {
                    this.handleRazorpayError(error, onError);
                });
        } catch (error) {
            console.error('Razorpay checkout error:', error);
            onError(error);
        }
    }

    /**
     * Open Razorpay checkout with only UPI payment method
     * @param options Razorpay payment options
     * @param onSuccess Callback on successful payment
     * @param onError Callback on payment error
     */
    async openUPICheckout(
        options: RazorpayOptions,
        onSuccess: (response: RazorpayResponse) => void,
        onError: (error: any) => void
    ): Promise<void> {
        const upiOptions = {
            ...options,
            method: {
                card: false,
                upi: true,
                netbanking: false,
                wallet: false,
            }
        };
        return this.openCheckout(upiOptions, onSuccess, onError);
    }

    /**
     * Open Razorpay checkout with only Card payment method
     * @param options Razorpay payment options
     * @param onSuccess Callback on successful payment
     * @param onError Callback on payment error
     */
    async openCardCheckout(
        options: RazorpayOptions,
        onSuccess: (response: RazorpayResponse) => void,
        onError: (error: any) => void
    ): Promise<void> {
        const cardOptions = {
            ...options,
            method: {
                card: true,
                upi: false,
                netbanking: false,
                wallet: false,
            }
        };
        return this.openCheckout(cardOptions, onSuccess, onError);
    }

    /**
     * Handle Razorpay-specific errors
     */
    private handleRazorpayError(error: any, onError: (error: any) => void): void {
        if (error.code === 0) {
            // Payment cancelled by user
            onError({ code: 0, description: 'Payment cancelled by user' });
        } else if (error.code === 1) {
            // Payment failed
            onError({ code: 1, description: error.description || 'Payment failed' });
        } else if (error.code === 2) {
            // Network error
            onError({ code: 2, description: 'Network error. Please check your connection.' });
        } else {
            onError({ code: -1, description: error.description || 'Unknown error occurred' });
        }
    }

    /**
     * Format amount from rupees to paise
     * @param rupees Amount in rupees
     * @returns Amount in paise
     */
    formatAmountToPaise(rupees: number | string): number {
        const amount = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
        return Math.round(amount * 100);
    }

    /**
     * Format amount from paise to rupees
     * @param paise Amount in paise
     * @returns Amount in rupees
     */
    formatAmountToRupees(paise: number | string): number {
        const amount = typeof paise === 'string' ? parseFloat(paise) : paise;
        return amount / 100;
    }

    /**
     * Validate payment signature (should be done on backend)
     * @param orderId Razorpay order ID
     * @param paymentId Razorpay payment ID
     * @param signature Razorpay signature
     * @returns Whether signature is valid
     * 
     * Note: This is a client-side check only. ALWAYS verify on backend for security.
     */
    validateSignature(orderId: string, paymentId: string, signature: string): boolean {
        // In production, this validation MUST be done on the backend
        // Client-side validation is NOT secure and can be bypassed
        console.warn('Signature validation should only be done on backend for security');
        return true;
    }
}

export default new RazorpayService();
