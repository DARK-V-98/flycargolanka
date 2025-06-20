
import type { Timestamp } from 'firebase/firestore';

export interface CountryRate {
  id: string; // Firestore document ID
  name: string;
  createdAt: Timestamp;
}

export interface WeightRate {
  id: string; // Firestore document ID for this weight entry in subcollection
  weightValue: number; // e.g., 0.5, 1, 2 (numeric value, typically in kg)
  weightLabel: string; // e.g., "0.5 kg", "1 kg", "2 kg" (display label)
  economyPrice?: number | null; // Optional price
  expressPrice?: number | null; // Optional price
  isEconomyEnabled: boolean;
  isExpressEnabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
