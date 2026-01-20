declare module 'react-native-razorpay' {
    export interface RazorpayOptions {
        key: string;
        amount: number;
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

    export interface RazorpayResponse {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }

    export default class RazorpayCheckout {
        static open(options: RazorpayOptions): Promise<RazorpayResponse>;
        static PAYMENT_CANCELLED: number;
        static NETWORK_ERROR: number;
    }
}
