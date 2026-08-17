import { PaymentProviderType } from './types';

export interface PaymentIntentPayload {
  paymentReference: string;
  amount: number;
  currency: string;
  clientEmail: string;
  clientName: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationResult {
  providerTransactionId: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
  amount: number;
  currency: string;
  paidAt: Date;
  rawPayload?: any;
}

export interface PaymentProvider {
  type: PaymentProviderType;
  createPaymentIntent(payload: PaymentIntentPayload): Promise<{ checkoutUrl?: string; reference: string }>;
  verifyPayment(providerTransactionIdOrRef: string): Promise<PaymentVerificationResult>;
  refundPayment(providerTransactionId: string, amount: number): Promise<{ success: boolean; refundTransactionId: string }>;
}

export class ManualPaymentProvider implements PaymentProvider {
  type: PaymentProviderType = 'MANUAL';

  async createPaymentIntent(payload: PaymentIntentPayload) {
    return { reference: payload.paymentReference };
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    return {
      providerTransactionId: `MANUAL_TXN_${reference}`,
      status: 'SUCCEEDED',
      amount: 0,
      currency: 'NGN',
      paidAt: new Date(),
    };
  }

  async refundPayment(providerTransactionId: string, amount: number) {
    return { success: true, refundTransactionId: `REFUND_${providerTransactionId}` };
  }
}

export class MockPaymentProvider implements PaymentProvider {
  type: PaymentProviderType = 'MOCK';

  async createPaymentIntent(payload: PaymentIntentPayload) {
    return {
      checkoutUrl: `https://checkout.mockpayment.internal/pay/${payload.paymentReference}`,
      reference: payload.paymentReference,
    };
  }

  async verifyPayment(providerTransactionId: string): Promise<PaymentVerificationResult> {
    return {
      providerTransactionId,
      status: 'SUCCEEDED',
      amount: 100000,
      currency: 'NGN',
      paidAt: new Date(),
    };
  }

  async refundPayment(providerTransactionId: string, amount: number) {
    return { success: true, refundTransactionId: `MOCK_REFUND_${providerTransactionId}` };
  }
}

export function getPaymentProvider(type: PaymentProviderType = 'MANUAL'): PaymentProvider {
  if (type === 'MOCK') return new MockPaymentProvider();
  return new ManualPaymentProvider();
}
