
import type { Timestamp } from 'firebase/firestore';

export interface SpecialOffer {
  id: string;
  country: string;
  weightDescription: string; // e.g., "Up to 25kg"
  rate: number;
  imageUrl: string;
  imagePath: string; // To delete from storage
  enabled: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
