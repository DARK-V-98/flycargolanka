
import type { Timestamp } from 'firebase/firestore';

export type RateType = 'document' | 'non-document'; // This can still be used by the calculator form

export interface CountryRate {
  id: string; // Firestore document ID
  name: string;
  // 'type' field is removed from CountryRate
  createdAt: Timestamp;
}

export interface WeightRate {
  id: string; // Firestore document ID for this weight entry in subcollection
  weightLabel: string; // e.g., "0.5 kg", "1 kg - 2 kg", "Up to 5kg" (display label)
  weightValue: number; // e.g., 0.5, 1, 5 (numeric value for sorting, typically kg)

  // Non-Document Rates
  ndEconomyPrice?: number | null;
  ndExpressPrice?: number | null;
  isNdEconomyEnabled?: boolean;
  isNdExpressEnabled?: boolean;

  // Document Rates
  docEconomyPrice?: number | null;
  docExpressPrice?: number | null;
  isDocEconomyEnabled?: boolean;
  isDocExpressEnabled?: boolean;

  createdAt?: Timestamp; // Made optional as older entries might not have it
  updatedAt?: Timestamp; // Made optional
}
