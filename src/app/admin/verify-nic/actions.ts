// This server action is intentionally left blank and is not used.
// The admin view for NIC images now uses public URLs directly from Firestore
// and does not require generating signed URLs.
'use server';

export async function placeholderAction(): Promise<void> {
  // This is a placeholder to keep the file from being empty.
  console.log("This server action is not in use.");
}
