# Payment Provider Abstraction Layer

## 1. Gateway Decoupling Architecture
Payment processing is decoupled behind the `PaymentProvider` interface:

```typescript
export interface PaymentProvider {
  type: PaymentProviderType;
  createPaymentIntent(payload: PaymentIntentPayload): Promise<{ checkoutUrl?: string; reference: string }>;
  verifyPayment(providerTransactionIdOrRef: string): Promise<PaymentVerificationResult>;
  refundPayment(providerTransactionId: string, amount: number): Promise<{ success: boolean; refundTransactionId: string }>;
}
```

## 2. Provider Implementations
- **ManualPaymentProvider**: Default provider for manual bank transfers, cash payments, or direct bank deposits (`type: "MANUAL"`).
- **MockPaymentProvider**: Testing provider returning simulated checkout URLs and verification payloads (`type: "MOCK"`).

Future external payment gateways (Flutterwave, Paystack, Stripe) can be integrated by implementing `PaymentProvider` without modifying core billing domain logic or financial ledger posting flows.
