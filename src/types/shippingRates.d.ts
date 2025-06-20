
import type { Timestamp } from 'firebase/firestore';

export interface CountryRate {
  id: string; // Firestore document ID
  name: string;
  createdAt: Timestamp;
}

export interface WeightRate {
  id: string; // Firestore document ID for this weight entry in subcollection
  weightLabel: string; // e.g., "0.5 kg", "1 kg - 2 kg", "Up to 5kg" (display label)
  weightValue: number; // e.g., 0.5, 1, 5 (numeric value for sorting, typically kg)
  economyPrice: number | null; 
  expressPrice: number | null; 
  isEconomyEnabled: boolean;
  isExpressEnabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

